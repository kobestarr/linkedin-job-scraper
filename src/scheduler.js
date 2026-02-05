/**
 * Scheduler Module
 * Handles daily automated runs for multiple job titles
 */

const cron = require('node-cron');
const LinkedInJobScraper = require('./scraper');
const logger = require('./utils/logger');
const { validateJobTitle, validateScrapingConfig } = require('./utils/validators');
const fs = require('fs');
const path = require('path');

class JobScraperScheduler {
  constructor(configPath = './config.json') {
    this.configPath = configPath;
    this.config = this.loadConfig(configPath);
    this.jobs = [];
    this.isRunning = false;
    this.shutdownHandlers = [];
    this.scraperInstance = null;
  }

  /**
   * Load configuration
   */
  loadConfig(configPath) {
    if (!fs.existsSync(configPath)) {
      throw new Error(`Config file not found: ${configPath}`);
    }
    
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Validate config
    const configValidation = validateScrapingConfig(config.scraping);
    if (!configValidation.valid) {
      throw new Error(`Invalid configuration: ${configValidation.error}`);
    }
    
    return config;
  }

  /**
   * Get or create scraper instance
   * Reuses the same scraper instance for all jobs to avoid reloading config
   */
  getScraper() {
    if (!this.scraperInstance) {
      this.scraperInstance = new LinkedInJobScraper(this.configPath);
    }
    return this.scraperInstance;
  }

  /**
   * Add a scheduled job for a specific job title
   * @param {Object} jobConfig - Job configuration
   * @param {string} jobConfig.jobTitle - Job title to scrape
   * @param {string} jobConfig.schedule - Cron schedule (default: from config)
   * @param {string} jobConfig.location - Location (default: from config)
   * @param {number} jobConfig.maxResults - Max results (default: from config)
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

    // Validate job title
    const validation = validateJobTitle(jobTitle);
    if (!validation.valid) {
      throw new Error(`Invalid job title: ${validation.error}`);
    }

    // Validate cron schedule
    if (!cron.validate(schedule)) {
      throw new Error(`Invalid cron schedule: ${schedule}`);
    }

    logger.info(`[Scheduler] Adding job: "${jobTitle}" with schedule: ${schedule}`);

    const task = cron.schedule(
      schedule,
      async () => {
        logger.info(`[Scheduler] Running scheduled scrape for: "${jobTitle}"`);
        
        try {
          // Use shared scraper instance with config path
          const scraper = this.getScraper();
          await scraper.run({
            jobTitle,
            location,
            maxResults
          });
          logger.info(`[Scheduler] Completed scrape for: "${jobTitle}"`);
        } catch (error) {
          logger.error(`[Scheduler] Failed scrape for: "${jobTitle}"`, { 
            error: error.message,
            stack: error.stack 
          });
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
      logger.info('[Scheduler] Scheduler is disabled in config');
      return;
    }

    if (this.jobs.length === 0) {
      logger.info('[Scheduler] No jobs configured. Add jobs using addJob()');
      return;
    }

    if (this.isRunning) {
      logger.info('[Scheduler] Already running');
      return;
    }

    this.isRunning = true;
    logger.info(`[Scheduler] Starting ${this.jobs.length} scheduled job(s)...`);
    
    this.jobs.forEach(({ jobTitle, task }) => {
      task.start();
      logger.info(`[Scheduler] Started: "${jobTitle}"`);
    });

    logger.info('[Scheduler] All jobs started. Waiting for scheduled runs...');
  }

  /**
   * Stop all scheduled jobs
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    logger.info('[Scheduler] Stopping all scheduled jobs...');
    this.jobs.forEach(({ jobTitle, task }) => {
      task.stop();
      logger.info(`[Scheduler] Stopped: "${jobTitle}"`);
    });
    this.isRunning = false;
    
    // Run any registered shutdown handlers
    this.shutdownHandlers.forEach(handler => {
      try {
        handler();
      } catch (error) {
        logger.error('[Scheduler] Shutdown handler failed', { error: error.message });
      }
    });
  }

  /**
   * Register a handler to run on shutdown
   */
  onShutdown(handler) {
    this.shutdownHandlers.push(handler);
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
  const gracefulShutdown = (signal) => {
    logger.info(`[Scheduler] Received ${signal}, shutting down gracefully...`);
    scheduler.stop();
    
    // Give time for cleanup before exiting
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  
  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    logger.error('[Scheduler] Uncaught exception', { 
      error: error.message,
      stack: error.stack 
    });
    scheduler.stop();
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('[Scheduler] Unhandled rejection', { 
      reason: reason instanceof Error ? reason.message : String(reason) 
    });
  });

  // Handle nodemon/HMR restarts
  process.on('SIGHUP', () => {
    logger.info('[Scheduler] Received SIGHUP (restart signal)');
    scheduler.stop();
    process.exit(0);
  });
}

module.exports = JobScraperScheduler;
