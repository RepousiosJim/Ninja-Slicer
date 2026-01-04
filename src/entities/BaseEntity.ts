/**
 * Base Entity Class
 * Provides common functionality for all game entities (monsters, power-ups, etc.)
 * Standardizes initialization, damage handling, and destruction
 * 
 * @example
 * ```typescript
 * class Zombie extends BaseEntity {
 *   constructor(scene: Phaser.Scene, x: number, y: number) {
 *     super(scene, x, y, {
 *       health: 100,
 *       maxHealth: 100,
 *     });
 *     
 *     this.setTexture('zombie');
 *     this.setupBehavior();
 *   }
 *   
 *   protected setupBehavior(): void {
 *     // Custom zombie behavior
 *   }
 * }
 * ```
 */
import Phaser from 'phaser';

export interface EntityConfig {
  health: number;
  maxHealth?: number;
  isDead?: boolean;
}

export abstract class BaseEntity extends Phaser.GameObjects.Sprite {
  protected health: number;
  protected maxHealth: number;
  protected isDead: boolean = false;
  protected spawnTime: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, config: EntityConfig) {
    super(scene, x, y, 'monster_placeholder');

    this.health = config.health;
    this.maxHealth = config.maxHealth || config.health;
    this.isDead = config.isDead || false;
    this.spawnTime = scene.time.now;
  }

  /**
   * Take damage
   * @param damage - Amount of damage to take
   * @returns true if entity died from this damage
   */
  public takeDamage(damage: number): boolean {
    if (this.isDead) return false;

    this.health -= damage;

    if (this.health <= 0) {
      this.health = 0;
      this.die();
      return true;
    }

    this.onDamageTaken(damage);
    return false;
  }

  /**
   * Heal entity
   * @param amount - Amount of health to restore
   */
  public heal(amount: number): void {
    if (this.isDead) return;

    this.health = Math.min(this.maxHealth, this.health + amount);
    this.onHealed(amount);
  }

  /**
   * Kill entity immediately
   */
  public kill(): void {
    if (this.isDead) return;

    this.health = 0;
    this.die();
  }

  /**
   * Die - override in subclasses for custom death logic
   */
  protected die(): void {
    this.isDead = true;
    this.playDeathAnimation();
    this.dropLoot();
    this.destroy();
  }

  /**
   * Play death animation - override in subclasses
   */
  protected playDeathAnimation(): void {
    // Default: Scale down and fade out
    this.scene.tweens.add({
      targets: this,
      scale: { from: 1, to: 1.5 },
      alpha: { from: 1, to: 0 },
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => this.destroy(),
    });
  }

  /**
   * Drop loot - override in subclasses
   */
  protected dropLoot(): void {
    // Override in subclasses to drop items
  }

  /**
   * Called when damage is taken - override in subclasses
   */
  protected onDamageTaken(damage: number): void {
    // Override for visual effects, sound, etc.
  }

  /**
   * Called when entity is healed - override in subclasses
   */
  protected onHealed(amount: number): void {
    // Override for visual effects, sound, etc.
  }

  /**
   * Check if entity is alive
   */
  public isAlive(): boolean {
    return !this.isDead && this.health > 0;
  }

  /**
   * Get health percentage (0-100)
   */
  public getHealthPercentage(): number {
    return (this.health / this.maxHealth) * 100;
  }

  /**
   * Get time alive since spawn
   */
  public getTimeAlive(): number {
    return (this.scene.time.now - this.spawnTime) / 1000;
  }

  /**
   * Reset entity to initial state
   */
  public reset(): void {
    this.health = this.maxHealth;
    this.isDead = false;
    this.setActive(true);
    this.setVisible(true);
    this.setAlpha(1);
    this.setScale(1);
  }

  /**
   * Disable entity without destroying
   */
  public disable(): void {
    this.setActive(false);
    this.setVisible(false);
  }
}
