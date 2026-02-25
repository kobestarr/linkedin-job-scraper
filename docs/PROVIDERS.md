# Provider Architecture

The platform uses a provider pattern to abstract all external services. Each provider category has an interface, a factory, and one or more implementations.

## Provider Categories

| Category | Interface | Default | Alternatives |
|----------|-----------|---------|-------------|
| **Data Source** | `DataSourceProvider` | Apify | Captain Data, Mock |
| **Storage** | `StorageProvider` | localStorage | Supabase |
| **Enrichment** | `EnrichmentProvider` | None (noop) | Icypeas, Crawl4AI, Captain Data (all built) |
| **Verification** | `EmailVerificationProvider` | None | Reoon (free lifetime deal) |
| **Outreach** | `OutreachProvider` | CSV Export | Smartlead, Instantly |

## Switching Providers

Set the corresponding environment variable:

```bash
NEXT_PUBLIC_DATA_SOURCE=mock      # 'apify' | 'captain-data' | 'mock'
NEXT_PUBLIC_STORAGE=local         # 'local' | 'supabase'
NEXT_PUBLIC_ENRICHMENT=none       # 'none' | 'icypeas' | 'captain-data' | 'crawl4ai' | 'mock'
NEXT_PUBLIC_EMAIL_VERIFICATION=none # 'none' | 'reoon'
NEXT_PUBLIC_OUTREACH=csv          # 'csv' | 'smartlead' | 'instantly'
```

No code changes required. The factory reads the env var and returns the right implementation.

## How It Works

```
.env                          Factory                        Implementation
NEXT_PUBLIC_DATA_SOURCE=apify → getDataSourceProvider()  →  ApifyDataSource
NEXT_PUBLIC_DATA_SOURCE=mock  → getDataSourceProvider()  →  MockDataSource
```

Each factory uses the singleton pattern — the provider is instantiated once and reused.

## How to Add a New Provider

### 1. Create the implementation file

```
lib/providers/data-source/my-provider.ts
```

```typescript
import type { DataSourceProvider, ScrapeOptions, ScrapeResult } from './types';
import type { Job, JobFilters } from '@/types';

export class MyDataSource implements DataSourceProvider {
  readonly id = 'my-provider';
  readonly name = 'My Custom Provider';

  async scrape(options: ScrapeOptions, signal?: AbortSignal): Promise<ScrapeResult> {
    // Your scraping logic here
  }

  async getJobs(filters?: JobFilters): Promise<Job[]> {
    // Return cached/filtered jobs
  }

  async getLastUpdated(): Promise<Date | null> {
    // Return last scrape timestamp
  }

  async isConfigured(): Promise<boolean> {
    // Check API keys are set
  }
}
```

### 2. Register in the factory

Edit `lib/providers/data-source/index.ts`:

```typescript
import { MyDataSource } from './my-provider';

export type DataSourceType = 'apify' | 'captain-data' | 'mock' | 'my-provider';

const providers: Record<DataSourceType, () => DataSourceProvider> = {
  // ...existing providers
  'my-provider': () => new MyDataSource(),
};
```

### 3. Set the env var

```bash
NEXT_PUBLIC_DATA_SOURCE=my-provider
```

That's it. The UI, filters, and export all work without any changes.

## Interface Reference

### DataSourceProvider

```typescript
interface DataSourceProvider {
  readonly id: string;
  readonly name: string;
  scrape(options: ScrapeOptions, signal?: AbortSignal): Promise<ScrapeResult>;
  getJobs(filters?: JobFilters): Promise<Job[]>;
  getLastUpdated(): Promise<Date | null>;
  isConfigured(): Promise<boolean>;
}
```

### StorageProvider

```typescript
interface StorageProvider {
  readonly id: string;
  readonly name: string;
  getJobs(filters?: JobFilters): Promise<Job[]>;
  saveJobs(jobs: Job[]): Promise<void>;
  clearJobs(): Promise<void>;
  getThemes(): Promise<Theme[]>;
  saveTheme(theme: Theme): Promise<void>;
  deleteTheme(id: string): Promise<void>;
  getActiveTheme(): Promise<Theme | null>;
  setActiveTheme(id: string): Promise<void>;
  getPresets(): Promise<FilterPreset[]>;
  savePreset(preset: FilterPreset): Promise<void>;
  deletePreset(id: string): Promise<void>;
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
}
```

