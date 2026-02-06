'use client';

import { useCallback } from 'react';
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
    } catch {
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
      if (serialized.length > 4 * 1024 * 1024) return;
      localStorage.setItem(CACHE_KEY, serialized);
    } catch {
      // Silently fail on quota errors
    }
  }, []);

  return { getCachedResults, setCachedResults };
}
