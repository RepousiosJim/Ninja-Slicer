/**
 * Card Component
 * 
 * A reusable card component for displaying items with locked/unlocked states.
 * Supports icon/image display, title, description, stats, and click callbacks.
 */

import Phaser from 'phaser';
import { COLORS, FONT_SIZES, UI_ANIMATION_DURATION, TEXTURE_KEYS } from '../config/constants';
import { DARK_GOTHIC_THEME } from '../config/theme';
import { getCardStyle } from '../utils/ThemeUtils';

/**
 * Card configuration interface
 */
export interface CardConfig {
  title: string;
  subtitle?: string;
  description?: string;
  imageKey?: string;
  locked?: boolean;
  selected?: boolean;
  stats?: { label: string; value: string }[];
  onClick?: () => void;
}

/**
 * Card component for displaying items
 */
export class Card extends Phaser.GameObjects.Container {
  // UI elements
  private background: Phaser.GameObjects.Rectangle;
  private border: Phaser.GameObjects.Rectangle;
  private icon: Phaser.GameObjects.Image | null = null;
  private title: Phaser.GameObjects.Text;
  private subtitle: Phaser.GameObjects.Text | null = null;
  private description: Phaser.GameObjects.Text | null = null;
  private stats: Phaser.GameObjects.Text[] = [];
  private lockIcon: Phaser.GameObjects.Image | null = null;
  private selectionIndicator: Phaser.GameObjects.Rectangle | null = null;

  // Card state
  private isLocked: boolean;
  private isSelected: boolean;
  private callback: (() => void) | null = null;
  private cardWidth: number;
  private cardHeight: number;

