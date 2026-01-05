/**
 * HUD
 * 
 * Displays game information such as score, lives, combo, souls, and power-up indicators.
 */

import Phaser from 'phaser';
import { FONT_SIZES, COLORS, DEFAULT_STARTING_LIVES, GAME_WIDTH, GAME_HEIGHT, COMBO_TIMEOUT } from '../config/constants';
import { DARK_GOTHIC_THEME } from '../config/theme';
import { EventBus } from '../utils/EventBus';
import { Button, ButtonStyle } from './Button';
import { ResponsiveUtils } from '../utils/ResponsiveUtils';
import { ComboSystem } from '../systems/ComboSystem';

export class HUD {
  private scene: Phaser.Scene;
  private scoreText!: Phaser.GameObjects.Text;
  private scoreLabel!: Phaser.GameObjects.Text;
  private livesContainer!: Phaser.GameObjects.Container;
  private hearts: Phaser.GameObjects.Sprite[] = [];
  private comboText!: Phaser.GameObjects.Text;
  private comboLabel!: Phaser.GameObjects.Text;
  private comboTimerBarContainer!: Phaser.GameObjects.Container;
  private comboTimerBarBackground!: Phaser.GameObjects.Rectangle;
  private comboTimerBarFill!: Phaser.GameObjects.Rectangle;
  private comboTimerBarWidth: number = 200;
  private comboTimerBarHeight: number = 8;
  private soulsText!: Phaser.GameObjects.Text;
  private soulsLabel!: Phaser.GameObjects.Text;
  private soulsIcon!: Phaser.GameObjects.Sprite;
  private powerUpContainer!: Phaser.GameObjects.Container;
  private powerUpIcons: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private pauseButton: Button | null = null;

  // Score animation tracking
  private previousScore: number = 0;
  private scorePopTween: Phaser.Tweens.Tween | null = null;

  // Campaign mode elements
  private timerText!: Phaser.GameObjects.Text;
  private timerLabel!: Phaser.GameObjects.Text;
  private killQuotaText!: Phaser.GameObjects.Text;
  private killQuotaLabel!: Phaser.GameObjects.Text;
  private bossHealthBarContainer!: Phaser.GameObjects.Container | null;
  private bossHealthBarBackground!: Phaser.GameObjects.Rectangle | null;
  private bossHealthBarFill!: Phaser.GameObjects.Rectangle | null;
  private bossHealthBarText!: Phaser.GameObjects.Text | null;
  private timeWarningTriggered: boolean = false;

