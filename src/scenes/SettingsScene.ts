/**
 * Settings Scene - Minimalist Redesign
 *
 * A clean, flat list layout with toggle switches and collapsible volume controls.
 * Features iOS-inspired design with dividers and smooth animations.
 */

import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, FONT_SIZES, UI_ANIMATION_DURATION } from '../config/constants';
import { Button, ButtonStyle } from '../ui/Button';
import { Panel } from '../ui/Panel';
import { Toggle } from '../ui/Toggle';
import { SaveManager } from '../managers/SaveManager';
import { AudioManager } from '../managers/AudioManager';
import { SupabaseService } from '../services/SupabaseService';
import { DARK_GOTHIC_THEME } from '../config/theme';

/**
 * Settings Scene
 */
export class SettingsScene extends Phaser.Scene {
  // UI elements
  private title: Phaser.GameObjects.Text | null = null;
  private soundToggle: Toggle | null = null;
  private musicToggle: Toggle | null = null;
  private sfxToggle: Toggle | null = null;
  private cloudSaveToggle: Toggle | null = null;
  private soundVolumeSlider: Phaser.GameObjects.Container | null = null;
  private musicVolumeSlider: Phaser.GameObjects.Container | null = null;
  private sfxVolumeSlider: Phaser.GameObjects.Container | null = null;
  private creditsButton: Button | null = null;
  private backButton: Button | null = null;
  private background: Phaser.GameObjects.Rectangle | null = null;
  private creditsPanel: Panel | null = null;
  private settingsListContainer: Phaser.GameObjects.Container | null = null;

  // Cloud save UI elements
  private loginButton: Button | null = null;
  private logoutButton: Button | null = null;
  private syncButton: Button | null = null;
  private accountInfoText: Phaser.GameObjects.Text | null = null;
  private syncStatusText: Phaser.GameObjects.Text | null = null;
  private cloudSaveSection: Phaser.GameObjects.Container | null = null;

  // Managers
  private saveManager: SaveManager;
  private audioManager: AudioManager;
  private supabaseService: SupabaseService;

  // Cloud save state
  private isAuthenticated: boolean = false;
  private lastSynced: Date | null = null;

  // Layout constants
  private readonly LIST_START_Y = 120;
  private readonly ITEM_HEIGHT = 70;
  private readonly DIVIDER_COLOR = 0x333333;

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

    // Create settings list container
    this.settingsListContainer = this.add.container(0, 0);

    // Create settings list
    this.createSettingsList();

