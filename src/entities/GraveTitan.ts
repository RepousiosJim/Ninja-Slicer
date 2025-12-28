/**
 * GraveTitan
 *
 * World 1 Boss - A massive zombie animated by dark magic.
 * Attacks: Ground slam, Rock throw
 * Minions: Zombies
 */

import Phaser from 'phaser';
import { Boss } from './Boss';
import { BossConfig } from '@config/types';
import { EventBus } from '../utils/EventBus';

export class GraveTitan extends Boss {
  // Attack-specific properties
  private shockwave: Phaser.GameObjects.Graphics | null = null;
  private rockProjectiles: Phaser.GameObjects.Rectangle[] = [];

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'boss_gravetitan');
    this.setScale(2);
  }

  /**
   * Override attack method for Grave Titan specific attacks
   */
  protected attack(): void {
    if (!this.bossConfig) return;

    const phaseConfig = this.bossConfig.phases[this.currentPhase];
    if (!phaseConfig) return;

    const attackPattern = phaseConfig.attackPattern;

    // Set attack timer based on phase
    this.attackTimer = 2.5 - (this.currentPhase * 0.4);

    // Execute attack based on pattern
    switch (attackPattern) {
      case 'slow_swipe':
        this.slowSwipe();
        break;
      case 'double_swipe':
        this.doubleSwipe();
        break;
      case 'ground_slam':
        this.groundSlam();
        break;
      default:
        this.slowSwipe();
    }
  }

  /**
   * Slow swipe attack - Phase 1
   */
  private slowSwipe(): void {
    // Create swipe effect
    const swipe = this.scene.add.graphics();
    swipe.lineStyle(8, 0x8b4513, 1);
    swipe.beginPath();
    swipe.moveTo(this.x - 100, this.y);
    swipe.lineTo(this.x + 100, this.y);
    swipe.strokePath();

    // Animate swipe
    this.scene.tweens.add({
      targets: swipe,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        swipe.destroy();
      },
    });

    // Create damage zone
    this.createDamageZone(this.x, this.y, 150, 500);
  }

  /**
   * Double swipe attack - Phase 2
   */
  private doubleSwipe(): void {
    // First swipe
    this.scene.time.delayedCall(0, () => {
      this.slowSwipe();
    });

    // Second swipe after delay
    this.scene.time.delayedCall(300, () => {
      this.slowSwipe();
    });
  }

  /**
   * Ground slam attack - Phase 3
   */
  private groundSlam(): void {
    // Create shockwave effect
    this.shockwave = this.scene.add.graphics();
    this.shockwave.lineStyle(4, 0x8b4513, 1);
    this.shockwave.strokeCircle(this.x, this.y, 50);

    // Animate shockwave expanding
    this.scene.tweens.add({
      targets: this.shockwave,
      scale: 4,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => {
        if (this.shockwave) {
          this.shockwave.destroy();
          this.shockwave = null;
        }
      },
    });

    // Screen shake
    this.scene.cameras.main.shake(200, 0.01);

    // Create expanding damage zone
    this.createExpandingDamageZone(this.x, this.y, 50, 200, 800);

    // Spawn rocks
    this.spawnRocks();
  }

  /**
   * Spawn rock projectiles
   */
  private spawnRocks(): void {
    const rockCount = 3 + this.currentPhase;

    for (let i = 0; i < rockCount; i++) {
      const angle = (Math.PI * 2 * i) / rockCount;
      const rock = this.scene.add.rectangle(
        this.x + Math.cos(angle) * 100,
        this.y + Math.sin(angle) * 100,
        30,
        30,
        0x8b4513
      );

      this.scene.physics.add.existing(rock);
      const rockBody = rock.body as Phaser.Physics.Arcade.Body;
      rockBody.setVelocity(Math.cos(angle) * 300, Math.sin(angle) * 300);

      this.rockProjectiles.push(rock);

      // Remove rock after delay
      this.scene.time.delayedCall(2000, () => {
        rock.destroy();
        const index = this.rockProjectiles.indexOf(rock);
        if (index > -1) {
          this.rockProjectiles.splice(index, 1);
        }
      });
    }
  }

  /**
   * Create a static damage zone
   */
  private createDamageZone(x: number, y: number, radius: number, duration: number): void {
    const zone = this.scene.add.graphics();
    zone.fillStyle(0xff0000, 0.3);
    zone.fillCircle(x, y, radius);

    this.scene.tweens.add({
      targets: zone,
      alpha: 0,
      duration,
      onComplete: () => {
        zone.destroy();
      },
    });

    // Emit damage zone event for collision detection
    EventBus.emit('boss-damage-zone', {
      x,
      y,
      radius,
      duration,
      damage: 10 + this.currentPhase * 5,
    });
  }

  /**
   * Create an expanding damage zone
   */
  private createExpandingDamageZone(
    x: number,
    y: number,
    startRadius: number,
    endRadius: number,
    duration: number
  ): void {
    const zone = this.scene.add.graphics();
    zone.fillStyle(0xff0000, 0.3);
    zone.fillCircle(x, y, startRadius);

    this.scene.tweens.add({
      targets: zone,
      scale: endRadius / startRadius,
      alpha: 0,
      duration,
      ease: 'Power2',
      onComplete: () => {
        zone.destroy();
      },
    });

    // Emit expanding damage zone event
    EventBus.emit('boss-expanding-damage-zone', {
      x,
      y,
      startRadius,
      endRadius,
      duration,
      damage: 15 + this.currentPhase * 5,
    });
  }

  /**
   * Override spawn animation for Grave Titan
   */
  protected playSpawnAnimation(): void {
    this.setScale(0);
    this.scene.tweens.add({
      targets: this,
      scaleX: 2,
      scaleY: 2,
      duration: 800,
      ease: 'Elastic.easeOut',
    });

    // Create dust effect
    const dust = this.scene.add.graphics();
    dust.fillStyle(0x8b4513, 0.5);
    dust.fillCircle(this.x, this.y, 100);

    this.scene.tweens.add({
      targets: dust,
      scale: 2,
      alpha: 0,
      duration: 600,
      onComplete: () => {
        dust.destroy();
      },
    });
  }

  /**
   * Cleanup
   */
  destroy(): void {
    // Clean up shockwave
    if (this.shockwave) {
      this.shockwave.destroy();
      this.shockwave = null;
    }

    // Clean up rock projectiles
    for (const rock of this.rockProjectiles) {
      rock.destroy();
    }
    this.rockProjectiles = [];

    super.destroy();
  }
}
