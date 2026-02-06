'use client';

import { useState } from 'react';
import { GlassDropdown } from '@/components/ui/GlassDropdown';
import { useFilterStore } from '@/stores/useFilterStore';
import { COMPANY_SIZE_CONFIG, type CompanySize } from '@/types';

export function CompanySizeFilter() {
  const [isOpen, setIsOpen] = useState(false);
  const companySizes = useFilterStore((s) => s.companySizes);
  const toggleCompanySize = useFilterStore((s) => s.toggleCompanySize);

  const triggerLabel =
    companySizes.length === 0
      ? 'Company Size'
      : companySizes.length === 1
        ? COMPANY_SIZE_CONFIG[companySizes[0]].label
        : `${companySizes.length} sizes`;

  return (
    <GlassDropdown
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      trigger={
        <button className="btn-ghost text-sm text-white/70 hover:text-white/90 px-4 py-2 flex items-center gap-2">
          <BuildingIcon className="w-3.5 h-3.5" />
          <span>{triggerLabel}</span>
          <ChevronIcon className="w-3 h-3 opacity-50" />
        </button>
      }
    >
      {(Object.entries(COMPANY_SIZE_CONFIG) as [CompanySize, typeof COMPANY_SIZE_CONFIG[CompanySize]][]).map(
        ([key, config]) => {
          const checked = companySizes.includes(key);
          return (
            <div
              key={key}
              role="option"
              aria-selected={checked}
              onClick={() => toggleCompanySize(key)}
              className="dropdown-option flex items-center gap-3"
            >
              {/* Custom checkbox */}
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

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <line x1="8" y1="6" x2="8" y2="6" />
      <line x1="12" y1="6" x2="12" y2="6" />
      <line x1="16" y1="6" x2="16" y2="6" />
      <line x1="8" y1="10" x2="8" y2="10" />
      <line x1="12" y1="10" x2="12" y2="10" />
      <line x1="16" y1="10" x2="16" y2="10" />
      <line x1="8" y1="14" x2="8" y2="14" />
      <line x1="12" y1="14" x2="12" y2="14" />
      <line x1="16" y1="14" x2="16" y2="14" />
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
