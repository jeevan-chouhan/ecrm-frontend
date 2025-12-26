/**
 * Centralized logging utility
 * In production, these can be replaced with proper error tracking services
 */

const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === "development";

/**
 * Log debug information (only in development)
 */
export const logDebug = (...args: any[]): void => {
  if (isDevelopment) {
    console.log("[DEBUG]", ...args);
  }
};

/**
 * Log error information
 * In production, this should be sent to error tracking service (e.g., Sentry)
 */
export const logError = (message: string, error?: unknown, context?: Record<string, any>): void => {
  if (isDevelopment) {
    console.error(`[ERROR] ${message}`, error, context);
  } else {
    // TODO: Send to error tracking service in production
    // Example: Sentry.captureException(error, { extra: context });
  }
};

/**
 * Log warning information
 */
export const logWarning = (message: string, ...args: any[]): void => {
  if (isDevelopment) {
    console.warn(`[WARNING] ${message}`, ...args);
  }
};

/**
 * Log info (only in development, for API payloads, etc.)
 */
export const logInfo = (message: string, data?: any): void => {
  if (isDevelopment) {
    console.log(`[INFO] ${message}`, data);
  }
};

