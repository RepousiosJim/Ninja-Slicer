/**
 * LevelCompleteScene
 *
 * Displays level completion results including score, stars earned, and souls awarded.
 * Provides navigation to next level, replay, or main menu.
 */

import Phaser from 'phaser';
import { SCENE_KEYS } from '@config/constants';

interface LevelCompleteData {
  world: number;
  level: number;
  score: number;
  stars: number;
  souls: number;
  stats: {
    monstersSliced: number;
    maxCombo: number;
    timeElapsed: number;
  };
}

export class LevelCompleteScene extends Phaser.Scene {
  private levelData: LevelCompleteData | null = null;
  private starSprites: Phaser.GameObjects.Rectangle[] = [];
  private scoreText: Phaser.GameObjects.Text | null = null;
  private soulsText: Phaser.GameObjects.Text | null = null;
  private statsText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super({ key: SCENE_KEYS.levelComplete });
  }

  create(data: LevelCompleteData): void {
    this.levelData = data;

    // Create background
    this.createBackground();

    // Create UI
    this.createUI();

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
  private createUI(): void {
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
    this.scoreText = this.add.text(centerX, centerY - 150, `Score: ${this.levelData.score}`, {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    this.scoreText.setOrigin(0.5);
    this.scoreText.setDepth(10);

    // Souls earned display
    this.soulsText = this.add.text(centerX, centerY - 100, `Souls Earned: ${this.levelData.souls}`, {
      fontSize: '28px',
      color: '#ffd700',
      fontStyle: 'bold',
    });
    this.soulsText.setOrigin(0.5);
    this.soulsText.setDepth(10);

    // Stats display
    const stats = this.levelData.stats;
    this.statsText = this.add.text(
      centerX,
      centerY - 40,
      `Monsters Sliced: ${stats.monstersSliced}\nMax Combo: ${stats.maxCombo}\nTime: ${Math.floor(stats.timeElapsed)}s`,
      {
        fontSize: '20px',
        color: '#cccccc',
      },
    );
    this.statsText.setOrigin(0.5);
    this.statsText.setDepth(10);

    // Star rating container
    const starContainer = this.add.container(centerX, centerY + 50);

    // Create 3 star placeholders (empty)
    for (let i = 0; i < 3; i++) {
      const star = this.add.rectangle(0, 0, 50, 50, 0x444444);
      star.setStrokeStyle(3, 0x666666);
      star.setPosition((i - 1) * 70, 0);
      star.setAlpha(0);
      starContainer.add(star);
      this.starSprites.push(star);
    }

    starContainer.setDepth(10);

    // Next Level button
    const nextButton = this.createButton(centerX, centerY + 150, 'NEXT LEVEL', () => {
      this.onNextLevel();
    });
    nextButton.setDepth(10);

    // Replay button
    const replayButton = this.createButton(centerX, centerY + 220, 'REPLAY', () => {
      this.onReplay();
    });
    replayButton.setDepth(10);

    // Menu button
    const menuButton = this.createButton(centerX, centerY + 290, 'MENU', () => {
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

    for (let i = 0; i < starsEarned; i++) {
      this.time.delayedCall(i * 300, () => {
        const star = this.starSprites[i];
        if (!star) return;

        star.setFillStyle(0xffd700);
        star.setStrokeStyle(3, 0xffaa00);

        // Pop animation
        star.setScale(0);
        this.tweens.add({
          targets: star,
          alpha: 1,
          scaleX: 1,
          scaleY: 1,
          duration: 300,
          ease: 'Back.easeOut',
        });

        // Play sound (if available)
        // this.sound.play('star');
      });
    }
  }

  /**
   * Go to next level
   */
  private onNextLevel(): void {
    if (!this.levelData) return;

    // Get next level
    const nextWorld = this.levelData.level === 5 ? this.levelData.world + 1 : this.levelData.world;
    const nextLevel = this.levelData.level === 5 ? 1 : this.levelData.level + 1;

    // Check if there's a next level
    if (nextWorld > 5) {
      // All levels complete, go to world select
      this.scene.start(SCENE_KEYS.worldSelect);
    } else {
      // Start next level
      this.scene.start(SCENE_KEYS.gameplay, {
        world: nextWorld,
        level: nextLevel,
      });
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
}
