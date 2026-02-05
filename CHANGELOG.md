# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0](https://github.com/kobestarr/linkedin-job-scraper/compare/v1.0.1...v1.1.0) - 2026-02-05

### Added

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

### Changed

- **Provider Interface**: `DataSourceProvider.scrape()` now accepts optional `AbortSignal` (matches existing Apify implementation)
- **README.md**: Complete rewrite with quick start, architecture diagram, and doc links
- **`.env.example`**: Defaults to mock data source, added client/branding section
- **`next.config.js`**: Added `output: 'standalone'` for Docker builds

### Fixed

- **GlassPanel TypeScript error**: Fixed `MotionValue` children type incompatibility with plain `<div>`

### Moved

- `CODE_REVIEW.md` → `docs/archive/`
- `MVP_STATUS.md` → `docs/archive/`
- `SETUP.md` → `docs/archive/`

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

[Unreleased]: https://github.com/kobestarr/linkedin-job-scraper/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/kobestarr/linkedin-job-scraper/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/kobestarr/linkedin-job-scraper/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/kobestarr/linkedin-job-scraper/releases/tag/v1.0.0
