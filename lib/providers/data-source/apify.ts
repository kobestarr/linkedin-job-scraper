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
    this.actorId = process.env.APIFY_ACTOR_ID || '';
  }

  async scrape(options: ScrapeOptions, signal?: AbortSignal): Promise<ScrapeResult> {
    if (!this.apiToken || !this.actorId) {
      throw new Error('APIFY_API_TOKEN and APIFY_ACTOR_ID must be configured in environment');
    }

    const { jobTitle, location = 'United States', dateRange = 'last24hours', maxResults = 150 } = options;

    // Check for abort before starting
    if (signal?.aborted) {
      throw new Error('Scrape aborted by user');
    }

    // Map date range to Apify format
    const publishedAt = this.mapDateRange(dateRange);

    // Apify cheap_scraper requires maxItems >= 150
    const actorInput = {
      keyword: [jobTitle],
      location,
      maxItems: Math.max(maxResults, 150),
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

  /**
   * Strip tracking parameters from LinkedIn URLs to avoid authwall redirects.
   * LinkedIn adds trackingId, refId, etc. that fingerprint the request source.
   */
  private cleanLinkedInUrl(url: string): string {
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes('linkedin.com')) {
        return `${parsed.origin}${parsed.pathname}`;
      }
      return url;
    } catch {
      return url;
    }
  }

  /**
   * Parse applicant count from Apify string like "Be among the first 25 applicants" or "200+ applicants"
   */
  private parseApplicantCount(raw: unknown): number | undefined {
    if (typeof raw === 'number') return raw;
    if (typeof raw !== 'string' || !raw) return undefined;
    const match = raw.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : undefined;
  }

  /**
   * Format salaryInfo array into a readable string.
   * Apify returns e.g. ["$170000.00", "$180000.00"] or []
   */
  private formatSalary(raw: unknown): string | undefined {
    if (!Array.isArray(raw) || raw.length === 0) {
      if (typeof raw === 'string' && raw) return raw;
      return undefined;
    }
    const formatted = raw.map((v: string) => {
      const num = parseFloat(String(v).replace(/[^0-9.]/g, ''));
      if (isNaN(num)) return v;
      const currency = String(v).match(/^[^0-9]*/)?.[0] || '$';
      if (num >= 1000) return `${currency}${Math.round(num / 1000)}K`;
      return `${currency}${num}`;
    });
    if (formatted.length === 1) return formatted[0];
    return `${formatted[0]} - ${formatted[1]}`;
  }

  /**
   * Strip LinkedIn boilerplate from descriptions ("Show more Show less", etc.)
   */
  private cleanDescription(raw: string | undefined): string | undefined {
    if (!raw) return undefined;
    return raw.replace(/\s*Show more Show less\s*$/i, '').trim() || undefined;
  }

  private transformJob(item: Record<string, unknown>): Job {
    // Deterministic ID generation to avoid hydration mismatches
    const deterministicId = () => {
      const company = String(item.companyName || item.company || 'unknown').toLowerCase().replace(/\s+/g, '-');
      const title = String(item.jobTitle || item.title || 'unknown').toLowerCase().replace(/\s+/g, '-');
      const date = String(item.publishedAt || item.postedAt || Date.now()).slice(0, 10);
      return `${company}-${title}-${date}`.replace(/[^a-z0-9-]/g, '').slice(0, 100);
    };
    
    return {
      id: (item.jobId as string) || (item.id as string) || deterministicId(),
      title: (item.jobTitle as string) || (item.title as string) || 'Unknown Title',
      company: (item.companyName as string) || (item.company as string) || 'Unknown Company',
      companyUrl: item.companyUrl as string | undefined,
      companyLinkedIn: item.companyLinkedIn as string | undefined,
      companyLogo: item.companyLogo as string | undefined,
      location: (item.location as string) || 'Unknown Location',
      postedAt: (item.publishedAt as string) || (item.postedAt as string) || new Date().toISOString(),
      postedAtRelative: (item.postedTime as string) || (item.postedAtRelative as string) || undefined,
      url: this.cleanLinkedInUrl((item.jobUrl as string) || (item.url as string) || '#'),
      description: this.cleanDescription((item.jobDescription as string) || (item.description as string)),
      salary: this.formatSalary(item.salaryInfo ?? item.salary),
      employmentType: (item.contractType as string) || (item.employmentType as string) || undefined,
      experienceLevel: (item.experienceLevel as string) || undefined,
      applicantCount: this.parseApplicantCount(item.applicationsCount ?? item.applicantCount),
    };
  }
}
