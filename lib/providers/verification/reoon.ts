/**
 * Reoon Email Verification Provider
 *
 * Uses Reoon's API to verify email deliverability.
 * API docs: https://www.reoon.com/articles/api-documentation-of-reoon-email-verifier/
 *
 * Endpoints:
 *   Single: GET /api/v1/verify?email=&key=&mode=
 *   Bulk create: POST /api/v1/create-bulk-verification-task/
 *   Bulk result: GET /api/v1/get-result-bulk-verification-task/?key=&task_id=
 *   Balance: GET /api/v1/check-account-balance/?key=
 *
 * Constraints:
 *   - Single endpoint: max 5 concurrent threads
 *   - Bulk endpoint: up to 50,000 emails per task, power mode only
 */

import { logger } from '@/lib/logger';
import type {
  EmailVerificationProvider,
  EmailVerificationResult,
  BatchVerificationResult,
  VerificationBalance,
  VerificationOptions,
  VerificationStatus,
} from './types';

const BASE_URL = 'https://emailverifier.reoon.com/api/v1';
const BULK_POLL_INTERVAL_MS = 3000;
const BULK_MAX_POLL_ATTEMPTS = 200; // ~10 minutes at 3s intervals
const SINGLE_CONCURRENCY = 5; // Reoon's max concurrent threads for single API

const log = logger.child({ context: 'reoon-verification' });

/**
 * Map Reoon's status strings to our normalized VerificationStatus
 */
function mapStatus(reoonStatus: string, mode: 'quick' | 'power'): VerificationStatus {
  if (mode === 'quick') {
    // Quick mode returns: valid, invalid, disposable, spamtrap
    switch (reoonStatus) {
      case 'valid': return 'valid';
      case 'invalid': return 'invalid';
      case 'disposable': return 'disposable';
      case 'spamtrap': return 'spamtrap';
      default: return 'unknown';
    }
  }

  // Power mode returns: safe, invalid, disabled, disposable,
  // inbox_full, catch_all, role_account, spamtrap, unknown
  switch (reoonStatus) {
    case 'safe': return 'safe';
    case 'invalid': return 'invalid';
    case 'disabled': return 'disabled';
    case 'disposable': return 'disposable';
    case 'inbox_full': return 'inbox_full';
    case 'catch_all': return 'catch_all';
    case 'role_account': return 'role_account';
    case 'spamtrap': return 'spamtrap';
    case 'unknown': return 'unknown';
    default: return 'unknown';
  }
}

/**
 * Determine if an email is safe to send based on status
 */
