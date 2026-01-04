/**
 * SlowMotionPowerUp
 * 
 * Slows down game time to 0.5x for 5 seconds.
 * Adds blue tint to screen while active.
 */

import type Phaser from 'phaser';
import { PowerUp } from './PowerUp';
import { PowerUpType } from '@config/types';
import { POWERUP_SLOW_MOTION } from '@config/constants';
import { EventBus } from '@utils/EventBus';

export class SlowMotionPowerUp extends PowerUp {
  private overlay: Phaser.GameObjects.Graphics | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'powerup_slowmotion', PowerUpType.SLOW_MOTION);
  }

  /**
   * Activate slow motion effect
   */
  protected activate(): void {
    // Set time scale
    this.scene.time.timeScale = POWERUP_SLOW_MOTION.timeScale;
    
    // Create blue overlay
    this.createOverlay();
    
    // Emit power-up activated event
    EventBus.emit('powerup-activated', {
      type: PowerUpType.SLOW_MOTION,
    });
    
    // Set timer to revert effect
    this.scene.time.delayedCall(POWERUP_SLOW_MOTION.duration * 1000, () => {
      this.deactivate();
    });
  }

  /**
   * Deactivate slow motion effect
   */
  private deactivate(): void {
    // Reset time scale
    this.scene.time.timeScale = 1.0;
    
    // Remove overlay
    if (this.overlay) {
      this.scene.tweens.add({
        targets: this.overlay,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          if (this.overlay) {
            this.overlay.destroy();
            this.overlay = null;
          }
        },
      });
    }
    
    // Emit power-up ended event
    EventBus.emit('powerup-ended', {
      type: PowerUpType.SLOW_MOTION,
    });
  }

  /**
   * Create blue overlay for visual feedback
   */
  private createOverlay(): void {
    this.overlay = this.scene.add.graphics();
    this.overlay.fillStyle(0x00ffff, 0.15); // Light blue with low opacity
    this.overlay.fillRect(0, 0, 1280, 720);
    this.overlay.setDepth(1000); // Render on top of everything
    this.overlay.setAlpha(0);
    
    // Fade in overlay
    this.scene.tweens.add({
      targets: this.overlay,
      alpha: 1,
      duration: 300,
    });
  }

  /**
   * Get glow color (cyan)
   */
  protected getGlowColor(): number {
    return 0x00ffff;
  }
}
