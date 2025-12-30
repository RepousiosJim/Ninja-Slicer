/**
 * Character Scene - Enhanced Version
 *
 * Displays character information, equipped weapon, weapon stats,
 * and player stats from upgrades with enhanced UI components.
 * Features animated weapon preview, visual stat bars, effectiveness charts,
 * active effects display, and interactive elements.
 */

import Phaser from 'phaser';
import { debugLog } from '@utils/DebugLogger';

import {
  SCENE_KEYS,
  COLORS,
  FONT_SIZES,
  UI_ANIMATION_DURATION,
  GAME_WIDTH,
  GAME_HEIGHT,
} from '../config/constants';
import { Button, ButtonStyle } from '../ui/Button';
import { SaveManager } from '../managers/SaveManager';
import { WeaponManager } from '../managers/WeaponManager';
import { UpgradeManager } from '../managers/UpgradeManager';
import { AudioManager } from '../managers/AudioManager';
import { WeaponConfig, MonsterType } from '../config/types';
import { WeaponPreview } from '../ui/WeaponPreview';
import { StatBar } from '../ui/StatBar';
import { EffectivenessChart, EffectivenessData } from '../ui/EffectivenessChart';
import { EffectCard } from '../ui/EffectCard';
import { WeaponDetailsModal } from '../ui/WeaponDetailsModal';
import { ComparisonView } from '../ui/ComparisonView';
import { UITheme } from '../utils/UITheme';
import { ResponsiveUtils } from '../utils/ResponsiveUtils';
import { formatNumber } from '../utils/helpers';
import { MessageDisplay } from '../utils/MessageDisplay';
import { WeaponStatCalculator } from '../utils/WeaponStatCalculator';

/**
 * Character Scene - Enhanced
 */
export class CharacterScene extends Phaser.Scene {
  // UI elements - Layout containers
  private headerContainer: Phaser.GameObjects.Container | null = null;
  private mainContentContainer: Phaser.GameObjects.Container | null = null;
  private weaponPreviewContainer: Phaser.GameObjects.Container | null = null;
  private statsPanelContainer: Phaser.GameObjects.Container | null = null;
  private effectivenessContainer: Phaser.GameObjects.Container | null = null;
  private effectsContainer: Phaser.GameObjects.Container | null = null;
  private buttonsContainer: Phaser.GameObjects.Container | null = null;

  // UI components
  private weaponPreview: WeaponPreview | null = null;
  private weaponStatBars: StatBar[] = [];
  private playerStatBars: StatBar[] = [];
  private effectivenessChart: EffectivenessChart | null = null;
  private effectCards: EffectCard[] = [];

  // Buttons
  private testWeaponButton: Button | null = null;
  private viewDetailsButton: Button | null = null;
  private compareButton: Button | null = null;
  private changeWeaponButton: Button | null = null;
  private backButton: Button | null = null;

  // Modals
  private weaponDetailsModal: WeaponDetailsModal | null = null;
  private comparisonView: ComparisonView | null = null;

  // Background and effects
  private background: Phaser.GameObjects.Rectangle | null = null;
  private ambientParticles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  // Managers
  private saveManager: SaveManager;
  private weaponManager: WeaponManager;
  private upgradeManager: UpgradeManager;
  private audioManager: AudioManager;

  // Current weapon data
  private currentWeapon: WeaponConfig | null = null;
  private currentTier: number = 1;

  constructor() {
    super({ key: SCENE_KEYS.character });
    this.saveManager = new SaveManager();
    this.weaponManager = WeaponManager.getInstance();
    this.upgradeManager = UpgradeManager.getInstance();
    this.audioManager = new AudioManager(this);
  }

