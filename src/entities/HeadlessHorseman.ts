/**
 * HeadlessHorseman
 *
 * World 2 Boss - A legendary specter that rides through the night.
 * Attacks: Charge, Head throw
 * Minions: Zombies and Vampires
 */

import type Phaser from 'phaser';
import { Boss } from './Boss';
import { BossConfig } from '@config/types';
import { EventBus } from '../utils/EventBus';

export class HeadlessHorseman extends Boss {
  // Attack-specific properties
  private isCharging: boolean = false;
  private chargeDirection: { x: number; y: number } = { x: 0, y: 0 };
  private headProjectile: Phaser.GameObjects.Rectangle | null = null;
  private trailEffects: Phaser.GameObjects.Rectangle[] = [];

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'boss_horseman');
    this.setScale(1.8);
  }

  /**
   * Override attack method for Headless Horseman specific attacks
   */
  protected attack(): void {
    if (!this.bossConfig || this.isCharging) return;

    const phaseConfig = this.bossConfig.phases[this.currentPhase];
    if (!phaseConfig) return;

    const attackPattern = phaseConfig.attackPattern;

    // Set attack timer based on phase
    this.attackTimer = 2.0 - (this.currentPhase * 0.3);

    // Execute attack based on pattern
    switch (attackPattern) {
    case 'charge':
      this.charge();
      break;
    case 'head_throw':
      this.headThrow();
      break;
    case 'rapid_charge':
      this.rapidCharge();
      break;
    default:
      this.charge();
    }
  }

  /**
   * Charge attack - Phase 1
   */
  private charge(): void {
    this.isCharging = true;

    // Choose random direction (left or right)
    const direction = Math.random() > 0.5 ? 1 : -1;
    this.chargeDirection = { x: direction * 600, y: 0 };

    // Set velocity
    this.setVelocity(this.chargeDirection.x, this.chargeDirection.y);

    // Create trail effect
    this.createTrailEffect();

    // Stop after crossing screen
    this.scene.time.delayedCall(1500, () => {
      this.setVelocity(0, 0);
      this.isCharging = false;
      this.clearTrailEffects();
    });

    // Emit charge event
    EventBus.emit('boss-charge', {
      x: this.x,
      y: this.y,
      direction: this.chargeDirection,
      duration: 1500,
      damage: 15 + this.currentPhase * 5,
    });
  }

  /**
   * Head throw attack - Phase 2
   */
  private headThrow(): void {
    // Create head projectile
    this.headProjectile = this.scene.physics.add.sprite(this.x, this.y, 'horseman_head') as any;
    
    const headBody = this.headProjectile!.body as Phaser.Physics.Arcade.Body;
    headBody.setVelocity(0, -400);
    headBody.setBounce(1, 0.8);
    headBody.setCollideWorldBounds(true);

    // Animate head bouncing
    let bounceCount = 0;
    const maxBounces = 3 + this.currentPhase;

    const checkBounce = () => {
      if (!this.headProjectile) return;

      const velocity = headBody.velocity;
      if (Math.abs(velocity.y) < 50) {
        bounceCount++;
        if (bounceCount >= maxBounces) {
          (this.headProjectile as any).destroy();
          this.headProjectile = null;
          return;
        }
      }

      this.scene.time.delayedCall(100, checkBounce);
    };

    this.scene.time.delayedCall(100, checkBounce);

    // Emit head throw event
    EventBus.emit('boss-projectile', {
      x: this.x,
      y: this.y,
      velocity: { x: 0, y: -400 },
      damage: 20 + this.currentPhase * 5,
      duration: 3000,
    });
  }

  /**
   * Rapid charge attack - Phase 3
   */
  private rapidCharge(): void {
    // Perform multiple quick charges
    const chargeCount = 2 + this.currentPhase;

    for (let i = 0; i < chargeCount; i++) {
      this.scene.time.delayedCall(i * 400, () => {
        this.charge();
      });
    }
  }

  /**
   * Create trail effect during charge
   */
  private createTrailEffect(): void {
    const trailInterval = this.scene.time.addEvent({
      delay: 50,
      callback: () => {
        if (!this.isCharging) {
          trailInterval.destroy();
          return;
        }

        const trail = this.scene.add.rectangle(this.x, this.y, 60, 60, 0x4a0080, 0.3);
        this.trailEffects.push(trail);

        // Fade out trail
        this.scene.tweens.add({
          targets: trail,
          alpha: 0,
          scaleX: 0.5,
          scaleY: 0.5,
          duration: 300,
          onComplete: () => {
            trail.destroy();
            const index = this.trailEffects.indexOf(trail);
            if (index > -1) {
              this.trailEffects.splice(index, 1);
            }
          },
        });
      },
      loop: true,
    });
  }

  /**
   * Clear all trail effects
   */
  private clearTrailEffects(): void {
    for (const trail of this.trailEffects) {
      trail.destroy();
    }
    this.trailEffects = [];
  }

  /**
   * Override spawn animation for Headless Horseman
   */
  protected playSpawnAnimation(): void {
    this.setScale(0);
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.8,
      scaleY: 1.8,
      duration: 600,
      ease: 'Back.easeOut',
    });

    // Create spectral mist effect
    const mist = this.scene.add.graphics();
    mist.fillStyle(0x4a0080, 0.4);
    mist.fillCircle(this.x, this.y, 120);

    this.scene.tweens.add({
      targets: mist,
      scale: 1.5,
      alpha: 0,
      duration: 800,
      onComplete: () => {
        mist.destroy();
      },
    });
  }

  /**
   * Cleanup
   */
  destroy(): void {
    // Clean up head projectile
    if (this.headProjectile) {
      this.headProjectile.destroy();
      this.headProjectile = null;
    }

    // Clean up trail effects
    this.clearTrailEffects();

    super.destroy();
  }
}
