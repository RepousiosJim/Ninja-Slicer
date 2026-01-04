/**
 * PowerUp
 * 
 * Base class for all power-ups in the game.
 * Power-ups spawn like monsters and activate when sliced.
 */

import Phaser from 'phaser';
import type { PowerUpType } from '@config/types';
import { GRAVITY } from '@config/constants';

export abstract class PowerUp extends Phaser.Physics.Arcade.Sprite {
  protected powerUpType: PowerUpType;
  protected isSliced: boolean = false;
  protected glowEffect: Phaser.GameObjects.Graphics | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, type: PowerUpType) {
    super(scene, x, y, texture);
    
    this.powerUpType = type;
    this.isSliced = false;
    
    // Enable physics
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(false);
    
    // Set hitbox size
    if (this.body) {
      this.body.setSize(60, 60);
      this.body.setCircle(30);
    }
    
    // Create glow effect
    this.createGlowEffect();
  }

  /**
   * Spawn the power-up with initial velocity
   * @param x - Starting x position
   * @param y - Starting y position
   * @param velocityX - Horizontal velocity
   * @param velocityY - Vertical velocity
   */
  spawn(x: number, y: number, velocityX: number, velocityY: number): void {
    this.setPosition(x, y);
    this.setVelocity(velocityX, velocityY);
    this.isSliced = false;
    this.setActive(true);
    this.setVisible(true);
    this.setAlpha(1.0);
    
    // Update glow effect position
    if (this.glowEffect) {
      this.glowEffect.setPosition(x, y);
    }
  }

  /**
   * Update power-up physics and check bounds
   * @param time - Current time
   * @param delta - Time since last update
   */
  update(time: number, delta: number): void {
    // Apply gravity
    if (this.body) {
      this.setVelocityY(this.body.velocity.y + GRAVITY * (delta / 1000));
    }
    
    // Update glow effect position
    if (this.glowEffect) {
      this.glowEffect.setPosition(this.x, this.y);
    }
    
    // Check if power-up fell below screen
    if (this.y > 800) {
      this.destroy();
    }
  }

  /**
   * Called when power-up is sliced
   * Activates the power-up effect
   */
  slice(): void {
    if (this.isSliced) return;
    
    this.isSliced = true;
    
    // Create activation effect
    this.createActivationEffect();
    
    // Activate the power-up
    this.activate();
    
    // Destroy the power-up
    this.destroy();
  }

  /**
   * Create glow effect around power-up
   */
  private createGlowEffect(): void {
    this.glowEffect = this.scene.add.graphics();
    const glowColor = this.getGlowColor();
    this.glowEffect.fillStyle(glowColor, 0.3);
    this.glowEffect.fillCircle(0, 0, 40);
    this.glowEffect.setPosition(this.x, this.y);
    
    // Animate glow pulsing
    this.scene.tweens.add({
      targets: this.glowEffect,
      scale: 1.2,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Create activation effect when power-up is sliced
   */
  private createActivationEffect(): void {
    const activationColor = this.getGlowColor();
    
    // Create burst effect
    const burst = this.scene.add.graphics();
    burst.fillStyle(activationColor, 0.8);
    burst.fillCircle(0, 0, 50);
    burst.setPosition(this.x, this.y);
    
    // Animate burst expanding and fading
    this.scene.tweens.add({
      targets: burst,
      scale: 3,
      alpha: 0,
      duration: 300,
      ease: 'Quad.easeOut',
      onComplete: () => {
        burst.destroy();
      },
    });
  }

  /**
   * Activate the power-up effect
   * Override in subclasses
   */
  protected abstract activate(): void;

  /**
   * Get the glow color for this power-up
   * Override in subclasses
   */
  protected abstract getGlowColor(): number;

  /**
   * Get power-up type
   */
  getPowerUpType(): PowerUpType {
    return this.powerUpType;
  }

  /**
   * Check if power-up has been sliced
   */
  getIsSliced(): boolean {
    return this.isSliced;
  }

  /**
   * Override destroy to clean up properly
   */
  destroy(fromScene?: boolean): void {
    if (this.glowEffect) {
      this.glowEffect.destroy();
      this.glowEffect = null;
    }
    super.destroy(fromScene);
  }
}