  // Energy bar elements
  private energyBarContainer!: Phaser.GameObjects.Container;
  private energyBarBackground!: Phaser.GameObjects.Rectangle;
  private energyBarFill!: Phaser.GameObjects.Rectangle;
  private energyBarLabel!: Phaser.GameObjects.Text;
  private currentEnergy: number = SLASH_ENERGY.maxEnergy;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Create all HUD elements with dark gothic theme styling
   * Creates score, lives, souls, combo, timer, kill quota, boss health, and energy bar
   * Also sets up EventBus listeners for real-time updates
   * 
   * @example
   * ```typescript
   * const hud = new HUD(this);
   * hud.create();
   * // HUD automatically updates via EventBus events
   * ```
   */
  create(): void {
    const padding = ResponsiveUtils.getPadding('medium');
    const fontSize = ResponsiveUtils.getFontSize('large');
    const fontSizeXL = ResponsiveUtils.getFontSize('xlarge');
    const fontSizeMd = ResponsiveUtils.getFontSize('medium');

    // Score label (top-left) with theme
    this.scoreLabel = this.scene.add.text(padding, padding, 'Score:', {
      fontFamily: DARK_GOTHIC_THEME.fonts.primary,
      fontSize: `${fontSize}px`,
      color: '#' + DARK_GOTHIC_THEME.colors.text.toString(16).padStart(6, '0'),
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0, 0).setDepth(1000);

    // Score value (top-left) with theme
    this.scoreText = this.scene.add.text(padding, padding * 2.5, '0', {
      fontFamily: DARK_GOTHIC_THEME.fonts.primary,
      fontSize: `${fontSizeXL}px`,
      color: '#' + DARK_GOTHIC_THEME.colors.text.toString(16).padStart(6, '0'),
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8,
    }).setOrigin(0, 0).setDepth(1000);

    // Lives container (top-right)
    this.livesContainer = this.scene.add.container(GAME_WIDTH - padding, padding);
    this.livesContainer.setDepth(1000);
    this.createLives(DEFAULT_STARTING_LIVES);

    // Souls label (top-right, below lives) with theme
    this.soulsLabel = this.scene.add.text(GAME_WIDTH - padding, padding * 4, 'Souls:', {
      fontFamily: DARK_GOTHIC_THEME.fonts.primary,
      fontSize: `${fontSizeMd}px`,
      color: '#' + DARK_GOTHIC_THEME.colors.text.toString(16).padStart(6, '0'),
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(1, 0).setDepth(1000);

    // Souls icon
    this.soulsIcon = this.scene.add.sprite(GAME_WIDTH - padding, padding * 5.5, 'powerup_soulmagnet');
    this.soulsIcon.setScale(0.5);
    this.soulsIcon.setOrigin(1, 0);
    this.soulsIcon.setDepth(1000);

    // Souls value (top-right, below lives) with theme
    this.soulsText = this.scene.add.text(GAME_WIDTH - padding * 2, padding * 5, '0', {
      fontFamily: DARK_GOTHIC_THEME.fonts.primary,
      fontSize: `${fontSize}px`,
      color: '#' + DARK_GOTHIC_THEME.colors.accent.toString(16).padStart(6, '0'),
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(1, 0).setDepth(1000);

    // Combo label (center screen) with theme
    this.comboLabel = this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.2, 'COMBO', {
      fontFamily: DARK_GOTHIC_THEME.fonts.primary,
      fontSize: `${fontSizeMd}px`,
      color: '#' + DARK_GOTHIC_THEME.colors.warning.toString(16).padStart(6, '0'),
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5, 0);
    this.comboLabel.setVisible(false);

    // Combo value (center screen) with theme
    this.comboText = this.scene.add.text(GAME_WIDTH / 2, 200, '0', {
      fontFamily: DARK_GOTHIC_THEME.fonts.primary,
      fontSize: `${FONT_SIZES.title}px`,
      color: '#' + DARK_GOTHIC_THEME.colors.warning.toString(16).padStart(6, '0'),
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8,
    }).setOrigin(0.5, 0);
    this.comboText.setVisible(false);

    // Combo timer bar (below combo text) - shows time remaining before combo expires
    this.comboTimerBarContainer = this.scene.add.container(GAME_WIDTH / 2, 270);
    this.comboTimerBarContainer.setDepth(1000);
    this.comboTimerBarContainer.setVisible(false);

    // Combo timer bar background
    this.comboTimerBarBackground = this.scene.add.rectangle(
      0,
      0,
      this.comboTimerBarWidth,
      this.comboTimerBarHeight,
      0x000000,
      0.8
    );
    this.comboTimerBarBackground.setStrokeStyle(2, DARK_GOTHIC_THEME.colors.warning);
    this.comboTimerBarContainer.add(this.comboTimerBarBackground);

    // Combo timer bar fill - depletes from right to left
    this.comboTimerBarFill = this.scene.add.rectangle(
      -this.comboTimerBarWidth / 2 + 2,
      0,
      this.comboTimerBarWidth - 4,
      this.comboTimerBarHeight - 4,
      DARK_GOTHIC_THEME.colors.warning
    );
    this.comboTimerBarFill.setOrigin(0, 0.5);
    this.comboTimerBarContainer.add(this.comboTimerBarFill);

    // Power-up container (bottom)
    this.powerUpContainer = this.scene.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 40);

    // Timer label (top-center, below combo) with theme
    this.timerLabel = this.scene.add.text(GAME_WIDTH / 2, 220, 'Time:', {
      fontFamily: DARK_GOTHIC_THEME.fonts.primary,
      fontSize: `${FONT_SIZES.medium}px`,
      color: '#' + DARK_GOTHIC_THEME.colors.text.toString(16).padStart(6, '0'),
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5, 0);
    this.timerLabel.setVisible(false);

    // Timer value (top-center, below timer label) with theme
    this.timerText = this.scene.add.text(GAME_WIDTH / 2, 260, '0:00', {
      fontFamily: DARK_GOTHIC_THEME.fonts.monospace,
      fontSize: `${FONT_SIZES.large}px`,
      color: '#' + DARK_GOTHIC_THEME.colors.text.toString(16).padStart(6, '0'),
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5, 0);
    this.timerText.setVisible(false);

    // Kill quota label (top-center, below timer) with theme
    this.killQuotaLabel = this.scene.add.text(GAME_WIDTH / 2, 300, 'Kills:', {
      fontFamily: DARK_GOTHIC_THEME.fonts.primary,
      fontSize: `${FONT_SIZES.medium}px`,
      color: '#' + DARK_GOTHIC_THEME.colors.text.toString(16).padStart(6, '0'),
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5, 0);
    this.killQuotaLabel.setVisible(false);

    // Kill quota value (top-center, below kill quota label) with theme
    this.killQuotaText = this.scene.add.text(GAME_WIDTH / 2, 340, '0 / 0', {
      fontFamily: DARK_GOTHIC_THEME.fonts.monospace,
      fontSize: `${FONT_SIZES.large}px`,
      color: '#' + DARK_GOTHIC_THEME.colors.text.toString(16).padStart(6, '0'),
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5, 0);
    this.killQuotaText.setVisible(false);

    // Boss health bar container (top-center) with theme
    this.bossHealthBarContainer = this.scene.add.container(GAME_WIDTH / 2, 80);
    this.bossHealthBarContainer.setVisible(false);

    // Boss health bar background with theme
    this.bossHealthBarBackground = this.scene.add.rectangle(0, 0, 400, 20, 0x000000, 0.8);
    this.bossHealthBarBackground.setStrokeStyle(2, DARK_GOTHIC_THEME.colors.accent);
    this.bossHealthBarContainer.add(this.bossHealthBarBackground);

    // Boss health bar fill with theme
    this.bossHealthBarFill = this.scene.add.rectangle(-200 + 2, 0, 396, 16, DARK_GOTHIC_THEME.colors.bloodRed);
    this.bossHealthBarFill.setOrigin(0, 0.5);
    this.bossHealthBarContainer.add(this.bossHealthBarFill);

    // Boss health bar text with theme
    this.bossHealthBarText = this.scene.add.text(0, 0, 'BOSS', {
      fontFamily: DARK_GOTHIC_THEME.fonts.primary,
      fontSize: '16px',
      color: '#' + DARK_GOTHIC_THEME.colors.text.toString(16).padStart(6, '0'),
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);
    this.bossHealthBarContainer.add(this.bossHealthBarText);

    // Create energy bar (bottom-left of screen)
    this.createEnergyBar();

    // Listen for events
    this.setupEventListeners();
  }

  /**
   * Update HUD elements that need continuous updates
   * @param delta - Time since last update in milliseconds
   * @param comboSystem - The combo system to get timer state from
   */
  update(delta: number, comboSystem: ComboSystem): void {
    // Update combo timer bar based on remaining time
    if (comboSystem.isActive()) {
      const remainingTime = comboSystem.getRemainingTime();
      this.updateComboTimerBar(remainingTime);
    }
  }

  /**
   * Add pause button to HUD
   */
  addPauseButton(callback: () => void): void {
    this.pauseButton = new Button(
      this.scene,
      GAME_WIDTH - 60,
      20,
      40,
      40,
      '||',
      {
        style: ButtonStyle.SECONDARY,
        fontSize: 20,
        onClick: callback,
      },
    );
    this.scene.add.existing(this.pauseButton);
  }

  /**
   * Create energy bar display (bottom-left of screen)
   */
  private createEnergyBar(): void {
    const padding = ResponsiveUtils.getPadding('medium');
    const fontSizeSm = ResponsiveUtils.getFontSize('small');
    const barWidth = 200;
    const barHeight = 16;

    // Energy bar container (bottom-left of screen, above power-up container)
    this.energyBarContainer = this.scene.add.container(padding + barWidth / 2, GAME_HEIGHT - padding * 3);
    this.energyBarContainer.setDepth(1000);

    // Energy bar label
    this.energyBarLabel = this.scene.add.text(-barWidth / 2, -barHeight - 8, 'ENERGY', {
      fontFamily: DARK_GOTHIC_THEME.fonts.primary,
      fontSize: `${fontSizeSm}px`,
      color: '#' + DARK_GOTHIC_THEME.colors.text.toString(16).padStart(6, '0'),
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0, 0.5);
    this.energyBarContainer.add(this.energyBarLabel);

    // Energy bar background
    this.energyBarBackground = this.scene.add.rectangle(0, 0, barWidth, barHeight, 0x000000, 0.8);
    this.energyBarBackground.setStrokeStyle(2, DARK_GOTHIC_THEME.colors.accent, 0.5);
    this.energyBarContainer.add(this.energyBarBackground);

    // Energy bar fill (cyan/blue color for energy)
    this.energyBarFill = this.scene.add.rectangle(
      -barWidth / 2 + 2,
      0,
      barWidth - 4,
      barHeight - 4,
      DARK_GOTHIC_THEME.colors.ghostlyBlue
    );
    this.energyBarFill.setOrigin(0, 0.5);
    this.energyBarContainer.add(this.energyBarFill);

    // Initialize with full energy
    this.currentEnergy = SLASH_ENERGY.maxEnergy;
  }

  /**
   * Update energy bar display
   * @param current - Current energy value
   * @param max - Maximum energy value
   */
  updateEnergy(current: number, max: number = SLASH_ENERGY.maxEnergy): void {
    if (!this.energyBarFill || !this.energyBarBackground) return;

    this.currentEnergy = Math.max(0, Math.min(current, max));
    const energyPercent = this.currentEnergy / max;
    const barWidth = this.energyBarBackground.width - 4;
    const targetWidth = barWidth * energyPercent;

    // Animate bar width change
    this.scene.tweens.add({
      targets: this.energyBarFill,
      width: Math.max(0, targetWidth),
      duration: DARK_GOTHIC_THEME.animations.duration,
      ease: DARK_GOTHIC_THEME.animations.easing,
    });

    // Change color based on energy level with theme colors
    const lowThreshold = SLASH_ENERGY.lowEnergyThreshold / 100;
    if (energyPercent > 0.5) {
      // Good energy - cyan/blue
      this.energyBarFill.setFillStyle(DARK_GOTHIC_THEME.colors.ghostlyBlue);
    } else if (energyPercent > lowThreshold) {
      // Medium energy - warning yellow
      this.energyBarFill.setFillStyle(DARK_GOTHIC_THEME.colors.warning);
    } else {
      // Low energy - danger red
      this.energyBarFill.setFillStyle(DARK_GOTHIC_THEME.colors.danger);

      // Pulse effect when low energy
      if (this.currentEnergy > 0) {
        this.scene.tweens.add({
          targets: this.energyBarFill,
          alpha: 0.5,
          duration: 200,
          yoyo: true,
          repeat: 1,
        });
      }
    }
  }

  /**
   * Show or hide energy bar
   * @param show - Whether to show the energy bar
   */
  showEnergyBar(show: boolean): void {
    if (this.energyBarContainer) {
      this.energyBarContainer.setVisible(show);
    }
  }

  /**
   * Show timer display
   */
  showTimer(show: boolean): void {
    if (this.timerLabel) {
      this.timerLabel.setVisible(show);
    }
    if (this.timerText) {
      this.timerText.setVisible(show);
    }
  }

  /**
   * Update timer display
   */
  updateTimer(time: number, duration: number): void {
    if (!this.timerText) return;

    const remaining = Math.max(0, duration - time);
    const minutes = Math.floor(remaining / 60);
    const seconds = Math.floor(remaining % 60);
    this.timerText.setText(`${minutes}:${seconds.toString().padStart(2, '0')}`);

    // Warning effects
    if (remaining <= 10) {
      this.timerText.setColor('#ff4444');

      if (remaining <= 5 && !this.timeWarningTriggered) {
        this.timeWarningTriggered = true;

        // Pulsing animation
        this.scene.tweens.add({
          targets: this.timerText,
          scale: 1.2,
          duration: 200,
          yoyo: true,
          repeat: -1,
        });

        // Play warning sound
        const audioManager = (this.scene as any).audioManager;
        if (audioManager) {
          audioManager.playSFX('uiClick');
        }
      }
    } else {
      this.timerText.setColor('#' + DARK_GOTHIC_THEME.colors.text.toString(16).padStart(6, '0'));
      this.timeWarningTriggered = false;
      this.timerText.setScale(1);
    }
  }

  /**
   * Show kill quota display
   */
  showKillQuota(show: boolean): void {
    if (this.killQuotaLabel) {
      this.killQuotaLabel.setVisible(show);
    }
    if (this.killQuotaText) {
      this.killQuotaText.setVisible(show);
    }
  }

  /**
   * Update kill quota display
   */
  updateKillQuota(current: number, total: number): void {
    if (!this.killQuotaText) return;
    
    this.killQuotaText.setText(`${current} / ${total}`);
  }

  /**
   * Show boss health bar
   */
  showBossHealthBar(show: boolean): void {
    if (this.bossHealthBarContainer) {
      this.bossHealthBarContainer.setVisible(show);
    }
  }

  /**
   * Update boss health bar with theme
   */
  updateBossHealth(current: number, max: number): void {
    if (!this.bossHealthBarFill) return;
    
    const healthPercent = Math.max(0, current / max);
    const barWidth = 400;
    const fillWidth = barWidth * healthPercent;
    
    this.bossHealthBarFill.width = fillWidth;
    
    // Change color based on health with theme colors
    if (healthPercent > 0.66) {
      this.bossHealthBarFill.setFillStyle(DARK_GOTHIC_THEME.colors.success);
    } else if (healthPercent > 0.33) {
      this.bossHealthBarFill.setFillStyle(DARK_GOTHIC_THEME.colors.warning);
    } else {
      this.bossHealthBarFill.setFillStyle(DARK_GOTHIC_THEME.colors.danger);
    }
  }

  /**
   * Setup event listeners for HUD updates
   */
  private setupEventListeners(): void {
    this.eventListeners = [
      { event: 'score-updated', handler: (data: { score: number }) => this.updateScore(data.score) },
      { event: 'souls-updated', handler: (data: { souls: number }) => this.updateSouls(data.souls) },
      { event: 'combo-updated', handler: (data: { count: number; multiplier: number }) => this.updateCombo(data.count, data.multiplier) },
      { event: 'lives-changed', handler: (data: { lives: number }) => this.updateLives(data.lives) },
      { event: 'powerup-activated', handler: (data: { type: string }) => this.showPowerUpIndicator(data.type) },
      { event: 'powerup-ended', handler: (data: { type: string }) => this.hidePowerUpIndicator(data.type) },
      { event: 'slash-energy-changed', handler: (data: { current: number; max: number }) => this.updateEnergy(data.current, data.max) },
    ];

    this.eventListeners.forEach(({ event, handler }) => {
      EventBus.on(event, handler);
    });

    EventBus.on('slash-energy-changed', (data: { current: number; max: number }) => {
      this.updateEnergy(data.current, data.max);
    });
  }

  /**
   * Create lives display with heart icons
   */
  private createLives(lives: number): void {
    // Clear existing hearts
    this.hearts.forEach(heart => heart.destroy());
    this.hearts = [];

    // Create new hearts
    for (let i = 0; i < lives; i++) {
      const heart = this.scene.add.sprite(-i * 50, 0, 'ui_heart_full');
      heart.setScale(0.8);
      this.livesContainer.add(heart);
      this.hearts.push(heart);
    }
  }

  /**
   * Update score display with pulse animation
   * Animation intensity scales based on point gain
   */
  updateScore(score: number): void {
    const pointsGained = score - this.previousScore;
    this.previousScore = score;
    this.scoreText.setText(score.toString());

    // Only animate if points were gained (not on reset or initialization)
    if (pointsGained > 0) {
      this.playScorePopAnimation(pointsGained);
    }
  }

  /**
   * Play score pop/pulse animation with intensity based on points gained
   * Small gains (1-25): subtle pulse (1.1x scale)
   * Medium gains (26-50): moderate pulse (1.2x scale)
   * Large gains (51-100): strong pulse (1.3x scale)
   * Huge gains (100+): dramatic pulse (1.4x scale)
   */
  private playScorePopAnimation(pointsGained: number): void {
    // Stop any existing tween to prevent overlap
    if (this.scorePopTween) {
      this.scorePopTween.stop();
      this.scoreText.setScale(1);
    }

    // Calculate scale based on points gained
    let targetScale: number;
    let duration: number;

    if (pointsGained >= 100) {
      // Huge gain - dramatic pulse
      targetScale = 1.4;
      duration = DARK_GOTHIC_THEME.animations.duration * 1.5;
    } else if (pointsGained >= 50) {
      // Large gain - strong pulse
      targetScale = 1.3;
      duration = DARK_GOTHIC_THEME.animations.duration * 1.25;
    } else if (pointsGained >= 25) {
      // Medium gain - moderate pulse
      targetScale = 1.2;
      duration = DARK_GOTHIC_THEME.animations.duration;
    } else {
      // Small gain - subtle pulse
      targetScale = 1.1;
      duration = DARK_GOTHIC_THEME.animations.duration * 0.75;
    }

    // Create pulse animation
    this.scorePopTween = this.scene.tweens.add({
      targets: this.scoreText,
      scale: targetScale,
      duration: duration,
      yoyo: true,
      ease: DARK_GOTHIC_THEME.animations.easing,
      onComplete: () => {
        this.scoreText.setScale(1);
        this.scorePopTween = null;
      },
    });
  }

  /**
   * Update the souls display with formatted number
   * 
   * @param souls - The new souls value to display
   * 
   * @example
   * ```typescript
   * hud.updateSouls(500);
   * // Display shows: 💀 500
   * ```
   */
  updateSouls(souls: number): void {
    this.soulsText.setText(souls.toString());
  }

  /**
   * Update the combo display with count and multiplier
   * Shows/hides combo elements based on count (hidden when count is 0)
   * Includes pulse animation when combo is active
   * 
   * @param count - Current combo count
   * @param multiplier - Current score multiplier
   * 
   * @example
   * ```typescript
   * hud.updateCombo(10, 2.5);
   * // Display shows: COMBO (2.5x) with 10x below it
   * ```
   */
  updateCombo(count: number, multiplier: number): void {
    if (count > 0) {
      this.comboText.setText(`${count}x`);
      this.comboLabel.setText(`COMBO (${multiplier.toFixed(1)}x)`);
      this.comboText.setVisible(true);
      this.comboLabel.setVisible(true);
      this.comboTimerBarContainer.setVisible(true);

      // Reset timer bar fill to full on combo increment
      this.updateComboTimerBar(COMBO_TIMEOUT);

      // Pulse effect with theme animation
      this.scene.tweens.add({
        targets: [this.comboText, this.comboLabel],
        scale: 1.2,
        duration: DARK_GOTHIC_THEME.animations.duration,
        yoyo: true,
        ease: DARK_GOTHIC_THEME.animations.easing,
      });
    } else {
      this.comboText.setVisible(false);
      this.comboLabel.setVisible(false);
      this.comboTimerBarContainer.setVisible(false);
    }
  }

  /**
   * Update combo timer bar based on remaining time
   * @param remainingTime - Time remaining in seconds before combo expires
   */
  updateComboTimerBar(remainingTime: number): void {
    if (!this.comboTimerBarFill || !this.comboTimerBarContainer) return;

    // Only update if timer bar is visible
    if (!this.comboTimerBarContainer.visible) return;

    // Calculate fill width based on remaining time percentage
    const maxWidth = this.comboTimerBarWidth - 4;
    const timeRatio = Math.max(0, Math.min(1, remainingTime / COMBO_TIMEOUT));
    const fillWidth = maxWidth * timeRatio;

    // Smooth width update
    this.comboTimerBarFill.width = fillWidth;

    // Color transition from warning (full) to danger (low) as time depletes
    if (timeRatio > 0.5) {
      // Full to medium - stay warning color (orange)
      this.comboTimerBarFill.setFillStyle(DARK_GOTHIC_THEME.colors.warning);
    } else if (timeRatio > 0.25) {
      // Medium to low - transition to danger (red-orange)
      const blendFactor = (timeRatio - 0.25) / 0.25; // 1.0 at 0.5, 0.0 at 0.25
      const warningColor = DARK_GOTHIC_THEME.colors.warning; // 0xffaa00
      const dangerColor = DARK_GOTHIC_THEME.colors.danger; // 0xff4444
      const blendedColor = this.blendColors(dangerColor, warningColor, blendFactor);
      this.comboTimerBarFill.setFillStyle(blendedColor);
    } else {
      // Low - danger color (red)
      this.comboTimerBarFill.setFillStyle(DARK_GOTHIC_THEME.colors.danger);
    }
  }

  /**
   * Blend two colors together
   * @param color1 - First color (hex number)
   * @param color2 - Second color (hex number)
   * @param ratio - Blend ratio (0 = color1, 1 = color2)
   */
  private blendColors(color1: number, color2: number, ratio: number): number {
    const r1 = (color1 >> 16) & 0xff;
    const g1 = (color1 >> 8) & 0xff;
    const b1 = color1 & 0xff;

    const r2 = (color2 >> 16) & 0xff;
    const g2 = (color2 >> 8) & 0xff;
    const b2 = color2 & 0xff;

    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);

    return (r << 16) | (g << 8) | b;
  }

  /**
   * Update lives display
   */
  updateLives(lives: number): void {
    const previousLives = this.hearts.length;
    
    // Animate removed heart if lives decreased
    if (lives < previousLives && this.hearts.length > 0) {
      const removedHeart = this.hearts[previousLives - 1];
      
      // Flash red tint and scale animation
      removedHeart.setTint(0xff0000);
      
      this.scene.tweens.add({
        targets: removedHeart,
        scaleX: 1.5,
        scaleY: 1.5,
        angle: Math.random() * 40 - 20,
        alpha: 0.5,
        duration: 150,
        yoyo: true,
        onYoyo: () => {
          removedHeart.destroy();
        },
        onComplete: () => {
          removedHeart.destroy();
        },
      });
      
      // Flash red on remaining hearts
      this.hearts.slice(0, lives).forEach(heart => {
        heart.setTint(0xff0000);
        this.scene.tweens.add({
          targets: heart,
          alpha: 0.5,
          duration: 100,
          yoyo: true,
          onYoyo: () => {
            heart.clearTint();
          },
          onComplete: () => {
            heart.clearTint();
            heart.alpha = 1;
          },
        });
      });
    }

    // Clear remaining hearts and recreate
    this.hearts.forEach(heart => {
      if (heart.active) heart.destroy();
    });
    this.hearts = [];

    // Create new hearts
    for (let i = 0; i < lives; i++) {
      const heart = this.scene.add.sprite(-i * 50, 0, 'ui_heart_full');
      heart.setScale(0.8);
      this.livesContainer.add(heart);
      this.hearts.push(heart);
    }
  }

  /**
   * Show power-up indicator with theme
   */
  private showPowerUpIndicator(type: string): void {
    let textureKey = '';
    let color = 0xffffff;

    switch (type) {
    case 'slow_motion':
      textureKey = 'powerup_slowmotion';
      color = DARK_GOTHIC_THEME.colors.ghostlyBlue;
      break;
    case 'frenzy':
      textureKey = 'powerup_frenzy';
      color = DARK_GOTHIC_THEME.colors.danger;
      break;
    case 'shield':
      textureKey = 'powerup_shield';
      color = DARK_GOTHIC_THEME.colors.success;
      break;
    case 'soul_magnet':
      textureKey = 'powerup_soulmagnet';
      color = DARK_GOTHIC_THEME.colors.accent;
      break;
    }

    if (textureKey && !this.powerUpIcons.has(type)) {
      const icon = this.scene.add.sprite(0, 0, textureKey);
      icon.setScale(0.6);
      icon.setTint(color);
      this.powerUpContainer.add(icon);
      this.powerUpIcons.set(type, icon);

      // Animate icon appearing with theme animation
      this.scene.tweens.add({
        targets: icon,
        scale: 0.7,
        duration: DARK_GOTHIC_THEME.animations.duration,
        ease: DARK_GOTHIC_THEME.animations.easing,
      });
    }
  }

  /**
   * Hide power-up indicator
   */
  private hidePowerUpIndicator(type: string): void {
    const icon = this.powerUpIcons.get(type);
    if (icon) {
      this.scene.tweens.add({
        targets: icon,
        scale: 0,
        alpha: 0,
        duration: DARK_GOTHIC_THEME.animations.duration,
        onComplete: () => {
          icon.destroy();
          this.powerUpIcons.delete(type);
        },
      });
    }
  }

  /**
   * Get the score text game object for direct manipulation
   * 
   * @returns The Phaser text object displaying the score
   * 
   * @example
   * ```typescript
   * const scoreText = hud.getScoreText();
   * scoreText.setColor('#ff0000'); // Change color temporarily
   * ```
   */
  getScoreText(): Phaser.GameObjects.Text {
    return this.scoreText;
  }

  /**
   * Get the combo text game object for direct manipulation
   * 
   * @returns The Phaser text object displaying the combo count
   * 
   * @example
   * ```typescript
   * const comboText = hud.getComboText();
   * comboText.setScale(1.5); // Make combo text larger temporarily
   * ```
   */
  getComboText(): Phaser.GameObjects.Text {
    return this.comboText;
  }

  /**
   * Update pause button visibility and interactivity based on game state
   * 
   * @param isPaused - Whether the game is currently paused
   * 
   * @example
   * ```typescript
   * // When pausing the game
   * hud.updatePauseState(true);
   * 
   * // When resuming the game
   * hud.updatePauseState(false);
   * ```
   */
  destroy(): void {
    // Remove event listeners
    EventBus.off('score-updated');
    EventBus.off('souls-updated');
    EventBus.off('combo-updated');
    EventBus.off('lives-changed');
    EventBus.off('powerup-activated');
    EventBus.off('powerup-ended');
    EventBus.off('slash-energy-changed');

    // Stop any active tweens
    if (this.scorePopTween) {
      this.scorePopTween.stop();
      this.scorePopTween = null;
    }

    // Destroy all elements
    if (this.scoreText) {
      this.scoreText.destroy();
    }
    if (this.scoreLabel) {
      this.scoreLabel.destroy();
    }
    if (this.livesContainer) {
      this.livesContainer.destroy();
    }
    if (this.comboText) {
      this.comboText.destroy();
    }
    if (this.comboLabel) {
      this.comboLabel.destroy();
    }
    if (this.comboTimerBarContainer) {
      this.comboTimerBarContainer.destroy();
    }
    if (this.soulsText) {
      this.soulsText.destroy();
    }
    if (this.soulsLabel) {
      this.soulsLabel.destroy();
    }
    if (this.soulsIcon) {
      this.soulsIcon.destroy();
    }
    if (this.powerUpContainer) {
      this.powerUpContainer.destroy();
    }
    
    // Destroy campaign mode elements
    if (this.timerLabel) {
      this.timerLabel.destroy();
    }
    if (this.timerText) {
      this.timerText.destroy();
    }
    if (this.killQuotaLabel) {
      this.killQuotaLabel.destroy();
    }
    if (this.killQuotaText) {
      this.killQuotaText.destroy();
    }
    if (this.bossHealthBarContainer) {
      this.bossHealthBarContainer.destroy();
    }

    // Destroy energy bar elements
    if (this.energyBarContainer) {
      this.energyBarContainer.destroy();
    }

    // Destroy pause button
    if (this.pauseButton) {
      this.pauseButton.setActive(!isPaused);
      this.pauseButton.setVisible(!isPaused);
    }
  }

  /**
   * Cleanup HUD resources and remove all EventBus listeners
   * Call this when scene is being destroyed
   * 
   * @example
   * ```typescript
   * // Automatically called when scene shuts down
   * // Also manually if needed:
   * hud.destroy();
   * ```
   */
  destroy(): void {
    this.eventListeners.forEach(({ event, handler }) => {
      EventBus.off(event, handler);
    });
  }
}