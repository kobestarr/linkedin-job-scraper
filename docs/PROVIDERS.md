# Provider Architecture

The platform uses a provider pattern to abstract all external services. Each provider category has an interface, a factory, and one or more implementations.

## Provider Categories

| Category | Interface | Default | Alternatives |
|----------|-----------|---------|-------------|
| **Data Source** | `DataSourceProvider` | Apify | Captain Data, Mock |
| **Storage** | `StorageProvider` | localStorage | Supabase |
| **Enrichment** | `EnrichmentProvider` | None (noop) | Icypeas + Crawl4AI (Phase 2a), Captain Data + Crawl4AI (Phase 2b) |
| **Outreach** | `OutreachProvider` | CSV Export | Smartlead, Instantly |

## Switching Providers

Set the corresponding environment variable:

```bash
NEXT_PUBLIC_DATA_SOURCE=mock      # 'apify' | 'captain-data' | 'mock'
NEXT_PUBLIC_STORAGE=local         # 'local' | 'supabase'
NEXT_PUBLIC_ENRICHMENT=none       # 'none' | 'icypeas' | 'captain-data' | 'crawl4ai'
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

The enrichment layer follows a staged upgrade path based on revenue:

### Phase 2a — Pre-Revenue (Icypeas + Crawl4AI together)

**Icypeas** ($19/mo, 1,000 credits):
- **Email Finder**: 1 credit per verified email (<2.5% bounce rate)
- **Company Scraper**: 0.5 credits per company profile
- **Profile Scraper**: 1.5 credits per LinkedIn profile
- 1,000 credits/mo on the Basic plan (~2,000 companies or ~1,000 emails)
- API access included on all plans
- Pay-per-result model: only charged for verified data

**Crawl4AI** (free, runs alongside Icypeas from day one):
- Open-source Python crawler deployed as Docker sidecar (REST API on port 11235)
- Crawls company websites for data not available in B2B databases
- Tech stack detection, team page extraction, job description deep analysis
- LLM-driven structured extraction from unstructured pages
- No per-query cost (aside from optional LLM calls for extraction)

### Phase 2b — First Paying Client (Captain Data + Crawl4AI)
Upgrade Icypeas → Captain Data (~$399/mo, subsidized by ~£1k/mo client revenue):
- **Waterfall enrichment**: cascades through multiple sources (including Icypeas) for higher find rates
- **LinkedIn automation**: org charts, employee search, chained workflows
- **Richer firmographic data**: funding, growth signals, tech stack
- Existing provider implementation already built (`lib/providers/enrichment/captain-data.ts`)
- Switch by changing `NEXT_PUBLIC_ENRICHMENT=captain-data`
- Crawl4AI continues as supplementary deep enrichment at this stage
