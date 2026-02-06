'use client';

import { useState } from 'react';
import { GlassDropdown } from '@/components/ui/GlassDropdown';
import { useFilterStore } from '@/stores/useFilterStore';
import { EMPLOYMENT_TYPE_CONFIG, type EmploymentType } from '@/types';

export function EmploymentTypeFilter() {
  const [isOpen, setIsOpen] = useState(false);
  const employmentTypes = useFilterStore((s) => s.employmentTypes);
  const toggleEmploymentType = useFilterStore((s) => s.toggleEmploymentType);

  const triggerLabel =
    employmentTypes.length === 0
      ? 'Job Type'
      : employmentTypes.length === 1
        ? EMPLOYMENT_TYPE_CONFIG[employmentTypes[0]].label
        : `${employmentTypes.length} types`;

  return (
    <GlassDropdown
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      trigger={
        <button className="btn-ghost text-sm text-white/70 hover:text-white/90 px-4 py-2 flex items-center gap-2">
          <BriefcaseIcon className="w-3.5 h-3.5" />
          <span>{triggerLabel}</span>
          <ChevronIcon className="w-3 h-3 opacity-50" />
        </button>
      }
    >
      {(Object.entries(EMPLOYMENT_TYPE_CONFIG) as [EmploymentType, typeof EMPLOYMENT_TYPE_CONFIG[EmploymentType]][]).map(
        ([key, config]) => {
          const checked = employmentTypes.includes(key);
          return (
            <div
              key={key}
              role="option"
              aria-selected={checked}
              onClick={() => toggleEmploymentType(key)}
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
              <span>{config.label}</span>
            </div>
          );
        }
      )}
    </GlassDropdown>
  );
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
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
