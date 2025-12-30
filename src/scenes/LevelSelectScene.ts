/**
 * LevelSelectScene
 *
 * Displays levels for a selected world.
 * Shows star ratings and allows navigation between levels.
 */

import Phaser from 'phaser';
import { SCENE_KEYS } from '@config/constants';
import { levelManager } from '../managers/LevelManager';

export class LevelSelectScene extends Phaser.Scene {
  private currentWorld: number = 1;
  private currentLevel: number = 1;
  private levelCard: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: SCENE_KEYS.levelSelect });
  }

  create(data: { world: number }): void {
    this.currentWorld = data.world || 1;
    this.currentLevel = 1;

    // Create background
    this.createBackground();

    // Create title
    this.createTitle();

    // Create level card
    this.createLevelCard();

    // Create navigation buttons
    this.createNavigationButtons();

    // Create play button
    this.createPlayButton();

    // Create back button
    this.createBackButton();
  }

  /**
   * Create background
   */
  private createBackground(): void {
    // Gradient background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
    bg.fillRect(0, 0, this.scale.width, this.scale.height);
    bg.setDepth(0);
  }

  /**
   * Create title
   */
  private createTitle(): void {
    const worldConfig = levelManager.getWorldConfig(this.currentWorld);
    const worldName = worldConfig?.name || `World ${this.currentWorld}`;

    const title = this.add.text(this.scale.width / 2, 60, worldName, {
      fontSize: '36px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });
    title.setOrigin(0.5);
    title.setDepth(10);
  }

  /**
   * Create level card
   */
  private createLevelCard(): void {
    const cardWidth = 300;
    const cardHeight = 400;
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    const levelConfig = levelManager.getLevelConfig(this.currentWorld, this.currentLevel);
    const isUnlocked = levelManager.isLevelUnlocked(this.currentWorld, this.currentLevel);
    const stars = levelManager.getLevelStars(this.currentWorld, this.currentLevel);

    // Card background
    const bg = this.add.rectangle(0, 0, cardWidth, cardHeight, isUnlocked ? 0x2d2d44 : 0x1a1a1a);
    bg.setStrokeStyle(3, isUnlocked ? 0x8b0000 : 0x444444);

    // Level number
    const levelNum = this.add.text(0, -cardHeight / 2 + 40, `LEVEL ${this.currentLevel}`, {
      fontSize: '28px',
      color: isUnlocked ? '#ffffff' : '#666666',
      fontStyle: 'bold',
    });
    levelNum.setOrigin(0.5);

    // Level name
    const levelName = this.add.text(0, -cardHeight / 2 + 90, levelConfig?.name || 'Unknown', {
      fontSize: '22px',
      color: isUnlocked ? '#cccccc' : '#555555',
      wordWrap: { width: cardWidth - 30 },
    });
    levelName.setOrigin(0.5);

    // Level description
    const levelDesc = this.add.text(0, -cardHeight / 2 + 140, levelConfig?.description || '', {
      fontSize: '16px',
      color: isUnlocked ? '#888888' : '#444444',
      wordWrap: { width: cardWidth - 30 },
    });
    levelDesc.setOrigin(0.5);

    // Star rating
    const starContainer = this.add.container(0, -cardHeight / 2 + 200);
    for (let i = 0; i < 3; i++) {
      const star = this.add.image((i - 1) * 50, 0, i < stars ? 'ui_star_full' : 'ui_star_empty');
      star.setScale(1.2);
      starContainer.add(star);
    }

    // Star count text
    const starText = this.add.text(0, -cardHeight / 2 + 240, `${stars} / 3 Stars`, {
      fontSize: '18px',
      color: '#ffd700',
      fontStyle: 'bold',
    });
    starText.setOrigin(0.5);

    // Lock icon (if locked)
    let lockIcon: Phaser.GameObjects.Image | null = null;
    if (!isUnlocked) {
      lockIcon = this.add.image(0, 0, 'ui_lock');
      lockIcon.setScale(1.5);
    }

    // Container
    this.levelCard = this.add.container(centerX, centerY, [
      bg,
      levelNum,
      levelName,
      levelDesc,
      starContainer,
      starText,
    ]);

    if (lockIcon) {
      this.levelCard.add(lockIcon);
    }
  }

  /**
   * Create navigation buttons
   */
  private createNavigationButtons(): void {
    const buttonSize = 60;
    const y = this.scale.height / 2;

    // Previous level button
    const prevButton = this.createArrowButton(100, y, 'left', () => {
      this.onPreviousLevel();
    });

    // Next level button
    const nextButton = this.createArrowButton(this.scale.width - 100, y, 'right', () => {
      this.onNextLevel();
    });
  }

  /**
   * Create an arrow button
   */
  private createArrowButton(
    x: number,
    y: number,
    direction: 'left' | 'right',
    onClick: () => void,
  ): Phaser.GameObjects.Container {
    // Button background image
    const bg = this.add.image(0, 0, direction === 'left' ? 'ui_arrow_left' : 'ui_arrow_right');
    bg.setScale(1.2);

    // Container
    const container = this.add.container(x, y, [bg]);

    // Make interactive
    bg.setInteractive({ useHandCursor: true });

    // Hover effect
    bg.on('pointerover', () => {
      this.tweens.add({
        targets: container,
        scaleX: 1.15,
        scaleY: 1.15,
        duration: 100,
      });
    });

    bg.on('pointerout', () => {
      this.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
      });
    });

    // Click effect
    bg.on('pointerdown', () => {
      this.tweens.add({
        targets: container,
        scaleX: 0.9,
        scaleY: 0.9,
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
   * Create play button
   */
  private createPlayButton(): void {
    const buttonWidth = 200;
    const buttonHeight = 60;
    const x = this.scale.width / 2;
    const y = this.scale.height - 180;

    // Button background
    const bg = this.add.rectangle(0, 0, buttonWidth, buttonHeight, 0x44ff44);
    bg.setStrokeStyle(3, 0xffffff);

    // Button text
    const text = this.add.text(0, 0, 'PLAY', {
      fontSize: '28px',
      color: '#000000',
      fontStyle: 'bold',
    });
    text.setOrigin(0.5);

    // Container
    const container = this.add.container(x, y, [bg, text]);

    // Make interactive
    bg.setInteractive({ useHandCursor: true });

    // Hover effect
    bg.on('pointerover', () => {
      bg.setFillStyle(0x66ff66);
      this.tweens.add({
        targets: container,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
      });
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(0x44ff44);
      this.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
      });
    });

    // Click effect
    bg.on('pointerdown', () => {
      bg.setFillStyle(0x33cc33);
      this.tweens.add({
        targets: container,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 50,
        yoyo: true,
        onComplete: () => {
          this.onPlay();
        },
      });
    });
  }

  /**
   * Create back button
   */
  private createBackButton(): void {
    const buttonWidth = 150;
    const buttonHeight = 50;
    const x = this.scale.width / 2;
    const y = this.scale.height - 60;

    // Button background
    const bg = this.add.rectangle(0, 0, buttonWidth, buttonHeight, 0x8b0000);
    bg.setStrokeStyle(3, 0xffffff);

    // Button text
    const text = this.add.text(0, 0, 'BACK', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    text.setOrigin(0.5);

    // Container
    const container = this.add.container(x, y, [bg, text]);

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
          this.onBack();
        },
      });
    });
  }

  /**
   * Update level card for current level
   */
  private updateLevelCard(): void {
    if (this.levelCard) {
      this.levelCard.destroy();
    }
    this.createLevelCard();
  }

  /**
   * Navigate to previous level
   */
  private onPreviousLevel(): void {
    if (this.currentLevel > 1) {
      this.currentLevel--;
      this.updateLevelCard();
    } else if (this.currentWorld > 1) {
      // Go to previous world's last level
      this.currentWorld--;
      this.currentLevel = 5;
      this.createTitle();
      this.updateLevelCard();
    }
  }

  /**
   * Navigate to next level
   */
  private onNextLevel(): void {
    if (this.currentLevel < 5) {
      this.currentLevel++;
      this.updateLevelCard();
    } else if (this.currentWorld < 5) {
      // Go to next world's first level
      this.currentWorld++;
      this.currentLevel = 1;
      this.createTitle();
      this.updateLevelCard();
    }
  }

  /**
   * Start level
   */
  private onPlay(): void {
    const isUnlocked = levelManager.isLevelUnlocked(this.currentWorld, this.currentLevel);
    if (isUnlocked) {
      this.scene.start(SCENE_KEYS.gameplay, {
        world: this.currentWorld,
        level: this.currentLevel,
      });
    }
  }

  /**
   * Go back to world select
   */
  private onBack(): void {
    this.scene.start(SCENE_KEYS.worldSelect);
  }
}
