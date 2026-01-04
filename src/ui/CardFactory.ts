/**
 * Card Factory
 * 
 * Provides factory methods for creating various types of cards
 * used across inventory, shop, and other UI scenes.
 */

import type Phaser from 'phaser';
import { COLORS, FONT_SIZES, TEXTURE_KEYS } from '../config/constants';
import { Button, ButtonStyle } from './Button';
import type { WeaponConfig, UpgradeConfig, WeaponRarity } from '../config/types';
import { formatNumber } from '../utils/helpers';
import { ProgressBar } from './ProgressBar';

/**
 * Common card configuration
 */
export interface CardConfig {
  /** Card width */
  width: number;
  /** Card height */
  height: number;
  /** Background color */
  backgroundColor?: number;
  /** Border color */
  borderColor?: number;
  /** Border thickness */
  borderThickness?: number;
}

/**
 * Weapon card configuration
 */
export interface WeaponCardConfig extends CardConfig {
  /** Weapon configuration */
  weapon: WeaponConfig;
  /** Current tier level (1-indexed) */
  tier: number;
  /** Whether weapon is unlocked */
  isUnlocked: boolean;
  /** Whether weapon is equipped */
  isEquipped: boolean;
  /** Click callback */
  onClick: () => void;
  /** Equip callback */
  onEquip?: () => void;
  /** Details callback */
  onDetails?: () => void;
}

/**
 * Upgrade card configuration
 */
export interface UpgradeCardConfig extends CardConfig {
  /** Upgrade configuration */
  upgrade: UpgradeConfig;
  /** Current tier level (0-indexed) */
  tier: number;
  /** Click callback */
  onClick: () => void;
}

/**
 * Card Factory Class
 * Provides static methods for creating various card types
 */
export class CardFactory {
  /**
   * Create a weapon card for inventory display
   * @param scene - The scene to create the card in
   * @param x - X position
   * @param y - Y position
   * @param config - Weapon card configuration
   * @returns Container with the card elements
   */
  static createWeaponCard(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: WeaponCardConfig,
  ): Phaser.GameObjects.Container {
    const {
      width,
      height,
      weapon,
      tier,
      isUnlocked,
      isEquipped,
      onClick,
      onEquip,
      onDetails,
    } = config;

    const container = scene.add.container(x, y);

    // Background
    const background = scene.add.rectangle(0, 0, width, height, COLORS.background);
    background.setStrokeStyle(2, isEquipped ? COLORS.success : COLORS.accent);
    background.setAlpha(0.9);
    container.add(background);

    // Weapon icon (use texture or emoji)
    const iconKey = this.getWeaponIconKey(weapon.id);
    const icon = scene.add.image(-width / 2 + 50, 0, iconKey);
    icon.setScale(0.6);
    container.add(icon);

    // Weapon name
    const name = scene.add.text(-width / 2 + 100, -20, weapon.name, {
      fontSize: `${FONT_SIZES.medium}px`,
      color: isUnlocked ? '#FFFFFF' : '#666666',
      fontStyle: 'bold',
    });
    name.setOrigin(0, 0.5);
    container.add(name);

    // Tier display
    const tierText = isUnlocked
      ? `Tier ${tier}/${weapon.tiers.length}`
      : 'LOCKED';
    const tierColor = isUnlocked ? '#CCCCCC' : '#666666';
    const tierDisplay = scene.add.text(-width / 2 + 100, 15, tierText, {
      fontSize: `${FONT_SIZES.small}px`,
      color: tierColor,
    });
    tierDisplay.setOrigin(0, 0.5);
    container.add(tierDisplay);

    // Rarity indicator
    const rarityColor = this.getRarityColor(weapon.rarity);
    const rarityBar = scene.add.rectangle(-width / 2 + 100, 35, 80, 4, rarityColor);
    container.add(rarityBar);

    // Action button
    let buttonText: string;
    let buttonStyle: ButtonStyle;

    if (!isUnlocked) {
      buttonText = `BUY ${formatNumber(weapon.unlockCost)} 💀`;
      buttonStyle = ButtonStyle.PRIMARY;
    } else if (isEquipped) {
      buttonText = 'EQUIPPED';
      buttonStyle = ButtonStyle.DISABLED;
    } else {
      buttonText = 'EQUIP';
      buttonStyle = ButtonStyle.SECONDARY;
    }

    const button = new Button(
      scene,
      width / 2 - 80,
      0,
      140,
      35,
      buttonText,
      {
        style: buttonStyle,
        fontSize: FONT_SIZES.small,
        onClick: isUnlocked && !isEquipped ? onEquip || onClick : onClick,
      },
    );
    container.add(button);

    // Set up interactivity
    if (isUnlocked) {
      container.setSize(width, height);
      container.setInteractive({ useHandCursor: true });

      container.on('pointerover', () => {
        background.setStrokeStyle(2, COLORS.warning);
        scene.input.setDefaultCursor('pointer');
      });

      container.on('pointerout', () => {
        background.setStrokeStyle(2, isEquipped ? COLORS.success : COLORS.accent);
        scene.input.setDefaultCursor('default');
      });

      container.on('pointerdown', onClick);
    }

    // Store config for updates
    (container as any).weaponConfig = config;

    return container;
  }

