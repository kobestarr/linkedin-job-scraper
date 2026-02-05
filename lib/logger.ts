/**
 * Unified Logger
 * 
 * Production-ready logging with log levels and context support.
 * In development: logs to console
 * In production: can be configured to use external services (Datadog, Sentry, etc.)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LoggerOptions {
  level?: LogLevel;
  enabled?: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private level: LogLevel;
  private enabled: boolean;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level || this.getDefaultLevel();
    this.enabled = options.enabled ?? true;
  }

  private getDefaultLevel(): LogLevel {
    // In production, default to 'info', otherwise 'debug'
    return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.enabled) return false;
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}]${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      // eslint-disable-next-line no-console
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      // eslint-disable-next-line no-console
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      // eslint-disable-next-line no-console
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  error(message: string, context?: LogContext): void {
    if (this.shouldLog('error')) {
      // eslint-disable-next-line no-console
      console.error(this.formatMessage('error', message, context));
    }
  }

  /**
   * Create a child logger with additional context
   */
  child(defaultContext: LogContext): Logger {
    const childLogger = new Logger({ level: this.level, enabled: this.enabled });
    
    // Override methods to include default context
    const originalInfo = childLogger.info.bind(childLogger);
    childLogger.info = (message: string, context?: LogContext) => {
      originalInfo(message, { ...defaultContext, ...context });
    };

    const originalError = childLogger.error.bind(childLogger);
    childLogger.error = (message: string, context?: LogContext) => {
      originalError(message, { ...defaultContext, ...context });
    };

    return childLogger;
  }
}

// Singleton instance
export const logger = new Logger();

// Export class for custom instances
export { Logger };
