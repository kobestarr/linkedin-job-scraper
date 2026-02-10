'use client';

import { useCallback } from 'react';
import { logger } from '@/lib/logger';
import type { Job } from '@/types';

const CACHE_KEY = 'ljip_last_results';
const MAX_CACHED_JOBS = 200;

interface CachedResults {
  jobs: Job[];
  query: string;
  timestamp: string;
}

export function useJobCache() {
  const getCachedResults = useCallback((): CachedResults | null => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as CachedResults;
    } catch (err) {
      logger.warn('[useJobCache] Failed to parse cached results', { error: err });
      return null;
    }
  }, []);

  const setCachedResults = useCallback((jobs: Job[], query: string) => {
    if (typeof window === 'undefined') return;
    try {
      const data: CachedResults = {
        jobs: jobs.slice(0, MAX_CACHED_JOBS),
        query,
        timestamp: new Date().toISOString(),
      };
      const serialized = JSON.stringify(data);
      // Guard against localStorage quota (roughly 5MB)
      if (serialized.length > 4 * 1024 * 1024) {
        logger.warn('[useJobCache] Data too large to cache, skipping', { size: serialized.length });
        return;
      }
      localStorage.setItem(CACHE_KEY, serialized);
    } catch (err) {
      // Log quota errors but don't break the app
      logger.warn('[useJobCache] Failed to cache results', { error: err });
    }
  }, []);

  return { getCachedResults, setCachedResults };
}
