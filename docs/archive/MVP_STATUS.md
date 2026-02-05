# LinkedIn Job Scraper MVP - Status

## ✅ Completed

### Core Modules Built

1. **Apify Integration** (`src/apify-client.js`)
   - Connects to Apify LinkedIn Job Scraper
   - Configurable actor ID (default: `n9WWs3eofIvboPcgK`)
   - Handles job scraping with filters (job title, location, date range)
   - Waits for run completion and retrieves dataset items

2. **Data Processor** (`src/data-processor.js`)
   - Parses raw Apify job data
   - Cleans and normalizes fields
   - Deduplicates by company name (keeps most recent)
   - Formats data for Google Sheets

3. **Google Sheets Client** (`src/google-sheets-client.js`)
   - Authenticates with Google Sheets API
   - Creates sheet if it doesn't exist
   - Sets headers automatically
   - Appends new jobs, skips duplicates
   - Preserves existing data

4. **Main Scraper** (`src/scraper.js`)
   - Orchestrates entire process
   - Apify → Process → Google Sheets
   - Command-line support with overrides
   - Comprehensive logging

5. **Scheduler** (`src/scheduler.js`)
   - Daily automated runs via node-cron
   - Supports multiple job titles (discrete runs)
   - Configurable schedule and timezone
   - Graceful shutdown handling

### Project Structure

```
/root/linkedin-job-scraper/
├── src/
│   ├── apify-client.js
│   ├── data-processor.js
│   ├── google-sheets-client.js
│   ├── scraper.js
│   └── scheduler.js
├── credentials/          # Google Sheets credentials (gitignored)
├── config.json           # Your config (gitignored)
├── config.example.json   # Example config
├── package.json
├── index.js              # Entry point
├── README.md
└── SETUP.md
```

### Features Implemented

- ✅ One job title per run (discrete)
- ✅ Country-level location filtering
- ✅ Last 24 hours filtering
- ✅ Automatic deduplication by company
- ✅ Direct push to Google Sheets (no approval)
- ✅ Daily scheduler support
- ✅ Error handling and logging
- ✅ Command-line overrides

## 🔧 Next Steps (Setup Required)

### 1. Apify Setup
- [ ] Sign up for Apify account
- [ ] Get API token from https://console.apify.com/account/integrations
- [ ] Add token to `config.json`

### 2. Google Sheets Setup
- [ ] Create Google Cloud Project
- [ ] Enable Google Sheets API
- [ ] Create Service Account
- [ ] Download credentials JSON
- [ ] Place in `credentials/google-sheets-credentials.json`
- [ ] Create Google Sheet
- [ ] Share sheet with service account email
- [ ] Add spreadsheet ID to `config.json`

### 3. Configuration
- [ ] Copy `config.example.json` to `config.json`
- [ ] Add Apify API token
- [ ] Add Google Sheets spreadsheet ID
- [ ] Set job title to scrape
- [ ] Configure schedule (if using scheduler)

### 4. Testing
- [ ] Test manual run: `node src/scraper.js`
- [ ] Verify jobs appear in Google Sheets
- [ ] Test deduplication (run twice, should skip duplicates)
- [ ] Test scheduler: `npm start`

## 📋 Usage Examples

### Manual Run
```bash
cd /root/linkedin-job-scraper
node src/scraper.js
```

### Override Job Title
```bash
node src/scraper.js --job-title "Public Relations Manager" --location "United States"
```

### Start Scheduler
```bash
npm start
# Runs jobs based on schedule in config.json
```

## 🎯 MVP Success Criteria

- [ ] System runs daily without manual intervention
- [ ] Jobs scraped within last 24 hours appear in Google Sheets
- [ ] Deduplication reduces duplicate companies
- [ ] Leads appear directly in Sheets for team review
- [ ] Process is faster than manual scraping

## 📝 Notes

- Default Apify actor: `n9WWs3eofIvboPcgK` (Apify Linkedin Job Scrapper [NO COOKIES])
- Default schedule: Daily at 10 AM Eastern Time
- Default max results: 50 jobs per run
- All logs go to console (can redirect to file if needed)

## 🚀 Ready for Testing

The MVP is complete and ready for testing once credentials are configured!
