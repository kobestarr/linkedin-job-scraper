'use client';

import { useCallback, useEffect } from 'react';
import { useEnrichmentStore } from '@/stores/useEnrichmentStore';

/**
 * Hook that fetches credit balance from the active enrichment provider.
 * Fetches on mount and provides a manual refresh function.
 */
export function useCreditBalance() {
  const creditBalance = useEnrichmentStore((s) => s.creditBalance);
  const isLoading = useEnrichmentStore((s) => s.isLoadingBalance);
  const setCreditBalance = useEnrichmentStore((s) => s.setCreditBalance);
  const setLoadingBalance = useEnrichmentStore((s) => s.setLoadingBalance);

  const fetchBalance = useCallback(async () => {
    setLoadingBalance(true);
    try {
      const response = await fetch('/api/credits');
      if (!response.ok) return;

      const data = await response.json();

      if (data.credits) {
        setCreditBalance({
          remaining: data.credits.remaining,
          total: data.credits.total,
          provider: data.provider,
        });
      } else {
        setCreditBalance(null);
      }
    } catch {
      // Silently fail — credit display is non-critical
    } finally {
      setLoadingBalance(false);
    }
  }, [setCreditBalance, setLoadingBalance]);

  // Fetch on mount
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { creditBalance, isLoading, refresh: fetchBalance };
}
