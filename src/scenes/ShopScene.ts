/**
 * Shop Scene
 * 
 * Displays weapons and upgrades for purchase.
 * Includes tab navigation and purchase confirmation.
 */

import Phaser from 'phaser';
import { SCENE_KEYS, TEXTURE_KEYS, COLORS, FONT_SIZES, UI_ANIMATION_DURATION } from '../config/constants';
import { Button, ButtonStyle } from '../ui/Button';
import { Card, CardConfig } from '../ui/Card';
import { Panel } from '../ui/Panel';
import { ProgressBar } from '../ui/ProgressBar';
import { SaveManager } from '../managers/SaveManager';
import { WeaponManager } from '../managers/WeaponManager';
import { UpgradeManager } from '../managers/UpgradeManager';
import { ShopManager } from '../managers/ShopManager';
import { AudioManager } from '../managers/AudioManager';
import { WeaponId, UpgradeId } from '../config/types';
import { formatNumber } from '../utils/helpers';

/**
 * Shop Scene
 */
export class ShopScene extends Phaser.Scene {
  // UI elements
  private title: Phaser.GameObjects.Text | null = null;
  private soulsDisplay: Phaser.GameObjects.Text | null = null;
  private tabsContainer: Phaser.GameObjects.Container | null = null;
  private weaponsTab: Button | null = null;
  private upgradesTab: Button | null = null;
  private weaponsContainer: Phaser.GameObjects.Container | null = null;
  private upgradesContainer: Phaser.GameObjects.Container | null = null;
  private backButton: Button | null = null;
  private background: Phaser.GameObjects.Rectangle | null = null;
  private confirmationPanel: Panel | null = null;

  // Managers
  private saveManager: SaveManager;
  private weaponManager: WeaponManager;
  private upgradeManager: UpgradeManager;
  private shopManager: ShopManager;
  private audioManager: AudioManager;

  // State
  private currentTab: 'weapons' | 'upgrades' = 'weapons';
  private pendingPurchase: { type: 'weapon' | 'upgrade'; id: string; cost: number } | null = null;

  constructor() {
    super({ key: SCENE_KEYS.shop });
    this.saveManager = new SaveManager();
    this.weaponManager = WeaponManager.getInstance();
    this.upgradeManager = UpgradeManager.getInstance();
    this.shopManager = ShopManager.getInstance();
    this.audioManager = new AudioManager(this);
  }

  /**
   * Create scene
   */
  public create(): void {
    // Create background
    this.createBackground();

    // Create title
    this.createTitle();

    // Create souls display
    this.createSoulsDisplay();

    // Create tabs
    this.createTabs();

    // Create weapons tab
    this.createWeaponsTab();

    // Create upgrades tab
    this.createUpgradesTab();

    // Create back button
    this.createBackButton();

    // Show weapons tab by default
    this.showWeaponsTab();

    // Animate elements in
    this.animateIn();
  }

