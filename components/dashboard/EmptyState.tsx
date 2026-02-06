'use client';

import { GlassPanel } from '@/components/ui/GlassPanel';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title = 'No jobs found',
  description = 'Start by running a search or adjusting your filters.',
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <GlassPanel className="p-6 sm:p-12 text-center">
      {/* Icon */}
      <div className="w-14 h-14 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-700/20 flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6 sm:w-10 sm:h-10 text-primary-400"
        >
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M3 9h18" />
          <path d="M9 21V9" />
        </svg>
      </div>

      {/* Text */}
      <h3 className="text-base sm:text-xl font-semibold text-white/90 mb-1 sm:mb-2">
        {title}
      </h3>

      <p className="text-sm sm:text-base text-white/50 mb-4 sm:mb-6 max-w-md mx-auto">
        {description}
      </p>

      {/* Action button */}
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-primary">
          {actionLabel}
        </button>
      )}
    </GlassPanel>
  );
}
