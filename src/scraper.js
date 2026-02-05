/**
 * Main Scraper Script
 * Orchestrates the job scraping process: Apify → Process → Filter → Deduplicate → Google Sheets
 */

require('dotenv').config();
const fs = require('fs');
const ApifyJobScraper = require('./apify-client');
const JobDataProcessor = require('./data-processor');
const GoogleSheetsClient = require('./google-sheets-client');

// Simple logger
const logger = {
  info: (message, meta) => {
    // eslint-disable-next-line no-console
    console.log(`[${new Date().toISOString()}] [INFO] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  error: (message, meta) => {
    // eslint-disable-next-line no-console
    console.error(`[${new Date().toISOString()}] [ERROR] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  debug: (message, meta) => {
    if (process.env.DEBUG) {
      // eslint-disable-next-line no-console
      console.debug(`[${new Date().toISOString()}] [DEBUG] ${message}`, meta ? JSON.stringify(meta) : '');
    }
  },
  // CLI-friendly output (no timestamps for user-facing messages)
  cli: (message) => {
    // eslint-disable-next-line no-console
    console.log(message);
  }
};

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

    logger.cli('='.repeat(60));
    logger.cli('LinkedIn Job Scraper - Starting Run');
    logger.cli('='.repeat(60));
    logger.cli(`Job Title: ${scrapingConfig.jobTitle}`);
    logger.cli(`Location: ${scrapingConfig.location}`);
    logger.cli(`Date Range: ${scrapingConfig.dateRange}`);
    logger.cli(`Max Results: ${scrapingConfig.maxResults}`);
    if (scrapingConfig.excludeCompanies && scrapingConfig.excludeCompanies.length > 0) {
      logger.cli(`Exclude Companies: ${scrapingConfig.excludeCompanies.join(', ')}`);
    }
    logger.cli('');

    try {
      // Step 1: Scrape jobs from Apify
      logger.cli('[Step 1] Scraping jobs from LinkedIn via Apify...');
      const scrapeResult = await this.apify.scrapeJobs(scrapingConfig);
      logger.cli(`✓ Found ${scrapeResult.items.length} jobs\n`);

      if (scrapeResult.items.length === 0) {
        logger.cli('No jobs found. Exiting.');
        return {
          scraped: 0,
          processed: 0,
          filtered: 0,
          appended: 0,
          skipped: 0
        };
      }

      // Step 2: Process jobs
      logger.cli('[Step 2] Processing jobs...');
      const processedJobs = this.processor.processJobs(
        scrapeResult.items,
        scrapingConfig.jobTitle
      );
      logger.cli(`✓ Processed ${processedJobs.length} jobs\n`);

      // Step 3: Filter excluded companies
      const excludeCompanies = scrapingConfig.excludeCompanies || [];
      let filteredJobs = processedJobs;
      let excludedCount = 0;
      
      if (excludeCompanies.length > 0) {
        logger.cli('[Step 3] Filtering excluded companies...');
        const filterResult = this.processor.filterExcludedCompanies(processedJobs, excludeCompanies);
        filteredJobs = filterResult.filtered;
        excludedCount = filterResult.excluded;
        logger.cli(`✓ Filtered: ${processedJobs.length} → ${filteredJobs.length} jobs (${excludedCount} excluded)\n`);
      } else {
        logger.cli('[Step 3] No company exclusions configured\n');
      }

      // Step 4: Deduplicate by company
      logger.cli('[Step 4] Deduplicating by company...');
      const deduplicatedJobs = this.processor.deduplicateByCompany(filteredJobs);
      logger.cli(`✓ Deduplicated: ${filteredJobs.length} → ${deduplicatedJobs.length} unique jobs\n`);

      // Step 5: Push to Google Sheets
      logger.cli('[Step 5] Pushing to Google Sheets...');
      const sheetsResult = await this.sheets.appendJobs(deduplicatedJobs);
      logger.cli(`✓ Appended ${sheetsResult.appended} jobs, skipped ${sheetsResult.skipped} duplicates\n`);

      // Summary
      logger.cli('='.repeat(60));
      logger.cli('Run Complete - Summary');
      logger.cli('='.repeat(60));
      logger.cli(`Jobs Scraped: ${scrapeResult.items.length}`);
      logger.cli(`Jobs Processed: ${processedJobs.length}`);
      if (excludedCount > 0) {
        logger.cli(`Jobs Excluded: ${excludedCount}`);
      }
      logger.cli(`Jobs After Filtering: ${filteredJobs.length}`);
      logger.cli(`Jobs After Deduplication: ${deduplicatedJobs.length}`);
      logger.cli(`Jobs Appended: ${sheetsResult.appended}`);
      logger.cli(`Jobs Skipped (duplicates): ${sheetsResult.skipped}`);
      logger.cli('='.repeat(60));

      return {
        scraped: scrapeResult.items.length,
        processed: processedJobs.length,
        excluded: excludedCount,
        filtered: filteredJobs.length,
        deduplicated: deduplicatedJobs.length,
        appended: sheetsResult.appended,
        skipped: sheetsResult.skipped
      };
    } catch (error) {
      logger.error('Error during scraping', { message: error.message, stack: error.stack });
      throw error;
    }
  }
}

/**
 * Parse and validate CLI argument
 * @param {Array} args - Command line arguments
 * @param {string} flag - Flag to look for (e.g., '--job-title')
 * @returns {string|null} The argument value or null if not found/invalid
 */
function getCliArg(args, flag) {
  const index = args.indexOf(flag);
  if (index === -1) return null;

  const value = args[index + 1];
  if (value === undefined || value.startsWith('--')) {
    logger.error(`Error: ${flag} requires a value`);
    process.exit(1);
  }
  return value;
}

// Run if called directly
if (require.main === module) {
  const scraper = new LinkedInJobScraper();

  // Allow command-line overrides
  const args = process.argv.slice(2);
  const options = {};

  const jobTitle = getCliArg(args, '--job-title');
  if (jobTitle) options.jobTitle = jobTitle;

  const location = getCliArg(args, '--location');
  if (location) options.location = location;

  const maxResults = getCliArg(args, '--max-results');
  if (maxResults) {
    const parsed = parseInt(maxResults, 10);
    if (isNaN(parsed) || parsed <= 0) {
      logger.error('Error: --max-results must be a positive number');
      process.exit(1);
    }
    options.maxResults = parsed;
  }

  scraper.run(options)
    .then(result => {
      logger.cli('\n✅ Scraping completed successfully');
      process.exit(0);
    })
    .catch(error => {
      logger.error('\n❌ Scraping failed', { message: error.message });
      process.exit(1);
    });
}

module.exports = LinkedInJobScraper;
