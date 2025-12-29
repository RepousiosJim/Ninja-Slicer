/**
 * Dashboard Card Component
 * Large interactive cards for the main menu dashboard
 * Features: icons, title, description, stats, badges, hover effects, locked states
 */

import Phaser from 'phaser';
import { DARK_GOTHIC_THEME, DASHBOARD_CARD_CONFIG } from '../config/theme';
import { GlowEffect } from './GlowEffect';
import { TextureGenerator } from '../utils/TextureGenerator';

export interface DashboardCardStats {
  label: string;
  value: string;
  icon?: string;
}

export interface DashboardCardBadge {
  text: string;
  color: number;
}

export interface DashboardCardConfig {
  id: string;
  title: string;
  description: string;
  icon: string; // Emoji or texture key
  badge?: DashboardCardBadge;
  stats?: DashboardCardStats[];
  locked?: boolean;
  unlockCost?: number;
  onClick: () => void;
  glow?: {
    color: number;
    intensity: number;
  };
}

export class DashboardCard extends Phaser.GameObjects.Container {
  private config: DashboardCardConfig;
  private background!: Phaser.GameObjects.Graphics;
  private borderGraphics!: Phaser.GameObjects.Graphics;
  private iconText!: Phaser.GameObjects.Text;
  private titleText!: Phaser.GameObjects.Text;
  private descriptionText!: Phaser.GameObjects.Text;
  private statsContainer!: Phaser.GameObjects.Container;
  private badgeContainer?: Phaser.GameObjects.Container;
  private glowEffect?: GlowEffect;
  private lockOverlay?: Phaser.GameObjects.Container;
  private isHovered: boolean = false;
  private originalY: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, config: DashboardCardConfig) {
    super(scene, x, y);

    this.config = config;
    this.originalY = y;

    this.createBackground();
    this.createBorder();
    this.createContent();

    if (config.badge) {
      this.createBadge();
    }

    if (config.locked) {
      this.createLockOverlay();
    } else {
      this.setupInteractivity();
    }

    if (config.glow) {
      this.createGlow();
    }

    this.setSize(DASHBOARD_CARD_CONFIG.width, DASHBOARD_CARD_CONFIG.height);
  }

  /**
   * Create gradient background
   */
  private createBackground(): void {
    this.background = this.scene.add.graphics();

    // Use fillGradientStyle for gradient effect
    this.background.fillGradientStyle(
      DARK_GOTHIC_THEME.colors.gradients.cardGradient.start,
      DARK_GOTHIC_THEME.colors.gradients.cardGradient.start,
      DARK_GOTHIC_THEME.colors.gradients.cardGradient.end,
      DARK_GOTHIC_THEME.colors.gradients.cardGradient.end,
      0.9
    );

    this.background.fillRoundedRect(
      -DASHBOARD_CARD_CONFIG.width / 2,
      -DASHBOARD_CARD_CONFIG.height / 2,
      DASHBOARD_CARD_CONFIG.width,
      DASHBOARD_CARD_CONFIG.height,
      DASHBOARD_CARD_CONFIG.borderRadius
    );

    this.add(this.background);
  }

  /**
   * Create border
   */
  private createBorder(): void {
    this.borderGraphics = this.scene.add.graphics();

    this.borderGraphics.lineStyle(
      DASHBOARD_CARD_CONFIG.borderWidth,
      DARK_GOTHIC_THEME.colors.accent,
      1.0
    );
    this.borderGraphics.strokeRoundedRect(
      -DASHBOARD_CARD_CONFIG.width / 2,
      -DASHBOARD_CARD_CONFIG.height / 2,
      DASHBOARD_CARD_CONFIG.width,
      DASHBOARD_CARD_CONFIG.height,
      DASHBOARD_CARD_CONFIG.borderRadius
    );

    this.add(this.borderGraphics);
  }

  /**
   * Create card content (icon, title, description, stats)
   */
  private createContent(): void {
    const cardConfig = DASHBOARD_CARD_CONFIG;
    const halfWidth = cardConfig.width / 2;
    const halfHeight = cardConfig.height / 2;

    // Icon (emoji or texture)
    this.iconText = this.scene.add.text(
      0,
      -halfHeight + 60,
      this.config.icon,
      {
        fontSize: `${cardConfig.iconSize}px`,
        fontFamily: DARK_GOTHIC_THEME.fonts.primary,
        color: '#ffffff',
        align: 'center',
      }
    );
    this.iconText.setOrigin(0.5);
    this.add(this.iconText);

    // Title
    this.titleText = this.scene.add.text(
      0,
      -halfHeight + 140,
      this.config.title,
      {
        fontSize: `${cardConfig.titleFontSize}px`,
        fontFamily: DARK_GOTHIC_THEME.fonts.primary,
        color: '#ffd700',
        align: 'center',
        fontStyle: 'bold',
      }
    );
    this.titleText.setOrigin(0.5);
    this.add(this.titleText);

    // Description
    this.descriptionText = this.scene.add.text(
      0,
      -halfHeight + 175,
      this.config.description,
      {
        fontSize: `${cardConfig.descriptionFontSize}px`,
        fontFamily: DARK_GOTHIC_THEME.fonts.secondary,
        color: '#cccccc',
        align: 'center',
      }
    );
    this.descriptionText.setOrigin(0.5);
    this.add(this.descriptionText);

    // Stats (if provided)
    if (this.config.stats && this.config.stats.length > 0) {
      this.createStats();
    }
  }

  /**
   * Create stats display
   */
  private createStats(): void {
    this.statsContainer = this.scene.add.container(0, DASHBOARD_CARD_CONFIG.height / 2 - 50);

    const stats = this.config.stats || [];
    const statSpacing = 10;
    let currentY = 0;

    stats.forEach((stat) => {
      const statText = this.scene.add.text(
        0,
        currentY,
        `${stat.icon || '•'} ${stat.label}: ${stat.value}`,
        {
          fontSize: `${DASHBOARD_CARD_CONFIG.statFontSize}px`,
          fontFamily: DARK_GOTHIC_THEME.fonts.secondary,
          color: '#ffffff',
          align: 'center',
        }
      );
      statText.setOrigin(0.5);
      this.statsContainer.add(statText);

      currentY += statText.height + statSpacing;
    });

    this.add(this.statsContainer);
  }

  /**
   * Create badge overlay
   */
  private createBadge(): void {
    if (!this.config.badge) return;

    const halfWidth = DASHBOARD_CARD_CONFIG.width / 2;
    const halfHeight = DASHBOARD_CARD_CONFIG.height / 2;

    this.badgeContainer = this.scene.add.container(halfWidth - 30, -halfHeight + 30);

    // Badge background
    const badgeBg = this.scene.add.circle(0, 0, 20, this.config.badge.color);
    this.badgeContainer.add(badgeBg);

    // Badge text
    const badgeText = this.scene.add.text(0, 0, this.config.badge.text, {
      fontSize: '14px',
      fontFamily: DARK_GOTHIC_THEME.fonts.primary,
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center',
    });
    badgeText.setOrigin(0.5);
    this.badgeContainer.add(badgeText);

    // Pulse animation
    this.scene.tweens.add({
      targets: this.badgeContainer,
      scale: { from: 1, to: 1.1 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.add(this.badgeContainer);
  }

  /**
   * Create glow effect
   */
  private createGlow(): void {
    if (!this.config.glow) return;

    this.glowEffect = new GlowEffect(this.scene, 0, 0, {
      color: this.config.glow.color,
      innerIntensity: this.config.glow.intensity,
      outerIntensity: this.config.glow.intensity * 0.5,
      blur: 16,
      pulse: false,
    });

    this.glowEffect.setScale(DASHBOARD_CARD_CONFIG.width / 100);
    this.add(this.glowEffect);
    this.sendToBack(this.glowEffect);
  }

  /**
   * Create lock overlay
   */
  private createLockOverlay(): void {
    const halfWidth = DASHBOARD_CARD_CONFIG.width / 2;
    const halfHeight = DASHBOARD_CARD_CONFIG.height / 2;

    this.lockOverlay = this.scene.add.container(0, 0);

    // Darkened overlay
    const overlay = this.scene.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRoundedRect(
      -halfWidth,
      -halfHeight,
      DASHBOARD_CARD_CONFIG.width,
      DASHBOARD_CARD_CONFIG.height,
      DASHBOARD_CARD_CONFIG.borderRadius
    );
    this.lockOverlay.add(overlay);

    // Lock icon
    const lockIcon = this.scene.add.text(0, -20, '🔒', {
      fontSize: '48px',
      align: 'center',
    });
    lockIcon.setOrigin(0.5);
    this.lockOverlay.add(lockIcon);

    // Unlock cost
    if (this.config.unlockCost) {
      const costText = this.scene.add.text(
        0,
        30,
        `${this.config.unlockCost} 💀`,
        {
          fontSize: '20px',
          fontFamily: DARK_GOTHIC_THEME.fonts.primary,
          color: '#ffd700',
          align: 'center',
        }
      );
      costText.setOrigin(0.5);
      this.lockOverlay.add(costText);
    }

    this.add(this.lockOverlay);
  }

  /**
   * Setup interactivity (hover, click)
   */
  private setupInteractivity(): void {
    const halfWidth = DASHBOARD_CARD_CONFIG.width / 2;
    const halfHeight = DASHBOARD_CARD_CONFIG.height / 2;

    // Create interactive zone
    const hitArea = new Phaser.Geom.Rectangle(
      -halfWidth,
      -halfHeight,
      DASHBOARD_CARD_CONFIG.width,
      DASHBOARD_CARD_CONFIG.height
    );

    this.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    // Hover effects
    this.on('pointerover', this.onHoverStart, this);
    this.on('pointerout', this.onHoverEnd, this);

    // Click
    this.on('pointerdown', this.onPointerDown, this);
    this.on('pointerup', this.onPointerUp, this);

    // Cursor
    this.on('pointerover', () => {
      this.scene.input.setDefaultCursor('pointer');
    });
    this.on('pointerout', () => {
      this.scene.input.setDefaultCursor('default');
    });
  }

  /**
   * Handle hover start
   */
  private onHoverStart(): void {
    this.isHovered = true;

    // Lift and scale animation
    this.scene.tweens.add({
      targets: this,
      scale: DASHBOARD_CARD_CONFIG.hoverScale,
      y: this.y + DASHBOARD_CARD_CONFIG.hoverLift,
      duration: DARK_GOTHIC_THEME.animations.presets.cardHover.duration,
      ease: DARK_GOTHIC_THEME.animations.presets.cardHover.easing,
    });

    // Border color change
    this.borderGraphics.clear();
    this.borderGraphics.lineStyle(
      DASHBOARD_CARD_CONFIG.borderWidth,
      DARK_GOTHIC_THEME.colors.warning,
      1.0
    );
    this.borderGraphics.strokeRoundedRect(
      -DASHBOARD_CARD_CONFIG.width / 2,
      -DASHBOARD_CARD_CONFIG.height / 2,
      DASHBOARD_CARD_CONFIG.width,
      DASHBOARD_CARD_CONFIG.height,
      DASHBOARD_CARD_CONFIG.borderRadius
    );

    // Enhance glow
    if (this.glowEffect) {
      this.glowEffect.setGlowIntensity(
        DASHBOARD_CARD_CONFIG.hoverGlowIntensity / 10,
        DASHBOARD_CARD_CONFIG.hoverGlowIntensity / 20
      );
    }
  }

  /**
   * Handle hover end
   */
  private onHoverEnd(): void {
    if (!this.isHovered) return;
    this.isHovered = false;

    // Return to original position and scale
    this.scene.tweens.add({
      targets: this,
      scale: 1,
      y: this.originalY,
      duration: DARK_GOTHIC_THEME.animations.presets.cardHover.duration,
      ease: DARK_GOTHIC_THEME.animations.presets.cardHover.easing,
    });

    // Restore border color
    this.borderGraphics.clear();
    this.borderGraphics.lineStyle(
      DASHBOARD_CARD_CONFIG.borderWidth,
      DARK_GOTHIC_THEME.colors.accent,
      1.0
    );
    this.borderGraphics.strokeRoundedRect(
      -DASHBOARD_CARD_CONFIG.width / 2,
      -DASHBOARD_CARD_CONFIG.height / 2,
      DASHBOARD_CARD_CONFIG.width,
      DASHBOARD_CARD_CONFIG.height,
      DASHBOARD_CARD_CONFIG.borderRadius
    );

    // Restore glow
    if (this.glowEffect && this.config.glow) {
      this.glowEffect.setGlowIntensity(
        this.config.glow.intensity,
        this.config.glow.intensity * 0.5
      );
    }
  }

  /**
   * Handle pointer down (press)
   */
  private onPointerDown(): void {
    this.scene.tweens.add({
      targets: this,
      scale: DARK_GOTHIC_THEME.animations.pressScale,
      duration: DARK_GOTHIC_THEME.animations.presets.buttonPress.duration,
      ease: DARK_GOTHIC_THEME.animations.presets.buttonPress.easing,
    });
  }

  /**
   * Handle pointer up (release and click)
   */
  private onPointerUp(): void {
    this.scene.tweens.add({
      targets: this,
      scale: this.isHovered ? DASHBOARD_CARD_CONFIG.hoverScale : 1,
      duration: DARK_GOTHIC_THEME.animations.presets.buttonPress.duration,
      ease: 'Power2.easeOut',
    });

    // Execute onClick callback
    this.config.onClick();
  }

  /**
   * Update card position (for responsive layout)
   */
  updatePosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.originalY = y;
  }

  /**
   * Update card configuration
   */
  updateCard(updates: Partial<DashboardCardConfig>): void {
    this.config = { ...this.config, ...updates };

    // Update visuals
    if (updates.title) {
      this.titleText.setText(updates.title);
    }

    if (updates.description) {
      this.descriptionText.setText(updates.description);
    }

    if (updates.icon) {
      this.iconText.setText(updates.icon);
    }

    if (updates.stats) {
      if (this.statsContainer) {
        this.statsContainer.destroy();
      }
      this.createStats();
    }

    if (updates.badge) {
      if (this.badgeContainer) {
        this.badgeContainer.destroy();
      }
      this.createBadge();
    }

    if (updates.locked !== undefined) {
      if (updates.locked && !this.lockOverlay) {
        this.createLockOverlay();
        this.disableInteractive();
      } else if (!updates.locked && this.lockOverlay) {
        this.lockOverlay.destroy();
        this.lockOverlay = undefined;
        this.setupInteractivity();
      }
    }
  }

  /**
   * Cleanup
   */
  destroy(fromScene?: boolean): void {
    this.off('pointerover');
    this.off('pointerout');
    this.off('pointerdown');
    this.off('pointerup');

    super.destroy(fromScene);
  }
}
