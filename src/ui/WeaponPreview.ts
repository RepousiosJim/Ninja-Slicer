/**
 * WeaponPreview Component
 *
 * A large animated weapon display component for character screen.
 * Features idle floating animation, glow effects based on weapon type,
 * trail color preview, and support for different weapon sizes.
 */

import Phaser from 'phaser';
import { TEXTURE_KEYS } from '../config/constants';
import { DARK_GOTHIC_THEME } from '../config/theme';
import { WeaponConfig, WeaponRarity } from '../config/types';
import { TierBadge } from './TierBadge';
import { getTierColor } from '../utils/ThemeUtils';

/**
 * Weapon preview configuration interface
 */
export interface WeaponPreviewConfig {
  weapon: WeaponConfig;
  tier: number;
  size?: 'small' | 'medium' | 'large';
  showTrail?: boolean;
}

/**
 * Rarity glow colors with theme
 */
const RARITY_GLOW_COLORS: Record<WeaponRarity, number> = {
  common: 0x9d9d9d,
  uncommon: 0x1eff00,
  rare: 0x0070dd,
  epic: 0xa335ee,
  legendary: 0xff8000,
};

/**
 * Weapon preview component for large animated weapon display
 */
export class WeaponPreview extends Phaser.GameObjects.Container {
  // UI elements
  private weaponIcon: Phaser.GameObjects.Image;
  private glow: Phaser.GameObjects.Graphics;
  private trail: Phaser.GameObjects.Graphics | null = null;
  private tierBadge: TierBadge;
  private weaponName: Phaser.GameObjects.Text;
  private weaponTypeBadge: Phaser.GameObjects.Text;

  // Preview state
  private weapon: WeaponConfig;
  private tier: number;
  private size: 'small' | 'medium' | 'large';
  private showTrail: boolean;
  private isHovered: boolean;
  private floatingTween: Phaser.Tweens.Tween | null = null;

