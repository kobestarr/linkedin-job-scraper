/**
 * Crawl4AI Enrichment Provider
 *
 * Uses Crawl4AI Docker sidecar to crawl company websites and extract
 * structured data (description, tech stack, team info, etc.).
 *
 * Pipeline position: Icypeas (find) → Reoon (verify) → **Crawl4AI (deep data)** → store
 *
 * Crawl4AI REST API:
 *   POST /crawl — crawl a URL, returns markdown + extracted content
 *   GET  /health — health check
 *
 * Docker: unclecode/crawl4ai:latest on port 11235
 * No API credits — completely free, self-hosted.
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

const DEFAULT_BASE_URL = 'http://localhost:11235';
const REQUEST_TIMEOUT_MS = 30000;
const BATCH_CONCURRENCY = 3; // Conservative — each crawl spawns a browser
const BATCH_DELAY_MS = 500;

const log = logger.child({ context: 'crawl4ai-enrichment' });

/**
 * Crawl4AI REST API response shape
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface CrawlResult {
  url: string;
  html: string;
  cleaned_html: string;
  markdown: string;
  extracted_content: string | null;
  media: Array<{ src: string; alt?: string }>;
  links: string[];
  success: boolean;
  status_code: number;
  error_message: string | null;
}

/**
 * Extract company description from markdown content.
 * Looks for About/Mission/Who We Are sections.
 */
function extractDescription(markdown: string): string | undefined {
  // Match common "About" section headers and grab the following paragraph(s)
  const aboutPattern = /#{1,3}\s*(?:about\s*(?:us)?|who\s+we\s+are|our\s+(?:mission|story|company))\s*\n+([\s\S]*?)(?=\n#{1,3}\s|\n---|\n\*\*\*|$)/i;
  const match = markdown.match(aboutPattern);

  if (match?.[1]) {
    // Clean up: take first ~500 chars, trim to last complete sentence
    const raw = match[1].trim().replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // strip markdown links
    const truncated = raw.slice(0, 500);
    const lastSentence = truncated.lastIndexOf('.');
    return lastSentence > 100 ? truncated.slice(0, lastSentence + 1) : truncated;
  }

  // Fallback: use first substantial paragraph (>80 chars) from the page
  const paragraphs = markdown
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 80 && !p.startsWith('#') && !p.startsWith('|'));

  if (paragraphs[0]) {
    const raw = paragraphs[0].replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    return raw.slice(0, 500);
  }

  return undefined;
}

/**
 * Extract technology keywords from markdown content.
 * Looks for common tech terms in text.
 */
function extractTechnologies(markdown: string): string[] {
  const techKeywords = [
    // Languages
    'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'Ruby',
    'PHP', 'C\\+\\+', 'C#', 'Swift', 'Kotlin', 'Scala', 'Elixir',
    // Frontend
    'React', 'Angular', 'Vue\\.js', 'Next\\.js', 'Svelte', 'Tailwind',
    // Backend
    'Node\\.js', 'Django', 'Flask', 'Spring', 'Rails', 'Express',
    'FastAPI', 'GraphQL', 'REST API',
    // Cloud & Infra
    'AWS', 'Azure', 'Google Cloud', 'GCP', 'Kubernetes', 'Docker',
    'Terraform', 'Vercel', 'Netlify', 'Heroku',
    // Data
    'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch', 'MySQL',
    'DynamoDB', 'Snowflake', 'BigQuery', 'Kafka', 'RabbitMQ',
    // AI/ML
    'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch',
    'OpenAI', 'LLM', 'GPT', 'Computer Vision', 'NLP',
    // Other
    'Blockchain', 'IoT', 'Microservices', 'CI/CD', 'DevOps',
    'Agile', 'SaaS', 'API',
  ];

  const found = new Set<string>();
  const lowerMarkdown = markdown.toLowerCase();

  for (const keyword of techKeywords) {
    const pattern = new RegExp(`\\b${keyword}\\b`, 'i');
    if (pattern.test(markdown)) {
      // Use the canonical casing from our keyword list
      const clean = keyword.replace(/\\\+/g, '+').replace(/\\\./g, '.');
      found.add(clean);
    }
  }

  return Array.from(found);
}

/**
 * Extract phone numbers from markdown content.
 */
function extractPhone(markdown: string): string | undefined {
  const phonePattern = /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/;
  const match = markdown.match(phonePattern);
  return match?.[0]?.trim();
}

/**
 * Extract a tagline — typically the first short line or meta description.
 */
function extractTagline(markdown: string): string | undefined {
  const lines = markdown.split('\n').filter((l) => l.trim().length > 0);

  // Look for a short line (20-150 chars) near the top that isn't a heading
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i].trim();
    if (
      line.length >= 20 &&
      line.length <= 150 &&
      !line.startsWith('#') &&
      !line.startsWith('[') &&
      !line.startsWith('|') &&
      !line.startsWith('*')
    ) {
      return line.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    }
  }

  return undefined;
}

/**
 * Extract specialties/focus areas from the page content.
 */
function extractSpecialties(markdown: string): string[] | undefined {
  // Look for bulleted lists under "Services", "Solutions", "What we do", "Specialties"
  const sectionPattern = /#{1,3}\s*(?:services|solutions|what\s+we\s+do|specialties|capabilities|expertise)\s*\n+([\s\S]*?)(?=\n#{1,3}\s|\n---|\n\*\*\*|$)/i;
  const match = markdown.match(sectionPattern);

  if (match?.[1]) {
    const items = match[1]
      .split('\n')
      .map((line) => line.replace(/^[-*•]\s*/, '').trim())
      .filter((line) => line.length > 2 && line.length < 100);

    if (items.length > 0) {
      return items.slice(0, 10);
    }
  }

  return undefined;
}

