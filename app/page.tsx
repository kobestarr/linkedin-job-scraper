'use client';

import { LogoHeader } from '@/components/dashboard/LogoHeader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ErrorState } from '@/components/dashboard/ErrorState';
import { JobList } from '@/components/dashboard/JobList';
import { SearchResultsHeader } from '@/components/dashboard/SearchResultsHeader';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { LocationFilter } from '@/components/filters/LocationFilter';
import { DateRangeFilter } from '@/components/filters/DateRangeFilter';
import { CompanySizeFilter } from '@/components/filters/CompanySizeFilter';
import { ExcludeRecruitersToggle } from '@/components/filters/ExcludeRecruitersToggle';
import { SeniorityFilter } from '@/components/filters/SeniorityFilter';
import { EmploymentTypeFilter } from '@/components/filters/EmploymentTypeFilter';
import { PayFilter } from '@/components/filters/PayFilter';
import { ActiveFilters } from '@/components/filters/ActiveFilters';
import { useJobSearch } from '@/hooks/useJobSearch';
import { useFilterStore } from '@/stores/useFilterStore';
import { getClientConfig } from '@/lib/config/client';

/**
 * Main Dashboard Page
 *
 * Slice 4: Full MVP Demo with filters, views, and pipeline
 */
export default function DashboardPage() {
  const config = getClientConfig();

  const searchQuery = useFilterStore((s) => s.searchQuery);
  const setSearchQuery = useFilterStore((s) => s.setSearchQuery);
  const location = useFilterStore((s) => s.location);
  const dateRange = useFilterStore((s) => s.dateRange);
  const companySizes = useFilterStore((s) => s.companySizes);
  const excludeRecruiters = useFilterStore((s) => s.excludeRecruiters);
  const excludeCompanies = useFilterStore((s) => s.excludeCompanies);
  const viewMode = useFilterStore((s) => s.viewMode);

  const { jobs, isLoading, isRefreshing, isError, error, search, lastSearch, reset } =
    useJobSearch();

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    search(searchQuery, {
      maxResults: config.defaults.maxResults,
      location: location || config.defaults.location,
      dateRange: dateRange || undefined,
      companySizes,
      excludeRecruiters,
      excludeCompanies,
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
          <GlassPanel className="p-4 sm:p-6 relative z-10">
            <div className="space-y-3">
              {/* Row 1: Search input + Location + Search button */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
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
                <LocationFilter />
                <button
                  className="btn-primary w-full sm:w-auto text-sm sm:text-base py-2.5 sm:py-3 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleSearch}
                  disabled={isLoading || !searchQuery.trim()}
                >
                  {isLoading ? 'Searching...' : 'Search'}
                </button>
              </div>

              {/* Row 2: Filters */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <DateRangeFilter />
                <CompanySizeFilter />
                <SeniorityFilter />
                <EmploymentTypeFilter />
                <PayFilter />
                <ExcludeRecruitersToggle />
              </div>

              {/* Row 3: Active filter pills */}
              <ActiveFilters />
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
              isRefreshing={isRefreshing}
            />

            {/* Loading state */}
            {isLoading && <JobList jobs={[]} isLoading={true} viewMode={viewMode} />}

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
                    ? `No jobs matching "${lastSearch?.query}" were found. Try different keywords or adjust your filters.`
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
            {showResults && <JobList jobs={jobs} isLoading={false} viewMode={viewMode} />}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-3 sm:py-4 text-center">
        <p className="text-sm text-white/20">
          Job Intelligence Platform
        </p>
      </footer>
    </div>
  );
}
