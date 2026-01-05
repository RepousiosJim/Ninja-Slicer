/**
 * Main Menu Scene - Card-Based Dashboard Redesign
 *
 * Features modern card-based layout with gradient backgrounds,
 * particle effects, and enhanced visual polish
 */

import Phaser from 'phaser';
import { SCENE_KEYS, GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { DARK_GOTHIC_THEME, DASHBOARD_CARD_CONFIG } from '../config/theme';
import { DashboardCard } from '../ui/DashboardCard';
import { ParticleBackground } from '../ui/ParticleBackground';
import { GlowEffect } from '../ui/GlowEffect';
import { TextureGenerator } from '../utils/TextureGenerator';
import { SaveManager } from '../managers/SaveManager';
import { AudioManager } from '../managers/AudioManager';
import { formatNumber } from '../utils/helpers';
import { ResponsiveUtils } from '../utils/ResponsiveUtils';
import type { ScaledCardConfig } from '../utils/ResponsiveCardScaler';
import { ResponsiveCardScaler } from '../utils/ResponsiveCardScaler';
import type { GameSave } from '@config/types';
import { debugLog, debugWarn, debugError } from '../utils/DebugLogger';
import { QuickActionsPanel } from '../ui/QuickActionsPanel';
import { ToastNotificationManager } from '../ui/ToastNotificationManager';
import { StatsDashboard } from '../ui/StatsDashboard';
import { DynamicWeatherEffect } from '../ui/DynamicWeatherEffect';

/**
 * Main Menu Scene
 */
export class MainMenuScene extends Phaser.Scene {
  // UI elements
  private logo: Phaser.GameObjects.Container | null = null;
  private dashboardCards: Map<string, DashboardCard> = new Map();
  private soulsDisplay: Phaser.GameObjects.Text | null = null;
  private particleBackground: ParticleBackground | null = null;
  private backgroundGraphics: Phaser.GameObjects.Graphics | null = null;
  private vignetteOverlay: Phaser.GameObjects.Image | null = null;
  private loadingOverlay: Phaser.GameObjects.Graphics | null = null;
  private loadingText: Phaser.GameObjects.Text | null = null;
  private isFullyLoaded: boolean = false;

  // NEW - Phase 1 UI components
  private quickActionsPanel?: QuickActionsPanel;
  private toastManager?: ToastNotificationManager;
  private statsDashboard?: StatsDashboard;
  private weatherEffect?: DynamicWeatherEffect;

  // Managers
  private saveManager: SaveManager;
  private audioManager: AudioManager | null = null;

  // Debug
  private debugMode: boolean = false;

  /**
   * Initialize main menu scene
   * Sets up scene key and save manager
   * 
   * @example
   * ```typescript
   * // Scene is automatically created by Phaser
   * // Use scene keys to navigate:
   * this.scene.start('mainMenu');
   * ```
   */
  constructor() {
    super({ key: SCENE_KEYS.mainMenu });
    this.saveManager = new SaveManager();
  }

  /**
   * Create all main menu UI elements
   * Initializes background, logo, dashboard cards, and souls display
   * Sets up event handlers and debug controls
   * 
   * @example
   * ```typescript
   * // This method is called automatically by Phaser
   * // when the scene is started
   * ```
   */
  public create(): void {
    // Show loading overlay first
    this.createLoadingOverlay();

    // Initialize audio manager
    this.audioManager = new AudioManager(this);
    this.audioManager.initialize();

    // Create layered background
    this.createLayeredBackground();

    // Create logo with glow
    this.createEnhancedLogo();

    // Create card dashboard
    this.createCardDashboard();

    // Create NEW Phase 1 UI components
    this.createQuickActionsPanel();
    this.createStatsDashboard();
    this.createToastSystem();
    this.createWeatherEffect();

    // Create souls display
    this.createSoulsDisplay();

    // Play menu music with fallback
    try {
      // Check if music key exists in cache before playing
      if (this.cache.audio.exists('menuMusic')) {
        this.audioManager?.playMusic('menuMusic');
      } else {
        // Fallback: don't show error, just silently continue
        debugLog('[MainMenuScene] Menu music not found, continuing without music');
      }
    } catch (error) {
      debugWarn('[MainMenuScene] Failed to play menu music:', error);
      // Continue without music - non-critical feature
    }

    // Animate elements in
    this.animateIn();

    // Setup responsive event handlers
    this.setupResponsiveHandlers();

    // Setup debug controls (press D to toggle debug hit boxes)
    this.input.keyboard?.on('keydown-D', this.toggleDebugMode, this);

    // Mark as loaded and hide loading overlay after short delay
    this.time.delayedCall(500, () => {
      this.hideLoadingOverlay();
      this.isFullyLoaded = true;
    });
  }

  /**
   * Create layered background
   */
  private createLayeredBackground(): void {
    // Use actual camera dimensions for responsive background
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;

    // Layer 1: Gradient background (lowest depth)
    this.backgroundGraphics = this.add.graphics();
    this.backgroundGraphics.fillGradientStyle(
      DARK_GOTHIC_THEME.colors.gradients.backgroundGradient.start,
      DARK_GOTHIC_THEME.colors.gradients.backgroundGradient.start,
      DARK_GOTHIC_THEME.colors.gradients.backgroundGradient.end,
      DARK_GOTHIC_THEME.colors.gradients.backgroundGradient.end,
      1,
    );
    this.backgroundGraphics.fillRect(0, 0, screenWidth, screenHeight);
    this.backgroundGraphics.setDepth(-100);

    // Layer 2: Particle systems (middle background)
    this.particleBackground = new ParticleBackground(this, {
      types: ['soulWisp', 'ember', 'mist'],
      depth: -50,
      interactive: true,
    });
    this.add.existing(this.particleBackground);

    // Layer 3: Vignette overlay (highest background layer)
    const vignetteTexture = TextureGenerator.createVignetteTexture(
      this,
      screenWidth,
      screenHeight,
      0x000000,
      0.5,
      0.7,
    );

    this.vignetteOverlay = this.add.image(screenWidth / 2, screenHeight / 2, vignetteTexture.key);
    this.vignetteOverlay.setDepth(-10);
    this.vignetteOverlay.setAlpha(0.8);
  }

  /**
   * Create enhanced logo with glow effect
   */
  private createEnhancedLogo(): void {
    const padding = ResponsiveUtils.getPadding('large');
    const logoFontSize = ResponsiveUtils.getFontSize('title');
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;

    // ADAPTIVE logo position (use less space on small screens)
    const logoY = ResponsiveCardScaler.getAdaptiveLogoHeight(screenHeight, padding);

    this.logo = this.add.container(screenWidth / 2, logoY);

    // Glow layer (behind text)
    const glow = new GlowEffect(this, 0, 0, {
      color: DARK_GOTHIC_THEME.colors.accent,
      innerIntensity: 0.9,
      outerIntensity: 0.4,
      blur: 20,
      pulse: true,
      pulseSpeed: 3000,
    });
    glow.setScale(3);
    this.logo.add(glow);

    // Main logo text
    const logoText = this.add.text(0, 0, 'MONSTER SLAYER', {
      fontFamily: DARK_GOTHIC_THEME.fonts.primary,
      fontSize: `${logoFontSize}px`,
      color: '#ffd700',
      fontStyle: 'bold',
      stroke: '#8b0000',
      strokeThickness: 8,
      shadow: {
        offsetX: 4,
        offsetY: 6,
        color: 'rgba(0,0,0,0.9)',
        blur: 12,
        stroke: true,
        fill: true,
      },
    });
    logoText.setOrigin(0.5);
    this.logo.add(logoText);

    this.logo.setAlpha(0);
    this.logo.setScale(0.8);
    this.logo.setDepth(100);

    // Entrance animation
    this.tweens.add({
      targets: this.logo,
      alpha: 1,
      scale: 1,
      y: logoY,
      duration: 800,
      delay: 200,
      ease: 'Back.easeOut',
    });

    // ADAPTIVE floating animation (reduced range on small screens)
    const floatRange = ResponsiveCardScaler.getAdaptiveFloatRange(screenHeight);
    this.tweens.add({
      targets: this.logo,
      y: logoY + floatRange,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 1000,
    });
  }

  /**
   * Create card-based dashboard
   */
  private createCardDashboard(): void {
    const layout = this.calculateCardLayout();
    const cards = this.getCardData();
    
    cards.forEach((cardData, index) => {
      const position = this.calculateCardPosition(index, layout);
      this.createCard(cardData, position, index, layout);
    });
  }

  /**
   * Calculate card layout configuration
   */
  private calculateCardLayout(): {
    scaledConfig: ScaledCardConfig;
    startX: number;
    startY: number;
  } {
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;
    const padding = ResponsiveUtils.getPadding('large');
    const logoHeight = ResponsiveCardScaler.getAdaptiveLogoHeight(screenHeight, padding);
    const soulsHeight = padding * 4;

    const scaledConfig = ResponsiveCardScaler.getOptimalCardConfig({
      viewportWidth: screenWidth,
      viewportHeight: screenHeight,
      logoHeight,
      soulsHeight,
      baseConfig: DASHBOARD_CARD_CONFIG,
    });

    const totalWidth = scaledConfig.columns * scaledConfig.width + (scaledConfig.columns - 1) * scaledConfig.gap;
    const totalHeight = scaledConfig.rows * scaledConfig.height + (scaledConfig.rows - 1) * scaledConfig.gap;

    const startX = (screenWidth - totalWidth) / 2 + scaledConfig.width / 2;
    const startY = logoHeight + ((screenHeight - logoHeight - soulsHeight - totalHeight) / 2) + scaledConfig.height / 2;

    return { scaledConfig, startX, startY };
  }

  /**
   * Get card data configurations
   */
  private getCardData(): Array<{
    id: string;
    title: string;
    icon: string;
    description: string;
    stats?: Array<{ label: string; value: string }>;
    badge?: { text: string; color: number };
    onClick: () => void;
  }> {
    const saveData = this.saveManager.getSaveData();
    const lastWorld = this.getLastWorld(saveData);
    const lastLevel = this.getLastLevel(saveData);
    const totalStars = this.getTotalStars(saveData);

    return [
      {
        id: 'play',
        title: 'PLAY',
        icon: '🎮',
        description: 'Start Your Journey',
        stats: [
          { label: 'Progress', value: `World ${lastWorld}-${lastLevel}` },
          { label: 'Stars', value: `${totalStars} ⭐` },
        ],
        onClick: () => this.onPlay(),
      },
      {
        id: 'endless',
        title: 'ENDLESS',
        icon: '∞',
        description: 'Survival Mode',
        stats: [
          { label: 'Best', value: formatNumber(saveData.highScores.endless || 0) },
          { label: 'Rank', value: '#--' },
        ],
        onClick: () => this.onEndless(),
      },
      {
        id: 'character',
        title: 'CHARACTER',
        icon: '👤',
        description: 'Stats & Upgrades',
        stats: [
          { label: 'Souls', value: `${formatNumber(saveData.souls)} 💀` },
          { label: 'Weapon', value: this.getWeaponName(saveData.equippedWeapon) },
        ],
        onClick: () => this.onCharacter(),
      },
      {
        id: 'shop',
        title: 'SHOP',
        icon: '🛒',
        description: 'Buy & Upgrade',
        badge: this.getNewItemsBadge(saveData),
        onClick: () => this.onShop(),
      },
      {
        id: 'settings',
        title: 'SETTINGS',
        icon: '⚙️',
        description: 'Audio & Options',
        onClick: () => this.onSettings(),
      },
      {
        id: 'updates',
        title: 'UPDATES',
        icon: '📰',
        description: "What's New",
        onClick: () => this.onUpdates(),
      },
    ];
  }

  /**
   * Calculate card position in grid
   */
  private calculateCardPosition(
    index: number,
    layout: { scaledConfig: ScaledCardConfig; startX: number; startY: number }
  ): { x: number; y: number } {
    const { scaledConfig, startX, startY } = layout;
    const row = Math.floor(index / scaledConfig.columns);
    const col = index % scaledConfig.columns;

    const x = startX + col * (scaledConfig.width + scaledConfig.gap);
    const y = startY + row * (scaledConfig.height + scaledConfig.gap);

    return { x, y };
  }

  /**
   * Create a single card with animation
   */
  private createCard(
    cardData: any,
    position: { x: number; y: number },
    index: number,
    layout: { scaledConfig: ScaledCardConfig }
  ): void {
    const { x, y } = position;
    const { scaledConfig } = layout;

    const card = new DashboardCard(this, x, y, cardData, scaledConfig);
    card.setAlpha(0);
    card.setScale(0.8);
    card.setDepth(50);
    this.add.existing(card);

    this.dashboardCards.set(cardData.id, card);

    this.tweens.add({
      targets: card,
      alpha: 1,
      scale: 1,
      y: y,
      duration: DARK_GOTHIC_THEME.animations.presets.cardEntrance.duration,
      delay: 400 + (index * DARK_GOTHIC_THEME.animations.presets.staggerDelay),
      ease: DARK_GOTHIC_THEME.animations.presets.cardEntrance.easing,
    });
  }

  /**
   * Create souls display
   */
  private createSoulsDisplay(): void {
    const padding = ResponsiveUtils.getPadding('large');
    const fontSize = ResponsiveUtils.getFontSize('medium');
    const screenWidth = this.cameras.main.width;

    const saveData = this.saveManager.getSaveData();
    const soulsText = `💀 ${formatNumber(saveData.souls)}`;

    this.soulsDisplay = this.add.text(screenWidth - padding * 2, padding * 2, soulsText, {
      fontFamily: DARK_GOTHIC_THEME.fonts.primary,
      fontSize: `${fontSize}px`,
      color: '#ffd700',
      fontStyle: 'bold',
      stroke: '#8b0000',
      strokeThickness: 4,
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#000000',
        blur: 4,
        stroke: true,
        fill: true,
      },
    });

    this.soulsDisplay.setOrigin(1, 0);
    this.soulsDisplay.setAlpha(0);
    this.soulsDisplay.setDepth(100);

    // Fade in
    this.tweens.add({
      targets: this.soulsDisplay,
      alpha: 1,
      duration: DARK_GOTHIC_THEME.animations.duration * 2,
      ease: DARK_GOTHIC_THEME.animations.easing,
      delay: 400,
    });
  }

  /**
   * Create quick actions panel
   */
  private createQuickActionsPanel(): void {
    this.quickActionsPanel = new QuickActionsPanel(this, this.saveManager, {
      showContinue: true,
      showDailyChallenge: true,
      showQuickSettings: true,
    });
    this.add.existing(this.quickActionsPanel);
    
    // Handle quick action events
    this.events.on('quickAction:continue', this.onQuickActionContinue, this);
    this.events.on('quickAction:settings', this.onQuickActionSettings, this);
  }

  /**
   * Create stats dashboard
   */
  private createStatsDashboard(): void {
    this.statsDashboard = new StatsDashboard(this, this.saveManager);
    this.add.existing(this.statsDashboard);
  }

  /**
   * Create toast notification system
   */
  private createToastSystem(): void {
    this.toastManager = new ToastNotificationManager(this);
    this.add.existing(this.toastManager);
  }

  /**
   * Create weather effect
   */
  private createWeatherEffect(): void {
    this.weatherEffect = new DynamicWeatherEffect(this, {
      type: 'lightning',
      intensity: 0.5,
      transitionDuration: 5000,
    });
    this.add.existing(this.weatherEffect);
  }

  /**
   * Handle quick action continue
   */
  private onQuickActionContinue(levelId: string): void {
    this.audioManager?.playSFX('uiClick');
    
    if (levelId && levelId.startsWith('1-')) {
      this.scene.start(SCENE_KEYS.worldSelect);
    } else {
      this.scene.start(SCENE_KEYS.endlessGameplay);
    }
  }

  /**
   * Handle quick action settings
   */
  private onQuickActionSettings(): void {
    this.audioManager?.playSFX('uiClick');
    this.scene.start(SCENE_KEYS.settings);
  }

  /**
   * Create loading overlay to prevent premature interaction
   */
  private createLoadingOverlay(): void {
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;

    this.loadingOverlay = this.add.graphics();
    this.loadingOverlay.fillStyle(0x000000, 0.95);
    this.loadingOverlay.fillRect(0, 0, screenWidth, screenHeight);
    this.loadingOverlay.setDepth(1000);

    this.loadingText = this.add.text(screenWidth / 2, screenHeight / 2, 'Loading...', {
      fontFamily: DARK_GOTHIC_THEME.fonts.primary,
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    this.loadingText.setOrigin(0.5);
    this.loadingText.setDepth(1001);
  }

  /**
   * Hide loading overlay
   */
  private hideLoadingOverlay(): void {
    if (this.loadingOverlay) {
      this.tweens.add({
        targets: this.loadingOverlay,
        alpha: 0,
        duration: 300,
        ease: 'Power2.easeOut',
        onComplete: () => {
          this.loadingOverlay?.destroy();
          this.loadingOverlay = null;
        },
      });
    }
    if (this.loadingText) {
      this.tweens.add({
        targets: this.loadingText,
        alpha: 0,
        duration: 300,
        ease: 'Power2.easeOut',
        onComplete: () => {
          this.loadingText?.destroy();
          this.loadingText = null;
        },
      });
    }
  }

  /**
   * Animate elements in
   */
  private animateIn(): void {
    // Logo and cards are already animated in their creation methods
    // This method can be extended for additional animations
  }

  /**
   * Setup responsive event handlers
   */
  private setupResponsiveHandlers(): void {
    // Listen for resize events
    this.events.on('resize', this.handleResize, this);
    this.events.on('orientationchange', this.handleOrientationChange, this);
  }

  /**
   * Handle window resize
   */
  private handleResize(data: { width: number; height: number }): void {
    // Update background
    if (this.backgroundGraphics) {
      this.backgroundGraphics.clear();
      this.backgroundGraphics.fillGradientStyle(
        DARK_GOTHIC_THEME.colors.gradients.backgroundGradient.start,
        DARK_GOTHIC_THEME.colors.gradients.backgroundGradient.start,
        DARK_GOTHIC_THEME.colors.gradients.backgroundGradient.end,
        DARK_GOTHIC_THEME.colors.gradients.backgroundGradient.end,
        1,
      );
      this.backgroundGraphics.fillRect(0, 0, data.width, data.height);
    }

    // Update vignette overlay
    if (this.vignetteOverlay) {
      this.vignetteOverlay.setPosition(data.width / 2, data.height / 2);
    }

    // Update logo position
    if (this.logo) {
      const padding = ResponsiveUtils.getPadding('large');
      this.logo.setPosition(data.width / 2, padding * 4);
    }

    // Update souls display position
    if (this.soulsDisplay) {
      const padding = ResponsiveUtils.getPadding('large');
      this.soulsDisplay.setPosition(data.width - padding * 2, padding * 2);
    }

    // Reposition dashboard cards
    this.repositionDashboardCards(data.width, data.height);
  }

  /**
   * Handle orientation change
   */
  private handleOrientationChange(data: { orientation: string }): void {
    // Force a full redraw after a short delay to ensure DOM has updated
    this.time.delayedCall(100, () => {
      const width = this.scale.width;
      const height = this.scale.height;
      this.handleResize({ width, height });
    });
  }

  /**
   * Reposition dashboard cards based on new screen size
   */
  private repositionDashboardCards(screenWidth: number, screenHeight: number): void {
    const padding = ResponsiveUtils.getPadding('large');

    // Calculate UI element heights with adaptive logo
    const logoHeight = ResponsiveCardScaler.getAdaptiveLogoHeight(screenHeight, padding);
    const soulsHeight = padding * 4;

    // Recalculate optimal config for new size using ResponsiveCardScaler
    const scaledConfig = ResponsiveCardScaler.getOptimalCardConfig({
      viewportWidth: screenWidth,
      viewportHeight: screenHeight,
      logoHeight: logoHeight,
      soulsHeight: soulsHeight,
      baseConfig: DASHBOARD_CARD_CONFIG,
    });

    // Calculate grid positioning with NEW scaled dimensions
    const totalWidth = scaledConfig.columns * scaledConfig.width + (scaledConfig.columns - 1) * scaledConfig.gap;
    const totalHeight = scaledConfig.rows * scaledConfig.height + (scaledConfig.rows - 1) * scaledConfig.gap;

    const startX = (screenWidth - totalWidth) / 2 + scaledConfig.width / 2;
    const startY = logoHeight + ((screenHeight - logoHeight - soulsHeight - totalHeight) / 2) + scaledConfig.height / 2;

    // Reposition each card with NEW scaled layout
    this.dashboardCards.forEach((card, id) => {
      const cardIndex = Array.from(this.dashboardCards.keys()).indexOf(id);
      const row = Math.floor(cardIndex / scaledConfig.columns);
      const col = cardIndex % scaledConfig.columns;

      const x = startX + col * (scaledConfig.width + scaledConfig.gap);
      const y = startY + row * (scaledConfig.height + scaledConfig.gap);

      // Smooth transition to new position
      this.tweens.add({
        targets: card,
        x: x,
        y: y,
        duration: 300,
        ease: 'Power2.easeOut',
        onComplete: () => {
          // Update card's internal position tracking for hover effects
          card.updatePosition(x, y);
        },
      });
    });
  }

  /**
   * Helper: Get last world from save data
   */
  private getLastWorld(saveData: Readonly<GameSave>): number {
    const completedLevels = saveData.completedLevels || [];
    if (completedLevels.length === 0) return 1;

    // Parse last completed level (format: "1-1")
    const lastLevel = completedLevels[completedLevels.length - 1];
    if (!lastLevel) return 1;
    const world = parseInt(lastLevel.split('-')[0] || '1') || 1;
    return world;
  }

  /**
   * Helper: Get last level from save data
   */
  private getLastLevel(saveData: Readonly<GameSave>): number {
    const completedLevels = saveData.completedLevels || [];
    if (completedLevels.length === 0) return 1;

    const lastLevel = completedLevels[completedLevels.length - 1];
    if (!lastLevel) return 1;
    const level = parseInt(lastLevel.split('-')[1] || '1') || 1;
    return Math.min(level + 1, 5); // Next level, max 5 per world
  }

  /**
   * Helper: Get total stars from save data
   */
  private getTotalStars(saveData: Readonly<GameSave>): number {
    const levelStars = saveData.levelStars || {};
    return Object.values(levelStars).reduce((sum: number, stars: any) => sum + stars, 0);
  }

  /**
   * Helper: Get weapon display name
   */
  private getWeaponName(weaponId: string): string {
    const names: Record<string, string> = {
      basic_sword: 'Basic Sword',
      silver_blade: 'Silver Blade',
      holy_cross_blade: 'Holy Cross',
      fire_sword: 'Fire Sword',
      ice_blade: 'Ice Blade',
      lightning_katana: 'Lightning Katana',
    };
    return names[weaponId] || 'Unknown';
  }

  /**
   * Helper: Get new items badge if applicable
   */
  private getNewItemsBadge(saveData: Readonly<GameSave>): { text: string; color: number } | undefined {
    // Check if there are new weapons since last shop visit
    if (!saveData.lastShopVisit || Object.keys(saveData.weaponUnlockTimes).length === 0) {
      return undefined;
    }

    const lastVisitTime = new Date(saveData.lastShopVisit).getTime();
    let newItemsCount = 0;

    // Count weapons unlocked after last shop visit
    for (const [weaponId, unlockTime] of Object.entries(saveData.weaponUnlockTimes)) {
      const unlockTimestamp = new Date(unlockTime).getTime();
      if (unlockTimestamp > lastVisitTime) {
        newItemsCount++;
      }
    }

    // Show badge if there are new items
    if (newItemsCount > 0) {
      return {
        text: newItemsCount.toString(),
        color: 0xff4444, // Red color for badge
      };
    }

    return undefined;
  }

  /**
   * Toggle debug mode to visualize hit boxes
   */
  private toggleDebugMode(): void {
    this.debugMode = !this.debugMode;

    this.dashboardCards.forEach((card) => {
      if (this.debugMode) {
        card.enableDebugHitBox();
      } else {
        card.disableDebugHitBox();
      }
    });

    // Show debug message
    const debugText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 50,
      `Debug Hit Boxes: ${this.debugMode ? 'ON' : 'OFF'}`,
      {
        fontSize: '20px',
        color: this.debugMode ? '#00ff00' : '#ff0000',
        fontStyle: 'bold',
      },
    );
    debugText.setOrigin(0.5);
    debugText.setDepth(10000);

    // Fade out message after 2 seconds
    this.tweens.add({
      targets: debugText,
      alpha: 0,
      duration: 1000,
      delay: 1000,
      onComplete: () => debugText.destroy(),
    });
  }

  // Navigation methods (keep existing functionality)

  private onPlay(): void {
    this.audioManager?.playSFX('uiClick');
    this.scene.start(SCENE_KEYS.worldSelect);
  }

  private onEndless(): void {
    this.audioManager?.playSFX('uiClick');
    this.scene.start(SCENE_KEYS.endlessGameplay);
  }

  private onLeaderboard(): void {
    this.audioManager?.playSFX('uiClick');
    this.scene.start(SCENE_KEYS.leaderboard);
  }

  private onCharacter(): void {
    this.audioManager?.playSFX('uiClick');
    this.scene.start(SCENE_KEYS.character);
  }

  private onShop(): void {
    this.audioManager?.playSFX('uiClick');
    this.scene.start(SCENE_KEYS.shop);
  }

  private onSettings(): void {
    this.audioManager?.playSFX('uiClick');
    this.scene.start(SCENE_KEYS.settings);
  }

  private onUpdates(): void {
    this.audioManager?.playSFX('uiClick');
    this.scene.start(SCENE_KEYS.updates);
  }

  /**
   * Cleanup scene resources and remove event listeners
   * Called automatically when scene is shut down
   * 
   * @example
   * ```typescript
   * // Called automatically by Phaser
   * // Clean up: particle systems, cards, event listeners, audio
   * ```
   */
  public shutdown(): void {
    // Remove event listeners
    this.events.off('resize', this.handleResize, this);
    this.events.off('orientationchange', this.handleOrientationChange, this);
    this.input.keyboard?.off('keydown-D', this.toggleDebugMode, this);

    // Clean up Phase 1 components
    this.quickActionsPanel?.destroy();
    this.statsDashboard?.destroy();
    this.toastManager?.destroy();
    this.weatherEffect?.destroy();

    // Clean up particle background
    this.particleBackground?.destroy();

    // Clean up all cards
    this.dashboardCards.forEach((card) => card.destroy());
    this.dashboardCards.clear();

    // Clean up loading overlay
    this.loadingOverlay?.destroy();
    this.loadingOverlay = null;
    this.loadingText?.destroy();
    this.loadingText = null;

    // Stop music
    this.audioManager?.stopMusic();
  }
}
