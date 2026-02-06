import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import type { ScrapeOptions } from '@/lib/providers/data-source/types';

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
const ACTOR_ID = process.env.APIFY_ACTOR_ID || '2rJKkhh7vjpX7pvjg';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action || 'start';

    if (!APIFY_TOKEN) {
      return NextResponse.json(
        { error: 'Data source not configured. Check API keys in environment.' },
        { status: 503 }
      );
    }

    if (action === 'start') {
      return handleStart(body);
    } else if (action === 'poll') {
      return handlePoll(body);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    logger.error('API /jobs/scrape failed', { error });
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleStart(body: ScrapeOptions & { action?: string }) {
  if (!body.jobTitle || typeof body.jobTitle !== 'string') {
    return NextResponse.json(
      { error: 'jobTitle is required and must be a string' },
      { status: 400 }
    );
  }

  const dateRangeMap: Record<string, string> = {
    '24h': 'r86400', last24hours: 'r86400',
    '3d': 'r259200', last3days: 'r259200',
    '7d': 'r604800', last7days: 'r604800',
    '14d': 'r1209600', last14days: 'r1209600',
    '30d': 'r2592000', last30days: 'r2592000',
  };

  const publishedAt = body.dateRange ? dateRangeMap[body.dateRange] || null : null;
  const maxResults = Math.max(body.maxResults ?? 150, 150);

  const actorInput = {
    keyword: [body.jobTitle.trim()],
    location: body.location || 'United States',
    maxItems: maxResults,
    saveOnlyUniqueItems: true,
    ...(publishedAt && { publishedAt }),
  };

  logger.info('[API] Starting Apify run', { jobTitle: body.jobTitle });

  const response = await fetch(`https://api.apify.com/v2/acts/${ACTOR_ID}/runs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${APIFY_TOKEN}`,
    },
    body: JSON.stringify(actorInput),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Apify API error: ${response.status} - ${errorText}`);
  }

  const run = await response.json();

  return NextResponse.json({
    runId: run.data.id,
    datasetId: run.data.defaultDatasetId,
    status: 'RUNNING',
  });
}

async function handlePoll(body: { runId: string; datasetId: string; offset?: number }) {
  const { runId, datasetId, offset = 0 } = body;

  if (!runId || !datasetId) {
    return NextResponse.json({ error: 'runId and datasetId are required' }, { status: 400 });
  }

  // Check run status (use query param token as fallback for auth)
  const statusRes = await fetch(
    `https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`,
    { headers: { Authorization: `Bearer ${APIFY_TOKEN}` } }
  );

  if (!statusRes.ok) {
    throw new Error(`Failed to check run status: ${statusRes.status}`);
  }

  const { data: runData } = await statusRes.json();

  let status: 'RUNNING' | 'SUCCEEDED' | 'FAILED' = 'RUNNING';
  if (runData.status === 'SUCCEEDED') status = 'SUCCEEDED';
  else if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(runData.status)) status = 'FAILED';

  // Fetch new items from dataset (using offset to get only new ones)
  const itemsRes = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?format=json&offset=${offset}&limit=100&token=${APIFY_TOKEN}`,
    { headers: { Authorization: `Bearer ${APIFY_TOKEN}` } }
  );

  if (!itemsRes.ok) {
    throw new Error(`Failed to fetch dataset: ${itemsRes.status}`);
  }

  const items = await itemsRes.json();
  const jobs = Array.isArray(items) ? items : [];

  return NextResponse.json({
    status,
    jobs,
    newCount: jobs.length,
    offset: offset + jobs.length,
  });
}
