/**
 * Data Processing Module
 * Parses, cleans, and deduplicates job data from Apify
 */

// Simple logger
const logger = {
  info: (message, meta) => {
    // eslint-disable-next-line no-console
    console.log(`[${new Date().toISOString()}] [INFO] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  debug: (message, meta) => {
    if (process.env.DEBUG) {
      // eslint-disable-next-line no-console
      console.debug(`[${new Date().toISOString()}] [DEBUG] ${message}`, meta ? JSON.stringify(meta) : '');
    }
  }
};

class JobDataProcessor {
  /**
   * Process raw Apify job data
   * @param {Array} rawJobs - Raw job items from Apify
   * @param {string} jobTitle - Job title being scraped
   * @returns {Array} Processed job objects
   */
  processJobs(rawJobs, jobTitle) {
    if (!Array.isArray(rawJobs)) {
      throw new Error('Raw jobs must be an array');
    }

    return rawJobs.map((job, index) => this.processJob(job, jobTitle, index));
  }

  /**
   * Process a single job item
   * @param {Object} job - Raw job object from Apify
   * @param {string} jobTitle - Job title being scraped
   * @param {number} index - Index in the array
   * @returns {Object} Processed job object
   */
  processJob(job, jobTitle, index = 0) {
    const now = new Date();
    const postedDate = job.publishedAt ? new Date(job.publishedAt) : null;
    const daysAgo = postedDate 
      ? Math.floor((now - postedDate) / (1000 * 60 * 60 * 24))
      : null;

    return {
      dateScraped: now.toISOString().split('T')[0],
      jobTitle: jobTitle || job.title || 'Unknown',
      companyName: this.cleanCompanyName(job.company || job.companyName || 'Unknown'),
      companyLinkedInUrl: job.companyUrl || job.companyLinkedInUrl || '',
      jobPostingUrl: job.url || job.jobUrl || '',
      location: this.cleanLocation(job.location || ''),
      postedDate: postedDate ? postedDate.toISOString().split('T')[0] : '',
      daysSincePosted: daysAgo !== null ? daysAgo : '',
      employmentType: job.employmentType || job.type || '',
      experienceLevel: job.experienceLevel || job.level || '',
      jobDescription: this.truncateDescription(job.description || job.text || ''),
      status: 'New',
      scrapedAt: now.toISOString()
    };
  }

  /**
   * Clean and normalize company name
   * @param {string} companyName - Raw company name
   * @returns {string} Cleaned company name
   */
  cleanCompanyName(companyName) {
    if (!companyName) return 'Unknown';
    return companyName.trim().replace(/\s+/g, ' ');
  }

  /**
   * Clean and normalize location
   * @param {string} location - Raw location string
   * @returns {string} Cleaned location
   */
  cleanLocation(location) {
    if (!location) return '';
    return location.trim().replace(/\s+/g, ' ');
  }

  /**
   * Truncate job description to reasonable length
   * @param {string} description - Full job description
   * @param {number} maxLength - Maximum length (default: 500)
   * @returns {string} Truncated description
   */
  truncateDescription(description, maxLength = 500) {
    if (!description) return '';
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + '...';
  }

  /**
   * Filter out jobs from excluded companies
   * Case-insensitive partial matching (e.g., "Salesforce" matches "Salesforce Inc")
   * @param {Array} jobs - Array of processed job objects
   * @param {Array} excludeCompanies - Array of company names to exclude (case-insensitive)
   * @returns {Object} Object with filtered jobs and excluded count
   */
  filterExcludedCompanies(jobs, excludeCompanies = []) {
    if (!Array.isArray(jobs) || jobs.length === 0) {
      return { filtered: [], excluded: 0 };
    }

    if (!Array.isArray(excludeCompanies) || excludeCompanies.length === 0) {
      return { filtered: jobs, excluded: 0 };
    }

    // Normalize exclude list to lowercase for comparison
    const excludeLower = excludeCompanies.map(name => name.toLowerCase().trim()).filter(name => name.length > 0);

    if (excludeLower.length === 0) {
      return { filtered: jobs, excluded: 0 };
    }

    const filtered = [];
    let excluded = 0;

    jobs.forEach(job => {
      const companyNameLower = job.companyName.toLowerCase().trim();

      // Check if company name contains any excluded company name (one-directional match)
      // e.g., "Salesforce" in exclude list matches "Salesforce Inc" or "Salesforce.com"
      const shouldExclude = excludeLower.some(excludedName =>
        companyNameLower.includes(excludedName)
      );

      if (shouldExclude) {
        excluded++;
      } else {
        filtered.push(job);
      }
    });

    if (excluded > 0) {
      logger.info('[Processor] Excluded jobs from filtered companies', { excluded });
    }

    return { filtered, excluded };
  }

  /**
   * Deduplicate jobs by company name
   * Keeps the most recent posting per company
   * @param {Array} jobs - Array of processed job objects
   * @returns {Array} Deduplicated jobs
   */
  deduplicateByCompany(jobs) {
    if (!Array.isArray(jobs) || jobs.length === 0) {
      return [];
    }

    const companyMap = new Map();

    jobs.forEach(job => {
      const companyKey = job.companyName.toLowerCase().trim();

      if (!companyMap.has(companyKey)) {
        companyMap.set(companyKey, job);
      } else {
        // Keep the most recent posting using Date objects for comparison
        const existing = companyMap.get(companyKey);
        const existingDate = existing.postedDate ? new Date(existing.postedDate) : null;
        const newDate = job.postedDate ? new Date(job.postedDate) : null;

        // Prefer job with a valid date, or the newer date
        if (!existingDate && newDate) {
          companyMap.set(companyKey, job);
        } else if (existingDate && newDate && newDate > existingDate) {
          companyMap.set(companyKey, job);
        }
      }
    });

    const deduplicated = Array.from(companyMap.values());
    logger.info('[Processor] Deduplicated jobs', { 
      before: jobs.length, 
      after: deduplicated.length 
    });
    
    return deduplicated;
  }

  /**
   * Get unique company names from jobs
   * @param {Array} jobs - Array of job objects
   * @returns {Set} Set of unique company names (lowercase)
   */
  getUniqueCompanies(jobs) {
    return new Set(jobs.map(job => job.companyName.toLowerCase().trim()));
  }
}

module.exports = JobDataProcessor;
