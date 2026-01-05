/**
 * LevelCompleteScene
 *
 * Displays level completion results including score, stars earned, and souls awarded.
 * Provides navigation to next level, replay, or main menu.
 */

import Phaser from 'phaser';
import { SCENE_KEYS, LEVEL_COMPLETE_SOULS } from '@config/constants';
import { SaveManager } from '../managers/SaveManager';

interface LevelCompleteData {
  world: number;
  level: number;
  score: number;
  stars: number;
  souls: number;
  previousStars?: number;
  stats: {
    monstersSliced: number;
    maxCombo: number;
    timeElapsed: number;
  };
}

export class LevelCompleteScene extends Phaser.Scene {
  private levelData: LevelCompleteData | null = null;
  private starSprites: (Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle)[] = [];
  private scoreText: Phaser.GameObjects.Text | null = null;
  private soulsText: Phaser.GameObjects.Text | null = null;
  private bonusSoulsText: Phaser.GameObjects.Text | null = null;
  private statsText: Phaser.GameObjects.Text | null = null;
  private saveManager: SaveManager;

  constructor() {
    super({ key: SCENE_KEYS.levelComplete });
    this.saveManager = new SaveManager();
  }

  /**
   * Calculate the level completion soul bonus based on world
   * Formula: LEVEL_COMPLETE_SOULS.base + (world * LEVEL_COMPLETE_SOULS.perWorld)
   */
  private calculateLevelCompletionBonus(world: number): number {
    return LEVEL_COMPLETE_SOULS.base + (world * LEVEL_COMPLETE_SOULS.perWorld);
  }

  create(data: LevelCompleteData): void {
    this.levelData = data;

    // Calculate level completion bonus souls
    const bonusSouls = this.calculateLevelCompletionBonus(data.world);

    // Total souls = souls earned from gameplay + level completion bonus
    const totalSouls = data.souls + bonusSouls;

    // Add total souls to player's save
    this.saveManager.addSouls(totalSouls);

    // Create background
    this.createBackground();

    // Create UI with bonus calculation
    this.createUI(bonusSouls, totalSouls);

    // Animate stars
    this.time.delayedCall(500, () => {
      this.animateStars();
    });
  }

  /**
   * Create background
   */
  private createBackground(): void {
    // Dark semi-transparent background
    const bg = this.add.rectangle(
      this.scale.width / 2,
      this.scale.height / 2,
      this.scale.width,
      this.scale.height,
      0x000000,
      0.8,
    );
    bg.setDepth(0);
  }

