# Deployment Guide

## Quick Deploy Options

| Platform | Best For | Difficulty |
|----------|----------|-----------|
| **Vercel** | Single instance, quick setup | Easy |
| **Docker** | Self-hosted, multi-instance | Medium |

---

## Vercel (Recommended)

### Single Instance

1. Push your repo to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Set environment variables in the Vercel dashboard:
   - `APIFY_API_TOKEN` (or use `NEXT_PUBLIC_DATA_SOURCE=mock` for testing)
   - Any other env vars from `.env.example`
4. Deploy

### Multi-Instance (One Repo, Multiple Clients)

Each client is a **separate Vercel project** pointing to the **same repo**.

1. Create a new Vercel project for each client
2. Link each project to the same GitHub repo
3. Set **per-project** environment variables:

```bash
# Client A
NEXT_PUBLIC_CLIENT_NAME=acme
NEXT_PUBLIC_APP_TITLE=ACME Talent Intel
NEXT_PUBLIC_PRIMARY_COLOR=59 130 246

# Client B
NEXT_PUBLIC_CLIENT_NAME=globex
NEXT_PUBLIC_APP_TITLE=Globex Job Finder
NEXT_PUBLIC_PRIMARY_COLOR=16 185 129
```

4. Every push to `main` rebuilds **all** projects automatically

### Rollback on Vercel

- Go to the project dashboard > Deployments
- Click the three-dot menu on any previous deployment
- Select "Promote to Production"
- Instant rollback, zero downtime

---

## Docker

### Build

```bash
docker build -t job-intelligence .
```

### Run

```bash
docker run -p 3000:3000 \
  -e APIFY_API_TOKEN=your_token \
  -e NEXT_PUBLIC_DATA_SOURCE=apify \
  -e NEXT_PUBLIC_APP_TITLE="Job Intelligence" \
  job-intelligence
```

### Multi-Instance with Docker

Run multiple containers with different env vars:

```bash
# Client A
docker run -p 3001:3000 \
  -e NEXT_PUBLIC_CLIENT_NAME=acme \
  -e NEXT_PUBLIC_APP_TITLE="ACME Talent Intel" \
  -e NEXT_PUBLIC_PRIMARY_COLOR="59 130 246" \
  -e APIFY_API_TOKEN=acme_token \
  job-intelligence

# Client B
docker run -p 3002:3000 \
  -e NEXT_PUBLIC_CLIENT_NAME=globex \
  -e NEXT_PUBLIC_APP_TITLE="Globex Jobs" \
  -e NEXT_PUBLIC_PRIMARY_COLOR="16 185 129" \
  -e APIFY_API_TOKEN=globex_token \
  job-intelligence
```

### Docker Compose (optional)

```yaml
version: '3.8'
services:
  client-acme:
    build: .
    ports:
      - "3001:3000"
    env_file: ./envs/acme.env

  client-globex:
    build: .
    ports:
      - "3002:3000"
    env_file: ./envs/globex.env
```

---

## Environment Variables Reference

See [.env.example](../.env.example) for the full list with descriptions.

### Required

| Variable | Description |
|----------|-------------|
| `APIFY_API_TOKEN` | Apify API token (not needed if `NEXT_PUBLIC_DATA_SOURCE=mock`) |

### Provider Selection

| Variable | Options | Default |
|----------|---------|---------|
| `NEXT_PUBLIC_DATA_SOURCE` | `apify`, `captain-data`, `mock` | `apify` |
| `NEXT_PUBLIC_STORAGE` | `local`, `supabase` | `local` |
| `NEXT_PUBLIC_ENRICHMENT` | `none`, `captain-data`, `clay` | `none` |
| `NEXT_PUBLIC_OUTREACH` | `csv`, `smartlead`, `instantly` | `csv` |

### Branding

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_CLIENT_NAME` | Instance identifier | `default` |
| `NEXT_PUBLIC_APP_TITLE` | Header title | `Job Intelligence` |
| `NEXT_PUBLIC_LOGO_URL` | Custom logo URL | Text logo |
| `NEXT_PUBLIC_PRIMARY_COLOR` | RGB values for primary colour | `99 102 241` |

---

## Rollback Procedures

### Git Tags

Every release is tagged. To rollback:

```bash
git checkout v1.0.1
npm ci && npm run build
```

### Vercel

One-click revert in the dashboard (see above).

### Docker

Pin to a specific version tag:

```bash
docker run -p 3000:3000 ghcr.io/your-org/job-intelligence:v1.0.1
```
