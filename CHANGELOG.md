# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- **Missing logger import** — Added missing `logger` import in `hooks/useJobCache.ts`
- **Animation ref cleanup** — Reset `prevTimeRef` in `SearchLoadingState` on animation start to prevent time jump issues
- **Deterministic ID generation** — Replaced `Math.random()` in `ApifyDataSource` with deterministic `company-title-date` composite ID
- **Code cleanup** — Simplified placeholder comment in company size filter (removed commented-out code)
- **Documentation** — Added inline comment documenting default Apify actor ID purpose

### Planned
- "Prime Picks" sort option (sort by Power Lead score)

## [1.2.0] - 2026-02-07

### Added

- **Streaming Search Architecture** (`hooks/useJobSearch.ts`, `app/api/jobs/scrape/route.ts`)
  - Start/poll model: fires Apify run, then polls for results in batches
  - Results stream into the UI as they arrive (progressive loading)
  - Retry logic: 3 consecutive retries on transient poll failures with "Reconnecting..." status
  - First poll delayed 3s to let Apify initialize

- **Job Detail Panel** (`components/dashboard/JobDetailPanel.tsx`)
  - Right-side slide-in drawer (480px–560px) with framer-motion spring animation
  - Full job description with intelligent heading detection (section headers, metadata fields, title-case)
  - Company logo with Clearbit fallback and letter-initial default
  - Metadata pills (location, employment type, experience, salary, applicants, posted date)
  - Power Lead / Strong Lead / Repeat Hiring / Recruiter badges
  - "View on LinkedIn" and "Copy Link" footer actions
  - Escape key to close, backdrop click to close

- **Sorting** (`lib/pipeline/post-process.ts`, `components/filters/SortDropdown.tsx`)
  - 5 sort options: Most Recent, Highest Salary, Most Applicants, Company A–Z, Best Match (relevance)
  - Relevance scoring: counts search term word occurrences in title + description
  - Instant client-side sort via `useMemo` derivation chain

- **Match Mode Filter** (`components/filters/MatchModeFilter.tsx`)
  - 5 modes: Exact Title, All Words in Title, All Words Anywhere, Broad Match, Off
  - Replaces the simpler must-contain toggle with granular keyword matching
  - Client-side filtering via `applyClientFilters()` pipeline

- **Job Selection** (`stores/useSelectionStore.ts`, `components/dashboard/SelectionBar.tsx`)
  - Checkbox selection on cards with shift-click range select
  - Floating selection bar with count, Select All, Deselect All
  - Enrich Selected / Export Selected action buttons (wired for Phase 2)
  - Ephemeral store — not persisted to localStorage

- **Company Logos** (`lib/utils/company-logo.ts`)
  - Clearbit logo resolution from company URL domain
  - Graceful fallback to letter-initial avatar on 404
  - Added Clearbit to Next.js image remote patterns

- **Power Leads Scoring** (`lib/utils/power-leads.ts`)
  - Composite score from applicant count, posting recency, salary presence
  - Tier classification: Power Lead, Strong Lead, or none
  - Badges and green glow styling on qualifying cards

- **Aliens Motion Tracker Loading Animation** (`components/dashboard/SearchLoadingState.tsx`)
  - Canvas-based radar with `requestAnimationFrame` at 60fps
  - 4 concentric rings, crosshairs, 36 tick marks, rotating sweep line with 72° trail
  - 14 blips spawning at outer edge, creeping inward with angular wobble
  - Blips brighten as they approach center (you = the searcher)
  - Outward pulse ring every 3s, corner bracket HUD frame
  - Digital readout bar with zero-padded job count
  - Cycling status messages with framer-motion fade transitions

- **White-Label Loading Config** (`lib/config/client.ts`)
  - `NEXT_PUBLIC_LOADING_MESSAGES` — comma-separated cycling messages
  - `NEXT_PUBLIC_LOADING_LEFT_LABEL` — left readout label (default: "TRACK")
  - `NEXT_PUBLIC_LOADING_RIGHT_LABEL` — right readout label (default: "SCAN")

- **Streaming Progress Indicator** (`app/page.tsx`)
  - Full radar animation when waiting for first results
  - Compact "N jobs found — still scanning..." bar once results start arriving
  - Results render immediately as they stream in

- **Client-Side Job Transformation** (`lib/utils/transform-job.ts`)
  - `transformApifyJob()` for streaming: transforms raw Apify items client-side
  - LinkedIn URL cleanup: strips tracking params (`trackingId`, `refId`) to prevent authwall
  - Salary formatting, applicant count parsing, description cleanup

- **Additional Filters** (`components/filters/`)
  - SeniorityFilter, EmploymentTypeFilter, PayFilter dropdowns

### Fixed

