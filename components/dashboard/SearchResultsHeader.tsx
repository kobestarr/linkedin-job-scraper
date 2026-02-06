'use client';

import { formatRelativeTime } from '@/lib/utils';

interface SearchResultsHeaderProps {
  count: number;
  searchQuery: string;
  lastUpdated?: Date | null;
  isLoading?: boolean;
}

export function SearchResultsHeader({
  count,
  searchQuery,
  lastUpdated,
  isLoading,
}: SearchResultsHeaderProps) {
  return (
    <div className="flex items-center justify-between px-1 sm:px-2">
      <div>
        <h2 className="text-base sm:text-lg font-medium text-white/80">
          {isLoading ? 'Searching...' : 'Results'}
        </h2>
        {searchQuery && !isLoading && (
          <p className="text-xs text-white/40 mt-0.5">
            for &quot;{searchQuery}&quot;
          </p>
        )}
      </div>
      <div className="text-right">
        <span className="text-xs sm:text-sm text-white/40">
          {isLoading ? '...' : `${count} job${count !== 1 ? 's' : ''}`}
        </span>
        {lastUpdated && !isLoading && (
          <p className="text-xs text-white/30 mt-0.5">
            Updated {formatRelativeTime(lastUpdated)}
          </p>
        )}
      </div>
    </div>
  );
}
