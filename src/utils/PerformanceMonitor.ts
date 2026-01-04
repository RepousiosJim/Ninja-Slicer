/**
 * Performance Monitor Utility
 * Tracks FPS, memory usage, and provides performance insights
 * Auto-adjusts quality settings based on device performance
 */

import { debugLog } from '@utils/DebugLogger';

export interface PerformanceStats {
  fps: number;
  averageFPS: number;
  frameTime: number;
  fpsHistory: number[];
  isLowPerformance: boolean;
}

export interface PerformanceConfig {
  targetFPS: number;
  minAcceptableFPS: number;
  lowPerformanceThreshold: number;
  fpsHistorySize: number;
  adjustmentCooldown: number;
}

export class PerformanceMonitor {
  private stats: PerformanceStats;
  private config: PerformanceConfig;
  private lastAdjustmentTime: number = 0;
  private currentQuality: 'low' | 'medium' | 'high' = 'medium';

  constructor(config?: Partial<PerformanceConfig>) {
    this.config = {
      targetFPS: 60,
      minAcceptableFPS: 30,
      lowPerformanceThreshold: 45,
      fpsHistorySize: 60,
      adjustmentCooldown: 5000,
      ...config,
    };

    this.stats = {
      fps: 60,
      averageFPS: 60,
      frameTime: 16.67,
      fpsHistory: [],
      isLowPerformance: false,
    };
  }

  /**
   * Update FPS measurement
   * @param delta - Time since last frame in milliseconds
   */
  public updateFPS(delta: number): void {
    const fps = 1000 / delta;
    this.stats.fps = fps;

    this.stats.fpsHistory.push(fps);
    if (this.stats.fpsHistory.length > this.config.fpsHistorySize) {
      this.stats.fpsHistory.shift();
    }

    this.stats.averageFPS = this.calculateAverageFPS();
    this.stats.frameTime = delta;

    this.stats.isLowPerformance = this.stats.averageFPS < this.config.lowPerformanceThreshold;
  }

  /**
   * Calculate average FPS from history
   */
  private calculateAverageFPS(): number {
    if (this.stats.fpsHistory.length === 0) {
      return this.stats.fps;
    }

    const sum = this.stats.fpsHistory.reduce((acc, fps) => acc + fps, 0);
    return sum / this.stats.fpsHistory.length;
  }

  /**
   * Get current FPS
   */
  public getFPS(): number {
    return this.stats.fps;
  }

  /**
   * Get average FPS
   */
  public getAverageFPS(): number {
    return this.stats.averageFPS;
  }

  /**
   * Get frame time in milliseconds
   */
  public getFrameTime(): number {
    return this.stats.frameTime;
  }

  /**
   * Get performance stats
   */
  public getPerformanceStats(): PerformanceStats {
    return { ...this.stats };
  }

  /**
   * Check if performance is low
   */
  public isLowPerformance(): boolean {
    return this.stats.isLowPerformance;
  }

  /**
   * Check if performance is acceptable
   */
  public isAcceptablePerformance(): boolean {
    return this.stats.averageFPS >= this.config.minAcceptableFPS;
  }

  /**
   * Get recommended quality setting
   */
  public getRecommendedQuality(): 'low' | 'medium' | 'high' {
    if (this.stats.averageFPS >= 55) {
      return 'high';
    } else if (this.stats.averageFPS >= 40) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Adjust quality if needed based on performance
   * @param currentQuality - Current quality setting
   * @param setQuality - Callback to change quality
   */
  public adjustQualityIfNeeded(
    currentQuality: 'low' | 'medium' | 'high',
    setQuality: (quality: 'low' | 'medium' | 'high') => void
  ): void {
    const now = Date.now();

    if (now - this.lastAdjustmentTime < this.config.adjustmentCooldown) {
      return;
    }

    const recommended = this.getRecommendedQuality();

    if (recommended !== currentQuality) {
      this.lastAdjustmentTime = now;
      setQuality(recommended);
      debugLog(`[PerformanceMonitor] Adjusting quality from ${currentQuality} to ${recommended}`);
    }
  }

  /**
   * Reset performance tracking
   */
  public reset(): void {
    this.stats.fpsHistory = [];
    this.stats.fps = this.config.targetFPS;
    this.stats.averageFPS = this.config.targetFPS;
    this.stats.frameTime = 1000 / this.config.targetFPS;
    this.stats.isLowPerformance = false;
  }

  /**
   * Get performance grade (A, B, C, D, F)
   */
  public getPerformanceGrade(): string {
    const fps = this.stats.averageFPS;

    if (fps >= 55) return 'A';
    if (fps >= 50) return 'B';
    if (fps >= 45) return 'C';
    if (fps >= 35) return 'D';
    return 'F';
  }

  /**
   * Get formatted performance report
   */
  public getReport(): string {
    return `
[Performance Monitor Report]
━━━━━━━━━━━━━━━━━━━━━━━━
FPS (Current):       ${this.stats.fps.toFixed(1)}
FPS (Average):      ${this.stats.averageFPS.toFixed(1)}
Frame Time:         ${this.stats.frameTime.toFixed(2)}ms
Performance Grade:  ${this.getPerformanceGrade()}
Status:             ${this.isAcceptablePerformance() ? '✓ Acceptable' : '✗ Low Performance'}
Quality:            ${this.currentQuality}
━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();
  }

  /**
   * Enable verbose logging
   */
  public enableVerboseLogging(): void {
    let lastReportTime = Date.now();

    setInterval(() => {
      const now = Date.now();
      if (now - lastReportTime >= 5000) {
        debugLog(this.getReport());
        lastReportTime = now;
      }
    }, 1000);
  }
}
