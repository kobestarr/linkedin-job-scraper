/**
 * DataSourceProvider Interface
 *
 * Abstracts the job data source. MVP uses Apify, but this can be swapped
 * to Captain Data, Clay, or a custom scraper without touching UI code.
 */

import type { Job, JobFilters } from '@/types';

export interface ScrapeOptions {
  jobTitle: string;
  location?: string;
  dateRange?: string;
  maxResults?: number;
}

export interface ScrapeResult {
  runId: string;
  jobs: Job[];
  totalCount: number;
  cached?: boolean;
}

export interface DataSourceProvider {
  /**
   * Unique identifier for this provider
   */
  readonly id: string;

  /**
   * Human-readable name
   */
  readonly name: string;

  /**
   * Trigger a new scrape job
   */
  scrape(options: ScrapeOptions, signal?: AbortSignal): Promise<ScrapeResult>;

  /**
   * Get jobs from the most recent scrape (cached)
   */
  getJobs(filters?: JobFilters): Promise<Job[]>;

  /**
   * Get the timestamp of the last successful scrape
   */
  getLastUpdated(): Promise<Date | null>;

  /**
   * Check if the provider is configured and ready
   */
  isConfigured(): Promise<boolean>;
}
