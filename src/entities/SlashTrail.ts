/**
 * SlashTrail
 *
 * Tracks mouse/touch movement and renders a glowing trail effect.
 * The trail only appears when cursor moves fast enough (above velocity threshold).
 * Supports charge/power mechanics with visual indicators.
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
    
    // Calculate velocity
    const velocity = this.calculateVelocity(deltaTime);
    
    // Check if velocity exceeds threshold
    if (velocity > SLASH_VELOCITY_THRESHOLD) {
      this.active = true;
      
      // Add point to trail
      this.points.push(new Phaser.Math.Vector2(x, y));
      
      // Limit trail length
      if (this.points.length > SLASH_TRAIL_MAX_LENGTH) {
        this.points.shift();
      }
    } else {
      // Fade out trail when velocity drops below threshold
      this.active = false;
      this.fadeTrail(deltaTime);
    }
    
    // Update previous position
    this.previousPosition.copy(this.currentPosition);
    this.lastUpdateTime = this.scene.time.now;
    
    // Render trail
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
    // Remove points from beginning of trail
    if (this.points.length > 0) {
      this.points.shift();
    }
  }

  /**
   * Render slash trail
   */
  private render(): void {
    // Clear previous frame
    this.graphics.clear();
    this.glowGraphics.clear();
    this.cursorGraphics.clear();

    // Always draw cursor indicator
    this.drawCursor();

    if (this.points.length < 2) return;
    
    const firstPoint = this.points[0];
    if (!firstPoint) return;
    
    // Draw glow (wider, more visible)
    this.glowGraphics.lineStyle(this.trailGlowWidth, this.trailGlow, 0.6); // More opaque
    this.glowGraphics.beginPath();
    this.glowGraphics.moveTo(firstPoint.x, firstPoint.y);

    for (let i = 1; i < this.points.length; i++) {
      const point = this.points[i];
      if (point) {
        this.glowGraphics.lineTo(point.x, point.y);
      }
    }

    this.glowGraphics.strokePath();

    // Draw main trail (bright and opaque)
    this.graphics.lineStyle(this.trailWidth, this.trailColor, 1.0); // Fully opaque
    this.graphics.beginPath();
    this.graphics.moveTo(firstPoint.x, firstPoint.y);

    for (let i = 1; i < this.points.length; i++) {
      const point = this.points[i];
      if (point) {
        this.graphics.lineTo(point.x, point.y);
      }
    }

    this.graphics.strokePath();
  }

  /**
   * Draw cursor indicator
   */
  private drawCursor(): void {
    // Draw a bright crosshair cursor
    const x = this.currentPosition.x;
    const y = this.currentPosition.y;
    const size = 10;

    // Outer circle
    this.cursorGraphics.lineStyle(3, 0xffffff, 0.8);
    this.cursorGraphics.strokeCircle(x, y, size);

    // Inner dot
    this.cursorGraphics.fillStyle(0xff00ff, 1.0);
    this.cursorGraphics.fillCircle(x, y, 4);

    // Crosshair lines
    this.cursorGraphics.lineStyle(2, 0xffffff, 0.6);
    this.cursorGraphics.beginPath();
    this.cursorGraphics.moveTo(x - size - 5, y);
    this.cursorGraphics.lineTo(x - size, y);
    this.cursorGraphics.moveTo(x + size, y);
    this.cursorGraphics.lineTo(x + size + 5, y);
    this.cursorGraphics.moveTo(x, y - size - 5);
    this.cursorGraphics.lineTo(x, y - size);
    this.cursorGraphics.moveTo(x, y + size);
    this.cursorGraphics.lineTo(x, y + size + 5);
    this.cursorGraphics.strokePath();
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
   */
  clear(): void {
    this.points = [];
    this.active = false;
    this.graphics.clear();
    this.glowGraphics.clear();
    this.cursorGraphics.clear();
    this.chargeGraphics.clear();
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
   */
  private drawChargeIndicator(): void {
    this.chargeGraphics.clear();

    if (!this.powerState.isCharging) return;

    const x = this.currentPosition.x;
    const y = this.currentPosition.y;
    const powerLevel = this.powerState.level;
    const progress = this.powerState.chargeProgress;

    // Get color for current power level
    const currentColor = SLASH_POWER_COLORS[powerLevel as keyof typeof SLASH_POWER_COLORS];
    const nextColor = SLASH_POWER_COLORS[
      Math.min(powerLevel + 1, SLASH_POWER.maxPowerLevel) as keyof typeof SLASH_POWER_COLORS
    ];

    // Base radius grows with power level
    const baseRadius = 20 + powerLevel * 8;
    const pulseAmount = Math.sin(this.chargeAnimationTime * 8) * 3;
    const radius = baseRadius + pulseAmount;

    // Draw outer glow ring (pulsing)
    const glowAlpha = 0.3 + Math.sin(this.chargeAnimationTime * 6) * 0.15;
    this.chargeGraphics.lineStyle(8, currentColor, glowAlpha);
    this.chargeGraphics.strokeCircle(x, y, radius + 6);

    // Draw main charge ring
    this.chargeGraphics.lineStyle(4, currentColor, 0.8);
    this.chargeGraphics.strokeCircle(x, y, radius);

    // Draw progress arc for next level (if not at max)
    if (powerLevel < SLASH_POWER.maxPowerLevel) {
      const startAngle = -Math.PI / 2; // Start from top
      const endAngle = startAngle + (progress * Math.PI * 2);

      this.chargeGraphics.lineStyle(3, nextColor, 0.9);
      this.chargeGraphics.beginPath();
      this.chargeGraphics.arc(x, y, radius - 4, startAngle, endAngle, false);
      this.chargeGraphics.strokePath();
    }

    // Draw power level indicators (small circles around the ring)
    const indicatorRadius = 4;
    const indicatorDistance = radius + 14;
    for (let i = 0; i <= SLASH_POWER.maxPowerLevel; i++) {
      const angle = -Math.PI / 2 + (i / SLASH_POWER.maxPowerLevel) * Math.PI * 2;
      const ix = x + Math.cos(angle) * indicatorDistance;
      const iy = y + Math.sin(angle) * indicatorDistance;

      if (i <= powerLevel) {
        // Filled indicator for achieved levels
        const indicatorColor = SLASH_POWER_COLORS[i as keyof typeof SLASH_POWER_COLORS];
        this.chargeGraphics.fillStyle(indicatorColor, 1);
        this.chargeGraphics.fillCircle(ix, iy, indicatorRadius);
      } else {
        // Empty indicator for levels not yet reached
        this.chargeGraphics.lineStyle(2, 0xffffff, 0.4);
        this.chargeGraphics.strokeCircle(ix, iy, indicatorRadius);
      }
    }

    // Draw power level text in center (for visual feedback)
    if (powerLevel > SlashPowerLevel.NONE) {
      const levelNames = ['', 'LOW', 'MED', 'MAX'];
      const levelName = levelNames[powerLevel] || '';

      // Create text effect using graphics (since we're using graphics layer)
      // Draw an inner glow to indicate power level
      const innerGlowAlpha = 0.4 + Math.sin(this.chargeAnimationTime * 10) * 0.2;
      this.chargeGraphics.fillStyle(currentColor, innerGlowAlpha);
      this.chargeGraphics.fillCircle(x, y, 8 + powerLevel * 2);
    }
  }

  /**
   * Destroy slash trail and clean up resources
   */
  destroy(): void {
    this.graphics.destroy();
    this.glowGraphics.destroy();
    this.cursorGraphics.destroy();
    this.chargeGraphics.destroy();
    this.points = [];
  }
}