function isSafeToSend(status: VerificationStatus): boolean {
  return status === 'safe' || status === 'valid';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformSingleResult(data: any, mode: 'quick' | 'power'): EmailVerificationResult {
  const status = mapStatus(data.status, mode);

  return {
    email: data.email,
    status,
    isSafeToSend: mode === 'power'
      ? Boolean(data.is_safe_to_send)
      : isSafeToSend(status),
    score: data.overall_score ?? undefined,
    isValidSyntax: Boolean(data.is_valid_syntax),
    isDisposable: Boolean(data.is_disposable),
    isRoleAccount: Boolean(data.is_role_account),
    isFreeEmail: Boolean(data.is_free_email),
    isSpamtrap: Boolean(data.is_spamtrap),
    isCatchAll: Boolean(data.is_catch_all),
    mxAcceptsMail: Boolean(data.mx_accepts_mail),
    verifiedAt: new Date().toISOString(),
    mode,
    source: 'reoon',
  };
}

export class ReoonVerificationProvider implements EmailVerificationProvider {
  readonly id = 'reoon';
  readonly name = 'Reoon Email Verifier';

  private getApiKey(): string {
    const key = process.env.REOON_API_KEY;
    if (!key) {
      throw new Error('REOON_API_KEY environment variable is not set');
    }
    return key;
  }

  async verifyEmail(
    email: string,
    options?: VerificationOptions
  ): Promise<EmailVerificationResult> {
    const mode = options?.mode ?? 'power';
    const key = this.getApiKey();

    log.info(`Verifying email: ${email} (mode: ${mode})`);

    const url = `${BASE_URL}/verify?email=${encodeURIComponent(email)}&key=${encodeURIComponent(key)}&mode=${mode}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Reoon API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status === 'error') {
      throw new Error(`Reoon verification error: ${data.reason || 'Unknown error'}`);
    }

    log.info(`Verified ${email}: ${data.status}`);
    return transformSingleResult(data, mode);
  }

  async verifyEmails(
    emails: string[],
    options?: VerificationOptions
  ): Promise<BatchVerificationResult> {
    const startTime = Date.now();

    if (emails.length === 0) {
      return {
        results: [],
        totalVerified: 0,
        safeCount: 0,
        unsafeCount: 0,
        duration: 0,
      };
    }

    // For small batches (≤5), use single API for faster results
    if (emails.length <= SINGLE_CONCURRENCY) {
      return this.verifyEmailsConcurrent(emails, options, startTime);
    }

    // For larger batches, use bulk API (always power mode)
    return this.verifyEmailsBulk(emails, startTime);
  }

  private async verifyEmailsConcurrent(
    emails: string[],
    options: VerificationOptions | undefined,
    startTime: number
  ): Promise<BatchVerificationResult> {
    log.info(`Verifying ${emails.length} emails via single API (concurrent)`);

    const results = await Promise.all(
      emails.map((email) => this.verifyEmail(email, options))
    );

    const safeCount = results.filter((r) => r.isSafeToSend).length;

    return {
      results,
      totalVerified: results.length,
      safeCount,
      unsafeCount: results.length - safeCount,
      duration: Date.now() - startTime,
    };
  }

  private async verifyEmailsBulk(
    emails: string[],
    startTime: number
  ): Promise<BatchVerificationResult> {
    const key = this.getApiKey();

    log.info(`Creating bulk verification task for ${emails.length} emails`);

    // Step 1: Create bulk task
    const createResponse = await fetch(`${BASE_URL}/create-bulk-verification-task/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `batch-${Date.now()}`,
        emails,
        key,
      }),
    });

    if (!createResponse.ok) {
      throw new Error(`Reoon bulk API error: ${createResponse.status} ${createResponse.statusText}`);
    }

    const createData = await createResponse.json();

    if (createData.status === 'error') {
      throw new Error(`Reoon bulk task creation failed: ${createData.reason || 'Unknown error'}`);
    }

    const taskId = createData.task_id;
    log.info(`Bulk task created: ${taskId} (${createData.count_processing} emails processing)`);

    // Step 2: Poll for results
    const results = await this.pollBulkResults(taskId, key);

    const safeCount = results.filter((r) => r.isSafeToSend).length;

    return {
      results,
      totalVerified: results.length,
      safeCount,
      unsafeCount: results.length - safeCount,
      duration: Date.now() - startTime,
    };
  }

  private async pollBulkResults(
    taskId: number,
    key: string
  ): Promise<EmailVerificationResult[]> {
    for (let attempt = 0; attempt < BULK_MAX_POLL_ATTEMPTS; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, BULK_POLL_INTERVAL_MS));

      const url = `${BASE_URL}/get-result-bulk-verification-task/?key=${encodeURIComponent(key)}&task_id=${taskId}`;
      const response = await fetch(url);

      if (!response.ok) {
        log.warn(`Bulk poll attempt ${attempt + 1} failed: ${response.status}`);
        continue;
      }

      const data = await response.json();

      if (data.status === 'completed') {
        log.info(`Bulk task ${taskId} completed: ${data.count_checked}/${data.count_total}`);
        return this.transformBulkResults(data.results);
      }

      if (data.status === 'file_not_found' || data.status === 'file_loading_error') {
        throw new Error(`Reoon bulk task failed: ${data.status}`);
      }

      // Still running — log progress
      if (attempt % 10 === 0) {
        log.info(`Bulk task ${taskId}: ${data.progress_percentage ?? 0}% complete`);
      }
    }

    throw new Error(`Reoon bulk task ${taskId} timed out after ${BULK_MAX_POLL_ATTEMPTS} attempts`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private transformBulkResults(results: Record<string, any>): EmailVerificationResult[] {
    // Bulk results are keyed by email address, always power mode
    return Object.entries(results).map(([email, data]) =>
      transformSingleResult({ ...data, email }, 'power')
    );
  }

  async getBalance(): Promise<VerificationBalance | null> {
    try {
      const key = this.getApiKey();
      const url = `${BASE_URL}/check-account-balance/?key=${encodeURIComponent(key)}`;
      const response = await fetch(url);

      if (!response.ok) {
        log.warn(`Failed to check Reoon balance: ${response.status}`);
        return null;
      }

      const data = await response.json();

      return {
        remainingDailyCredits: data.remaining_daily_credits ?? 0,
        remainingInstantCredits: data.remaining_instant_credits ?? 0,
      };
    } catch (error) {
      log.warn('Failed to check Reoon balance', { error });
      return null;
    }
  }

  async isConfigured(): Promise<boolean> {
    return Boolean(process.env.REOON_API_KEY);
  }
}
