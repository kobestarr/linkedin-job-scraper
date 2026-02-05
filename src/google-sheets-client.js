/**
 * Google Sheets Integration
 * Handles authentication and data pushing to Google Sheets
 */

require('dotenv').config();
const { google } = require('googleapis');
const fs = require('fs');

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
  }
};

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 * @param {number} baseDelay - Base delay in ms (default: 1000)
 * @returns {Promise<any>} Result of the function
 */
async function withRetry(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        logger.info(`[Sheets] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

class GoogleSheetsClient {
  constructor(config) {
    // Extract spreadsheet ID from URL if provided
    this.spreadsheetId = this.extractSpreadsheetId(config.spreadsheetId || config.spreadsheetUrl);
    this.sheetName = config.sheetName || 'LinkedIn Jobs';
    this.credentialsPath = config.credentialsPath;
    this.auth = null;
    this.sheets = null;
  }

  /**
   * Extract spreadsheet ID from Google Sheets URL
   * Supports formats:
   * - https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
   * - https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit#gid=0
   * - Just the ID itself
   */
  extractSpreadsheetId(input) {
    if (!input) {
      throw new Error('Spreadsheet ID or URL is required');
    }

    // If it's already just an ID (no slashes), return as-is
    if (!input.includes('/')) {
      return input;
    }

    // Extract ID from URL
    const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return match[1];
    }

    // If no match, assume it's the ID
    return input;
  }

  /**
   * Initialize Google Sheets API client
   */
  async initialize() {
    if (!this.credentialsPath || !fs.existsSync(this.credentialsPath)) {
      throw new Error(`Google Sheets credentials not found at: ${this.credentialsPath}`);
    }

    const credentials = JSON.parse(fs.readFileSync(this.credentialsPath, 'utf8'));
    
    this.auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    
    logger.info('[Sheets] Initialized Google Sheets client');
  }

  /**
   * Ensure sheet exists, create if it doesn't
   */
  async ensureSheetExists() {
    try {
      const spreadsheet = await withRetry(() =>
        this.sheets.spreadsheets.get({
          spreadsheetId: this.spreadsheetId
        })
      );

      const sheetExists = spreadsheet.data.sheets.some(
        sheet => sheet.properties.title === this.sheetName
      );

      if (!sheetExists) {
        await withRetry(() =>
          this.sheets.spreadsheets.batchUpdate({
            spreadsheetId: this.spreadsheetId,
            requestBody: {
              requests: [{
                addSheet: {
                  properties: {
                    title: this.sheetName
                  }
                }
              }]
            }
          })
        );
        logger.info('[Sheets] Created sheet', { sheetName: this.sheetName });
      }

      // Set headers if sheet is empty
      await this.setHeadersIfNeeded();
    } catch (error) {
      logger.error('[Sheets] Error ensuring sheet exists', { error: error.message });
      throw error;
    }
  }

  /**
   * Set headers if sheet is empty
   */
  async setHeadersIfNeeded() {
    try {
      const response = await withRetry(() =>
        this.sheets.spreadsheets.values.get({
          spreadsheetId: this.spreadsheetId,
          range: `${this.sheetName}!A1:L1`
        })
      );

      const existingHeaders = response.data.values && response.data.values[0];
      
      if (!existingHeaders || existingHeaders.length === 0) {
        const headers = [
          'Date Scraped',
          'Job Title',
          'Company Name',
          'Company LinkedIn URL',
          'Job Posting URL',
          'Location',
          'Posted Date',
          'Days Since Posted',
          'Employment Type',
          'Experience Level',
          'Job Description',
          'Status'
        ];

        await withRetry(() =>
          this.sheets.spreadsheets.values.update({
            spreadsheetId: this.spreadsheetId,
            range: `${this.sheetName}!A1`,
            valueInputOption: 'RAW',
            requestBody: {
              values: [headers]
            }
          })
        );

        logger.info('[Sheets] Set headers');
      }
    } catch (error) {
      logger.error('[Sheets] Error setting headers', { error: error.message });
      throw error;
    }
  }

  /**
   * Get existing company names from sheet (for deduplication)
   * Uses a row limit to prevent memory issues with large datasets
   * @param {number} maxRows - Maximum rows to fetch (default: 10000)
   * @returns {Promise<Set>} Set of existing company names (lowercase)
   */
  async getExistingCompanies(maxRows = 10000) {
    try {
      // Fetch limited range to prevent memory issues with very large sheets
      const response = await withRetry(() =>
        this.sheets.spreadsheets.values.get({
          spreadsheetId: this.spreadsheetId,
          range: `${this.sheetName}!C2:C${maxRows + 1}` // Column C, skip header, limit rows
        })
      );

      const rows = response.data.values || [];
      const companies = new Set();

      for (const row of rows) {
        const companyName = row[0];
        if (companyName) {
          companies.add(companyName.toLowerCase().trim());
        }
      }

      logger.info('[Sheets] Retrieved existing companies', { 
        count: companies.size, 
        maxRowsChecked: maxRows 
      });
      return companies;
    } catch (error) {
      logger.error('[Sheets] Error getting existing companies', { error: error.message });
      // Return empty set if error (will append all jobs)
      return new Set();
    }
  }

  /**
   * Append jobs to sheet, skipping duplicates
   * @param {Array} jobs - Array of processed job objects
   * @returns {Promise<Object>} Result with appended count
   */
  async appendJobs(jobs) {
    if (!this.sheets) {
      await this.initialize();
    }

    if (!Array.isArray(jobs) || jobs.length === 0) {
      logger.info('[Sheets] No jobs to append');
      return { appended: 0, skipped: 0 };
    }

    await this.ensureSheetExists();
    const existingCompanies = await this.getExistingCompanies();

    // Filter out jobs from companies that already exist
    const newJobs = jobs.filter(job => {
      const companyKey = job.companyName.toLowerCase().trim();
      return !existingCompanies.has(companyKey);
    });

    if (newJobs.length === 0) {
      logger.info('[Sheets] All jobs are duplicates, nothing to append');
      return { appended: 0, skipped: jobs.length };
    }

    // Convert jobs to rows
    const rows = newJobs.map(job => [
      job.dateScraped,
      job.jobTitle,
      job.companyName,
      job.companyLinkedInUrl,
      job.jobPostingUrl,
      job.location,
      job.postedDate,
      job.daysSincePosted,
      job.employmentType,
      job.experienceLevel,
      job.jobDescription,
      job.status
    ]);

    try {
      await withRetry(() =>
        this.sheets.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: `${this.sheetName}!A:L`,
          valueInputOption: 'RAW',
          insertDataOption: 'INSERT_ROWS',
          requestBody: {
            values: rows
          }
        })
      );

      logger.info('[Sheets] Jobs appended', { 
        appended: newJobs.length, 
        skipped: jobs.length - newJobs.length 
      });
      
      return {
        appended: newJobs.length,
        skipped: jobs.length - newJobs.length
      };
    } catch (error) {
      logger.error('[Sheets] Error appending jobs', { error: error.message });
      throw error;
    }
  }
}

module.exports = GoogleSheetsClient;
