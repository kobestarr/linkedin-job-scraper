'use client';

import { GlassPanel } from '@/components/ui/GlassPanel';

interface ErrorStateProps {
  error: Error | string;
  onRetry?: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const message = error instanceof Error ? error.message : error;

  return (
    <GlassPanel className="p-6 sm:p-12 text-center">
      {/* Error icon */}
      <div className="w-14 h-14 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-xl sm:rounded-2xl bg-red-500/10 flex items-center justify-center animate-fade-in">
        <svg
          className="w-6 h-6 sm:w-10 sm:h-10 text-red-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      {/* Title */}
      <h3 className="text-base sm:text-xl font-semibold text-white/90 mb-1 sm:mb-2 animate-fade-in">
        Search Failed
      </h3>

      {/* Message */}
      <p className="text-sm sm:text-base text-white/50 mb-4 sm:mb-6 max-w-md mx-auto animate-fade-in">
        {message}
      </p>

      {/* Retry button */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-primary animate-fade-in"
        >
          Try Again
        </button>
      )}
    </GlassPanel>
  );
}
