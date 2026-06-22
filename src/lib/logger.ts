/**
 * Production-ready logging service
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogContext {
  [key: string]: any;
}

class Logger {
  private level: LogLevel;
  private enableRequestLogging: boolean;

  constructor() {
    this.level = this.getLogLevel();
    this.enableRequestLogging = process.env.ENABLE_REQUEST_LOGGING === 'true';
  }

  private getLogLevel(): LogLevel {
    const level = process.env.LOG_LEVEL?.toUpperCase();
    switch (level) {
      case 'DEBUG':
        return LogLevel.DEBUG;
      case 'INFO':
        return LogLevel.INFO;
      case 'WARN':
        return LogLevel.WARN;
      case 'ERROR':
        return LogLevel.ERROR;
      default:
        return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage('DEBUG', message, context));
    }
  }

  info(message: string, context?: LogContext) {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage('INFO', message, context));
    }
  }

  warn(message: string, context?: LogContext) {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message, context));
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorContext = {
        ...context,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : error,
      };
      console.error(this.formatMessage('ERROR', message, errorContext));
    }
  }

  /**
   * Log API request
   */
  request(method: string, url: string, status: number, duration: number, context?: LogContext) {
    if (this.enableRequestLogging) {
      this.info(`${method} ${url} ${status}`, {
        ...context,
        duration: `${duration}ms`,
      });
    }
  }

  /**
   * Log database query
   */
  query(table: string, operation: string, duration: number, context?: LogContext) {
    this.debug(`DB ${operation} ${table}`, {
      ...context,
      duration: `${duration}ms`,
    });
  }

  /**
   * Log workflow step
   */
  workflow(workflowId: string, step: string, status: 'start' | 'complete' | 'error', context?: LogContext) {
    this.info(`Workflow ${workflowId} - ${step} [${status}]`, context);
  }

  /**
   * Log token launch
   */
  tokenLaunch(platform: string, success: boolean, context?: LogContext) {
    if (success) {
      this.info(`Token launched on ${platform}`, context);
    } else {
      this.error(`Token launch failed on ${platform}`, undefined, context);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for external use
export type { LogContext };
