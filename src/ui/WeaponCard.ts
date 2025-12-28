/**
 * WeaponCard Component
 *
 * A reusable weapon card component for displaying weapons in inventory.
 * Supports rarity-colored borders, tier badges, locked/unlocked states,
 * hover animations, and click event handling.
 */

import Phaser from 'phaser';
import { COLORS, FONT_SIZES, UI_ANIMATION_DURATION, TEXTURE_KEYS } from '../config/constants';
import { DARK_GOTHIC_THEME } from '../config/theme';
import { WeaponConfig, WeaponRarity } from '../config/types';
import { TierBadge } from './TierBadge';
import { getTierColor } from '../utils/ThemeUtils';

/**
 * Weapon card configuration interface
 */
export interface WeaponCardConfig {
  weapon: WeaponConfig;
  tier: number;
  locked: boolean;
  equipped: boolean;
  onClick?: () => void;
  onEquip?: () => void;
  onDetails?: () => void;
}

/**
 * Rarity color mapping with theme
 */
const RARITY_COLORS: Record<WeaponRarity, number> = {
  common: 0x9d9d9d,
  uncommon: 0x1eff00,
  rare: 0x0070dd,
  epic: 0xa335ee,
  legendary: 0xff8000,
};

/**
 * Weapon card component for inventory display
 */
export class WeaponCard extends Phaser.GameObjects.Container {
  // UI elements
  private background: Phaser.GameObjects.Rectangle;
  private border: Phaser.GameObjects.Rectangle;
  private icon: Phaser.GameObjects.Image;
  private weaponName: Phaser.GameObjects.Text;
  private tierBadge: TierBadge;
  private lockIcon: Phaser.GameObjects.Image;
  private equipIndicator: Phaser.GameObjects.Text;
  private effectivenessIcons: Phaser.GameObjects.Image[] = [];

  // Card state
  private weapon: WeaponConfig;
  private tier: number;
  private isLocked: boolean;
  private isEquipped: boolean;
  private cardWidth: number;
  private cardHeight: number;

  // Callbacks
  private onClickCallback: (() => void) | null = null;
  private onEquipCallback: (() => void) | null = null;
  private onDetailsCallback: (() => void) | null = null;

