# LinkedIn Job Scraper

Automated LinkedIn job scraping system that extracts jobs daily and pushes them to Google Sheets.

## Features

- Daily automated scraping via Apify LinkedIn Job Scraper
- One job title per run (discrete runs, support multiple job titles)
- Country-level location filtering
- Automatic deduplication by company name
- Direct push to Google Sheets (no approval workflow)
- Scheduled daily runs

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Apify

1. Sign up for Apify account: https://apify.com
2. Get your API token from: https://console.apify.com/account/integrations
3. Find the LinkedIn Job Scraper actor ID (search in Apify store)

### 3. Configure Google Sheets

1. Create a Google Cloud Project
2. Enable Google Sheets API
3. Create OAuth2 credentials (Service Account recommended)
4. Download credentials JSON file
5. Share your Google Sheet with the service account email

### 4. Configuration

1. Copy `config.example.json` to `config.json`
2. Update with your credentials:

```json
{
  "apify": {
    "apiToken": "YOUR_APIFY_API_TOKEN"
  },
  "googleSheets": {
    "spreadsheetId": "YOUR_SPREADSHEET_ID",
    "sheetName": "LinkedIn Jobs",
    "credentialsPath": "./credentials/google-sheets-credentials.json"
  },
  "scraping": {
    "jobTitle": "Publicist",
    "location": "United States",
    "dateRange": "last24hours",
    "maxResults": 50
  },
  "scheduler": {
    "enabled": true,
    "schedule": "0 10 * * *",
    "timezone": "America/New_York"
  }
}
```

### 5. Create Credentials Directory

```bash
mkdir -p credentials
# Place your Google Sheets credentials JSON file here
```

## Usage

### Manual Run

```bash
# Run with default config
node src/scraper.js

# Override job title
node src/scraper.js --job-title "Public Relations Manager" --location "United States"
```

### Scheduled Runs

```bash
# Start scheduler (runs jobs based on config schedule)
node src/scheduler.js
```

### Multiple Job Titles

To scrape multiple job titles, you can:

1. **Option 1**: Create separate config files and run multiple schedulers
2. **Option 2**: Modify config to include `jobTitles` array (future enhancement)

## Google Sheets Format

The system creates/updates a sheet with these columns:

1. Date Scraped
2. Job Title
3. Company Name
4. Company LinkedIn URL
5. Job Posting URL
6. Location
7. Posted Date
8. Days Since Posted
9. Employment Type
10. Experience Level
11. Job Description
12. Status

## Logging

All operations are logged to console with timestamps and status indicators.

## Error Handling

- Retry logic for API failures
- Graceful error handling
- Continues processing even if some jobs fail

## License

ISC
