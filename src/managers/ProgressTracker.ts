/**
 * ProgressTracker
 *
 * Fine-grained progress tracking for asset loading operations.
 * Provides real-time progress updates and error tracking.
 */

import { debugLog, debugWarn, debugError } from '@utils/DebugLogger';

/**
 * Progress data structure
 */
export interface LoadProgress {
  total: number;
  loaded: number;
  failed: number;
  percentage: number;
  currentAsset?: string;
  category?: string;
  errors: Array<{ key: string; error: string }>;
  startTime: number;
  elapsed: number;
  estimatedRemaining: number;
}

/**
 * Progress callback type
 */
export type ProgressCallback = (progress: LoadProgress) => void;

/**
 * ProgressTracker class
 * Tracks loading progress with fine-grained detail
 */
export class ProgressTracker {
  private totalAssets: number = 0;
  private loadedAssets: number = 0;
  private failedAssets: number = 0;
  private errors: Array<{ key: string; error: string }> = [];
  private currentAsset: string = '';
  private currentCategory: string = '';
  
  private startTime: number = 0;
  private lastUpdate: number = 0;
  private loadSpeed: number = 0; // assets per second
  
  private listeners: ProgressCallback[] = [];
  
  constructor(totalAssets: number = 0) {
    this.totalAssets = totalAssets;
    this.startTime = Date.now();
    this.lastUpdate = this.startTime;
  }
  
  /**
   * Set total number of assets
   */
  setTotal(total: number): void {
    this.totalAssets = total;
    this.notify();
  }
  
  /**
   * Increment loaded counter
   */
  incrementLoaded(key: string): void {
    this.loadedAssets++;
    this.updateLoadSpeed();
    this.notify();
  }
  
  /**
   * Increment failed counter
   */
  incrementFailed(key: string, error: string): void {
    this.failedAssets++;
    this.errors.push({ key, error });
    debugWarn(`[ProgressTracker] Failed to load: ${key} - ${error}`);
    this.updateLoadSpeed();
    this.notify();
  }
  
  /**
   * Set current asset being loaded
   */
  setCurrentAsset(key: string, category?: string): void {
    this.currentAsset = key;
    this.currentCategory = category || '';
    this.notify();
  }
  
  /**
   * Calculate load speed (assets per second)
   */
  private updateLoadSpeed(): void {
    const now = Date.now();
    const elapsed = (now - this.lastUpdate) / 1000;
    
    if (elapsed > 0.5) { // Update every 0.5 seconds
      const assetsCompleted = this.loadedAssets + this.failedAssets;
      const totalTime = (now - this.startTime) / 1000;
      this.loadSpeed = assetsCompleted / totalTime;
      this.lastUpdate = now;
    }
  }
  
  /**
   * Calculate estimated time remaining
   */
  private calculateEstimatedRemaining(): number {
    const remainingAssets = this.totalAssets - this.loadedAssets - this.failedAssets;
    if (remainingAssets <= 0 || this.loadSpeed <= 0) {
      return 0;
    }
    return remainingAssets / this.loadSpeed;
  }
  
  /**
   * Get current progress
   */
  getProgress(): LoadProgress {
    const now = Date.now();
    const elapsed = (now - this.startTime) / 1000;
    
    return {
      total: this.totalAssets,
      loaded: this.loadedAssets,
      failed: this.failedAssets,
      percentage: this.totalAssets > 0 
        ? (this.loadedAssets / this.totalAssets) * 100 
        : 0,
      currentAsset: this.currentAsset,
      category: this.currentCategory,
      errors: [...this.errors],
      startTime: this.startTime,
      elapsed,
      estimatedRemaining: this.calculateEstimatedRemaining(),
    };
  }
  
  /**
   * Subscribe to progress updates
   */
  onProgress(callback: ProgressCallback): void {
    this.listeners.push(callback);
  }
  
  /**
   * Unsubscribe from progress updates
   */
  offProgress(callback: ProgressCallback): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }
  
  /**
   * Notify all listeners of progress update
   */
  private notify(): void {
    const progress = this.getProgress();
    this.listeners.forEach(callback => {
      try {
        callback(progress);
      } catch (error) {
        debugError('[ProgressTracker] Error in progress callback:', error);
      }
    });
  }
  
  /**
   * Reset tracker for new loading operation
   */
  reset(): void {
    this.loadedAssets = 0;
    this.failedAssets = 0;
    this.errors = [];
    this.currentAsset = '';
    this.currentCategory = '';
    this.startTime = Date.now();
    this.lastUpdate = this.startTime;
    this.loadSpeed = 0;
    this.notify();
  }
  
  /**
   * Get total assets count
   */
  getTotal(): number {
    return this.totalAssets;
  }
  
  /**
   * Get loaded count
   */
  getLoaded(): number {
    return this.loadedAssets;
  }
  
  /**
   * Get failed count
   */
  getFailed(): number {
    return this.failedAssets;
  }
  
  /**
   * Get percentage
   */
  getPercentage(): number {
    return this.totalAssets > 0 
      ? (this.loadedAssets / this.totalAssets) * 100 
      : 0;
  }
  
  /**
   * Check if loading is complete
   */
  isComplete(): boolean {
    return (this.loadedAssets + this.failedAssets) >= this.totalAssets && this.totalAssets > 0;
  }
  
  /**
   * Check if loading has any errors
   */
  hasErrors(): boolean {
    return this.failedAssets > 0;
  }
}
