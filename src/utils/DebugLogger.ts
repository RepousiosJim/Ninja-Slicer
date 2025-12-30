/**
 * DebugLogger
 * 
 * Centralized debug logging utility that only logs in development mode.
 * Replaces console.log statements throughout the codebase.
 */

const DEBUG = import.meta.env.DEV;

/**
 * Log debug message with timestamp (only in development mode)
 * @param message - The message to log
 * @param args - Additional arguments to log
 */
export function debugLog(message: string, ...args: unknown[]): void {
  if (DEBUG) {
    const timestamp = new Date().toISOString().split('T')[1]?.slice(0, -1) || '00.000';
    console.log(`[${timestamp}] ${message}`, ...args);
  }
}

/**
 * Log debug warning (only in development mode)
 * @param message - The warning message to log
 * @param args - Additional arguments to log
 */
export function debugWarn(message: string, ...args: unknown[]): void {
  if (DEBUG) {
    const timestamp = new Date().toISOString().split('T')[1]?.slice(0, -1) || '00.000';
    console.warn(`[${timestamp}] ${message}`, ...args);
  }
}

/**
 * Log debug error (only in development mode)
 * @param message - The error message to log
 * @param args - Additional arguments to log
 */
export function debugError(message: string, ...args: unknown[]): void {
  if (DEBUG) {
    const timestamp = new Date().toISOString().split('T')[1]?.slice(0, -1) || '00.000';
    console.error(`[${timestamp}] ${message}`, ...args);
  }
}

/**
 * Check if debug mode is enabled
 * @returns true if debug mode is enabled
 */
export function isDebugEnabled(): boolean {
  return DEBUG;
}
