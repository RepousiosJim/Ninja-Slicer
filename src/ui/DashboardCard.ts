/**
 * Dashboard Card Component
 * Large interactive cards for the main menu dashboard
 * Features: icons, title, description, stats, badges, hover effects, locked states
 */

import Phaser from 'phaser';
import { DARK_GOTHIC_THEME, DASHBOARD_CARD_CONFIG } from '../config/theme';
import { GlowEffect } from './GlowEffect';
import { TextureGenerator } from '../utils/TextureGenerator';
import type { ScaledCardConfig } from '../utils/ResponsiveCardScaler';
import { MagneticHoverEffect, applyMagneticHover } from './MagneticHoverEffect';
import { createClickFeedback } from './ClickFeedback';

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
  private scaledConfig: ScaledCardConfig;
  private background!: Phaser.GameObjects.Graphics;
  private borderGraphics!: Phaser.GameObjects.Graphics;
  private glassOverlay!: Phaser.GameObjects.Graphics;
  private spotlightOverlay!: Phaser.GameObjects.Graphics;
  private iconText!: Phaser.GameObjects.Text;
  private titleText!: Phaser.GameObjects.Text;
  private descriptionText!: Phaser.GameObjects.Text;
  private statsContainer!: Phaser.GameObjects.Container;
  private badgeContainer?: Phaser.GameObjects.Container;
  private glowEffect?: GlowEffect;
  private lockOverlay?: Phaser.GameObjects.Container;
  private isHovered: boolean = false;
  private baseX: number = 0;
  private baseY: number = 0;
  private hoverTween?: Phaser.Tweens.Tween;
  private debugHitBox?: Phaser.GameObjects.Graphics;
  private debugLabel?: Phaser.GameObjects.Text;
  private magneticVelocity: { x: number; y: number } = { x: 0, y: 0 };
  private lastPointerX: number = 0;
  private lastPointerY: number = 0;
  private magneticHoverEffect?: MagneticHoverEffect;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: DashboardCardConfig,
    scaledConfig?: ScaledCardConfig, // NEW - accept scaled dimensions
  ) {
    super(scene, x, y);

    this.config = config;
    this.baseX = x;
    this.baseY = y;

    // Use scaled config if provided, otherwise use defaults from DASHBOARD_CARD_CONFIG
    this.scaledConfig = scaledConfig || {
      width: DASHBOARD_CARD_CONFIG.width,
      height: DASHBOARD_CARD_CONFIG.height,
      columns: DASHBOARD_CARD_CONFIG.columns,
      rows: DASHBOARD_CARD_CONFIG.rows,
      gap: DASHBOARD_CARD_CONFIG.gap,
      hoverLift: DASHBOARD_CARD_CONFIG.hoverLift,
      hoverScale: DASHBOARD_CARD_CONFIG.hoverScale,
    };

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

    // Note: setSize is called in setupInteractivity() for non-locked cards
    // For locked cards, set size explicitly here
    if (config.locked) {
      this.setSize(this.scaledConfig.width, this.scaledConfig.height);
    }
  }

  /**
   * Create gradient background
   */
  private createBackground(): void {
    this.background = this.scene.add.graphics();

    this.background.fillStyle(
      DARK_GOTHIC_THEME.colors.background,
      0.9,
    );
    this.background.fillRoundedRect(
      -this.scaledConfig.width / 2,
      -this.scaledConfig.height / 2,
      this.scaledConfig.width,
      this.scaledConfig.height,
      DASHBOARD_CARD_CONFIG.borderRadius,
    );

    this.add(this.background);

    this.glassOverlay = this.scene.add.graphics();
    this.glassOverlay.setAlpha(0);
    this.createGlassEffect();
    this.add(this.glassOverlay);

    this.spotlightOverlay = this.scene.add.graphics();
    this.spotlightOverlay.setAlpha(0);
    this.add(this.spotlightOverlay);
  }

  private createGlassEffect(): void {
    const width = this.scaledConfig.width;
    const height = this.scaledConfig.height;
    const radius = DASHBOARD_CARD_CONFIG.borderRadius;

    this.glassOverlay.fillStyle(0xffffff, 0.08);
    this.glassOverlay.fillRoundedRect(
      -width / 2,
      -height / 2,
      width,
      height,
      radius,
    );

    this.glassOverlay.lineStyle(2, 0xffffff, 0.15);
    this.glassOverlay.strokeRoundedRect(
      -width / 2 + 2,
      -height / 2 + 2,
      width - 4,
      height - 4,
      radius - 2,
    );
  }

  private updateSpotlight(pointerX: number, pointerY: number): void {
    this.spotlightOverlay.clear();
    const width = this.scaledConfig.width;
    const height = this.scaledConfig.height;
    const radius = DASHBOARD_CARD_CONFIG.borderRadius;

    const localX = pointerX - this.x;
    const localY = pointerY - this.y;

    const maxDistance = Math.max(width, height) * 0.5;
    const distance = Math.sqrt(localX * localX + localY * localY);
    const alpha = Math.max(0, 0.15 * (1 - distance / maxDistance));

    if (alpha > 0) {
      this.spotlightOverlay.fillStyle(0xffffff, alpha);
      this.spotlightOverlay.fillRoundedRect(
        -width / 2,
        -height / 2,
        width,
        height,
        radius
      );
    }
  }

  /**
   * Create border
   */
  private createBorder(): void {
    this.borderGraphics = this.scene.add.graphics();

    this.borderGraphics.lineStyle(
      DASHBOARD_CARD_CONFIG.borderWidth,
      DARK_GOTHIC_THEME.colors.accent,
      1.0,
    );
    this.borderGraphics.strokeRoundedRect(
      -this.scaledConfig.width / 2,
      -this.scaledConfig.height / 2,
      this.scaledConfig.width,
      this.scaledConfig.height,
      DASHBOARD_CARD_CONFIG.borderRadius,
    );

    this.add(this.borderGraphics);
  }

  /**
   * Create card content (icon, title, description, stats)
   */
  private createContent(): void {
    // Calculate scale factor based on card dimensions
    const scaleFactor = this.scaledConfig.width / (DASHBOARD_CARD_CONFIG.maxWidth || 380);
    const halfWidth = this.scaledConfig.width / 2;
    const halfHeight = this.scaledConfig.height / 2;

    // Scaled dimensions
    const iconSize = Math.round((DASHBOARD_CARD_CONFIG.iconSize || 80) * scaleFactor);
    const titleFontSize = Math.round((DASHBOARD_CARD_CONFIG.titleFontSize || 28) * scaleFactor);
    const descriptionFontSize = Math.round((DASHBOARD_CARD_CONFIG.descriptionFontSize || 16) * scaleFactor);

    // Scaled positioning
    const iconOffsetY = Math.round(60 * scaleFactor);
    const titleOffsetY = Math.round(140 * scaleFactor);
    const descriptionOffsetY = Math.round(175 * scaleFactor);

    // Icon (emoji or texture)
    this.iconText = this.scene.add.text(
      0,
      -halfHeight + iconOffsetY,
      this.config.icon,
      {
        fontSize: `${iconSize}px`,
        fontFamily: DARK_GOTHIC_THEME.fonts.primary,
        color: '#ffffff',
        align: 'center',
      },
    );
    this.iconText.setOrigin(0.5);
    this.add(this.iconText);

    // Title
    this.titleText = this.scene.add.text(
      0,
      -halfHeight + titleOffsetY,
      this.config.title,
      {
        fontSize: `${titleFontSize}px`,
        fontFamily: DARK_GOTHIC_THEME.fonts.primary,
        color: '#ffd700',
        align: 'center',
        fontStyle: 'bold',
      },
    );
    this.titleText.setOrigin(0.5);
    this.add(this.titleText);

    // Description
    this.descriptionText = this.scene.add.text(
      0,
      -halfHeight + descriptionOffsetY,
      this.config.description,
      {
        fontSize: `${descriptionFontSize}px`,
        fontFamily: DARK_GOTHIC_THEME.fonts.secondary,
        color: '#cccccc',
        align: 'center',
      },
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
    // Calculate scale factor for stats
    const scaleFactor = this.scaledConfig.width / (DASHBOARD_CARD_CONFIG.maxWidth || 380);
    const statFontSize = Math.round((DASHBOARD_CARD_CONFIG.statFontSize || 14) * scaleFactor);
    const statSpacing = Math.round(10 * scaleFactor);
    const statsOffsetY = Math.round(50 * scaleFactor);

    this.statsContainer = this.scene.add.container(0, this.scaledConfig.height / 2 - statsOffsetY);

    const stats = this.config.stats || [];
    let currentY = 0;

    stats.forEach((stat) => {
      const statText = this.scene.add.text(
        0,
        currentY,
        `${stat.icon || '•'} ${stat.label}: ${stat.value}`,
        {
          fontSize: `${statFontSize}px`,
          fontFamily: DARK_GOTHIC_THEME.fonts.secondary,
          color: '#ffffff',
          align: 'center',
        },
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

    // Calculate scale factor for badge
    const scaleFactor = this.scaledConfig.width / (DASHBOARD_CARD_CONFIG.maxWidth || 380);
    const halfWidth = this.scaledConfig.width / 2;
    const halfHeight = this.scaledConfig.height / 2;

    // Scaled badge dimensions
    const badgeRadius = Math.round(20 * scaleFactor);
    const badgeOffset = Math.round(30 * scaleFactor);
    const badgeFontSize = Math.round(14 * scaleFactor);

    this.badgeContainer = this.scene.add.container(halfWidth - badgeOffset, -halfHeight + badgeOffset);

    // Badge background
    const badgeBg = this.scene.add.circle(0, 0, badgeRadius, this.config.badge.color);
    this.badgeContainer.add(badgeBg);

    // Badge text
    const badgeText = this.scene.add.text(0, 0, this.config.badge.text, {
      fontSize: `${badgeFontSize}px`,
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

    this.glowEffect.setScale(this.scaledConfig.width / 100);
    this.add(this.glowEffect);
    this.sendToBack(this.glowEffect);
  }

  /**
   * Create lock overlay
   */
  private createLockOverlay(): void {
    const halfWidth = this.scaledConfig.width / 2;
    const halfHeight = this.scaledConfig.height / 2;

    this.lockOverlay = this.scene.add.container(0, 0);

    // Darkened overlay
    const overlay = this.scene.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRoundedRect(
      -halfWidth,
      -halfHeight,
      DASHBOARD_CARD_CONFIG.width,
      DASHBOARD_CARD_CONFIG.height,
      DASHBOARD_CARD_CONFIG.borderRadius,
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
        },
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
    // Card dimensions - must match visual card exactly (use SCALED dimensions)
    const cardWidth = this.scaledConfig.width;
    const cardHeight = this.scaledConfig.height;
    const borderWidth = DASHBOARD_CARD_CONFIG.borderWidth;

    // The border stroke extends OUTWARD from the base rectangle
    // Visual card size = base size + border width (stroke adds 1.5px on each side)
    const halfWidth = cardWidth / 2;
    const halfHeight = cardHeight / 2;
    const borderOffset = borderWidth / 2; // Border extends outward by half its width

    // Create interactive zone - matches the OUTER edge of the border
    const hitArea = new Phaser.Geom.Rectangle(
      -halfWidth - borderOffset,
      -halfHeight - borderOffset,
      cardWidth + borderWidth,
      cardHeight + borderWidth,
    );

    // Set interactive with explicit hit area
    this.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    // Also set the container size to match
    this.setSize(cardWidth, cardHeight);

    // Add slight padding to hit area for better usability on touch devices
    this.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(
        -halfWidth - borderOffset - 5,
        -halfHeight - borderOffset - 5,
        cardWidth + borderWidth + 10,
        cardHeight + borderWidth + 10,
      ),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    });

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
   * Enable debug visualization of hit box
   */
  enableDebugHitBox(): void {
    if (this.debugHitBox) {
      return; // Already enabled
    }

    const cardWidth = this.scaledConfig.width;
    const cardHeight = this.scaledConfig.height;
    const borderWidth = DASHBOARD_CARD_CONFIG.borderWidth;
    const halfHeight = cardHeight / 2;

    // Calculate actual hit area size
    const hitWidth = cardWidth - borderWidth;
    const hitHeight = cardHeight - borderWidth;

    this.debugHitBox = this.scene.add.graphics();

    // Add to container so it transforms with card
    this.add(this.debugHitBox);

    // Add size label showing actual hit area dimensions
    this.debugLabel = this.scene.add.text(
      0,
      halfHeight + 15,
      `Hit: ${hitWidth}×${hitHeight}`,
      {
        fontSize: '14px',
        color: '#00ff00',
        fontStyle: 'bold',
        backgroundColor: '#000000',
        padding: { x: 4, y: 2 },
      },
    );
    this.debugLabel.setOrigin(0.5);
    this.add(this.debugLabel);

    // Redraw debug box every frame to show live transforms
    this.scene.events.on('update', this.updateDebugBox, this);
  }

  /**
   * Update debug box visualization every frame
   */
  private updateDebugBox(): void {
    if (!this.debugHitBox) return;

    const cardWidth = this.scaledConfig.width;
    const cardHeight = this.scaledConfig.height;
    const borderWidth = DASHBOARD_CARD_CONFIG.borderWidth;
    const borderOffset = borderWidth / 2;

    // Calculate hit area bounds (same as in setupInteractivity)
    const halfWidth = cardWidth / 2;
    const halfHeight = cardHeight / 2;
    const hitX = -halfWidth - borderOffset;
    const hitY = -halfHeight - borderOffset;
    const hitWidth = cardWidth + borderWidth;
    const hitHeight = cardHeight + borderWidth;

    this.debugHitBox.clear();

    // Semi-transparent fill
    this.debugHitBox.fillStyle(0x00ff00, 0.15);
    this.debugHitBox.fillRect(hitX, hitY, hitWidth, hitHeight);

    // Thick outline
    this.debugHitBox.lineStyle(3, 0x00ff00, 1);
    this.debugHitBox.strokeRect(hitX, hitY, hitWidth, hitHeight);

    // Corner markers
    const markerSize = 10;
    this.debugHitBox.lineStyle(2, 0xffff00, 1);
    this.debugHitBox.strokeRect(hitX, hitY, markerSize, markerSize);
    this.debugHitBox.strokeRect(hitX + hitWidth - markerSize, hitY, markerSize, markerSize);
    this.debugHitBox.strokeRect(hitX, hitY + hitHeight - markerSize, markerSize, markerSize);
    this.debugHitBox.strokeRect(hitX + hitWidth - markerSize, hitY + hitHeight - markerSize, markerSize, markerSize);
  }

  /**
   * Disable debug visualization
   */
  disableDebugHitBox(): void {
    // Remove update listener
    this.scene.events.off('update', this.updateDebugBox, this);

    if (this.debugHitBox) {
      this.debugHitBox.destroy();
      this.debugHitBox = undefined;
    }
    if (this.debugLabel) {
      this.debugLabel.destroy();
      this.debugLabel = undefined;
    }
  }

  /**
   * Handle hover start
   */
  private onHoverStart(): void {
    this.isHovered = true;

    if (this.hoverTween) {
      this.hoverTween.stop();
      this.hoverTween = undefined;
    }

    // Enable magnetic hover effect
    if (this.config.locked) {
      // No magnetic effect on locked cards
    } else {
      this.magneticHoverEffect = applyMagneticHover(this);
    }

    // Animate glass overlay smoothly
    this.scene.tweens.add({
      targets: this.glassOverlay,
      alpha: 1,
      duration: 200,
      ease: 'Power2.easeOut',
    });

    // Update border color to orange (warning color indicates interactive)
    this.borderGraphics.clear();
    this.borderGraphics.lineStyle(
      DASHBOARD_CARD_CONFIG.borderWidth,
      DARK_GOTHIC_THEME.colors.warning,
      1.0,
    );
    this.borderGraphics.strokeRoundedRect(
      -this.scaledConfig.width / 2,
      -this.scaledConfig.height / 2,
      this.scaledConfig.width,
      this.scaledConfig.height,
      DASHBOARD_CARD_CONFIG.borderRadius,
    );

    // Enhance glow effect if present
    if (this.glowEffect) {
      this.glowEffect.setGlowIntensity(
        DASHBOARD_CARD_CONFIG.hoverGlowIntensity / 10,
        DASHBOARD_CARD_CONFIG.hoverGlowIntensity / 20,
      );
    }

    // Add subtle scale effect for better feedback
    this.scene.tweens.add({
      targets: this,
      scale: 1.02,
      y: this.y - 5,
      duration: 200,
      ease: 'Back.easeOut',
    });

    // Setup spotlight tracking
    this.on('pointermove', this.onPointerMove, this);
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.isHovered) return;
    this.updateSpotlight(pointer.x, pointer.y);
  }

  /**
   * Handle hover end
   */
  private onHoverEnd(): void {
    if (!this.isHovered) return;
    this.isHovered = false;

    // Disable magnetic hover effect
    if (this.magneticHoverEffect) {
      this.magneticHoverEffect.disable();
    }

    this.scene.tweens.add({
      targets: this.glassOverlay,
      alpha: 0,
      duration: 200,
      ease: 'Power2.easeOut',
    });

    this.spotlightOverlay.clear();

    this.off('pointermove', this.onPointerMove, this);

    this.borderGraphics.clear();
    this.borderGraphics.lineStyle(
      DASHBOARD_CARD_CONFIG.borderWidth,
      DARK_GOTHIC_THEME.colors.accent,
      1.0,
    );
    this.borderGraphics.strokeRoundedRect(
      -this.scaledConfig.width / 2,
      -this.scaledConfig.height / 2,
      this.scaledConfig.width,
      this.scaledConfig.height,
      DASHBOARD_CARD_CONFIG.borderRadius,
    );

    if (this.glowEffect && this.config.glow) {
      this.glowEffect.setGlowIntensity(
        this.config.glow.intensity,
        this.config.glow.intensity * 0.5,
      );
    }
  }

  /**
   * Handle pointer down (press)
   */
  private onPointerDown(): void {
    const pointer = this.scene.input.activePointer;

    // Animate press effect
    this.scene.tweens.add({
      targets: this,
      scale: 0.98,
      y: this.y + 2,
      duration: 100,
      ease: 'Power2.easeIn',
    });

    // Use enhanced click feedback
    const feedback = createClickFeedback(
      this.scene,
      pointer.x,
      pointer.y,
      {
        color: this.config.id === 'play' ? 0xff0000 : DARK_GOTHIC_THEME.colors.accent,
        screenShake: this.config.id === 'play',
        screenFlash: this.config.id === 'play',
      }
    );

    // Auto-cleanup feedback after animation
    this.scene.time.delayedCall(500, () => {
      feedback.destroy();
    });

    // Screen shake for main play button
    if (this.config.id === 'play') {
      this.scene.cameras.main.shake(100, 0.005);
    }
  }


  /**
   * Handle pointer up (release and click)
   */
  private onPointerUp(): void {
    // Animate back to normal state
    this.scene.tweens.add({
      targets: this,
      scale: 1,
      y: this.y - 5, // Maintain hover lift
      duration: 150,
      ease: 'Elastic.easeOut',
      onComplete: () => {
        // Execute onClick callback after animation completes
        this.config.onClick();
      },
    });
  }

  /**
   * Update card position (for responsive layout)
   */
  updatePosition(x: number, y: number): void {
    this.baseX = x;
    this.baseY = y;
    this.x = x;
    this.y = y;
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
    // Stop any active hover animation
    if (this.hoverTween) {
      this.hoverTween.stop();
      this.hoverTween = undefined;
    }

    // Clean up magnetic hover effect
    if (this.magneticHoverEffect) {
      this.magneticHoverEffect.destroy();
    }

    // Remove debug update listener
    this.scene.events.off('update', this.updateDebugBox, this);

    // Remove event listeners
    this.off('pointerover');
    this.off('pointerout');
    this.off('pointerdown');
    this.off('pointerup');

    super.destroy(fromScene);
  }
}
