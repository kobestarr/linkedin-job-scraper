/**
 * Enrichment Provider Factory
 *
 * Returns the configured enrichment provider.
 * Change NEXT_PUBLIC_ENRICHMENT env var to switch implementations.
 */

import type { EnrichmentProvider } from './types';
import { CaptainDataEnrichment } from './captain-data';
import { Crawl4AIEnrichment } from './crawl4ai';
import { IcypeasEnrichment } from './icypeas';
import { MockEnrichment } from './mock';

export type EnrichmentProviderType = 'captain-data' | 'crawl4ai' | 'icypeas' | 'mock' | 'none';

const providers: Record<
  Exclude<EnrichmentProviderType, 'none'>,
  () => EnrichmentProvider
> = {
  'captain-data': () => new CaptainDataEnrichment(),
  'crawl4ai': () => new Crawl4AIEnrichment(),
  'icypeas': () => new IcypeasEnrichment(),
  'mock': () => new MockEnrichment(),
};

let instance: EnrichmentProvider | null = null;

export function getEnrichmentProvider(): EnrichmentProvider | null {
  const type = (process.env.NEXT_PUBLIC_ENRICHMENT || 'none') as EnrichmentProviderType;

  // 'none' means no enrichment provider configured
  if (type === 'none') {
    return null;
  }

  // Return cached instance
  if (instance) return instance;

  if (!providers[type as keyof typeof providers]) {
    throw new Error(`Unknown enrichment provider: ${type}`);
  }

  instance = providers[type as keyof typeof providers]();
  return instance;
}

/**
 * Check if enrichment is enabled
 */
export function isEnrichmentEnabled(): boolean {
  const type = (process.env.NEXT_PUBLIC_ENRICHMENT || 'none') as EnrichmentProviderType;
  return type !== 'none';
}

export { type EnrichmentProvider } from './types';
export type {
  CompanyEnrichment,
  EnrichedJob,
  EnrichmentOptions,
  EnrichCompanyOptions,
  EnrichCompanyResult,
  CompanySizeRange,
} from './types';
