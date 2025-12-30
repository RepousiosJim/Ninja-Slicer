/**
 * EffectCard Component
 *
 * A card component for displaying active tier effects.
 * Features icon and description, hover for detailed tooltip,
 * animated appearance, and support for multiple effects.
 */

import Phaser from 'phaser';
import { COLORS, FONT_SIZES, UI_ANIMATION_DURATION } from '../config/constants';
import { WeaponEffect } from '../config/types';

/**
 * Effect card configuration interface
 */
export interface EffectCardConfig {
  effect: WeaponEffect;
  tier?: number;
  showTooltip?: boolean;
}

/**
 * Effect card component for special effects display
 */
export class EffectCard extends Phaser.GameObjects.Container {
  // UI elements
  private background: Phaser.GameObjects.Rectangle;
  private icon: Phaser.GameObjects.Graphics;
  private description: Phaser.GameObjects.Text;
  private tooltip: Phaser.GameObjects.Container | null = null;
  private tooltipBackground: Phaser.GameObjects.Rectangle | null = null;
  private tooltipText: Phaser.GameObjects.Text | null = null;

  // Card state
  private effect: WeaponEffect;
  private tier: number;
  private showTooltip: boolean;
  private isHovered: boolean;
  private cardWidth: number;
  private cardHeight: number;

