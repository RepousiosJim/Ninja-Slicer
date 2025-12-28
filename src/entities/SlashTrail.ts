/**
 * SlashTrail
 * 
 * Tracks mouse/touch movement and renders a glowing trail effect.
 * The trail only appears when cursor moves fast enough (above velocity threshold).
 */

import Phaser from 'phaser';
import { SLASH_VELOCITY_THRESHOLD, SLASH_TRAIL_MAX_LENGTH, SLASH_TRAIL_FADE_RATE, SLASH_TRAIL_WIDTH, SLASH_TRAIL_GLOW_WIDTH } from '@config/constants';

export class SlashTrail {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private glowGraphics: Phaser.GameObjects.Graphics;
  private cursorGraphics: Phaser.GameObjects.Graphics; // Visual cursor indicator

  private points: Phaser.Math.Vector2[] = [];
  private previousPosition: Phaser.Math.Vector2;
  private currentPosition: Phaser.Math.Vector2;
  private lastUpdateTime: number = 0;
  private active: boolean = false;

  // Trail style properties - BRIGHT and VISIBLE
  private trailColor: number = 0xffffff; // Bright white
  private trailGlow: number = 0xff00ff; // Bright magenta glow
  private trailWidth: number = SLASH_TRAIL_WIDTH * 2; // Make thicker
  private trailGlowWidth: number = SLASH_TRAIL_GLOW_WIDTH * 2; // Make thicker

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Create graphics for trail, glow, and cursor
    this.glowGraphics = scene.add.graphics();
    this.graphics = scene.add.graphics();
    this.cursorGraphics = scene.add.graphics();

    // Set depth to be above monsters but below UI
    this.glowGraphics.setDepth(100);
    this.graphics.setDepth(101);
    this.cursorGraphics.setDepth(102); // Cursor on top

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
  }

  /**
   * Set trail style (color, glow, width)
   */
  setTrailStyle(style: { color: number; glow: number; width: number }): void {
    this.trailColor = style.color;
    this.trailGlow = style.glow;
    this.trailWidth = style.width;
    this.trailGlowWidth = style.width * 2;
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

  /**
   * Destroy slash trail and clean up resources
   */
  destroy(): void {
    this.graphics.destroy();
    this.glowGraphics.destroy();
    this.cursorGraphics.destroy();
    this.points = [];
  }
}
