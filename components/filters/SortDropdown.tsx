'use client';

import { useState } from 'react';
import { GlassDropdown, DropdownOption } from '@/components/ui/GlassDropdown';
import { useFilterStore } from '@/stores/useFilterStore';
import { SORT_CONFIG, type SortOption } from '@/types';

export function SortDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const sortBy = useFilterStore((s) => s.sortBy);
  const setSortBy = useFilterStore((s) => s.setSortBy);

  const handleSelect = (value: SortOption) => {
    setSortBy(value);
    setIsOpen(false);
  };

  return (
    <GlassDropdown
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      align="right"
      trigger={
        <button className="btn-ghost text-sm text-white/70 hover:text-white/90 px-3 py-1.5 flex items-center gap-1.5">
          <SortIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{SORT_CONFIG[sortBy].label}</span>
          <ChevronIcon className="w-3 h-3 opacity-50" />
        </button>
      }
    >
      {(Object.entries(SORT_CONFIG) as [SortOption, { label: string }][]).map(
        ([key, config]) => (
          <DropdownOption
            key={key}
            selected={sortBy === key}
            onClick={() => handleSelect(key)}
          >
            <div className="flex items-center justify-between gap-4">
              <span>{config.label}</span>
              {sortBy === key && <CheckIcon className="w-4 h-4 text-primary-400 flex-shrink-0" />}
            </div>
          </DropdownOption>
        )
      )}
    </GlassDropdown>
  );
}

function SortIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="14" y2="6" />
      <line x1="4" y1="12" x2="11" y2="12" />
      <line x1="4" y1="18" x2="8" y2="18" />
      <polyline points="18 9 21 6 18 3" />
      <line x1="21" y1="6" x2="21" y2="18" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