- **LinkedIn authwall redirect** — Cleaned tracking params from URLs so "View on LinkedIn" works
- **Poll failure resilience** — Transient 404s no longer kill the entire search; retries with backoff
- **Dead code cleanup** — Removed unused `MustContainToggle.tsx` and stale `mustContain` references from types, providers

### Changed

- **Store version bumped to 4** — Added `matchMode`, `sortBy`, `selectedJobId`; smart migration preserves user preferences
- **Card click behavior** — Cards now open detail panel instead of navigating to LinkedIn
- **Result display** — Jobs render as soon as they start arriving (not gated on search completion)

### Security

- **API token removed from URL query params** — Apify calls now use Authorization header only (tokens in URLs leak to logs/proxies)
- **Deterministic job IDs** — Replaced `Math.random()` with `company-title-date` composite to prevent SSR hydration mismatches

## [1.1.0] - 2026-02-05

### Added

- **Shared Utility Modules** (`src/utils/`)
  - `logger.js` - Centralized logging utility replacing 5 duplicate logger definitions
    - Consistent timestamp formatting across all modules
    - Log levels: debug, info, warn, error, cli
    - Environment-based debug control via `DEBUG` env var
  - `retry.js` - Reusable retry logic with exponential backoff
    - `withRetry()` - Standard retry with configurable attempts and delay
    - `withRetryAndTimeout()` - Retry with timeout protection
    - Operation naming for better logging context
  - `validators.js` - Comprehensive input validation suite
    - `validateJobTitle()` - Length, content, and character validation
    - `validateLocation()` - Location string sanitization
    - `validateMaxResults()` - Range validation (1-1000)
    - `validateDateRange()` - Enum validation for date filters
    - `validateCompanyName()` - Company name sanitization
    - `validateScrapingConfig()` - Full config validation
    - `sanitizeString()` - Input sanitization for dangerous characters

- **Environment Variable Support**
  - `APIFY_API_TOKEN` - Override Apify API token from config
  - `GOOGLE_SHEETS_CREDENTIALS_PATH` - Override credentials path
  - `GOOGLE_SHEETS_SPREADSHEET_ID` - Override spreadsheet ID
  - Falls back to config.json values if env vars not set

- **Timeout Protection**
  - Apify `waitForFinish()` now has 5-minute timeout (300 seconds)
  - Prevents indefinite hanging on stuck Apify runs
  - Retry logic wraps timeout for resilience

- **Mock DataSource Provider** (`lib/providers/data-source/mock.ts`)
  - 20 realistic job listings with relative dates
  - Simulated network delay with AbortSignal support
  - Development without API keys: `NEXT_PUBLIC_DATA_SOURCE=mock`

- **Client Configuration** (`lib/config/client.ts`)
  - Environment-based branding (title, logo, colours)
  - Multi-instance deployment support — one codebase, many clients
  - Default search values per client

- **CI/CD Pipelines** (`.github/workflows/`)
  - `ci.yml`: Lint, typecheck, and build on push/PR to main
  - `release.yml`: Automatic GitHub Release on tag push

- **Docker Support**
  - Multi-stage Dockerfile (deps → build → runner)
  - Next.js standalone output mode
  - Per-client containers via env vars

- **Automatic Changelog**
  - `conventional-changelog-cli` with npm version lifecycle
  - `npm version patch/minor/major` auto-generates changelog, tags, and pushes
  - Commit convention documented in `.github/commit-convention.md`

- **Documentation**
  - `docs/PROVIDERS.md` — Provider architecture and how to add new providers
  - `docs/DEPLOYMENT.md` — Vercel, Docker, multi-instance deployment guide
  - `docs/DEVELOPMENT.md` — Developer setup, project structure, scripts
  - `docs/examples/client-acme.env.example` — Example client config

- **Retroactive Git Tags**
  - `v1.0.0` on Slice 1 foundation commit
  - `v1.0.1` on code review fixes commit

### Fixed

- **Code Duplication (DRY Principle)**
  - Eliminated 5 duplicate logger definitions across modules
  - Eliminated 2 duplicate `withRetry()` function implementations
  - All modules now import from `src/utils/`

