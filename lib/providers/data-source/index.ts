/**
 * DataSource Provider Factory
 *
 * Returns the configured data source provider.
 * Change PROVIDER_TYPE env var to switch implementations.
 */

import type { DataSourceProvider } from './types';
import { ApifyDataSource } from './apify';
import { MockDataSource } from './mock';

// Note: 'captain-data' will be added in Phase 2
export type DataSourceType = 'apify' | 'mock';

const providers: Record<DataSourceType, () => DataSourceProvider> = {
  apify: () => new ApifyDataSource(),
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
