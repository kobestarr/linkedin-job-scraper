/**
 * Mock DataSource Implementation
 *
 * Returns realistic fake job data for development and testing
 * without requiring Apify API keys.
 *
 * Usage: Set NEXT_PUBLIC_DATA_SOURCE=mock in .env
 */

import type { Job, JobFilters } from '@/types';
import type { DataSourceProvider, ScrapeOptions, ScrapeResult } from './types';
import { MOCK_JOBS } from './mock-data';
import { logger } from '@/lib/logger';

export class MockDataSource implements DataSourceProvider {
  readonly id = 'mock';
  readonly name = 'Mock Data (Development)';

  private jobCache: Job[] = [];
  private lastUpdated: Date | null = null;

  async scrape(options: ScrapeOptions, signal?: AbortSignal): Promise<ScrapeResult> {
    const { jobTitle, maxResults = 50 } = options;

    if (signal?.aborted) {
      throw new Error('Scrape aborted by user');
    }

    logger.info('[Mock] Starting mock scrape', { jobTitle });

    // Simulate network delay (1-2 seconds)
    await new Promise<void>((resolve, reject) => {
      const delay = 1000 + Math.random() * 1000;
      const timeout = setTimeout(resolve, delay);

      signal?.addEventListener('abort', () => {
        clearTimeout(timeout);
        reject(new Error('Scrape aborted by user'));
      }, { once: true });
    });

    // Filter mock jobs by title keyword if provided
    let jobs = MOCK_JOBS;
    if (jobTitle) {
      const keyword = jobTitle.toLowerCase();
      jobs = jobs.filter(
        (job) =>
          job.title.toLowerCase().includes(keyword) ||
          job.description?.toLowerCase().includes(keyword)
      );
    }

    // Apply max results limit
    jobs = jobs.slice(0, maxResults);

    // Update cache
    this.jobCache = jobs;
    this.lastUpdated = new Date();

    logger.info('[Mock] Mock scrape completed', { totalJobs: jobs.length });

    return {
      runId: `mock-${Date.now()}`,
      jobs,
      totalCount: jobs.length,
    };
  }

  async getJobs(filters?: JobFilters): Promise<Job[]> {
    let jobs = [...this.jobCache];

    if (!filters) return jobs;

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
          !filters.exclude!.some((keyword) =>
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

    if (filters.dateRange) {
      const cutoff = this.getDateCutoff(filters.dateRange);
      jobs = jobs.filter((job) => new Date(job.postedAt) >= cutoff);
    }

    return jobs;
  }

  async getLastUpdated(): Promise<Date | null> {
    return this.lastUpdated;
  }

  async isConfigured(): Promise<boolean> {
    return true;
  }

  private getDateCutoff(dateRange: string): Date {
    const hours: Record<string, number> = {
      '24h': 24,
      '3d': 72,
      '7d': 168,
      '14d': 336,
      '30d': 720,
    };
    const hoursAgo = hours[dateRange] || 168;
    return new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  }
}
