/**
 * PhantomKing
 *
 * World 4 Boss - The ruler of all restless spirits.
 * Attacks: Phase shift, Clone summon, Soul storm
 * Minions: Ghosts
 */

import Phaser from 'phaser';
import { Boss } from './Boss';
import { BossConfig } from '@config/types';
import { EventBus } from '../utils/EventBus';

export class PhantomKing extends Boss {
  // Attack-specific properties
  private clones: Phaser.GameObjects.Rectangle[] = [];
  private isPhasing: boolean = false;
  private wailEffect: Phaser.GameObjects.Graphics | null = null;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'boss_phantomking');
    this.setScale(1.5);
  }

  /**
   * Override attack method for Phantom King specific attacks
   */
  protected attack(): void {
    if (!this.bossConfig || this.isPhasing) return;

    const phaseConfig = this.bossConfig.phases[this.currentPhase];
    if (!phaseConfig) return;

    const attackPattern = phaseConfig.attackPattern;

    // Set attack timer based on phase
    this.attackTimer = 2.3 - (this.currentPhase * 0.35);

    // Execute attack based on pattern
    switch (attackPattern) {
    case 'phase_shift':
      this.phaseShift();
      break;
    case 'clone_summon':
      this.cloneSummon();
      break;
    case 'soul_storm':
      this.soulStorm();
      break;
    default:
      this.phaseShift();
    }
  }

  /**
   * Phase shift attack - Phase 1
   */
  private phaseShift(): void {
    this.isPhasing = true;

    // Fade out
    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 300,
      onComplete: () => {
        // Teleport to random position
        const newX = Phaser.Math.Between(200, this.scene.scale.width - 200);
        const newY = Phaser.Math.Between(200, this.scene.scale.height - 200);
        this.setPosition(newX, newY);

        // Fade in
        this.scene.tweens.add({
          targets: this,
          alpha: 1,
          duration: 300,
          onComplete: () => {
            this.isPhasing = false;
          },
        });

        // Create phase effect
        this.createPhaseEffect(newX, newY);
      },
    });

    // Emit phase shift event
    EventBus.emit('boss-phase-shift', {
      fromX: this.x,
      fromY: this.y,
      damage: 10 + this.currentPhase * 4,
    });
  }

  /**
   * Clone summon attack - Phase 2
   */
  private cloneSummon(): void {
    if (!this.bossConfig) return;

    const phaseConfig = this.bossConfig.phases[this.currentPhase];
    if (!phaseConfig) return;

    const cloneCount = phaseConfig.cloneCount || 2;

    for (let i = 0; i < cloneCount; i++) {
      const angle = (Math.PI * 2 * (i + 1)) / (cloneCount + 1);
      const cloneX = this.x + Math.cos(angle) * 150;
      const cloneY = this.y + Math.sin(angle) * 150;

      const clone = this.scene.add.sprite(cloneX, cloneY, 'boss_phantomking') as any;
      clone.setAlpha(0.6);
      clone.setScale(this.scaleX * 0.8);
      this.clones.push(clone);

      // Animate clone
      this.scene.tweens.add({
        targets: clone,
        alpha: 0,
        scale: 0.5,
        duration: 2000,
        delay: i * 200,
        onComplete: () => {
          clone.destroy();
          const index = this.clones.indexOf(clone);
          if (index > -1) {
            this.clones.splice(index, 1);
          }
        },
      });

      // Create damage zone at clone position
      EventBus.emit('boss-damage-zone', {
        x: cloneX,
        y: cloneY,
        radius: 60,
        duration: 2000,
        damage: 12 + this.currentPhase * 4,
      });
    }

    // Emit clone summon event
    EventBus.emit('boss-clone-summon', {
      x: this.x,
      y: this.y,
      count: cloneCount,
    });
  }

  /**
   * Soul storm attack - Phase 3
   */
  private soulStorm(): void {
    const soulCount = 15 + this.currentPhase * 5;

    for (let i = 0; i < soulCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * 200;

      const soul = this.scene.physics.add.sprite(
        this.x + Math.cos(angle) * distance,
        this.y + Math.sin(angle) * distance,
        'effect_soul',
      ) as any;

      const soulBody = soul.body as Phaser.Physics.Arcade.Body;

      // Move toward boss
      const dx = this.x - soul.x;
      const dy = this.y - soul.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      soulBody.setVelocity((dx / dist) * 150, (dy / dist) * 150);

      // Remove soul after delay
      this.scene.time.delayedCall(2500, () => {
        soul.destroy();
      });
    }

    // Create wail effect
    this.createWailEffect();

    // Emit soul storm event
    EventBus.emit('boss-soul-storm', {
      x: this.x,
      y: this.y,
      count: soulCount,
      damage: 8 + this.currentPhase * 3,
    });
  }

  /**
   * Create phase effect at position
   */
  private createPhaseEffect(x: number, y: number): void {
    const effect = this.scene.add.graphics();
    effect.lineStyle(3, 0x800080, 1);
    effect.strokeCircle(x, y, 60);

    this.scene.tweens.add({
      targets: effect,
      scale: 2,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        effect.destroy();
      },
    });
  }

  /**
   * Create wail effect
   */
  private createWailEffect(): void {
    this.wailEffect = this.scene.add.graphics();
    this.wailEffect.lineStyle(2, 0x800080, 0.5);

    // Draw concentric circles
    for (let i = 1; i <= 5; i++) {
      this.wailEffect.strokeCircle(this.x, this.y, i * 50);
    }

    this.scene.tweens.add({
      targets: this.wailEffect,
      scale: 2,
      alpha: 0,
      duration: 1500,
      onComplete: () => {
        if (this.wailEffect) {
          this.wailEffect.destroy();
          this.wailEffect = null;
        }
      },
    });

    // Screen shake
    this.scene.cameras.main.shake(300, 0.008);
  }

  /**
   * Override spawn animation for Phantom King
   */
  protected playSpawnAnimation(): void {
    this.setScale(0);
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 800,
      ease: 'Elastic.easeOut',
    });

    // Create spectral aura effect
    const aura = this.scene.add.graphics();
    aura.fillStyle(0x800080, 0.3);
    aura.fillCircle(this.x, this.y, 100);

    this.scene.tweens.add({
      targets: aura,
      scale: 2,
      alpha: 0,
      duration: 900,
      onComplete: () => {
        aura.destroy();
      },
    });
  }

  /**
   * Cleanup
   */
  destroy(): void {
    // Clean up clones
    for (const clone of this.clones) {
      clone.destroy();
    }
    this.clones = [];

    // Clean up wail effect
    if (this.wailEffect) {
      this.wailEffect.destroy();
      this.wailEffect = null;
    }

    super.destroy();
  }
}
