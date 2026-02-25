/**
 * Usage Limits & Credit Cost Configuration
 *
 * Centralises all enrichment credit costs and monthly spending caps.
 * Costs are per-provider — Crawl4AI is free, Reoon is free, only Icypeas costs.
 */

/**
 * Estimated credits consumed per job enrichment, by provider.
 * Used for pre-enrichment cost estimation.
 */
export const CREDITS_PER_JOB: Record<string, number> = {
  icypeas: 1.5,       // Company scrape (0.5) + domain search (1)
  'captain-data': 0,  // Billed separately via Captain Data subscription
  crawl4ai: 0,        // Free — self-hosted Docker sidecar
  mock: 0,            // No real credits
  none: 0,
};

/**
 * Monthly credit cap — prevents runaway spending.
 * Read from env var with sensible default for bootstrap phase.
 */
export function getMonthlyCreditCap(): number {
  const envCap = process.env.NEXT_PUBLIC_MONTHLY_CREDIT_CAP;
  return envCap ? parseInt(envCap, 10) : 500;
}

/**
 * Warning thresholds as fractions of the monthly cap.
 */
export const USAGE_THRESHOLDS = {
  /** Show amber warning */
  warning: 0.50,
  /** Show orange warning */
  high: 0.80,
  /** Show red critical warning — block enrichment */
  critical: 0.95,
} as const;

/**
 * Get the threshold level for a given usage fraction.
 */
export function getUsageLevel(
  used: number,
  cap: number
): 'ok' | 'warning' | 'high' | 'critical' {
  if (cap <= 0) return 'ok';
  const fraction = used / cap;
  if (fraction >= USAGE_THRESHOLDS.critical) return 'critical';
  if (fraction >= USAGE_THRESHOLDS.high) return 'high';
  if (fraction >= USAGE_THRESHOLDS.warning) return 'warning';
  return 'ok';
}

/**
 * Estimate credits needed for a batch of jobs.
 */
export function estimateCredits(jobCount: number, providerId: string): number {
  const perJob = CREDITS_PER_JOB[providerId] ?? 0;
  return jobCount * perJob;
}
