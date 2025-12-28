/**
 * ShieldPowerUp
 * 
 * Negates the next villager slice penalty.
 * Lasts for 30 seconds or until consumed.
 * Shows shield icon indicator while active.
 */

import Phaser from 'phaser';
import { PowerUp } from './PowerUp';
import { PowerUpType } from '@config/types';
import { POWERUP_SHIELD } from '@config/constants';
import { EventBus } from '@utils/EventBus';

export class ShieldPowerUp extends PowerUp {
  private shieldIcon: Phaser.GameObjects.Sprite | null = null;
  private timerEvent: Phaser.Time.TimerEvent | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'powerup_shield', PowerUpType.SHIELD);
  }

  /**
   * Activate shield effect
   */
  protected activate(): void {
    // Create shield icon indicator
    this.createShieldIcon();
    
    // Emit power-up activated event
    EventBus.emit('powerup-activated', {
      type: PowerUpType.SHIELD,
    });
    
    // Set timer to expire after 30 seconds
    this.timerEvent = this.scene.time.delayedCall(POWERUP_SHIELD.duration * 1000, () => {
      this.deactivate();
    });
  }

  /**
   * Consume the shield (called when villager is sliced)
   */
  consume(): void {
    // Cancel expiration timer
    if (this.timerEvent) {
      this.timerEvent.remove();
      this.timerEvent = null;
    }
    
    // Deactivate immediately
    this.deactivate();
  }

  /**
   * Deactivate shield effect
   */
  private deactivate(): void {
    // Remove shield icon
    if (this.shieldIcon) {
      this.scene.tweens.add({
        targets: this.shieldIcon,
        alpha: 0,
        scale: 0.5,
        duration: 300,
        onComplete: () => {
          if (this.shieldIcon) {
            this.shieldIcon.destroy();
            this.shieldIcon = null;
          }
        },
      });
    }
    
    // Emit power-up ended event
    EventBus.emit('powerup-ended', {
      type: PowerUpType.SHIELD,
    });
  }

  /**
   * Create shield icon indicator
   */
  private createShieldIcon(): void {
    // Create shield icon in top-right corner
    this.shieldIcon = this.scene.add.sprite(1200, 50, 'powerup_shield');
    this.shieldIcon.setScale(0.8);
    this.shieldIcon.setDepth(1000);
    this.shieldIcon.setAlpha(0);
    this.shieldIcon.setScale(0.5);
    
    // Animate icon appearing
    this.scene.tweens.add({
      targets: this.shieldIcon,
      alpha: 1,
      scale: 0.8,
      duration: 300,
      ease: 'Back.easeOut',
    });
    
    // Pulse effect
    this.scene.tweens.add({
      targets: this.shieldIcon,
      scale: 0.9,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Get glow color (green)
   */
  protected getGlowColor(): number {
    return 0x00ff00;
  }
}
