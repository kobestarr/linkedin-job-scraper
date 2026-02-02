/**
 * Apify LinkedIn Job Scraper Integration
 * Handles connection to Apify and running LinkedIn Job Scraper actor
 */

const { ApifyClient } = require('apify-client');

class ApifyJobScraper {
  constructor(apiToken, actorId = null) {
    if (!apiToken) {
      throw new Error('Apify API token is required');
    }
    this.client = new ApifyClient({ token: apiToken });
    // Default to Apify Linkedin Job Scrapper [NO COOKIES] - most economical
    
    if (!apiToken) {
      throw new Error('Apify API token is required');
    }
    this.client = new ApifyClient({ token: apiToken });
     // Default actor ID - may need to be updated
  }

  /**
   * Run LinkedIn Job Scraper with specified filters
   * @param {Object} options - Scraping options
   * @param {string} options.jobTitle - Job title to search for
   * @param {string} options.location - Location (country-level, e.g., "United States")
   * @param {string} options.dateRange - Date range filter (e.g., "last24hours")
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

    try {
      // Run the actor
      const run = await this.client.actor(this.actorId).call({
        jobTitle,
        location,
        publishedIn: dateRange,
        limit: maxResults
      });

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
