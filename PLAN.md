# Phase 2: Enrichment Pipeline Implementation Plan

**Overall Progress:** `89%`

## TLDR
Add enrichment to the job intelligence platform using a pipeline of free and low-cost providers: Crawl4AI (free) for deep company website crawling, Icypeas ($19/mo) for B2B email/company data, and Reoon (free lifetime deal) for email verification. Captain Data upgrade comes later when first paying client (~£1k/mo) covers the cost. CSV export and cost guardrails round out the phase.

## Critical Decisions
- **Flat Phase 2 (no a/b/c sub-phases):** All enrichment work is one phase; Captain Data upgrade is a revenue-triggered env var flip, not a separate development phase
- **Reoon for all email verification:** Free lifetime deal — runs as post-enrichment step at all stages, including after Captain Data upgrade
- **Crawl4AI as Docker sidecar:** Python-based, called via REST API (port 11235) from Next.js API routes
- **Icypeas is one of Captain Data's waterfall sources:** No data loss on upgrade — Captain Data cascades through Icypeas + 5 other providers (Dropcontact, Hunter, Prospeo, Findymail, Datagma)
- **Provider architecture already supports swapping:** Existing `EnrichmentProvider` interface with factory pattern — new providers slot in without code changes elsewhere

## Tasks

- [x] 🟩 **Step 1: Update PRD & roadmap docs**
  - [x] 🟩 Flatten Phase 2 roadmap (remove a/b/c sub-phases)
  - [x] 🟩 Add Reoon as email verification step
  - [x] 🟩 Add Crawl4AI and Icypeas provider strategy
  - [x] 🟩 Update PROVIDERS.md and CHANGELOG.md
  - [x] 🟩 Commit and push

- [x] 🟩 **Step 2: Flatten Phase 2 docs (remove a/b/c)**
  - [x] 🟩 Update PRD — merge Phase 2a/2b/2c into single Phase 2 with Captain Data as revenue-triggered upgrade
  - [x] 🟩 Update PROVIDERS.md — remove phase labels, keep provider details
  - [x] 🟩 Update CHANGELOG — reflect simplified phasing
  - [x] 🟩 Commit and push

- [x] 🟩 **Step 3: Reoon email verification provider**
  - [x] 🟩 Research Reoon API docs (endpoints, auth, request/response format)
  - [x] 🟩 Create `lib/providers/verification/types.ts` — `EmailVerificationProvider` interface
  - [x] 🟩 Create `lib/providers/verification/reoon.ts` — implement Reoon API client
  - [x] 🟩 Create `lib/providers/verification/index.ts` — factory with env var `NEXT_PUBLIC_EMAIL_VERIFICATION`
  - [x] 🟩 Add `REOON_API_KEY` to `.env.example`
  - [x] 🟩 Commit and push

- [x] 🟩 **Step 4: Crawl4AI deep enrichment provider**
  - [x] 🟩 Research Crawl4AI REST API (endpoints, Docker config, extraction strategies)
  - [x] 🟩 Create Docker Compose config for Crawl4AI sidecar (port 11235)
  - [x] 🟩 Create `lib/providers/enrichment/crawl4ai.ts` — REST API client for company website crawling
  - [x] 🟩 Implement company data extraction (tech stack, team pages, description)
  - [x] 🟩 Map crawled data to existing `CompanyEnrichment` interface
  - [x] 🟩 Register in enrichment factory (`index.ts`)
  - [x] 🟩 Commit and push

- [x] 🟩 **Step 5: Icypeas enrichment provider**
  - [x] 🟩 Research Icypeas API docs (endpoints, auth, credit usage, response format)
  - [x] 🟩 Create `lib/providers/enrichment/icypeas.ts` — implement `EnrichmentProvider` interface
  - [x] 🟩 Implement email finder (1 credit), company scraper (0.5 credits), domain search (1 credit)
  - [x] 🟩 Add `getCredits()` for credit balance tracking
  - [x] 🟩 Map Icypeas response to `CompanyEnrichment` interface
  - [x] 🟩 Register in enrichment factory (`index.ts`)
  - [x] 🟩 `ICYPEAS_API_KEY` already in `.env.example`
  - [x] 🟩 Commit and push

- [x] 🟩 **Step 6: Wire enrichment pipeline end-to-end**
  - [x] 🟩 Created `app/api/jobs/enrich/route.ts` — POST handler using provider factory
  - [x] 🟩 Created `stores/useEnrichmentStore.ts` — Zustand store with progress tracking
  - [x] 🟩 Created `hooks/useEnrichment.ts` — React hook with AbortController cancellation
  - [x] 🟩 Wired SelectionBar "Enrich Selected" button with spinner + progress
  - [x] 🟩 Added enrichment badges to JobCard + JobCardRich (Enriching/Enriched)
  - [x] 🟩 Merged enrichment results into job data in `app/page.tsx`
  - [x] 🟩 Commit and push

- [x] 🟩 **Step 7: CSV export**
  - [x] 🟩 Created `lib/utils/csv-export.ts` — CSV generation with 27 columns (job + enrichment fields)
  - [x] 🟩 Wired "Export CSV" button in SelectionBar — client-side download, no API needed
  - [x] 🟩 Includes enrichment fields: industry, website, employees, technologies, decision makers, etc.
  - [x] 🟩 Commit and push

- [x] 🟩 **Step 8: Cost guardrails**
  - [x] 🟩 Created `lib/config/usage-limits.ts` — credit costs per provider, monthly cap, threshold levels
  - [x] 🟩 Extended enrichment store with `sessionCreditsUsed`, `creditBalance`, `addCreditsUsed()`
  - [x] 🟩 Created `app/api/credits/route.ts` — GET endpoint for provider credit balance
  - [x] 🟩 Created `hooks/useCreditBalance.ts` — fetch balance on mount
  - [x] 🟩 Created `components/dashboard/CreditMeter.tsx` — color-coded bar in header (ok/warning/high/critical)
  - [x] 🟩 Pre-enrichment confirmation with cost estimate in SelectionBar
  - [x] 🟩 Pre-flight credit check in API route (402 if insufficient)
  - [x] 🟩 Enrichment blocked at critical threshold (95%+ of monthly cap)
  - [x] 🟩 `NEXT_PUBLIC_MONTHLY_CREDIT_CAP` env var (default: 500)
  - [x] 🟩 Commit and push

- [ ] 🟥 **Step 9: Decision-Maker Leads display**
  - [ ] 🟥 Add decision-maker contacts to job detail panel (from Icypeas profile data + Crawl4AI team pages)
  - [ ] 🟥 Show verified email badge (Reoon status)
  - [ ] 🟥 Commit and push
