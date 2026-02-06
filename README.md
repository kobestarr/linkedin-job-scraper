# Job Intelligence Platform

Premium LinkedIn job scraping with a glassmorphism dashboard UI. Swappable providers, multi-instance deployment, automatic changelog.

## Quick Start (No API Keys Needed)

```bash
git clone https://github.com/kobestarr/linkedin-job-scraper.git
cd linkedin-job-scraper
npm install
cp .env.example .env   # defaults to mock data source
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To use real LinkedIn data, set `NEXT_PUBLIC_DATA_SOURCE=apify` and add your `APIFY_API_TOKEN` in `.env`.

## Architecture

```
                    ┌─────────────┐
                    │   Next.js   │
                    │  Dashboard  │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────┴─────┐ ┌───┴───┐ ┌─────┴─────┐
        │ DataSource │ │Storage│ │ Outreach  │
        │  Provider  │ │Provider│ │ Provider  │
        └─────┬─────┘ └───┬───┘ └─────┬─────┘
              │            │            │
        ┌─────┴─────┐ ┌───┴───┐ ┌─────┴─────┐
        │Apify│Mock │ │Local  │ │CSV│Smart- │
        │     │     │ │Storage│ │   │lead   │
        └───────────┘ └───────┘ └───────────┘
```

Swap any provider by changing an env var. See [docs/PROVIDERS.md](docs/PROVIDERS.md).

## CLI Scraper

The original CLI scraper still works alongside the web UI:

```bash
# One-off scrape to Google Sheets
node src/scraper.js --job-title "Software Engineer" --location "United States"

# Daily scheduler
npm start
```

See [GOOGLE_SETUP_BEGINNER.md](GOOGLE_SETUP_BEGINNER.md) for Google Sheets setup.

## Versioning

This project uses [Semantic Versioning](https://semver.org/) with [Conventional Commits](https://www.conventionalcommits.org/).

```bash
npm version patch   # Bug fix:     1.0.1 -> 1.0.2
npm version minor   # New feature: 1.0.2 -> 1.1.0
npm version major   # Breaking:    1.1.0 -> 2.0.0
```

Changelog is generated automatically. See [CHANGELOG.md](CHANGELOG.md).

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Dev setup, project structure, scripts |
| [docs/PROVIDERS.md](docs/PROVIDERS.md) | Provider architecture, how to add new ones |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Vercel, Docker, multi-instance deployment |
| [docs/DESIGN_DECISIONS.md](docs/DESIGN_DECISIONS.md) | UI/UX decisions, Framer Motion removal, color contrast |
| [.github/commit-convention.md](.github/commit-convention.md) | Commit message format |
| [CHANGELOG.md](CHANGELOG.md) | Release history |

## License

ISC
