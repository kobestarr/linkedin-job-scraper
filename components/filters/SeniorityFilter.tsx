'use client';

import { useState } from 'react';
import { GlassDropdown } from '@/components/ui/GlassDropdown';
import { useFilterStore } from '@/stores/useFilterStore';
import { SENIORITY_CONFIG, type Seniority } from '@/types';

export function SeniorityFilter() {
  const [isOpen, setIsOpen] = useState(false);
  const seniorities = useFilterStore((s) => s.seniorities);
  const toggleSeniority = useFilterStore((s) => s.toggleSeniority);

  const triggerLabel =
    seniorities.length === 0
      ? 'Seniority'
      : seniorities.length === 1
        ? SENIORITY_CONFIG[seniorities[0]].label
        : `${seniorities.length} levels`;

  return (
    <GlassDropdown
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      trigger={
        <button className="btn-ghost text-sm text-white/70 hover:text-white/90 px-4 py-2 flex items-center gap-2">
          <LevelIcon className="w-3.5 h-3.5" />
          <span>{triggerLabel}</span>
          <ChevronIcon className="w-3 h-3 opacity-50" />
        </button>
      }
    >
      {(Object.entries(SENIORITY_CONFIG) as [Seniority, typeof SENIORITY_CONFIG[Seniority]][]).map(
        ([key, config]) => {
          const checked = seniorities.includes(key);
          return (
            <div
              key={key}
              role="option"
              aria-selected={checked}
              onClick={() => toggleSeniority(key)}
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
              <div className="min-w-0">
                <span>{config.label}</span>
                <p className="text-xs text-white/30 mt-0.5 line-clamp-1">
                  {config.tooltip}
                </p>
              </div>
            </div>
          );
        }
      )}
    </GlassDropdown>
  );
}

function LevelIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20h4V10H2z" />
      <path d="M10 20h4V4h-4z" />
      <path d="M18 20h4v-8h-4z" />
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
