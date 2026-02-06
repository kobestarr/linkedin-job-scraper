'use client';

import { useState, useMemo } from 'react';
import { GlassDropdown } from '@/components/ui/GlassDropdown';
import { useFilterStore } from '@/stores/useFilterStore';
import {
  PAY_RANGE_CONFIG,
  getCurrencyForLocation,
  formatPayLabel,
  type PayRange,
  type PayRangeEntry,
} from '@/types';

export function PayFilter() {
  const [isOpen, setIsOpen] = useState(false);
  const payRanges = useFilterStore((s) => s.payRanges);
  const togglePayRange = useFilterStore((s) => s.togglePayRange);
  const location = useFilterStore((s) => s.location);

  const currency = getCurrencyForLocation(location);

  const allEntries = Object.entries(PAY_RANGE_CONFIG) as [PayRange, PayRangeEntry][];
  const salaryEntries = useMemo(() => allEntries.filter(([, c]) => c.group === 'salary'), [allEntries]);
  const dayRateEntries = useMemo(() => allEntries.filter(([, c]) => c.group === 'day-rate'), [allEntries]);
  const hourlyEntries = useMemo(() => allEntries.filter(([, c]) => c.group === 'hourly'), [allEntries]);

  const triggerLabel =
    payRanges.length === 0
      ? 'Pay / Rate'
      : payRanges.length === 1
        ? formatPayLabel(PAY_RANGE_CONFIG[payRanges[0]].label, currency)
        : `${payRanges.length} ranges`;

  const renderGroup = (label: string, entries: [PayRange, PayRangeEntry][], isFirst: boolean) => (
    <>
      {!isFirst && <div className="my-1.5 border-t border-white/10" />}
      <div className="px-3 pt-2 pb-1">
        <span className="text-[10px] uppercase tracking-wider text-white/30 font-medium">{label}</span>
      </div>
      {entries.map(([key, config]) => {
        const checked = payRanges.includes(key);
        return (
          <div
            key={key}
            role="option"
            aria-selected={checked}
            onClick={() => togglePayRange(key)}
            className="dropdown-option flex items-center gap-3"
          >
            <div
              className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                checked
                  ? 'bg-primary/40 border-primary/60'
                  : 'border-white/20 bg-white/5'
              }`}
            >
              {checked && <CheckIcon className="w-3 h-3 text-white" />}
            </div>
            <span>{formatPayLabel(config.label, currency)}</span>
          </div>
        );
      })}
    </>
  );

  return (
    <GlassDropdown
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      trigger={
        <button className="btn-ghost text-sm text-white/70 hover:text-white/90 px-4 py-2 flex items-center gap-2">
          <CurrencyIcon className="w-3.5 h-3.5" />
          <span>{triggerLabel}</span>
          <ChevronIcon className="w-3 h-3 opacity-50" />
        </button>
      }
    >
      {renderGroup('Salary', salaryEntries, true)}
      {renderGroup('Day Rate', dayRateEntries, false)}
      {renderGroup('Hourly', hourlyEntries, false)}
    </GlassDropdown>
  );
}

function CurrencyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
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
