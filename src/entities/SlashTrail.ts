/**
 * SlashTrail
 *
 * Tracks mouse/touch movement and renders a glowing trail effect.
 * The trail only appears when cursor moves fast enough (above velocity threshold).
 * Supports charge/power mechanics with visual indicators.
 *
 * Performance Optimizations:
 * - Object pooling for Vector2 points to reduce GC pressure
 * - Dirty flag tracking to skip unnecessary redraws
 * - Batched draw calls to minimize GPU state changes
 * - Cached calculations for frequently used values
 */

import Phaser from 'phaser';
import {
  SLASH_VELOCITY_THRESHOLD,
  SLASH_TRAIL_MAX_LENGTH,
  SLASH_TRAIL_FADE_RATE,
  SLASH_TRAIL_WIDTH,
  SLASH_TRAIL_GLOW_WIDTH,
  SLASH_POWER,
  SLASH_POWER_COLORS,
  SLASH_POWER_WIDTH_MULTIPLIERS
} from '@config/constants';
import { SlashPowerLevel, SlashPowerState } from '@config/types';
import { EventBus } from '@utils/EventBus';

/**
 * Object pool for Vector2 instances to reduce garbage collection
 */
class Vector2Pool {
  private pool: Phaser.Math.Vector2[] = [];
  private activeCount: number = 0;

  /**
   * Get a Vector2 from the pool or create a new one
   */
  acquire(x: number = 0, y: number = 0): Phaser.Math.Vector2 {
    let vec: Phaser.Math.Vector2;
    if (this.pool.length > 0) {
      vec = this.pool.pop()!;
      vec.set(x, y);
    } else {
      vec = new Phaser.Math.Vector2(x, y);
    }
    this.activeCount++;
    return vec;
  }

  /**
   * Return a Vector2 to the pool for reuse
   */
  release(vec: Phaser.Math.Vector2): void {
    this.pool.push(vec);
    this.activeCount--;
  }

  /**
   * Release multiple vectors at once
   */
  releaseAll(vectors: Phaser.Math.Vector2[]): void {
    for (let i = 0; i < vectors.length; i++) {
      this.pool.push(vectors[i]);
    }
    this.activeCount -= vectors.length;
  }
}

export class SlashTrail {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private glowGraphics: Phaser.GameObjects.Graphics;
  private cursorGraphics: Phaser.GameObjects.Graphics; // Visual cursor indicator
  private chargeGraphics: Phaser.GameObjects.Graphics; // Charge indicator

  private points: Phaser.Math.Vector2[] = [];
  private previousPosition: Phaser.Math.Vector2;
  private currentPosition: Phaser.Math.Vector2;
  private lastUpdateTime: number = 0;
  private active: boolean = false;

  // Object pool for Vector2 reuse
  private static vectorPool: Vector2Pool = new Vector2Pool();

  // Dirty flags for optimization - track what needs redrawing
  private trailDirty: boolean = true;
  private cursorDirty: boolean = true;
  private chargeDirty: boolean = true;
  private lastCursorX: number = 0;
  private lastCursorY: number = 0;
  private lastPointCount: number = 0;

  // Trail style properties - BRIGHT and VISIBLE
  private baseTrailColor: number = 0xffffff; // Base white color (no power)
  private baseTrailGlow: number = 0xff00ff; // Base magenta glow (no power)
  private trailColor: number = 0xffffff; // Current trail color (adjusted by power)
  private trailGlow: number = 0xff00ff; // Current glow color (adjusted by power)
  private baseTrailWidth: number = SLASH_TRAIL_WIDTH * 2; // Base width (make thicker)
  private trailWidth: number = SLASH_TRAIL_WIDTH * 2; // Current width (adjusted by power)
  private trailGlowWidth: number = SLASH_TRAIL_GLOW_WIDTH * 2; // Make thicker

  // Power/Charge state
  private powerState: SlashPowerState = {
    level: SlashPowerLevel.NONE,
    chargeStartTime: 0,
    chargeProgress: 0,
    isCharging: false,
  };
  private chargeAnimationTime: number = 0;

