'use client';

import { useFilterStore } from '@/stores/useFilterStore';
import type { ViewMode } from '@/types';

export function ViewToggle() {
  const viewMode = useFilterStore((s) => s.viewMode);
  const setViewMode = useFilterStore((s) => s.setViewMode);

  return (
    <div className="flex items-center rounded-lg overflow-hidden bg-white/5 border border-white/10">
      <ViewButton
        active={viewMode === 'list'}
        onClick={() => setViewMode('list')}
        label="List view"
      >
        <ListIcon className="w-4 h-4" />
      </ViewButton>
      <ViewButton
        active={viewMode === 'card'}
        onClick={() => setViewMode('card')}
        label="Card view"
      >
        <GridIcon className="w-4 h-4" />
      </ViewButton>
    </div>
  );
}

function ViewButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`px-3 py-2 transition-all duration-150 ${
        active
          ? 'bg-primary/20 text-primary-300'
          : 'text-white/40 hover:text-white/60'
      }`}
    >
      {children}
    </button>
  );
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}
