# CLAUDE.md — Project Context for AI Assistants

## Project Overview
LinkedIn Job Intelligence Platform — a premium, white-label SaaS for recruitment agencies. Scrapes LinkedIn jobs via Apify, enriches with company/contact data, and displays in a glassmorphic dashboard.

## Current Status
- **Phase 1 (Complete):** Scraping, filtering, UI dashboard (v1.3.0, Slice 6)
- **Phase 2 (Complete):** Enrichment pipeline — all 9 steps done (v2.0.0)
- **Phase 3 (Not Started):** Auth, outreach integrations, CRM sync, auto-brand extraction

## Tech Stack
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand, TanStack React Query v5
- **Backend:** Next.js API routes, Apify (scraping)
- **Enrichment:** Icypeas, Crawl4AI (Docker sidecar), Reoon (email verification)
- **Architecture:** Provider pattern — swap services via env vars, no code changes

## Provider Categories
| Category | Env Var | Options |
|----------|---------|---------|
| Data Source | `NEXT_PUBLIC_DATA_SOURCE` | apify / mock |
| Storage | `NEXT_PUBLIC_STORAGE` | local |
| Enrichment | `NEXT_PUBLIC_ENRICHMENT` | none / icypeas / crawl4ai / captain-data / mock |
| Verification | `NEXT_PUBLIC_EMAIL_VERIFICATION` | none / reoon |
| Outreach | `NEXT_PUBLIC_OUTREACH` | csv |

## Enrichment Pipeline
```
Icypeas (find email/company) → Reoon (verify email) → Crawl4AI (deep website data) → store
```
- **Icypeas:** $19/mo, email finder + company scraper + domain search — `lib/providers/enrichment/icypeas.ts`
- **Reoon:** Free lifetime deal, email verification — `lib/providers/verification/reoon.ts`
- **Crawl4AI:** Free Docker sidecar (port 11235), regex extraction — `lib/providers/enrichment/crawl4ai.ts`
- **Captain Data:** ~$399/mo upgrade (env var flip) — `lib/providers/enrichment/captain-data.ts`

## Phase 2 Features Built
- Enrichment API route (`app/api/jobs/enrich/route.ts`) with pre-flight credit check
- Credit balance API (`app/api/credits/route.ts`)
- Enrichment store (`stores/useEnrichmentStore.ts`) with progress + credit tracking
- Enrichment hook (`hooks/useEnrichment.ts`) with AbortController cancellation
- Credit balance hook (`hooks/useCreditBalance.ts`)
- CSV export utility (`lib/utils/csv-export.ts`) — 27 columns, client-side download
- Cost guardrails (`lib/config/usage-limits.ts`) — monthly cap, thresholds, per-provider costs
- Credit meter component (`components/dashboard/CreditMeter.tsx`) — color-coded header bar
- Company Intel + Decision Makers sections in JobDetailPanel
- Enrichment badges on job cards (Enriching/Enriched)

## White-Label Configuration
Already supports per-client branding via env vars:
- `NEXT_PUBLIC_APP_TITLE` — header title
- `NEXT_PUBLIC_LOGO_URL` — custom logo URL
- `NEXT_PUBLIC_PRIMARY_COLOR` — RGB values for Tailwind
- `NEXT_PUBLIC_CLIENT_NAME` — client identifier
- `NEXT_PUBLIC_LOADING_MESSAGES` — custom loading text
- Future: auto-brand extraction from client URL (Phase 3)

## Key Files
- `PRD.md` — Product requirements (v3.0)
- `PLAN.md` — Phase 2 step tracker (100% complete)
- `CHANGELOG.md` — Version history
- `docs/PROVIDERS.md` — Provider architecture and enrichment strategy
- `lib/providers/` — All provider implementations
- `types/index.ts` — Core TypeScript types

## Code Conventions
- TypeScript strict, no `any` in production (eslint-disable comment when interfacing with external APIs)
- Unified logger (`lib/logger.ts`) — no raw console.log
- Provider pattern: interface → factory → implementation → env var
- Deterministic IDs (no Math.random), proper effect cleanup
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`

## Important Notes
- `node_modules` not installed in dev environment — can't run tsc/build checks
- Legacy CLI scraper in `src/` — maintained but new features go in Next.js architecture
- White-label: branding via env vars per client instance
- API keys go in `.env` only, never committed