- **Input Validation**
  - Added validation for CLI arguments (`--job-title`, `--location`, `--max-results`)
  - Added validation for config.json scraping options on load
  - Sanitization of user inputs to prevent injection (removes `<>{}")
  - Proper error messages for invalid inputs

- **Scheduler Config Passing**
  - Fixed scheduler creating new scraper instances without config path
  - Added `getScraper()` method for scraper instance reuse
  - Scraper now properly loads config in scheduled runs
  - Added config validation in scheduler constructor

- **Apify Client Robustness**
  - Added input validation before API calls
  - Added timeout to `waitForFinish()` to prevent hanging
  - Better error context in retry operations

- **GlassPanel TypeScript error**: Fixed `MotionValue` children type incompatibility with plain `<div>`

### Changed

- **Module Structure**
  - Created `src/utils/` directory for shared utilities
  - Updated all imports in:
    - `src/apify-client.js`
    - `src/google-sheets-client.js`
    - `src/data-processor.js`
    - `src/scraper.js`
    - `src/scheduler.js`

- **Data Processor**
  - Now uses shared `sanitizeString()` for cleaning company names and locations
  - Uses shared logger for consistent output

- **Provider Interface**: `DataSourceProvider.scrape()` now accepts optional `AbortSignal` (matches existing Apify implementation)
- **README.md**: Complete rewrite with quick start, architecture diagram, and doc links
- **`.env.example`**: Defaults to mock data source, added client/branding section
- **`next.config.js`**: Added `output: 'standalone'` for Docker builds

### Moved

- `CODE_REVIEW.md` → `docs/archive/`
- `MVP_STATUS.md` → `docs/archive/`
- `SETUP.md` → `docs/archive/`

### Security

- **Input Sanitization**
  - Added protection against potentially dangerous characters in user inputs
  - Validates and sanitizes job titles, locations, and company names
  - Prevents code injection through config or CLI arguments

---

## [1.0.1] - 2026-02-05

### Added

- **Unified Logger** (`lib/logger.ts`)
  - Structured logging with timestamps and log levels (debug, info, warn, error)
  - Environment-based log level control via `DEBUG` env flag
  - Child logger support for contextual logging
  - Production-ready format with JSON metadata

- **AbortSignal Support**
  - Cancellable polling operations in Apify data source
  - Proper cleanup of timeouts on abort
  - Abort-aware fetch requests with signal propagation

- **Graceful Shutdown Handlers**
  - SIGINT, SIGTERM signal handling for clean process termination
  - SIGHUP support for nodemon/HMR restarts
  - Uncaught exception and unhandled rejection handlers
  - Registered shutdown callbacks for resource cleanup

- **Image Error Handling**
  - LogoHeader component now handles broken image URLs gracefully
  - Automatic fallback to text-based logo on image load failure
  - Uses Next.js Image `onError` callback pattern

### Fixed

- **Architecture & State Management**
  - Fixed module-level mutable cache in `ApifyDataSource` (moved to instance-level properties)
  - Fixed `QueryClient` singleton pattern to prevent HMR/StrictMode issues
  - Added proper SSR/SSG handling for React Query client initialization

- **React/TypeScript**
  - Fixed props spread order in `GlassPanel` to prevent animation props override
  - Fixed `NodeJS.Timeout` type to `ReturnType<typeof setTimeout>` for portability
  - Fixed smart quote character in tooltip string (`types/index.ts`)

- **Error Handling**
  - Added comprehensive error handling for all `fetch()` calls
  - Added non-JSON response handling with proper error messages
  - Added network failure detection and reporting

- **Scheduler Improvements**
  - Added `isRunning` flag to prevent duplicate scheduler starts
  - Added cron schedule validation before task creation
  - Added shutdown handlers for cleanup and resource release

### Changed

- **Logging Refactor**
  - Replaced all `console.log` statements with unified logger across:
    - `src/apify-client.js`
    - `src/data-processor.js`
    - `src/google-sheets-client.js`
    - `src/scheduler.js`
    - `src/scraper.js`
    - `app/page.tsx`
  - CLI-friendly output preserved in scraper.js for user-facing messages

### Security

- No security fixes in this release.

---

## [1.0.0] - 2026-02-04

### Added

- **Initial Release** - Foundation with glassmorphism UI
  - Next.js 14 with App Router alongside existing CLI scraper
  - Tailwind CSS with dark theme and glassmorphism design system
  - Framer Motion for animations
  - Modular provider architecture (DataSource, Storage, Enrichment, Outreach)
  - GlassPanel component with blur/saturation effects
  - LogoHeader with animated entrance
  - EmptyState component for empty results
  - Mobile-responsive layout with stacked filters on small screens
  - Apify integration as DataSourceProvider
  - localStorage as StorageProvider (MVP)
  - CSV export as OutreachProvider (MVP)

- **CLI Scraper**
  - Apify LinkedIn Job Scraper integration
  - Google Sheets export functionality
  - Data processing with deduplication
  - Company exclusion filtering
  - Retry logic with exponential backoff
  - Scheduler with cron support for automated runs

[Unreleased]: https://github.com/kobestarr/linkedin-job-scraper/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/kobestarr/linkedin-job-scraper/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/kobestarr/linkedin-job-scraper/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/kobestarr/linkedin-job-scraper/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/kobestarr/linkedin-job-scraper/releases/tag/v1.0.0
