/**
 * Apify DataSource Implementation
 *
 * Connects to Apify's cheap_scraper/linkedin-job-scraper actor.
 * Implements the DataSourceProvider interface.
 */

import type { Job, JobFilters } from '@/types';
import type { DataSourceProvider, ScrapeOptions, ScrapeResult } from './types';

// In-memory cache for jobs (MVP - will move to proper storage in Phase 2)
let jobCache: Job[] = [];
let lastUpdated: Date | null = null;

export class ApifyDataSource implements DataSourceProvider {
  readonly id = 'apify';
  readonly name = 'Apify LinkedIn Scraper';

  private apiToken: string | undefined;
  private actorId: string;

  constructor() {
    this.apiToken = process.env.APIFY_API_TOKEN;
    this.actorId = process.env.APIFY_ACTOR_ID || '2rJKkhh7vjpX7pvjg';
  }

  async scrape(options: ScrapeOptions): Promise<ScrapeResult> {
    if (!this.apiToken) {
      throw new Error('APIFY_API_TOKEN not configured');
    }

    const { jobTitle, location = 'United States', dateRange = 'last24hours', maxResults = 50 } = options;

    // Map date range to Apify format
    const publishedAt = this.mapDateRange(dateRange);

    const actorInput = {
      keyword: [jobTitle],
      location,
      maxItems: maxResults,
      saveOnlyUniqueItems: true,
      ...(publishedAt && { publishedAt }),
    };

    // Call Apify API
    const response = await fetch(`https://api.apify.com/v2/acts/${this.actorId}/runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiToken}`,
      },
      body: JSON.stringify(actorInput),
    });

    if (!response.ok) {
      throw new Error(`Apify API error: ${response.statusText}`);
    }

    const run = await response.json();

    // Wait for run to complete (polling)
    const completedRun = await this.waitForRun(run.data.id);

    // Fetch results from dataset
    const jobs = await this.fetchDataset(completedRun.defaultDatasetId);

    // Update cache
    jobCache = jobs;
    lastUpdated = new Date();

    return {
      runId: completedRun.id,
      jobs,
      totalCount: jobs.length,
    };
  }

  async getJobs(filters?: JobFilters): Promise<Job[]> {
    let jobs = [...jobCache];

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
    return lastUpdated;
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

  private async waitForRun(runId: string, maxWaitMs = 300000): Promise<{ id: string; defaultDatasetId: string }> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      const response = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
        headers: { Authorization: `Bearer ${this.apiToken}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to check run status: ${response.statusText}`);
      }

      const { data } = await response.json();

      if (data.status === 'SUCCEEDED') {
        return data;
      }

      if (data.status === 'FAILED' || data.status === 'ABORTED') {
        throw new Error(`Apify run ${data.status}`);
      }

      // Wait 2 seconds before polling again
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    throw new Error('Apify run timed out');
  }

  private async fetchDataset(datasetId: string): Promise<Job[]> {
    const response = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?format=json`,
      {
        headers: { Authorization: `Bearer ${this.apiToken}` },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch dataset: ${response.statusText}`);
    }

    const items = await response.json();

    // Transform Apify format to our Job type
    return items.map((item: Record<string, unknown>) => this.transformJob(item));
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
