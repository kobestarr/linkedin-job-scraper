/**
 * Storage Provider Factory
 */

import type { StorageProvider } from './types';
import { LocalStorageProvider } from './local-storage';

export type StorageType = 'local' | 'supabase';

const providers: Record<StorageType, () => StorageProvider> = {
  local: () => new LocalStorageProvider(),
  supabase: () => {
    // Phase 2: Implement Supabase provider
    throw new Error('Supabase storage provider not yet implemented');
  },
};

let instance: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (instance) return instance;

  const type = (process.env.NEXT_PUBLIC_STORAGE || 'local') as StorageType;

  if (!providers[type]) {
    throw new Error(`Unknown storage provider: ${type}`);
  }

  instance = providers[type]();
  return instance;
}

export { type StorageProvider } from './types';
