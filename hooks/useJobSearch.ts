'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { Job } from '@/types';
import { AUTO_REFRESH_CONFIG } from '@/types';
import type { ScrapeOptions, ScrapeResult } from '@/lib/providers/data-source/types';
import { postProcessJobs, applyClientFilters, applySorting } from '@/lib/pipeline/post-process';
import { useFilterStore } from '@/stores/useFilterStore';
import { useJobCache } from '@/hooks/useJobCache';

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
}

async function searchJobs(
  options: ScrapeOptions,
  signal?: AbortSignal
): Promise<ScrapeResult> {
  const response = await fetch('/api/jobs/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Search failed: ${response.status}`);
  }

  return response.json();
}

export function useJobSearch(): UseJobSearchReturn {
  const { getCachedResults, setCachedResults } = useJobCache();
  const excludeRecruiters = useFilterStore((s) => s.excludeRecruiters);
  const excludeCompanies = useFilterStore((s) => s.excludeCompanies);
  const companySizes = useFilterStore((s) => s.companySizes);
  const autoRefreshInterval = useFilterStore((s) => s.autoRefreshInterval);
  const sortBy = useFilterStore((s) => s.sortBy);
  const mustContainKeywords = useFilterStore((s) => s.mustContainKeywords);

  // Initialize from cache
  const [rawJobs, setRawJobs] = useState<Job[]>(() => {
    const cached = getCachedResults();
    return cached?.jobs || [];
  });
  const [lastSearch, setLastSearch] = useState<{ query: string; timestamp: Date } | null>(() => {
    const cached = getCachedResults();
    return cached ? { query: cached.query, timestamp: new Date(cached.timestamp) } : null;
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastOptionsRef = useRef<ScrapeOptions | null>(null);

  // Collect existing dedupeKeys for repeat hiring detection
  const existingDedupeKeys = useMemo(() => {
    return new Set(rawJobs.map((j) => j.dedupeKey).filter(Boolean) as string[]);
  }, [rawJobs]);

  const searchMutation = useMutation({
    mutationFn: async (options: ScrapeOptions) => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();
      return searchJobs(options, abortControllerRef.current.signal);
    },
    onSuccess: (result, variables) => {
      const processed = postProcessJobs(result.jobs, {
        excludeRecruiters: false,
        excludeCompanies: [],
        companySizes: [],
        existingDedupeKeys,
      });

      setRawJobs(processed);
      setLastSearch({ query: variables.jobTitle, timestamp: new Date() });
      setIsRefreshing(false);
      setCachedResults(processed, variables.jobTitle);
    },
    onError: (error) => {
      setIsRefreshing(false);
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
    },
  });

  const search = useCallback(
    (query: string, options?: Partial<Omit<ScrapeOptions, 'jobTitle'>>) => {
      if (!query.trim()) return;

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
      searchMutation.mutate(scrapeOptions);
    },
    [searchMutation]
  );

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    searchMutation.reset();
    setIsRefreshing(false);
  }, [searchMutation]);

  const reset = useCallback(() => {
    setRawJobs([]);
    setLastSearch(null);
    searchMutation.reset();
  }, [searchMutation]);

  // Auto-refresh timer
  useEffect(() => {
    const config = AUTO_REFRESH_CONFIG[autoRefreshInterval];
    if (!config.ms || !lastSearch || !lastOptionsRef.current) return;

    const timer = setInterval(() => {
      setIsRefreshing(true);
      searchMutation.mutate(lastOptionsRef.current!);
    }, config.ms);

    return () => clearInterval(timer);
  }, [autoRefreshInterval, lastSearch, searchMutation]);

  // Derive display jobs: filter then sort
  const jobs = useMemo(() => {
    const filtered = applyClientFilters(rawJobs, {
      excludeRecruiters,
      excludeCompanies,
      companySizes,
      mustContainKeywords,
      searchQuery: lastSearch?.query,
    });
    return applySorting(filtered, sortBy, lastSearch?.query);
  }, [rawJobs, excludeRecruiters, excludeCompanies, companySizes, mustContainKeywords, sortBy, lastSearch?.query]);

  return {
    jobs,
    rawJobs,
    isLoading: searchMutation.isPending && !isRefreshing,
    isRefreshing,
    isError: searchMutation.isError,
    error: searchMutation.error as Error | null,
    search,
    cancel,
    reset,
    lastSearch,
  };
}
