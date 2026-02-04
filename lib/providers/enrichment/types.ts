/**
 * EnrichmentProvider Interface
 *
 * Abstracts lead enrichment. MVP has no enrichment, but this interface
 * allows seamless integration with Captain Data, Clay, Apollo, etc.
 */

import type { Job, Person } from '@/types';

export interface CompanyEnrichment {
  employeeCount?: number;
  industry?: string;
  revenue?: string;
  founded?: number;
  description?: string;
  website?: string;
  technologies?: string[];
}

export interface EnrichedJob extends Job {
  enriched: true;
  companyData?: CompanyEnrichment;
  decisionMakers?: Person[];
  enrichedAt: string;
}

export interface EnrichmentOptions {
  findDecisionMakers?: boolean;
  decisionMakerTitles?: string[];
  maxContacts?: number;
}

export interface EnrichmentProvider {
  /**
   * Unique identifier for this provider
   */
  readonly id: string;

  /**
   * Human-readable name
   */
  readonly name: string;

  /**
   * Enrich a single job with company and contact data
   */
  enrichJob(job: Job, options?: EnrichmentOptions): Promise<EnrichedJob>;

  /**
   * Batch enrich multiple jobs
   */
  enrichJobs(jobs: Job[], options?: EnrichmentOptions): Promise<EnrichedJob[]>;

  /**
   * Get remaining enrichment credits
   */
  getCredits(): Promise<{ remaining: number; total: number } | null>;

  /**
   * Check if the provider is configured and ready
   */
  isConfigured(): Promise<boolean>;
}
