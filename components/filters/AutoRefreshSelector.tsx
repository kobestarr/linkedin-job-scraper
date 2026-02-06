'use client';

import { useState } from 'react';
import { GlassDropdown, DropdownOption } from '@/components/ui/GlassDropdown';
import { useFilterStore } from '@/stores/useFilterStore';
import { AUTO_REFRESH_CONFIG, type AutoRefreshInterval } from '@/types';

export function AutoRefreshSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const autoRefreshInterval = useFilterStore((s) => s.autoRefreshInterval);
  const setAutoRefreshInterval = useFilterStore((s) => s.setAutoRefreshInterval);

  const isActive = autoRefreshInterval !== 'off';

  return (
    <GlassDropdown
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      align="right"
      trigger={
        <button className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 transition-colors">
          {isActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse-dot" />
          )}
          <span>
            {isActive ? AUTO_REFRESH_CONFIG[autoRefreshInterval].label : 'Auto-refresh'}
          </span>
        </button>
      }
    >
      {(Object.entries(AUTO_REFRESH_CONFIG) as [AutoRefreshInterval, typeof AUTO_REFRESH_CONFIG[AutoRefreshInterval]][]).map(
        ([key, config]) => (
          <DropdownOption
            key={key}
            selected={autoRefreshInterval === key}
            onClick={() => {
              setAutoRefreshInterval(key);
              setIsOpen(false);
            }}
          >
            <div className="flex items-center justify-between">
              <span>{config.label}</span>
              {autoRefreshInterval === key && (
                <CheckIcon className="w-3.5 h-3.5 text-primary-400" />
              )}
            </div>
          </DropdownOption>
        )
      )}
    </GlassDropdown>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
