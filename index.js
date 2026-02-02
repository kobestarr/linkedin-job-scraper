/**
 * Main Entry Point
 * Can be used to run scraper or scheduler
 */

const LinkedInJobScraper = require('./src/scraper');
const JobScraperScheduler = require('./src/scheduler');

// Export modules
module.exports = {
  LinkedInJobScraper,
  JobScraperScheduler
};

// If run directly, start scheduler
if (require.main === module) {
  const scheduler = new JobScraperScheduler();
  scheduler.loadJobsFromConfig();
  scheduler.start();
}