  /**
   * Create scene
   */
  public create(): void {
    // Load current weapon data
    this.loadCurrentWeaponData();

    // Create background with thematic elements
    this.createBackground();

    // Create header with title and navigation
    this.createHeader();

    // Create main content container
    const padding = ResponsiveUtils.getPadding('large');
    this.mainContentContainer = this.add.container(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + padding,
    );

    // Create weapon preview area (center)
    this.createWeaponPreviewArea();

    // Create stats panel (left side)
    this.createStatsPanel();

    // Create effectiveness chart (right side)
    this.createEffectivenessChart();

    // Create active effects display (bottom)
    this.createActiveEffectsDisplay();

    // Create action buttons (bottom)
    this.createActionButtons();

    // Add main content to scene
    this.add.existing(this.mainContentContainer);

    // Animate elements in
    this.animateIn();

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Load current weapon data from save
   */
  private loadCurrentWeaponData(): void {
    const saveData = this.saveManager.getSaveData();
    const equippedWeaponId = saveData.equippedWeapon as any;
    this.currentWeapon = this.weaponManager.getWeaponConfig(equippedWeaponId) || null;
    this.currentTier = saveData.weaponTiers[equippedWeaponId] || 1;
  }

  /**
   * Create background with thematic elements
   */
  private createBackground(): void {
    // Main background
    this.background = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width,
      this.cameras.main.height,
      COLORS.background,
    );
    this.background.setAlpha(0);

    // Create atmospheric particle effects
    this.createAtmosphericParticles();

    // Add subtle gradient overlay
    const gradient = this.add.graphics();
    gradient.setDepth(-1);
    gradient.fillGradientStyle(
      0x1a1a2e,
      0x1a1a2e,
      0x2a2a4a,
      0x2a2a4a,
      1,
    );
    gradient.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
    gradient.setAlpha(0.3);
  }