  // Cached cursor constants
  private static readonly CURSOR_SIZE = 10;
  private static readonly CURSOR_OUTER_LINE_WIDTH = 3;
  private static readonly CURSOR_INNER_RADIUS = 4;
  private static readonly CURSOR_CROSSHAIR_LINE_WIDTH = 2;
  private static readonly CURSOR_CROSSHAIR_EXTEND = 5;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Create graphics for trail, glow, cursor, and charge indicator
    this.glowGraphics = scene.add.graphics();
    this.graphics = scene.add.graphics();
    this.cursorGraphics = scene.add.graphics();
    this.chargeGraphics = scene.add.graphics();

    // Set depth to be above monsters but below UI
    this.glowGraphics.setDepth(100);
    this.graphics.setDepth(101);
    this.cursorGraphics.setDepth(102); // Cursor on top
    this.chargeGraphics.setDepth(103); // Charge indicator on very top

    // Initialize positions
    this.previousPosition = new Phaser.Math.Vector2(0, 0);
    this.currentPosition = new Phaser.Math.Vector2(0, 0);
  }

  /**
   * Update slash trail with new position
   * @param x - Current x position
   * @param y - Current y position
   * @param deltaTime - Time since last update in seconds
   */
  update(x: number, y: number, deltaTime: number): void {
    this.currentPosition.set(x, y);

    // Track cursor movement for dirty detection
    const cursorMoved = x !== this.lastCursorX || y !== this.lastCursorY;
    if (cursorMoved) {
      this.cursorDirty = true;
      this.lastCursorX = x;
      this.lastCursorY = y;
    }

    // Calculate velocity
    const velocity = this.calculateVelocity(deltaTime);

    // Check if velocity exceeds threshold
    if (velocity > SLASH_VELOCITY_THRESHOLD) {
      this.active = true;

      // Add point to trail using object pool
      const newPoint = SlashTrail.vectorPool.acquire(x, y);
      this.points.push(newPoint);
      this.trailDirty = true;

      // Limit trail length and release old point back to pool
      if (this.points.length > SLASH_TRAIL_MAX_LENGTH) {
        const oldPoint = this.points.shift();
        if (oldPoint) {
          SlashTrail.vectorPool.release(oldPoint);
        }
      }
    } else {
      // Fade out trail when velocity drops below threshold
      this.active = false;
      this.fadeTrail(deltaTime);
    }

    // Update previous position
    this.previousPosition.copy(this.currentPosition);
    this.lastUpdateTime = this.scene.time.now;

    // Track point count changes for dirty detection
    if (this.points.length !== this.lastPointCount) {
      this.trailDirty = true;
      this.lastPointCount = this.points.length;
    }

    // Render trail (optimized with dirty checks)
    this.render();
  }

  /**
   * Calculate velocity between current and previous position
   * @param deltaTime - Time since last update in seconds
   * @returns Velocity in pixels per second
   */
  private calculateVelocity(deltaTime: number): number {
    if (deltaTime <= 0) return 0;
    
    const dx = this.currentPosition.x - this.previousPosition.x;
    const dy = this.currentPosition.y - this.previousPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance / deltaTime;
  }

  /**
   * Fade out trail points
   * @param deltaTime - Time since last update in seconds
   */
  private fadeTrail(deltaTime: number): void {
    // Remove points from beginning of trail and return to pool
    if (this.points.length > 0) {
      const oldPoint = this.points.shift();
      if (oldPoint) {
        SlashTrail.vectorPool.release(oldPoint);
        this.trailDirty = true;
      }
    }
  }

  /**
   * Render slash trail with optimized batched draw calls
   * Uses dirty flags to skip unnecessary redraws
   */
  private render(): void {
    // Only redraw cursor if it moved
    if (this.cursorDirty) {
      this.cursorGraphics.clear();
      this.drawCursorBatched();
      this.cursorDirty = false;
    }

    // Only redraw trail if points changed
    if (this.trailDirty) {
      this.graphics.clear();
      this.glowGraphics.clear();

      // Early exit if not enough points
      if (this.points.length >= 2) {
        this.renderTrailBatched();
      }
      this.trailDirty = false;
    }
  }

  /**
   * Render trail with batched draw calls
   * Combines glow and main trail rendering efficiently
   */
  private renderTrailBatched(): void {
    const points = this.points;
    const len = points.length;
    const firstPoint = points[0];

    if (!firstPoint) return;

    // Batch 1: Draw glow trail in a single path
    // Using a single beginPath/strokePath for the entire glow
    this.glowGraphics.lineStyle(this.trailGlowWidth, this.trailGlow, 0.6);
    this.glowGraphics.beginPath();
    this.glowGraphics.moveTo(firstPoint.x, firstPoint.y);

    // Use standard loop for better performance than forEach
    for (let i = 1; i < len; i++) {
      const point = points[i];
      this.glowGraphics.lineTo(point.x, point.y);
    }
    this.glowGraphics.strokePath();

    // Batch 2: Draw main trail in a single path
    this.graphics.lineStyle(this.trailWidth, this.trailColor, 1.0);
    this.graphics.beginPath();
    this.graphics.moveTo(firstPoint.x, firstPoint.y);

    for (let i = 1; i < len; i++) {
      const point = points[i];
      this.graphics.lineTo(point.x, point.y);
    }
    this.graphics.strokePath();
  }

  /**
   * Draw cursor indicator with batched draw calls
   * Combines all cursor drawing into minimal draw calls
   */
  private drawCursorBatched(): void {
    const x = this.currentPosition.x;
    const y = this.currentPosition.y;

    // Use cached constants
    const size = SlashTrail.CURSOR_SIZE;
    const extend = SlashTrail.CURSOR_CROSSHAIR_EXTEND;

    // Batch 1: All stroke operations with same style (outer circle + crosshairs)
    // Group same-styled strokes together to minimize state changes
    this.cursorGraphics.lineStyle(SlashTrail.CURSOR_OUTER_LINE_WIDTH, 0xffffff, 0.8);
    this.cursorGraphics.strokeCircle(x, y, size);

    // Batch 2: Crosshair lines in a single path
    this.cursorGraphics.lineStyle(SlashTrail.CURSOR_CROSSHAIR_LINE_WIDTH, 0xffffff, 0.6);
    this.cursorGraphics.beginPath();
    // Left crosshair
    this.cursorGraphics.moveTo(x - size - extend, y);
    this.cursorGraphics.lineTo(x - size, y);
    // Right crosshair
    this.cursorGraphics.moveTo(x + size, y);
    this.cursorGraphics.lineTo(x + size + extend, y);
    // Top crosshair
    this.cursorGraphics.moveTo(x, y - size - extend);
    this.cursorGraphics.lineTo(x, y - size);
    // Bottom crosshair
    this.cursorGraphics.moveTo(x, y + size);
    this.cursorGraphics.lineTo(x, y + size + extend);
    this.cursorGraphics.strokePath();

    // Batch 3: Fill operations (inner dot)
    this.cursorGraphics.fillStyle(0xff00ff, 1.0);
    this.cursorGraphics.fillCircle(x, y, SlashTrail.CURSOR_INNER_RADIUS);
  }

  /**
   * Get all active slash points
   * @returns Array of slash points
   */
  getSlashPoints(): Phaser.Math.Vector2[] {
    return [...this.points];
  }

  /**
   * Check if slash is currently active
   * @returns True if slash is active
   */
  isActive(): boolean {
    return this.active && this.points.length >= 2;
  }

  /**
   * Clear all slash points
   * Returns all pooled Vector2 objects for reuse
   */
  clear(): void {
    // Release all points back to the pool before clearing
    if (this.points.length > 0) {
      SlashTrail.vectorPool.releaseAll(this.points);
    }
    this.points = [];
    this.active = false;
    this.graphics.clear();
    this.glowGraphics.clear();
    this.cursorGraphics.clear();
    this.chargeGraphics.clear();

    // Reset dirty flags
    this.trailDirty = true;
    this.cursorDirty = true;
    this.chargeDirty = true;
    this.lastPointCount = 0;
  }

  /**
   * Set trail style (color, glow, width)
   * This sets the base style that will be modified by power levels
   */
  setTrailStyle(style: { color: number; glow: number; width: number }): void {
    // Update base colors (used when power level is NONE)
    this.baseTrailColor = style.color;
    this.baseTrailGlow = style.glow;

    // Apply current power level visuals to the new base style
    if (this.powerState.level === SlashPowerLevel.NONE) {
      this.trailColor = style.color;
      this.trailGlow = style.glow;
    } else {
      // Re-apply power visuals with new base as fallback
      this.updatePowerVisuals(this.powerState.level);
    }

    // Update widths
    this.baseTrailWidth = style.width;
    const widthMultiplier = SLASH_POWER_WIDTH_MULTIPLIERS[this.powerState.level as keyof typeof SLASH_POWER_WIDTH_MULTIPLIERS];
    this.trailWidth = style.width * widthMultiplier;
    this.trailGlowWidth = this.trailWidth * 2;

    // Mark trail as dirty to redraw with new style
    this.trailDirty = true;
  }

  /**
   * Get current trail style
   */
  getTrailStyle(): { color: number; glow: number; width: number } {
    return {
      color: this.trailColor,
      glow: this.trailGlow,
      width: this.trailWidth,
    };
  }

  // ===========================================================================
  // CHARGE/POWER METHODS
  // ===========================================================================

  /**
   * Start charging the slash power
   * Call this when the pointer is held down (before slashing)
   */
  startCharging(): void {
    if (this.powerState.isCharging) return;

    this.powerState.isCharging = true;
    this.powerState.chargeStartTime = this.scene.time.now;
    this.powerState.chargeProgress = 0;
    this.powerState.level = SlashPowerLevel.NONE;
    this.chargeAnimationTime = 0;
  }

  /**
   * Update charging state based on elapsed time
   * @param deltaTime - Time since last update in seconds
   */
  updateCharging(deltaTime: number): void {
    if (!this.powerState.isCharging) return;

    // Update animation time for visual effects
    this.chargeAnimationTime += deltaTime;

    const elapsedTime = (this.scene.time.now - this.powerState.chargeStartTime) / 1000;
    const chargeTimePerLevel = SLASH_POWER.chargeTimePerLevel;
    const maxLevel = SLASH_POWER.maxPowerLevel;

    // Calculate power level based on charge time
    const newLevel = Math.min(
      Math.floor(elapsedTime / chargeTimePerLevel),
      maxLevel
    ) as SlashPowerLevel;

    // Calculate progress toward next level (0-1)
    const levelProgress = (elapsedTime % chargeTimePerLevel) / chargeTimePerLevel;
    this.powerState.chargeProgress = newLevel >= maxLevel ? 1 : levelProgress;

    // Emit event if power level changed
    if (newLevel !== this.powerState.level) {
      const previousLevel = this.powerState.level;
      this.powerState.level = newLevel;

      // Update trail width based on power level
      const widthMultiplier = SLASH_POWER_WIDTH_MULTIPLIERS[newLevel as keyof typeof SLASH_POWER_WIDTH_MULTIPLIERS];
      this.trailWidth = this.baseTrailWidth * widthMultiplier;
      this.trailGlowWidth = this.trailWidth * 2;

      // Update visual effects for new power level
      this.updatePowerVisuals(newLevel);

      // Emit power changed event
      EventBus.emit('slash-power-changed', {
        level: newLevel,
        previousLevel,
        chargeProgress: this.powerState.chargeProgress,
        isFullyCharged: newLevel >= maxLevel,
      });
    }

    // Draw charge indicator
    this.drawChargeIndicator();
  }

  /**
   * Stop charging and release the accumulated power
   * @returns The power level that was accumulated
   */
  stopCharging(): SlashPowerLevel {
    const powerLevel = this.powerState.level;

    // Reset charging state
    this.powerState.isCharging = false;
    this.powerState.chargeProgress = 0;
    this.chargeAnimationTime = 0;
    this.chargeGraphics.clear();

    // Emit power charged event if any power was accumulated
    if (powerLevel > SlashPowerLevel.NONE) {
      EventBus.emit('slash-power-charged', {
        level: powerLevel,
        previousLevel: SlashPowerLevel.NONE,
        chargeProgress: 1,
        isFullyCharged: powerLevel >= SLASH_POWER.maxPowerLevel,
      });
    }

    return powerLevel;
  }

  /**
   * Reset power level after slash is completed
   */
  resetPower(): void {
    const previousLevel = this.powerState.level;
    this.powerState.level = SlashPowerLevel.NONE;
    this.powerState.chargeProgress = 0;
    this.powerState.isCharging = false;
    this.chargeAnimationTime = 0;
    this.chargeGraphics.clear();

    // Reset trail width to base
    this.trailWidth = this.baseTrailWidth;
    this.trailGlowWidth = this.trailWidth * 2;

    // Reset trail colors to base
    this.trailColor = this.baseTrailColor;
    this.trailGlow = this.baseTrailGlow;

    // Emit reset event
    if (previousLevel !== SlashPowerLevel.NONE) {
      EventBus.emit('slash-power-changed', {
        level: SlashPowerLevel.NONE,
        previousLevel,
        chargeProgress: 0,
        isFullyCharged: false,
      });
    }
  }

  /**
   * Get current power level
   */
  getPowerLevel(): SlashPowerLevel {
    return this.powerState.level;
  }

  /**
   * Get current power state
   */
  getPowerState(): SlashPowerState {
    return { ...this.powerState };
  }

  /**
   * Check if currently charging
   */
  isCharging(): boolean {
    return this.powerState.isCharging;
  }

  /**
   * Update trail visual effects based on power level
   * @param powerLevel - The current power level
   */
  private updatePowerVisuals(powerLevel: SlashPowerLevel): void {
    // Get color for current power level
    const powerColor = SLASH_POWER_COLORS[powerLevel as keyof typeof SLASH_POWER_COLORS];

    if (powerLevel === SlashPowerLevel.NONE) {
      // Reset to base colors when no power
      this.trailColor = this.baseTrailColor;
      this.trailGlow = this.baseTrailGlow;
    } else {
      // Set trail color based on power level
      this.trailColor = powerColor;
      // Create a slightly brighter/saturated glow variant
      this.trailGlow = this.createGlowColor(powerColor);
    }

    // Mark trail as dirty to redraw with new colors
    this.trailDirty = true;
  }

  /**
   * Create a glow color variant from a base color
   * Shifts toward white for a glowing effect
   * @param baseColor - The base color to create glow from
   * @returns The glow color
   */
  private createGlowColor(baseColor: number): number {
    // Extract RGB components
    const r = (baseColor >> 16) & 0xff;
    const g = (baseColor >> 8) & 0xff;
    const b = baseColor & 0xff;

    // Blend with white for glow effect (70% original, 30% white)
    const glowR = Math.min(255, Math.floor(r * 0.7 + 255 * 0.3));
    const glowG = Math.min(255, Math.floor(g * 0.7 + 255 * 0.3));
    const glowB = Math.min(255, Math.floor(b * 0.7 + 255 * 0.3));

    return (glowR << 16) | (glowG << 8) | glowB;
  }

  /**
   * Draw the charge indicator around the cursor
   * Optimized with batched draw calls grouped by style
   */
  private drawChargeIndicator(): void {
    this.chargeGraphics.clear();

    if (!this.powerState.isCharging) return;

    const x = this.currentPosition.x;
    const y = this.currentPosition.y;
    const powerLevel = this.powerState.level;
    const progress = this.powerState.chargeProgress;
    const maxLevel = SLASH_POWER.maxPowerLevel;

    // Pre-calculate colors once
    const currentColor = SLASH_POWER_COLORS[powerLevel as keyof typeof SLASH_POWER_COLORS];
    const nextColor = SLASH_POWER_COLORS[
      Math.min(powerLevel + 1, maxLevel) as keyof typeof SLASH_POWER_COLORS
    ];

    // Pre-calculate radius values
    const baseRadius = 20 + powerLevel * 8;
    const pulseAmount = Math.sin(this.chargeAnimationTime * 8) * 3;
    const radius = baseRadius + pulseAmount;
    const indicatorRadius = 4;
    const indicatorDistance = radius + 14;

    // Pre-calculate alpha values
    const glowAlpha = 0.3 + Math.sin(this.chargeAnimationTime * 6) * 0.15;

    // Pre-calculate indicator positions (avoid recalculating in loop)
    const angleStep = Math.PI * 2 / maxLevel;
    const startAngle = -Math.PI / 2;

    // ========== BATCH 1: Stroke operations with currentColor ==========
    // Group all currentColor strokes together to minimize state changes
    this.chargeGraphics.lineStyle(8, currentColor, glowAlpha);
    this.chargeGraphics.strokeCircle(x, y, radius + 6);

    this.chargeGraphics.lineStyle(4, currentColor, 0.8);
    this.chargeGraphics.strokeCircle(x, y, radius);

    // ========== BATCH 2: Progress arc (if not at max) ==========
    if (powerLevel < maxLevel) {
      const endAngle = startAngle + (progress * Math.PI * 2);
      this.chargeGraphics.lineStyle(3, nextColor, 0.9);
      this.chargeGraphics.beginPath();
      this.chargeGraphics.arc(x, y, radius - 4, startAngle, endAngle, false);
      this.chargeGraphics.strokePath();
    }

    // ========== BATCH 3: Empty indicator circles (same style) ==========
    // Draw all empty indicators first in one batch
    this.chargeGraphics.lineStyle(2, 0xffffff, 0.4);
    for (let i = powerLevel + 1; i <= maxLevel; i++) {
      const angle = startAngle + (i * angleStep);
      const ix = x + Math.cos(angle) * indicatorDistance;
      const iy = y + Math.sin(angle) * indicatorDistance;
      this.chargeGraphics.strokeCircle(ix, iy, indicatorRadius);
    }

    // ========== BATCH 4: Filled indicators (grouped by color) ==========
    // Draw filled indicators - batch by power level color
    for (let i = 0; i <= powerLevel; i++) {
      const indicatorColor = SLASH_POWER_COLORS[i as keyof typeof SLASH_POWER_COLORS];
      const angle = startAngle + (i * angleStep);
      const ix = x + Math.cos(angle) * indicatorDistance;
      const iy = y + Math.sin(angle) * indicatorDistance;
      this.chargeGraphics.fillStyle(indicatorColor, 1);
      this.chargeGraphics.fillCircle(ix, iy, indicatorRadius);
    }

    // ========== BATCH 5: Inner glow (power level indicator) ==========
    if (powerLevel > SlashPowerLevel.NONE) {
      const innerGlowAlpha = 0.4 + Math.sin(this.chargeAnimationTime * 10) * 0.2;
      this.chargeGraphics.fillStyle(currentColor, innerGlowAlpha);
      this.chargeGraphics.fillCircle(x, y, 8 + powerLevel * 2);
    }
  }

  /**
   * Destroy slash trail and clean up resources
   * Returns all pooled Vector2 objects before cleanup
   */
  destroy(): void {
    // Release all points back to the pool before destroying
    if (this.points.length > 0) {
      SlashTrail.vectorPool.releaseAll(this.points);
    }

    this.graphics.destroy();
    this.glowGraphics.destroy();
    this.cursorGraphics.destroy();
    this.chargeGraphics.destroy();
    this.points = [];
  }
}