  /**
   * Create UI elements
   */
  private createUI(bonusSouls: number, totalSouls: number): void {
    if (!this.levelData) return;

    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    // Title
    const title = this.add.text(centerX, centerY - 250, 'LEVEL COMPLETE', {
      fontSize: '64px',
      color: '#44ff44',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    });
    title.setOrigin(0.5);
    title.setDepth(10);

    // Score display
    this.scoreText = this.add.text(centerX, centerY - 170, `Score: ${this.levelData.score}`, {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    this.scoreText.setOrigin(0.5);
    this.scoreText.setDepth(10);

    // Souls earned from gameplay display
    this.soulsText = this.add.text(centerX, centerY - 105, `Souls from Slicing: ${this.levelData.souls}`, {
      fontSize: '24px',
      color: '#ffd700',
      fontStyle: 'bold',
    });
    this.soulsText.setOrigin(0.5);
    this.soulsText.setDepth(10);

    // Level completion bonus souls display
    this.bonusSoulsText = this.add.text(
      centerX,
      centerY - 75,
      `Level Bonus: +${bonusSouls}`,
      {
        fontSize: '24px',
        color: '#00ffaa',
        fontStyle: 'bold',
      },
    );
    this.bonusSoulsText.setOrigin(0.5);
    this.bonusSoulsText.setDepth(10);

    // Total souls earned display
    const totalSoulsText = this.add.text(
      centerX,
      centerY - 40,
      `Total Souls: ${totalSouls}`,
      {
        fontSize: '28px',
        color: '#ffd700',
        fontStyle: 'bold',
      },
    );
    totalSoulsText.setOrigin(0.5);
    totalSoulsText.setDepth(10);

    // Stats display
    const stats = this.levelData.stats;
    this.statsText = this.add.text(
      centerX,
      centerY + 15,
      `Monsters Sliced: ${stats.monstersSliced}\nMax Combo: ${stats.maxCombo}\nTime: ${Math.floor(stats.timeElapsed)}s`,
      {
        fontSize: '18px',
        color: '#cccccc',
      },
    );
    this.statsText.setOrigin(0.5);
    this.statsText.setDepth(10);

    // Star rating container
    const starContainer = this.add.container(centerX, centerY + 80);

    // Create 3 star placeholders (empty stars)
    for (let i = 0; i < 3; i++) {
      const star = this.add.image((i - 1) * 70, 0, 'ui_star_empty');
      star.setScale(1.2);
      star.setAlpha(0);
      starContainer.add(star);
      this.starSprites.push(star as any);
    }

    starContainer.setDepth(10);

    // Next Level button
    const nextButton = this.createButton(centerX, centerY + 170, 'NEXT LEVEL', () => {
      this.onNextLevel();
    });
    nextButton.setDepth(10);

    // Replay button
    const replayButton = this.createButton(centerX, centerY + 230, 'REPLAY', () => {
      this.onReplay();
    });
    replayButton.setDepth(10);

    // Menu button
    const menuButton = this.createButton(centerX, centerY + 340, 'MENU', () => {
      this.onMenu();
    });
    menuButton.setDepth(10);
  }

  /**
   * Create a button
   */
  private createButton(x: number, y: number, text: string, onClick: () => void): Phaser.GameObjects.Container {
    const buttonWidth = 200;
    const buttonHeight = 50;

    // Button background
    const bg = this.add.rectangle(0, 0, buttonWidth, buttonHeight, 0x8b0000);
    bg.setStrokeStyle(3, 0xffffff);

    // Button text
    const buttonText = this.add.text(0, 0, text, {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    buttonText.setOrigin(0.5);

    // Container
    const container = this.add.container(x, y, [bg, buttonText]);

    // Make interactive
    bg.setInteractive({ useHandCursor: true });

    // Hover effect
    bg.on('pointerover', () => {
      bg.setFillStyle(0xaa0000);
      this.tweens.add({
        targets: container,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
      });
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(0x8b0000);
      this.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
      });
    });

    // Click effect
    bg.on('pointerdown', () => {
      bg.setFillStyle(0x550000);
      this.tweens.add({
        targets: container,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 50,
        yoyo: true,
        onComplete: () => {
          onClick();
        },
      });
    });

    return container;
  }

  /**
   * Animate star rating reveal
   */
  private animateStars(): void {
    if (!this.levelData) return;

    const starsEarned = this.levelData.stars;
    const isPerfect = starsEarned === 3;

    for (let i = 0; i < starsEarned; i++) {
      this.time.delayedCall(i * 300, () => {
        const star = this.starSprites[i] as Phaser.GameObjects.Image;
        if (!star) return;

        // Change texture from empty to full
        star.setTexture('ui_star_full');
        star.setScale(1.2);

        // Pop animation
        this.tweens.add({
          targets: star,
          alpha: 1,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 300,
          ease: 'Back.easeOut',
        });

        // Play sound (if available)
        const audioManager = (this as any).audioManager;
        if (audioManager) {
          audioManager.playSFX('uiClick');
        }

        // Trigger 3-star celebration on final star
        if (isPerfect && i === 2) {
          this.time.delayedCall(300, () => {
            this.triggerThreeStarCelebration();
          });
        }
      });
    }
  }

  /**
   * Trigger special celebration for 3-star achievement
   */
  private triggerThreeStarCelebration(): void {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    // Screen shake
    this.cameras.main.shake(800, 0.03);

    // "PERFECT!" text popup
    this.perfectText = this.add.text(centerX, centerY - 400, '★ PERFECT! ★', {
      fontSize: '72px',
      color: '#ffd700',
      fontStyle: 'bold',
      stroke: '#8b0000',
      strokeThickness: 8,
      shadow: {
        offsetX: 4,
        offsetY: 4,
        color: '#000000',
        blur: 8,
        fill: true
      }
    });
    this.perfectText.setOrigin(0.5);
    this.perfectText.setDepth(100);
    this.perfectText.setScale(0);

    // Animate perfect text
    this.tweens.add({
      targets: this.perfectText,
      scaleX: 1,
      scaleY: 1,
      duration: 600,
      ease: 'Elastic.easeOut',
      yoyo: true,
      repeat: -1,
      yoyoOnComplete: false,
      onYoyo: () => {
        this.tweens.add({
          targets: this.perfectText,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 400,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1,
          hold: 1000
        });
      }
    });

    // Gold particle explosion
    const particleSystem = new ParticleSystem(this);

    // Create multiple bursts around the stars
    for (let i = 0; i < 5; i++) {
      this.time.delayedCall(i * 100, () => {
        const x = centerX + Phaser.Math.Between(-200, 200);
        const y = centerY + Phaser.Math.Between(-50, 150);
        
        particleSystem.emit({
          type: ParticleType.SPARKLE,
          x: x,
          y: y,
          count: 30,
        });
      });
    }

    // Gold confetti rain
    for (let i = 0; i < 20; i++) {
      this.time.delayedCall(i * 50, () => {
        const x = Phaser.Math.Between(100, 1180);
        const y = -50;

        particleSystem.emit({
          type: ParticleType.SPARKLE,
          x: x,
          y: y,
          count: 15,
        });
      });
    }

    // Star glow effect
    this.starSprites.forEach((star, index) => {
      this.time.delayedCall(index * 100, () => {
        this.tweens.add({
          targets: star,
          scale: 1.3,
          duration: 200,
          ease: 'Back.easeOut',
          yoyo: true,
          repeat: 3,
          repeatDelay: 100
        });
      });
    });
  }

  /**
   * Go to next level
   */
  private onNextLevel(): void {
    if (!this.levelData) return;

    // Check if completing world's final level
    if (this.levelData.level === 5) {
      this.showWorldCompletion();
      return;
    }

    // Otherwise, go to next level normally
    const nextWorld = this.levelData.level === 5 ? this.levelData.world + 1 : this.levelData.world;
    const nextLevel = this.levelData.level === 5 ? 1 : this.levelData.level + 1;

    if (nextWorld > 5) {
      this.scene.start(SCENE_KEYS.worldSelect);
    } else {
      this.scene.start(SCENE_KEYS.gameplay, {
        world: nextWorld,
        level: nextLevel,
      });
    }
  }

  private showWorldCompletion(): void {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    // "WORLD COMPLETE" badge
    const badge = this.add.rectangle(centerX, centerY, 400, 200, 0x44ff44);
    badge.setStrokeStyle(4, 0xffffff);
    badge.setDepth(20);

    const text = this.add.text(centerX, centerY, 'WORLD COMPLETE!', {
      fontSize: '48px',
      color: '#000000',
      fontStyle: 'bold',
    });
    text.setOrigin(0.5);
    text.setDepth(21);

    // Confetti particles
    const particleSystem = new ParticleSystem(this);

    for (let i = 0; i < 10; i++) {
      this.time.delayedCall(i * 100, () => {
        const x = Phaser.Math.Between(100, 1180);
        const y = Phaser.Math.Between(100, 620);
        particleSystem.emit({
          type: ParticleType.SPARKLE,
          x: x,
          y: y,
          count: 20,
        });
      });
    }

    // Play sound
    const audioManager = (this as any).audioManager;
    if (audioManager) {
      audioManager.playSFX('uiClick');
    }

    // Fade out and continue after 2 seconds
    this.time.delayedCall(2000, () => {
      badge.destroy();
      text.destroy();
      this.onNextLevelAfterCelebration();
    });
  }

  private onNextLevelAfterCelebration(): void {
    if (!this.levelData) return;

    const nextWorld = this.levelData.world + 1;

    if (nextWorld > 5) {
      // All worlds complete - go to campaign complete
      this.scene.start(SCENE_KEYS.campaignComplete);
    } else {
      // Go to world select for next world
      this.scene.start(SCENE_KEYS.worldSelect);
    }
  }

  /**
   * Replay current level
   */
  private onReplay(): void {
    if (!this.levelData) return;

    this.scene.start(SCENE_KEYS.gameplay, {
      world: this.levelData.world,
      level: this.levelData.level,
    });
  }

  /**
   * Go to main menu
   */
  private onMenu(): void {
    this.scene.start(SCENE_KEYS.worldSelect);
  }

  /**
   * Cleanup when scene is shutting down
   */
  shutdown(): void {
    // Destroy perfect text if exists
    if (this.perfectText) {
      this.perfectText.destroy();
      this.perfectText = null;
    }
    // Destroy high score text if exists
    if (this.highScoreText) {
      this.highScoreText.destroy();
      this.highScoreText = null;
    }
  }
}
