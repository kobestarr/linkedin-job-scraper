/**
 * Email Verification Provider Factory
 *
 * Returns the configured email verification provider.
 * Change NEXT_PUBLIC_EMAIL_VERIFICATION env var to switch implementations.
 *
 * Pipeline position: Icypeas (find) → **Reoon (verify)** → Crawl4AI (deep data) → store
 */

import type { EmailVerificationProvider } from './types';
import { ReoonVerificationProvider } from './reoon';

export type VerificationProviderType = 'reoon' | 'none';

const providers: Record<
  Exclude<VerificationProviderType, 'none'>,
  () => EmailVerificationProvider
> = {
  'reoon': () => new ReoonVerificationProvider(),
};

let instance: EmailVerificationProvider | null = null;

export function getVerificationProvider(): EmailVerificationProvider | null {
  const type = (process.env.NEXT_PUBLIC_EMAIL_VERIFICATION || 'none') as VerificationProviderType;

  if (type === 'none') {
    return null;
  }

  if (instance) return instance;

  if (!providers[type as keyof typeof providers]) {
    throw new Error(`Unknown verification provider: ${type}`);
  }

  instance = providers[type as keyof typeof providers]();
  return instance;
}

/**
 * Check if email verification is enabled
 */
export function isVerificationEnabled(): boolean {
  const type = (process.env.NEXT_PUBLIC_EMAIL_VERIFICATION || 'none') as VerificationProviderType;
  return type !== 'none';
}

export { type EmailVerificationProvider } from './types';
export type {
  EmailVerificationResult,
  BatchVerificationResult,
  VerificationBalance,
  VerificationOptions,
  VerificationStatus,
} from './types';
