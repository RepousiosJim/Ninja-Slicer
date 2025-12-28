/**
 * Settings Scene
 *
 * Displays game settings including sound, music, volume controls,
 * cloud save options, and data management.
 */

import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, FONT_SIZES, UI_ANIMATION_DURATION } from '../config/constants';
import { Button, ButtonStyle } from '../ui/Button';
import { Panel } from '../ui/Panel';
import { SaveManager } from '../managers/SaveManager';
import { AudioManager } from '../managers/AudioManager';
import { SupabaseService } from '../services/SupabaseService';
import { ResponsiveUtils } from '../utils/ResponsiveUtils';

/**
 * Settings Scene
 */
export class SettingsScene extends Phaser.Scene {
  // UI elements
  private title: Phaser.GameObjects.Text | null = null;
  private soundToggle: Button | null = null;
  private musicToggle: Button | null = null;
  private soundIcon: Phaser.GameObjects.Image | null = null;
  private musicIcon: Phaser.GameObjects.Image | null = null;
  private soundVolumeSlider: Phaser.GameObjects.Container | null = null;
  private musicVolumeSlider: Phaser.GameObjects.Container | null = null;
  private uiScaleSmallButton: Button | null = null;
  private uiScaleMediumButton: Button | null = null;
  private uiScaleLargeButton: Button | null = null;
  private clearDataButton: Button | null = null;
  private creditsButton: Button | null = null;
  private backButton: Button | null = null;
  private background: Phaser.GameObjects.Rectangle | null = null;
  private creditsPanel: Panel | null = null;

  // Cloud save UI elements
  private loginButton: Button | null = null;
  private logoutButton: Button | null = null;
  private syncButton: Button | null = null;
  private accountInfoText: Phaser.GameObjects.Text | null = null;
  private syncStatusText: Phaser.GameObjects.Text | null = null;
  private lastSyncedText: Phaser.GameObjects.Text | null = null;

  // Managers
  private saveManager: SaveManager;
  private audioManager: AudioManager;
  private supabaseService: SupabaseService;

  // Cloud save state
  private isAuthenticated: boolean = false;
  private lastSynced: Date | null = null;

  constructor() {
    super({ key: SCENE_KEYS.settings });
    this.saveManager = new SaveManager();
    this.audioManager = new AudioManager(this);
    this.supabaseService = new SupabaseService();
  }

  /**
   * Create scene
   */
  public create(): void {
    // Apply settings to audio manager
    const settings = this.saveManager.getSettings();
    this.audioManager.applySettings(settings);

    // Create background
    this.createBackground();

    // Create title
    this.createTitle();

    // Create sound settings
    this.createSoundSettings();

    // Create UI scale settings
    this.createUIScaleSettings();

    // Create cloud save section (placeholder)
    this.createCloudSaveSection();

    // Create data section
    this.createDataSection();

    // Create credits button
    this.createCreditsButton();

    // Create back button
    this.createBackButton();

    // Animate elements in
    this.animateIn();
  }

