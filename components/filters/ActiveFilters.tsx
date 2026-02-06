'use client';

import { useFilterStore } from '@/stores/useFilterStore';
import { DATE_RANGE_CONFIG, COMPANY_SIZE_CONFIG, SENIORITY_CONFIG, EMPLOYMENT_TYPE_CONFIG, PAY_RANGE_CONFIG, MATCH_MODE_CONFIG, getCurrencyForLocation, formatPayLabel } from '@/types';

export function ActiveFilters() {
  const location = useFilterStore((s) => s.location);
  const dateRange = useFilterStore((s) => s.dateRange);
  const companySizes = useFilterStore((s) => s.companySizes);
  const seniorities = useFilterStore((s) => s.seniorities);
  const employmentTypes = useFilterStore((s) => s.employmentTypes);
  const payRanges = useFilterStore((s) => s.payRanges);
  const excludeCompanies = useFilterStore((s) => s.excludeCompanies);
  const matchMode = useFilterStore((s) => s.matchMode);
  const setLocation = useFilterStore((s) => s.setLocation);
  const setDateRange = useFilterStore((s) => s.setDateRange);
  const toggleCompanySize = useFilterStore((s) => s.toggleCompanySize);
  const toggleSeniority = useFilterStore((s) => s.toggleSeniority);
  const toggleEmploymentType = useFilterStore((s) => s.toggleEmploymentType);
  const togglePayRange = useFilterStore((s) => s.togglePayRange);
  const setExcludeCompanies = useFilterStore((s) => s.setExcludeCompanies);
  const setMatchMode = useFilterStore((s) => s.setMatchMode);
  const resetFilters = useFilterStore((s) => s.resetFilters);

  const pills: { key: string; label: string; onRemove: () => void }[] = [];

  if (location) {
    pills.push({ key: 'location', label: location, onRemove: () => setLocation('') });
  }
  if (dateRange) {
    pills.push({
      key: 'dateRange',
      label: DATE_RANGE_CONFIG[dateRange].label,
      onRemove: () => setDateRange(null),
    });
  }
  for (const cs of companySizes) {
    pills.push({
      key: `size-${cs}`,
      label: COMPANY_SIZE_CONFIG[cs].label,
      onRemove: () => toggleCompanySize(cs),
    });
  }
  for (const s of seniorities) {
    pills.push({
      key: `seniority-${s}`,
      label: SENIORITY_CONFIG[s].label,
      onRemove: () => toggleSeniority(s),
    });
  }
  for (const et of employmentTypes) {
    pills.push({
      key: `type-${et}`,
      label: EMPLOYMENT_TYPE_CONFIG[et].label,
      onRemove: () => toggleEmploymentType(et),
    });
  }
  const currency = getCurrencyForLocation(location);
  for (const pr of payRanges) {
    pills.push({
      key: `pay-${pr}`,
      label: formatPayLabel(PAY_RANGE_CONFIG[pr].label, currency),
      onRemove: () => togglePayRange(pr),
    });
  }
  if (excludeCompanies.length > 0) {
    pills.push({
      key: 'excludeCompanies',
      label: `${excludeCompanies.length} excluded`,
      onRemove: () => setExcludeCompanies([]),
    });
  }
  if (matchMode !== 'all-title') {
    pills.push({
      key: 'matchMode',
      label: MATCH_MODE_CONFIG[matchMode].label,
      onRemove: () => setMatchMode('all-title'),
    });
  }

  if (pills.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 px-1">
      {pills.map((pill) => (
        <span key={pill.key} className="filter-pill text-xs">
          {pill.label}
          <button
            onClick={pill.onRemove}
            className="ml-1 text-white/40 hover:text-white/70 transition-colors"
            aria-label={`Remove ${pill.label} filter`}
          >
            <XIcon className="w-3 h-3" />
          </button>
        </span>
      ))}
      <button
        onClick={resetFilters}
        className="text-xs text-white/30 hover:text-white/60 transition-colors ml-1"
      >
        Clear all
      </button>
    </div>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
