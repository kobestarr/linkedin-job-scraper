# Development Guide

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/kobestarr/linkedin-job-scraper.git
cd linkedin-job-scraper
npm install

# 2. Set up environment (uses mock data - no API keys needed)
cp .env.example .env

# 3. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The dashboard loads with 20 mock job listings.

To use real Apify data, update `.env`:

```bash
NEXT_PUBLIC_DATA_SOURCE=apify
APIFY_API_TOKEN=your_actual_token
```

---

## Project Structure

```
linkedin-job-scraper/
├── app/                        # Next.js App Router pages
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Main dashboard page
│   └── providers.tsx           # React Query + global providers
├── components/
│   ├── dashboard/              # Dashboard-specific components
│   │   ├── EmptyState.tsx      # No-results state
│   │   └── LogoHeader.tsx      # App header with logo
│   └── ui/                     # Reusable UI primitives
│       └── GlassPanel.tsx      # Glassmorphism container
├── lib/
│   ├── config/
│   │   ├── client.ts           # Client/branding configuration
│   │   └── providers.ts        # Provider env var config
│   ├── logger.ts               # Unified logger
│   ├── providers/
│   │   ├── data-source/        # Job scraping providers
│   │   │   ├── apify.ts        # Apify implementation
│   │   │   ├── mock.ts         # Mock data for development
│   │   │   ├── mock-data.ts    # 20 realistic mock jobs
│   │   │   ├── index.ts        # Factory + singleton
│   │   │   └── types.ts        # DataSourceProvider interface
│   │   ├── enrichment/         # Contact enrichment providers
│   │   ├── outreach/           # Export/outreach providers
│   │   └── storage/            # Data persistence providers
│   └── utils.ts                # Shared utilities (cn, etc.)
├── src/                        # Legacy CLI scraper
│   ├── scraper.js              # Main CLI entry point
│   ├── apify-client.js         # CLI Apify integration
│   ├── data-processor.js       # Data cleaning/dedup
│   ├── google-sheets-client.js # Google Sheets export
│   └── scheduler.js            # Cron scheduler
├── types/
│   └── index.ts                # Core TypeScript types
├── docs/                       # Documentation
├── .github/
│   ├── workflows/              # CI/CD pipelines
│   └── commit-convention.md    # Commit message guide
└── package.json
```

## CLI vs Web UI

The project has two entry points:

| | CLI Scraper | Web UI |
|---|---|---|
| **Entry** | `node src/scraper.js` | `npm run dev` |
| **Purpose** | Automated daily scraping to Google Sheets | Interactive dashboard with filters |
| **Tech** | Plain Node.js | Next.js 14 + React |
| **Data dest** | Google Sheets | Browser (localStorage) |

Both coexist — the CLI is not being replaced.

---

## Scripts

```bash
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm run start:web    # Start production server
npm run lint         # ESLint
npm run typecheck    # TypeScript type checking
npm run scrape       # Run CLI scraper once
npm start            # Start CLI scheduler
```

---

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/). See [.github/commit-convention.md](../.github/commit-convention.md) for full details.

```bash
feat: add new filter component
fix: handle empty search results
docs: update deployment guide
chore: bump dependencies
```

---

## Releasing

```bash
# Patch release (1.0.1 -> 1.0.2)
npm version patch

# Minor release (1.0.2 -> 1.1.0)
npm version minor

# Major release (1.1.0 -> 2.0.0)
npm version major
```

This automatically:
1. Bumps `package.json` version
2. Updates `CHANGELOG.md` from commit messages
3. Creates git tag
4. Pushes to remote
5. GitHub Actions creates a GitHub Release

---

## Adding a New Provider

See [docs/PROVIDERS.md](PROVIDERS.md) for the full guide. Short version:

1. Create implementation file implementing the provider interface
2. Register it in the factory
3. Set the env var

---

## Useful Commands

```bash
# Check what version you're on
node -e "console.log(require('./package.json').version)"

# List all git tags
git tag -l

# Run typecheck only
npx tsc --noEmit

# Generate changelog preview (doesn't write)
npx conventional-changelog -p conventionalcommits
```
