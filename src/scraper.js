/**
 * Main Scraper Script
 * Orchestrates the job scraping process: Apify → Process → Google Sheets
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const ApifyJobScraper = require('./src/apify-client');
const JobDataProcessor = require('./src/data-processor');
const GoogleSheetsClient = require('./src/google-sheets-client');

class LinkedInJobScraper {
  constructor(configPath = './config.json') {
    this.config = this.loadConfig(configPath);
    this.apify = new ApifyJobScraper(this.config.apify.apiToken, this.config.apify.actorId);
    this.processor = new JobDataProcessor();
    this.sheets = new GoogleSheetsClient(this.config.googleSheets);
  }

  /**
   * Load configuration from file
   */
  loadConfig(configPath) {
    if (!fs.existsSync(configPath)) {
      throw new Error(`Config file not found: ${configPath}. Please copy config.example.json to config.json`);
    }
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }

  /**
   * Run the complete scraping process
   * @param {Object} options - Override scraping options
   * @returns {Promise<Object>} Result summary
   */
  async run(options = {}) {
    const scrapingConfig = {
      ...this.config.scraping,
      ...options
    };

    console.log('='.repeat(60));
    console.log('LinkedIn Job Scraper - Starting Run');
    console.log('='.repeat(60));
    console.log(`Job Title: ${scrapingConfig.jobTitle}`);
    console.log(`Location: ${scrapingConfig.location}`);
    console.log(`Date Range: ${scrapingConfig.dateRange}`);
    console.log(`Max Results: ${scrapingConfig.maxResults}`);
    console.log('');

    try {
      // Step 1: Scrape jobs from Apify
      console.log('[Step 1] Scraping jobs from LinkedIn via Apify...');
      const scrapeResult = await this.apify.scrapeJobs(scrapingConfig);
      console.log(`✓ Found ${scrapeResult.items.length} jobs\n`);

      if (scrapeResult.items.length === 0) {
        console.log('No jobs found. Exiting.');
        return {
          scraped: 0,
          processed: 0,
          appended: 0,
          skipped: 0
        };
      }

      // Step 2: Process and deduplicate jobs
      console.log('[Step 2] Processing and deduplicating jobs...');
      const processedJobs = this.processor.processJobs(
        scrapeResult.items,
        scrapingConfig.jobTitle
      );
      const deduplicatedJobs = this.processor.deduplicateByCompany(processedJobs);
      console.log(`✓ Processed ${deduplicatedJobs.length} unique jobs\n`);

      // Step 3: Push to Google Sheets
      console.log('[Step 3] Pushing to Google Sheets...');
      const sheetsResult = await this.sheets.appendJobs(deduplicatedJobs);
      console.log(`✓ Appended ${sheetsResult.appended} jobs, skipped ${sheetsResult.skipped} duplicates\n`);

      // Summary
      console.log('='.repeat(60));
      console.log('Run Complete - Summary');
      console.log('='.repeat(60));
      console.log(`Jobs Scraped: ${scrapeResult.items.length}`);
      console.log(`Jobs Processed: ${deduplicatedJobs.length}`);
      console.log(`Jobs Appended: ${sheetsResult.appended}`);
      console.log(`Jobs Skipped: ${sheetsResult.skipped}`);
      console.log('='.repeat(60));

      return {
        scraped: scrapeResult.items.length,
        processed: deduplicatedJobs.length,
        appended: sheetsResult.appended,
        skipped: sheetsResult.skipped
      };
    } catch (error) {
      console.error('\n❌ Error during scraping:', error.message);
      console.error(error.stack);
      throw error;
    }
  }
}

// Run if called directly
if (require.main === module) {
  const scraper = new LinkedInJobScraper();
  
  // Allow command-line overrides
  const args = process.argv.slice(2);
  const options = {};
  
  if (args.includes('--job-title')) {
    options.jobTitle = args[args.indexOf('--job-title') + 1];
  }
  if (args.includes('--location')) {
    options.location = args[args.indexOf('--location') + 1];
  }
  if (args.includes('--max-results')) {
    options.maxResults = parseInt(args[args.indexOf('--max-results') + 1], 10);
  }

  scraper.run(options)
    .then(result => {
      console.log('\n✅ Scraping completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Scraping failed:', error.message);
      process.exit(1);
    });
}

module.exports = LinkedInJobScraper;
