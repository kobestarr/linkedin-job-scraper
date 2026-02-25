'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSelectionStore } from '@/stores/useSelectionStore';
import { useEnrichmentStore } from '@/stores/useEnrichmentStore';
import { downloadCsv } from '@/lib/utils/csv-export';
import { estimateCredits, getUsageLevel, getMonthlyCreditCap } from '@/lib/config/usage-limits';
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
  const creditBalance = useEnrichmentStore((s) => s.creditBalance);
  const sessionCreditsUsed = useEnrichmentStore((s) => s.sessionCreditsUsed);
  const count = selectedIds.size;

  const [showConfirm, setShowConfirm] = useState(false);

  if (count === 0) return null;

  const selectedJobs = jobs.filter((j) => selectedIds.has(j.id));
  const providerId = creditBalance?.provider ?? 'none';
  const estimated = estimateCredits(selectedJobs.length, providerId);
  const cap = getMonthlyCreditCap();
  const usageLevel = getUsageLevel(sessionCreditsUsed + estimated, cap);
  const insufficientCredits = creditBalance != null && estimated > 0 && creditBalance.remaining < estimated;

  const handleEnrich = () => {
    // Show confirmation if there's a cost
    if (estimated > 0 && !showConfirm) {
      setShowConfirm(true);
      return;
    }
    setShowConfirm(false);
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

      {/* Enrichment confirmation */}
      {showConfirm && !isEnriching ? (
        <div className="flex items-center gap-2">
          <span className={`text-xs ${usageLevel === 'critical' ? 'text-red-400' : usageLevel === 'high' ? 'text-orange-400' : 'text-white/60'}`}>
            ~{estimated} credits
            {insufficientCredits && ' (insufficient!)'}
          </span>
          <button
            className="btn-primary text-xs py-1.5 px-3 disabled:opacity-50"
            onClick={handleEnrich}
            disabled={insufficientCredits}
          >
            Confirm
          </button>
          <button
            className="btn-ghost text-xs py-1.5 px-2"
            onClick={() => setShowConfirm(false)}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          className="btn-primary text-sm py-2 px-4 disabled:opacity-50"
          onClick={handleEnrich}
          disabled={isEnriching || (usageLevel === 'critical' && estimated > 0)}
        >
          {isEnriching && (
            <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
          )}
          {enrichLabel}
        </button>
      )}

      <button
        className="btn-ghost text-sm px-3 py-1.5"
        onClick={handleExport}
      >
        Export CSV
      </button>
    </motion.div>
  );
}
