'use client';

import { motion } from 'framer-motion';
import { useSelectionStore } from '@/stores/useSelectionStore';
import { useEnrichmentStore } from '@/stores/useEnrichmentStore';
import { downloadCsv } from '@/lib/utils/csv-export';
import type { Job } from '@/types';

interface SelectionBarProps {
  totalCount: number;
  allJobIds: string[];
  jobs: Job[];
  onEnrich: (jobs: Job[]) => void;
}

export function SelectionBar({ totalCount, allJobIds, jobs, onEnrich }: SelectionBarProps) {
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const selectAll = useSelectionStore((s) => s.selectAll);
  const deselectAll = useSelectionStore((s) => s.deselectAll);
  const isEnriching = useEnrichmentStore((s) => s.isEnriching);
  const progress = useEnrichmentStore((s) => s.progress);
  const count = selectedIds.size;

  if (count === 0) return null;

  const selectedJobs = jobs.filter((j) => selectedIds.has(j.id));

  const handleEnrich = () => {
    onEnrich(selectedJobs);
  };

  const handleExport = () => {
    downloadCsv(selectedJobs);
  };

  const enrichLabel = isEnriching && progress
    ? `Enriching ${progress.completed}/${progress.total}...`
    : 'Enrich Selected';

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glass px-5 py-3 flex items-center gap-3 sm:gap-4"
    >
      <span className="text-sm text-white/80 font-medium">
        {count} selected
      </span>

      <div className="w-px h-5 bg-white/10" />

      {count < totalCount ? (
        <button
          className="btn-ghost text-xs px-3 py-1.5"
          onClick={() => selectAll(allJobIds)}
        >
          Select All ({totalCount})
        </button>
      ) : (
        <button
          className="btn-ghost text-xs px-3 py-1.5"
          onClick={deselectAll}
        >
          Deselect All
        </button>
      )}

      <div className="w-px h-5 bg-white/10" />

      <button
        className="btn-primary text-sm py-2 px-4 disabled:opacity-50"
        onClick={handleEnrich}
        disabled={isEnriching}
      >
        {isEnriching && (
          <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
        )}
        {enrichLabel}
      </button>
      <button
        className="btn-ghost text-sm px-3 py-1.5"
        onClick={handleExport}
      >
        Export CSV
      </button>
    </motion.div>
  );
}