  /**
   * Create a new weapon preview
   * @param scene - The scene this preview belongs to
   * @param x - X position
   * @param y - Y position
   * @param config - Weapon preview configuration
   */
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: WeaponPreviewConfig,
  ) {
    super(scene, x, y);

    this.weapon = config.weapon;
    this.tier = config.tier;
    this.size = config.size || 'large';
    this.showTrail = config.showTrail !== false;
    this.isHovered = false;

    // Get size dimensions
    const dimensions = this.getSizeDimensions();

    // Create glow effect with theme
    this.glow = scene.add.graphics();
    this.glow.setDepth(-1);
    this.add(this.glow);

    // Create trail preview
    if (this.showTrail) {
      this.trail = scene.add.graphics();
      this.trail.setDepth(-2);
      this.add(this.trail);
      this.createTrailPreview();
    }

    // Create weapon icon
    this.weaponIcon = scene.add.image(0, 0, this.getWeaponTextureKey(this.weapon.id));
    this.weaponIcon.setScale(dimensions.iconScale);
    this.weaponIcon.setDepth(1);
    this.add(this.weaponIcon);

    // Create weapon name with theme typography
    this.weaponName = scene.add.text(0, dimensions.iconSize / 2 + 30, this.weapon.name, {
      fontFamily: DARK_GOTHIC_THEME.fonts.primary,
      fontSize: `${dimensions.nameFontSize}px`,
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    this.weaponName.setOrigin(0.5);
    this.add(this.weaponName);

    // Create tier badge
    this.tierBadge = new TierBadge(scene, -dimensions.iconSize / 2 + 30, -dimensions.iconSize / 2 + 30, this.tier, this.weapon.rarity, 'medium');
    this.add(this.tierBadge);

    // Create weapon type badge with theme
    this.weaponTypeBadge = scene.add.text(dimensions.iconSize / 2 - 30, -dimensions.iconSize / 2 + 30, this.getWeaponTypeLabel(), {
      fontFamily: DARK_GOTHIC_THEME.fonts.secondary,
      fontSize: '12px',
      color: '#CCCCCC',
      fontStyle: 'bold',
    });
    this.weaponTypeBadge.setOrigin(1, 0.5);
    this.add(this.weaponTypeBadge);

    // Apply initial glow with theme
    this.updateGlow();

    // Start idle animation with theme
    this.startIdleAnimation();

    // Setup interaction
    this.setupInteraction();

    // Add to scene
    scene.add.existing(this);
  }

  /**
   * Get size dimensions based on size parameter
   */
  private getSizeDimensions(): { iconSize: number; iconScale: number; nameFontSize: number } {
    switch (this.size) {
    case 'small':
      return { iconSize: 100, iconScale: 0.4, nameFontSize: 18 };
    case 'medium':
      return { iconSize: 150, iconScale: 0.6, nameFontSize: 24 };
    case 'large':
    default:
      return { iconSize: 200, iconScale: 0.8, nameFontSize: 32 };
    }
  }

  /**
   * Get weapon texture key from weapon ID
   */
  private getWeaponTextureKey(weaponId: string): string {
    const textureMap: Record<string, string> = {
      basic_sword: TEXTURE_KEYS.basicSword,
      silver_blade: TEXTURE_KEYS.silverBlade,
      holy_cross_blade: TEXTURE_KEYS.holyCrossBlade,
      fire_sword: TEXTURE_KEYS.fireSword,
      ice_blade: TEXTURE_KEYS.iceBlade,
      lightning_katana: TEXTURE_KEYS.lightningKatana,
    };
    return textureMap[weaponId] || TEXTURE_KEYS.basicSword;
  }

  /**
   * Get weapon type label
   */
  private getWeaponTypeLabel(): string {
    // Simple type detection based on weapon ID
    if (this.weapon.id.includes('fire') || this.weapon.id.includes('ice') || this.weapon.id.includes('lightning')) {
      return 'ELEMENTAL';
    } else if (this.weapon.id.includes('holy')) {
      return 'MAGIC';
    }
    return 'MELEE';
  }

  /**
   * Create trail preview effect
   */
  private createTrailPreview(): void {
    if (!this.trail) return;

    this.trail.clear();

    const dimensions = this.getSizeDimensions();
    const trailColor = parseInt(this.weapon.trailColor.replace('#', '0x'), 16);
    const trailGlow = parseInt(this.weapon.trailGlow.replace('#', '0x'), 16);

    // Draw trail arc
    this.trail.lineStyle(8, trailColor, 0.8);
    this.trail.beginPath();
    this.trail.arc(0, 0, dimensions.iconSize / 2 + 20, Phaser.Math.DegToRad(225), Phaser.Math.DegToRad(315), false);
    this.trail.strokePath();

    // Draw glow
    this.trail.lineStyle(16, trailGlow, 0.3);
    this.trail.beginPath();
    this.trail.arc(0, 0, dimensions.iconSize / 2 + 20, Phaser.Math.DegToRad(225), Phaser.Math.DegToRad(315), false);
    this.trail.strokePath();
  }

  /**
   * Update glow effect based on rarity with theme
   */
  private updateGlow(): void {
    this.glow.clear();

    const dimensions = this.getSizeDimensions();
    const glowColor = getTierColor(this.weapon.rarity);
    const glowAlpha = this.isHovered ? 0.6 : 0.3;

    // Draw glow circle
    this.glow.fillStyle(glowColor, glowAlpha);
    this.glow.fillCircle(0, 0, dimensions.iconSize / 2 + 10);

    // Draw outer glow for higher rarities
    if (this.weapon.rarity === 'rare' || this.weapon.rarity === 'epic' || this.weapon.rarity === 'legendary') {
      this.glow.fillStyle(glowColor, glowAlpha * 0.5);
      this.glow.fillCircle(0, 0, dimensions.iconSize / 2 + 20);
    }
  }

  /**
   * Start idle floating animation with theme
   */
  private startIdleAnimation(): void {
    if (this.floatingTween) {
      this.floatingTween.destroy();
    }

    this.floatingTween = this.scene.tweens.add({
      targets: this.weaponIcon,
      y: 0,
      yoyo: true,
      repeat: -1,
      duration: 2000,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        // Subtle rotation
        this.weaponIcon.setRotation(Math.sin(this.scene.time.now / 1000) * 0.05);
      },
    });
  }

  /**
   * Setup interaction
   */
  private setupInteraction(): void {
    this.weaponIcon.setInteractive({ useHandCursor: true });

    this.weaponIcon.on('pointerover', this.onHover.bind(this));
    this.weaponIcon.on('pointerout', this.onHoverEnd.bind(this));
    this.weaponIcon.on('pointerdown', this.onClick.bind(this));
  }

  /**
   * Handle hover event with theme animation
   */
  private onHover(): void {
    this.isHovered = true;

    // Scale up weapon icon
    this.scene.tweens.add({
      targets: this.weaponIcon,
      scaleX: this.weaponIcon.scaleX * 1.1,
      scaleY: this.weaponIcon.scaleY * 1.1,
      duration: DARK_GOTHIC_THEME.animations.duration,
      ease: DARK_GOTHIC_THEME.animations.easing,
    });

    // Update glow
    this.updateGlow();
  }

  /**
   * Handle hover end event with theme animation
   */
  private onHoverEnd(): void {
    this.isHovered = false;

    const dimensions = this.getSizeDimensions();

    // Scale back to normal
    this.scene.tweens.add({
      targets: this.weaponIcon,
      scaleX: dimensions.iconScale,
      scaleY: dimensions.iconScale,
      duration: DARK_GOTHIC_THEME.animations.duration,
      ease: DARK_GOTHIC_THEME.animations.easing,
    });

    // Update glow
    this.updateGlow();
  }

  /**
   * Handle click event
   */
  private onClick(): void {
    // Pulse animation on click
    this.scene.tweens.add({
      targets: this.weaponIcon,
      scaleX: this.weaponIcon.scaleX * 1.2,
      scaleY: this.weaponIcon.scaleY * 1.2,
      duration: 150,
      yoyo: true,
      ease: 'Power2',
    });

    // Emit event
    this.emit('weapon-clicked', this.weapon);
  }

  /**
   * Update weapon data
   * @param weapon - New weapon configuration
   */
  public updateWeapon(weapon: WeaponConfig): void {
    this.weapon = weapon;
    this.weaponIcon.setTexture(this.getWeaponTextureKey(weapon.id));
    this.weaponName.setText(weapon.name);
    this.weaponTypeBadge.setText(this.getWeaponTypeLabel());
    this.updateGlow();

    if (this.showTrail) {
      this.createTrailPreview();
    }
  }

  /**
   * Set tier level
   * @param tier - New tier level
   */
  public setTier(tier: number): void {
    this.tier = tier;
    this.tierBadge.setTier(tier);
  }

  /**
   * Set preview size
   * @param size - New preview size
   */
  public setPreviewSize(size: 'small' | 'medium' | 'large'): void {
    this.size = size;

    const dimensions = this.getSizeDimensions();
    this.weaponIcon.setScale(dimensions.iconScale);
    this.weaponName.setFontSize(`${dimensions.nameFontSize}px`);
    this.weaponName.setPosition(0, dimensions.iconSize / 2 + 30);

    this.updateGlow();
    if (this.showTrail) {
      this.createTrailPreview();
    }
  }

  /**
   * Get current weapon configuration
   */
  public getWeapon(): WeaponConfig {
    return this.weapon;
  }

  /**
   * Clean up preview resources
   */
  public destroy(): void {
    if (this.floatingTween) {
      this.floatingTween.destroy();
    }

    if (this.weaponIcon) {
      this.weaponIcon.off('pointerover', this.onHover.bind(this));
      this.weaponIcon.off('pointerout', this.onHoverEnd.bind(this));
      this.weaponIcon.off('pointerdown', this.onClick.bind(this));
    }

    super.destroy();
  }
}
