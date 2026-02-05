/**
 * DataSource Provider Factory
 *
 * Returns the configured data source provider.
 * Change PROVIDER_TYPE env var to switch implementations.
 */

import type { DataSourceProvider } from './types';
import { ApifyDataSource } from './apify';
import { MockDataSource } from './mock';

export type DataSourceType = 'apify' | 'captain-data' | 'mock';

const providers: Record<DataSourceType, () => DataSourceProvider> = {
  apify: () => new ApifyDataSource(),
  'captain-data': () => {
    // Phase 2: Implement Captain Data provider
    throw new Error('Captain Data provider not yet implemented');
  },
  mock: () => new MockDataSource(),
};

let instance: DataSourceProvider | null = null;

export function getDataSourceProvider(): DataSourceProvider {
  if (instance) return instance;

  const type = (process.env.NEXT_PUBLIC_DATA_SOURCE || 'apify') as DataSourceType;

  if (!providers[type]) {
    throw new Error(`Unknown data source provider: ${type}`);
  }

  instance = providers[type]();
  return instance;
}

export { type DataSourceProvider } from './types';
