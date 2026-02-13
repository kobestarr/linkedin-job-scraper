/**
 * EnrichmentProvider Interface
 *
 * Abstracts lead enrichment. MVP has no enrichment, but this interface
 * allows seamless integration with Captain Data, Clay, Apollo, etc.
 */

import type { Job, Person, CompanySize } from '@/types';

/**
 * Company size ranges from LinkedIn/Captain Data
 */
export type CompanySizeRange =
  | '1-10'
  | '11-50'
  | '51-200'
  | '201-500'
  | '501-1000'
  | '1001-5000'
  | '5001-10000'
  | '10001+';

/**
 * Company enrichment data from providers like Captain Data
 */
export interface CompanyEnrichment {
  // Core identifiers
  uid?: string;
  linkedInCompanyId?: number;
  linkedInCompanyUrl?: string;

  // Firmographic data
  employeeCount?: number; // Numeric count (legacy)
  employeeCountRange?: CompanySizeRange; // Range from Captain Data
  industry?: string;
  category?: string;
  revenue?: string;
  revenueRange?: string;
  founded?: number;
  foundedYear?: number;
  companyType?: string;
  companyMaturity?: string;

  // Location data
  headquarters?: string;
  locations?: string[];

  // Contact & web presence
  description?: string;
  tagline?: string;
  website?: string;
  phone?: string;
  specialties?: string[];

  // Financial & growth data
  fundingStage?: string;

  // Technology & tools
  technologies?: string[];
  techStack?: string[];

  // Metadata
  enrichedAt?: Date;
  source?: string; // 'captain-data', 'clearbit', etc.
}

export interface EnrichedJob extends Job {
  enriched: true;
  companyData?: CompanyEnrichment;
  decisionMakers?: Person[];
  enrichedAt: string;
}

/**
 * Options for enriching a company
 */
export interface EnrichCompanyOptions {
  // Primary input (at least one required)
  companyLinkedInUrl?: string;
  companyDomain?: string;
  companyName?: string;

  // Optional: fields to include/exclude
  includeKeyEmployees?: boolean;
  includeTechStack?: boolean;

  // Cache control
  forceFresh?: boolean; // Skip cache, always fetch fresh data
}

/**
 * Result from company enrichment
 */
export interface EnrichCompanyResult {
  success: boolean;
  data?: CompanyEnrichment;
  error?: string;
  cached?: boolean; // True if result came from cache
  creditsUsed?: number; // How many API credits consumed
}

/**
 * Options for job enrichment (legacy + new)
 */
export interface EnrichmentOptions {
  // Decision maker options
  findDecisionMakers?: boolean;
  decisionMakerTitles?: string[];
  maxContacts?: number;

  // Company enrichment options
  enrichCompany?: boolean; // Default: true
  forceFresh?: boolean; // Skip cache

  // Batch control
  concurrency?: number; // Max parallel requests (default: 5)
  delayMs?: number; // Delay between batches (default: 1000ms)
  onProgress?: (completed: number, total: number) => void;
}

/**
 * Batch enrichment result
 */
export interface BatchEnrichResult {
  results: EnrichCompanyResult[];
  totalCreditsUsed: number;
  successCount: number;
  failureCount: number;
  duration: number; // milliseconds
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
   * Enrich a single company (new method for Captain Data)
   */
  enrichCompany(
    options: EnrichCompanyOptions,
    signal?: AbortSignal
  ): Promise<EnrichCompanyResult>;

  /**
   * Enrich a single job with company and contact data (legacy method)
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
