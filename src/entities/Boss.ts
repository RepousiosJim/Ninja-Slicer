/**
 * Boss
 *
 * Base class for all boss entities in the game.
 * Handles health management, phases, attacks, and minion spawning.
 */

import Phaser from 'phaser';
import { BossConfig, BossPhase, MonsterType } from '@config/types';
import { BOSS_PHASE_THRESHOLDS, BOSS_INVULNERABLE_DURATION, BOSS_MINION_SPAWN_DELAY } from '@config/constants';
import { EventBus } from '../utils/EventBus';

export class Boss extends Phaser.Physics.Arcade.Sprite {
  // Configuration
  protected bossConfig: BossConfig | null = null;

  // State
  protected currentPhase: number = 0;
  protected health: number = 0;
  protected maxHealth: number = 0;
  protected isInvulnerable: boolean = false;
  protected isDead: boolean = false;

  // Timers
  protected attackTimer: number = 0;
  protected minionSpawnTimer: number = 0;
  protected invulnerabilityTimer: number = 0;

  // UI
  protected healthBar: Phaser.GameObjects.Container | null = null;
  protected healthBarBackground: Phaser.GameObjects.Rectangle | null = null;
  protected healthBarFill: Phaser.GameObjects.Rectangle | null = null;
  protected healthBarText: Phaser.GameObjects.Text | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Create animations after delay to ensure config is loaded
    scene.events.once('update', () => {
      this.createAnimations();
    });
  }

  /**
   * Create boss animations
   */
  protected createAnimations(): void {
    if (!this.bossConfig) return;
    
    const animKey = `${this.bossConfig.id}_idle`;
    if (!this.scene.anims.exists(animKey)) {
      const sheetKey = `boss_${this.bossConfig.id}_sheet`;
      if (this.scene.textures.exists(sheetKey)) {
        this.scene.anims.create({
          key: animKey,
          frames: this.scene.anims.generateFrameNumbers(sheetKey, { start: 0, end: 2 }),
          frameRate: 6,
          repeat: -1
        });
        this.play(animKey);
      }
    }
  }

  /**
   * Initialize boss with configuration
   */
  spawn(x: number, y: number, bossConfig: BossConfig): void {
    this.bossConfig = bossConfig;
    this.maxHealth = bossConfig.health;
    this.health = this.maxHealth;
    this.currentPhase = 0;
    this.isInvulnerable = false;
    this.isDead = false;

    // Position boss
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);

    // Reset timers
    this.attackTimer = 0;
    this.minionSpawnTimer = 0;
    this.invulnerabilityTimer = 0;

    // Create health bar
    this.createHealthBar();

    // Play spawn animation
    this.playSpawnAnimation();

    console.log(`[Boss] ${bossConfig.name} spawned at (${x}, ${y})`);
  }

  /**
   * Update boss state
   */
  update(time: number, delta: number): void {
    if (this.isDead || !this.bossConfig) return;

    // Update invulnerability
    if (this.isInvulnerable) {
      this.invulnerabilityTimer -= delta / 1000;
      if (this.invulnerabilityTimer <= 0) {
        this.isInvulnerable = false;
        this.setAlpha(1);
      }
    }

    // Update attack timer
    this.attackTimer -= delta / 1000;
    if (this.attackTimer <= 0) {
      this.attack();
    }

    // Update minion spawn timer
    this.minionSpawnTimer -= delta / 1000;
    if (this.minionSpawnTimer <= 0) {
      this.spawnMinions();
    }

    // Update health bar position
    this.updateHealthBar();
  }

  /**
   * Take damage
   */
  takeDamage(damage: number): void {
    if (this.isInvulnerable || this.isDead || !this.bossConfig) return;

    this.health -= damage;

    // Emit boss hit event
    EventBus.emit('boss-hit', {
      bossId: this.bossConfig.id,
      damage,
      remainingHealth: this.health,
      maxHealth: this.maxHealth,
      phase: this.currentPhase,
    });

    // Check for phase transition
    this.checkPhaseTransition();

    // Check for death
    if (this.health <= 0) {
      this.die();
    }

    // Update health bar
    this.updateHealthBar();

    // Flash effect
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      this.clearTint();
    });
  }

  /**
   * Check if boss should transition to next phase
   */
  protected checkPhaseTransition(): void {
    if (!this.bossConfig) return;

    const healthPercent = this.health / this.maxHealth;
    const nextPhase = this.currentPhase + 1;

    if (nextPhase < this.bossConfig.phases.length) {
      const nextPhaseConfig = this.bossConfig.phases[nextPhase];
      if (nextPhaseConfig && healthPercent <= nextPhaseConfig.healthThreshold) {
        this.enterPhase(nextPhase);
      }
    }
  }

  /**
   * Enter a new phase
   */
  protected enterPhase(phase: number): void {
    if (!this.bossConfig || phase >= this.bossConfig.phases.length) return;

    this.currentPhase = phase;
    this.isInvulnerable = true;
    this.invulnerabilityTimer = BOSS_INVULNERABLE_DURATION;

    // Flash to indicate phase change
    this.setAlpha(0.5);
    this.scene.time.delayedCall(BOSS_INVULNERABLE_DURATION * 500, () => {
      this.setAlpha(1);
    });

    // Emit phase change event
    EventBus.emit('boss-phase-change', {
      bossId: this.bossConfig!.id,
      phase,
    });

    console.log(`[Boss] ${this.bossConfig.name} entered phase ${phase}`);
  }

  /**
   * Execute attack pattern (override in subclasses)
   */
  protected attack(): void {
    if (!this.bossConfig) return;

    const phaseConfig = this.bossConfig.phases[this.currentPhase];
    if (!phaseConfig) return;

    const attackPattern = phaseConfig.attackPattern;

    // Set attack timer based on phase
    this.attackTimer = 2.0 - (this.currentPhase * 0.3); // Faster attacks in later phases

    // Override in subclasses for specific attack patterns
    console.log(`[Boss] ${this.bossConfig.name} attacks with pattern: ${attackPattern}`);
  }

  /**
   * Spawn minions based on phase
   */
  protected spawnMinions(): void {
    if (!this.bossConfig) return;

    const phaseConfig = this.bossConfig.phases[this.currentPhase];
    if (!phaseConfig) return;

    const minionSpawnRate = phaseConfig.minionSpawnRate;
    this.minionSpawnTimer = minionSpawnRate;

    // Get minion types for this phase
    const minionTypes = phaseConfig.minionTypes || (phaseConfig.minionType ? [phaseConfig.minionType] : []);
    if (minionTypes.length === 0) return;

    const minionType = minionTypes[Math.floor(Math.random() * minionTypes.length)];

    if (!minionType) return;

    // Spawn minions (this will be handled by the scene's spawn system)
    EventBus.emit('spawn-minions', {
      type: minionType,
      count: 2 + this.currentPhase, // More minions in later phases
    });

    console.log(`[Boss] ${this.bossConfig.name} spawned ${minionType} minions`);
  }

  /**
   * Create health bar UI
   */
  protected createHealthBar(): void {
    if (!this.bossConfig) return;

    const barWidth = 400;
    const barHeight = 20;
    const x = this.scene.scale.width / 2;
    const y = 50;

    // Background
    this.healthBarBackground = this.scene.add.rectangle(x, y, barWidth, barHeight, 0x000000, 0.8);
    this.healthBarBackground.setDepth(1000);

    // Fill
    this.healthBarFill = this.scene.add.rectangle(x - barWidth / 2 + 2, y, barWidth - 4, barHeight - 4, 0xff0000);
    this.healthBarFill.setOrigin(0, 0.5);
    this.healthBarFill.setDepth(1001);

    // Text
    this.healthBarText = this.scene.add.text(x, y - 20, this.bossConfig.name, {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    this.healthBarText.setOrigin(0.5);
    this.healthBarText.setDepth(1001);

    // Container
    this.healthBar = this.scene.add.container(0, 0, [
      this.healthBarBackground,
      this.healthBarFill,
      this.healthBarText,
    ]);
  }

  /**
   * Update health bar
   */
  protected updateHealthBar(): void {
    if (!this.healthBarFill || !this.bossConfig) return;

    const healthPercent = Math.max(0, this.health / this.maxHealth);
    const barWidth = 400 - 4;
    this.healthBarFill.width = barWidth * healthPercent;

    // Change color based on health
    if (healthPercent > 0.66) {
      this.healthBarFill.setFillStyle(0x00ff00); // Green
    } else if (healthPercent > 0.33) {
      this.healthBarFill.setFillStyle(0xffff00); // Yellow
    } else {
      this.healthBarFill.setFillStyle(0xff0000); // Red
    }
  }

  /**
   * Play spawn animation
   */
  protected playSpawnAnimation(): void {
    // Scale up animation
    this.setScale(0);
    this.scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      ease: 'Back.easeOut',
    });
  }

  /**
   * Handle boss death
   */
  protected die(): void {
    this.isDead = true;
    this.setActive(false);

    // Play death animation
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        this.setVisible(false);
      },
    });

    // Emit boss defeated event
    if (this.bossConfig) {
      EventBus.emit('boss-defeated', {
        bossId: this.bossConfig.id,
        soulsReward: this.bossConfig.soulsReward,
      });
    }

    // Remove health bar
    if (this.healthBar) {
      this.healthBar.destroy();
      this.healthBar = null;
    }

    console.log(`[Boss] ${this.bossConfig?.name} defeated`);
  }

  /**
   * Get current health percentage
   */
  getHealthPercent(): number {
    return this.maxHealth > 0 ? this.health / this.maxHealth : 0;
  }

  /**
   * Check if boss is dead
   */
  isBossDead(): boolean {
    return this.isDead;
  }

  /**
   * Get current phase
   */
  getCurrentPhase(): number {
    return this.currentPhase;
  }

  /**
   * Get boss configuration
   */
  getBossConfig(): BossConfig | null {
    return this.bossConfig;
  }

  /**
   * Destroy boss and cleanup
   */
  destroy(): void {
    if (this.healthBar) {
      this.healthBar.destroy();
      this.healthBar = null;
    }
    super.destroy();
  }
}
