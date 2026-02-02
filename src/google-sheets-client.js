/**
 * Google Sheets Integration
 * Handles authentication and data pushing to Google Sheets
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class GoogleSheetsClient {
  constructor(config) {
    this.spreadsheetId = config.spreadsheetId;
    this.sheetName = config.sheetName || 'LinkedIn Jobs';
    this.credentialsPath = config.credentialsPath;
    this.auth = null;
    this.sheets = null;
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
    
    console.log('[Sheets] Initialized Google Sheets client');
  }

  /**
   * Ensure sheet exists, create if it doesn't
   */
  async ensureSheetExists() {
    try {
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });

      const sheetExists = spreadsheet.data.sheets.some(
        sheet => sheet.properties.title === this.sheetName
      );

      if (!sheetExists) {
        await this.sheets.spreadsheets.batchUpdate({
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
        });
        console.log(`[Sheets] Created sheet: ${this.sheetName}`);
      }

      // Set headers if sheet is empty
      await this.setHeadersIfNeeded();
    } catch (error) {
      console.error('[Sheets] Error ensuring sheet exists:', error.message);
      throw error;
    }
  }

  /**
   * Set headers if sheet is empty
   */
  async setHeadersIfNeeded() {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A1:L1`
      });

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

        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${this.sheetName}!A1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [headers]
          }
        });

        console.log('[Sheets] Set headers');
      }
    } catch (error) {
      console.error('[Sheets] Error setting headers:', error.message);
      throw error;
    }
  }

  /**
   * Get existing company names from sheet (for deduplication)
   * @returns {Promise<Set>} Set of existing company names (lowercase)
   */
  async getExistingCompanies() {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!C:C` // Column C is Company Name
      });

      const rows = response.data.values || [];
      const companies = new Set();
      
      // Skip header row (index 0)
      for (let i = 1; i < rows.length; i++) {
        const companyName = rows[i][0];
        if (companyName) {
          companies.add(companyName.toLowerCase().trim());
        }
      }

      console.log(`[Sheets] Found ${companies.size} existing companies`);
      return companies;
    } catch (error) {
      console.error('[Sheets] Error getting existing companies:', error.message);
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
      console.log('[Sheets] No jobs to append');
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
      console.log('[Sheets] All jobs are duplicates, nothing to append');
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
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A:L`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: rows
        }
      });

      console.log(`[Sheets] Appended ${newJobs.length} jobs (skipped ${jobs.length - newJobs.length} duplicates)`);
      
      return {
        appended: newJobs.length,
        skipped: jobs.length - newJobs.length
      };
    } catch (error) {
      console.error('[Sheets] Error appending jobs:', error.message);
      throw error;
    }
  }
}

module.exports = GoogleSheetsClient;
