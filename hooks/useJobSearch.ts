'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import type { Job } from '@/types';
import { AUTO_REFRESH_CONFIG } from '@/types';
import type { ScrapeOptions } from '@/lib/providers/data-source/types';
import { postProcessJobs, applyClientFilters, applySorting } from '@/lib/pipeline/post-process';
import { useFilterStore } from '@/stores/useFilterStore';
import { useJobCache } from '@/hooks/useJobCache';
import { transformApifyJob } from '@/lib/utils/transform-job';

export interface UseJobSearchReturn {
  jobs: Job[];
  rawJobs: Job[];
  isLoading: boolean;
  isRefreshing: boolean;
  isError: boolean;
  error: Error | null;
  search: (query: string, options?: Partial<Omit<ScrapeOptions, 'jobTitle'>>) => void;
  cancel: () => void;
  reset: () => void;
  lastSearch: { query: string; timestamp: Date } | null;
  streamProgress: { found: number; status: string } | null;
}

const POLL_INTERVAL = 3000;
const MAX_POLL_RETRIES = 3;

export function useJobSearch(): UseJobSearchReturn {
  const { getCachedResults, setCachedResults } = useJobCache();
  const excludeRecruiters = useFilterStore((s) => s.excludeRecruiters);
  const excludeCompanies = useFilterStore((s) => s.excludeCompanies);
  const companySizes = useFilterStore((s) => s.companySizes);
  const autoRefreshInterval = useFilterStore((s) => s.autoRefreshInterval);
  const sortBy = useFilterStore((s) => s.sortBy);
  const matchMode = useFilterStore((s) => s.matchMode);

  const [rawJobs, setRawJobs] = useState<Job[]>(() => {
    const cached = getCachedResults();
    return cached?.jobs || [];
  });
  const [lastSearch, setLastSearch] = useState<{ query: string; timestamp: Date } | null>(() => {
    const cached = getCachedResults();
    return cached ? { query: cached.query, timestamp: new Date(cached.timestamp) } : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [streamProgress, setStreamProgress] = useState<{ found: number; status: string } | null>(null);

  const abortRef = useRef(false);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastOptionsRef = useRef<ScrapeOptions | null>(null);

  const existingDedupeKeys = useMemo(() => {
    return new Set(rawJobs.map((j) => j.dedupeKey).filter(Boolean) as string[]);
  }, [rawJobs]);

  const stopPolling = useCallback(() => {
    abortRef.current = true;
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const search = useCallback(
    async (query: string, options?: Partial<Omit<ScrapeOptions, 'jobTitle'>>) => {
      if (!query.trim()) return;

      // Stop any existing polling
      stopPolling();
      abortRef.current = false;

      const scrapeOptions: ScrapeOptions = {
        jobTitle: query.trim(),
        maxResults: options?.maxResults ?? 150,
        location: options?.location,
        dateRange: options?.dateRange,
        companySizes: options?.companySizes,
        excludeRecruiters: options?.excludeRecruiters,
        excludeCompanies: options?.excludeCompanies,
      };

      lastOptionsRef.current = scrapeOptions;
      setIsLoading(true);
      setError(null);
      setRawJobs([]);
      setStreamProgress({ found: 0, status: 'Starting search...' });
      setLastSearch({ query: query.trim(), timestamp: new Date() });

      try {
        // Phase 1: Start the run
        const startRes = await fetch('/api/jobs/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...scrapeOptions, action: 'start' }),
        });

        if (!startRes.ok) {
          const errData = await startRes.json().catch(() => ({}));
          throw new Error(errData.error || `Search failed: ${startRes.status}`);
        }

        const { runId, datasetId } = await startRes.json();

        if (abortRef.current) return;

        // Phase 2: Poll for results
        let offset = 0;
        let allJobs: Job[] = [];
        let consecutiveErrors = 0;

        const poll = async () => {
          if (abortRef.current) return;

          try {
            const pollRes = await fetch('/api/jobs/scrape', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'poll', runId, datasetId, offset }),
            });

            if (!pollRes.ok) {
              // Retry on transient errors instead of failing immediately
              consecutiveErrors++;
              if (consecutiveErrors <= MAX_POLL_RETRIES) {
                setStreamProgress({
                  found: allJobs.length,
                  status: `Reconnecting... (attempt ${consecutiveErrors}/${MAX_POLL_RETRIES})`,
                });
                pollTimerRef.current = setTimeout(poll, POLL_INTERVAL * 2);
                return;
              }
              throw new Error(`Search failed after ${MAX_POLL_RETRIES} retries (status: ${pollRes.status})`);
            }

            // Reset error count on success
            consecutiveErrors = 0;

            const data = await pollRes.json();

            if (abortRef.current) return;

            // Transform and append new jobs
            if (data.newCount > 0) {
              const newJobs = data.jobs.map((item: Record<string, unknown>) => transformApifyJob(item));
              const processed = postProcessJobs(newJobs, {
                excludeRecruiters: false,
                excludeCompanies: [],
                companySizes: [],
                existingDedupeKeys,
              });
              allJobs = [...allJobs, ...processed];
              offset = data.offset;

              setRawJobs([...allJobs]);
              setStreamProgress({ found: allJobs.length, status: 'Scanning LinkedIn...' });
            }

            // Check if done
            if (data.status === 'SUCCEEDED') {
              setIsLoading(false);
              setIsRefreshing(false);
              setStreamProgress(null);
              setCachedResults(allJobs, query.trim());
              return;
            }

            if (data.status === 'FAILED') {
              throw new Error('Apify run failed');
            }

            // Continue polling
            pollTimerRef.current = setTimeout(poll, POLL_INTERVAL);
          } catch (err) {
            if (!abortRef.current) {
              setError(err instanceof Error ? err : new Error('Unknown error'));
              setIsLoading(false);
              setStreamProgress(null);
            }
          }
        };

        // Start first poll after a short delay
        pollTimerRef.current = setTimeout(poll, 3000);
      } catch (err) {
        if (!abortRef.current) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
          setIsLoading(false);
          setStreamProgress(null);
        }
      }
    },
    [stopPolling, existingDedupeKeys, setCachedResults]
  );

  const cancel = useCallback(() => {
    stopPolling();
    setIsLoading(false);
    setIsRefreshing(false);
    setStreamProgress(null);
  }, [stopPolling]);

  const reset = useCallback(() => {
    stopPolling();
    setRawJobs([]);
    setLastSearch(null);
    setIsLoading(false);
    setError(null);
    setStreamProgress(null);
  }, [stopPolling]);

  // Auto-refresh timer
  useEffect(() => {
    const config = AUTO_REFRESH_CONFIG[autoRefreshInterval];
    if (!config.ms || !lastSearch || !lastOptionsRef.current) return;

    const timer = setInterval(() => {
      setIsRefreshing(true);
      const opts = lastOptionsRef.current!;
      search(opts.jobTitle, opts);
    }, config.ms);

    return () => clearInterval(timer);
  }, [autoRefreshInterval, lastSearch, search]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  // Derive display jobs: filter then sort
  const jobs = useMemo(() => {
    const filtered = applyClientFilters(rawJobs, {
      excludeRecruiters,
      excludeCompanies,
      companySizes,
      matchMode,
      searchQuery: lastSearch?.query,
    });
    return applySorting(filtered, sortBy, lastSearch?.query);
  }, [rawJobs, excludeRecruiters, excludeCompanies, companySizes, matchMode, sortBy, lastSearch?.query]);

  return {
    jobs,
    rawJobs,
    isLoading,
    isRefreshing,
    isError: !!error,
    error,
    search,
    cancel,
    reset,
    lastSearch,
    streamProgress,
  };
}
