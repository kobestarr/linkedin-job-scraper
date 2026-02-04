/**
 * Provider Configuration
 *
 * Central configuration for all provider types.
 * Change these env vars to swap implementations.
 */

export const PROVIDER_CONFIG = {
  // Data source: 'apify' | 'captain-data' | 'mock'
  dataSource: process.env.NEXT_PUBLIC_DATA_SOURCE || 'apify',

  // Storage: 'local' | 'supabase'
  storage: process.env.NEXT_PUBLIC_STORAGE || 'local',

  // Enrichment: 'none' | 'captain-data' | 'clay'
  enrichment: process.env.NEXT_PUBLIC_ENRICHMENT || 'none',

  // Outreach: 'csv' | 'smartlead' | 'instantly'
  outreach: process.env.NEXT_PUBLIC_OUTREACH || 'csv',
} as const;

export type ProviderConfig = typeof PROVIDER_CONFIG;
