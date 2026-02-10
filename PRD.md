# LinkedIn Job Intelligence Platform — Product Requirements Document (PRD)

**Version:** 2.0 (Reconstructed)
**Last Updated:** February 7, 2026
**Status:** Slice 5 Complete (v1.2.0) — UX Polish, Detail Panel, Streaming, Sorting, Selection

---

## 1. Executive Summary

### 1.1 Product Vision
A premium, white‑label Job Intelligence platform that feels bespoke to each client, delivering fast, beautiful, and actionable hiring intelligence — with Decision‑Maker Leads as the differentiator.

### 1.2 Positioning
Product‑as‑a‑Service with a high‑spec setup fee plus ongoing service. Designed to feel more advanced than it is by pairing perceived speed with a premium UI and a frictionless workflow.

### 1.3 Primary Users
- Recruitment agencies (primary)
- Open to sales teams, agencies, freelancers

### 1.4 Core Value
- Detect companies hiring now
- Identify Decision‑Maker Leads
- Drive outreach without manual search

---

## 2. MVP Definition (Slice 4 Demo)

### Must Demonstrate
1. Live LinkedIn scraping via Apify
2. Search by job title + country
3. Filters:
   - Date range
   - Company size
   - Exclude recruiters (default ON, toggle)
   - Exclude company list (pre‑set during onboarding)
4. Two result views:
   - List view (fast scan)
   - Card view (logo + richer metadata)
5. Dashboard‑only experience (no Google Sheets)
6. High‑spec UI: liquid‑glass aesthetic, premium feel, accessibility‑optimized, demo‑ready for Zoom/Meet/Teams

### Out of Scope for MVP
- Full enrichment automation
- Auth/multi‑user
- CSV/CRM export (must be plumbed for next stage)

---

## 2.1 Current Implementation Status

### Completed (v1.2.0 — Slice 5)

| Feature | Status | Notes |
|---------|--------|-------|
| Live LinkedIn scraping | DONE | Apify start/poll streaming architecture |
| Search by title + country | DONE | With location dropdown |
| Date range filter | DONE | 24h, 3d, 7d, 14d, 30d |
| Company size filter | PARTIAL | UI built, filtering pending enrichment data |
| Exclude recruiters | DONE | Default ON, toggleable |
| Exclude companies | DONE | Pre-set list during onboarding |
| List view | DONE | Compact row layout |
| Card view | DONE | Logo + metadata + Power Lead badges |
| Glass UI design system | DONE | Dark mode, high contrast, demo-ready |
| Streaming results | DONE | Progressive loading as Apify finds jobs |
| Job detail panel | DONE | Slide-in drawer with full description |
| Sorting (5 options) | DONE | Recent, salary, applicants, A-Z, relevance |
| Match mode filter | DONE | 5 modes: exact title → broad → off |
| Job selection + batch actions | DONE | Checkbox, shift-click, floating bar |
| Company logos (Clearbit) | DONE | With letter-initial fallback |
| Power Leads scoring | DONE | Composite score, badges, card glow |
| Motion tracker loading | DONE | Aliens-style canvas radar, configurable text |
| White-label config | DONE | Env-var driven branding, loading messages |
| LinkedIn URL cleanup | DONE | Strips tracking params |
| Poll retry logic | DONE | 3 retries with backoff |
| Seniority filter | DONE | UI dropdown |
| Employment type filter | DONE | UI dropdown |
| Pay filter | DONE | UI dropdown |
| Auto-refresh | DONE | 30m / 1h / 2h / 4h intervals |
| Result caching | DONE | localStorage, last 200 jobs |

### Not Yet Built

| Feature | Target | Notes |
|---------|--------|-------|
| "Prime Picks" sort | Slice 6 | Sort by Power Lead score |
| Company enrichment | Phase 2 | Captain Data integration |
| Decision-Maker Leads | Phase 2 | Requires enrichment pipeline |
| CSV/CRM export | Phase 2 | SelectionBar buttons wired, backend pending |
| Auth/multi-user | Phase 2 | Provider choice TBD |
| Saved searches | Phase 2 | |
| Notes per job | Phase 2 | |
| Analytics dashboard | Phase 2 | |
| Cost guardrails | Phase 2 | Credit caps, usage meters |

---

## 3. Architecture Overview

### 3.1 System Architecture
- Next.js 14 Dashboard (App Router)
- Provider Layer (swappable sources)
- Data Source: Apify start/poll streaming (actor `2rJKkhh7vjpX7pvjg`)
- Storage: localStorage cache (MVP) → SQLite/Postgres (future)
- Enrichment: Captain Data (Phase 2)
- Outreach: CSV export (Phase 2), LLM email generation (Phase 2)
- State: Zustand with localStorage persistence (version-migrated)
- Pipeline: Post-process → client filters → sorting (all client-side, instant)

**Note:** Legacy CLI scraper exists in `src/` directory (Node.js-based, Google Sheets export). This is maintained for existing CLI workflows but new features are built in the Next.js provider architecture.

### 3.2 Central Codebase + Multi‑Instance
- Single repository
- Ability to deploy updates across multiple client instances
- White‑label branding via environment config per instance

### 3.3 Code Quality Standards
- **TypeScript**: Strict typing, no `any` types in production code
- **Logging**: Unified logger with context support (no raw console.log)
- **Error Handling**: Try-catch for async, centralized error messages
- **React Hooks**: Proper cleanup for effects, timers, and event listeners
- **Performance**: Memoization for expensive calculations, stable references
- **Security**: Environment variables for secrets, input validation, deterministic IDs for SSR

