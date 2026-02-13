/**
 * Mock Enrichment Provider
 *
 * Returns fake enrichment data for development/testing without consuming API credits.
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

export class MockEnrichment implements EnrichmentProvider {
  readonly id = 'mock';
  readonly name = 'Mock Enrichment (Development)';

  async isConfigured(): Promise<boolean> {
    return true; // Mock is always configured
  }

  async getCredits(): Promise<{ remaining: number; total: number } | null> {
    return {
      remaining: 9999,
      total: 10000,
    };
  }

  /**
   * Generate realistic mock company data based on company name
   */
  async enrichCompany(
    options: EnrichCompanyOptions,
    signal?: AbortSignal
  ): Promise<EnrichCompanyResult> {
    const { companyName, companyLinkedInUrl, companyDomain } = options;

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (signal?.aborted) {
      return {
        success: false,
        error: 'Request aborted',
      };
    }

    const name = companyName || 'Unknown Company';
    const data = this.generateMockCompanyData(name, companyLinkedInUrl, companyDomain);

    logger.info('[MockEnrichment] Generated mock enrichment', { company: name });

    return {
      success: true,
      data,
      creditsUsed: 0, // Mock doesn't consume credits
      cached: false,
    };
  }

  async enrichJob(job: Job, options?: EnrichmentOptions): Promise<EnrichedJob> {
    const enrichCompanyOptions: EnrichCompanyOptions = {
      companyLinkedInUrl: job.companyLinkedIn,
      companyName: job.company,
      companyDomain: job.companyUrl,
    };

    const result = await this.enrichCompany(enrichCompanyOptions);

    return {
      ...job,
      enriched: true,
      companyData: result.data,
      enrichedAt: new Date().toISOString(),
    };
  }

  async enrichJobs(jobs: Job[], options?: EnrichmentOptions): Promise<EnrichedJob[]> {
    const { onProgress } = options || {};

    logger.info('[MockEnrichment] Batch enriching jobs', { count: jobs.length });

    const results: EnrichedJob[] = [];

    for (let i = 0; i < jobs.length; i++) {
      const enriched = await this.enrichJob(jobs[i], options);
      results.push(enriched);

      if (onProgress) {
        onProgress(i + 1, jobs.length);
      }
    }

    return results;
  }

  /**
   * Generate realistic mock company data
   */
  private generateMockCompanyData(
    companyName: string,
    linkedInUrl?: string,
    domain?: string
  ): CompanyEnrichment {
    // Deterministic pseudo-random based on company name
    const hash = companyName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    // Company sizes (deterministic but varied)
    const sizes: CompanySizeRange[] = [
      '1-10',
      '11-50',
      '51-200',
      '201-500',
      '501-1000',
      '1001-5000',
      '5001-10000',
      '10001+',
    ];
    const sizeIndex = hash % sizes.length;
    const employeeCountRange = sizes[sizeIndex];

    // Industries
    const industries = [
      'Computer Software',
      'Financial Services',
      'Marketing and Advertising',
      'Information Technology and Services',
      'Internet',
      'Telecommunications',
      'Health Care',
      'Retail',
      'Consulting',
      'E-Learning',
    ];
    const industryIndex = hash % industries.length;

    // Funding stages
    const fundingStages = ['Seed', 'Series A', 'Series B', 'Series C', 'Series D+', 'Public', 'Bootstrapped'];
    const fundingIndex = hash % fundingStages.length;

    // Revenue ranges (correlate with company size)
    const revenueRanges = [
      '$1M-$10M',
      '$10M-$50M',
      '$50M-$100M',
      '$100M-$500M',
      '$500M-$1B',
      '$1B+',
    ];
    const revenueIndex = Math.min(Math.floor(sizeIndex / 2), revenueRanges.length - 1);

    // Tech stacks (sample)
    const techStacks = [
      ['React', 'Node.js', 'PostgreSQL', 'AWS'],
      ['Vue.js', 'Python', 'MongoDB', 'Google Cloud'],
      ['Angular', 'Java', 'MySQL', 'Azure'],
      ['Next.js', 'TypeScript', 'Redis', 'Vercel'],
      ['Svelte', 'Go', 'DynamoDB', 'Cloudflare'],
    ];
    const techIndex = hash % techStacks.length;

    return {
      uid: companyName.toLowerCase().replace(/\s+/g, '-'),
      linkedInCompanyUrl: linkedInUrl,
      linkedInCompanyId: 10000 + hash,

      employeeCountRange,
      employeeCount: this.parseEmployeeCount(employeeCountRange),

      industry: industries[industryIndex],
      category: industries[industryIndex],
      foundedYear: 2000 + (hash % 24), // 2000-2024
      founded: 2000 + (hash % 24),

      headquarters: hash % 2 === 0 ? 'San Francisco, CA' : 'New York, NY',
      locations: ['San Francisco, CA', 'New York, NY', 'Austin, TX'].slice(0, (hash % 3) + 1),

      description: `${companyName} is a leading company in the ${industries[industryIndex]} industry. We're building innovative solutions that transform how businesses operate.`,
      tagline: `Transforming ${industries[industryIndex]}`,
      website: domain || `https://${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
      phone: `+1-555-${String(hash).padStart(4, '0')}`,
      specialties: ['Innovation', 'Technology', 'Growth'],

      fundingStage: fundingStages[fundingIndex],
      revenueRange: revenueRanges[revenueIndex],
      revenue: revenueRanges[revenueIndex],

      techStack: techStacks[techIndex],
      technologies: techStacks[techIndex],

      enrichedAt: new Date(),
      source: 'mock',
    };
  }

  /**
   * Parse employee count range to numeric value (use midpoint of range)
   */
  private parseEmployeeCount(range: CompanySizeRange): number {
    const rangeMap: Record<CompanySizeRange, number> = {
      '1-10': 5,
      '11-50': 30,
      '51-200': 125,
      '201-500': 350,
      '501-1000': 750,
      '1001-5000': 3000,
      '5001-10000': 7500,
      '10001+': 15000,
    };

    return rangeMap[range];
  }
}
