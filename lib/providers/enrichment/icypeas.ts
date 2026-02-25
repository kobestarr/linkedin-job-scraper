/**
 * Icypeas Enrichment Provider
 *
 * Uses Icypeas API for B2B email finding and company/profile scraping.
 * API docs: https://api-doc.icypeas.com/
 *
 * Pipeline position: **Icypeas (find email)** → Reoon (verify) → Crawl4AI (deep data) → store
 *
 * Endpoints used:
 *   POST /email-search        — find professional email (1 credit)
 *   GET  /scrape/company?url= — scrape company data (0.5 credits)
 *   GET  /scrape/profile?url= — scrape person data (1.5 credits)
 *   POST /domain-search       — find emails at domain (1 credit)
 *   POST /bulk-single-searchs/read — poll for async results
 *   POST /a/actions/subscription-information — credit balance
 *
 * Auth: API key in Authorization header (no Bearer prefix)
 * Rate limits: 10-20 calls/sec depending on endpoint
 * Async pattern: launch search → poll status until DEBITED → read results
 */

import type { Job, Person } from '@/types';
import type {
  EnrichmentProvider,
  CompanyEnrichment,
  EnrichedJob,
  EnrichmentOptions,
  EnrichCompanyOptions,
  EnrichCompanyResult,
} from './types';
import { logger } from '@/lib/logger';

const API_BASE_URL = 'https://app.icypeas.com/api';
const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 30; // ~60 seconds
const BATCH_CONCURRENCY = 5;
const BATCH_DELAY_MS = 1000;

const log = logger.child({ context: 'icypeas-enrichment' });

/**
 * Icypeas search status values
 */
