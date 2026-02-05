/**
 * Input Validation Utilities
 * Validates user inputs and configuration values
 */

const logger = require('./logger');

/**
 * Validation result object
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether validation passed
 * @property {string|null} error - Error message if invalid
 */

/**
 * Validate job title input
 * @param {string} jobTitle - Job title to validate
 * @returns {ValidationResult} Validation result
 */
function validateJobTitle(jobTitle) {
  if (!jobTitle || typeof jobTitle !== 'string') {
    return { valid: false, error: 'Job title is required and must be a string' };
  }
  
  const trimmed = jobTitle.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Job title cannot be empty' };
  }
  
  if (trimmed.length > 200) {
    return { valid: false, error: 'Job title must be less than 200 characters' };
  }
  
  // Check for potentially dangerous characters
  const dangerousPattern = /[<>\{\}\[\]\\]/;
  if (dangerousPattern.test(trimmed)) {
    return { valid: false, error: 'Job title contains invalid characters' };
  }
  
  return { valid: true, error: null };
}

/**
 * Validate location input
 * @param {string} location - Location to validate
 * @returns {ValidationResult} Validation result
 */
function validateLocation(location) {
  if (!location || typeof location !== 'string') {
    return { valid: false, error: 'Location must be a string' };
  }
  
  const trimmed = location.trim();
  
  if (trimmed.length > 100) {
    return { valid: false, error: 'Location must be less than 100 characters' };
  }
  
  // Check for potentially dangerous characters
  const dangerousPattern = /[<>\{\}\[\]\\]/;
  if (dangerousPattern.test(trimmed)) {
    return { valid: false, error: 'Location contains invalid characters' };
  }
  
  return { valid: true, error: null };
}

/**
 * Validate max results input
 * @param {number} maxResults - Max results to validate
 * @returns {ValidationResult} Validation result
 */
function validateMaxResults(maxResults) {
  const num = Number(maxResults);
  
  if (isNaN(num)) {
    return { valid: false, error: 'Max results must be a number' };
  }
  
  if (!Number.isInteger(num)) {
    return { valid: false, error: 'Max results must be an integer' };
  }
  
  if (num <= 0) {
    return { valid: false, error: 'Max results must be greater than 0' };
  }
  
  if (num > 1000) {
    return { valid: false, error: 'Max results cannot exceed 1000' };
  }
  
  return { valid: true, error: null };
}

/**
 * Validate date range
 * @param {string} dateRange - Date range to validate
 * @returns {ValidationResult} Validation result
 */
function validateDateRange(dateRange) {
  const validRanges = ['last24hours', 'last7days', 'last30days', 'any'];
  
  if (!dateRange || typeof dateRange !== 'string') {
    return { valid: false, error: 'Date range must be a string' };
  }
  
  if (!validRanges.includes(dateRange)) {
    return { valid: false, error: `Date range must be one of: ${validRanges.join(', ')}` };
  }
  
  return { valid: true, error: null };
}

/**
 * Validate company name for exclusion list
 * @param {string} companyName - Company name to validate
 * @returns {ValidationResult} Validation result
 */
function validateCompanyName(companyName) {
  if (!companyName || typeof companyName !== 'string') {
    return { valid: false, error: 'Company name must be a string' };
  }
  
  const trimmed = companyName.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Company name cannot be empty' };
  }
  
  if (trimmed.length > 100) {
    return { valid: false, error: 'Company name must be less than 100 characters' };
  }
  
  return { valid: true, error: null };
}

/**
 * Sanitize string input
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
function sanitizeString(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Trim whitespace and normalize multiple spaces
  return input.trim().replace(/\s+/g, ' ');
}

/**
 * Validate scraping configuration
 * @param {Object} config - Configuration object
 * @returns {ValidationResult} Validation result
 */
function validateScrapingConfig(config) {
  if (!config || typeof config !== 'object') {
    return { valid: false, error: 'Configuration must be an object' };
  }
  
  // Validate jobTitle or jobTitles
  if (config.jobTitle) {
    const titleValidation = validateJobTitle(config.jobTitle);
    if (!titleValidation.valid) {
      return titleValidation;
    }
  } else if (config.jobTitles && Array.isArray(config.jobTitles)) {
    for (const title of config.jobTitles) {
      const titleValidation = validateJobTitle(title);
      if (!titleValidation.valid) {
        return { valid: false, error: `Invalid job title "${title}": ${titleValidation.error}` };
      }
    }
  } else {
    return { valid: false, error: 'Either jobTitle or jobTitles array is required' };
  }
  
  // Validate location
  if (config.location) {
    const locationValidation = validateLocation(config.location);
    if (!locationValidation.valid) {
      return locationValidation;
    }
  }
  
  // Validate maxResults
  if (config.maxResults !== undefined) {
    const maxResultsValidation = validateMaxResults(config.maxResults);
    if (!maxResultsValidation.valid) {
      return maxResultsValidation;
    }
  }
  
  // Validate dateRange
  if (config.dateRange) {
    const dateRangeValidation = validateDateRange(config.dateRange);
    if (!dateRangeValidation.valid) {
      return dateRangeValidation;
    }
  }
  
  // Validate excludeCompanies
  if (config.excludeCompanies && Array.isArray(config.excludeCompanies)) {
    for (const company of config.excludeCompanies) {
      const companyValidation = validateCompanyName(company);
      if (!companyValidation.valid) {
        return { valid: false, error: `Invalid company name "${company}": ${companyValidation.error}` };
      }
    }
  }
  
  return { valid: true, error: null };
}

module.exports = {
  validateJobTitle,
  validateLocation,
  validateMaxResults,
  validateDateRange,
  validateCompanyName,
  validateScrapingConfig,
  sanitizeString
};