  /**
   * Create an upgrade card for shop display
   * @param scene - The scene to create the card in
   * @param x - X position
   * @param y - Y position
   * @param config - Upgrade card configuration
   * @returns Container with the card elements
   */
  static createUpgradeCard(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: UpgradeCardConfig,
  ): Phaser.GameObjects.Container {
    const { width, height, upgrade, tier, onClick } = config;
    const isMaxTier = tier >= upgrade.maxTier;

    const container = scene.add.container(x, y);

    // Background
    const background = scene.add.rectangle(0, 0, width, height, COLORS.background);
    background.setStrokeStyle(2, COLORS.accent);
    background.setAlpha(0.9);
    container.add(background);

    // Upgrade icon
    const icon = scene.add.image(-width / 2 + 50, 0, upgrade.icon);
    icon.setScale(0.6);
    container.add(icon);

    // Upgrade name
    const name = scene.add.text(-width / 2 + 100, -20, upgrade.name, {
      fontSize: `${FONT_SIZES.medium}px`,
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    name.setOrigin(0, 0.5);
    container.add(name);

    // Tier display
    const tierText = `Tier ${tier}/${upgrade.maxTier}`;
    const tierDisplay = scene.add.text(-width / 2 + 100, 5, tierText, {
      fontSize: `${FONT_SIZES.small}px`,
      color: '#CCCCCC',
    });
    tierDisplay.setOrigin(0, 0.5);
    container.add(tierDisplay);

    // Progress bar
    const progressBar = new ProgressBar(
      scene,
      -width / 2 + 100,
      25,
      100,
      8,
      upgrade.maxTier,
      tier,
    );
    progressBar.setColor(COLORS.success);
    container.add(progressBar);

    // Description
    const description = scene.add.text(
      -width / 2 + 100,
      45,
      tier < upgrade.maxTier ? upgrade.tiers[tier]?.description || '' : 'MAX LEVEL',
      {
        fontSize: '12px',
        color: '#888888',
      },
    );
    description.setOrigin(0, 0);
    description.setWordWrapWidth(100);
    container.add(description);

    // Action button
    let buttonText: string;
    let buttonStyle: ButtonStyle;

    if (isMaxTier) {
      buttonText = 'MAX TIER';
      buttonStyle = ButtonStyle.DISABLED;
    } else {
      const tierConfig = upgrade.tiers[tier];
      const cost = tierConfig?.cost || 0;
      buttonText = `UPGRADE ${formatNumber(cost)} 💀`;
      buttonStyle = ButtonStyle.PRIMARY;
    }

    const button = new Button(
      scene,
      width / 2 - 80,
      0,
      140,
      35,
      buttonText,
      {
        style: buttonStyle,
        fontSize: FONT_SIZES.small,
        disabled: isMaxTier,
        onClick: onClick,
      },
    );
    container.add(button);

    // Set up interactivity
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      background.setStrokeStyle(2, COLORS.warning);
      scene.input.setDefaultCursor('pointer');
    });

    container.on('pointerout', () => {
      background.setStrokeStyle(2, COLORS.accent);
      scene.input.setDefaultCursor('default');
    });

    container.on('pointerdown', onClick);

    return container;
  }

