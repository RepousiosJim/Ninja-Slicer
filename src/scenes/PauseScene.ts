/**
 * Pause Scene
 * 
 * Displays pause overlay with options to resume, restart,
 * change settings, or quit to main menu.
 */

import Phaser from 'phaser';
import { SCENE_KEYS, FONT_SIZES, UI_ANIMATION_DURATION } from '../config/constants';
import { Button, ButtonStyle } from '../ui/Button';
import { AudioManager } from '../managers/AudioManager';

/**
 * Pause Scene
 */
export class PauseScene extends Phaser.Scene {
  // UI elements
  private overlay: Phaser.GameObjects.Rectangle | null = null;
  private title: Phaser.GameObjects.Text | null = null;
  private resumeButton: Button | null = null;
  private restartButton: Button | null = null;
  private settingsButton: Button | null = null;
  private quitButton: Button | null = null;

  // Managers
  private audioManager: AudioManager;

  // Scene data
  private currentLevelId: string | null = null;

  constructor() {
    super({ key: SCENE_KEYS.pause });
    this.audioManager = new AudioManager(this);
  }

  /**
   * Create scene
   */
  public create(): void {
    // Get scene data
    const data = this.scene.settings.data as any;
    this.currentLevelId = data?.levelId || null;

    // Create overlay
    this.createOverlay();

    // Create title
    this.createTitle();

    // Create buttons
    this.createButtons();

    // Animate elements in
    this.animateIn();

    // Pause music
    this.audioManager.pauseMusic();
  }

  /**
   * Create dimmed overlay
   */
  private createOverlay(): void {
    this.overlay = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000,
    );

    this.overlay.setAlpha(0.7);
    this.overlay.setInteractive();
  }

  /**
   * Create title
   */
  private createTitle(): void {
    this.title = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 - 150,
      'PAUSED',
      {
        fontSize: `${FONT_SIZES.title}px`,
        color: '#FFFFFF',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 8,
      },
    );

    this.title.setOrigin(0.5);
    this.title.setAlpha(0);

    const pauseIcon = this.add.image(this.cameras.main.width / 2 - 120, this.cameras.main.height / 2 - 150, 'ui_pause');
    pauseIcon.setScale(1.2);
    pauseIcon.setAlpha(0);

    this.tweens.add({
      targets: [this.title, pauseIcon],
      alpha: 1,
      y: (target: any) => target === this.title ? this.cameras.main.height / 2 - 120 : this.cameras.main.height / 2 - 120,
      duration: UI_ANIMATION_DURATION * 2,
      ease: 'Power2',
    });
  }

  /**
   * Create menu buttons
   */
  private createButtons(): void {
    const centerX = this.cameras.main.width / 2;
    const startY = this.cameras.main.height / 2 - 20;
    const buttonSpacing = 70;

    // Resume button (primary)
    this.resumeButton = new Button(
      this,
      centerX,
      startY,
      250,
      60,
      'RESUME',
      {
        style: ButtonStyle.PRIMARY,
        fontSize: FONT_SIZES.large,
        onClick: this.onResume.bind(this),
      },
    );

    this.resumeButton.setAlpha(0);
    this.add.existing(this.resumeButton);

    // Restart button (secondary)
    this.restartButton = new Button(
      this,
      centerX,
      startY + buttonSpacing,
      200,
      50,
      'RESTART',
      {
        style: ButtonStyle.SECONDARY,
        fontSize: FONT_SIZES.medium,
        onClick: this.onRestart.bind(this),
      },
    );

    this.restartButton.setAlpha(0);
    this.add.existing(this.restartButton);

    // Settings button (secondary)
    this.settingsButton = new Button(
      this,
      centerX,
      startY + buttonSpacing * 2,
      200,
      50,
      'SETTINGS',
      {
        style: ButtonStyle.SECONDARY,
        fontSize: FONT_SIZES.medium,
        icon: 'ui_settings_gear',
        onClick: this.onSettings.bind(this),
      },
    );

    this.settingsButton.setAlpha(0);
    this.add.existing(this.settingsButton);

    // Quit to menu button (danger)
    this.quitButton = new Button(
      this,
      centerX,
      startY + buttonSpacing * 3,
      250,
      50,
      'QUIT TO MENU',
      {
        style: ButtonStyle.DANGER,
        fontSize: FONT_SIZES.medium,
        onClick: this.onQuit.bind(this),
      },
    );

    this.quitButton.setAlpha(0);
    this.add.existing(this.quitButton);

    // Animate buttons in
    const buttons = [
      this.resumeButton,
      this.restartButton,
      this.settingsButton,
      this.quitButton,
    ];

    buttons.forEach((button, index) => {
      if (button) {
        this.tweens.add({
          targets: button,
          alpha: 1,
          duration: UI_ANIMATION_DURATION * 2,
          delay: UI_ANIMATION_DURATION * (index + 1),
          ease: 'Power2',
        });
      }
    });
  }

  /**
   * Animate elements in
   */
  private animateIn(): void {
    // Overlay fade in
    if (this.overlay) {
      this.overlay.setAlpha(0);
      this.tweens.add({
        targets: this.overlay,
        alpha: 0.7,
        duration: UI_ANIMATION_DURATION,
      });
    }
  }

  /**
   * Handle resume button click
   */
  private onResume(): void {
    this.audioManager.playSFX('uiClick');
    this.audioManager.resumeMusic();

    // Resume gameplay scene
    const gameplayScene = this.scene.get(SCENE_KEYS.gameplay) as any;
    if (gameplayScene && typeof gameplayScene.resume === 'function') {
      gameplayScene.resume();
    }

    this.scene.stop();
  }

  /**
   * Handle restart button click
   */
  private onRestart(): void {
    this.audioManager.playSFX('uiClick');
    this.audioManager.resumeMusic();

    // Restart current level
    if (this.currentLevelId) {
      this.scene.stop(SCENE_KEYS.pause);
      this.scene.start(SCENE_KEYS.gameplay, { levelId: this.currentLevelId });
    }
  }

  /**
   * Handle settings button click
   */
  private onSettings(): void {
    this.audioManager.playSFX('uiClick');

    // Store current level for return
    this.scene.settings.data = {
      levelId: this.currentLevelId,
      returnToPause: true,
    };

    // Navigate to settings
    this.scene.start(SCENE_KEYS.settings);
  }

  /**
   * Handle quit to menu button click
   */
  private onQuit(): void {
    this.audioManager.playSFX('uiClick');
    this.audioManager.resumeMusic();

    // Stop gameplay scene and go to main menu
    this.scene.stop(SCENE_KEYS.gameplay);
    this.scene.start(SCENE_KEYS.mainMenu);
  }

  /**
   * Shutdown scene
   */
  public shutdown(): void {
    // Clean up
    if (this.overlay) {
      this.overlay.destroy();
    }
    if (this.title) {
      this.title.destroy();
    }
    if (this.resumeButton) {
      this.resumeButton.destroy();
    }
    if (this.restartButton) {
      this.restartButton.destroy();
    }
    if (this.settingsButton) {
      this.settingsButton.destroy();
    }
    if (this.quitButton) {
      this.quitButton.destroy();
    }
  }
}
