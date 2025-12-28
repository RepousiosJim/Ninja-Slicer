/**
 * Main Menu Scene
 * 
 * The main menu scene with game logo, navigation buttons,
 * and souls display.
 */

import Phaser from 'phaser';
import { SCENE_KEYS, TEXTURE_KEYS, COLORS, FONT_SIZES, UI_ANIMATION_DURATION, GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { DARK_GOTHIC_THEME } from '../config/theme';
import { Button, ButtonStyle } from '../ui/Button';
import { SaveManager } from '../managers/SaveManager';
import { AudioManager } from '../managers/AudioManager';
import { formatNumber } from '../utils/helpers';
import { ResponsiveUtils } from '../utils/ResponsiveUtils';
import { UITheme } from '../utils/UITheme';

/**
 * Main Menu Scene
 */
export class MainMenuScene extends Phaser.Scene {
  // UI elements
  private logo: Phaser.GameObjects.Text | null = null;
  private playButton: Button | null = null;
  private endlessButton: Button | null = null;
  private leaderboardButton: Button | null = null;
  private characterButton: Button | null = null;
  private shopButton: Button | null = null;
  private settingsButton: Button | null = null;
  private updatesButton: Button | null = null;
  private soulsDisplay: Phaser.GameObjects.Text | null = null;
  private background: Phaser.GameObjects.Image | null = null;

  // Managers
  private saveManager: SaveManager;
  private audioManager: AudioManager | null = null;

  constructor() {
    super({ key: SCENE_KEYS.mainMenu });
    this.saveManager = new SaveManager();
  }

  /**
   * Create scene
   */
  public create(): void {
    // Initialize audio manager
    this.audioManager = new AudioManager(this);
    this.audioManager.initialize();

    // Create background
    this.createBackground();

    // Create logo
    this.createLogo();

    // Create buttons
    this.createButtons();

    // Create souls display
    this.createSoulsDisplay();

    // Play menu music
    this.audioManager?.playMusic('menuMusic');

    // Animate elements in
    this.animateIn();
  }

  /**
   * Create background with theme
   */
  private createBackground(): void {
    // Check if texture exists, otherwise use fallback
    if (this.textures.exists(TEXTURE_KEYS.bgMenu)) {
      this.background = this.add.image(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        TEXTURE_KEYS.bgMenu
      );
      this.background.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
      this.background.setDepth(0);
    } else {
      // Fallback to solid color if texture doesn't exist
      const bgRect = this.add.rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        GAME_WIDTH,
        GAME_HEIGHT,
        DARK_GOTHIC_THEME.colors.background
      );
      bgRect.setDepth(0);
      this.background = bgRect as any;
    }
  }

  /**
   * Create animated game logo with theme
   */
  private createLogo(): void {
    const padding = ResponsiveUtils.getPadding('large');
    const logoFontSize = ResponsiveUtils.getFontSize('title');

    this.logo = this.add.text(
      GAME_WIDTH / 2,
      padding * 4,
      'MONSTER SLAYER',
      {
        fontFamily: DARK_GOTHIC_THEME.fonts.primary,
        fontSize: `${logoFontSize}px`,
        color: '#' + DARK_GOTHIC_THEME.colors.accent.toString(16).padStart(6, '0'),
        fontStyle: 'bold',
        stroke: '#' + DARK_GOTHIC_THEME.colors.primary.toString(16).padStart(6, '0'),
        strokeThickness: 8,
        shadow: {
          offsetX: 4,
          offsetY: 4,
          color: '#000000',
          blur: 8,
          stroke: true,
          fill: true,
        },
      }
    );

    this.logo.setOrigin(0.5);
    this.logo.setAlpha(0);
    this.logo.setDepth(100);

    // Animate logo with theme animation
    this.tweens.add({
      targets: this.logo,
      alpha: 1,
      y: padding * 5,
      duration: DARK_GOTHIC_THEME.animations.duration * 3,
      ease: DARK_GOTHIC_THEME.animations.easing,
      delay: DARK_GOTHIC_THEME.animations.duration,
    });

    // Add subtle floating animation
    this.tweens.add({
      targets: this.logo,
      y: padding * 5.5,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: DARK_GOTHIC_THEME.animations.duration * 4,
    });
  }

  /**
   * Create menu buttons with 2-column layout
   */
  private createButtons(): void {
    const centerX = GAME_WIDTH / 2;
    const startY = GAME_HEIGHT * 0.35; // Start at 35% of screen height
    const buttonSize = ResponsiveUtils.getButtonSize();
    const buttonSpacing = ResponsiveUtils.getPadding('large') * 1.8;
    const fontSize = ResponsiveUtils.getFontSize('medium');
    const columnGap = buttonSize.width * 0.6; // Gap between columns

    // Left column X position (game modes)
    const leftX = centerX - columnGap;
    // Right column X position (management/settings)
    const rightX = centerX + columnGap;

    // Section headers
    const headerFontSize = ResponsiveUtils.getFontSize('small');

    // "PLAY MODES" header
    const playModesHeader = this.add.text(
      leftX,
      startY - buttonSpacing,
      'PLAY MODES',
      {
        fontFamily: DARK_GOTHIC_THEME.fonts.primary,
        fontSize: `${headerFontSize}px`,
        color: '#' + DARK_GOTHIC_THEME.colors.accent.toString(16).padStart(6, '0'),
        fontStyle: 'bold',
      }
    );
    playModesHeader.setOrigin(0.5);
    playModesHeader.setAlpha(0);
    playModesHeader.setDepth(100);

    // "MANAGE" header
    const manageHeader = this.add.text(
      rightX,
      startY - buttonSpacing,
      'MANAGE',
      {
        fontFamily: DARK_GOTHIC_THEME.fonts.primary,
        fontSize: `${headerFontSize}px`,
        color: '#' + DARK_GOTHIC_THEME.colors.accent.toString(16).padStart(6, '0'),
        fontStyle: 'bold',
      }
    );
    manageHeader.setOrigin(0.5);
    manageHeader.setAlpha(0);
    manageHeader.setDepth(100);

    // Animate headers
    this.tweens.add({
      targets: [playModesHeader, manageHeader],
      alpha: 1,
      duration: DARK_GOTHIC_THEME.animations.duration * 2,
      ease: DARK_GOTHIC_THEME.animations.easing,
      delay: DARK_GOTHIC_THEME.animations.duration,
    });

    // LEFT COLUMN - Play Modes

    // Play button (larger, primary)
    this.playButton = new Button(
      this,
      leftX,
      startY,
      buttonSize.width * 1.1,
      buttonSize.height * 1.2,
      'PLAY',
      {
        style: ButtonStyle.PRIMARY,
        fontSize: fontSize * 1.1,
        onClick: this.onPlay.bind(this),
      }
    );
    this.playButton.setAlpha(0);
    this.playButton.setDepth(100);
    this.add.existing(this.playButton);

    // Endless button
    this.endlessButton = new Button(
      this,
      leftX,
      startY + buttonSpacing * 1.5,
      buttonSize.width,
      buttonSize.height,
      'ENDLESS',
      {
        style: ButtonStyle.SECONDARY,
        fontSize: fontSize,
        onClick: this.onEndless.bind(this),
      }
    );
    this.endlessButton.setAlpha(0);
    this.endlessButton.setDepth(100);
    this.add.existing(this.endlessButton);

    // Leaderboard button
    this.leaderboardButton = new Button(
      this,
      leftX,
      startY + buttonSpacing * 2.5,
      buttonSize.width,
      buttonSize.height,
      'LEADERBOARD',
      {
        style: ButtonStyle.SECONDARY,
        fontSize: fontSize,
        onClick: this.onLeaderboard.bind(this),
      }
    );
    this.leaderboardButton.setAlpha(0);
    this.leaderboardButton.setDepth(100);
    this.add.existing(this.leaderboardButton);

    // RIGHT COLUMN - Management

    // Character button
    this.characterButton = new Button(
      this,
      rightX,
      startY,
      buttonSize.width,
      buttonSize.height,
      'CHARACTER',
      {
        style: ButtonStyle.SECONDARY,
        fontSize: fontSize,
        onClick: this.onCharacter.bind(this),
      }
    );
    this.characterButton.setAlpha(0);
    this.characterButton.setDepth(100);
    this.add.existing(this.characterButton);

    // Shop button
    this.shopButton = new Button(
      this,
      rightX,
      startY + buttonSpacing,
      buttonSize.width,
      buttonSize.height,
      'SHOP',
      {
        style: ButtonStyle.SECONDARY,
        fontSize: fontSize,
        onClick: this.onShop.bind(this),
      }
    );
    this.shopButton.setAlpha(0);
    this.shopButton.setDepth(100);
    this.add.existing(this.shopButton);

    // Settings button
    this.settingsButton = new Button(
      this,
      rightX,
      startY + buttonSpacing * 2,
      buttonSize.width,
      buttonSize.height,
      'SETTINGS',
      {
        style: ButtonStyle.SECONDARY,
        fontSize: fontSize,
        onClick: this.onSettings.bind(this),
      }
    );
    this.settingsButton.setAlpha(0);
    this.settingsButton.setDepth(100);
    this.add.existing(this.settingsButton);

    // Updates button
    this.updatesButton = new Button(
      this,
      rightX,
      startY + buttonSpacing * 3,
      buttonSize.width,
      buttonSize.height,
      'UPDATES',
      {
        style: ButtonStyle.SECONDARY,
        fontSize: fontSize,
        onClick: this.onUpdates.bind(this),
      }
    );
    this.updatesButton.setAlpha(0);
    this.updatesButton.setDepth(100);
    this.add.existing(this.updatesButton);
  }

  /**
   * Create souls display with UITheme (consistent with other pages)
   */
  private createSoulsDisplay(): void {
    const saveData = this.saveManager.getSaveData();
    const souls = saveData?.souls || 0;
    const padding = ResponsiveUtils.getPadding('large');

    // Use UITheme for consistent styling
    const soulsBalance = UITheme.createSoulsBalance(
      this,
      souls,
      GAME_WIDTH - padding * 2,
      padding * 2
    );
    soulsBalance.setDepth(1000);
    soulsBalance.setAlpha(0);

    // Store reference for updateSoulsDisplay method
    this.soulsDisplay = soulsBalance as any;

    // Animate in with theme animation
    this.tweens.add({
      targets: soulsBalance,
      alpha: 1,
      duration: DARK_GOTHIC_THEME.animations.duration * 2,
      delay: DARK_GOTHIC_THEME.animations.duration * 2,
    });
  }

  /**
   * Animate elements in with theme animation (staggered by column)
   */
  private animateIn(): void {
    const centerX = GAME_WIDTH / 2;
    const buttonSize = ResponsiveUtils.getButtonSize();
    const columnGap = buttonSize.width * 0.6;
    const leftX = centerX - columnGap;
    const rightX = centerX + columnGap;

    // Left column buttons (animate from left)
    const leftButtons = [
      this.playButton,
      this.endlessButton,
      this.leaderboardButton,
    ];

    leftButtons.forEach((button, index) => {
      if (button) {
        this.tweens.add({
          targets: button,
          alpha: 1,
          x: leftX,
          duration: DARK_GOTHIC_THEME.animations.duration * 2,
          ease: DARK_GOTHIC_THEME.animations.easing,
          delay: DARK_GOTHIC_THEME.animations.duration * (index + 2),
        });
      }
    });

    // Right column buttons (animate from right)
    const rightButtons = [
      this.characterButton,
      this.shopButton,
      this.settingsButton,
      this.updatesButton,
    ];

    rightButtons.forEach((button, index) => {
      if (button) {
        this.tweens.add({
          targets: button,
          alpha: 1,
          x: rightX,
          duration: DARK_GOTHIC_THEME.animations.duration * 2,
          ease: DARK_GOTHIC_THEME.animations.easing,
          delay: DARK_GOTHIC_THEME.animations.duration * (index + 2),
        });
      }
    });
  }

  /**
   * Handle play button click
   */
  private onPlay(): void {
    this.audioManager?.playSFX('uiClick');
    this.scene.start(SCENE_KEYS.worldSelect);
  }

  /**
   * Handle endless button click
   */
  private onEndless(): void {
    this.audioManager?.playSFX('uiClick');
    this.scene.start(SCENE_KEYS.endlessGameplay);
  }

  /**
   * Handle leaderboard button click
   */
  private onLeaderboard(): void {
    this.audioManager?.playSFX('uiClick');
    this.scene.start(SCENE_KEYS.leaderboard);
  }

  /**
   * Handle character button click
   */
  private onCharacter(): void {
    this.audioManager?.playSFX('uiClick');
    this.scene.start(SCENE_KEYS.character);
  }

  /**
   * Handle shop button click
   */
  private onShop(): void {
    this.audioManager?.playSFX('uiClick');
    this.scene.start(SCENE_KEYS.shop);
  }

  /**
   * Handle settings button click
   */
  private onSettings(): void {
    this.audioManager?.playSFX('uiClick');
    this.scene.start(SCENE_KEYS.settings);
  }

  /**
   * Handle updates button click
   */
  private onUpdates(): void {
    this.audioManager?.playSFX('uiClick');
    this.scene.start(SCENE_KEYS.updates);
  }

  /**
   * Update souls display
   */
  public updateSoulsDisplay(): void {
    const saveData = this.saveManager.getSaveData();
    const souls = saveData?.souls || 0;

    // Since soulsDisplay is now a container, we need to recreate it
    if (this.soulsDisplay) {
      this.soulsDisplay.destroy();
      this.createSoulsDisplay();
    }
  }
}
