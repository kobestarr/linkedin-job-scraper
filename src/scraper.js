/**
 * Main Scraper Script
 * Orchestrates the job scraping process: Apify → Process → Filter → Deduplicate → Google Sheets
 */

require('dotenv').config();
const fs = require('fs');
const ApifyJobScraper = require('./apify-client');
const JobDataProcessor = require('./data-processor');
const GoogleSheetsClient = require('./google-sheets-client');

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
    if (scrapingConfig.excludeCompanies && scrapingConfig.excludeCompanies.length > 0) {
      console.log(`Exclude Companies: ${scrapingConfig.excludeCompanies.join(', ')}`);
    }
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
          filtered: 0,
          appended: 0,
          skipped: 0
        };
      }

      // Step 2: Process jobs
      console.log('[Step 2] Processing jobs...');
      const processedJobs = this.processor.processJobs(
        scrapeResult.items,
        scrapingConfig.jobTitle
      );
      console.log(`✓ Processed ${processedJobs.length} jobs\n`);

      // Step 3: Filter excluded companies
      const excludeCompanies = scrapingConfig.excludeCompanies || [];
      let filteredJobs = processedJobs;
      let excludedCount = 0;
      
      if (excludeCompanies.length > 0) {
        console.log('[Step 3] Filtering excluded companies...');
        const filterResult = this.processor.filterExcludedCompanies(processedJobs, excludeCompanies);
        filteredJobs = filterResult.filtered;
        excludedCount = filterResult.excluded;
        console.log(`✓ Filtered: ${processedJobs.length} → ${filteredJobs.length} jobs (${excludedCount} excluded)\n`);
      } else {
        console.log('[Step 3] No company exclusions configured\n');
      }

      // Step 4: Deduplicate by company
      console.log('[Step 4] Deduplicating by company...');
      const deduplicatedJobs = this.processor.deduplicateByCompany(filteredJobs);
      console.log(`✓ Deduplicated: ${filteredJobs.length} → ${deduplicatedJobs.length} unique jobs\n`);

      // Step 5: Push to Google Sheets
      console.log('[Step 5] Pushing to Google Sheets...');
      const sheetsResult = await this.sheets.appendJobs(deduplicatedJobs);
      console.log(`✓ Appended ${sheetsResult.appended} jobs, skipped ${sheetsResult.skipped} duplicates\n`);

      // Summary
      console.log('='.repeat(60));
      console.log('Run Complete - Summary');
      console.log('='.repeat(60));
      console.log(`Jobs Scraped: ${scrapeResult.items.length}`);
      console.log(`Jobs Processed: ${processedJobs.length}`);
      if (excludedCount > 0) {
        console.log(`Jobs Excluded: ${excludedCount}`);
      }
      console.log(`Jobs After Filtering: ${filteredJobs.length}`);
      console.log(`Jobs After Deduplication: ${deduplicatedJobs.length}`);
      console.log(`Jobs Appended: ${sheetsResult.appended}`);
      console.log(`Jobs Skipped (duplicates): ${sheetsResult.skipped}`);
      console.log('='.repeat(60));

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
      console.error('\n❌ Error during scraping:', error.message);
      console.error(error.stack);
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
    console.error(`Error: ${flag} requires a value`);
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
      console.error('Error: --max-results must be a positive number');
      process.exit(1);
    }
    options.maxResults = parsed;
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
