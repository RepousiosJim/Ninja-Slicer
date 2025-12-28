/**
 * Villager
 * 
 * Non-hostile entity that should NOT be sliced.
 * Slicing a villager applies a score penalty.
 * Does NOT count as "missed" for lives.
 */

import Phaser from 'phaser';
import { GRAVITY } from '@config/constants';
import { EventBus } from '@utils/EventBus';

export class Villager extends Phaser.Physics.Arcade.Sprite {
  private speed: number;
  private isSliced: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string = 'villager_1') {
    super(scene, x, y, texture);

    this.speed = 0.7;
    this.isSliced = false;

    // Add to scene
    scene.add.existing(this);

    // Enable physics
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(false);

    // Set hitbox size
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setSize(70, 70);
      body.setCircle(35);
    }

    // Make villagers VERY visible and distinct
    this.enhanceVisibility();

    this.createAnimations(texture);
  }

  /**
   * Make villagers highly visible and distinct from monsters
   */
  private enhanceVisibility(): void {
    // Create BRIGHT YELLOW background - WARNING: DON'T SLICE!
    const backgroundColor = 0xffff00; // Bright yellow
    const borderColor = 0xffffff; // White border

    // Create background circle
    const background = this.scene.add.graphics();
    background.fillStyle(backgroundColor, 0.8); // More opaque
    background.fillCircle(0, 0, 40);

    // Add thick white border
    background.lineStyle(6, borderColor, 1);
    background.strokeCircle(0, 0, 40);

    // Add another inner circle for emphasis
    background.lineStyle(3, 0xff8800, 1);
    background.strokeCircle(0, 0, 32);

    // Convert to texture
    background.generateTexture('villager_bg', 90, 90);
    background.destroy();

    // Create the background sprite
    const bgSprite = this.scene.add.sprite(this.x, this.y, 'villager_bg');
    bgSprite.setDepth(49); // Just behind villager

    // Make background follow villager
    this.scene.events.on('update', () => {
      if (this.active && bgSprite.active) {
        bgSprite.setPosition(this.x, this.y);
      } else if (bgSprite.active) {
        bgSprite.destroy();
      }
    });

    // Scale up for visibility
    this.setScale(1.8);

    // Add a pulsing effect to make them REALLY stand out
    this.scene.tweens.add({
      targets: bgSprite,
      scale: 1.3,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Make sprite bright
    this.setTint(0xffffff);

    // Ensure on correct depth
    this.setDepth(50);
  }

  /**
   * Spawn the villager with velocity
   */
  spawn(x: number, y: number, velocityX: number, velocityY: number): void {
    this.setPosition(x, y);
    this.setVelocity(velocityX, velocityY);
  }

  /**
   * Create villager animations
   */
  private createAnimations(texture: string): void {
    const animKey = `${texture}_idle`;
    if (!this.scene.anims.exists(animKey)) {
      let sheetKey = '';
      if (texture === 'villager_1') sheetKey = 'villager_male_sheet';
      else if (texture === 'villager_female') sheetKey = 'villager_female_sheet';
      else if (texture === 'villager_elder') sheetKey = 'villager_elder_sheet';

      if (sheetKey && this.scene.textures.exists(sheetKey)) {
        this.scene.anims.create({
          key: animKey,
          frames: this.scene.anims.generateFrameNumbers(sheetKey, { start: 0, end: 1 }),
          frameRate: 4,
          repeat: -1
        });
        
        this.scene.anims.create({
          key: `${texture}_panic`,
          frames: this.scene.anims.generateFrameNumbers(sheetKey, { start: 2, end: 5 }),
          frameRate: 10,
          repeat: -1
        });
        
        this.play(animKey);
      }
    }
  }

  /**
   * Update villager physics and check bounds
   * @param time - Current time
   * @param delta - Time since last update
   */
  update(time: number, delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    // Apply gravity
    this.setVelocityY(body.velocity.y + GRAVITY * (delta / 1000));

    // If falling fast, play panic animation
    if (body.velocity.y > 100) {
      const panicKey = `${this.texture.key}_panic`;
      if (this.scene.anims.exists(panicKey) && this.anims.currentAnim?.key !== panicKey) {
        this.play(panicKey);
      }
    }

    // Check if villager fell below screen
    if (this.y > 800) {
      this.destroy();
    }
  }

  /**
   * Called when villager is hit by a slash
   * Applies penalty and visual feedback
   */
  slice(): void {
    if (this.isSliced) return;
    
    this.isSliced = true;
    
    // Create visual feedback
    this.createPenaltyFeedback();
    
    // Emit villager sliced event
    EventBus.emit('villager-sliced', {
      position: { x: this.x, y: this.y },
      penalty: 100,
    });
    
    // Destroy the villager
    this.destroy();
  }

  /**
   * Create visual feedback for penalty
   */
  private createPenaltyFeedback(): void {
    // Red flash effect
    const flash = this.scene.add.graphics();
    flash.fillStyle(0xff0000, 0.8);
    flash.fillCircle(this.x, this.y, 50);
    
    // Fade out and destroy
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        flash.destroy();
      },
    });

    // Shake effect
    this.scene.cameras.main.shake(100, 0.01);

    // Penalty text
    const penaltyText = this.scene.add.text(
      this.x,
      this.y - 50,
      '-100',
      {
        fontSize: '48px',
        color: '#ff0000',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      }
    );
    penaltyText.setOrigin(0.5);

    // Animate penalty text floating up and fading
    this.scene.tweens.add({
      targets: penaltyText,
      y: this.y - 150,
      alpha: 0,
      duration: 800,
      ease: 'Quad.easeOut',
      onComplete: () => {
        penaltyText.destroy();
      },
    });
  }

  /**
   * Check if villager has been sliced
   */
  getIsSliced(): boolean {
    return this.isSliced;
  }

  /**
   * Override destroy to clean up properly
   */
  destroy(fromScene?: boolean): void {
    super.destroy(fromScene);
  }
}
