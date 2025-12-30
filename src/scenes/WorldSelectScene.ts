/**
 * WorldSelectScene
 *
 * Displays all 5 worlds with completion status.
 * Allows navigation to level selection for each world.
 */

import Phaser from 'phaser';
import { SCENE_KEYS } from '@config/constants';
import { levelManager } from '../managers/LevelManager';

export class WorldSelectScene extends Phaser.Scene {
  private worldCards: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: SCENE_KEYS.worldSelect });
  }

  async create(): Promise<void> {
    // Ensure level data is loaded
    await levelManager.loadLevels();

    // Create background
    this.createBackground();

    // Create title
    this.createTitle();

    // Create world cards
    this.createWorldCards();

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
    const title = this.add.text(this.scale.width / 2, 60, 'SELECT WORLD', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });
    title.setOrigin(0.5);
    title.setDepth(10);
  }

  /**
   * Create world cards
   */
  private createWorldCards(): void {
    const worlds = levelManager.getAllWorlds();
    const cardWidth = 200;
    const cardHeight = 280;
    const gap = 30;
    const totalWidth = worlds.length * cardWidth + (worlds.length - 1) * gap;
    const startX = (this.scale.width - totalWidth) / 2 + cardWidth / 2;
    const startY = 200;

    worlds.forEach((world, index) => {
      const x = startX + index * (cardWidth + gap);
      const y = startY;

      const card = this.createWorldCard(x, y, world);
      this.worldCards.push(card);
    });
  }

  /**
   * Create a single world card
   */
  private createWorldCard(x: number, y: number, world: any): Phaser.GameObjects.Container {
    const cardWidth = 200;
    const cardHeight = 280;
    const isUnlocked = levelManager.isWorldUnlocked(world.id);
    const progress = levelManager.getWorldProgress(world.id);

    // Card background
    const bg = this.add.rectangle(0, 0, cardWidth, cardHeight, isUnlocked ? 0x2d2d44 : 0x1a1a1a);
    bg.setStrokeStyle(3, isUnlocked ? 0x8b0000 : 0x444444);

    // World number
    const worldNum = this.add.text(0, -cardHeight / 2 + 30, `WORLD ${world.id}`, {
      fontSize: '20px',
      color: isUnlocked ? '#ffffff' : '#666666',
      fontStyle: 'bold',
    });
    worldNum.setOrigin(0.5);

    // World name
    const worldName = this.add.text(0, -cardHeight / 2 + 70, world.name, {
      fontSize: '18px',
      color: isUnlocked ? '#cccccc' : '#555555',
      wordWrap: { width: cardWidth - 20 },
    });
    worldName.setOrigin(0.5);

    // World description
    const worldDesc = this.add.text(0, -cardHeight / 2 + 110, world.description, {
      fontSize: '14px',
      color: isUnlocked ? '#888888' : '#444444',
      wordWrap: { width: cardWidth - 20 },
    });
    worldDesc.setOrigin(0.5);

    // Progress bar background
    const progressBg = this.add.rectangle(0, -cardHeight / 2 + 160, cardWidth - 40, 10, 0x000000);
    progressBg.setStrokeStyle(1, 0x444444);

    // Progress bar fill
    const progressFill = this.add.rectangle(
      -cardWidth / 2 + 20 + (cardWidth - 40) * (progress / 100) / 2,
      -cardHeight / 2 + 160,
      (cardWidth - 40) * (progress / 100),
      8,
      0x44ff44,
    );
    progressFill.setOrigin(0, 0.5);

    // Progress text
    const progressText = this.add.text(0, -cardHeight / 2 + 185, `${progress}%`, {
      fontSize: '16px',
      color: '#44ff44',
      fontStyle: 'bold',
    });
    progressText.setOrigin(0.5);

    // Lock icon (if locked)
    let lockIcon: Phaser.GameObjects.Text | null = null;
    if (!isUnlocked) {
      lockIcon = this.add.text(0, 0, '🔒', {
        fontSize: '48px',
      });
      lockIcon.setOrigin(0.5);
    }

    // Container
    const container = this.add.container(x, y, [
      bg,
      worldNum,
      worldName,
      worldDesc,
      progressBg,
      progressFill,
      progressText,
    ]);

    if (lockIcon) {
      container.add(lockIcon);
    }

    // Make interactive if unlocked
    if (isUnlocked) {
      bg.setInteractive({ useHandCursor: true });

      // Hover effect
      bg.on('pointerover', () => {
        bg.setFillStyle(0x3d3d5c);
        this.tweens.add({
          targets: container,
          y: y - 10,
          duration: 150,
        });
      });

      bg.on('pointerout', () => {
        bg.setFillStyle(0x2d2d44);
        this.tweens.add({
          targets: container,
          y: y,
          duration: 150,
        });
      });

      // Click effect
      bg.on('pointerdown', () => {
        this.onWorldSelect(world.id);
      });
    }

    return container;
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
   * Handle world selection
   */
  private onWorldSelect(world: number): void {
    this.scene.start(SCENE_KEYS.levelSelect, { world });
  }

  /**
   * Handle back button
   */
  private onBack(): void {
    // Go to main menu (or boot scene)
    this.scene.start(SCENE_KEYS.boot);
  }
}
