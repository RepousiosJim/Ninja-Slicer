/**
 * DemonOverlord
 *
 * World 5 Boss - The source of all evil in the mortal realm.
 * Attacks: Fire breath, Summon pillars, Teleport fire, Inferno rage
 * Minions: All monster types
 */

import Phaser from 'phaser';
import { Boss } from './Boss';
import { BossConfig } from '@config/types';
import { EventBus } from '../utils/EventBus';

export class DemonOverlord extends Boss {
  // Attack-specific properties
  private fireParticles: Phaser.GameObjects.Rectangle[] = [];
  private pillars: Phaser.GameObjects.Rectangle[] = [];
  private isRaging: boolean = false;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'boss_demonoverlord');
    this.setScale(2);
  }

  /**
   * Override attack method for Demon Overlord specific attacks
   */
  protected attack(): void {
    if (!this.bossConfig || this.isRaging) return;

    const phaseConfig = this.bossConfig.phases[this.currentPhase];
    if (!phaseConfig) return;

    const attackPattern = phaseConfig.attackPattern;

    // Set attack timer based on phase
    this.attackTimer = 2.0 - (this.currentPhase * 0.3);

    // Execute attack based on pattern
    switch (attackPattern) {
      case 'fire_breath':
        this.fireBreath();
        break;
      case 'summon_pillars':
        this.summonPillars();
        break;
      case 'teleport_fire':
        this.teleportFire();
        break;
      case 'inferno_rage':
        this.infernoRage();
        break;
      default:
        this.fireBreath();
    }
  }

  /**
   * Fire breath attack - Phase 1
   */
  private fireBreath(): void {
    const coneAngle = Math.PI / 3; // 60 degrees
    const particleCount = 20 + this.currentPhase * 5;

    for (let i = 0; i < particleCount; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * coneAngle;
      const particle = this.scene.physics.add.sprite(
        this.x,
        this.y + 50,
        'effect_fire_breath'
      ) as any;

      particle.setScale(0.5 + Math.random() * 0.5);
      
      const particleBody = particle.body as Phaser.Physics.Arcade.Body;
      particleBody.setVelocity(
        Math.cos(angle) * (300 + Math.random() * 100),
        Math.sin(angle) * (300 + Math.random() * 100)
      );

      this.fireParticles.push(particle);

      // Remove particle after delay
      this.scene.time.delayedCall(1500, () => {
        particle.destroy();
        const index = this.fireParticles.indexOf(particle);
        if (index > -1) {
          this.fireParticles.splice(index, 1);
        }
      });
    }

    // Emit fire breath event
    EventBus.emit('boss-fire-breath', {
      x: this.x,
      y: this.y,
      count: particleCount,
      damage: 10 + this.currentPhase * 4,
    });
  }

  /**
   * Summon pillars attack - Phase 2
   */
  private summonPillars(): void {
    const pillarCount = 3 + this.currentPhase;

    for (let i = 0; i < pillarCount; i++) {
      const pillarX = Phaser.Math.Between(150, this.scene.scale.width - 150);
      const pillarY = Phaser.Math.Between(200, this.scene.scale.height - 200);

      const pillar = this.scene.add.rectangle(pillarX, pillarY, 40, 100, 0x8b0000);
      this.scene.physics.add.existing(pillar);
      const pillarBody = pillar.body as Phaser.Physics.Arcade.Body;
      pillarBody.setImmovable(true);
      pillarBody.setAllowGravity(false);

      this.pillars.push(pillar);

      // Create pillar rise animation
      pillar.setScale(0, 1);
      this.scene.tweens.add({
        targets: pillar,
        scaleX: 1,
        duration: 300,
        ease: 'Back.easeOut',
      });

      // Remove pillar after delay
      this.scene.time.delayedCall(3000, () => {
        this.scene.tweens.add({
          targets: pillar,
          scaleY: 0,
          duration: 300,
          onComplete: () => {
            pillar.destroy();
            const index = this.pillars.indexOf(pillar);
            if (index > -1) {
              this.pillars.splice(index, 1);
            }
          },
        });
      });

      // Create damage zone around pillar
      EventBus.emit('boss-damage-zone', {
        x: pillarX,
        y: pillarY,
        radius: 60,
        duration: 3000,
        damage: 15 + this.currentPhase * 5,
      });
    }

    // Emit summon pillars event
    EventBus.emit('boss-summon-pillars', {
      count: pillarCount,
    });
  }

  /**
   * Teleport fire attack - Phase 3
   */
  private teleportFire(): void {
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

        // Create fire explosion at new position
        this.createFireExplosion(newX, newY);
      },
    });

    // Emit teleport fire event
    EventBus.emit('boss-teleport-fire', {
      fromX: this.x,
      fromY: this.y,
      damage: 18 + this.currentPhase * 5,
    });
  }

  /**
   * Inferno rage attack - Phase 4
   */
  private infernoRage(): void {
    this.isRaging = true;

    // Rapid fire attacks
    const attackCount = 5 + this.currentPhase * 2;

    for (let i = 0; i < attackCount; i++) {
      this.scene.time.delayedCall(i * 200, () => {
        this.fireBreath();
      });
    }

    // End rage after attacks
    this.scene.time.delayedCall(attackCount * 200 + 500, () => {
      this.isRaging = false;
    });

    // Screen shake
    this.scene.cameras.main.shake(500, 0.015);

    // Emit inferno rage event
    EventBus.emit('boss-inferno-rage', {
      x: this.x,
      y: this.y,
      attackCount,
    });
  }

  /**
   * Create fire explosion at position
   */
  private createFireExplosion(x: number, y: number): void {
    const explosion = this.scene.add.graphics();
    explosion.fillStyle(0xff4500, 0.6);
    explosion.fillCircle(x, y, 80);

    this.scene.tweens.add({
      targets: explosion,
      scale: 2,
      alpha: 0,
      duration: 600,
      onComplete: () => {
        explosion.destroy();
      },
    });

    // Create damage zone
    EventBus.emit('boss-damage-zone', {
      x,
      y,
      radius: 80,
      duration: 600,
      damage: 20 + this.currentPhase * 5,
    });
  }

  /**
   * Override spawn animation for Demon Overlord
   */
  protected playSpawnAnimation(): void {
    this.setScale(0);
    this.scene.tweens.add({
      targets: this,
      scaleX: 2,
      scaleY: 2,
      duration: 900,
      ease: 'Elastic.easeOut',
    });

    // Create infernal aura effect
    const aura = this.scene.add.graphics();
    aura.fillStyle(0x8b0000, 0.4);
    aura.fillCircle(this.x, this.y, 120);

    this.scene.tweens.add({
      targets: aura,
      scale: 2.5,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        aura.destroy();
      },
    });

    // Screen shake
    this.scene.cameras.main.shake(400, 0.01);
  }

  /**
   * Cleanup
   */
  destroy(): void {
    // Clean up fire particles
    for (const particle of this.fireParticles) {
      particle.destroy();
    }
    this.fireParticles = [];

    // Clean up pillars
    for (const pillar of this.pillars) {
      pillar.destroy();
    }
    this.pillars = [];

    super.destroy();
  }
}
