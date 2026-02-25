import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getEnrichmentProvider } from '@/lib/providers/enrichment';
import { estimateCredits } from '@/lib/config/usage-limits';
import type { Job } from '@/types';
import type { EnrichedJob } from '@/lib/providers/enrichment/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobs } = body as { jobs: Job[] };

    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
      return NextResponse.json(
        { error: 'jobs array is required and must not be empty' },
        { status: 400 }
      );
    }

    const provider = getEnrichmentProvider();

    if (!provider) {
      return NextResponse.json(
        { error: 'No enrichment provider configured. Set NEXT_PUBLIC_ENRICHMENT in environment.' },
        { status: 503 }
      );
    }

    const isReady = await provider.isConfigured();
    if (!isReady) {
      return NextResponse.json(
        { error: `Enrichment provider "${provider.id}" is not configured. Check API keys.` },
        { status: 503 }
      );
    }

    // Pre-flight credit check
    const credits = await provider.getCredits();
    const estimated = estimateCredits(jobs.length, provider.id);

    if (credits && estimated > 0 && credits.remaining < estimated) {
      return NextResponse.json(
        {
          error: `Insufficient credits. Need ~${estimated}, have ${credits.remaining}.`,
          creditsRemaining: credits.remaining,
          creditsNeeded: estimated,
        },
        { status: 402 }
      );
    }

    logger.info('[API] Starting enrichment', {
      provider: provider.id,
      jobCount: jobs.length,
      estimatedCredits: estimated,
    });

    const results: EnrichedJob[] = await provider.enrichJobs(jobs, {
      concurrency: 3,
    });

    const enrichedCount = results.filter((r) => r.companyData).length;
    const failedCount = results.length - enrichedCount;

    // Fetch updated balance after enrichment
    const updatedCredits = await provider.getCredits();

    logger.info('[API] Enrichment complete', {
      provider: provider.id,
      total: results.length,
      enriched: enrichedCount,
      failed: failedCount,
      creditsUsed: estimated,
    });

    return NextResponse.json({
      results,
      enrichedCount,
      failedCount,
      creditsUsed: estimated,
      creditsRemaining: updatedCredits?.remaining ?? null,
    });
  } catch (error) {
    logger.error('API /jobs/enrich failed', { error });
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