    // Create cloud save section
    this.createCloudSaveSection();

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
      COLORS.background,
    );
  }

  /**
   * Create title
   */
  private createTitle(): void {
    this.title = this.add.text(
      this.cameras.main.width / 2,
      40,
      'SETTINGS',
      {
        fontFamily: DARK_GOTHIC_THEME.fonts.primary,
        fontSize: `${FONT_SIZES.xlarge}px`,
        color: '#FFFFFF',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6,
      },
    );

    this.title.setOrigin(0.5);
    this.title.setAlpha(0);

    this.tweens.add({
      targets: this.title,
      alpha: 1,
      y: 50,
      duration: UI_ANIMATION_DURATION * 2,
      ease: 'Power2',
    });
  }

  /**
   * Create settings list with flat design and dividers
   */
  private createSettingsList(): void {
    if (!this.settingsListContainer) return;

    const settings = this.saveManager.getSettings();
    const centerX = this.cameras.main.width / 2;
    let currentY = this.LIST_START_Y;

    // Sound Settings Section
    this.createSectionHeader('AUDIO', centerX, currentY);
    currentY += 40;

    // Sound toggle
    currentY = this.createSettingItem(
      'Sound',
      settings.soundEnabled,
      currentY,
      (value) => this.onSoundToggle(value),
    );
    this.soundToggle = this.settingsListContainer.list[this.settingsListContainer.list.length - 1] as Toggle;

    // Sound volume slider (collapsible)
    if (settings.soundEnabled) {
      currentY = this.createVolumeSliderItem('Sound Volume', settings.soundVolume, currentY, (value) =>
        this.onVolumeChange('sound', value),
      );
      this.soundVolumeSlider = this.settingsListContainer.list[this.settingsListContainer.list.length - 1] as Phaser.GameObjects.Container;
    }

    currentY = this.createDivider(centerX, currentY);

    // Music toggle
    currentY = this.createSettingItem(
      'Music',
      settings.musicEnabled,
      currentY,
      (value) => this.onMusicToggle(value),
    );
    this.musicToggle = this.settingsListContainer.list[this.settingsListContainer.list.length - 1] as Toggle;

    // Music volume slider (collapsible)
    if (settings.musicEnabled) {
      currentY = this.createVolumeSliderItem('Music Volume', settings.musicVolume, currentY, (value) =>
        this.onVolumeChange('music', value),
      );
      this.musicVolumeSlider = this.settingsListContainer.list[this.settingsListContainer.list.length - 1] as Phaser.GameObjects.Container;
    }

    currentY = this.createDivider(centerX, currentY);

    // SFX toggle
    currentY = this.createSettingItem(
      'Sound Effects',
      settings.sfxEnabled,
      currentY,
      (value) => this.onSFXToggle(value),
    );
    this.sfxToggle = this.settingsListContainer.list[this.settingsListContainer.list.length - 1] as Toggle;

    // SFX volume slider (collapsible)
    if (settings.sfxEnabled) {
      currentY = this.createVolumeSliderItem('SFX Volume', settings.sfxVolume, currentY, (value) =>
        this.onVolumeChange('sfx', value),
      );
      this.sfxVolumeSlider = this.settingsListContainer.list[this.settingsListContainer.list.length - 1] as Phaser.GameObjects.Container;
    }

    currentY = this.createDivider(centerX, currentY);

    // Cloud Save Section
    this.createSectionHeader('CLOUD SAVE', centerX, currentY);
    currentY += 40;

    currentY = this.createSettingItem(
      'Cloud Save',
      settings.cloudSaveEnabled,
      currentY,
      (value) => this.onCloudSaveToggle(value),
    );
    this.cloudSaveToggle = this.settingsListContainer.list[this.settingsListContainer.list.length - 1] as Toggle;

    currentY += 20;
  }

  /**
   * Create section header
   */
  private createSectionHeader(text: string, x: number, y: number): void {
    if (!this.settingsListContainer) return;

    const header = this.add.text(x - 300, y, text, {
      fontFamily: DARK_GOTHIC_THEME.fonts.primary,
      fontSize: '14px',
      color: '#888888',
      fontStyle: 'bold',
    });

    this.settingsListContainer.add(header);
  }

  /**
   * Create a setting item with toggle
   */
  private createSettingItem(
    label: string,
    initialValue: boolean,
    y: number,
    onChange: (value: boolean) => void,
  ): number {
    if (!this.settingsListContainer) return y;

    const centerX = this.cameras.main.width / 2;

    // Create container for the setting row
    const container = this.add.container(0, 0);

    // Create label
    const labelText = this.add.text(centerX - 300, y, label, {
      fontFamily: DARK_GOTHIC_THEME.fonts.primary,
      fontSize: '20px',
      color: '#ffffff',
    });
    labelText.setOrigin(0, 0.5);
    container.add(labelText);

    // Create toggle
    const toggle = new Toggle(this, {
      x: centerX + 200,
      y: y,
      initialValue: initialValue,
      onChange: onChange,
    });
    container.add(toggle);

    this.settingsListContainer.add(container);

    return y + this.ITEM_HEIGHT;
  }

  /**
   * Create volume slider item (indented)
   */
  private createVolumeSliderItem(
    label: string,
    value: number,
    y: number,
    onChange: (value: number) => void,
  ): number {
    if (!this.settingsListContainer) return y;

    const centerX = this.cameras.main.width / 2;
    const container = this.add.container(0, 0);

    // Create label (indented)
    const labelText = this.add.text(centerX - 280, y, label, {
      fontFamily: DARK_GOTHIC_THEME.fonts.secondary,
      fontSize: '16px',
      color: '#aaaaaa',
    });
    labelText.setOrigin(0, 0.5);
    container.add(labelText);

    // Create slider
    const sliderContainer = this.createVolumeSlider(centerX + 50, y, value, onChange);
    container.add(sliderContainer);

    this.settingsListContainer.add(container);

    return y + 50;
  }

  /**
   * Create volume slider
   */
  private createVolumeSlider(
    x: number,
    y: number,
    value: number,
    onChange: (value: number) => void,
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // Slider background
    const sliderBg = this.add.rectangle(0, 0, 200, 6, 0x333333);
    sliderBg.setStrokeStyle(1, 0x555555);
    container.add(sliderBg);

    // Slider fill
    const fillWidth = value * 200;
    const sliderFill = this.add.rectangle(-100 + fillWidth / 2, 0, fillWidth, 6, DARK_GOTHIC_THEME.colors.accent);
    container.add(sliderFill);

    // Slider handle
    const handleX = -100 + fillWidth;
    const handle = this.add.circle(handleX, 0, 12, 0xffffff);
    handle.setStrokeStyle(2, 0x000000);
    handle.setInteractive({ useHandCursor: true, draggable: true });
    container.add(handle);

    // Value display
    const valueText = this.add.text(110, 0, `${Math.round(value * 100)}%`, {
      fontFamily: DARK_GOTHIC_THEME.fonts.monospace,
      fontSize: '14px',
      color: '#cccccc',
    });
    valueText.setOrigin(0, 0.5);
    container.add(valueText);

    // Handle drag
    handle.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      const clampedX = Phaser.Math.Clamp(dragX, -100, 100);
      handle.x = clampedX;
      const newValue = (clampedX + 100) / 200;
      sliderFill.width = newValue * 200;
      sliderFill.x = -100 + (newValue * 200) / 2;
      valueText.setText(`${Math.round(newValue * 100)}%`);
      onChange(newValue);
    });

    return container;
  }

  /**
   * Create divider line
   */
  private createDivider(x: number, y: number): number {
    if (!this.settingsListContainer) return y;

    const divider = this.add.rectangle(x, y, 600, 1, this.DIVIDER_COLOR);
    this.settingsListContainer.add(divider);

    return y + 20;
  }

  /**
   * Create cloud save section
   */
  private async createCloudSaveSection(): Promise<void> {
    const centerX = this.cameras.main.width / 2;
    const y = this.LIST_START_Y + 400;

    // Create container for cloud save elements
    this.cloudSaveSection = this.add.container(0, 0);

    // Check authentication status
    await this.checkAuthStatus();

    // Update UI based on auth state
    this.updateCloudSaveUI(y);
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
  private updateCloudSaveUI(y: number): void {
    if (!this.cloudSaveSection) return;

    const centerX = this.cameras.main.width / 2;

    // Clear existing elements
    this.cloudSaveSection.removeAll(true);

    if (!this.isAuthenticated) {
      // Show login button
      this.loginButton = new Button(
        this,
        centerX,
        y,
        200,
        45,
        'LOGIN',
        {
          style: ButtonStyle.PRIMARY,
          fontSize: FONT_SIZES.small,
          onClick: () => this.onLogin(),
        },
      );
      this.cloudSaveSection.add(this.loginButton);

      // Show status
      this.syncStatusText = this.add.text(centerX, y + 50, 'Not logged in', {
        fontFamily: DARK_GOTHIC_THEME.fonts.secondary,
        fontSize: '14px',
        color: '#888888',
      });
      this.syncStatusText.setOrigin(0.5);
      this.cloudSaveSection.add(this.syncStatusText);
    } else {
      // Show account info
      const saveData = this.saveManager.load();
      const playerName = saveData.playerName || 'Anonymous';

      this.accountInfoText = this.add.text(centerX, y, `Logged in as: ${playerName}`, {
        fontFamily: DARK_GOTHIC_THEME.fonts.secondary,
        fontSize: '16px',
        color: DARK_GOTHIC_THEME.colors.success.toString(16),
      });
      this.accountInfoText.setOrigin(0.5);
      this.cloudSaveSection.add(this.accountInfoText);

      // Show sync status
      this.syncStatusText = this.add.text(centerX, y + 25, 'Synced', {
        fontFamily: DARK_GOTHIC_THEME.fonts.secondary,
        fontSize: '14px',
        color: DARK_GOTHIC_THEME.colors.success.toString(16),
      });
      this.syncStatusText.setOrigin(0.5);
      this.cloudSaveSection.add(this.syncStatusText);

      // Show sync and logout buttons
      this.syncButton = new Button(
        this,
        centerX - 80,
        y + 60,
        140,
        35,
        'SYNC',
        {
          style: ButtonStyle.PRIMARY,
          fontSize: FONT_SIZES.small,
          onClick: () => this.onSyncNow(),
        },
      );
      this.cloudSaveSection.add(this.syncButton);

      this.logoutButton = new Button(
        this,
        centerX + 80,
        y + 60,
        140,
        35,
        'LOGOUT',
        {
          style: ButtonStyle.SECONDARY,
          fontSize: FONT_SIZES.small,
          onClick: () => this.onLogout(),
        },
      );
      this.cloudSaveSection.add(this.logoutButton);
    }
  }

  /**
   * Handle sound toggle
   */
  private onSoundToggle(value: boolean): void {
    this.audioManager.playSFX('uiClick');

    this.saveManager.setSetting('soundEnabled', value);
    this.audioManager.toggleSFX(value);

    // Show/hide sound volume slider
    this.toggleVolumeSlider('sound', value);
  }

  /**
   * Handle music toggle
   */
  private onMusicToggle(value: boolean): void {
    this.audioManager.playSFX('uiClick');

    this.saveManager.setSetting('musicEnabled', value);
    this.audioManager.toggleMusic(value);

    // Show/hide music volume slider
    this.toggleVolumeSlider('music', value);
  }

  /**
   * Handle SFX toggle
   */
  private onSFXToggle(value: boolean): void {
    this.audioManager.playSFX('uiClick');

    this.saveManager.setSetting('sfxEnabled', value);
    this.audioManager.toggleSFX(value);

    // Show/hide SFX volume slider
    this.toggleVolumeSlider('sfx', value);
  }

  /**
   * Handle cloud save toggle
   */
  private onCloudSaveToggle(value: boolean): void {
    this.audioManager.playSFX('uiClick');
    this.saveManager.setSetting('cloudSaveEnabled', value);
  }

  /**
   * Toggle volume slider visibility
   */
  private toggleVolumeSlider(type: 'sound' | 'music' | 'sfx', show: boolean): void {
    // For now, just restart the scene to rebuild the UI
    // In a more advanced implementation, we could animate the slider in/out
    this.scene.restart();
  }

  /**
   * Handle volume change
   */
  private onVolumeChange(type: 'sound' | 'music' | 'sfx', value: number): void {
    if (type === 'sound') {
      this.saveManager.setSetting('soundVolume', value);
      this.audioManager.setSFXVolume(value);
    } else if (type === 'music') {
      this.saveManager.setSetting('musicVolume', value);
      this.audioManager.setMusicVolume(value);
    } else if (type === 'sfx') {
      this.saveManager.setSetting('sfxVolume', value);
      this.audioManager.setSFXVolume(value);
    }
  }

  /**
   * Handle login button click
   */
  private async onLogin(): Promise<void> {
    if (!this.supabaseService.isAvailable()) {
      this.showSyncStatus('Cloud save unavailable', DARK_GOTHIC_THEME.colors.danger.toString(16));
      return;
    }

    this.showSyncStatus('Logging in...', DARK_GOTHIC_THEME.colors.warning.toString(16));

    const user = await this.supabaseService.signInAnonymously();
    if (user) {
      this.isAuthenticated = true;
      this.showSyncStatus('Logged in successfully!', DARK_GOTHIC_THEME.colors.success.toString(16));

      // Auto-sync on login
      await this.onSyncNow();

      // Update UI
      this.updateCloudSaveUI(this.LIST_START_Y + 400);
    } else {
      this.showSyncStatus('Login failed', DARK_GOTHIC_THEME.colors.danger.toString(16));
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
    this.updateCloudSaveUI(this.LIST_START_Y + 400);
  }

  /**
   * Handle sync now button click
   */
  private async onSyncNow(): Promise<void> {
    if (!this.supabaseService.isAvailable() || !this.isAuthenticated) {
      this.showSyncStatus('Cannot sync - not logged in', DARK_GOTHIC_THEME.colors.danger.toString(16));
      return;
    }

    this.showSyncStatus('Syncing...', DARK_GOTHIC_THEME.colors.warning.toString(16));

    try {
      const saveData = this.saveManager.load();
      const mergedSave = await this.supabaseService.syncSave(saveData);

      // Update local save with merged data
      this.saveManager.save();

      this.lastSynced = new Date();
      this.showSyncStatus('Synced successfully!', DARK_GOTHIC_THEME.colors.success.toString(16));

      // Update UI
      this.updateCloudSaveUI(this.LIST_START_Y + 400);
    } catch (error) {
      console.error('[SettingsScene] Sync failed:', error);
      this.showSyncStatus('Sync failed', DARK_GOTHIC_THEME.colors.danger.toString(16));
    }
  }

  /**
   * Show sync status message
   */
  private showSyncStatus(message: string, color: string): void {
    if (this.syncStatusText) {
      this.syncStatusText.setText(message);
      this.syncStatusText.setColor('#' + color);
    }
  }

  /**
   * Create credits button
   */
  private createCreditsButton(): void {
    const centerX = this.cameras.main.width / 2;
    const y = this.cameras.main.height - 120;

    this.creditsButton = new Button(
      this,
      centerX,
      y,
      180,
      40,
      'CREDITS',
      {
        style: ButtonStyle.SECONDARY,
        fontSize: FONT_SIZES.small,
        onClick: this.onCredits.bind(this),
      },
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
        style: ButtonStyle.PRIMARY,
        fontSize: FONT_SIZES.small,
        onClick: this.onBack.bind(this),
      },
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
   * Handle credits
   */
  private onCredits(): void {
    this.audioManager.playSFX('uiClick');
    this.showCredits();
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
      'CREDITS',
    );

    const creditsText = this.add.text(
      0,
      -50,
      'NINJA SLICER\n\n' +
        'Developed by: Your Name\n' +
        'Design: Your Name\n' +
        'Programming: Your Name\n' +
        'Art: Your Name\n' +
        'Music: Your Name\n\n' +
        '© 2024 All Rights Reserved',
      {
        fontFamily: DARK_GOTHIC_THEME.fonts.secondary,
        fontSize: `${FONT_SIZES.small}px`,
        color: '#FFFFFF',
        align: 'center',
      },
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
      },
    );

    this.creditsPanel.add(closeButton);
    this.add.existing(this.creditsPanel);
  }

  /**
   * Close credits panel
   */
  private closeCredits(): void {
    if (this.creditsPanel) {
      this.creditsPanel.destroy();
      this.creditsPanel = null;
    }
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

    // Settings list fade in
    if (this.settingsListContainer) {
      this.settingsListContainer.setAlpha(0);
      this.tweens.add({
        targets: this.settingsListContainer,
        alpha: 1,
        duration: UI_ANIMATION_DURATION * 2,
        delay: UI_ANIMATION_DURATION,
        ease: 'Power2',
      });
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