  /**
   * Create a new weapon card
   * @param scene - The scene this card belongs to
   * @param x - X position
   * @param y - Y position
   * @param width - Card width
   * @param height - Card height
   * @param config - Weapon card configuration
   */
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    config: WeaponCardConfig
  ) {
    super(scene, x, y);

    this.cardWidth = width;
    this.cardHeight = height;
    this.weapon = config.weapon;
    this.tier = config.tier;
    this.isLocked = config.locked;
    this.isEquipped = config.equipped;
    this.onClickCallback = config.onClick || null;
    this.onEquipCallback = config.onEquip || null;
    this.onDetailsCallback = config.onDetails || null;

    // Create background with theme
    this.background = scene.add.rectangle(0, 0, width, height, DARK_GOTHIC_THEME.colors.background);
    this.background.setAlpha(0.9);
    this.add(this.background);

    // Create rarity-colored border with theme
    this.border = scene.add.rectangle(0, 0, width, height);
    this.border.setStrokeStyle(4, RARITY_COLORS[this.weapon.rarity]);
    this.border.setFillStyle(0x000000, 0);
    this.add(this.border);

    // Create weapon icon
    this.icon = scene.add.image(0, -height / 2 + 60, this.getWeaponTextureKey(this.weapon.id));
    this.icon.setScale(0.6);
    this.icon.setDepth(1);
    this.add(this.icon);

    // Create weapon name with theme typography
    this.weaponName = scene.add.text(0, -height / 2 + 110, this.weapon.name, {
      fontFamily: DARK_GOTHIC_THEME.fonts.primary,
      fontSize: `${FONT_SIZES.medium}px`,
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    this.weaponName.setOrigin(0.5);
    this.weaponName.setWordWrapWidth(width - 20);
    this.add(this.weaponName);

    // Create tier badge
    this.tierBadge = new TierBadge(scene, 0, -height / 2 + 140, this.tier, this.weapon.rarity);
    this.add(this.tierBadge);

    // Create lock icon
    this.lockIcon = scene.add.image(0, 0, TEXTURE_KEYS.lockIcon);
    this.lockIcon.setScale(0.5);
    this.lockIcon.setVisible(false);
    this.lockIcon.setDepth(2);
    this.add(this.lockIcon);

    // Create equip indicator with theme color
    this.equipIndicator = scene.add.text(0, height / 2 - 30, 'EQUIPPED', {
      fontFamily: DARK_GOTHIC_THEME.fonts.primary,
      fontSize: `${FONT_SIZES.small}px`,
      color: '#' + DARK_GOTHIC_THEME.colors.success.toString(16).padStart(6, '0'),
      fontStyle: 'bold',
    });
    this.equipIndicator.setOrigin(0.5);
    this.equipIndicator.setVisible(false);
    this.add(this.equipIndicator);

    // Create effectiveness icons
    this.createEffectivenessIcons();

    // Apply initial state
    this.updateAppearance();

    // Setup interaction
    this.setupInteraction();

    // Add to scene
    scene.add.existing(this);
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
   * Create effectiveness icons for weapon
   */
  private createEffectivenessIcons(): void {
    if (!this.weapon.effectiveAgainst) return;

    // Create a simple icon to show effectiveness
    const icon = this.scene.add.image(0, this.cardHeight / 2 - 60, TEXTURE_KEYS.starFull);
    icon.setScale(0.3);
    icon.setTint(DARK_GOTHIC_THEME.colors.success);
    this.effectivenessIcons.push(icon);
    this.add(icon);
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
   * Handle hover event with theme animation
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

    this.border.setStrokeStyle(5, RARITY_COLORS[this.weapon.rarity]);
  }

  /**
   * Handle hover end event with theme animation
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

    this.border.setStrokeStyle(4, RARITY_COLORS[this.weapon.rarity]);
  }

  /**
   * Handle click event
   */
  private onClick(): void {
    if (this.isLocked) return;

    // Trigger click callback
    if (this.onClickCallback) {
      this.onClickCallback();
    }
  }

  /**
   * Update card appearance based on state
   */
  private updateAppearance(): void {
    // Update lock icon visibility
    this.lockIcon.setVisible(this.isLocked);

    // Update equip indicator
    this.equipIndicator.setVisible(this.isEquipped);

    // Update border and background colors with theme
    if (this.isLocked) {
      this.border.setStrokeStyle(3, DARK_GOTHIC_THEME.colors.disabled);
      this.background.setFillStyle(DARK_GOTHIC_THEME.colors.background);
      this.weaponName.setColor('#666666');
      this.icon.setAlpha(0.3);
    } else {
      this.border.setStrokeStyle(4, RARITY_COLORS[this.weapon.rarity]);
      this.background.setFillStyle(DARK_GOTHIC_THEME.colors.background);
      this.weaponName.setColor('#FFFFFF');
      this.icon.setAlpha(1);
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
   * Set equipped state
   * @param equipped - Whether weapon is equipped
   */
  public setEquipped(equipped: boolean): void {
    this.isEquipped = equipped;
    this.updateAppearance();
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
   * Update weapon data
   * @param weapon - New weapon configuration
   */
  public updateWeapon(weapon: WeaponConfig): void {
    this.weapon = weapon;
    this.weaponName.setText(weapon.name);
    this.icon.setTexture(this.getWeaponTextureKey(weapon.id));
    this.border.setStrokeStyle(4, RARITY_COLORS[weapon.rarity]);
    this.updateAppearance();
  }

  /**
   * Get current locked state
   */
  public getLocked(): boolean {
    return this.isLocked;
  }

  /**
   * Get current equipped state
   */
  public getEquipped(): boolean {
    return this.isEquipped;
  }

  /**
   * Get weapon configuration
   */
  public getWeapon(): WeaponConfig {
    return this.weapon;
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
