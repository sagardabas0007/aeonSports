import * as Sentry from '@sentry/nextjs';

/**
 * Initialize Sentry for error monitoring
 */
export function initSentry() {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      
      // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
      // We recommend adjusting this value in production
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      
      // Capture 100% of errors
      sampleRate: 1.0,
      
      // Configure the scope
      beforeSend(event, hint) {
        // Filter out non-error events in development
        if (process.env.NODE_ENV === 'development' && event.level !== 'error') {
          return null;
        }
        return event;
      },
      
      // Ignore specific errors
      ignoreErrors: [
        // Browser extensions
        'top.GLOBALS',
        'chrome-extension://',
        'moz-extension://',
        // Random plugins/extensions
        'fb_xd_fragment',
        // Network errors
        'NetworkError',
        'Network request failed',
      ],
    });
  }
}

/**
 * Capture exception with context
 */
export function captureException(error: Error | unknown, context?: Record<string, any>) {
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    console.error('[Sentry] Exception:', error, context);
  }
}

/**
 * Capture message with severity
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>) {
  if (process.env.SENTRY_DSN) {
    Sentry.captureMessage(message, {
      level,
      extra: context,
    });
  } else {
    console.log(`[Sentry] ${level.toUpperCase()}:`, message, context);
  }
}

/**
 * Set user context
 */
export function setUser(user: { id: string; email?: string; username?: string }) {
  if (process.env.SENTRY_DSN) {
    Sentry.setUser(user);
  }
}

/**
 * Clear user context
 */
export function clearUser() {
  if (process.env.SENTRY_DSN) {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
  if (process.env.SENTRY_DSN) {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
    });
  }
}

/**
 * Wrap async function with error handling
 */
export function withSentry<T>(fn: () => Promise<T>, context?: Record<string, any>): Promise<T> {
  return fn().catch((error) => {
    captureException(error, context);
    throw error;
  });
}