  /**
   * Create a new effect card
   * @param scene - The scene this card belongs to
   * @param x - X position
   * @param y - Y position
   * @param config - Effect card configuration
   */
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: EffectCardConfig,
  ) {
    super(scene, x, y);

    this.effect = config.effect;
    this.tier = config.tier || 1;
    this.showTooltip = config.showTooltip !== false;
    this.isHovered = false;
    this.cardWidth = 200;
    this.cardHeight = 80;

    // Create background
    this.background = scene.add.rectangle(0, 0, this.cardWidth, this.cardHeight, 0x2a2a4a);
    this.background.setStrokeStyle(2, COLORS.accent);
    this.background.setAlpha(0.9);
    this.add(this.background);

    // Create effect icon
    this.icon = scene.add.graphics();
    this.icon.setDepth(1);
    this.add(this.icon);
    this.createEffectIcon();

    // Create description
    this.description = scene.add.text(40, 0, this.effect.description, {
      fontSize: `${FONT_SIZES.small}px`,
      color: '#CCCCCC',
    });
    this.description.setOrigin(0, 0.5);
    this.description.setWordWrapWidth(this.cardWidth - 60);
    this.add(this.description);

    // Setup interaction
    this.setupInteraction();

    // Animate appearance
    this.animateAppearance();

    // Add to scene
    scene.add.existing(this);
  }

  /**
   * Create effect icon based on effect type
   */
  private createEffectIcon(): void {
    this.icon.clear();

    const iconSize = 30;
    const iconColor = this.getEffectColor();

    // Draw icon based on effect type
    switch (this.effect.type) {
    case 'bonus_damage':
      // Draw sword icon
      this.icon.lineStyle(3, iconColor, 1);
      this.icon.beginPath();
      this.icon.moveTo(-iconSize / 2, iconSize / 2);
      this.icon.lineTo(iconSize / 2, -iconSize / 2);
      this.icon.strokePath();
      break;

    case 'stun':
      // Draw lightning bolt
      this.icon.lineStyle(3, iconColor, 1);
      this.icon.beginPath();
      this.icon.moveTo(0, -iconSize / 2);
      this.icon.lineTo(-iconSize / 4, 0);
      this.icon.lineTo(iconSize / 4, 0);
      this.icon.lineTo(0, iconSize / 2);
      this.icon.strokePath();
      break;

    case 'ghost_visibility':
      // Draw eye icon
      this.icon.lineStyle(3, iconColor, 1);
      this.icon.strokeCircle(0, 0, iconSize / 3);
      this.icon.fillCircle(0, 0, iconSize / 6);
      break;

    case 'damage_over_time':
      // Draw fire icon
      this.icon.fillStyle(iconColor, 1);
      this.icon.fillCircle(0, 0, iconSize / 3);
      this.icon.lineStyle(2, 0xff0000, 1);
      this.icon.beginPath();
      this.icon.arc(0, 0, iconSize / 2, 0, Math.PI * 2);
      this.icon.strokePath();
      break;

    case 'freeze_chance':
      // Draw snowflake
      this.icon.lineStyle(2, iconColor, 1);
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 / 6) * i;
        this.icon.beginPath();
        this.icon.moveTo(0, 0);
        this.icon.lineTo(Math.cos(angle) * iconSize / 2, Math.sin(angle) * iconSize / 2);
        this.icon.strokePath();
      }
      break;

    case 'chain_damage':
    case 'chain_stun':
      // Draw chain icon
      this.icon.lineStyle(2, iconColor, 1);
      this.icon.beginPath();
      this.icon.arc(-iconSize / 4, 0, iconSize / 4, 0, Math.PI * 2);
      this.icon.strokePath();
      this.icon.beginPath();
      this.icon.arc(iconSize / 4, 0, iconSize / 4, 0, Math.PI * 2);
      this.icon.strokePath();
      this.icon.beginPath();
      this.icon.moveTo(-iconSize / 4, 0);
      this.icon.lineTo(iconSize / 4, 0);
      this.icon.strokePath();
      break;

    default:
      // Draw default star icon
      this.icon.fillStyle(iconColor, 1);
      this.icon.fillCircle(0, 0, iconSize / 3);
      break;
    }
  }

  /**
   * Get effect color based on type
   */
  private getEffectColor(): number {
    switch (this.effect.type) {
    case 'bonus_damage':
      return 0xff4500; // Fire orange
    case 'stun':
      return 0x9932cc; // Lightning purple
    case 'ghost_visibility':
      return 0x00bfff; // Ice blue
    case 'damage_over_time':
      return 0xff0000; // Fire red
    case 'freeze_chance':
      return 0x00ffff; // Ice cyan
    case 'chain_damage':
    case 'chain_stun':
      return 0xffd700; // Gold
    default:
      return COLORS.accent;
    }
  }

  /**
   * Setup interaction
   */
  private setupInteraction(): void {
    this.background.setInteractive({ useHandCursor: true });

    this.background.on('pointerover', this.onHover.bind(this));
    this.background.on('pointerout', this.onHoverEnd.bind(this));
  }

  /**
   * Handle hover event
   */
  private onHover(): void {
    this.isHovered = true;

    // Scale up slightly
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: UI_ANIMATION_DURATION,
      ease: 'Power2',
    });

    // Show tooltip if enabled
    if (this.showTooltip) {
      this.showTooltipPanel();
    }
  }

  /**
   * Handle hover end event
   */
  private onHoverEnd(): void {
    this.isHovered = false;

    // Scale back to normal
    this.scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      duration: UI_ANIMATION_DURATION,
      ease: 'Power2',
    });

    // Hide tooltip
    if (this.tooltip) {
      this.hideTooltipPanel();
    }
  }

  /**
   * Show tooltip panel
   */
  private showTooltipPanel(): void {
    if (this.tooltip) return;

    // Create tooltip container
    this.tooltip = this.scene.add.container(0, -this.cardHeight / 2 - 10);

    // Create tooltip background
    this.tooltipBackground = this.scene.add.rectangle(0, 0, 250, 60, 0x1a1a2e);
    this.tooltipBackground.setStrokeStyle(2, COLORS.accent);
    this.tooltipBackground.setAlpha(0.95);
    this.tooltip.add(this.tooltipBackground);

    // Create tooltip text
    const tooltipText = this.getTooltipText();
    this.tooltipText = this.scene.add.text(0, 0, tooltipText, {
      fontSize: '12px',
      color: '#FFFFFF',
    });
    this.tooltipText.setOrigin(0.5);
    this.tooltipText.setWordWrapWidth(230);
    this.tooltip.add(this.tooltipText);

    // Add tooltip to scene
    this.scene.add.existing(this.tooltip);
    this.add(this.tooltip);

    // Animate tooltip appearance
    this.tooltip.setScale(0);
    this.scene.tweens.add({
      targets: this.tooltip,
      scaleX: 1,
      scaleY: 1,
      duration: UI_ANIMATION_DURATION,
      ease: 'Back.easeOut',
    });
  }

  /**
   * Hide tooltip panel
   */
  private hideTooltipPanel(): void {
    if (!this.tooltip) return;

    this.scene.tweens.add({
      targets: this.tooltip,
      scaleX: 0,
      scaleY: 0,
      duration: UI_ANIMATION_DURATION,
      ease: 'Power2',
      onComplete: () => {
        if (this.tooltip) {
          this.remove(this.tooltip);
          this.tooltip.destroy();
          this.tooltip = null;
          this.tooltipBackground = null;
          this.tooltipText = null;
        }
      },
    });
  }

  /**
   * Get tooltip text based on effect type
   */
  private getTooltipText(): string {
    const effectDescriptions: Record<string, string> = {
      bonus_damage: `+${this.effect.value || 0}% damage to ${this.effect.target || 'enemies'}`,
      stun: `Stuns ${this.effect.target || 'enemies'} for ${this.effect.stunDuration || 0}s`,
      ghost_visibility: `Makes ghosts visible for ${this.effect.duration || 0}s`,
      damage_over_time: `Deals ${this.effect.damagePerTick || 0} damage every ${this.effect.tickInterval || 0}s for ${this.effect.ticks || 0} ticks`,
      freeze_chance: `${this.effect.value || 0}% chance to freeze for ${this.effect.freezeDuration || 0}s`,
      chain_damage: `Chains to ${this.effect.chainCount || 0} enemies within ${this.effect.chainRadius || 0}px`,
      chain_stun: `Chains stun to ${this.effect.chainCount || 0} enemies`,
      slash_width: `+${this.effect.value || 0}% slash width`,
      proximity_reveal: `Reveals enemies within ${this.effect.radius || 0}px`,
      slow: `Slows enemies by ${this.effect.value || 0}%`,
      spread_damage: `Deals damage in ${this.effect.radius || 0}px radius`,
    };

    return effectDescriptions[this.effect.type] || this.effect.description;
  }

  /**
   * Animate card appearance
   */
  private animateAppearance(): void {
    this.setScale(0);

    this.scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      duration: UI_ANIMATION_DURATION,
      ease: 'Back.easeOut',
    });
  }

  /**
   * Update effect data
   * @param effect - New effect configuration
   */
  public updateEffect(effect: WeaponEffect): void {
    this.effect = effect;
    this.description.setText(effect.description);
    this.createEffectIcon();

    if (this.tooltipText) {
      this.tooltipText.setText(this.getTooltipText());
    }
  }

  /**
   * Set tier level
   * @param tier - New tier level
   */
  public setTier(tier: number): void {
    this.tier = tier;
  }

  /**
   * Enable or disable tooltip
   * @param enabled - Whether tooltip should be enabled
   */
  public setShowTooltip(enabled: boolean): void {
    this.showTooltip = enabled;

    if (!enabled && this.tooltip) {
      this.hideTooltipPanel();
    }
  }

  /**
   * Get current effect configuration
   */
  public getEffect(): WeaponEffect {
    return this.effect;
  }

  /**
   * Clean up card resources
   */
  public destroy(): void {
    if (this.background) {
      this.background.off('pointerover', this.onHover.bind(this));
      this.background.off('pointerout', this.onHoverEnd.bind(this));
    }

    if (this.tooltip) {
      this.remove(this.tooltip);
      this.tooltip.destroy();
    }

    super.destroy();
  }
}
