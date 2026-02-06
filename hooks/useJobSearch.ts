'use client';

import { useState, useCallback, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { Job } from '@/types';
import type { ScrapeOptions, ScrapeResult } from '@/lib/providers/data-source/types';

export interface UseJobSearchReturn {
  jobs: Job[];
  isLoading: boolean;
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
  const [jobs, setJobs] = useState<Job[]>([]);
  const [lastSearch, setLastSearch] = useState<{ query: string; timestamp: Date } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const searchMutation = useMutation({
    mutationFn: async (options: ScrapeOptions) => {
      // Cancel any in-flight request
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      return searchJobs(options, abortControllerRef.current.signal);
    },
    onSuccess: (result, variables) => {
      setJobs(result.jobs);
      setLastSearch({ query: variables.jobTitle, timestamp: new Date() });
    },
    onError: (error) => {
      // Don't treat abort as an error
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      // Keep previous jobs on error so user can see what they had
    },
  });

  const search = useCallback(
    (query: string, options?: Partial<Omit<ScrapeOptions, 'jobTitle'>>) => {
      if (!query.trim()) return;

      searchMutation.mutate({
        jobTitle: query.trim(),
        maxResults: options?.maxResults ?? 50,
        location: options?.location,
        dateRange: options?.dateRange,
      });
    },
    [searchMutation]
  );

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    searchMutation.reset();
  }, [searchMutation]);

  const reset = useCallback(() => {
    setJobs([]);
    setLastSearch(null);
    searchMutation.reset();
  }, [searchMutation]);

  return {
    jobs,
    isLoading: searchMutation.isPending,
    isError: searchMutation.isError,
    error: searchMutation.error as Error | null,
    search,
    cancel,
    reset,
    lastSearch,
  };
}
