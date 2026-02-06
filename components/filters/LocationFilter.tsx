'use client';

import { useState } from 'react';
import { GlassDropdown, DropdownOption } from '@/components/ui/GlassDropdown';
import { useFilterStore } from '@/stores/useFilterStore';
import { LOCATION_PRESETS, type LocationPreset } from '@/types';

export function LocationFilter() {
  const [isOpen, setIsOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);
  const location = useFilterStore((s) => s.location);
  const setLocation = useFilterStore((s) => s.setLocation);

  const handleSelect = (value: string) => {
    setLocation(value);
    setIsOpen(false);
    setExpandedCountry(null);
  };

  const handleCountryClick = (preset: LocationPreset) => {
    if (preset.regions && preset.regions.length > 0) {
      if (expandedCountry === preset.value) {
        // Second click on expanded country = select the whole country
        handleSelect(preset.value);
      } else {
        setExpandedCountry(preset.value);
      }
    } else {
      handleSelect(preset.value);
    }
  };

  const handleCustomSubmit = () => {
    if (customInput.trim()) {
      setLocation(customInput.trim());
      setCustomInput('');
      setIsOpen(false);
      setExpandedCountry(null);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) setExpandedCountry(null);
  };

  const triggerLabel = location || 'Location';

  return (
    <GlassDropdown
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      trigger={
        <button className="btn-ghost text-sm text-white/70 hover:text-white/90 px-4 py-2 flex items-center gap-2">
          <LocationIcon className="w-3.5 h-3.5" />
          <span className="truncate max-w-[120px]">{triggerLabel}</span>
          <ChevronIcon className="w-3 h-3 opacity-50" />
        </button>
      }
    >
      {LOCATION_PRESETS.map((preset) => {
        const isExpanded = expandedCountry === preset.value;
        const hasRegions = preset.regions && preset.regions.length > 0;

        return (
          <div key={preset.value}>
            <DropdownOption
              selected={location === preset.value}
              onClick={() => handleCountryClick(preset)}
            >
              <div className="flex items-center justify-between">
                <span>{preset.label}</span>
                <div className="flex items-center gap-1.5">
                  {location === preset.value && (
                    <CheckIcon className="w-4 h-4 text-primary-400" />
                  )}
                  {hasRegions && (
                    <ChevronIcon
                      className={`w-3 h-3 opacity-40 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </div>
              </div>
            </DropdownOption>

            {/* City / region sub-options */}
            {isExpanded && preset.regions && (
              <div className="ml-3 border-l border-white/10 pl-2">
                {preset.regions.map((region) => (
                  <DropdownOption
                    key={region.value}
                    selected={location === region.value}
                    onClick={() => handleSelect(region.value)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">{region.label}</span>
                      {location === region.value && (
                        <CheckIcon className="w-3.5 h-3.5 text-primary-400" />
                      )}
                    </div>
                  </DropdownOption>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Clear option */}
      {location && (
        <DropdownOption onClick={() => handleSelect('')}>
          <span className="text-white/40">Clear location</span>
        </DropdownOption>
      )}

      {/* Custom input */}
      <div className="px-3 py-2 border-t border-white/10 mt-1">
        <input
          type="text"
          placeholder="Custom city, region..."
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white/80 placeholder:text-white/30 focus:outline-none focus:border-primary/50"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </GlassDropdown>
  );
}

function LocationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
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
