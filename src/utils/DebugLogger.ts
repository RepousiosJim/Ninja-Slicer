/**
 * DebugLogger
 *
 * Centralized debug logging utility that only logs in development mode.
 * Replaces console.log statements throughout codebase.
 */

import * as Sentry from "@sentry/browser";

const DEBUG = import.meta.env.DEV;

type LogLevel = 'log' | 'warn' | 'error';
interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  args: unknown[];
}

const logHistory: LogEntry[] = [];
const MAX_LOG_HISTORY = 100;
const LOG_FLOOD_WINDOW = 5000;
const LOG_FLOOD_THRESHOLD = 10;
const logFloodTracker: Map<string, { count: number; lastLog: number }> = new Map();

/**
 * Check if message is flooding (same message repeated rapidly)
 */
function isLogFlooding(message: string): boolean {
  const now = Date.now();
  const tracker = logFloodTracker.get(message);
  
  if (!tracker) {
    logFloodTracker.set(message, { count: 1, lastLog: now });
    return false;
  }
  
  if (now - tracker.lastLog < LOG_FLOOD_WINDOW) {
    tracker.count++;
    return tracker.count > LOG_FLOOD_THRESHOLD;
  }
  
  logFloodTracker.set(message, { count: 1, lastLog: now });
  return false;
}

/**
 * Add entry to log history
 */
function addToHistory(level: LogLevel, message: string, args: unknown[]): void {
  logHistory.push({
    timestamp: Date.now(),
    level,
    message,
    args
  });
  
  if (logHistory.length > MAX_LOG_HISTORY) {
    logHistory.shift();
  }
}

/**
 * Get recent log entries
 */
export function getLogHistory(count: number = 20): LogEntry[] {
  return logHistory.slice(-count);
}

/**
 * Clear log history
 */
export function clearLogHistory(): void {
  logHistory.length = 0;
  logFloodTracker.clear();
}

/**
 * Log debug message with timestamp (only in development mode)
 * @param message - The message to log
 * @param args - Additional arguments to log
 */
export function debugLog(message: string, ...args: unknown[]): void {
  if (!DEBUG) return;
  
  if (isLogFlooding(message)) return;
  
  const timestamp = new Date().toISOString().split('T')[1]?.slice(0, -1) || '00.000';
  console.log(`[${timestamp}] ${message}`, ...args);
  addToHistory('log', message, args);
}

/**
 * Log debug warning (only in development mode)
 * @param message - The warning message to log
 * @param args - Additional arguments to log
 */
export function debugWarn(message: string, ...args: unknown[]): void {
  if (!DEBUG) return;
  
  const timestamp = new Date().toISOString().split('T')[1]?.slice(0, -1) || '00.000';
  console.warn(`[${timestamp}] ${message}`, ...args);
  addToHistory('warn', message, args);
}

/**
 * Log debug error (logs to console in dev, always logs to Sentry if available)
 * @param message - The error message to log
 * @param args - Additional arguments to log
 */
export function debugError(message: string, ...args: unknown[]): void {
  const timestamp = new Date().toISOString().split('T')[1]?.slice(0, -1) || '00.000';
  
  if (DEBUG) {
    console.error(`[${timestamp}] ${message}`, ...args);
  }
  
  addToHistory('error', message, args);

  // Always send to Sentry if initialized
  const error = args.find(arg => arg instanceof Error) as Error | undefined;
  Sentry.captureException(error || new Error(message), {
    extra: { message, additionalArgs: args }
  });
}

/**
 * Check if debug mode is enabled
 * @returns true if debug mode is enabled
 */
export function isDebugEnabled(): boolean {
  return DEBUG;
}

/**
 * Log performance warning
 * @param message - The performance warning message
 * @param metrics - Performance metrics
 */
export function debugPerformance(message: string, metrics: Record<string, number>): void {
  if (!DEBUG) return;
  
  const timestamp = new Date().toISOString().split('T')[1]?.slice(0, -1) || '00.000';
  console.warn(`[${timestamp}] [PERFORMANCE] ${message}`, metrics);
  addToHistory('warn', `[PERFORMANCE] ${message}`, [metrics]);
}

/**
 * Export logs for debugging
 */
export function exportLogs(): string {
  return JSON.stringify(logHistory, null, 2);
}