/**
 * Try to extract headquarters / location from page content.
 */
function extractHeadquarters(markdown: string): string | undefined {
  // Common patterns: "Based in <City>", "Headquartered in <City>", address-like patterns
  const patterns = [
    /(?:based|headquartered|located)\s+in\s+([A-Z][a-zA-Z\s,]+(?:,\s*[A-Z]{2})?)/i,
    /(?:headquarters?|office|address)\s*[:]\s*([A-Z][a-zA-Z0-9\s,]+(?:,\s*[A-Z]{2})?)/i,
  ];

  for (const pattern of patterns) {
    const match = markdown.match(pattern);
    if (match?.[1]) {
      const location = match[1].trim();
      if (location.length > 3 && location.length < 100) {
        return location;
      }
    }
  }

  return undefined;
}

export class Crawl4AIEnrichment implements EnrichmentProvider {
  readonly id = 'crawl4ai';
  readonly name = 'Crawl4AI';

  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.CRAWL4AI_BASE_URL || DEFAULT_BASE_URL;
  }

  async isConfigured(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async getCredits(): Promise<{ remaining: number; total: number } | null> {
    // Crawl4AI is free — no credit system
    return null;
  }

  /**
   * Crawl a company website and extract enrichment data
   */
  async enrichCompany(
    options: EnrichCompanyOptions,
    signal?: AbortSignal
  ): Promise<EnrichCompanyResult> {
    const url = options.companyDomain || options.companyLinkedInUrl;

    if (!url) {
      return {
        success: false,
        error: 'companyDomain or companyLinkedInUrl is required for Crawl4AI',
      };
    }

    // Normalize URL — ensure it has a protocol
    const crawlUrl = url.startsWith('http') ? url : `https://${url}`;

    try {
      log.info(`Crawling company website: ${crawlUrl}`);

      const crawlResult = await this.crawl(crawlUrl, signal);

      if (!crawlResult.success) {
        return {
          success: false,
          error: crawlResult.error_message || `Crawl failed with status ${crawlResult.status_code}`,
        };
      }

      const enrichment = this.extractCompanyData(crawlResult, crawlUrl);

      log.info(`Enriched ${options.companyName || crawlUrl}: ${Object.keys(enrichment).filter((k) => enrichment[k as keyof CompanyEnrichment] != null).length} fields`);

      return {
        success: true,
        data: enrichment,
        creditsUsed: 0, // Free
        cached: false,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return { success: false, error: 'Request aborted' };
      }

      log.error('Crawl4AI enrichment failed', {
        url: crawlUrl,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Crawl4AI enrichment failed',
      };
    }
  }

  /**
   * Enrich a single job with crawled company data
   */
  async enrichJob(job: Job, options?: EnrichmentOptions): Promise<EnrichedJob> {
    const enrichCompanyOptions: EnrichCompanyOptions = {
      companyDomain: job.companyUrl,
      companyLinkedInUrl: job.companyLinkedIn,
      companyName: job.company,
    };

    const result = await this.enrichCompany(enrichCompanyOptions);

    if (!result.success || !result.data) {
      log.warn('Failed to enrich job via Crawl4AI', {
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
   * Batch enrich multiple jobs with concurrency control
   */
  async enrichJobs(jobs: Job[], options?: EnrichmentOptions): Promise<EnrichedJob[]> {
    const concurrency = options?.concurrency ?? BATCH_CONCURRENCY;
    const delayMs = options?.delayMs ?? BATCH_DELAY_MS;
    const { onProgress } = options || {};

    const results: EnrichedJob[] = [];
    let completed = 0;

    log.info('Starting batch Crawl4AI enrichment', {
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
    log.info('Batch Crawl4AI enrichment complete', {
      total: jobs.length,
      enriched: successCount,
      failed: jobs.length - successCount,
    });

    return results;
  }

  /**
   * Call Crawl4AI REST API to crawl a URL
   */
  private async crawl(url: string, signal?: AbortSignal): Promise<CrawlResult> {
    const apiToken = process.env.CRAWL4AI_API_TOKEN;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (apiToken) {
      headers['Authorization'] = `Bearer ${apiToken}`;
    }

    const response = await fetch(`${this.baseUrl}/crawl`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        urls: [url],
        browser_config: {
          headless: true,
          viewport_width: 1280,
          viewport_height: 720,
        },
        crawler_config: {
          cache_mode: 'ENABLED',
          wait_for: 'networkidle',
          remove_overlay_elements: true,
        },
      }),
      signal: signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Crawl4AI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Crawl4AI returns results array for multi-URL crawls
    if (Array.isArray(data)) {
      return data[0] as CrawlResult;
    }

    // Single result or wrapped response
    if (data.result) {
      return data.result as CrawlResult;
    }

    return data as CrawlResult;
  }

  /**
   * Extract structured company data from crawl results using regex patterns.
   * No LLM needed — parses the markdown output directly.
   */
  private extractCompanyData(result: CrawlResult, sourceUrl: string): CompanyEnrichment {
    const markdown = result.markdown || '';

    return {
      // Website info
      website: sourceUrl,
      linkedInCompanyUrl: sourceUrl.includes('linkedin.com') ? sourceUrl : undefined,

      // Extracted fields
      description: extractDescription(markdown),
      tagline: extractTagline(markdown),
      headquarters: extractHeadquarters(markdown),
      phone: extractPhone(markdown),
      specialties: extractSpecialties(markdown),

      // Technology detection
      technologies: extractTechnologies(markdown),
      techStack: extractTechnologies(markdown),

      // Metadata
      enrichedAt: new Date(),
      source: 'crawl4ai',
    };
  }
}
