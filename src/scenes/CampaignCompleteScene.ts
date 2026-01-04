/**
 * CampaignCompleteScene
 *
 * Displays final campaign completion stats and offers replay.
 */

import Phaser from 'phaser';
import { SCENE_KEYS } from '@config/constants';
import { LevelManager } from '../managers/LevelManager';
import { ParticleSystem, ParticleType } from '../systems/ParticleSystem';

interface CampaignStats {
  totalStars: number;
  totalScore: number;
  totalSouls: number;
  totalAttempts: number;
  timePlayed: number;
}

export class CampaignCompleteScene extends Phaser.Scene {
  private stats: CampaignStats | null = null;
  private starSprites: Phaser.GameObjects.Container[] = [];
  private particleSystem: ParticleSystem;

  constructor() {
    super({ key: SCENE_KEYS.campaignComplete });
  }

  create(): void {
    this.particleSystem = new ParticleSystem(this);

    // Calculate stats
    this.stats = this.calculateCampaignStats();

    // Create background
    this.createBackground();

    // Create UI
    this.createUI();

    // Start celebration effects
    this.startCelebration();
  }

  /**
   * Calculate campaign completion stats
   */
  private calculateCampaignStats(): CampaignStats {
    const levelManager = LevelManager.getInstance();

    return {
      totalStars: levelManager.getTotalStars(),
      totalScore: 0,
      totalSouls: 0,
      totalAttempts: 0,
      timePlayed: 0,
    };
  }

  /**
   * Create background
   */
  private createBackground(): void {
    // Dark gradient background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x0f0f1a, 0x0f0f1a, 1);
    bg.fillRect(0, 0, this.scale.width, this.scale.height);
    bg.setDepth(0);

    // Particle effect background
    this.particleSystem.createAmbientWisps(this.scale.width, this.scale.height);
  }

  /**
   * Create UI elements
   */
  private createUI(): void {
    if (!this.stats) return;

    const centerX = this.scale.width / 2;
    let currentY = 100;

    // Title
    const title = this.add.text(centerX, currentY, 'CAMPAIGN COMPLETE', {
      fontSize: '64px',
      color: '#ffd700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    });
    title.setOrigin(0.5);
    title.setDepth(10);
    currentY += 100;

    // Stats panel
    const panel = this.add.rectangle(centerX, currentY + 150, 500, 350, 0x2d2d44);
    panel.setStrokeStyle(3, 0x8b0000);
    panel.setDepth(5);

    // Stars earned (out of 75 total)
    const starsText = this.add.text(centerX, currentY,
      `${this.stats.totalStars} / 75 STARS`, {
      fontSize: '48px',
      color: '#ffd700',
      fontStyle: 'bold',
    });
    starsText.setOrigin(0.5);
    starsText.setDepth(10);
    currentY += 60;

    // Other stats
    const statsLines = [
      `Total Attempts: ${this.stats.totalAttempts}`,
    ];

    statsLines.forEach((line, index) => {
      const text = this.add.text(centerX, currentY + 30 + (index * 40), line, {
        fontSize: '24px',
        color: '#ffffff',
      });
      text.setOrigin(0.5);
      text.setDepth(10);
    });

    // Buttons
    const replayButton = this.createButton(centerX, 600, 'REPLAY CAMPAIGN', () => {
      this.onReplay();
    });

    const endlessButton = this.createButton(centerX, 680, 'ENDLESS MODE', () => {
      this.onEndlessMode();
    });

    const menuButton = this.createButton(centerX, 760, 'MAIN MENU', () => {
      this.onMenu();
    });
  }

  /**
   * Create a button
   */
  private createButton(x: number, y: number, text: string, onClick: () => void): Phaser.GameObjects.Container {
    const buttonWidth = 300;
    const buttonHeight = 50;

    const bg = this.add.rectangle(0, 0, buttonWidth, buttonHeight, 0x8b0000);
    bg.setStrokeStyle(3, 0xffffff);

    const buttonText = this.add.text(0, 0, text, {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    buttonText.setOrigin(0.5);

    const container = this.add.container(x, y, [bg, buttonText]);

    bg.setInteractive({ useHandCursor: true });

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
   * Start celebration effects
   */
  private startCelebration(): void {
    // Continuous sparkle effect
    const sparkleEmitter = this.particleSystem.createContinuousEmitter(
      ParticleType.SPARKLE,
      this.scale.width / 2,
      this.scale.height / 2
    );

    // Fireworks-like bursts
    for (let i = 0; i < 5; i++) {
      this.time.delayedCall(i * 1000, () => {
        const x = Phaser.Math.Between(200, 1080);
        const y = Phaser.Math.Between(200, 500);

        this.particleSystem.emit({
          type: ParticleType.FIRE,
          x: x,
          y: y,
          count: 30,
        });

        this.particleSystem.emit({
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
  }

  /**
   * Replay campaign (restart from level 1-1)
   */
  private onReplay(): void {
    this.scene.start(SCENE_KEYS.levelSelect, { world: 1 });
  }

  /**
   * Go to endless mode
   */
  private onEndlessMode(): void {
    this.scene.start(SCENE_KEYS.endlessGameplay);
  }

  /**
   * Go to main menu
   */
  private onMenu(): void {
    this.scene.start(SCENE_KEYS.mainMenu);
  }
}
