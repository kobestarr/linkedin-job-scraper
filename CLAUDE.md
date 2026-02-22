# CLAUDE.md — Project Context for AI Assistants

## Project Overview
LinkedIn Job Intelligence Platform — a premium, white-label SaaS for recruitment agencies. Scrapes LinkedIn jobs via Apify, enriches with company/contact data, and displays in a glassmorphic dashboard.

## Current Status
- **Phase 1 (Complete):** Scraping, filtering, UI dashboard (v1.3.0, Slice 6)
- **Phase 2 (In Progress):** Enrichment pipeline — see PLAN.md for step-by-step tracker

## Tech Stack
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand, TanStack React Query v5
- **Backend:** Next.js API routes, Apify (scraping)
- **Architecture:** Provider pattern — swap services via env vars, no code changes

## Provider Categories
| Category | Env Var | Current |
|----------|---------|---------|
| Data Source | `NEXT_PUBLIC_DATA_SOURCE` | apify / mock |
| Storage | `NEXT_PUBLIC_STORAGE` | local |
| Enrichment | `NEXT_PUBLIC_ENRICHMENT` | none (icypeas, captain-data planned) |
| Verification | `NEXT_PUBLIC_EMAIL_VERIFICATION` | none (reoon built) |
| Outreach | `NEXT_PUBLIC_OUTREACH` | csv |

## Enrichment Pipeline (Phase 2)
```
Icypeas (find email) → Reoon (verify) → Crawl4AI (deep data) → store
```
- **Reoon:** Free lifetime deal, email verification — provider built, not yet wired
- **Icypeas:** $19/mo, B2B email/company data — provider not yet built
- **Crawl4AI:** Free open-source Docker sidecar — provider not yet built
- **Captain Data:** ~$399/mo upgrade when first paying client covers cost — provider already built

## Key Files
- `PRD.md` — Product requirements and Phase 2 roadmap
- `PLAN.md` — Implementation tracker with step-by-step progress
- `CHANGELOG.md` — Version history
- `docs/PROVIDERS.md` — Provider architecture and enrichment strategy
- `lib/providers/` — All provider implementations
- `types/index.ts` — Core TypeScript types (~450 lines)

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
