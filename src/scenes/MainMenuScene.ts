/**
 * Main Menu Scene - Card-Based Dashboard Redesign
 *
 * Features modern card-based layout with gradient backgrounds,
 * particle effects, and enhanced visual polish
 */

import Phaser from 'phaser';
import { SCENE_KEYS, TEXTURE_KEYS, GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { DARK_GOTHIC_THEME, DASHBOARD_CARD_CONFIG } from '../config/theme';
import { DashboardCard } from '../ui/DashboardCard';
import { ParticleBackground } from '../ui/ParticleBackground';
import { GlowEffect } from '../ui/GlowEffect';
import { TextureGenerator } from '../utils/TextureGenerator';
import { SaveManager } from '../managers/SaveManager';
import { AudioManager } from '../managers/AudioManager';
import { formatNumber } from '../utils/helpers';
import { ResponsiveUtils } from '../utils/ResponsiveUtils';

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

    // Create layered background
    this.createLayeredBackground();

    // Create logo with glow
    this.createEnhancedLogo();

    // Create card dashboard
    this.createCardDashboard();

    // Create souls display
    this.createSoulsDisplay();

    // Play menu music
    this.audioManager?.playMusic('menuMusic');

    // Animate elements in
    this.animateIn();

    // Setup responsive event handlers
    this.setupResponsiveHandlers();
  }

  /**
   * Create layered background with gradient, particles, and vignette
   */
  private createLayeredBackground(): void {
    // Layer 1: Gradient background
    this.backgroundGraphics = this.add.graphics();
    this.backgroundGraphics.fillGradientStyle(
      DARK_GOTHIC_THEME.colors.gradients.backgroundGradient.start,
      DARK_GOTHIC_THEME.colors.gradients.backgroundGradient.start,
      DARK_GOTHIC_THEME.colors.gradients.backgroundGradient.end,
      DARK_GOTHIC_THEME.colors.gradients.backgroundGradient.end,
      1
    );
    this.backgroundGraphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.backgroundGraphics.setDepth(-20);

    // Layer 2: Particle systems
    this.particleBackground = new ParticleBackground(this, {
      types: ['soulWisp', 'ember', 'mist'],
      depth: -10,
      interactive: true,
    });
    this.add.existing(this.particleBackground);

    // Layer 3: Vignette overlay
    const vignetteTexture = TextureGenerator.createVignetteTexture(
      this,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.5,
      0.7
    );

    this.vignetteOverlay = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, vignetteTexture.key);
    this.vignetteOverlay.setDepth(-5);
    this.vignetteOverlay.setAlpha(0.8);
  }

  /**
   * Create enhanced logo with glow effect
   */
  private createEnhancedLogo(): void {
    const padding = ResponsiveUtils.getPadding('large');
    const logoFontSize = ResponsiveUtils.getFontSize('title');

    this.logo = this.add.container(GAME_WIDTH / 2, padding * 4);

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
      y: padding * 5,
      duration: 800,
      delay: 200,
      ease: 'Back.easeOut',
    });

    // Floating animation
    this.tweens.add({
      targets: this.logo,
      y: padding * 5.5,
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
    const cardConfig = DASHBOARD_CARD_CONFIG;

    // Calculate grid positioning
    const totalWidth = cardConfig.columns * cardConfig.width + (cardConfig.columns - 1) * cardConfig.gap;
    const totalHeight = cardConfig.rows * cardConfig.height + (cardConfig.rows - 1) * cardConfig.gap;

    const startX = (GAME_WIDTH - totalWidth) / 2 + cardConfig.width / 2;
    const startY = GAME_HEIGHT * 0.35 + cardConfig.height / 2;

    // Get current stats for cards
    const saveData = this.saveManager.getSaveData();
    const lastWorld = this.getLastWorld(saveData);
    const lastLevel = this.getLastLevel(saveData);
    const totalStars = this.getTotalStars(saveData);

    // Card configurations
    const cards = [
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
          { label: 'Rank', value: '#--' }, // TODO: Get from leaderboard
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

    // Create cards in grid
    cards.forEach((cardData, index) => {
      const row = Math.floor(index / cardConfig.columns);
      const col = index % cardConfig.columns;

      const x = startX + col * (cardConfig.width + cardConfig.gap);
      const y = startY + row * (cardConfig.height + cardConfig.gap);

      const card = new DashboardCard(this, x, y, cardData);
      card.setAlpha(0);
      card.setScale(0.8);
      card.setDepth(50);
      this.add.existing(card);

      this.dashboardCards.set(cardData.id, card);

      // Staggered entrance animation
      this.tweens.add({
        targets: card,
        alpha: 1,
        scale: 1,
        y: y,
        duration: DARK_GOTHIC_THEME.animations.presets.cardEntrance.duration,
        delay: 400 + (index * DARK_GOTHIC_THEME.animations.presets.staggerDelay),
        ease: DARK_GOTHIC_THEME.animations.presets.cardEntrance.easing,
      });
    });
  }

  /**
   * Create souls display
   */
  private createSoulsDisplay(): void {
    const padding = ResponsiveUtils.getPadding('large');
    const fontSize = ResponsiveUtils.getFontSize('medium');

    const saveData = this.saveManager.getSaveData();
    const soulsText = `💀 ${formatNumber(saveData.souls)}`;

    this.soulsDisplay = this.add.text(GAME_WIDTH - padding * 2, padding * 2, soulsText, {
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
        1
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
    const cardConfig = DASHBOARD_CARD_CONFIG;

    // Calculate grid positioning
    const totalWidth = cardConfig.columns * cardConfig.width + (cardConfig.columns - 1) * cardConfig.gap;
    const startX = (screenWidth - totalWidth) / 2 + cardConfig.width / 2;
    const startY = screenHeight * 0.35 + cardConfig.height / 2;

    // Reposition each card
    this.dashboardCards.forEach((card, id) => {
      const cardIndex = Array.from(this.dashboardCards.keys()).indexOf(id);
      const row = Math.floor(cardIndex / cardConfig.columns);
      const col = cardIndex % cardConfig.columns;

      const x = startX + col * (cardConfig.width + cardConfig.gap);
      const y = startY + row * (cardConfig.height + cardConfig.gap);

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
  private getLastWorld(saveData: any): number {
    const completedLevels = saveData.completedLevels || [];
    if (completedLevels.length === 0) return 1;

    // Parse last completed level (format: "1-1")
    const lastLevel = completedLevels[completedLevels.length - 1];
    const world = parseInt(lastLevel.split('-')[0]) || 1;
    return world;
  }

  /**
   * Helper: Get last level from save data
   */
  private getLastLevel(saveData: any): number {
    const completedLevels = saveData.completedLevels || [];
    if (completedLevels.length === 0) return 1;

    const lastLevel = completedLevels[completedLevels.length - 1];
    const level = parseInt(lastLevel.split('-')[1]) || 1;
    return Math.min(level + 1, 5); // Next level, max 5 per world
  }

  /**
   * Helper: Get total stars from save data
   */
  private getTotalStars(saveData: any): number {
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
  private getNewItemsBadge(saveData: any): { text: string; color: number } | undefined {
    // TODO: Implement logic to detect new items since last visit
    // For now, return undefined (no badge)
    return undefined;
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
   * Cleanup
   */
  public shutdown(): void {
    // Remove event listeners
    this.events.off('resize', this.handleResize, this);
    this.events.off('orientationchange', this.handleOrientationChange, this);

    // Clean up particle background
    this.particleBackground?.destroy();

    // Clean up all cards
    this.dashboardCards.forEach((card) => card.destroy());
    this.dashboardCards.clear();

    // Stop music
    this.audioManager?.stopMusic();
  }
}
