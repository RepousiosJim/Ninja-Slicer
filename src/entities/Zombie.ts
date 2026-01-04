/**
 * Zombie
 * 
 * Basic monster implementation that splits into two halves when sliced.
 */

import type Phaser from 'phaser';
import { debugLog, debugWarn, debugError } from '@utils/DebugLogger';


import { Monster } from './Monster';
import { MonsterType } from '@config/types';
import { GRAVITY } from '@config/constants';

export class Zombie extends Monster {
  /**
   * Initialize zombie monster with default stats
   * Zombies split into two halves when sliced
   * 
   * @param scene - The Phaser scene this zombie belongs to
   * @param x - Initial X position
   * @param y - Initial Y position
   * 
   * @example
   * ```typescript
   * const zombie = new Zombie(this, 100, 200);
   * this.add.existing(zombie);
   * ```
   */
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'monster_zombie', MonsterType.ZOMBIE);
    
    // Zombie-specific stats
    this.health = 1;
    this.speed = 1.0;
    this.points = 10;
  }

  /**
   * Handle zombie being sliced
   * Creates visual flash effect and splits zombie into two halves
   * Both halves have physics and fall off-screen
   * 
   * @example
   * ```typescript
   * // Automatically called by Monster.slice()
   * zombie.slice(); // Triggers onSliced()
   * ```
   */
  protected onSliced(): void {
    // Create visual flash effect
    this.createFlashEffect();
    
    // Create two halves
    this.createHalves();
    
    // Destroy the original zombie
    super.onSliced();
  }

  /**
   * Create a flash effect when zombie is sliced
   */
  private createFlashEffect(): void {
    const flash = this.scene.add.graphics();
    flash.fillStyle(0xffffff, 0.8);
    flash.fillCircle(this.x, this.y, 40);
    
    // Fade out and destroy
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 100,
      onComplete: () => {
        flash.destroy();
      },
    });
  }

  /**
   * Create two halves that fall with physics
   */
  private createHalves(): void {
    // Check if textures exist
    if (!this.scene.textures.exists('zombie_left_half') || !this.scene.textures.exists('zombie_right_half')) {
      debugWarn('Zombie half textures not found, skipping split effect');
      return;
    }

    // Create left half
    const leftHalf = this.scene.physics.add.sprite(this.x - 10, this.y, 'zombie_left_half');
    const leftBody = leftHalf.body as Phaser.Physics.Arcade.Body;
    if (leftBody) {
      leftBody.setVelocity(-100, -200);
      leftBody.setAngularVelocity(-200);
      leftBody.setGravityY(GRAVITY);
    }

    // Create right half
    const rightHalf = this.scene.physics.add.sprite(this.x + 10, this.y, 'zombie_right_half');
    const rightBody = rightHalf.body as Phaser.Physics.Arcade.Body;
    if (rightBody) {
      rightBody.setVelocity(100, -200);
      rightBody.setAngularVelocity(200);
      rightBody.setGravityY(GRAVITY);
    }

    // Auto-destroy halves after they fall off-screen
    const cleanupTimer = this.scene.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        if (leftHalf && leftHalf.active && leftHalf.y > 850) {
          leftHalf.destroy();
        }
        if (rightHalf && rightHalf.active && rightHalf.y > 850) {
          rightHalf.destroy();
        }

        // Stop timer if both halves are gone
        if ((!leftHalf || !leftHalf.active) && (!rightHalf || !rightHalf.active)) {
          cleanupTimer.destroy();
        }
      },
    });

    // Failsafe: destroy after 5 seconds
    this.scene.time.delayedCall(5000, () => {
      if (leftHalf && leftHalf.active) leftHalf.destroy();
      if (rightHalf && rightHalf.active) rightHalf.destroy();
      if (cleanupTimer) cleanupTimer.destroy();
    });
  }

  /**
   * Get base health value for zombie
   * 
   * @returns Health value (always 1 for zombies)
   */
  protected getBaseHealth(): number {
    return 1;
  }
}
