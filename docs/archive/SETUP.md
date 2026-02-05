# LinkedIn Job Scraper - Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd /root/linkedin-job-scraper
npm install
```

### 2. Configure Apify

1. Sign up at https://apify.com
2. Get API token from https://console.apify.com/account/integrations
3. The default actor ID is already set: `n9WWs3eofIvboPcgK` (Apify Linkedin Job Scrapper [NO COOKIES])

### 3. Configure Google Sheets

1. Go to Google Cloud Console: https://console.cloud.google.com
2. Create a new project or select existing
3. Enable Google Sheets API
4. Create Service Account credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Create service account and download JSON key
5. Place the JSON file in `credentials/google-sheets-credentials.json`
6. Create a Google Sheet and share it with the service account email (found in the JSON file)
7. Get the Spreadsheet ID from the URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`

### 4. Create Configuration

```bash
cp config.example.json config.json
```

Edit `config.json`:

```json
{
  "apify": {
    "apiToken": "YOUR_APIFY_API_TOKEN_HERE",
    "actorId": "n9WWs3eofIvboPcgK"
  },
  "googleSheets": {
    "spreadsheetId": "YOUR_SPREADSHEET_ID_HERE",
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

### 5. Test Manual Run

```bash
node src/scraper.js
```

### 6. Start Scheduler (for daily automated runs)

```bash
node index.js
# or
npm start
```

## Multiple Job Titles

To scrape multiple job titles, create separate config files:

```bash
# config-publicist.json
{
  "scraping": {
    "jobTitle": "Publicist",
    ...
  }
}

# config-pr-manager.json
{
  "scraping": {
    "jobTitle": "Public Relations Manager",
    ...
  }
}
```

Then run separate schedulers or use system cron:

```bash
# In crontab
0 10 * * * cd /root/linkedin-job-scraper && node src/scraper.js --job-title "Publicist"
0 11 * * * cd /root/linkedin-job-scraper && node src/scraper.js --job-title "PR Manager"
```

## Troubleshooting

### Apify Errors
- Check API token is valid
- Verify actor ID is correct
- Check Apify account has credits

### Google Sheets Errors
- Verify credentials file path is correct
- Check service account email has access to spreadsheet
- Verify spreadsheet ID is correct

### No Jobs Found
- Check job title spelling
- Verify location is correct format
- Try increasing maxResults
- Check if jobs were posted in last 24 hours

## File Structure

```
linkedin-job-scraper/
├── src/
│   ├── apify-client.js      # Apify integration
│   ├── data-processor.js     # Data processing & deduplication
│   ├── google-sheets-client.js  # Google Sheets integration
│   ├── scraper.js            # Main scraper orchestration
│   └── scheduler.js           # Daily scheduler
├── credentials/               # Google Sheets credentials (gitignored)
├── config.json               # Your configuration (gitignored)
├── config.example.json       # Example configuration
├── package.json
├── index.js                  # Entry point (scheduler)
└── README.md
```