### EnrichmentProvider

```typescript
interface EnrichmentProvider {
  readonly id: string;
  readonly name: string;
  enrichJob(job: Job, options?: EnrichmentOptions): Promise<EnrichedJob>;
  enrichJobs(jobs: Job[], options?: EnrichmentOptions): Promise<EnrichedJob[]>;
  getCredits(): Promise<{ remaining: number; total: number } | null>;
  isConfigured(): Promise<boolean>;
}
```

### OutreachProvider

```typescript
interface OutreachProvider {
  readonly id: string;
  readonly name: string;
  exportLeads(leads: (Job | EnrichedJob)[], options?: ExportOptions): Promise<void>;
  pushLeads?(leads: EnrichedJob[]): Promise<{ success: number; failed: number }>;
  createCampaign?(config: CampaignConfig): Promise<Campaign>;
  isConfigured(): Promise<boolean>;
}
```

## Enrichment Provider Strategy

All enrichment providers are built and registered. The pipeline combines free and low-cost tools. Captain Data is a revenue-triggered upgrade (env var flip).

### Pipeline
```
Icypeas (find) → Reoon (verify) → Crawl4AI (deep data) → store
```

### Implementation Files

| Provider | File | Status |
|----------|------|--------|
| Icypeas | `lib/providers/enrichment/icypeas.ts` | Built |
| Crawl4AI | `lib/providers/enrichment/crawl4ai.ts` | Built |
| Captain Data | `lib/providers/enrichment/captain-data.ts` | Built |
| Mock | `lib/providers/enrichment/mock.ts` | Built |
| Reoon | `lib/providers/verification/reoon.ts` | Built |

### Supporting Infrastructure

| Component | File | Purpose |
|-----------|------|---------|
| Enrichment API | `app/api/jobs/enrich/route.ts` | POST handler with credit check |
| Credits API | `app/api/credits/route.ts` | GET balance from provider |
| Enrichment store | `stores/useEnrichmentStore.ts` | Zustand with progress + credits |
| Enrichment hook | `hooks/useEnrichment.ts` | React hook with cancellation |
| Credit balance hook | `hooks/useCreditBalance.ts` | Fetch balance on mount |
| CSV export | `lib/utils/csv-export.ts` | 27-column client-side download |
| Cost config | `lib/config/usage-limits.ts` | Credits per provider, monthly cap |
| Credit meter | `components/dashboard/CreditMeter.tsx` | Header usage bar |

### Reoon — Email Verification (free lifetime deal)
- Verifies all enriched emails before storage/outreach
- Runs at every stage, including after Captain Data upgrade
- Configured via `REOON_API_KEY` env var

### Icypeas — B2B Contact & Company Data ($19/mo)
- **Email Finder**: 1 credit per verified email (<2.5% bounce rate)
- **Company Scraper**: 0.5 credits per company profile
- **Domain Search**: 1 credit per domain
- **Profile Scraper**: 1.5 credits per LinkedIn profile
- 1,000 credits/mo on the Basic plan
- Async polling pattern: launch → poll until DEBITED (2s intervals)

### Crawl4AI — Deep Company Enrichment (free, open-source)
- Docker sidecar on port 11235 (`docker-compose.yml`)
- REST API: `POST /crawl` with markdown output
- Regex-based extraction: description, tech stack, tagline, specialties, HQ, phone
- No LLM cost — parses markdown directly
- Batch enrichment with concurrency=3

### Captain Data — Revenue-Triggered Upgrade (~$399/mo)
When first paying client (~£1k/mo) covers the cost:
- **Waterfall enrichment**: cascades through 6 sources
- **LinkedIn automation**: org charts, employee search, chained workflows
- Switch by changing `NEXT_PUBLIC_ENRICHMENT=captain-data`
- Reoon and Crawl4AI continue alongside Captain Data
