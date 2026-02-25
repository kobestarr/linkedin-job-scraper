'use client';

import { useCallback, useRef } from 'react';
import type { Job } from '@/types';
import type { EnrichedJob } from '@/lib/providers/enrichment/types';
import { useEnrichmentStore } from '@/stores/useEnrichmentStore';

export interface UseEnrichmentReturn {
  /** Trigger enrichment for the given jobs */
  enrich: (jobs: Job[]) => Promise<void>;
  /** Whether enrichment is in progress */
  isEnriching: boolean;
  /** Current progress */
  progress: { completed: number; total: number; failed: number } | null;
  /** Last error */
  error: string | null;
  /** Cancel in-flight enrichment */
  cancel: () => void;
}

export function useEnrichment(): UseEnrichmentReturn {
  const isEnriching = useEnrichmentStore((s) => s.isEnriching);
  const progress = useEnrichmentStore((s) => s.progress);
  const error = useEnrichmentStore((s) => s.error);
  const startEnrichment = useEnrichmentStore((s) => s.startEnrichment);
  const addResults = useEnrichmentStore((s) => s.addResults);
  const finishEnrichment = useEnrichmentStore((s) => s.finishEnrichment);

  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    finishEnrichment('Enrichment cancelled');
  }, [finishEnrichment]);

  const enrich = useCallback(
    async (jobs: Job[]) => {
      if (jobs.length === 0) return;

      // Cancel any existing enrichment
      if (abortRef.current) {
        abortRef.current.abort();
      }

      const controller = new AbortController();
      abortRef.current = controller;

      const ids = jobs.map((j) => j.id);
      startEnrichment(ids);

      try {
        const response = await fetch('/api/jobs/enrich', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobs }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Enrichment failed: ${response.status}`);
        }

        const data = await response.json();
        const results: EnrichedJob[] = data.results || [];

        addResults(results);
        finishEnrichment();
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return; // Already handled by cancel()
        }

        const message = err instanceof Error ? err.message : 'Enrichment failed';
        finishEnrichment(message);
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
      }
    },
    [startEnrichment, addResults, finishEnrichment]
  );

  return { enrich, isEnriching, progress, error, cancel };
}