  /**
   * Create background
   */
  private createBackground(): void {
    this.background = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width,
      this.cameras.main.height,
      COLORS.background
    );
  }

  /**
   * Create title
   */
  private createTitle(): void {
    this.title = this.add.text(
      this.cameras.main.width / 2,
      50,
      'SETTINGS',
      {
        fontSize: `${FONT_SIZES.title}px`,
        color: '#FFFFFF',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6,
      }
    );

    this.title.setOrigin(0.5);
    this.title.setAlpha(0);

    this.tweens.add({
      targets: this.title,
      alpha: 1,
      y: 60,
      duration: UI_ANIMATION_DURATION * 2,
      ease: 'Power2',
    });
  }

  /**
   * Create sound settings
   */
  private createSoundSettings(): void {
    const settings = this.saveManager.getSettings();
    const centerX = this.cameras.main.width / 2;
    let startY = 150;

    // Sound toggle
    this.soundIcon = this.add.image(centerX - 280, startY, settings.soundEnabled ? 'ui_sound_on' : 'ui_sound_off');
    this.soundIcon.setScale(1.2);

    this.soundToggle = new Button(
      this,
      centerX - 150,
      startY,
      200,
      50,
      `SOUND: ${settings.soundEnabled ? 'ON' : 'OFF'}`,
      {
        style: settings.soundEnabled ? ButtonStyle.PRIMARY : ButtonStyle.SECONDARY,
        fontSize: FONT_SIZES.medium,
        onClick: this.onSoundToggle.bind(this),
      }
    );

    this.add.existing(this.soundToggle);

    // Music toggle
    this.musicIcon = this.add.image(centerX + 20, startY, settings.musicEnabled ? 'ui_music_on' : 'ui_music_off');
    this.musicIcon.setScale(1.2);

    this.musicToggle = new Button(
      this,
      centerX + 150,
      startY,
      200,
      50,
      `MUSIC: ${settings.musicEnabled ? 'ON' : 'OFF'}`,
      {
        style: settings.musicEnabled ? ButtonStyle.PRIMARY : ButtonStyle.SECONDARY,
        fontSize: FONT_SIZES.medium,
        onClick: this.onMusicToggle.bind(this),
      }
    );

    this.add.existing(this.musicToggle);

    startY += 80;

    // Sound volume slider
    this.soundVolumeSlider = this.createVolumeSlider(
      centerX - 150,
      startY,
      'SOUND VOLUME',
      settings.soundVolume,
      (value) => this.onVolumeChange('sound', value)
    );

    // Music volume slider
    this.musicVolumeSlider = this.createVolumeSlider(
      centerX + 150,
      startY,
      'MUSIC VOLUME',
      settings.musicVolume,
      (value) => this.onVolumeChange('music', value)
    );
  }

  /**
   * Create volume slider
   */
  private createVolumeSlider(
    x: number,
    y: number,
    label: string,
    value: number,
    onChange: (value: number) => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // Label
    const labelText = this.add.text(0, -30, label, {
      fontSize: `${FONT_SIZES.small}px`,
      color: '#FFFFFF',
    });
    labelText.setOrigin(0.5);
    container.add(labelText);

    // Slider background
    const sliderBg = this.add.rectangle(0, 0, 200, 10, 0x333333);
    sliderBg.setStrokeStyle(2, 0x666666);
    container.add(sliderBg);

    // Slider fill
    const fillWidth = value * 200;
    const sliderFill = this.add.rectangle(-100 + fillWidth / 2, 0, fillWidth, 10, COLORS.success);
    container.add(sliderFill);

    // Slider handle
    const handleX = -100 + fillWidth;
    const handle = this.add.rectangle(handleX, 0, 20, 30, 0xFFFFFF);
    handle.setStrokeStyle(2, 0x000000);
    handle.setInteractive({ useHandCursor: true });
    container.add(handle);

    // Value display
    const valueText = this.add.text(0, 30, `${Math.round(value * 100)}%`, {
      fontSize: `${FONT_SIZES.small}px`,
      color: '#CCCCCC',
    });
    valueText.setOrigin(0.5);
    container.add(valueText);

    // Handle drag
    handle.on('pointerdown', () => {
      handle.setInteractive({ draggable: true, useHandCursor: true });
    });

    handle.on('drag', (pointer: Phaser.Input.Pointer, dragX: number) => {
      const clampedX = Phaser.Math.Clamp(dragX, -100, 100);
      handle.x = clampedX;
      const newValue = (clampedX + 100) / 200;
      sliderFill.width = newValue * 200;
      sliderFill.x = -100 + (newValue * 200) / 2;
      valueText.setText(`${Math.round(newValue * 100)}%`);
      onChange(newValue);
    });

    handle.on('dragend', () => {
      handle.setInteractive({ draggable: false, useHandCursor: true });
    });

    return container;
  }

  /**
   * Create UI scale settings
   */
  private createUIScaleSettings(): void {
    const centerX = this.cameras.main.width / 2;
    const startY = 280;
    const currentScale = this.saveManager.getUIScale();

    // Title
    const title = this.add.text(centerX, startY, 'UI SCALE', {
      fontSize: `${FONT_SIZES.medium}px`,
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    // Small button
    this.uiScaleSmallButton = new Button(
      this,
      centerX - 130,
      startY + 50,
      120,
      45,
      'SMALL',
      {
        style: currentScale === 'small' ? ButtonStyle.PRIMARY : ButtonStyle.SECONDARY,
        fontSize: FONT_SIZES.small,
        onClick: () => this.onUIScaleChange('small'),
      }
    );
    this.add.existing(this.uiScaleSmallButton);

    // Medium button
    this.uiScaleMediumButton = new Button(
      this,
      centerX,
      startY + 50,
      120,
      45,
      'MEDIUM',
      {
        style: currentScale === 'medium' ? ButtonStyle.PRIMARY : ButtonStyle.SECONDARY,
        fontSize: FONT_SIZES.small,
        onClick: () => this.onUIScaleChange('medium'),
      }
    );
    this.add.existing(this.uiScaleMediumButton);

    // Large button
    this.uiScaleLargeButton = new Button(
      this,
      centerX + 130,
      startY + 50,
      120,
      45,
      'LARGE',
      {
        style: currentScale === 'large' ? ButtonStyle.PRIMARY : ButtonStyle.SECONDARY,
        fontSize: FONT_SIZES.small,
        onClick: () => this.onUIScaleChange('large'),
      }
    );
    this.add.existing(this.uiScaleLargeButton);

    // Info text
    const infoText = this.add.text(
      centerX,
      startY + 100,
      'Changes take effect immediately',
      {
        fontSize: `${FONT_SIZES.small}px`,
        color: '#888888',
      }
    );
    infoText.setOrigin(0.5);
  }

  /**
   * Handle UI scale change
   */
  private onUIScaleChange(scale: 'small' | 'medium' | 'large'): void {
    this.audioManager.playSFX('uiClick');

    // Save the new scale
    this.saveManager.setUIScale(scale);

    // Apply to ResponsiveUtils
    ResponsiveUtils.setUIScale(scale);

    // Update button styles
    if (this.uiScaleSmallButton) {
      this.uiScaleSmallButton.setStyle(scale === 'small' ? ButtonStyle.PRIMARY : ButtonStyle.SECONDARY);
    }
    if (this.uiScaleMediumButton) {
      this.uiScaleMediumButton.setStyle(scale === 'medium' ? ButtonStyle.PRIMARY : ButtonStyle.SECONDARY);
    }
    if (this.uiScaleLargeButton) {
      this.uiScaleLargeButton.setStyle(scale === 'large' ? ButtonStyle.PRIMARY : ButtonStyle.SECONDARY);
    }

    // Restart scene to apply changes
    this.scene.restart();
  }

  /**
   * Create cloud save section
   */
  private async createCloudSaveSection(): Promise<void> {
    const centerX = this.cameras.main.width / 2;
    const y = 400;

    // Title
    const title = this.add.text(centerX, y, 'CLOUD SAVE', {
      fontSize: `${FONT_SIZES.medium}px`,
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    this.add.existing(title);

    // Check authentication status
    await this.checkAuthStatus();

    // Update UI based on auth state
    this.updateCloudSaveUI();
  }

  /**
   * Check authentication status
   */
  private async checkAuthStatus(): Promise<void> {
    if (!this.supabaseService.isAvailable()) {
      this.isAuthenticated = false;
      return;
    }

    const user = await this.supabaseService.getUser();
    this.isAuthenticated = user !== null;
  }

  /**
   * Update cloud save UI based on auth state
   */
  private updateCloudSaveUI(): void {
    const centerX = this.cameras.main.width / 2;
    const y = 440;

    // Remove existing UI elements
    if (this.loginButton) {
      this.loginButton.destroy();
      this.loginButton = null;
    }
    if (this.logoutButton) {
      this.logoutButton.destroy();
      this.logoutButton = null;
    }
    if (this.syncButton) {
      this.syncButton.destroy();
      this.syncButton = null;
    }
    if (this.accountInfoText) {
      this.accountInfoText.destroy();
      this.accountInfoText = null;
    }
    if (this.syncStatusText) {
      this.syncStatusText.destroy();
      this.syncStatusText = null;
    }
    if (this.lastSyncedText) {
      this.lastSyncedText.destroy();
      this.lastSyncedText = null;
    }

    if (!this.isAuthenticated) {
      // Show login button
      this.loginButton = new Button(
        this,
        centerX,
        y,
        200,
        50,
        'LOGIN TO CLOUD',
        {
          style: ButtonStyle.PRIMARY,
          fontSize: FONT_SIZES.medium,
          onClick: () => this.onLogin(),
        }
      );
      this.add.existing(this.loginButton);

      // Show status
      this.syncStatusText = this.add.text(centerX, y + 70, 'Not logged in', {
        fontSize: `${FONT_SIZES.small}px`,
        color: '#888888',
      });
      this.syncStatusText.setOrigin(0.5);
      this.add.existing(this.syncStatusText);
    } else {
      // Show account info
      const saveData = this.saveManager.load();
      const playerName = saveData.playerName || 'Anonymous';
      
      this.accountInfoText = this.add.text(centerX, y, `Logged in as: ${playerName}`, {
        fontSize: `${FONT_SIZES.small}px`,
        color: '#00ff00',
      });
      this.accountInfoText.setOrigin(0.5);
      this.add.existing(this.accountInfoText);

      // Show sync status
      this.syncStatusText = this.add.text(centerX, y + 30, 'Synced', {
        fontSize: `${FONT_SIZES.small}px`,
        color: '#00ff00',
      });
      this.syncStatusText.setOrigin(0.5);
      this.add.existing(this.syncStatusText);

      // Show last synced time
      if (this.lastSynced) {
        const timeAgo = this.getTimeAgo(this.lastSynced);
        this.lastSyncedText = this.add.text(centerX, y + 55, `Last synced: ${timeAgo}`, {
          fontSize: `${FONT_SIZES.small}px`,
          color: '#888888',
        });
        this.lastSyncedText.setOrigin(0.5);
        this.add.existing(this.lastSyncedText);
      }

      // Show sync button
      this.syncButton = new Button(
        this,
        centerX - 100,
        y + 90,
        180,
        40,
        'SYNC NOW',
        {
          style: ButtonStyle.PRIMARY,
          fontSize: FONT_SIZES.small,
          onClick: () => this.onSyncNow(),
        }
      );
      this.add.existing(this.syncButton);

      // Show logout button
      this.logoutButton = new Button(
        this,
        centerX + 100,
        y + 90,
        180,
        40,
        'LOGOUT',
        {
          style: ButtonStyle.DANGER,
          fontSize: FONT_SIZES.small,
          onClick: () => this.onLogout(),
        }
      );
      this.add.existing(this.logoutButton);
    }
  }

  /**
   * Handle login button click
   */
  private async onLogin(): Promise<void> {
    if (!this.supabaseService.isAvailable()) {
      this.showSyncStatus('Cloud save unavailable', '#ff0000');
      return;
    }

    this.showSyncStatus('Logging in...', '#ffff00');

    const user = await this.supabaseService.signInAnonymously();
    if (user) {
      this.isAuthenticated = true;
      this.showSyncStatus('Logged in successfully!', '#00ff00');
      
      // Auto-sync on login
      await this.onSyncNow();
      
      // Update UI
      this.updateCloudSaveUI();
    } else {
      this.showSyncStatus('Login failed', '#ff0000');
    }
  }

  /**
   * Handle logout button click
   */
  private async onLogout(): Promise<void> {
    await this.supabaseService.signOut();
    this.isAuthenticated = false;
    this.lastSynced = null;
    
    this.showSyncStatus('Logged out', '#888888');
    this.updateCloudSaveUI();
  }

  /**
   * Handle sync now button click
   */
  private async onSyncNow(): Promise<void> {
    if (!this.supabaseService.isAvailable() || !this.isAuthenticated) {
      this.showSyncStatus('Cannot sync - not logged in', '#ff0000');
      return;
    }

    this.showSyncStatus('Syncing...', '#ffff00');

    try {
      const saveData = this.saveManager.load();
      const mergedSave = await this.supabaseService.syncSave(saveData);
      
      // Update local save with merged data
      this.saveManager.save();
      
      this.lastSynced = new Date();
      this.showSyncStatus('Synced successfully!', '#00ff00');
      
      // Update UI
      this.updateCloudSaveUI();
    } catch (error) {
      console.error('[SettingsScene] Sync failed:', error);
      this.showSyncStatus('Sync failed', '#ff0000');
    }
  }

  /**
   * Show sync status message
   */
  private showSyncStatus(message: string, color: string): void {
    if (this.syncStatusText) {
      this.syncStatusText.setText(message);
      this.syncStatusText.setColor(color);
    }
  }

  /**
   * Get time ago string
   */
  private getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) {
      return 'Just now';
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(seconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  }

  /**
   * Create data section
   */
  private createDataSection(): void {
    const centerX = this.cameras.main.width / 2;
    const y = 540;

    this.clearDataButton = new Button(
      this,
      centerX,
      y,
      250,
      50,
      'CLEAR ALL DATA',
      {
        style: ButtonStyle.DANGER,
        fontSize: FONT_SIZES.medium,
        onClick: this.onClearData.bind(this),
      }
    );

    this.add.existing(this.clearDataButton);
  }

  /**
   * Create credits button
   */
  private createCreditsButton(): void {
    const centerX = this.cameras.main.width / 2;
    const y = 610;

    this.creditsButton = new Button(
      this,
      centerX,
      y,
      200,
      40,
      'CREDITS',
      {
        style: ButtonStyle.SECONDARY,
        fontSize: FONT_SIZES.small,
        onClick: this.onCredits.bind(this),
      }
    );

    this.add.existing(this.creditsButton);
  }

  /**
   * Create back button
   */
  private createBackButton(): void {
    this.backButton = new Button(
      this,
      this.cameras.main.width / 2,
      this.cameras.main.height - 60,
      150,
      40,
      'BACK',
      {
        style: ButtonStyle.SECONDARY,
        fontSize: FONT_SIZES.small,
        onClick: this.onBack.bind(this),
      }
    );

    this.backButton.setAlpha(0);
    this.add.existing(this.backButton);

    // Animate in
    this.tweens.add({
      targets: this.backButton,
      alpha: 1,
      duration: UI_ANIMATION_DURATION * 2,
      delay: UI_ANIMATION_DURATION * 3,
      ease: 'Power2',
    });
  }

  /**
   * Animate elements in
   */
  private animateIn(): void {
    // Background fade in
    if (this.background) {
      this.background.setAlpha(0);
      this.tweens.add({
        targets: this.background,
        alpha: 1,
        duration: UI_ANIMATION_DURATION,
      });
    }
  }

  /**
   * Handle sound toggle
   */
  private onSoundToggle(): void {
    this.audioManager.playSFX('uiClick');

    const settings = this.saveManager.getSettings();
    const newState = !settings.soundEnabled;
    this.saveManager.setSetting('soundEnabled', newState);
    this.audioManager.toggleSFX(newState);

    if (this.soundToggle) {
      this.soundToggle.setText(`SOUND: ${newState ? 'ON' : 'OFF'}`);
      this.soundToggle.setStyle(newState ? ButtonStyle.PRIMARY : ButtonStyle.SECONDARY);
    }

    if (this.soundIcon) {
      this.soundIcon.setTexture(newState ? 'ui_sound_on' : 'ui_sound_off');
    }
  }

  /**
   * Handle music toggle
   */
  private onMusicToggle(): void {
    this.audioManager.playSFX('uiClick');

    const settings = this.saveManager.getSettings();
    const newState = !settings.musicEnabled;
    this.saveManager.setSetting('musicEnabled', newState);
    this.audioManager.toggleMusic(newState);

    if (this.musicToggle) {
      this.musicToggle.setText(`MUSIC: ${newState ? 'ON' : 'OFF'}`);
      this.musicToggle.setStyle(newState ? ButtonStyle.PRIMARY : ButtonStyle.SECONDARY);
    }

    if (this.musicIcon) {
      this.musicIcon.setTexture(newState ? 'ui_music_on' : 'ui_music_off');
    }
  }

  /**
   * Handle volume change
   */
  private onVolumeChange(type: 'sound' | 'music', value: number): void {
    if (type === 'sound') {
      this.saveManager.setSetting('soundVolume', value);
      this.audioManager.setSFXVolume(value);
    } else {
      this.saveManager.setSetting('musicVolume', value);
      this.audioManager.setMusicVolume(value);
    }
  }

  /**
   * Handle clear data
   */
  private onClearData(): void {
    this.audioManager.playSFX('uiClick');

    this.showConfirmation(
      'Are you sure you want to clear all data? This cannot be undone!',
      () => {
        this.saveManager.resetSave();
        this.saveManager.resetSettings();
        this.scene.restart();
      }
    );
  }

  /**
   * Handle credits
   */
  private onCredits(): void {
    this.audioManager.playSFX('uiClick');
    this.showCredits();
  }

  /**
   * Show confirmation popup
   */
  private showConfirmation(message: string, callback: () => void): void {
    if (this.creditsPanel) {
      this.creditsPanel.destroy();
    }

    this.creditsPanel = new Panel(
      this,
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      400,
      200,
      'CONFIRM'
    );

    const messageText = this.add.text(0, -20, message, {
      fontSize: `${FONT_SIZES.small}px`,
      color: '#FFFFFF',
      wordWrap: { width: 360 },
    });
    messageText.setOrigin(0.5);
    this.creditsPanel.setContent(messageText);

    const confirmButton = new Button(
      this,
      -60,
      40,
      100,
      40,
      'YES',
      {
        style: ButtonStyle.DANGER,
        fontSize: FONT_SIZES.small,
        onClick: callback,
      }
    );

    const cancelButton = new Button(
      this,
      60,
      40,
      100,
      40,
      'NO',
      {
        style: ButtonStyle.SECONDARY,
        fontSize: FONT_SIZES.small,
        onClick: () => this.closeCredits(),
      }
    );

    this.creditsPanel.add(confirmButton);
    this.creditsPanel.add(cancelButton);
    this.add.existing(this.creditsPanel);
  }

  /**
   * Show credits
   */
  private showCredits(): void {
    if (this.creditsPanel) {
      this.creditsPanel.destroy();
    }

    this.creditsPanel = new Panel(
      this,
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      400,
      300,
      'CREDITS'
    );

    const creditsText = this.add.text(0, -50, 
      'MONSTER SLAYER\n\n' +
      'Developed by: Your Name\n' +
      'Design: Your Name\n' +
      'Programming: Your Name\n' +
      'Art: Your Name\n' +
      'Music: Your Name\n\n' +
      '© 2024 All Rights Reserved',
      {
        fontSize: `${FONT_SIZES.small}px`,
        color: '#FFFFFF',
        align: 'center',
      }
    );

    creditsText.setOrigin(0.5);
    this.creditsPanel.setContent(creditsText);

    const closeButton = new Button(
      this,
      0,
      80,
      100,
      40,
      'CLOSE',
      {
        style: ButtonStyle.PRIMARY,
        fontSize: FONT_SIZES.small,
        onClick: () => this.closeCredits(),
      }
    );

    this.creditsPanel.add(closeButton);
    this.add.existing(this.creditsPanel);
  }

  /**
   * Close credits/confirmation panel
   */
  private closeCredits(): void {
    if (this.creditsPanel) {
      this.creditsPanel.destroy();
      this.creditsPanel = null;
    }
  }

  /**
   * Handle back button click
   */
  private onBack(): void {
    this.audioManager.playSFX('uiClick');
    this.scene.start(SCENE_KEYS.mainMenu);
  }
}
