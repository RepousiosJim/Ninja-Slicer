/**
 * Monster
 * 
 * Base class for all monsters in game.
 * Handles physics, spawning, and basic monster behavior.
 */

import Phaser from 'phaser';
import { MonsterType } from '@config/types';
import { GRAVITY, MONSTER_HITBOX_RADIUS, MONSTER_BASE_SPEED, MONSTER_BASE_POINTS } from '@config/constants';

export abstract class Monster extends Phaser.Physics.Arcade.Sprite {
  protected health: number;
  protected speed: number;
  protected points: number;
  protected isSliced: boolean;
  protected monsterType: MonsterType;
  protected initialVelocityX: number;
  protected initialVelocityY: number;

  // Effect properties
  protected burnDamage: number = 0;
  protected burnTimer: number = 0;
  protected burnInterval: number = 0;
  protected slowMultiplier: number = 1.0;
  protected slowTimer: number = 0;
  protected stunTimer: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, type: MonsterType) {
    super(scene, x, y, texture);

    this.monsterType = type;
    this.health = 1;
    this.speed = MONSTER_BASE_SPEED[type] || 1.0;
    this.points = MONSTER_BASE_POINTS[type] || 10;
    this.isSliced = false;
    this.initialVelocityX = 0;
    this.initialVelocityY = 0;

    // Add to scene
    scene.add.existing(this);

    // Enable physics
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(false);

    // Set hitbox size
    const hitboxRadius = MONSTER_HITBOX_RADIUS[type] || 40;
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setSize(hitboxRadius * 2, hitboxRadius * 2);
      body.setCircle(hitboxRadius);
    }

    // Add visual enhancements for better visibility
    this.enhanceVisibility();

    // Play idle animation if sheets exist
    this.createAnimations();
    this.playIdleAnimation();
  }

  /**
   * Enhance monster visibility with colored backgrounds
   */
  private enhanceVisibility(): void {
    // Create a colored circle background based on monster type
    let backgroundColor = 0x00ff00;
    let borderColor = 0xffffff;

    switch (this.monsterType) {
      case MonsterType.ZOMBIE:
        backgroundColor = 0x00ff00; // Bright green
        borderColor = 0x00aa00;
        break;
      case MonsterType.VAMPIRE:
        backgroundColor = 0xff0000; // Bright red
        borderColor = 0xaa0000;
        break;
      case MonsterType.GHOST:
        backgroundColor = 0x00ffff; // Bright cyan
        borderColor = 0x0088ff;
        break;
    }

    // Create background circle
    const background = this.scene.add.graphics();
    background.fillStyle(backgroundColor, 0.6);
    background.fillCircle(0, 0, 45);

    // Add border
    background.lineStyle(4, borderColor, 1);
    background.strokeCircle(0, 0, 45);

    // Convert to texture and add as sprite behind monster
    background.generateTexture(`monster_bg_${this.monsterType}`, 100, 100);
    background.destroy();

    // Create the background sprite
    const bgSprite = this.scene.add.sprite(this.x, this.y, `monster_bg_${this.monsterType}`);
    bgSprite.setDepth(49); // Just behind monster

    // Make background follow monster
    this.scene.events.on('update', () => {
      if (this.active && bgSprite.active) {
        bgSprite.setPosition(this.x, this.y);
        bgSprite.setRotation(this.rotation);
      } else if (bgSprite.active) {
        bgSprite.destroy();
      }
    });

    // Scale up monster for better visibility
    this.setScale(2.0); // Much larger!

    // Make sprite bright
    this.setTint(0xffffff);

    // Ensure sprite is on correct depth layer
    this.setDepth(50);
  }

  /**
   * Create monster animations
   */
  private createAnimations(): void {
    const animKey = `${this.monsterType}_idle`;
    if (!this.scene.anims.exists(animKey)) {
      let textureSheet = '';
      switch (this.monsterType) {
        case MonsterType.ZOMBIE: textureSheet = 'monster_zombie_sheet'; break;
        case MonsterType.VAMPIRE: textureSheet = 'monster_vampire_sheet'; break;
        case MonsterType.GHOST: textureSheet = 'monster_ghost_sheet'; break;
      }

      if (textureSheet && this.scene.textures.exists(textureSheet)) {
        this.scene.anims.create({
          key: animKey,
          frames: this.scene.anims.generateFrameNumbers(textureSheet, { start: 0, end: 3 }),
          frameRate: 8,
          repeat: -1
        });
      }
    }
  }

  /**
   * Play idle animation
   */
  private playIdleAnimation(): void {
    const animKey = `${this.monsterType}_idle`;
    if (this.scene.anims.exists(animKey)) {
      this.play(animKey);
    }
  }

  /**
   * Spawn monster with initial velocity
   * @param x - Starting x position
   * @param y - Starting y position
   * @param velocityX - Horizontal velocity
   * @param velocityY - Vertical velocity
   */
  spawn(x: number, y: number, velocityX: number, velocityY: number): void {
    this.setPosition(x, y);
    this.initialVelocityX = velocityX;
    this.initialVelocityY = velocityY;
    this.setVelocity(velocityX, velocityY);
    this.isSliced = false;
    this.health = this.getBaseHealth();
    this.setActive(true);
    this.setVisible(true);
    
    // Reset effects
    this.burnDamage = 0;
    this.burnTimer = 0;
    this.burnInterval = 0;
    this.slowMultiplier = 1.0;
    this.slowTimer = 0;
    this.stunTimer = 0;
  }

  /**
   * Update monster physics and check bounds
   * @param time - Current time
   * @param delta - Time since last update
   */
  update(time: number, delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    // Skip movement if stunned
    if (this.stunTimer > 0) {
      this.stunTimer -= delta;
      if (this.stunTimer <= 0) {
        this.stunTimer = 0;
      }

      // Still apply gravity when stunned
      this.setVelocityY(body.velocity.y + GRAVITY * (delta / 1000));

      // Check if monster fell below screen
      if (this.y > 800) {
        this.destroy();
      }
      return;
    }

    // Apply burn damage
    if (this.burnTimer > 0) {
      this.burnTimer -= delta;
      this.burnInterval += delta;
      
      // Apply burn damage every 0.5 seconds
      if (this.burnInterval >= 500) {
        this.applyDamage(this.burnDamage);
        this.burnInterval = 0;
      }
      
      if (this.burnTimer <= 0) {
        this.burnTimer = 0;
        this.burnDamage = 0;
      }
    }

    // Apply slow effect
    if (this.slowTimer > 0) {
      this.slowTimer -= delta;
      
      if (this.slowTimer <= 0) {
        this.slowTimer = 0;
        this.slowMultiplier = 1.0;
      }
    }

    // Apply gravity
    this.setVelocityY(body.velocity.y + GRAVITY * (delta / 1000));

    // Apply slow multiplier to horizontal velocity
    const currentVelocityX = body.velocity.x;
    if (currentVelocityX !== 0) {
      this.setVelocityX(currentVelocityX * this.slowMultiplier);
    }

    // Check if monster fell below screen
    if (this.y > 800) {
      this.destroy();
    }
  }

  /**
   * Called when monster is hit by a slash
   */
  slice(): void {
    if (this.isSliced) return;
    
    this.isSliced = true;
    this.health--;
    
    if (this.health <= 0) {
      this.onSliced();
    }
  }

  /**
   * Apply damage to monster
   */
  applyDamage(damage: number): void {
    this.health -= damage;
    
    if (this.health <= 0) {
      this.onSliced();
    }
  }

  /**
   * Apply burn effect
   */
  applyBurn(damage: number, duration: number): void {
    this.burnDamage = damage;
    this.burnTimer = duration * 1000;
    this.burnInterval = 0;
  }

  /**
   * Apply slow effect
   */
  applySlow(multiplier: number, duration: number): void {
    this.slowMultiplier = multiplier;
    this.slowTimer = duration * 1000;
  }

  /**
   * Apply stun effect
   */
  applyStun(duration: number): void {
    this.stunTimer = duration * 1000;
  }

  /**
   * Called when monster is destroyed by slicing
   * Override in subclasses for specific behavior
   */
  protected onSliced(): void {
    this.destroy();
  }

  /**
   * Get base health for this monster type
   * Override in subclasses
   */
  protected getBaseHealth(): number {
    return 1;
  }

  /**
   * Check if monster has been sliced
   */
  getIsSliced(): boolean {
    return this.isSliced;
  }

  /**
   * Get monster type
   */
  getMonsterType(): MonsterType {
    return this.monsterType;
  }

  /**
   * Get points value
   */
  getPoints(): number {
    return this.points;
  }

  /**
   * Get current health
   */
  getHealth(): number {
    return this.health;
  }

  /**
   * Get monster position
   */
  getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  /**
   * Override destroy to clean up properly
   */
  destroy(fromScene?: boolean): void {
    super.destroy(fromScene);
  }
}
