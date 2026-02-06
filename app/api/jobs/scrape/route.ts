import { NextRequest, NextResponse } from 'next/server';
import { getDataSourceProvider } from '@/lib/providers/data-source';
import { logger } from '@/lib/logger';
import type { ScrapeOptions } from '@/lib/providers/data-source/types';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ScrapeOptions;

    if (!body.jobTitle || typeof body.jobTitle !== 'string') {
      return NextResponse.json(
        { error: 'jobTitle is required and must be a string' },
        { status: 400 }
      );
    }

    const dataSource = getDataSourceProvider();

    // Check if provider is configured
    const isConfigured = await dataSource.isConfigured();
    if (!isConfigured) {
      return NextResponse.json(
        { error: 'Data source not configured. Check API keys in environment.' },
        { status: 503 }
      );
    }

    const options: ScrapeOptions = {
      jobTitle: body.jobTitle.trim(),
      location: body.location,
      dateRange: body.dateRange,
      maxResults: body.maxResults ?? 150,
      companySizes: body.companySizes,
      excludeRecruiters: body.excludeRecruiters,
      excludeCompanies: body.excludeCompanies,
    };

    const result = await dataSource.scrape(options);

    return NextResponse.json(result);
  } catch (error) {
    logger.error('API /jobs/scrape failed', { error });

    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
