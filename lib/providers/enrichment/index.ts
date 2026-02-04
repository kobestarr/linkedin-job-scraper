/**
 * Enrichment Provider Factory
 */

import type { EnrichmentProvider } from './types';
import { NoopEnrichmentProvider } from './noop';

export type EnrichmentType = 'none' | 'captain-data' | 'clay';

const providers: Record<EnrichmentType, () => EnrichmentProvider> = {
  none: () => new NoopEnrichmentProvider(),
  'captain-data': () => {
    // Phase 2: Implement Captain Data provider
    throw new Error('Captain Data enrichment provider not yet implemented');
  },
  clay: () => {
    // Phase 2: Implement Clay provider
    throw new Error('Clay enrichment provider not yet implemented');
  },
};

let instance: EnrichmentProvider | null = null;

export function getEnrichmentProvider(): EnrichmentProvider {
  if (instance) return instance;

  const type = (process.env.NEXT_PUBLIC_ENRICHMENT || 'none') as EnrichmentType;

  if (!providers[type]) {
    throw new Error(`Unknown enrichment provider: ${type}`);
  }

  instance = providers[type]();
  return instance;
}

export { type EnrichmentProvider, type EnrichedJob, type EnrichmentOptions } from './types';