  /**
   * Create background
   */
  private createBackground(): void {
    this.background = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width,
      this.cameras.main.height,
      COLORS.background
    );
  }

  /**
   * Create title
   */
  private createTitle(): void {
    this.title = this.add.text(
      this.cameras.main.width / 2,
      50,
      'SHOP',
      {
        fontSize: `${FONT_SIZES.title}px`,
        color: '#FFFFFF',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6,
      }
    );

    this.title.setOrigin(0.5);
    this.title.setAlpha(0);

    this.tweens.add({
      targets: this.title,
      alpha: 1,
      y: 60,
      duration: UI_ANIMATION_DURATION * 2,
      ease: 'Power2',
    });
  }

  /**
   * Create souls display
   */
  private createSoulsDisplay(): void {
    const saveData = this.saveManager.getSaveData();
    const souls = saveData?.souls || 0;

    this.soulsDisplay = this.add.text(
      this.cameras.main.width - 20,
      20,
      `💀 ${formatNumber(souls)}`,
      {
        fontSize: `${FONT_SIZES.large}px`,
        color: '#FFD700',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      }
    );

    this.soulsDisplay.setOrigin(1, 0);
    this.soulsDisplay.setAlpha(0);

    this.tweens.add({
      targets: this.soulsDisplay,
      alpha: 1,
      duration: UI_ANIMATION_DURATION * 2,
      delay: UI_ANIMATION_DURATION,
      ease: 'Power2',
    });
  }

  /**
   * Create tab navigation
   */
  private createTabs(): void {
    this.tabsContainer = this.add.container(
      this.cameras.main.width / 2,
      130
    );

    const tabWidth = 200;
    const tabSpacing = 20;

    this.weaponsTab = new Button(
      this,
      -tabSpacing / 2,
      0,
      tabWidth,
      50,
      'WEAPONS',
      {
        style: ButtonStyle.PRIMARY,
        fontSize: FONT_SIZES.medium,
        onClick: () => this.onTabChange('weapons'),
      }
    );

    this.upgradesTab = new Button(
      this,
      tabSpacing / 2,
      0,
      tabWidth,
      50,
      'UPGRADES',
      {
        style: ButtonStyle.SECONDARY,
        fontSize: FONT_SIZES.medium,
        onClick: () => this.onTabChange('upgrades'),
      }
    );

    this.tabsContainer.add(this.weaponsTab);
    this.tabsContainer.add(this.upgradesTab);
    this.tabsContainer.setAlpha(0);

    this.tweens.add({
      targets: this.tabsContainer,
      alpha: 1,
      duration: UI_ANIMATION_DURATION * 2,
      delay: UI_ANIMATION_DURATION * 2,
      ease: 'Power2',
    });
  }

  /**
   * Create weapons tab
   */
  private createWeaponsTab(): void {
    this.weaponsContainer = this.add.container(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + 50
    );

    const weapons = this.weaponManager.getAllWeapons();
    const saveData = this.saveManager.getSaveData();

    weapons.forEach((weapon, index) => {
      const isUnlocked = saveData.unlockedWeapons.includes(weapon.id);
      const weaponTier = saveData.weaponTiers[weapon.id] || 1;
      const isMaxTier = weaponTier >= weapon.tiers.length;

      const card = this.createWeaponCard(weapon.id as any, index, isUnlocked, weaponTier, isMaxTier);
      if (this.weaponsContainer) {
        this.weaponsContainer.add(card);
      }
    });

    this.weaponsContainer.setVisible(false);
  }

  /**
   * Create a weapon purchase card
   */
  private createWeaponCard(
    weaponId: WeaponId,
    index: number,
    isUnlocked: boolean,
    weaponTier: number,
    isMaxTier: boolean
  ): Phaser.GameObjects.Container {
    const weapon = this.weaponManager.getWeaponConfig(weaponId);
    if (!weapon) {
      throw new Error(`Weapon not found: ${weaponId}`);
    }

    const cardWidth = 350;
    const cardHeight = 120;
    const cardSpacing = 15;
    const startY = -((6 * (cardHeight + cardSpacing)) / 2) + cardHeight / 2;
    const y = startY + index * (cardHeight + cardSpacing);

    const container = this.add.container(0, y);

    // Background
    const background = this.add.rectangle(0, 0, cardWidth, cardHeight, 0x2a2a4a);
    background.setStrokeStyle(2, COLORS.accent);
    background.setAlpha(0.9);
    container.add(background);

    // Icon
    const iconKey = this.getWeaponIconKey(weaponId);
    const icon = this.add.image(-cardWidth / 2 + 50, 0, iconKey);
    icon.setScale(0.6);
    container.add(icon);

    // Name
    const name = this.add.text(-cardWidth / 2 + 100, -30, weapon.name, {
      fontSize: `${FONT_SIZES.medium}px`,
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    name.setOrigin(0, 0.5);
    container.add(name);

    // Tier
    const tier = this.add.text(-cardWidth / 2 + 100, 0, `Tier ${weaponTier}`, {
      fontSize: `${FONT_SIZES.small}px`,
      color: '#CCCCCC',
    });
    tier.setOrigin(0, 0.5);
    container.add(tier);

    // Price/Action button
    let buttonText = '';
    let buttonStyle = ButtonStyle.PRIMARY;
    let cost = 0;

    if (!isUnlocked) {
      cost = weapon.unlockCost;
      buttonText = `BUY ${formatNumber(cost)} 💀`;
      buttonStyle = ButtonStyle.PRIMARY;
    } else if (!isMaxTier) {
      const tierConfig = weapon.tiers[weaponTier - 1];
      cost = tierConfig?.upgradeCost || 0;
      buttonText = `UPGRADE ${formatNumber(cost)} 💀`;
      buttonStyle = ButtonStyle.SECONDARY;
    } else {
      buttonText = 'MAX TIER';
      buttonStyle = ButtonStyle.DISABLED;
    }

    const button = new Button(
      this,
      cardWidth / 2 - 80,
      0,
      140,
      40,
      buttonText,
      {
        style: buttonStyle,
        fontSize: FONT_SIZES.small,
        disabled: isMaxTier,
        onClick: () => this.onPurchaseWeapon(weaponId, isUnlocked, cost),
      }
    );

    container.add(button);

    return container;
  }

  /**
   * Create upgrades tab
   */
  private createUpgradesTab(): void {
    this.upgradesContainer = this.add.container(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + 50
    );

    const upgrades = this.upgradeManager.getAllUpgrades();
    const saveData = this.saveManager.getSaveData();

    upgrades.forEach((upgrade, index) => {
      const upgradeTier = saveData.upgrades[upgrade.id] || 0;
      const isMaxTier = upgradeTier >= upgrade.maxTier;

      const card = this.createUpgradeCard(upgrade.id as any, index, upgradeTier, isMaxTier);
      if (this.upgradesContainer) {
        this.upgradesContainer.add(card);
      }
    });

    this.upgradesContainer.setVisible(false);
  }

  /**
   * Create an upgrade purchase card
   */
  private createUpgradeCard(
    upgradeId: UpgradeId,
    index: number,
    upgradeTier: number,
    isMaxTier: boolean
  ): Phaser.GameObjects.Container {
    const upgrade = this.upgradeManager.getUpgradeConfig(upgradeId);
    if (!upgrade) {
      throw new Error(`Upgrade not found: ${upgradeId}`);
    }

    const cardWidth = 350;
    const cardHeight = 120;
    const cardSpacing = 15;
    const startY = -((5 * (cardHeight + cardSpacing)) / 2) + cardHeight / 2;
    const y = startY + index * (cardHeight + cardSpacing);

    const container = this.add.container(0, y);

    // Background
    const background = this.add.rectangle(0, 0, cardWidth, cardHeight, 0x2a2a4a);
    background.setStrokeStyle(2, COLORS.accent);
    background.setAlpha(0.9);
    container.add(background);

    // Icon
    const icon = this.add.image(-cardWidth / 2 + 50, 0, upgrade.icon);
    icon.setScale(0.6);
    container.add(icon);

    // Name
    const name = this.add.text(-cardWidth / 2 + 100, -30, upgrade.name, {
      fontSize: `${FONT_SIZES.medium}px`,
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    name.setOrigin(0, 0.5);
    container.add(name);

    // Tier
    const tier = this.add.text(-cardWidth / 2 + 100, 0, `Tier ${upgradeTier}/${upgrade.maxTier}`, {
      fontSize: `${FONT_SIZES.small}px`,
      color: '#CCCCCC',
    });
    tier.setOrigin(0, 0.5);
    container.add(tier);

    // Progress bar
    const progressBar = new ProgressBar(
      this,
      -cardWidth / 2 + 100,
      25,
      150,
      10,
      upgrade.maxTier,
      upgradeTier
    );
    progressBar.setColor(COLORS.success);
    container.add(progressBar);

    // Price/Action button
    let buttonText = '';
    let buttonStyle = ButtonStyle.PRIMARY;
    let cost = 0;

    if (!isMaxTier) {
      const tierConfig = upgrade.tiers[upgradeTier];
      cost = tierConfig?.cost || 0;
      buttonText = `BUY ${formatNumber(cost)} 💀`;
      buttonStyle = ButtonStyle.PRIMARY;
    } else {
      buttonText = 'MAX TIER';
      buttonStyle = ButtonStyle.DISABLED;
    }

    const button = new Button(
      this,
      cardWidth / 2 - 80,
      0,
      140,
      40,
      buttonText,
      {
        style: buttonStyle,
        fontSize: FONT_SIZES.small,
        disabled: isMaxTier,
        onClick: () => this.onPurchaseUpgrade(upgradeId, cost),
      }
    );

    container.add(button);

    return container;
  }

  /**
   * Handle tab change
   */
  private onTabChange(tab: 'weapons' | 'upgrades'): void {
    this.audioManager.playSFX('uiClick');

    if (this.currentTab === tab) return;

    this.currentTab = tab;

    // Update tab button styles
    if (tab === 'weapons') {
      this.weaponsTab?.setStyle(ButtonStyle.PRIMARY);
      this.upgradesTab?.setStyle(ButtonStyle.SECONDARY);
      this.showWeaponsTab();
    } else {
      this.weaponsTab?.setStyle(ButtonStyle.SECONDARY);
      this.upgradesTab?.setStyle(ButtonStyle.PRIMARY);
      this.showUpgradesTab();
    }
  }

  /**
   * Show weapons tab
   */
  private showWeaponsTab(): void {
    this.weaponsContainer?.setVisible(true);
    this.upgradesContainer?.setVisible(false);
  }

  /**
   * Show upgrades tab
   */
  private showUpgradesTab(): void {
    this.weaponsContainer?.setVisible(false);
    this.upgradesContainer?.setVisible(true);
  }

  /**
   * Handle weapon purchase
   */
  private onPurchaseWeapon(weaponId: WeaponId, isUnlocked: boolean, cost: number): void {
    this.audioManager.playSFX('uiClick');

    const saveData = this.saveManager.getSaveData();
    if (saveData.souls < cost) {
      this.showInsufficientSoulsMessage();
      return;
    }

    this.pendingPurchase = { type: 'weapon', id: weaponId, cost };
    this.showConfirmation(
      isUnlocked ? 'Upgrade weapon?' : 'Purchase weapon?',
      () => this.confirmPurchase()
    );
  }

  /**
   * Handle upgrade purchase
   */
  private onPurchaseUpgrade(upgradeId: UpgradeId, cost: number): void {
    this.audioManager.playSFX('uiClick');

    const saveData = this.saveManager.getSaveData();
    if (saveData.souls < cost) {
      this.showInsufficientSoulsMessage();
      return;
    }

    this.pendingPurchase = { type: 'upgrade', id: upgradeId, cost };
    this.showConfirmation(
      'Purchase upgrade?',
      () => this.confirmPurchase()
    );
  }

  /**
   * Show confirmation popup
   */
  private showConfirmation(message: string, callback: () => void): void {
    if (this.confirmationPanel) {
      this.confirmationPanel.destroy();
    }

    this.confirmationPanel = new Panel(
      this,
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      400,
      200,
      'CONFIRM'
    );

    const messageText = this.add.text(0, -20, message, {
      fontSize: `${FONT_SIZES.medium}px`,
      color: '#FFFFFF',
    });
    messageText.setOrigin(0.5);
    this.confirmationPanel.setContent(messageText);

    const confirmButton = new Button(
      this,
      -60,
      40,
      100,
      40,
      'YES',
      {
        style: ButtonStyle.PRIMARY,
        fontSize: FONT_SIZES.small,
        onClick: callback,
      }
    );

    const cancelButton = new Button(
      this,
      60,
      40,
      100,
      40,
      'NO',
      {
        style: ButtonStyle.DANGER,
        fontSize: FONT_SIZES.small,
        onClick: () => this.closeConfirmation(),
      }
    );

    this.confirmationPanel.add(confirmButton);
    this.confirmationPanel.add(cancelButton);
    this.add.existing(this.confirmationPanel);
  }

  /**
   * Confirm purchase
   */
  private confirmPurchase(): void {
    if (!this.pendingPurchase) return;

    const { type, id, cost } = this.pendingPurchase;

    if (type === 'weapon') {
      const weapon = this.weaponManager.getWeaponConfig(id as any);
      if (weapon) {
        const isUnlocked = this.saveManager.getSaveData().unlockedWeapons.includes(id);
        if (isUnlocked) {
          this.weaponManager.upgradeWeapon(id as any);
        } else {
          this.saveManager.purchaseWeapon(id);
        }
      }
    } else if (type === 'upgrade') {
      this.upgradeManager.purchaseUpgrade(id as any);
    }

    this.closeConfirmation();
    this.updateSoulsDisplay();
    this.showSuccessMessage();

    // Refresh tabs
    this.weaponsContainer?.destroy();
    this.upgradesContainer?.destroy();
    this.createWeaponsTab();
    this.createUpgradesTab();

    if (this.currentTab === 'weapons') {
      this.showWeaponsTab();
    } else {
      this.showUpgradesTab();
    }

    this.pendingPurchase = null;
  }

  /**
   * Close confirmation popup
   */
  private closeConfirmation(): void {
    if (this.confirmationPanel) {
      this.confirmationPanel.destroy();
      this.confirmationPanel = null;
    }
    this.pendingPurchase = null;
  }

  /**
   * Show insufficient souls message
   */
  private showInsufficientSoulsMessage(): void {
    const message = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height - 100,
      'NOT ENOUGH SOULS!',
      {
        fontSize: `${FONT_SIZES.medium}px`,
        color: '#FF4444',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      }
    );

    message.setOrigin(0.5);
    message.setAlpha(0);

    this.tweens.add({
      targets: message,
      alpha: 1,
      duration: UI_ANIMATION_DURATION,
      yoyo: true,
      hold: 1500,
      onComplete: () => {
        message.destroy();
      },
    });
  }

  /**
   * Show success message
   */
  private showSuccessMessage(): void {
    const message = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height - 100,
      'PURCHASE SUCCESSFUL!',
      {
        fontSize: `${FONT_SIZES.medium}px`,
        color: '#44FF44',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      }
    );

    message.setOrigin(0.5);
    message.setAlpha(0);

    this.tweens.add({
      targets: message,
      alpha: 1,
      duration: UI_ANIMATION_DURATION,
      yoyo: true,
      hold: 1500,
      onComplete: () => {
        message.destroy();
      },
    });
  }

  /**
   * Update souls display
   */
  private updateSoulsDisplay(): void {
    const saveData = this.saveManager.getSaveData();
    const souls = saveData?.souls || 0;

    if (this.soulsDisplay) {
      this.soulsDisplay.setText(`💀 ${formatNumber(souls)}`);
    }
  }

  /**
   * Create back button
   */
  private createBackButton(): void {
    this.backButton = new Button(
      this,
      this.cameras.main.width / 2,
      this.cameras.main.height - 50,
      150,
      40,
      'BACK',
      {
        style: ButtonStyle.SECONDARY,
        fontSize: FONT_SIZES.small,
        onClick: this.onBack.bind(this),
      }
    );

    this.backButton.setAlpha(0);
    this.add.existing(this.backButton);

    // Animate in
    this.tweens.add({
      targets: this.backButton,
      alpha: 1,
      duration: UI_ANIMATION_DURATION * 2,
      delay: UI_ANIMATION_DURATION * 3,
      ease: 'Power2',
    });
  }

  /**
   * Animate elements in
   */
  private animateIn(): void {
    // Background fade in
    if (this.background) {
      this.background.setAlpha(0);
      this.tweens.add({
        targets: this.background,
        alpha: 1,
        duration: UI_ANIMATION_DURATION,
      });
    }
  }

  /**
   * Get weapon icon key
   */
  private getWeaponIconKey(weaponId: string): string {
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
   * Handle back button click
   */
  private onBack(): void {
    this.audioManager.playSFX('uiClick');
    this.scene.start(SCENE_KEYS.mainMenu);
  }
}
