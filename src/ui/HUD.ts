/**
 * HUD
 * 
 * Displays game information such as score, lives, combo, souls, and power-up indicators.
 */

import Phaser from 'phaser';
import { FONT_SIZES, DEFAULT_STARTING_LIVES, GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { DARK_GOTHIC_THEME } from '../config/theme';
import { EventBus } from '../utils/EventBus';
import { Button, ButtonStyle } from './Button';
import { ResponsiveUtils } from '../utils/ResponsiveUtils';

export class HUD {
  private scene: Phaser.Scene;
  private scoreText!: Phaser.GameObjects.Text;
  private scoreLabel!: Phaser.GameObjects.Text;
  private livesContainer!: Phaser.GameObjects.Container;
  private hearts: Phaser.GameObjects.Sprite[] = [];
  private comboText!: Phaser.GameObjects.Text;
  private comboLabel!: Phaser.GameObjects.Text;
  private soulsText!: Phaser.GameObjects.Text;
  private soulsLabel!: Phaser.GameObjects.Text;
  private soulsIcon!: Phaser.GameObjects.Sprite;
  private powerUpContainer!: Phaser.GameObjects.Container;
  private powerUpIcons: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private pauseButton: Button | null = null;
  private eventListeners: Array<{ event: string; handler: Function }> = [];
  
  // Campaign mode elements
  private timerText!: Phaser.GameObjects.Text;
  private timerLabel!: Phaser.GameObjects.Text;
  private killQuotaText!: Phaser.GameObjects.Text;
  private killQuotaLabel!: Phaser.GameObjects.Text;
  private bossHealthBarContainer!: Phaser.GameObjects.Container | null;
  private bossHealthBarBackground!: Phaser.GameObjects.Rectangle | null;
  private bossHealthBarFill!: Phaser.GameObjects.Rectangle | null;
  private bossHealthBarText!: Phaser.GameObjects.Text | null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Create HUD elements with theme
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

    // Listen for events
    this.setupEventListeners();
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
    ];

    this.eventListeners.forEach(({ event, handler }) => {
      EventBus.on(event, handler);
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
   * Update score display
   */
  updateScore(score: number): void {
    this.scoreText.setText(score.toString());
  }

  /**
   * Update souls display
   */
  updateSouls(souls: number): void {
    this.soulsText.setText(souls.toString());
  }

  /**
   * Update combo display
   */
  updateCombo(count: number, multiplier: number): void {
    if (count > 0) {
      this.comboText.setText(`${count}x`);
      this.comboLabel.setText(`COMBO (${multiplier.toFixed(1)}x)`);
      this.comboText.setVisible(true);
      this.comboLabel.setVisible(true);

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
    }
  }

  /**
   * Update lives display
   */
  updateLives(lives: number): void {
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

    // Screen shake with theme animation
    this.scene.cameras.main.shake(100, 0.01);
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
   * Get current score text
   */
  getScoreText(): Phaser.GameObjects.Text {
    return this.scoreText;
  }

  /**
   * Get current combo text
   */
  getComboText(): Phaser.GameObjects.Text {
    return this.comboText;
  }

  /**
   * Destroy HUD elements
   */
  destroy(): void {
    // Remove event listeners
    this.eventListeners.forEach(({ event, handler }) => {
      EventBus.off(event, handler);
    });
    this.eventListeners = [];

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
    
    // Destroy pause button
    if (this.pauseButton) {
      this.pauseButton.destroy();
    }
  }
}
