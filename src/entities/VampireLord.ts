/**
 * VampireLord
 *
 * World 3 Boss - The ancient master of all vampires.
 * Attacks: Bat swarm, Blood drain
 * Minions: Vampires and Ghosts
 */

import Phaser from 'phaser';
import { Boss } from './Boss';
import { BossConfig } from '@config/types';
import { EventBus } from '../utils/EventBus';

export class VampireLord extends Boss {
  // Attack-specific properties
  private batParticles: Phaser.GameObjects.Rectangle[] = [];
  private isDraining: boolean = false;
  private drainTarget: { x: number; y: number } | null = null;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'boss_vampirelord');
    this.setScale(1.6);
  }

  /**
   * Override attack method for Vampire Lord specific attacks
   */
  protected attack(): void {
    if (!this.bossConfig || this.isDraining) return;

    const phaseConfig = this.bossConfig.phases[this.currentPhase];
    if (!phaseConfig) return;

    const attackPattern = phaseConfig.attackPattern;

    // Set attack timer based on phase
    this.attackTimer = 2.2 - (this.currentPhase * 0.35);

    // Execute attack based on pattern
    switch (attackPattern) {
      case 'bat_wave':
        this.batWave();
        break;
      case 'teleport_strike':
        this.teleportStrike();
        break;
      case 'blood_rain':
        this.bloodRain();
        break;
      default:
        this.batWave();
    }
  }

  /**
   * Bat wave attack - Phase 1
   */
  private batWave(): void {
    const batCount = 5 + this.currentPhase * 2;

    for (let i = 0; i < batCount; i++) {
      const angle = (Math.PI * 2 * i) / batCount;
      const bat = this.scene.add.rectangle(
        this.x + Math.cos(angle) * 50,
        this.y + Math.sin(angle) * 50,
        20,
        20,
        0x8b0000
      );

      this.scene.physics.add.existing(bat);
      const batBody = bat.body as Phaser.Physics.Arcade.Body;
      batBody.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);

      this.batParticles.push(bat);

      // Remove bat after delay
      this.scene.time.delayedCall(2000, () => {
        bat.destroy();
        const index = this.batParticles.indexOf(bat);
        if (index > -1) {
          this.batParticles.splice(index, 1);
        }
      });
    }

    // Emit bat wave event
    EventBus.emit('boss-bat-wave', {
      x: this.x,
      y: this.y,
      count: batCount,
      damage: 8 + this.currentPhase * 3,
    });
  }

  /**
   * Teleport strike attack - Phase 2
   */
  private teleportStrike(): void {
    // Fade out
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        // Teleport to random position
        const newX = Phaser.Math.Between(200, this.scene.scale.width - 200);
        const newY = Phaser.Math.Between(200, this.scene.scale.height - 200);
        this.setPosition(newX, newY);

        // Fade in
        this.scene.tweens.add({
          targets: this,
          alpha: 1,
          duration: 200,
        });

        // Create strike effect
        this.createStrikeEffect(newX, newY);
      },
    });

    // Emit teleport event
    EventBus.emit('boss-teleport', {
      fromX: this.x,
      fromY: this.y,
      damage: 12 + this.currentPhase * 4,
    });
  }

  /**
   * Blood rain attack - Phase 3
   */
  private bloodRain(): void {
    const dropCount = 10 + this.currentPhase * 3;

    for (let i = 0; i < dropCount; i++) {
      this.scene.time.delayedCall(i * 100, () => {
        const drop = this.scene.add.rectangle(
          Phaser.Math.Between(100, this.scene.scale.width - 100),
          -50,
          15,
          15,
          0x8b0000
        );

        this.scene.physics.add.existing(drop);
        const dropBody = drop.body as Phaser.Physics.Arcade.Body;
        dropBody.setVelocity(0, 400);

        // Remove drop after delay
        this.scene.time.delayedCall(2000, () => {
          drop.destroy();
        });
      });
    }

    // Emit blood rain event
    EventBus.emit('boss-blood-rain', {
      count: dropCount,
      damage: 10 + this.currentPhase * 3,
    });
  }

  /**
   * Create strike effect at position
   */
  private createStrikeEffect(x: number, y: number): void {
    const effect = this.scene.add.graphics();
    effect.lineStyle(4, 0x8b0000, 1);
    effect.strokeCircle(x, y, 80);

    this.scene.tweens.add({
      targets: effect,
      scale: 2,
      alpha: 0,
      duration: 400,
      onComplete: () => {
        effect.destroy();
      },
    });

    // Create damage zone
    EventBus.emit('boss-damage-zone', {
      x,
      y,
      radius: 80,
      duration: 400,
      damage: 15 + this.currentPhase * 5,
    });
  }

  /**
   * Override spawn animation for Vampire Lord
   */
  protected playSpawnAnimation(): void {
    this.setScale(0);
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.6,
      scaleY: 1.6,
      duration: 700,
      ease: 'Back.easeOut',
    });

    // Create blood mist effect
    const mist = this.scene.add.graphics();
    mist.fillStyle(0x8b0000, 0.4);
    mist.fillCircle(this.x, this.y, 100);

    this.scene.tweens.add({
      targets: mist,
      scale: 2,
      alpha: 0,
      duration: 700,
      onComplete: () => {
        mist.destroy();
      },
    });
  }

  /**
   * Cleanup
   */
  destroy(): void {
    // Clean up bat particles
    for (const bat of this.batParticles) {
      bat.destroy();
    }
    this.batParticles = [];

    super.destroy();
  }
}
