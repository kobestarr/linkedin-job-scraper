'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { LogoHeader } from '@/components/dashboard/LogoHeader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { GlassPanel } from '@/components/ui/GlassPanel';

/**
 * Main Dashboard Page
 *
 * Slice 1: Foundation with empty state
 * - Glassmorphism shell
 * - Logo header with animation
 * - Filter panel placeholder
 * - Empty results state
 */
export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    console.log('Search triggered:', searchQuery);
    // Full implementation in Slice 3-4
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <LogoHeader />

      {/* Main content */}
      <main className="flex-1 px-3 sm:px-6 pb-6 sm:pb-8">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Filter Panel */}
          <GlassPanel className="p-4 sm:p-6" animate delay={0.1}>
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
                />
              </div>

              {/* Filter dropdowns - coming in Slice 4 */}
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <button className="btn-ghost text-xs sm:text-sm text-white/60 hover:text-white/90 px-2 sm:px-4 py-1.5 sm:py-2">
                  Location
                </button>
                <button className="btn-ghost text-xs sm:text-sm text-white/60 hover:text-white/90 px-2 sm:px-4 py-1.5 sm:py-2">
                  Date Range
                </button>
                <button className="btn-ghost text-xs sm:text-sm text-white/60 hover:text-white/90 px-2 sm:px-4 py-1.5 sm:py-2">
                  Company Size
                </button>
              </div>

              {/* Search button */}
              <button
                className="btn-primary w-full sm:w-auto text-sm sm:text-base py-2.5 sm:py-3"
                onClick={handleSearch}
              >
                Search
              </button>
            </div>
          </GlassPanel>

          {/* Results section */}
          <div className="space-y-3 sm:space-y-4">
            {/* Results header */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-between px-1 sm:px-2"
            >
              <h2 className="text-base sm:text-lg font-medium text-white/80">Results</h2>
              <span className="text-xs sm:text-sm text-white/40">0 jobs</span>
            </motion.div>

            {/* Empty state */}
            <EmptyState
              title="Start your search"
              description="Enter keywords above and click Search to discover job opportunities matching your criteria."
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-3 sm:py-4 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-xs sm:text-sm text-white/20"
        >
          Job Intelligence Platform
        </motion.p>
      </footer>
    </div>
  );
}