  /**
   * Create a new card
   * @param scene - The scene this card belongs to
   * @param x - X position
   * @param y - Y position
   * @param width - Card width
   * @param height - Card height
   * @param config - Card configuration
   */
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    config: CardConfig
  ) {
    super(scene, x, y);

    this.cardWidth = width;
    this.cardHeight = height;

    // Create background with theme
    const cardStyle = getCardStyle('normal');
    this.background = scene.add.rectangle(0, 0, width, height, cardStyle.backgroundColor);
    this.background.setAlpha(cardStyle.backgroundAlpha);
    this.add(this.background);

    // Create border with theme
    this.border = scene.add.rectangle(0, 0, width, height);
    this.border.setStrokeStyle(cardStyle.borderWidth, cardStyle.borderColor);
    this.border.setFillStyle(0x000000, 0);
    this.add(this.border);

    // Create icon if provided
    if (config.imageKey) {
      this.icon = scene.add.image(0, -height / 2 + 50, config.imageKey);
      this.icon.setScale(0.8);
      this.icon.setDepth(1);
      this.add(this.icon);
    }

    // Create title with theme typography
    this.title = scene.add.text(0, -height / 2 + 100, config.title, {
      fontFamily: DARK_GOTHIC_THEME.fonts.primary,
      fontSize: `${FONT_SIZES.medium}px`,
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    this.title.setOrigin(0.5);
    this.title.setWordWrapWidth(width - 20);
    this.add(this.title);

    // Create subtitle if provided
    if (config.subtitle) {
      this.subtitle = scene.add.text(0, -height / 2 + 130, config.subtitle, {
        fontFamily: DARK_GOTHIC_THEME.fonts.secondary,
        fontSize: `${FONT_SIZES.small}px`,
        color: '#CCCCCC',
      });
      this.subtitle.setOrigin(0.5);
      this.subtitle.setWordWrapWidth(width - 20);
      this.add(this.subtitle);
    }

    // Create description if provided
    if (config.description) {
      this.description = scene.add.text(0, -height / 2 + 160, config.description, {
        fontFamily: DARK_GOTHIC_THEME.fonts.secondary,
        fontSize: `${FONT_SIZES.small}px`,
        color: '#AAAAAA',
      });
      this.description.setOrigin(0.5);
      this.description.setWordWrapWidth(width - 20);
      this.add(this.description);
    }

    // Create stats if provided
    if (config.stats && config.stats.length > 0) {
      let statsY = -height / 2 + 200;
      config.stats.forEach((stat) => {
        const statText = scene.add.text(0, statsY, `${stat.label}: ${stat.value}`, {
          fontFamily: DARK_GOTHIC_THEME.fonts.monospace,
          fontSize: `${FONT_SIZES.small}px`,
          color: '#888888',
        });
        statText.setOrigin(0.5);
        this.stats.push(statText);
        this.add(statText);
        statsY += 20;
      });
    }

    // Create lock icon
    this.lockIcon = scene.add.image(0, 0, TEXTURE_KEYS.lockIcon);
    this.lockIcon.setScale(0.5);
    this.lockIcon.setVisible(false);
    this.lockIcon.setDepth(2);
    this.add(this.lockIcon);

    // Create selection indicator
    this.selectionIndicator = scene.add.rectangle(0, 0, width + 10, height + 10);
    this.selectionIndicator.setStrokeStyle(4, DARK_GOTHIC_THEME.colors.accent);
    this.selectionIndicator.setFillStyle(0x000000, 0);
    this.selectionIndicator.setVisible(false);
    this.add(this.selectionIndicator);

    // Set initial state
    this.isLocked = config.locked || false;
    this.isSelected = config.selected || false;
    this.callback = config.onClick || null;

    // Apply initial state
    this.updateAppearance();

    // Setup interaction
    this.setupInteraction();

    // Add to scene
    scene.add.existing(this);
  }

  /**
   * Setup card interaction
   */
  private setupInteraction(): void {
    this.background.setInteractive({ useHandCursor: true });

    this.background.on('pointerover', this.onHover.bind(this));
    this.background.on('pointerout', this.onHoverEnd.bind(this));
    this.background.on('pointerdown', this.onClick.bind(this));
  }

  /**
   * Handle hover event
   */
  private onHover(): void {
    if (this.isLocked) return;

    this.scene.tweens.add({
      targets: this,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: DARK_GOTHIC_THEME.animations.duration,
      ease: DARK_GOTHIC_THEME.animations.easing,
    });

    this.border.setStrokeStyle(4, DARK_GOTHIC_THEME.colors.warning);
  }

  /**
   * Handle hover end event
   */
  private onHoverEnd(): void {
    if (this.isLocked) return;

    this.scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      duration: DARK_GOTHIC_THEME.animations.duration,
      ease: DARK_GOTHIC_THEME.animations.easing,
    });

    const cardStyle = this.isSelected ? getCardStyle('selected') : getCardStyle('normal');
    this.border.setStrokeStyle(3, cardStyle.borderColor);
  }

  /**
   * Handle click event
   */
  private onClick(): void {
    if (this.isLocked) return;

    // Trigger callback
    if (this.callback) {
      this.callback();
    }
  }

  /**
   * Update card appearance based on state
   */
  private updateAppearance(): void {
    // Update lock icon visibility
    if (this.lockIcon) {
      this.lockIcon.setVisible(this.isLocked);
    }

    // Update selection indicator
    if (this.selectionIndicator) {
      this.selectionIndicator.setVisible(this.isSelected);
    }

    // Update border and background based on state
    if (this.isLocked) {
      const lockedStyle = getCardStyle('locked');
      this.border.setStrokeStyle(3, lockedStyle.borderColor);
      this.background.setFillStyle(lockedStyle.backgroundColor, lockedStyle.backgroundAlpha);
      this.title.setColor('#' + DARK_GOTHIC_THEME.colors.disabled.toString(16).padStart(6, '0'));
    } else {
      const cardStyle = this.isSelected ? getCardStyle('selected') : getCardStyle('normal');
      this.border.setStrokeStyle(3, cardStyle.borderColor);
      this.background.setFillStyle(cardStyle.backgroundColor, cardStyle.backgroundAlpha);
      this.title.setColor('#FFFFFF');
    }

    // Update icon alpha
    if (this.icon) {
      this.icon.setAlpha(this.isLocked ? 0.3 : 1);
    }
  }

  /**
   * Set locked state
   * @param locked - Whether card should be locked
   */
  public setLocked(locked: boolean): void {
    this.isLocked = locked;
    this.updateAppearance();
  }

  /**
   * Set selected state
   * @param selected - Whether card should be selected
   */
  public setSelected(selected: boolean): void {
    this.isSelected = selected;
    this.updateAppearance();
  }

  /**
   * Set click callback
   * @param callback - Function to call on click
   */
  public setCallback(callback: () => void): void {
    this.callback = callback;
  }

  /**
   * Update card content
   * @param config - New card configuration
   */
  public updateContent(config: Partial<CardConfig>): void {
    if (config.title) {
      this.title.setText(config.title);
    }

    if (config.subtitle && this.subtitle) {
      this.subtitle.setText(config.subtitle);
    }

    if (config.description && this.description) {
      this.description.setText(config.description);
    }

    if (config.imageKey && this.icon) {
      this.icon.setTexture(config.imageKey);
    }

    if (config.locked !== undefined) {
      this.setLocked(config.locked);
    }

    if (config.selected !== undefined) {
      this.setSelected(config.selected);
    }
  }

  /**
   * Get current locked state
   */
  public getLocked(): boolean {
    return this.isLocked;
  }

  /**
   * Get current selected state
   */
  public getSelected(): boolean {
    return this.isSelected;
  }

  /**
   * Clean up card resources
   */
  public destroy(): void {
    if (this.background) {
      this.background.off('pointerover', this.onHover.bind(this));
      this.background.off('pointerout', this.onHoverEnd.bind(this));
      this.background.off('pointerdown', this.onClick.bind(this));
    }
    super.destroy();
  }
}