type SearchStatus = 'NONE' | 'SCHEDULED' | 'IN_PROGRESS' | 'DEBITED';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface IcypeasSearchResult {
  success: boolean;
  item: {
    status: SearchStatus;
    _id: string;
    firstname?: string;
    lastname?: string;
    fullname?: string;
    gender?: string;
    emails?: Array<{
      email: string;
      certainty: number;
      mxRecords?: string[];
    }>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface IcypeasCompanyData {
  name?: string;
  description?: string;
  tagline?: string;
  website?: string;
  industry?: string;
  headquarter?: string;
  specialties?: string[];
  employeeCount?: number;
  employeeCountRange?: string;
  founded?: number;
  type?: string;
  linkedInUrl?: string;
  phone?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export class IcypeasEnrichment implements EnrichmentProvider {
  readonly id = 'icypeas';
  readonly name = 'Icypeas';

  private getApiKey(): string {
    const key = process.env.ICYPEAS_API_KEY;
    if (!key) {
      throw new Error('ICYPEAS_API_KEY environment variable is not set');
    }
    return key;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': this.getApiKey(),
      'Content-Type': 'application/json',
    };
  }

  async isConfigured(): Promise<boolean> {
    return Boolean(process.env.ICYPEAS_API_KEY);
  }

  /**
   * Get remaining credits from Icypeas subscription
   */
  async getCredits(): Promise<{ remaining: number; total: number } | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/a/actions/subscription-information`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        log.warn(`Failed to check Icypeas credits: ${response.status}`);
        return null;
      }

      const data = await response.json();
      const remaining = data.credits_remaining ?? 0;
      const used = data.credits_used ?? 0;

      return {
        remaining,
        total: remaining + used,
      };
    } catch (error) {
      log.warn('Failed to check Icypeas credits', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Enrich a single company — scrape company data + optionally find emails
   */
  async enrichCompany(
    options: EnrichCompanyOptions,
    signal?: AbortSignal
  ): Promise<EnrichCompanyResult> {
    const { companyLinkedInUrl, companyDomain, companyName } = options;

    if (!companyLinkedInUrl && !companyDomain && !companyName) {
      return {
        success: false,
        error: 'At least one of companyLinkedInUrl, companyDomain, or companyName is required',
      };
    }

    try {
      let companyData: CompanyEnrichment | undefined;
      let creditsUsed = 0;

      // Step 1: Company scrape (if we have a LinkedIn URL)
      if (companyLinkedInUrl) {
        log.info(`Scraping company: ${companyLinkedInUrl}`);
        const scraped = await this.scrapeCompany(companyLinkedInUrl, signal);
        if (scraped) {
          companyData = this.transformCompanyData(scraped);
          creditsUsed += 0.5;
        }
      }

      // Step 2: Domain search for emails (if we have a domain)
      const domain = companyDomain || companyData?.website;
      if (domain && options.includeKeyEmployees !== false) {
        log.info(`Domain search: ${domain}`);
        const domainResult = await this.searchDomain(domain, signal);
        if (domainResult) {
          // Merge domain search data into company enrichment
          if (!companyData) {
            companyData = {};
          }
          companyData.website = companyData.website || domain;
          creditsUsed += 1;
        }
      }

      if (!companyData) {
        return {
          success: false,
          error: 'No company data could be retrieved',
          creditsUsed,
        };
      }

      companyData.enrichedAt = new Date();
      companyData.source = 'icypeas';

      log.info(`Enriched company: ${companyName || companyLinkedInUrl}`, {
        fields: Object.keys(companyData).filter(
          (k) => companyData![k as keyof CompanyEnrichment] != null
        ).length,
        creditsUsed,
      });

      return {
        success: true,
        data: companyData,
        creditsUsed,
        cached: false,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { success: false, error: 'Request aborted' };
      }

      log.error('Icypeas enrichment failed', {
        company: companyName || companyLinkedInUrl || companyDomain,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Icypeas enrichment failed',
      };
    }
  }

  /**
   * Enrich a single job
   */
  async enrichJob(job: Job, options?: EnrichmentOptions): Promise<EnrichedJob> {
    const enrichCompanyOptions: EnrichCompanyOptions = {
      companyLinkedInUrl: job.companyLinkedIn,
      companyDomain: job.companyUrl,
      companyName: job.company,
    };

    const result = await this.enrichCompany(enrichCompanyOptions);

    if (!result.success || !result.data) {
      log.warn('Failed to enrich job via Icypeas', {
        job: job.id,
        company: job.company,
        error: result.error,
      });

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
   * Batch enrich multiple jobs with rate limiting
   */
  async enrichJobs(jobs: Job[], options?: EnrichmentOptions): Promise<EnrichedJob[]> {
    const concurrency = options?.concurrency ?? BATCH_CONCURRENCY;
    const delayMs = options?.delayMs ?? BATCH_DELAY_MS;
    const { onProgress } = options || {};

    const results: EnrichedJob[] = [];
    let completed = 0;

    log.info('Starting batch Icypeas enrichment', {
      totalJobs: jobs.length,
      concurrency,
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

      if (i + concurrency < jobs.length) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    const successCount = results.filter((r) => r.companyData).length;
    log.info('Batch Icypeas enrichment complete', {
      total: jobs.length,
      enriched: successCount,
      failed: jobs.length - successCount,
    });

    return results;
  }

  /**
   * Find a professional email for a person at a company.
   * Returns the best email found (highest certainty).
   *
   * Cost: 1 credit per email found
   */
  async findEmail(
    firstname: string,
    lastname: string,
    domainOrCompany: string,
    signal?: AbortSignal
  ): Promise<{ email: string; certainty: number } | null> {
    const response = await fetch(`${API_BASE_URL}/email-search`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ firstname, lastname, domainOrCompany }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Icypeas email-search error: ${response.status}`);
    }

    const data: IcypeasSearchResult = await response.json();

    if (!data.success) {
      return null;
    }

    // If status is not DEBITED, poll for results
    if (data.item.status !== 'DEBITED') {
      const result = await this.pollForResult(data.item._id, signal);
      if (!result?.item?.emails?.length) return null;

      // Return highest certainty email
      const best = result.item.emails.sort(
        (a, b) => (b.certainty ?? 0) - (a.certainty ?? 0)
      )[0];
      return { email: best.email, certainty: best.certainty };
    }

    // Result was immediate
    if (!data.item.emails?.length) return null;

    const best = data.item.emails.sort(
      (a, b) => (b.certainty ?? 0) - (a.certainty ?? 0)
    )[0];
    return { email: best.email, certainty: best.certainty };
  }

  /**
   * Scrape company data from a LinkedIn company URL.
   *
   * Cost: 0.5 credits per company
   */
  private async scrapeCompany(
    linkedInUrl: string,
    signal?: AbortSignal
  ): Promise<IcypeasCompanyData | null> {
    const url = `${API_BASE_URL}/scrape/company?url=${encodeURIComponent(linkedInUrl)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
      signal,
    });

    if (!response.ok) {
      if (response.status === 404) {
        log.warn(`Company not found on Icypeas: ${linkedInUrl}`);
        return null;
      }
      throw new Error(`Icypeas company scrape error: ${response.status}`);
    }

    const data = await response.json();
    return data as IcypeasCompanyData;
  }

  /**
   * Search for emails at a domain.
   *
   * Cost: 1 credit per domain (when emails found)
   */
  private async searchDomain(
    domainOrCompany: string,
    signal?: AbortSignal
  ): Promise<IcypeasSearchResult | null> {
    const response = await fetch(`${API_BASE_URL}/domain-search`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ domainOrCompany }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Icypeas domain-search error: ${response.status}`);
    }

    const data: IcypeasSearchResult = await response.json();

    if (!data.success) return null;

    if (data.item.status !== 'DEBITED') {
      return this.pollForResult(data.item._id, signal);
    }

    return data;
  }

  /**
   * Poll Icypeas async search until status is DEBITED (complete)
   */
  private async pollForResult(
    searchId: string,
    signal?: AbortSignal
  ): Promise<IcypeasSearchResult | null> {
    for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

      if (signal?.aborted) return null;

      const response = await fetch(`${API_BASE_URL}/bulk-single-searchs/read`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          mode: 'single',
          id: searchId,
          limit: 1,
          next: false,
        }),
        signal,
      });

      if (!response.ok) {
        log.warn(`Poll attempt ${attempt + 1} failed: ${response.status}`);
        continue;
      }

      const data: IcypeasSearchResult = await response.json();

      if (data.item?.status === 'DEBITED') {
        return data;
      }

      if (attempt % 5 === 0 && attempt > 0) {
        log.info(`Polling search ${searchId}: attempt ${attempt + 1}, status: ${data.item?.status}`);
      }
    }

    log.warn(`Polling timed out for search ${searchId}`);
    return null;
  }

  /**
   * Transform Icypeas company scrape response to CompanyEnrichment
   */
  private transformCompanyData(raw: IcypeasCompanyData): CompanyEnrichment {
    return {
      linkedInCompanyUrl: raw.linkedInUrl,

      // Firmographic
      employeeCount: raw.employeeCount,
      employeeCountRange: this.normalizeEmployeeRange(raw.employeeCountRange),
      industry: raw.industry,
      founded: raw.founded,
      foundedYear: raw.founded,
      companyType: raw.type,

      // Location
      headquarters: raw.headquarter,

      // Contact & web
      description: raw.description,
      tagline: raw.tagline,
      website: raw.website,
      phone: raw.phone,
      specialties: raw.specialties,

      // Metadata
      enrichedAt: new Date(),
      source: 'icypeas',
    };
  }

  /**
   * Normalize employee count range strings to our CompanySizeRange type
   */
  private normalizeEmployeeRange(
    range: string | undefined
  ): CompanyEnrichment['employeeCountRange'] {
    if (!range) return undefined;

    // Map common formats to our standard ranges
    const normalized = range.replace(/\s/g, '').replace(/,/g, '');

    const rangeMap: Record<string, CompanyEnrichment['employeeCountRange']> = {
      '1-10': '1-10',
      '2-10': '1-10',
      '11-50': '11-50',
      '51-200': '51-200',
      '201-500': '201-500',
      '501-1000': '501-1000',
      '1001-5000': '1001-5000',
      '5001-10000': '5001-10000',
      '10001+': '10001+',
      '10001-50000': '10001+',
      '50001+': '10001+',
    };

    return rangeMap[normalized] || undefined;
  }
}
