# Phase 2: Enrichment Pipeline Implementation Plan

**Overall Progress:** `33%`

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

- [ ] 🟨 **Step 4: Crawl4AI deep enrichment provider** *(API researched, ready to build)*
  - [x] 🟩 Research Crawl4AI REST API (endpoints, Docker config, extraction strategies)
  - [ ] 🟥 Create Docker Compose config for Crawl4AI sidecar (port 11235)
  - [ ] 🟥 Create `lib/providers/enrichment/crawl4ai.ts` — REST API client for company website crawling
  - [ ] 🟥 Implement company data extraction (tech stack, team pages, description)
  - [ ] 🟥 Map crawled data to existing `CompanyEnrichment` interface
  - [ ] 🟥 Register in enrichment factory (`index.ts`)
  - [ ] 🟥 Commit and push

- [ ] 🟥 **Step 5: Icypeas enrichment provider**
  - [ ] 🟥 Research Icypeas API docs (endpoints, auth, credit usage, response format)
  - [ ] 🟥 Create `lib/providers/enrichment/icypeas.ts` — implement `EnrichmentProvider` interface
  - [ ] 🟥 Implement email finder (1 credit), company scraper (0.5 credits), profile scraper (1.5 credits)
  - [ ] 🟥 Add `getCredits()` for credit balance tracking
  - [ ] 🟥 Map Icypeas response to `CompanyEnrichment` interface
  - [ ] 🟥 Register in enrichment factory (`index.ts`)
  - [ ] 🟥 Add `ICYPEAS_API_KEY` to `.env.example`
  - [ ] 🟥 Commit and push

- [ ] 🟥 **Step 6: Wire enrichment pipeline end-to-end**
  - [ ] 🟥 Enrichment flow: Icypeas (find email) → Reoon (verify) → Crawl4AI (deep data) → store enriched job
  - [ ] 🟥 Connect "Enrich Selected" button in SelectionBar to pipeline
  - [ ] 🟥 Add enrichment status indicators to job cards (enriched/pending/failed)
  - [ ] 🟥 Store enrichment results (extend localStorage provider or add caching)
  - [ ] 🟥 Commit and push

- [ ] 🟥 **Step 7: CSV export backend**
  - [ ] 🟥 Wire "Export Selected" button to generate CSV from selected (enriched) jobs
  - [ ] 🟥 Include enrichment fields in export (email, company data, verification status)
  - [ ] 🟥 Browser download trigger
  - [ ] 🟥 Commit and push

- [ ] 🟥 **Step 8: Cost guardrails**
  - [ ] 🟥 Credit usage tracking store (Zustand) — track Icypeas credits consumed per session/month
  - [ ] 🟥 Pre-enrichment credit estimate (show cost before user confirms)
  - [ ] 🟥 Monthly cap with warning at 50/80/95% thresholds
  - [ ] 🟥 UI: usage meter in header or settings
  - [ ] 🟥 Commit and push

- [ ] 🟥 **Step 9: Decision-Maker Leads display**
  - [ ] 🟥 Add decision-maker contacts to job detail panel (from Icypeas profile data + Crawl4AI team pages)
  - [ ] 🟥 Show verified email badge (Reoon status)
  - [ ] 🟥 Commit and push
