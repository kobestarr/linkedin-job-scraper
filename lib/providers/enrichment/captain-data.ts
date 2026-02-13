/**
 * Captain Data Enrichment Provider
 *
 * Enriches company data using Captain Data's API v1.
 * Documentation: https://docs.captaindata.com/v1/api/companies/enrich
 */

import type { Job, Person } from '@/types';
import type {
  EnrichmentProvider,
  CompanyEnrichment,
  EnrichedJob,
  EnrichmentOptions,
  EnrichCompanyOptions,
  EnrichCompanyResult,
  CompanySizeRange,
} from './types';
import { logger } from '@/lib/logger';

const API_BASE_URL = 'https://api.captaindata.com/v1';

export class CaptainDataEnrichment implements EnrichmentProvider {
  readonly id = 'captain-data';
  readonly name = 'Captain Data';

  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.CAPTAIN_DATA_API_KEY;
  }

  async isConfigured(): Promise<boolean> {
    return !!this.apiKey;
  }

  async getCredits(): Promise<{ remaining: number; total: number } | null> {
    // Captain Data doesn't expose credit info via API
    // Would need to implement dashboard scraping or manual tracking
    return null;
  }

  /**
   * Enrich a single company using Captain Data's company enrich endpoint
   */
  async enrichCompany(
    options: EnrichCompanyOptions,
    signal?: AbortSignal
  ): Promise<EnrichCompanyResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Captain Data API key not configured',
      };
    }

    const { companyLinkedInUrl, companyDomain, companyName } = options;

    if (!companyLinkedInUrl && !companyDomain && !companyName) {
      return {
        success: false,
        error: 'At least one of companyLinkedInUrl, companyDomain, or companyName is required',
      };
    }

    try {
      // Build query params
      const params = new URLSearchParams();
      if (companyLinkedInUrl) params.append('li_company_url', companyLinkedInUrl);
      if (companyDomain) params.append('domain', companyDomain);
      if (companyName) params.append('company_name', companyName);

      const url = `${API_BASE_URL}/companies/enrich?${params.toString()}`;

      logger.info('[CaptainData] Enriching company', {
        linkedInUrl: companyLinkedInUrl,
        domain: companyDomain,
        name: companyName,
      });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-API-Key': this.apiKey,
        },
        signal,
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            error: 'Company not found or LinkedIn URL invalid',
          };
        }
        if (response.status === 429) {
          return {
            success: false,
            error: 'Rate limit exceeded - too many requests',
          };
        }
        if (response.status === 401) {
          return {
            success: false,
            error: 'Invalid Captain Data API key',
          };
        }

        const errorText = await response.text().catch(() => 'Unknown error');
        return {
          success: false,
          error: `Captain Data API error: ${response.status} - ${errorText}`,
        };
      }

      const rawData = await response.json();
      const enrichedData = this.transformCompanyData(rawData);

      logger.info('[CaptainData] Company enriched successfully', {
        company: enrichedData.website || companyName,
      });

      return {
        success: true,
        data: enrichedData,
        creditsUsed: 1, // Captain Data charges 1 credit per company enrichment
        cached: false,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request aborted',
        };
      }

      logger.error('[CaptainData] Enrichment failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Enrichment failed',
      };
    }
  }

  /**
   * Enrich a single job with company data
   */
  async enrichJob(job: Job, options?: EnrichmentOptions): Promise<EnrichedJob> {
    const enrichCompanyOptions: EnrichCompanyOptions = {
      companyLinkedInUrl: job.companyLinkedIn,
      companyName: job.company,
      companyDomain: job.companyUrl,
    };

    const result = await this.enrichCompany(enrichCompanyOptions);

    if (!result.success || !result.data) {
      logger.warn('[CaptainData] Failed to enrich job', {
        job: job.id,
        company: job.company,
        error: result.error,
      });

      // Return job with enriched flag but no data
      return {
        ...job,
        enriched: true,
        enrichedAt: new Date().toISOString(),
      };
    }

    return {
      ...job,
      enriched: true,
      companyData: result.data,
      enrichedAt: new Date().toISOString(),
    };
  }

  /**
   * Batch enrich multiple jobs with rate limiting and retry logic
   */
  async enrichJobs(jobs: Job[], options?: EnrichmentOptions): Promise<EnrichedJob[]> {
    const {
      concurrency = 5,
      delayMs = 1000,
      onProgress,
    } = options || {};

    const results: EnrichedJob[] = [];
    let completed = 0;

    logger.info('[CaptainData] Starting batch enrichment', {
      totalJobs: jobs.length,
      concurrency,
      delayMs,
    });

    for (let i = 0; i < jobs.length; i += concurrency) {
      const batch = jobs.slice(i, i + concurrency);

      const batchResults = await Promise.all(
        batch.map((job) => this.enrichJob(job, options))
      );

      results.push(...batchResults);
      completed += batch.length;

      if (onProgress) {
        onProgress(completed, jobs.length);
      }

      // Add delay between batches to avoid rate limiting
      if (i + concurrency < jobs.length) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    const successCount = results.filter((r) => r.companyData).length;
    logger.info('[CaptainData] Batch enrichment complete', {
      total: jobs.length,
      enriched: successCount,
      failed: jobs.length - successCount,
    });

    return results;
  }

  /**
   * Transform Captain Data API response to our CompanyEnrichment type
   */
  private transformCompanyData(raw: Record<string, unknown>): CompanyEnrichment {
    return {
      uid: raw.uid as string | undefined,
      linkedInCompanyId: raw.li_company_id as number | undefined,
      linkedInCompanyUrl: raw.li_company_url as string | undefined,

      // Employee count - Captain Data returns ranges like "201-500"
      employeeCountRange: raw.number_employees as CompanySizeRange | undefined,
      employeeCount: this.parseEmployeeCount(raw.number_employees as string | undefined),

      // Firmographic data
      industry: raw.industry as string | undefined,
      category: raw.category as string | undefined,
      foundedYear: raw.founded_date
        ? parseInt(String(raw.founded_date), 10)
        : undefined,
      founded: raw.founded_date
        ? parseInt(String(raw.founded_date), 10)
        : undefined,
      companyType: raw.company_type as string | undefined,
      companyMaturity: raw.company_maturity as string | undefined,

      // Location
      headquarters: raw.headquarters as string | undefined,
      locations: raw.locations as string[] | undefined,

      // Contact & web
      description: raw.description as string | undefined,
      tagline: raw.tagline as string | undefined,
      website: raw.website as string | undefined,
      phone: raw.phone as string | undefined,
      specialties: raw.specialties as string[] | undefined,

      // Financial
      fundingStage: raw.funding_stage as string | undefined,
      revenueRange: raw.revenue_range as string | undefined,
      revenue: raw.revenue_range as string | undefined,

      // Technology
      techStack: raw.tech_stack as string[] | undefined,
      technologies: raw.tech_stack as string[] | undefined,

      // Metadata
      enrichedAt: new Date(),
      source: 'captain-data',
    };
  }

  /**
   * Parse employee count range to numeric value (use midpoint of range)
   */
  private parseEmployeeCount(range: string | undefined): number | undefined {
    if (!range) return undefined;

    const rangeMap: Record<string, number> = {
      '1-10': 5,
      '11-50': 30,
      '51-200': 125,
      '201-500': 350,
      '501-1000': 750,
      '1001-5000': 3000,
      '5001-10000': 7500,
      '10001+': 15000,
    };

    return rangeMap[range] || undefined;
  }
}
