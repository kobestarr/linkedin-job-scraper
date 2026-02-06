'use client';

import { useState, useRef, useEffect } from 'react';
import { useFilterStore } from '@/stores/useFilterStore';
import { MATCH_MODE_CONFIG } from '@/types';
import type { MatchMode } from '@/types';

const MODES: MatchMode[] = ['exact-title', 'all-title', 'all-anywhere', 'broad', 'off'];

export function MatchModeFilter() {
  const matchMode = useFilterStore((s) => s.matchMode);
  const setMatchMode = useFilterStore((s) => s.setMatchMode);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const current = MATCH_MODE_CONFIG[matchMode];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          matchMode !== 'off'
            ? 'bg-primary/20 border border-primary/40 text-primary-200'
            : 'bg-white/5 border border-white/10 text-white/40'
        }`}
      >
        <TargetIcon className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{current.label}</span>
        <ChevronIcon className="w-3 h-3" />
      </button>

      {open && (
        <div className="dropdown-glass absolute top-full left-0 mt-2 z-50 w-64">
          {MODES.map((mode) => {
            const config = MATCH_MODE_CONFIG[mode];
            const isActive = matchMode === mode;
            return (
              <button
                key={mode}
                onClick={() => {
                  setMatchMode(mode);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-150 ${
                  isActive
                    ? 'bg-primary/15 text-primary-300'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{config.label}</span>
                  {isActive && <CheckIcon className="w-4 h-4 text-primary-400" />}
                </div>
                <p className="text-xs text-white/40 mt-0.5">{config.description}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TargetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
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
