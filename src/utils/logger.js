/**
 * Shared Logger Utility
 * Centralized logging for consistent output across modules
 */

const logger = {
  /**
   * Log info message
   * @param {string} message - Message to log
   * @param {Object} [meta] - Optional metadata
   */
  info: (message, meta) => {
    // eslint-disable-next-line no-console
    console.log(`[${new Date().toISOString()}] [INFO] ${message}`, meta ? JSON.stringify(meta) : '');
  },

  /**
   * Log error message
   * @param {string} message - Message to log
   * @param {Object} [meta] - Optional metadata
   */
  error: (message, meta) => {
    // eslint-disable-next-line no-console
    console.error(`[${new Date().toISOString()}] [ERROR] ${message}`, meta ? JSON.stringify(meta) : '');
  },

  /**
   * Log debug message (only if DEBUG env var is set)
   * @param {string} message - Message to log
   * @param {Object} [meta] - Optional metadata
   */
  debug: (message, meta) => {
    if (process.env.DEBUG) {
      // eslint-disable-next-line no-console
      console.debug(`[${new Date().toISOString()}] [DEBUG] ${message}`, meta ? JSON.stringify(meta) : '');
    }
  },

  /**
   * CLI-friendly output (no timestamps for user-facing messages)
   * @param {string} message - Message to log
   */
  cli: (message) => {
    // eslint-disable-next-line no-console
    console.log(message);
  },

  /**
   * Log warning message
   * @param {string} message - Message to log
   * @param {Object} [meta] - Optional metadata
   */
  warn: (message, meta) => {
    // eslint-disable-next-line no-console
    console.warn(`[${new Date().toISOString()}] [WARN] ${message}`, meta ? JSON.stringify(meta) : '');
  }
};

module.exports = logger;
