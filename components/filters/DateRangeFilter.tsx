'use client';

import { useState } from 'react';
import { GlassDropdown, DropdownOption } from '@/components/ui/GlassDropdown';
import { useFilterStore } from '@/stores/useFilterStore';
import { DATE_RANGE_CONFIG, type DateRange } from '@/types';

export function DateRangeFilter() {
  const [isOpen, setIsOpen] = useState(false);
  const dateRange = useFilterStore((s) => s.dateRange);
  const setDateRange = useFilterStore((s) => s.setDateRange);

  const handleSelect = (value: DateRange | null) => {
    setDateRange(value);
    setIsOpen(false);
  };

  const triggerLabel = dateRange ? DATE_RANGE_CONFIG[dateRange].label : 'Date Range';

  return (
    <GlassDropdown
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      trigger={
        <button className="btn-ghost text-sm text-white/70 hover:text-white/90 px-4 py-2 flex items-center gap-2">
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>{triggerLabel}</span>
          <ChevronIcon className="w-3 h-3 opacity-50" />
        </button>
      }
    >
      {/* All Time option */}
      <DropdownOption
        selected={dateRange === null}
        onClick={() => handleSelect(null)}
      >
        <div className="flex items-center justify-between">
          <span>All Time</span>
          {dateRange === null && <CheckIcon className="w-4 h-4 text-primary-400" />}
        </div>
      </DropdownOption>

      <div className="border-t border-white/10 my-1" />

      {(Object.entries(DATE_RANGE_CONFIG) as [DateRange, typeof DATE_RANGE_CONFIG[DateRange]][]).map(
        ([key, config]) => (
          <DropdownOption
            key={key}
            selected={dateRange === key}
            onClick={() => handleSelect(key)}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  {key === '24h' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                  <span>{config.label}</span>
                </div>
                <p className="text-xs text-white/30 mt-0.5 line-clamp-1">
                  {config.tooltip}
                </p>
              </div>
              {dateRange === key && <CheckIcon className="w-4 h-4 text-primary-400 flex-shrink-0" />}
            </div>
          </DropdownOption>
        )
      )}
    </GlassDropdown>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
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
