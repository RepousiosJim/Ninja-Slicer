/**
 * FrenzyPowerUp
 * 
 * Doubles all points earned for 8 seconds.
 * Adds orange border glow and "2X" indicator while active.
 */

import Phaser from 'phaser';
import { PowerUp } from './PowerUp';
import { PowerUpType } from '@config/types';
import { POWERUP_FRENZY } from '@config/constants';
import { EventBus } from '@utils/EventBus';

export class FrenzyPowerUp extends PowerUp {
  private border: Phaser.GameObjects.Graphics | null = null;
  private indicator: Phaser.GameObjects.Text | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'powerup_frenzy', PowerUpType.FRENZY);
  }

  /**
   * Activate frenzy effect
   */
  protected activate(): void {
    // Create visual indicators
    this.createBorder();
    this.createIndicator();
    
    // Emit power-up activated event
    EventBus.emit('powerup-activated', {
      type: PowerUpType.FRENZY,
    });
    
    // Set timer to revert effect
    this.scene.time.delayedCall(POWERUP_FRENZY.duration * 1000, () => {
      this.deactivate();
    });
  }

  /**
   * Deactivate frenzy effect
   */
  private deactivate(): void {
    // Remove border
    if (this.border) {
      this.scene.tweens.add({
        targets: this.border,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          if (this.border) {
            this.border.destroy();
            this.border = null;
          }
        },
      });
    }
    
    // Remove indicator
    if (this.indicator) {
      this.scene.tweens.add({
        targets: this.indicator,
        alpha: 0,
        scale: 1.5,
        duration: 300,
        onComplete: () => {
          if (this.indicator) {
            this.indicator.destroy();
            this.indicator = null;
          }
        },
      });
    }
    
    // Emit power-up ended event
    EventBus.emit('powerup-ended', {
      type: PowerUpType.FRENZY,
    });
  }

  /**
   * Create orange border glow
   */
  private createBorder(): void {
    this.border = this.scene.add.graphics();
    this.border.lineStyle(10, 0xff8800, 0.8); // Orange border
    this.border.strokeRect(0, 0, 1280, 720);
    this.border.setDepth(999); // Render near top
    this.border.setAlpha(0);
    
    // Fade in border
    this.scene.tweens.add({
      targets: this.border,
      alpha: 1,
      duration: 300,
    });
    
    // Pulse effect
    this.scene.tweens.add({
      targets: this.border,
      alpha: 0.5,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Create "2X" indicator
   */
  private createIndicator(): void {
    this.indicator = this.scene.add.text(
      1280 / 2,
      100,
      '2X',
      {
        fontSize: '64px',
        color: '#ff8800',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6,
      },
    );
    this.indicator.setOrigin(0.5);
    this.indicator.setDepth(1000);
    this.indicator.setAlpha(0);
    this.indicator.setScale(0.5);
    
    // Animate indicator appearing
    this.scene.tweens.add({
      targets: this.indicator,
      alpha: 1,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut',
    });
    
    // Pulse effect
    this.scene.tweens.add({
      targets: this.indicator,
      scale: 1.1,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Get glow color (orange)
   */
  protected getGlowColor(): number {
    return 0xff8800;
  }
}
