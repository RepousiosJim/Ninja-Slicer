/**
 * SoulMagnetPowerUp
 * 
 * Increases souls earned by 50% for 10 seconds.
 * Adds purple glow effect to soul display while active.
 */

import type Phaser from 'phaser';
import { PowerUp } from './PowerUp';
import { PowerUpType } from '@config/types';
import { POWERUP_SOUL_MAGNET } from '@config/constants';
import { EventBus } from '@utils/EventBus';

export class SoulMagnetPowerUp extends PowerUp {
  private glowOverlay: Phaser.GameObjects.Graphics | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'powerup_soulmagnet', PowerUpType.SOUL_MAGNET);
  }

  /**
   * Activate soul magnet effect
   */
  protected activate(): void {
    // Create purple glow overlay
    this.createGlowOverlay();
    
    // Emit power-up activated event
    EventBus.emit('powerup-activated', {
      type: PowerUpType.SOUL_MAGNET,
    });
    
    // Set timer to revert effect
    this.scene.time.delayedCall(POWERUP_SOUL_MAGNET.duration * 1000, () => {
      this.deactivate();
    });
  }

  /**
   * Deactivate soul magnet effect
   */
  private deactivate(): void {
    // Remove glow overlay
    if (this.glowOverlay) {
      this.scene.tweens.add({
        targets: this.glowOverlay,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          if (this.glowOverlay) {
            this.glowOverlay.destroy();
            this.glowOverlay = null;
          }
        },
      });
    }
    
    // Emit power-up ended event
    EventBus.emit('powerup-ended', {
      type: PowerUpType.SOUL_MAGNET,
    });
  }

  /**
   * Create purple glow overlay for visual feedback
   */
  private createGlowOverlay(): void {
    this.glowOverlay = this.scene.add.graphics();
    this.glowOverlay.fillStyle(0x9900ff, 0.1); // Purple with low opacity
    this.glowOverlay.fillRect(0, 0, 1280, 720);
    this.glowOverlay.setDepth(999); // Render near top
    this.glowOverlay.setAlpha(0);
    
    // Fade in overlay
    this.scene.tweens.add({
      targets: this.glowOverlay,
      alpha: 1,
      duration: 300,
    });
    
    // Pulse effect
    this.scene.tweens.add({
      targets: this.glowOverlay,
      alpha: 0.5,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Get glow color (purple)
   */
  protected getGlowColor(): number {
    return 0x9900ff;
  }
}