  /**
   * Create a generic item card
   * @param scene - The scene to create the card in
   * @param x - X position
   * @param y - Y position
   * @param config - Card configuration with title, description, and icon
   * @returns Container with the card elements
   */
  static createGenericCard(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: {
      width: number;
      height: number;
      title: string;
      description: string;
      icon: string;
      backgroundColor?: number;
      borderColor?: number;
      onClick?: () => void;
    },
  ): Phaser.GameObjects.Container {
    const { width, height, title, description, icon, backgroundColor, borderColor, onClick } = config;

    const container = scene.add.container(x, y);

    // Background
    const background = scene.add.rectangle(0, 0, width, height, backgroundColor || COLORS.background);
    background.setStrokeStyle(2, borderColor || COLORS.accent);
    background.setAlpha(0.9);
    container.add(background);

    // Icon
    const iconText = scene.add.text(0, -height / 4, icon, {
      fontSize: '40px',
      align: 'center',
    });
    iconText.setOrigin(0.5);
    container.add(iconText);

    // Title
    const titleText = scene.add.text(0, 0, title, {
      fontSize: `${FONT_SIZES.medium}px`,
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    titleText.setOrigin(0.5);
    container.add(titleText);

    // Description
    const descText = scene.add.text(0, height / 4, description, {
      fontSize: '14px',
      color: '#CCCCCC',
      align: 'center',
    });
    descText.setOrigin(0.5);
    descText.setWordWrapWidth(width - 40);
    container.add(descText);

    // Set up interactivity if callback provided
    if (onClick) {
      container.setSize(width, height);
      container.setInteractive({ useHandCursor: true });

      container.on('pointerover', () => {
        background.setStrokeStyle(2, COLORS.warning);
        scene.input.setDefaultCursor('pointer');
      });

      container.on('pointerout', () => {
        background.setStrokeStyle(2, borderColor || COLORS.accent);
        scene.input.setDefaultCursor('default');
      });

      container.on('pointerdown', onClick);
    }

    return container;
  }

  /**
   * Get weapon icon key from weapon ID
   */
  private static getWeaponIconKey(weaponId: string): string {
    const iconMap: Record<string, string> = {
      basic_sword: TEXTURE_KEYS.basicSword,
      silver_blade: TEXTURE_KEYS.silverBlade,
      holy_cross_blade: TEXTURE_KEYS.holyCrossBlade,
      fire_sword: TEXTURE_KEYS.fireSword,
      ice_blade: TEXTURE_KEYS.iceBlade,
      lightning_katana: TEXTURE_KEYS.lightningKatana,
    };
    return iconMap[weaponId] || TEXTURE_KEYS.basicSword;
  }

  /**
   * Get color for rarity
   */
  private static getRarityColor(rarity: WeaponRarity): number {
    const colors: Record<WeaponRarity, number> = {
      common: 0x808080,
      uncommon: 0x4CAF50,
      rare: 0x2196F3,
      epic: 0x9C27B0,
      legendary: 0xFFD700,
    };
    return colors[rarity] || 0x808080;
  }

  /**
   * Create a grid of cards
   * @param scene - The scene to create cards in
   * @param cards - Array of card data and callbacks
   * @param startX - Starting X position
   * @param startY - Starting Y position
   * @param cardWidth - Width of each card
   * @param cardHeight - Height of each card
   * @param spacing - Spacing between cards
   * @param columns - Number of columns
   * @returns Array of created card containers
   */
  static createCardGrid<T>(
    scene: Phaser.Scene,
    cards: Array<{ data: T; x: number; y: number }>,
    cardWidth: number,
    cardHeight: number,
    spacing: number = 20,
  ): Phaser.GameObjects.Container[] {
    const containers: Phaser.GameObjects.Container[] = [];

    cards.forEach((card, index) => {
      const container = scene.add.container(card.x, card.y);
      containers.push(container);
    });

    return containers;
  }

  /**
   * Animate cards in with stagger effect
   * @param scene - The scene to animate in
   * @param cards - Array of card containers to animate
   * @param baseDelay - Base delay before animation starts
   * @param staggerDelay - Delay between each card
   */
  static animateCardsIn(
    scene: Phaser.Scene,
    cards: Phaser.GameObjects.Container[],
    baseDelay: number = 0,
    staggerDelay: number = 100,
  ): void {
    cards.forEach((card, index) => {
      card.setAlpha(0);
      card.setScale(0.8);

      scene.tweens.add({
        targets: card,
        alpha: 1,
        scale: 1,
        duration: 300,
        delay: baseDelay + index * staggerDelay,
        ease: 'Power2',
      });
    });
  }
}
