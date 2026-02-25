'use client';

import { useCreditBalance } from '@/hooks/useCreditBalance';
import { useEnrichmentStore } from '@/stores/useEnrichmentStore';
import { getUsageLevel, getMonthlyCreditCap } from '@/lib/config/usage-limits';

const LEVEL_COLORS = {
  ok: 'text-emerald-400',
  warning: 'text-amber-400',
  high: 'text-orange-400',
  critical: 'text-red-400',
} as const;

const BAR_COLORS = {
  ok: 'bg-emerald-400',
  warning: 'bg-amber-400',
  high: 'bg-orange-400',
  critical: 'bg-red-400',
} as const;

export function CreditMeter() {
  const { creditBalance, isLoading } = useCreditBalance();
  const sessionCreditsUsed = useEnrichmentStore((s) => s.sessionCreditsUsed);

  // Don't show if no provider with credits (Crawl4AI, mock, none)
  if (!creditBalance && !isLoading) return null;

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-white/30">
        <CreditIcon className="w-3.5 h-3.5" />
        <span className="animate-pulse">...</span>
      </div>
    );
  }

  if (!creditBalance) return null;

  const cap = getMonthlyCreditCap();
  const level = getUsageLevel(sessionCreditsUsed, cap);
  const remaining = creditBalance.remaining;
  const total = creditBalance.total;
  const pct = total > 0 ? Math.max(0, Math.min(100, (remaining / total) * 100)) : 0;

  return (
    <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
      <CreditIcon className={`w-3.5 h-3.5 ${LEVEL_COLORS[level]}`} />
      <div className="flex flex-col gap-0.5">
        <span className={`text-[10px] font-medium leading-none ${LEVEL_COLORS[level]}`}>
          {remaining.toLocaleString()} credits
        </span>
        <div className="w-16 h-1 rounded-full bg-white/[0.08] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${BAR_COLORS[level]}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      {sessionCreditsUsed > 0 && (
        <span className="text-[10px] text-white/30 leading-none">
          -{sessionCreditsUsed} today
        </span>
      )}
    </div>
  );
}

function CreditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <path d="M12 18V6" />
    </svg>
  );
}
