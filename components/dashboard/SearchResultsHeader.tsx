'use client';

import { formatRelativeTime } from '@/lib/utils';
import { ViewToggle } from './ViewToggle';
import { AutoRefreshSelector } from '@/components/filters/AutoRefreshSelector';
import { SortDropdown } from '@/components/filters/SortDropdown';

interface SearchResultsHeaderProps {
  count: number;
  searchQuery: string;
  lastUpdated?: Date | null;
  isLoading?: boolean;
  isRefreshing?: boolean;
}

export function SearchResultsHeader({
  count,
  searchQuery,
  lastUpdated,
  isLoading,
  isRefreshing,
}: SearchResultsHeaderProps) {
  return (
    <div className="flex items-center justify-between px-1 sm:px-2">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-medium text-white/80">
            {isLoading ? 'Searching...' : 'Results'}
          </h2>
          {isRefreshing && (
            <span className="text-xs text-primary-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse-dot" />
              Refreshing...
            </span>
          )}
        </div>
        {searchQuery && !isLoading && (
          <p className="text-xs text-white/40 mt-0.5">
            for &quot;{searchQuery}&quot;
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <SortDropdown />
        <AutoRefreshSelector />
        <ViewToggle />
        <div className="text-right">
          <span className="text-xs sm:text-sm text-white/40" aria-live="polite">
            {isLoading ? '...' : `${count} job${count !== 1 ? 's' : ''}`}
          </span>
          {lastUpdated && !isLoading && (
            <p className="text-xs text-white/30 mt-0.5">
              Updated {formatRelativeTime(lastUpdated)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
