'use client';

import { useState } from 'react';
import { LogoHeader } from '@/components/dashboard/LogoHeader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ErrorState } from '@/components/dashboard/ErrorState';
import { JobList } from '@/components/dashboard/JobList';
import { SearchResultsHeader } from '@/components/dashboard/SearchResultsHeader';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { useJobSearch } from '@/hooks/useJobSearch';
import { getClientConfig } from '@/lib/config/client';

/**
 * Main Dashboard Page
 *
 * Slice 1: Foundation with empty state
 * Slice 3: Search functionality with results display
 */
export default function DashboardPage() {
  const config = getClientConfig();
  const [searchQuery, setSearchQuery] = useState(config.defaults.jobTitle || '');

  const { jobs, isLoading, isError, error, search, lastSearch, reset } =
    useJobSearch();

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    search(searchQuery, {
      maxResults: config.defaults.maxResults,
      location: config.defaults.location,
    });
  };

  const hasSearched = lastSearch !== null;
  const showEmptyState = !isLoading && !isError && jobs.length === 0;
  const showResults = !isLoading && !isError && jobs.length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <LogoHeader />

      {/* Main content */}
      <main className="flex-1 px-3 sm:px-6 pb-6 sm:pb-8">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Filter Panel */}
          <GlassPanel className="p-4 sm:p-6">
            <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-4">
              {/* Search input */}
              <div className="w-full sm:flex-1 sm:min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search job titles, keywords..."
                  className="input-glass text-sm sm:text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  disabled={isLoading}
                />
              </div>

              {/* Filter dropdowns - coming in Slice 4 */}
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <button
                  className="btn-ghost text-xs sm:text-sm text-white/60 hover:text-white/90 px-2 sm:px-4 py-1.5 sm:py-2 opacity-50 cursor-not-allowed"
                  disabled
                  title="Coming soon"
                >
                  Location
                </button>
                <button
                  className="btn-ghost text-xs sm:text-sm text-white/60 hover:text-white/90 px-2 sm:px-4 py-1.5 sm:py-2 opacity-50 cursor-not-allowed"
                  disabled
                  title="Coming soon"
                >
                  Date Range
                </button>
                <button
                  className="btn-ghost text-xs sm:text-sm text-white/60 hover:text-white/90 px-2 sm:px-4 py-1.5 sm:py-2 opacity-50 cursor-not-allowed"
                  disabled
                  title="Coming soon"
                >
                  Company Size
                </button>
              </div>

              {/* Search button */}
              <button
                className="btn-primary w-full sm:w-auto text-sm sm:text-base py-2.5 sm:py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSearch}
                disabled={isLoading || !searchQuery.trim()}
              >
                {isLoading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </GlassPanel>

          {/* Results section */}
          <div className="space-y-3 sm:space-y-4">
            {/* Results header */}
            <SearchResultsHeader
              count={jobs.length}
              searchQuery={lastSearch?.query || ''}
              lastUpdated={lastSearch?.timestamp}
              isLoading={isLoading}
            />

            {/* Loading state */}
            {isLoading && <JobList jobs={[]} isLoading={true} />}

            {/* Error state */}
            {isError && error && (
              <ErrorState error={error} onRetry={handleSearch} />
            )}

            {/* Empty state */}
            {showEmptyState && (
              <EmptyState
                title={hasSearched ? 'No results found' : 'Start your search'}
                description={
                  hasSearched
                    ? `No jobs matching "${lastSearch?.query}" were found. Try different keywords.`
                    : 'Enter keywords above and click Search to discover job opportunities matching your criteria.'
                }
                actionLabel={hasSearched ? 'Clear search' : undefined}
                onAction={
                  hasSearched
                    ? () => {
                        setSearchQuery('');
                        reset();
                      }
                    : undefined
                }
              />
            )}

            {/* Results */}
            {showResults && <JobList jobs={jobs} isLoading={false} />}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-3 sm:py-4 text-center">
        <p className="text-xs sm:text-sm text-white/20">
          Job Intelligence Platform
        </p>
      </footer>
    </div>
  );
}
