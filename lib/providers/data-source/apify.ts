/**
 * Apify DataSource Implementation
 *
 * Connects to Apify's cheap_scraper/linkedin-job-scraper actor.
 * Implements the DataSourceProvider interface.
 */

import type { Job, JobFilters } from '@/types';
import type { DataSourceProvider, ScrapeOptions, ScrapeResult } from './types';
import { logger } from '@/lib/logger';

export class ApifyDataSource implements DataSourceProvider {
  readonly id = 'apify';
  readonly name = 'Apify LinkedIn Scraper';

  private apiToken: string | undefined;
  private actorId: string;
  
  // Instance-level cache (not module-level to avoid cross-request pollution)
  private jobCache: Job[] = [];
  private lastUpdated: Date | null = null;

  constructor() {
    this.apiToken = process.env.APIFY_API_TOKEN;
    this.actorId = process.env.APIFY_ACTOR_ID || '2rJKkhh7vjpX7pvjg';
  }

  async scrape(options: ScrapeOptions, signal?: AbortSignal): Promise<ScrapeResult> {
    if (!this.apiToken) {
      throw new Error('APIFY_API_TOKEN not configured');
    }

    const { jobTitle, location = 'United States', dateRange = 'last24hours', maxResults = 50 } = options;

    // Check for abort before starting
    if (signal?.aborted) {
      throw new Error('Scrape aborted by user');
    }

    // Map date range to Apify format
    const publishedAt = this.mapDateRange(dateRange);

    const actorInput = {
      keyword: [jobTitle],
      location,
      maxItems: maxResults,
      saveOnlyUniqueItems: true,
      ...(publishedAt && { publishedAt }),
    };

    logger.info('[Apify] Starting scrape', { jobTitle, location, dateRange });

    try {
      // Call Apify API
      const response = await fetch(`https://api.apify.com/v2/acts/${this.actorId}/runs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiToken}`,
        },
        body: JSON.stringify(actorInput),
        signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Apify API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const run = await response.json();
      logger.info('[Apify] Run started', { runId: run.data?.id });

      // Wait for run to complete (polling)
      const completedRun = await this.waitForRun(run.data.id, signal);

      // Fetch results from dataset
      const jobs = await this.fetchDataset(completedRun.defaultDatasetId, signal);

      // Update instance cache
      this.jobCache = jobs;
      this.lastUpdated = new Date();

      logger.info('[Apify] Scrape completed', { totalJobs: jobs.length });

      return {
        runId: completedRun.id,
        jobs,
        totalCount: jobs.length,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logger.info('[Apify] Scrape aborted');
        throw new Error('Scrape aborted by user');
      }
      logger.error('[Apify] Scrape failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  async getJobs(filters?: JobFilters): Promise<Job[]> {
    let jobs = [...this.jobCache];

    if (!filters) return jobs;

    // Apply filters
    if (filters.mustContain?.length) {
      jobs = jobs.filter((job) =>
        filters.mustContain!.some(
          (keyword) =>
            job.title.toLowerCase().includes(keyword.toLowerCase()) ||
            job.description?.toLowerCase().includes(keyword.toLowerCase())
        )
      );
    }

    if (filters.exclude?.length) {
      jobs = jobs.filter(
        (job) =>
          !filters.exclude!.some(
            (keyword) =>
              job.title.toLowerCase().includes(keyword.toLowerCase())
          )
      );
    }

    if (filters.companyExclude?.length) {
      jobs = jobs.filter(
        (job) =>
          !filters.companyExclude!.some((company) =>
            job.company.toLowerCase().includes(company.toLowerCase())
          )
      );
    }

    // Date range filtering
    if (filters.dateRange) {
      const now = new Date();
      const cutoff = this.getDateCutoff(filters.dateRange);
      jobs = jobs.filter((job) => new Date(job.postedAt) >= cutoff);
    }

    return jobs;
  }

  async getLastUpdated(): Promise<Date | null> {
    return this.lastUpdated;
  }

  async isConfigured(): Promise<boolean> {
    return !!this.apiToken;
  }

  private mapDateRange(dateRange: string): string | null {
    const mapping: Record<string, string> = {
      last24hours: 'r86400',
      '24h': 'r86400',
      last3days: 'r259200',
      '3d': 'r259200',
      last7days: 'r604800',
      '7d': 'r604800',
      last14days: 'r1209600',
      '14d': 'r1209600',
      last30days: 'r2592000',
      '30d': 'r2592000',
    };
    return mapping[dateRange] || null;
  }

  private getDateCutoff(dateRange: string): Date {
    const now = new Date();
    const hours: Record<string, number> = {
      '24h': 24,
      '3d': 72,
      '7d': 168,
      '14d': 336,
      '30d': 720,
    };
    const hoursAgo = hours[dateRange] || 168;
    return new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
  }

  private async waitForRun(
    runId: string, 
    signal?: AbortSignal, 
    maxWaitMs = 300000,
    pollIntervalMs = 2000
  ): Promise<{ id: string; defaultDatasetId: string }> {
    const startTime = Date.now();
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    try {
      while (Date.now() - startTime < maxWaitMs) {
        // Check for abort signal
        if (signal?.aborted) {
          throw new Error('Scrape aborted by user');
        }

        const response = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
          headers: { Authorization: `Bearer ${this.apiToken}` },
          signal,
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new Error(`Failed to check run status: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const { data } = await response.json();

        if (data.status === 'SUCCEEDED') {
          return data;
        }

        if (data.status === 'FAILED' || data.status === 'ABORTED' || data.status === 'TIMED-OUT') {
          throw new Error(`Apify run ${data.status}${data.statusMessage ? `: ${data.statusMessage}` : ''}`);
        }

        // Wait before polling again (with abort support)
        await new Promise<void>((resolve, reject) => {
          if (signal?.aborted) {
            reject(new Error('Scrape aborted by user'));
            return;
          }

          timeoutId = setTimeout(() => {
            if (signal?.aborted) {
              reject(new Error('Scrape aborted by user'));
            } else {
              resolve();
            }
          }, pollIntervalMs);

          signal?.addEventListener('abort', () => {
            if (timeoutId) {
              clearTimeout(timeoutId);
              reject(new Error('Scrape aborted by user'));
            }
          }, { once: true });
        });
      }

      throw new Error(`Apify run timed out after ${maxWaitMs}ms`);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  private async fetchDataset(datasetId: string, signal?: AbortSignal): Promise<Job[]> {
    try {
      const response = await fetch(
        `https://api.apify.com/v2/datasets/${datasetId}/items?format=json`,
        {
          headers: { Authorization: `Bearer ${this.apiToken}` },
          signal,
        }
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Failed to fetch dataset: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const items = await response.json();

      if (!Array.isArray(items)) {
        throw new Error('Invalid dataset response: expected array');
      }

      // Transform Apify format to our Job type
      return items.map((item: Record<string, unknown>) => this.transformJob(item));
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Dataset fetch aborted');
      }
      throw error;
    }
  }

  private transformJob(item: Record<string, unknown>): Job {
    return {
      id: (item.id as string) || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: (item.title as string) || (item.jobTitle as string) || 'Unknown Title',
      company: (item.company as string) || (item.companyName as string) || 'Unknown Company',
      companyUrl: item.companyUrl as string | undefined,
      companyLinkedIn: item.companyLinkedIn as string | undefined,
      location: (item.location as string) || 'Unknown Location',
      postedAt: (item.postedAt as string) || (item.publishedAt as string) || new Date().toISOString(),
      url: (item.url as string) || (item.jobUrl as string) || '#',
      description: item.description as string | undefined,
      salary: item.salary as string | undefined,
      employmentType: item.employmentType as string | undefined,
      experienceLevel: item.experienceLevel as string | undefined,
      applicantCount: item.applicantCount as number | undefined,
    };
  }
}
