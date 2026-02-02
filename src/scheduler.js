/**
 * Scheduler Module
 * Handles daily automated runs for multiple job titles
 */

const cron = require('node-cron');
const LinkedInJobScraper = require('./scraper');
const fs = require('fs');
const path = require('path');

class JobScraperScheduler {
  constructor(configPath = './config.json') {
    this.config = this.loadConfig(configPath);
    this.jobs = [];
    this.scrapers = new Map();
  }

  /**
   * Load configuration
   */
  loadConfig(configPath) {
    if (!fs.existsSync(configPath)) {
      throw new Error(`Config file not found: ${configPath}`);
    }
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }

  /**
   * Add a scheduled job for a specific job title
   * @param {Object} jobConfig - Job configuration
   * @param {string} jobConfig.jobTitle - Job title to scrape
   * @param {string} jobConfig.schedule - Cron schedule (default: from config)
   * @param {string} jobConfig.location - Location (default: from config)
   */
  addJob(jobConfig) {
    const {
      jobTitle,
      schedule = this.config.scheduler.schedule,
      location = this.config.scraping.location,
      maxResults = this.config.scraping.maxResults
    } = jobConfig;

    if (!jobTitle) {
      throw new Error('Job title is required');
    }

    console.log(`[Scheduler] Adding job: "${jobTitle}" with schedule: ${schedule}`);

    const task = cron.schedule(
      schedule,
      async () => {
        console.log(`\n[Scheduler] Running scheduled scrape for: "${jobTitle}"`);
        console.log(`[Scheduler] Time: ${new Date().toISOString()}`);
        
        try {
          const scraper = new LinkedInJobScraper();
          await scraper.run({
            jobTitle,
            location,
            maxResults
          });
          console.log(`[Scheduler] ✓ Completed scrape for: "${jobTitle}"\n`);
        } catch (error) {
          console.error(`[Scheduler] ✗ Failed scrape for: "${jobTitle}":`, error.message);
        }
      },
      {
        scheduled: false,
        timezone: this.config.scheduler.timezone || 'America/New_York'
      }
    );

    this.jobs.push({
      jobTitle,
      schedule,
      task,
      location,
      maxResults
    });

    return task;
  }

  /**
   * Start all scheduled jobs
   */
  start() {
    if (!this.config.scheduler.enabled) {
      console.log('[Scheduler] Scheduler is disabled in config');
      return;
    }

    if (this.jobs.length === 0) {
      console.log('[Scheduler] No jobs configured. Add jobs using addJob()');
      return;
    }

    console.log(`[Scheduler] Starting ${this.jobs.length} scheduled job(s)...`);
    
    this.jobs.forEach(({ jobTitle, task }) => {
      task.start();
      console.log(`[Scheduler] ✓ Started: "${jobTitle}"`);
    });

    console.log('[Scheduler] All jobs started. Waiting for scheduled runs...\n');
  }

  /**
   * Stop all scheduled jobs
   */
  stop() {
    console.log('[Scheduler] Stopping all scheduled jobs...');
    this.jobs.forEach(({ jobTitle, task }) => {
      task.stop();
      console.log(`[Scheduler] ✓ Stopped: "${jobTitle}"`);
    });
  }

  /**
   * Load multiple job titles from config and schedule them
   */
  loadJobsFromConfig() {
    // Check if config has multiple job titles
    if (this.config.scraping.jobTitles && Array.isArray(this.config.scraping.jobTitles)) {
      this.config.scraping.jobTitles.forEach(jobTitle => {
        this.addJob({ jobTitle });
      });
    } else if (this.config.scraping.jobTitle) {
      // Single job title
      this.addJob({ jobTitle: this.config.scraping.jobTitle });
    } else {
      throw new Error('No job title(s) configured');
    }
  }
}

// Run if called directly
if (require.main === module) {
  const scheduler = new JobScraperScheduler();
  
  // Load jobs from config
  scheduler.loadJobsFromConfig();
  
  // Start scheduler
  scheduler.start();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n[Scheduler] Received SIGINT, stopping...');
    scheduler.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n[Scheduler] Received SIGTERM, stopping...');
    scheduler.stop();
    process.exit(0);
  });
}

module.exports = JobScraperScheduler;
