/**
 * No-op Enrichment Provider
 *
 * MVP placeholder that returns jobs unchanged.
 * Allows UI to be built with enrichment features greyed out.
 */

import type { Job } from '@/types';
import type {
  EnrichmentProvider,
  EnrichedJob,
  EnrichmentOptions,
  EnrichCompanyOptions,
  EnrichCompanyResult,
} from './types';

export class NoopEnrichmentProvider implements EnrichmentProvider {
  readonly id = 'none';
  readonly name = 'No Enrichment';

  async enrichCompany(
    _options: EnrichCompanyOptions,
    _signal?: AbortSignal
  ): Promise<EnrichCompanyResult> {
    // No-op: return success but no data
    return {
      success: true,
      creditsUsed: 0,
    };
  }

  async enrichJob(job: Job, _options?: EnrichmentOptions): Promise<EnrichedJob> {
    // Return job as-is, marked as enriched (processed through the enrichment pipeline)
    // This is a no-op provider, so no actual enrichment data is added
    return {
      ...job,
      enriched: true, // Indicates the job passed through the enrichment pipeline
      enrichedAt: new Date().toISOString(),
    };
  }

  async enrichJobs(jobs: Job[], options?: EnrichmentOptions): Promise<EnrichedJob[]> {
    return Promise.all(jobs.map((job) => this.enrichJob(job, options)));
  }

  async getCredits(): Promise<{ remaining: number; total: number } | null> {
    // No credits system in noop provider
    return null;
  }

  async isConfigured(): Promise<boolean> {
    // Always "configured" since it does nothing
    return true;
  }
}
