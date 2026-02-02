/**
 * Apify LinkedIn Job Scraper Integration
 * Handles connection to Apify and running LinkedIn Job Scraper actor
 * Uses cheap_scraper/linkedin-job-scraper - cheapest option at $0.35/1K jobs
 */

const { ApifyClient } = require('apify-client');

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

    if (!jobTitle) {
      throw new Error('Job title is required');
    }

    console.log(`[Apify] Starting scrape for: "${jobTitle}" in "${location}"`);
    console.log(`[Apify] Using actor: ${this.actorId} (cheap_scraper)`);

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

      console.log(`[Apify] Actor input:`, JSON.stringify(actorInput, null, 2));

      // Run the actor
      const run = await this.client.actor(this.actorId).call(actorInput);

      console.log(`[Apify] Run started: ${run.id}`);

      // Wait for the run to finish
      const finishedRun = await this.client.run(run.id).waitForFinish();
      
      if (finishedRun.status !== 'SUCCEEDED') {
        throw new Error(`Apify run failed with status: ${finishedRun.status}`);
      }

      console.log(`[Apify] Run completed: ${finishedRun.id}`);

      // Get the dataset items
      const datasetId = finishedRun.defaultDatasetId;
      const { items } = await this.client.dataset(datasetId).listItems();

      console.log(`[Apify] Found ${items.length} jobs`);

      return {
        runId: finishedRun.id,
        datasetId,
        items,
        totalCount: items.length
      };
    } catch (error) {
      console.error('[Apify] Error scraping jobs:', error.message);
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
      const { items } = await this.client.dataset(datasetId).listItems();
      return items;
    } catch (error) {
      console.error('[Apify] Error getting dataset items:', error.message);
      throw error;
    }
  }
}

module.exports = ApifyJobScraper;
