/**
 * Apify LinkedIn Job Scraper Integration
 * Handles connection to Apify and running LinkedIn Job Scraper actor
 * Uses cheap_scraper/linkedin-job-scraper - cheapest option at $0.35/1K jobs
 */

require('dotenv').config();
const { ApifyClient } = require('apify-client');
const logger = require('./utils/logger');
const { withRetry } = require('./utils/retry');
const { validateJobTitle, validateMaxResults } = require('./utils/validators');

class ApifyJobScraper {
  constructor(apiToken, actorId = null) {
    if (!apiToken) {
      throw new Error('Apify API token is required');
    }
    this.client = new ApifyClient({ token: apiToken });
    // Default to cheap_scraper/linkedin-job-scraper - cheapest option ($0.35/1K at Gold tier)
    // Actor ID: 2rJKkhh7vjpX7pvjg
    this.actorId = actorId || '2rJKkhh7vjpX7pvjg';
  }

  /**
   * Map date range to cheap_scraper format
   * @param {string} dateRange - Date range (e.g., "last24hours", "last7days", "last30days")
   * @returns {string} Mapped date range (e.g., "r86400", "r604800", "r2592000")
   */
  mapDateRange(dateRange) {
    const mapping = {
      'last24hours': 'r86400',
      'last7days': 'r604800',
      'last30days': 'r2592000',
      'any': null // No filter
    };
    return mapping[dateRange] || mapping['last24hours'];
  }

  /**
   * Run LinkedIn Job Scraper with specified filters
   * @param {Object} options - Scraping options
   * @param {string} options.jobTitle - Job title to search for
   * @param {string} options.location - Location (country-level, e.g., "United States")
   * @param {string} options.dateRange - Date range filter (e.g., "last24hours", "last7days", "last30days")
   * @param {number} options.maxResults - Maximum number of results (default: 50)
   * @returns {Promise<Object>} Run result with dataset items
   */
  async scrapeJobs(options = {}) {
    const {
      jobTitle,
      location = 'United States',
      dateRange = 'last24hours',
      maxResults = 50
    } = options;

    // Validate inputs
    const jobTitleValidation = validateJobTitle(jobTitle);
    if (!jobTitleValidation.valid) {
      throw new Error(`Invalid job title: ${jobTitleValidation.error}`);
    }

    const maxResultsValidation = validateMaxResults(maxResults);
    if (!maxResultsValidation.valid) {
      throw new Error(`Invalid max results: ${maxResultsValidation.error}`);
    }

    logger.info('[Apify] Starting scrape', { jobTitle, location, actorId: this.actorId });

    try {
      // Map parameters to cheap_scraper format
      const actorInput = {
        keyword: [jobTitle], // cheap_scraper expects array of keywords
        location: location,
        maxItems: maxResults, // cheap_scraper uses maxItems instead of limit
        saveOnlyUniqueItems: true // Enable deduplication to save money
      };

      // Add date filter if specified
      const publishedAt = this.mapDateRange(dateRange);
      if (publishedAt) {
        actorInput.publishedAt = publishedAt;
      }

      logger.debug('[Apify] Actor input', actorInput);

      // Run the actor with retry
      const run = await withRetry(
        () => this.client.actor(this.actorId).call(actorInput),
        3,
        2000,
        'Apify Actor Run'
      );

      logger.info('[Apify] Run started', { runId: run.id });

      // Wait for the run to finish with timeout (5 minutes)
      const finishedRun = await withRetry(
        async () => {
          const result = await this.client.run(run.id).waitForFinish({ waitSecs: 300 });
          return result;
        },
        2,
        1000,
        'Apify Wait for Finish'
      );

      if (finishedRun.status !== 'SUCCEEDED') {
        throw new Error(`Apify run failed with status: ${finishedRun.status}`);
      }

      logger.info('[Apify] Run completed', { runId: finishedRun.id });

      // Get the dataset items with retry
      const datasetId = finishedRun.defaultDatasetId;
      const { items } = await withRetry(
        () => this.client.dataset(datasetId).listItems(),
        3,
        1000,
        'Apify Dataset Fetch'
      );

      logger.info('[Apify] Jobs retrieved', { count: items.length });

      return {
        runId: finishedRun.id,
        datasetId,
        items,
        totalCount: items.length
      };
    } catch (error) {
      logger.error('[Apify] Error scraping jobs', { error: error.message });
      throw error;
    }
  }

  /**
   * Get dataset items from a completed run
   * @param {string} datasetId - Dataset ID from completed run
   * @returns {Promise<Array>} Array of job items
   */
  async getDatasetItems(datasetId) {
    try {
      const { items } = await withRetry(
        () => this.client.dataset(datasetId).listItems(),
        3,
        1000,
        'Apify Get Dataset Items'
      );
      return items;
    } catch (error) {
      logger.error('[Apify] Error getting dataset items', { error: error.message });
      throw error;
    }
  }
}

module.exports = ApifyJobScraper;
