/**
 * Shared Retry Utility
 * Exponential backoff retry logic for async operations
 */

const logger = require('./logger');

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} [maxRetries=3] - Maximum number of retries
 * @param {number} [baseDelay=1000] - Base delay in ms
 * @param {string} [operationName='Operation'] - Name for logging
 * @returns {Promise<any>} Result of the function
 */
async function withRetry(fn, maxRetries = 3, baseDelay = 1000, operationName = 'Operation') {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        logger.info(`[${operationName}] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Retry with timeout
 * @param {Function} fn - Async function to retry
 * @param {number} [timeoutMs=30000] - Timeout in milliseconds
 * @param {number} [maxRetries=3] - Maximum number of retries
 * @param {string} [operationName='Operation'] - Name for logging
 * @returns {Promise<any>} Result of the function
 */
async function withRetryAndTimeout(fn, timeoutMs = 30000, maxRetries = 3, operationName = 'Operation') {
  return withRetry(
    async () => {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`${operationName} timed out after ${timeoutMs}ms`)), timeoutMs);
      });
      
      return Promise.race([fn(), timeoutPromise]);
    },
    maxRetries,
    1000,
    operationName
  );
}

module.exports = {
  withRetry,
  withRetryAndTimeout
};