### 3.4 Code Review Process
All code changes undergo review for:
- Proper error handling and async cleanup
- TypeScript type safety
- Production readiness (no debug statements, TODOs tracked)
- React best practices (effect cleanup, dependency arrays)
- Security (auth checks, input validation)

---

## 4. Data Model (MVP)

### Job
- id (deterministic: jobId from Apify, or company-title-date composite)
- title
- company
- companyUrl
- companyLinkedIn
- companyLogo
- location
- postedAt (ISO)
- postedAtRelative
- url (cleaned — tracking params stripped)
- description
- salary (formatted from salaryInfo array)
- employmentType
- experienceLevel
- applicantCount (parsed from "Be among the first N applicants")
- companySize (when available — pending enrichment)
- dedupeKey (company + title + date)
- isRecruiter (flagged by recruiter keyword detection)
- isRepeatHiring (flagged by dedup pipeline)

### Decision‑Maker Lead (Phase 2)
- fullName
- title
- linkedinUrl
- department
- seniority
- recentlyHiredOrPromoted
- source (Captain Data)

---

## 5. Filters & Search

### Implemented Filters
- Job Title (text input)
- Location / Country (dropdown)
- Date Range (24h, 3d, 7d, 14d, 30d) — server-side via Apify
- Company Size (UI built, filtering pending enrichment)
- Seniority Level (dropdown)
- Employment Type (dropdown)
- Pay Range (dropdown)
- Exclude Recruiters (default ON, toggle)
- Exclude Companies list (pre-set)
- Match Mode (Exact Title / All Words Title / All Words Anywhere / Broad / Off) — client-side

### Sorting
- Most Recent (default)
- Highest Salary
- Most Applicants
- Company A–Z
- Best Match (relevance — word frequency scoring)
- Prime Picks (planned — Power Lead score)

### Search Execution
- Search Now button
- Streaming results: jobs appear as Apify finds them
- Auto‑refresh interval: 30m / 1h / 2h / 4h
- Cached last results shown immediately on reload

### Deduplication
- company + job title + posted date
- Repeat postings surface and are flagged as "repeat hiring signal"
- Dedupe runs during streaming to prevent duplicates across poll batches

---

## 6. UI/UX Requirements

### Visual Direction
- Apple‑like liquid glass, premium, sleek
- Animations that feel fast
- High‑contrast accessibility

### Performance Perception
- Progressive loading (shell → list → enriched info)
- Background pre‑fetching
- Cached last results shown immediately
- Skeletons + staged reveal

### Views
- List view for speed
- Card view for impact (logo + richer metadata)

### Demo Optimization
- Readable at distance
- Strong contrast for video calls
- Immediate “wow” on load

---

## 7. Decision‑Maker Leads — Flow Logic (Phase 2, Beta‑First)

### Goal
Identify the most relevant hiring decision‑makers for each role.

### Flow
1. Infer department from job title (rule‑based dictionary, editable).
2. Resolve company LinkedIn URL (use job data or companies/find).
3. Enrich company (companies/enrich) to get size, industry, domain.
4. Query company employees using Sales Navigator‑style filters:
   - Department keywords
   - Seniority levels
   - Title patterns
5. Rank and display top 3–5 Decision‑Maker Leads.
6. Optional deep enrich on click.

### Iteration‑Ready Requirements
- Title patterns admin‑editable
- Feedback loop: “Was this the right decision maker?”
- Ranking model versioned and testable

---

## 8. Cost Guardrails — Logic (Beta‑First)

### Controls
- Monthly credit cap
- Per‑run credit cap
- Auto‑enrich ON/OFF
- Require approval after cap

### Transparency
- Pre‑run credit estimate
- Live usage meter
- 50/80/95% alerts
- Detailed cost logs per run

### Safety Defaults
- New tenants: enrichment OFF by default
- Cap per run: 50 (configurable)

### Iteration‑Ready Requirements
- Thresholds and caps configurable and testable
- Analytics to measure cap hits + adjust defaults
- UX copy tuned based on beta feedback

---

## 9. Phase 2 Roadmap

1. Enrichment (Captain Data)
   - Company enrichment
   - Decision‑Maker Leads
2. Outreach
   - CSV export
   - LLM‑generated outreach emails
3. Automation
   - Multi‑tenant settings
   - Usage billing
4. Advanced UX
   - Saved searches
   - Notes
   - Analytics

---

## 10. Pricing & Packaging

### Tier 1: Core
- Setup: £2,500
- Monthly: £750
- Branded instance
- Up to 5 job title/location combinations
- Contact enrichment: 500 leads/month
- CSV export
- Email support

### Tier 2: Premium
- Setup: £4,500
- Monthly: £1,200
- Custom domain
- Up to 15 combinations
- Contact enrichment: 2,000 leads/month
- CRM integration (Bullhorn, JobAdder, Vincere)
- 5 seats
- Slack/phone support

### Tier 3: Enterprise
- Setup: £10,000
- Monthly: £2,500+
- Unlimited combinations
- Unlimited enrichment
- Custom integrations
- API access
- Dedicated account manager
- White‑glove support

---

## 11. Technical Requirements

- SQLite for MVP → Postgres ready
- Central codebase deployable to multiple instances
- Apify is required
- CSV export plumbed, not exposed in MVP
- Accessibility prioritized
- Designed for demo clarity

---

## 12. Open Questions

1. Auth provider choice for Phase 2?
2. Decision‑maker department mapping defaults — confirm title lists?
3. Any target industries to prioritize?
