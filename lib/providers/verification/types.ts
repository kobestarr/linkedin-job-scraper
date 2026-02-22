/**
 * EmailVerificationProvider Interface
 *
 * Abstracts email verification services. Sits between enrichment (find email)
 * and storage (persist result) in the pipeline:
 *   Icypeas (find) → Reoon (verify) → Crawl4AI (deep data) → store
 */

/**
 * Verification status returned by providers
 */
export type VerificationStatus =
  | 'safe'         // Verified deliverable — safe to send
  | 'valid'        // Syntax/MX valid but inbox not deeply checked (quick mode)
  | 'invalid'      // Definitely undeliverable
  | 'catch_all'    // Domain accepts all addresses — deliverability uncertain
  | 'disposable'   // Temporary/throwaway email
  | 'role_account' // Generic role (info@, support@) — not a person
  | 'spamtrap'     // Known spam trap — do not send
  | 'disabled'     // Inbox exists but is disabled
  | 'inbox_full'   // Inbox exists but is full
  | 'unknown';     // Could not determine status

/**
 * Result from verifying a single email
 */
export interface EmailVerificationResult {
  email: string;
  status: VerificationStatus;
  isSafeToSend: boolean;
  score?: number; // 0-100 confidence score (power mode only)

  // Detailed checks
  isValidSyntax: boolean;
  isDisposable: boolean;
  isRoleAccount: boolean;
  isFreeEmail: boolean;
  isSpamtrap: boolean;
  isCatchAll: boolean;
  mxAcceptsMail: boolean;

  // Provider metadata
  verifiedAt: string; // ISO timestamp
  mode: 'quick' | 'power';
  source: string; // 'reoon', etc.
}

/**
 * Options for verification
 */
export interface VerificationOptions {
  mode?: 'quick' | 'power'; // Default: 'power'
}

/**
 * Batch verification result
 */
export interface BatchVerificationResult {
  results: EmailVerificationResult[];
  totalVerified: number;
  safeCount: number;
  unsafeCount: number;
  duration: number; // milliseconds
}

/**
 * Account balance info
 */
export interface VerificationBalance {
  remainingDailyCredits: number;
  remainingInstantCredits: number;
}

export interface EmailVerificationProvider {
  readonly id: string;
  readonly name: string;

  /**
   * Verify a single email address
   */
  verifyEmail(
    email: string,
    options?: VerificationOptions
  ): Promise<EmailVerificationResult>;

  /**
   * Verify multiple emails (uses bulk API when available)
   */
  verifyEmails(
    emails: string[],
    options?: VerificationOptions
  ): Promise<BatchVerificationResult>;

  /**
   * Get remaining verification credits
   */
  getBalance(): Promise<VerificationBalance | null>;

  /**
   * Check if the provider is configured and ready
   */
  isConfigured(): Promise<boolean>;
}
