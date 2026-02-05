# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/kobestarr/linkedin-job-scraper/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/kobestarr/linkedin-job-scraper/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/kobestarr/linkedin-job-scraper/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/kobestarr/linkedin-job-scraper/releases/tag/v1.0.0