  /**
   * Create atmospheric particle effects
   */
  private createAtmosphericParticles(): void {
    // Create soul wisps (ambient particles)
    if (!this.textures.exists('particle_wisp')) {
      const wispTexture = this.textures.createCanvas('particle_wisp', 32, 32);
      if (wispTexture) {
        const ctx = wispTexture.getContext();
        if (ctx) {
          const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
          gradient.addColorStop(0, 'rgba(255, 215, 0, 1)');
          gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.5)');
          gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 32, 32);
          wispTexture.refresh();
        }
      }
    }

    // Create ambient particle emitter
    this.ambientParticles = this.add.particles(0, 0, 'particle_wisp', {
      x: { min: 0, max: this.cameras.main.width },
      y: { min: 0, max: this.cameras.main.height },
      speedX: { min: -20, max: 20 },
      speedY: { min: -30, max: -10 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 4000,
      frequency: 200,
      blendMode: 'ADD',
      emitting: true,
    });
    this.ambientParticles.setDepth(-2);
  }

  /**
   * Create header with title and navigation
   */
  private createHeader(): void {
    const padding = ResponsiveUtils.getPadding('large');
    const titleFontSize = ResponsiveUtils.getFontSize('title');
    const buttonSize = ResponsiveUtils.getButtonSize();

    this.headerContainer = this.add.container(
      GAME_WIDTH / 2,
      padding * 2,
    );

    // Title
    const title = this.add.text(0, 0, 'CHARACTER', {
      fontSize: `${titleFontSize}px`,
      color: '#FFFFFF',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#8b0000',
        blur: 10,
        stroke: false,
        fill: true,
      },
    });
    title.setOrigin(0.5);
    title.setAlpha(0);
    this.headerContainer.add(title);

    // Back button (left)
    const backButton = new Button(
      this,
      -GAME_WIDTH / 2 + buttonSize.width / 2 + padding,
      0,
      buttonSize.width * 0.6,
      buttonSize.height * 0.7,
      'BACK',
      {
        style: ButtonStyle.SECONDARY,
        fontSize: ResponsiveUtils.getFontSize('small'),
        onClick: this.onBack.bind(this),
      },
    );
    backButton.setAlpha(0);
    this.headerContainer.add(backButton);

    // Souls balance display (top right, before help button)
    const souls = this.saveManager.getSouls();
    const soulsBalance = UITheme.createSoulsBalance(
      this,
      souls,
      GAME_WIDTH / 2 - buttonSize.width - padding * 2,
      0,
    );
    soulsBalance.setAlpha(0);
    this.headerContainer.add(soulsBalance);

    // Help button (right)
    const helpButton = new Button(
      this,
      GAME_WIDTH / 2 - buttonSize.width / 2 - padding,
      0,
      buttonSize.width * 0.3,
      buttonSize.height * 0.7,
      '?',
      {
        style: ButtonStyle.SECONDARY,
        fontSize: ResponsiveUtils.getFontSize('medium'),
        onClick: this.onHelp.bind(this),
      },
    );
    helpButton.setAlpha(0);
    this.headerContainer.add(helpButton);

    this.add.existing(this.headerContainer);
  }

  /**
   * Create weapon preview area (center)
   */
  private createWeaponPreviewArea(): void {
    const yOffset = -GAME_HEIGHT * 0.15; // 15% above center
    this.weaponPreviewContainer = this.add.container(0, yOffset);

    if (!this.currentWeapon) return;

    // Create weapon preview component
    this.weaponPreview = new WeaponPreview(this, 0, 0, {
      weapon: this.currentWeapon,
      tier: this.currentTier,
      size: 'large',
      showTrail: true,
    });
    this.weaponPreview.setAlpha(0);
    this.weaponPreviewContainer.add(this.weaponPreview);

    // Setup weapon click event
    this.weaponPreview.on('weapon-clicked', this.onWeaponClicked.bind(this));

    // Add upgrade cost display or max tier badge
    this.createUpgradeCostDisplay();

    this.mainContentContainer?.add(this.weaponPreviewContainer);
  }

  /**
   * Create upgrade cost display or max tier badge
   */
  private createUpgradeCostDisplay(): void {
    if (!this.currentWeapon || !this.weaponPreviewContainer) return;

    const maxTier = 3; // Maximum tier for weapons

    if (this.currentTier >= maxTier) {
      // Show MAX TIER badge
      const maxTierBadge = UITheme.createMaxTierBadge(this, 0, 120);
      maxTierBadge.setAlpha(0);
      this.weaponPreviewContainer.add(maxTierBadge);
    } else {
      // Show upgrade cost using WeaponStatCalculator
      const upgradeCost = WeaponStatCalculator.getUpgradeCost(this.currentWeapon, this.currentTier);
      const souls = this.saveManager.getSouls();
      const affordable = souls >= upgradeCost;

      // Create cost display
      const costDisplay = UITheme.createCostDisplay(
        this,
        upgradeCost,
        affordable,
        0,
        120,
      );
      costDisplay.setAlpha(0);
      this.weaponPreviewContainer.add(costDisplay);

      // Add "UPGRADE" label above cost
      const upgradeLabel = this.add.text(0, 90, 'NEXT TIER', {
        fontFamily: 'Arial',
        fontSize: `${ResponsiveUtils.getFontSize('small')}px`,
        color: '#aaaaaa',
        fontStyle: 'bold',
      });
      upgradeLabel.setOrigin(0.5, 0.5);
      upgradeLabel.setAlpha(0);
      this.weaponPreviewContainer.add(upgradeLabel);
    }
  }

  /**
   * Create stats panel (left side)
   */
  private createStatsPanel(): void {
    const xOffset = -GAME_WIDTH * 0.3; // 30% left from center
    const panelWidth = GAME_WIDTH * 0.22;
    const panelHeight = GAME_HEIGHT * 0.5;

    this.statsPanelContainer = this.add.container(xOffset, GAME_HEIGHT * 0.05);

    // Panel background
    const panelBg = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x2a2a4a);
    panelBg.setStrokeStyle(2, COLORS.accent);
    panelBg.setAlpha(0.9);
    this.statsPanelContainer.add(panelBg);

    // Weapon stats section
    const weaponTitle = this.add.text(-panelWidth * 0.4, -panelHeight * 0.4, 'WEAPON STATS', {
      fontSize: `${ResponsiveUtils.getFontSize('medium')}px`,
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    weaponTitle.setOrigin(0, 0.5);
    this.statsPanelContainer.add(weaponTitle);

    // Create weapon stat bars
    this.createWeaponStatBars();

    // Player stats section
    const playerTitle = this.add.text(-panelWidth * 0.4, panelHeight * 0.1, 'PLAYER STATS', {
      fontSize: `${ResponsiveUtils.getFontSize('medium')}px`,
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    playerTitle.setOrigin(0, 0.5);
    this.statsPanelContainer.add(playerTitle);

    // Create player stat bars
    this.createPlayerStatBars();

    this.mainContentContainer?.add(this.statsPanelContainer);
  }

  /**
   * Create weapon stat bars using WeaponStatCalculator
   */
  private createWeaponStatBars(): void {
    if (!this.currentWeapon) return;

    // Use WeaponStatCalculator for consistent stat calculation
    const stats = WeaponStatCalculator.getAllStats(this.currentWeapon, this.currentTier);

    const panelWidth = GAME_WIDTH * 0.22;
    const panelHeight = GAME_HEIGHT * 0.5;
    const startY = -panelHeight * 0.3;
    const statSpacing = ResponsiveUtils.getPadding('medium');
    const barWidth = panelWidth * 0.7;

    stats.forEach((stat, index) => {
      const y = startY + index * statSpacing;

      // Create stat label
      const label = this.add.text(-panelWidth * 0.4, y, stat.label, {
        fontSize: `${ResponsiveUtils.getFontSize('small')}px`,
        color: '#CCCCCC',
      });
      label.setOrigin(0, 0.5);
      this.statsPanelContainer?.add(label);

      // Create stat bar
      const bar = new StatBar(this, 0, y, {
        label: '',
        value: stat.value,
        maxValue: stat.max,
        width: barWidth,
        height: 18,
        showLabel: false,
        showValue: true,
      });
      this.weaponStatBars.push(bar);
      this.statsPanelContainer?.add(bar);
    });
  }

  /**
   * Create player stat bars
   */
  private createPlayerStatBars(): void {
    const playerStats = this.upgradeManager.getPlayerStats();

    const stats = [
      { label: 'Slash Width', value: playerStats.slashWidthMultiplier * 50, max: 100 },
      { label: 'Extra Lives', value: playerStats.startingLives * 10, max: 100 },
      { label: 'Score Mult', value: playerStats.scoreMultiplier * 50, max: 100 },
      { label: 'Crit Chance', value: playerStats.criticalHitChance * 100, max: 100 },
    ];

    const panelWidth = GAME_WIDTH * 0.22;
    const panelHeight = GAME_HEIGHT * 0.5;
    const startY = panelHeight * 0.15;
    const statSpacing = ResponsiveUtils.getPadding('medium');
    const barWidth = panelWidth * 0.7;

    stats.forEach((stat, index) => {
      const y = startY + index * statSpacing;

      // Create stat label
      const label = this.add.text(-panelWidth * 0.4, y, stat.label, {
        fontSize: `${ResponsiveUtils.getFontSize('small')}px`,
        color: '#CCCCCC',
      });
      label.setOrigin(0, 0.5);
      this.statsPanelContainer?.add(label);

      // Create stat bar
      const bar = new StatBar(this, 0, y, {
        label: '',
        value: stat.value,
        maxValue: stat.max,
        width: barWidth,
        height: 18,
        showLabel: false,
        showValue: true,
      });
      this.playerStatBars.push(bar);
      this.statsPanelContainer?.add(bar);
    });
  }

  /**
   * Create effectiveness chart (right side)
   */
  private createEffectivenessChart(): void {
    const xOffset = GAME_WIDTH * 0.3; // 30% right from center
    const panelWidth = GAME_WIDTH * 0.22;
    const panelHeight = GAME_HEIGHT * 0.5;
    const chartWidth = panelWidth * 0.85;
    const chartHeight = panelHeight * 0.6;

    this.effectivenessContainer = this.add.container(xOffset, GAME_HEIGHT * 0.05);

    // Panel background
    const panelBg = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x2a2a4a);
    panelBg.setStrokeStyle(2, COLORS.accent);
    panelBg.setAlpha(0.9);
    this.effectivenessContainer.add(panelBg);

    // Title
    const title = this.add.text(0, -panelHeight * 0.4, 'EFFECTIVENESS', {
      fontSize: `${ResponsiveUtils.getFontSize('medium')}px`,
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    this.effectivenessContainer.add(title);

    // Create effectiveness chart using WeaponStatCalculator
    const data = WeaponStatCalculator.getAllEffectiveness(this.currentWeapon, this.currentTier);

    this.effectivenessChart = new EffectivenessChart(this, 0, 0, {
      data: data,
      chartType: 'bar',
      width: chartWidth,
      height: chartHeight,
      showLabels: true,
      showPercentages: true,
    });
    this.effectivenessChart.setAlpha(0);
    this.effectivenessContainer.add(this.effectivenessChart);

    this.mainContentContainer?.add(this.effectivenessContainer);
  }

  /**
   * Create active effects display (bottom)
   */
  private createActiveEffectsDisplay(): void {
    this.effectsContainer = this.add.container(0, 200);

    if (!this.currentWeapon) return;

    const tierData = this.currentWeapon.tiers[this.currentTier - 1];
    if (!tierData || !tierData.effects || tierData.effects.length === 0) {
      return;
    }

    // Title
    const title = this.add.text(0, -50, `ACTIVE EFFECTS (TIER ${this.currentTier})`, {
      fontSize: `${FONT_SIZES.medium}px`,
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    this.effectsContainer.add(title);

    // Create effect cards
    const cardWidth = 220;
    const cardSpacing = 15;
    const totalWidth = tierData.effects.length * cardWidth + (tierData.effects.length - 1) * cardSpacing;
    const startX = -totalWidth / 2 + cardWidth / 2;

    tierData.effects.forEach((effect, index) => {
      const x = startX + index * (cardWidth + cardSpacing);
      const y = 20;

      const effectCard = new EffectCard(this, x, y, {
        effect: effect,
        tier: this.currentTier,
        showTooltip: true,
      });
      effectCard.setAlpha(0);
      this.effectCards.push(effectCard);
      if (this.effectsContainer) {
        this.effectsContainer.add(effectCard);
      }
    });

    // Next tier preview
    if (this.currentWeapon && this.currentTier < this.currentWeapon.tiers.length) {
      const nextTierData = this.currentWeapon.tiers[this.currentTier];
      if (nextTierData) {
        const nextTierText = this.add.text(0, 120, `Next Tier: ${nextTierData.description}`, {
          fontSize: '14px',
          color: '#888888',
        });
        nextTierText.setOrigin(0.5);
        nextTierText.setWordWrapWidth(400);
        if (this.effectsContainer) {
          this.effectsContainer.add(nextTierText);
        }
      }
    }

    this.mainContentContainer?.add(this.effectsContainer);
  }

  /**
   * Create action buttons (bottom)
   */
  private createActionButtons(): void {
    this.buttonsContainer = this.add.container(0, 320);

    const buttonWidth = 180;
    const buttonHeight = 45;
    const buttonSpacing = 15;
    const totalWidth = 4 * buttonWidth + 3 * buttonSpacing;
    const startX = -totalWidth / 2 + buttonWidth / 2;

    // Test Weapon button
    this.testWeaponButton = new Button(
      this,
      startX,
      0,
      buttonWidth,
      buttonHeight,
      'TEST WEAPON',
      {
        style: ButtonStyle.PRIMARY,
        fontSize: FONT_SIZES.small,
        onClick: this.onTestWeapon.bind(this),
      },
    );
    this.testWeaponButton.setAlpha(0);
    this.buttonsContainer.add(this.testWeaponButton);

    // View Details button
    this.viewDetailsButton = new Button(
      this,
      startX + buttonWidth + buttonSpacing,
      0,
      buttonWidth,
      buttonHeight,
      'VIEW DETAILS',
      {
        style: ButtonStyle.PRIMARY,
        fontSize: FONT_SIZES.small,
        onClick: this.onViewDetails.bind(this),
      },
    );
    this.viewDetailsButton.setAlpha(0);
    this.buttonsContainer.add(this.viewDetailsButton);

    // Compare button
    this.compareButton = new Button(
      this,
      startX + 2 * (buttonWidth + buttonSpacing),
      0,
      buttonWidth,
      buttonHeight,
      'COMPARE',
      {
        style: ButtonStyle.PRIMARY,
        fontSize: FONT_SIZES.small,
        onClick: this.onCompare.bind(this),
      },
    );
    this.compareButton.setAlpha(0);
    this.buttonsContainer.add(this.compareButton);

    // Change Weapon button
    this.changeWeaponButton = new Button(
      this,
      startX + 3 * (buttonWidth + buttonSpacing),
      0,
      buttonWidth,
      buttonHeight,
      'CHANGE WEAPON',
      {
        style: ButtonStyle.SECONDARY,
        fontSize: FONT_SIZES.small,
        onClick: this.onChangeWeapon.bind(this),
      },
    );
    this.changeWeaponButton.setAlpha(0);
    this.buttonsContainer.add(this.changeWeaponButton);

    // Back button (separate, at bottom)
    this.backButton = new Button(
      this,
      0,
      400,
      150,
      40,
      'BACK',
      {
        style: ButtonStyle.SECONDARY,
        fontSize: FONT_SIZES.small,
        onClick: this.onBack.bind(this),
      },
    );
    this.backButton.setAlpha(0);
    this.buttonsContainer.add(this.backButton);

    this.mainContentContainer?.add(this.buttonsContainer);
  }

  /**
   * Animate elements in
   */
  private animateIn(): void {
    // Background fade in
    if (this.background) {
      this.tweens.add({
        targets: this.background,
        alpha: 1,
        duration: UI_ANIMATION_DURATION * 2,
      });
    }

    // Header animation
    if (this.headerContainer) {
      this.headerContainer.list.forEach((child: any, index: number) => {
        this.tweens.add({
          targets: child,
          alpha: 1,
          y: child.y + 10,
          duration: UI_ANIMATION_DURATION * 2,
          delay: index * 100,
          ease: 'Power2',
        });
      });
    }

    // Weapon preview animation
    if (this.weaponPreview) {
      this.tweens.add({
        targets: this.weaponPreview,
        alpha: 1,
        scale: 1,
        duration: UI_ANIMATION_DURATION * 3,
        delay: UI_ANIMATION_DURATION,
        ease: 'Back.easeOut',
      });
    }

    // Stats panel animation
    if (this.statsPanelContainer) {
      this.tweens.add({
        targets: this.statsPanelContainer,
        alpha: 1,
        x: -350,
        duration: UI_ANIMATION_DURATION * 2,
        delay: UI_ANIMATION_DURATION * 1.5,
        ease: 'Power2',
      });
    }

    // Effectiveness chart animation
    if (this.effectivenessChart) {
      this.tweens.add({
        targets: this.effectivenessChart,
        alpha: 1,
        duration: UI_ANIMATION_DURATION * 2,
        delay: UI_ANIMATION_DURATION * 2,
        ease: 'Power2',
      });
    }

    // Effect cards animation
    this.effectCards.forEach((card, index) => {
      this.tweens.add({
        targets: card,
        alpha: 1,
        duration: UI_ANIMATION_DURATION * 2,
        delay: UI_ANIMATION_DURATION * 2.5 + index * 100,
        ease: 'Power2',
      });
    });

    // Buttons animation
    const buttons = [
      this.testWeaponButton,
      this.viewDetailsButton,
      this.compareButton,
      this.changeWeaponButton,
      this.backButton,
    ];
    buttons.forEach((button, index) => {
      if (button) {
        this.tweens.add({
          targets: button,
          alpha: 1,
          y: button.y + 10,
          duration: UI_ANIMATION_DURATION * 2,
          delay: UI_ANIMATION_DURATION * 3 + index * 100,
          ease: 'Power2',
        });
      }
    });
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen for weapon changes from other scenes
    this.events.on('weapon-changed', this.onWeaponChanged.bind(this));
  }

  /**
   * Handle weapon clicked event
   */
  private onWeaponClicked(): void {
    this.audioManager.playSFX('uiClick');

    // Rotate weapon preview 360 degrees
    if (this.weaponPreview) {
      this.tweens.add({
        targets: this.weaponPreview,
        angle: 360,
        duration: 1000,
        ease: 'Power2',
        onComplete: () => {
          if (this.weaponPreview) {
            this.weaponPreview.angle = 0;
          }
        },
      });
    }
  }

  /**
   * Handle test weapon button click
   */
  private onTestWeapon(): void {
    this.audioManager.playSFX('uiClick');
    // Navigate to test mode
    this.scene.start('TestWeaponScene');
  }

  /**
   * Handle view details button click
   */
  private onViewDetails(): void {
    this.audioManager.playSFX('uiClick');

    if (!this.currentWeapon) return;

    // Create and open weapon details modal
    this.weaponDetailsModal = new WeaponDetailsModal(
      this,
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      {
        weapon: this.currentWeapon,
        tier: this.currentTier,
        maxTier: this.currentWeapon.tiers.length,
        onEquip: this.onEquipFromModal.bind(this),
        onUpgrade: this.onUpgradeFromModal.bind(this),
        onClose: this.onDetailsModalClose.bind(this),
      },
    );
    this.add.existing(this.weaponDetailsModal);
    this.weaponDetailsModal.open();
  }

  /**
   * Handle compare button click
   */
  private onCompare(): void {
    this.audioManager.playSFX('uiClick');

    if (!this.currentWeapon) return;

    // Get a different weapon for comparison
    const allWeapons = this.weaponManager.getAllWeapons();
    const otherWeapon = allWeapons.find(w => w.id !== this.currentWeapon?.id);
    if (!otherWeapon) return;

    const saveData = this.saveManager.getSaveData();
    const otherTier = saveData.weaponTiers[otherWeapon.id] || 1;

    // Create and open comparison view
    this.comparisonView = new ComparisonView(
      this,
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      {
        weapon1: this.currentWeapon,
        weapon1Tier: this.currentTier,
        weapon2: otherWeapon,
        weapon2Tier: otherTier,
        onSwitch: this.onSwitchWeapon.bind(this),
        onClose: this.onComparisonClose.bind(this),
      },
    );
    this.add.existing(this.comparisonView);
  }

  /**
   * Handle change weapon button click
   */
  private onChangeWeapon(): void {
    this.audioManager.playSFX('uiClick');
    this.scene.start(SCENE_KEYS.inventory);
  }

  /**
   * Handle back button click
   */
  private onBack(): void {
    this.audioManager.playSFX('uiClick');
    this.scene.start(SCENE_KEYS.mainMenu);
  }

  /**
   * Handle help button click
   */
  private onHelp(): void {
    this.audioManager.playSFX('uiClick');

    // Create help panel
    const helpPanel = UITheme.createPanel(
      this,
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      ResponsiveUtils.getButtonSize().width * 3,
      GAME_HEIGHT * 0.7,
      'CHARACTER PAGE HELP',
    );
    helpPanel.setDepth(10000);

    // Help text content
    const helpText = this.add.text(
      0,
      20,
      'CONTROLS & FEATURES\n\n' +
      '• View your equipped weapon stats\n' +
      '• Check player upgrades and bonuses\n' +
      '• Click weapon preview to rotate\n' +
      '• Upgrade weapons with souls\n' +
      '• Test weapons in practice mode\n' +
      '• Compare weapons side-by-side\n' +
      '• View detailed effectiveness charts\n\n' +
      'WEAPON STATS\n\n' +
      '• Damage: Attack power rating\n' +
      '• Speed: Attack speed rating\n' +
      '• Range: Effective range rating\n' +
      '• Effectiveness: Bonus vs enemies\n\n' +
      'Click anywhere to close',
      {
        fontFamily: 'Arial',
        fontSize: `${ResponsiveUtils.getFontSize('small')}px`,
        color: '#ffffff',
        align: 'left',
        wordWrap: { width: ResponsiveUtils.getButtonSize().width * 2.8 },
        lineSpacing: 4,
      },
    );
    helpText.setOrigin(0.5, 0);
    helpPanel.add(helpText);

    // Semi-transparent overlay background
    const overlay = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.7,
    );
    overlay.setDepth(9999);
    overlay.setInteractive();

    // Close on click
    overlay.on('pointerdown', () => {
      this.audioManager.playSFX('uiClick');
      overlay.destroy();
      helpPanel.destroy();
    });

    // Fade in animation
    helpPanel.setAlpha(0);
    this.tweens.add({
      targets: helpPanel,
      alpha: 1,
      duration: 300,
      ease: 'Power2',
    });
  }

  /**
   * Handle weapon changed event
   */
  private onWeaponChanged(): void {
    this.loadCurrentWeaponData();
    this.updateUI();
  }

  /**
   * Handle equip from modal
   */
  private onEquipFromModal(): void {
    if (!this.currentWeapon) return;

    this.saveManager.equipWeapon(this.currentWeapon.id);
    this.audioManager.playSFX('uiClick');
    debugLog('Weapon equipped:', this.currentWeapon.name);
  }

  /**
   * Handle upgrade from modal
   */
  private onUpgradeFromModal(): void {
    if (!this.currentWeapon) return;

    const saveData = this.saveManager.getSaveData();
    const currentTier = saveData.weaponTiers[this.currentWeapon.id] || 1;

    if (currentTier < this.currentWeapon.tiers.length) {
      const nextTier = this.currentWeapon.tiers[currentTier];
      if (nextTier && this.saveManager.spendSouls(nextTier.upgradeCost)) {
        this.saveManager.upgradeWeapon(this.currentWeapon.id);
        this.currentTier = currentTier + 1;
        this.updateUI();

        this.audioManager.playSFX('uiClick');
        debugLog('Weapon upgraded to tier', this.currentTier);
      }
    }
  }

  /**
   * Handle details modal close
   */
  private onDetailsModalClose(): void {
    if (this.weaponDetailsModal) {
      this.weaponDetailsModal.destroy();
      this.weaponDetailsModal = null;
    }
  }

  /**
   * Handle switch weapon from comparison
   */
  private onSwitchWeapon(): void {
    if (!this.comparisonView) return;

    // Switch to comparison weapon - note: ComparisonView handles switching internally
    // The onSwitch callback is triggered when user clicks switch button
    this.audioManager.playSFX('uiClick');
    debugLog('Switch weapon triggered - comparison view handles switching');
  }

  /**
   * Handle comparison view close
   */
  private onComparisonClose(): void {
    if (this.comparisonView) {
      this.comparisonView.destroy();
      this.comparisonView = null;
    }
  }

  /**
   * Update UI with current weapon data using WeaponStatCalculator
   */
  private updateUI(): void {
    // Update weapon preview
    if (this.weaponPreview && this.currentWeapon) {
      this.weaponPreview.updateWeapon(this.currentWeapon);
      this.weaponPreview.setTier(this.currentTier);
    }

    // Update weapon stat bars using WeaponStatCalculator
    if (this.currentWeapon) {
      const stats = WeaponStatCalculator.getAllStats(this.currentWeapon, this.currentTier);
      this.weaponStatBars.forEach((bar, index) => {
        if (index < stats.length) {
          bar.setValue(stats[index].value);
        }
      });
    }

    // Update effectiveness chart using WeaponStatCalculator
    if (this.effectivenessChart && this.currentWeapon) {
      const data = WeaponStatCalculator.getAllEffectiveness(this.currentWeapon, this.currentTier);
      this.effectivenessChart.updateData(data);
    }

    // Update effect cards
    this.effectCards.forEach((card) => {
      this.effectsContainer?.remove(card);
      card.destroy();
    });
    this.effectCards = [];
    this.createActiveEffectsDisplay();
  }

  /**
   * Clean up scene resources
   */
  public destroy(): void {
    // Clean up particles
    if (this.ambientParticles) {
      this.ambientParticles.destroy();
    }

    // Clean up modals
    if (this.weaponDetailsModal) {
      this.weaponDetailsModal.destroy();
    }
    if (this.comparisonView) {
      this.comparisonView.destroy();
    }

    // Clean up components
    if (this.weaponPreview) {
      this.weaponPreview.destroy();
    }
    if (this.effectivenessChart) {
      this.effectivenessChart.destroy();
    }

    // Clean up stat bars
    this.weaponStatBars.forEach((bar) => bar.destroy());
    this.playerStatBars.forEach((bar) => bar.destroy());

    // Clean up effect cards
    this.effectCards.forEach((card) => card.destroy());

    // Remove event listeners
    this.events.off('weapon-changed', this.onWeaponChanged.bind(this));
  }
}
