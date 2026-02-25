import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getEnrichmentProvider } from '@/lib/providers/enrichment';
import { getMonthlyCreditCap } from '@/lib/config/usage-limits';

/**
 * GET /api/credits — fetch current credit balance from the active enrichment provider.
 */
export async function GET() {
  try {
    const provider = getEnrichmentProvider();

    if (!provider) {
      return NextResponse.json({
        provider: 'none',
        credits: null,
        monthlyCap: getMonthlyCreditCap(),
      });
    }

    const isReady = await provider.isConfigured();
    if (!isReady) {
      return NextResponse.json({
        provider: provider.id,
        credits: null,
        configured: false,
        monthlyCap: getMonthlyCreditCap(),
      });
    }

    const credits = await provider.getCredits();

    logger.info('[API] Credit balance fetched', {
      provider: provider.id,
      credits,
    });

    return NextResponse.json({
      provider: provider.id,
      credits,
      configured: true,
      monthlyCap: getMonthlyCreditCap(),
    });
  } catch (error) {
    logger.error('API /credits failed', { error });
    const message = error instanceof Error ? error.message : 'Failed to fetch credits';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
