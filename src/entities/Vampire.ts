/**
 * Vampire
 * 
 * Fast monster that changes direction mid-flight.
 * Bursts into bat particles when sliced.
 */

import Phaser from 'phaser';
import { Monster } from './Monster';
import { MonsterType } from '@config/types';
import { GRAVITY } from '@config/constants';

export class Vampire extends Monster {
  private directionChangeChance: number = 0.05; // 5% chance per frame

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'monster_vampire', MonsterType.VAMPIRE);
    
    // Vampire-specific stats
    this.health = 1;
    this.speed = 1.4;
    this.points = 20;
  }

  /**
   * Update vampire behavior
   * Randomly changes direction mid-flight
   */
  update(time: number, delta: number): void {
    super.update(time, delta);

    // Randomly change direction (5% chance per frame)
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (Math.random() < this.directionChangeChance && body) {
      this.setVelocityX(-body.velocity.x);
    }
  }

  /**
   * Called when vampire is sliced
   * Bursts into bat particles
   */
  protected onSliced(): void {
    // Create bat burst effect
    this.createBatBurst();
    
    // Create two halves
    this.createHalves();
    
    // Destroy the vampire
    super.onSliced();
  }

  /**
   * Create two halves that fall with physics
   */
  private createHalves(): void {
    // Check if textures exist
    if (!this.scene.textures.exists('vampire_left_half') || !this.scene.textures.exists('vampire_right_half')) {
      console.warn('Vampire half textures not found, skipping split effect');
      return;
    }

    // Create left half
    const leftHalf = this.scene.physics.add.sprite(this.x - 10, this.y, 'vampire_left_half');
    const leftBody = leftHalf.body as Phaser.Physics.Arcade.Body;
    if (leftBody) {
      leftBody.setVelocity(-150, -250);
      leftBody.setAngularVelocity(-300);
      leftBody.setGravityY(GRAVITY);
    }

    // Create right half
    const rightHalf = this.scene.physics.add.sprite(this.x + 10, this.y, 'vampire_right_half');
    const rightBody = rightHalf.body as Phaser.Physics.Arcade.Body;
    if (rightBody) {
      rightBody.setVelocity(150, -250);
      rightBody.setAngularVelocity(300);
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
   * Create bat particles that fly outward
   */
  private createBatBurst(): void {
    // Check if bat texture exists
    if (!this.scene.textures.exists('vampire_bat')) {
      console.warn('Vampire bat texture not found, skipping bat burst effect');
      return;
    }

    const batCount = 8;
    const bats: Phaser.Physics.Arcade.Sprite[] = [];

    for (let i = 0; i < batCount; i++) {
      const angle = (Math.PI * 2 * i) / batCount;
      const speed = 150 + Math.random() * 100;

      const bat = this.scene.physics.add.sprite(this.x, this.y, 'vampire_bat');
      bat.setScale(0.5 + Math.random() * 0.5);

      const batBody = bat.body as Phaser.Physics.Arcade.Body;
      if (batBody) {
        batBody.setVelocity(
          Math.cos(angle) * speed,
          Math.sin(angle) * speed - 100
        );
        batBody.setAngularVelocity(Phaser.Math.Between(-200, 200));
        batBody.setGravityY(GRAVITY);
      }

      bats.push(bat);
    }

    // Auto-destroy bats after they fall off-screen
    const cleanupTimer = this.scene.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        bats.forEach((bat, index) => {
          if (bat && bat.active && (bat.y > 850 || bat.x < -100 || bat.x > 1380)) {
            bat.destroy();
            bats[index] = null as any;
          }
        });

        // Stop timer if all bats are gone
        if (bats.every((bat) => !bat || !bat.active)) {
          cleanupTimer.destroy();
        }
      },
    });

    // Failsafe: destroy after 3 seconds
    this.scene.time.delayedCall(3000, () => {
      bats.forEach((bat) => {
        if (bat && bat.active) bat.destroy();
      });
      if (cleanupTimer) cleanupTimer.destroy();
    });
  }

  /**
   * Get base health for vampire
   */
  protected getBaseHealth(): number {
    return 1;
  }
}
