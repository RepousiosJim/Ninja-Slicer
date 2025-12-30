/**
 * TierBadge Component
 *
 * A reusable tier badge component for displaying weapon tier levels.
 * Supports color coding by tier, animated appearance, different sizes,
 * and glow effects for high tiers.
 */

import Phaser from 'phaser';
import { DARK_GOTHIC_THEME } from '../config/theme';
import { WeaponRarity } from '../config/types';
import { getTierColor } from '../utils/ThemeUtils';

/**
 * Tier badge configuration interface
 */
export interface TierBadgeConfig {
  tier: number;
  rarity?: WeaponRarity;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Tier badge component for displaying weapon tier levels
 */
export class TierBadge extends Phaser.GameObjects.Container {
  // UI elements
  private background: Phaser.GameObjects.Rectangle;
  private text: Phaser.GameObjects.Text;
  private glow: Phaser.GameObjects.Graphics | null = null;

  // Badge state
  private tier: number;
  private rarity: WeaponRarity;
  private size: 'small' | 'medium' | 'large';

  /**
   * Create a new tier badge
   * @param scene - The scene this badge belongs to
   * @param x - X position
   * @param y - Y position
   * @param tier - Tier level (1-3)
   * @param rarity - Weapon rarity for color coding
   * @param size - Badge size
   */
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    tier: number,
    rarity: WeaponRarity = WeaponRarity.COMMON,
    size: 'small' | 'medium' | 'large' = 'medium',
  ) {
    super(scene, x, y);

    this.tier = tier;
    this.rarity = rarity;
    this.size = size;

    // Get size dimensions
    const dimensions = this.getSizeDimensions();

    // Create background with theme color
    const tierColor = getTierColor(rarity);
    this.background = scene.add.rectangle(0, 0, dimensions.width, dimensions.height, tierColor);
    this.background.setStrokeStyle(2, DARK_GOTHIC_THEME.colors.accent, 0.3);
    this.add(this.background);

    // Create tier text (Roman numerals) with theme typography
    const romanNumerals = ['I', 'II', 'III', 'IV', 'V'];
    const tierText = romanNumerals[tier - 1] || tier.toString();

    this.text = scene.add.text(0, 0, tierText, {
      fontFamily: DARK_GOTHIC_THEME.fonts.primary,
      fontSize: `${dimensions.fontSize}px`,
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    this.text.setOrigin(0.5);
    this.add(this.text);

    // Add glow effect for high tiers
    if (tier >= 2) {
      this.createGlowEffect();
    }

    // Animate appearance with theme animation
    this.animateAppearance();

    // Add to scene
    scene.add.existing(this);
  }

  /**
   * Get size dimensions based on size parameter
   */
  private getSizeDimensions(): { width: number; height: number; fontSize: number } {
    switch (this.size) {
    case 'small':
      return { width: 30, height: 30, fontSize: 14 };
    case 'large':
      return { width: 50, height: 50, fontSize: 28 };
    case 'medium':
    default:
      return { width: 40, height: 40, fontSize: 20 };
    }
  }

  /**
   * Create glow effect for high-tier badges
   */
  private createGlowEffect(): void {
    this.glow = this.scene.add.graphics();
    this.glow.setDepth(-1);
    this.add(this.glow);

    this.updateGlow();
  }

  /**
   * Update glow effect
   */
  private updateGlow(): void {
    if (!this.glow) return;

    this.glow.clear();

    const dimensions = this.getSizeDimensions();
    const tierColor = getTierColor(this.rarity);
    const glowAlpha = this.tier >= 3 ? 0.4 : 0.2;

    // Draw glow
    this.glow.fillStyle(tierColor, glowAlpha);
    this.glow.fillCircle(0, 0, dimensions.width / 2 + 5);
  }

  /**
   * Animate badge appearance with theme animation
   */
  private animateAppearance(): void {
    this.setScale(0);

    this.scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      duration: DARK_GOTHIC_THEME.animations.duration,
      ease: 'Back.easeOut',
    });
  }

  /**
   * Set tier level
   * @param tier - New tier level
   */
  public setTier(tier: number): void {
    this.tier = tier;

    const dimensions = this.getSizeDimensions();
    const romanNumerals = ['I', 'II', 'III', 'IV', 'V'];
    const tierText = romanNumerals[tier - 1] || tier.toString();

    const tierColor = getTierColor(this.rarity);
    this.background.setFillStyle(tierColor);
    this.text.setText(tierText);

    if (tier >= 2) {
      if (!this.glow) {
        this.createGlowEffect();
      }
      this.updateGlow();
    } else if (this.glow) {
      this.remove(this.glow);
      this.glow.destroy();
      this.glow = null;
    }
  }

  /**
   * Set rarity
   * @param rarity - New weapon rarity
   */
  public setRarity(rarity: WeaponRarity): void {
    this.rarity = rarity;
    const tierColor = getTierColor(rarity);
    this.background.setFillStyle(tierColor);
    if (this.glow) {
      this.updateGlow();
    }
  }

  /**
   * Set badge size
   * @param size - New badge size
   */
  public setBadgeSize(size: 'small' | 'medium' | 'large'): void {
    this.size = size;

    const dimensions = this.getSizeDimensions();
    this.background.setSize(dimensions.width, dimensions.height);
    this.text.setFontSize(`${dimensions.fontSize}px`);

    if (this.glow) {
      this.updateGlow();
    }
  }

  /**
   * Get current tier level
   */
  public getTier(): number {
    return this.tier;
  }

  /**
   * Clean up badge resources
   */
  public destroy(): void {
    if (this.glow) {
      this.glow.destroy();
    }
    super.destroy();
  }
}
