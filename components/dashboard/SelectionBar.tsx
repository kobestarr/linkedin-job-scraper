'use client';

import { motion } from 'framer-motion';
import { useSelectionStore } from '@/stores/useSelectionStore';

interface SelectionBarProps {
  totalCount: number;
  allJobIds: string[];
}

export function SelectionBar({ totalCount, allJobIds }: SelectionBarProps) {
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const selectAll = useSelectionStore((s) => s.selectAll);
  const deselectAll = useSelectionStore((s) => s.deselectAll);
  const count = selectedIds.size;

  if (count === 0) return null;

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

      <button className="btn-primary text-sm py-2 px-4">
        Enrich Selected
      </button>
      <button className="btn-ghost text-sm px-3 py-1.5">
        Export
      </button>
    </motion.div>
  );
}
