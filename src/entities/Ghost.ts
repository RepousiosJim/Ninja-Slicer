/**
 * Ghost
 * 
 * Medium-speed monster with visibility cycle.
 * Only sliceable when visible (alpha > 0.5).
 * Dissolves into mist when sliced.
 */

import type Phaser from 'phaser';
import { Monster } from './Monster';
import { MonsterType } from '@config/types';
import { GHOST_VISIBLE_DURATION, GHOST_INVISIBLE_DURATION } from '@config/constants';

export class Ghost extends Monster {
  private isVisible: boolean = true;
  private visibilityTimer: number = 0;
  private fadeDuration: number = 300; // ms
  private alwaysVisible: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'monster_ghost', MonsterType.GHOST);
    
    // Ghost-specific stats
    this.health = 1;
    this.speed = 1.2;
    this.points = 30;
    
    // Set initial alpha
    this.setAlpha(1.0);
  }

  /**
   * Update ghost visibility cycle
   */
  update(time: number, delta: number): void {
    super.update(time, delta);

    // Skip visibility cycle if always visible
    if (this.alwaysVisible) {
      if (this.alpha < 1.0) {
        this.setAlpha(1.0);
      }
      return;
    }

    // Update visibility timer
    this.visibilityTimer += delta;

    // Check if we need to toggle visibility
    const currentDuration = this.isVisible ? GHOST_VISIBLE_DURATION * 1000 : GHOST_INVISIBLE_DURATION * 1000;
    
    if (this.visibilityTimer >= currentDuration) {
      this.toggleVisibility();
      this.visibilityTimer = 0;
    }
  }

  /**
   * Toggle between visible and invisible states
   */
  private toggleVisibility(): void {
    this.isVisible = !this.isVisible;
    const targetAlpha = this.isVisible ? 1.0 : 0.2;

    // Tween alpha for smooth transition
    this.scene.tweens.add({
      targets: this,
      alpha: targetAlpha,
      duration: this.fadeDuration,
      ease: 'Linear',
    });
  }

  /**
   * Set ghost always visible (Holy Cross Blade effect)
   */
  setAlwaysVisible(visible: boolean): void {
    this.alwaysVisible = visible;
    
    if (visible) {
      this.setAlpha(1.0);
    }
  }

  /**
   * Check if ghost is always visible
   */
  isAlwaysVisible(): boolean {
    return this.alwaysVisible;
  }

  /**
   * Called when ghost is sliced
   * Dissolves into mist particles
   */
  protected onSliced(): void {
    // Create mist effect
    this.createMistEffect();
    
    // Destroy ghost
    super.onSliced();
  }

  /**
   * Create mist particles that fade out
   */
  private createMistEffect(): void {
    const mistCount = 12;
    const mists: Phaser.GameObjects.Graphics[] = [];

    for (let i = 0; i < mistCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 20 + Math.random() * 30;
      const x = this.x + Math.cos(angle) * distance;
      const y = this.y + Math.sin(angle) * distance;
      const size = 10 + Math.random() * 15;
      
      const mist = this.scene.add.graphics();
      mist.fillStyle(0x87ceeb, 0.6); // Light blue mist
      mist.fillCircle(0, 0, size);
      mist.setPosition(x, y);
      
      mists.push(mist);
    }

    // Animate mists fading out and expanding
    mists.forEach((mist) => {
      this.scene.tweens.add({
        targets: mist,
        alpha: 0,
        scale: 2,
        duration: 800,
        ease: 'Quad.easeOut',
        onComplete: () => {
          mist.destroy();
        },
      });
    });
  }

  /**
   * Check if ghost is currently sliceable
   */
  isSliceable(): boolean {
    return this.alpha > 0.5;
  }

  /**
   * Get base health for ghost
   */
  protected getBaseHealth(): number {
    return 1;
  }
}
