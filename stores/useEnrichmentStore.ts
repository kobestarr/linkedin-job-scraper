'use client';

import { create } from 'zustand';
import type { EnrichedJob } from '@/lib/providers/enrichment/types';

interface EnrichmentProgress {
  completed: number;
  total: number;
  failed: number;
}

interface EnrichmentState {
  /** Job IDs currently being enriched */
  enrichingIds: Set<string>;

  /** Completed enrichment results keyed by job ID */
  enrichmentResults: Map<string, EnrichedJob>;

  /** Whether any enrichment is in progress */
  isEnriching: boolean;

  /** Current batch progress */
  progress: EnrichmentProgress | null;

  /** Last error message */
  error: string | null;

  /** Mark jobs as currently enriching */
  startEnrichment: (ids: string[]) => void;

  /** Store a completed enrichment result */
  addResult: (jobId: string, result: EnrichedJob) => void;

  /** Store multiple results at once */
  addResults: (results: EnrichedJob[]) => void;

  /** Mark enrichment as finished */
  finishEnrichment: (error?: string) => void;

  /** Clear all enrichment state */
  clearResults: () => void;
}

export const useEnrichmentStore = create<EnrichmentState>()((set, get) => ({
  enrichingIds: new Set<string>(),
  enrichmentResults: new Map<string, EnrichedJob>(),
  isEnriching: false,
  progress: null,
  error: null,

  startEnrichment: (ids) =>
    set({
      enrichingIds: new Set(ids),
      isEnriching: true,
      progress: { completed: 0, total: ids.length, failed: 0 },
      error: null,
    }),

  addResult: (jobId, result) =>
    set((state) => {
      const nextResults = new Map(state.enrichmentResults);
      nextResults.set(jobId, result);

      const nextEnriching = new Set(state.enrichingIds);
      nextEnriching.delete(jobId);

      const completed = (state.progress?.completed ?? 0) + 1;
      const failed = result.companyData
        ? (state.progress?.failed ?? 0)
        : (state.progress?.failed ?? 0) + 1;

      return {
        enrichmentResults: nextResults,
        enrichingIds: nextEnriching,
        progress: {
          completed,
          total: state.progress?.total ?? completed,
          failed,
        },
      };
    }),

  addResults: (results) =>
    set((state) => {
      const nextResults = new Map(state.enrichmentResults);
      const nextEnriching = new Set(state.enrichingIds);
      let failed = 0;

      for (const result of results) {
        nextResults.set(result.id, result);
        nextEnriching.delete(result.id);
        if (!result.companyData) failed++;
      }

      return {
        enrichmentResults: nextResults,
        enrichingIds: nextEnriching,
        progress: {
          completed: results.length,
          total: state.progress?.total ?? results.length,
          failed,
        },
      };
    }),

  finishEnrichment: (error) =>
    set({
      enrichingIds: new Set<string>(),
      isEnriching: false,
      error: error ?? null,
    }),

  clearResults: () =>
    set({
      enrichingIds: new Set<string>(),
      enrichmentResults: new Map<string, EnrichedJob>(),
      isEnriching: false,
      progress: null,
      error: null,
    }),
}));
