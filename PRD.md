# LinkedIn Job Intelligence Platform — Product Requirements Document (PRD)

**Version:** 2.0 (Reconstructed)  
**Last Updated:** February 6, 2026  
**Status:** Slice 3 Complete, Slice 4 = MVP Demo  

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

## 3. Architecture Overview

### 3.1 System Architecture
- Next.js Dashboard
- CLI Scraper (legacy, supports data acquisition)
- Provider Layer (swappable sources)
- Data Source: Apify (required)
- Storage: SQLite (MVP) → Postgres (future)
- Enrichment: Captain Data (Phase 2)
- Outreach: CSV export (Phase 2), LLM email generation (Phase 2)

### 3.2 Central Codebase + Multi‑Instance
- Single repository
- Ability to deploy updates across multiple client instances
- White‑label branding via environment config per instance

---

## 4. Data Model (MVP)

### Job
- id
- title
- company
- companyLinkedInUrl
- companyLogo
- location
- postedAt (ISO)
- postedAtRelative
- url
- description
- employmentType
- experienceLevel
- companySize (when available)
- dedupeKey (company + title + date)

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

### Required Filters (MVP)
- Job Title
- Country
- Date Range (24h, 3d, 7d, 14d, 30d)
- Company Size
- Exclude Recruiters (default ON)
- Exclude Companies list

### Search Execution
- Search Now button
- Auto‑rerun on filter change
- Auto‑refresh interval: 30m / 1h / 2h / 4h

### Deduplication
- company + job title + posted date
- Repeat postings should surface and be flagged as “repeat hiring signal.”

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
