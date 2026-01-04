/**
 * WeaponDetailsModal Component
 *
 * A comprehensive weapon information display modal.
 * Features stats, effectiveness, upgrade path, special effects,
 * modal overlay with backdrop, close button, and animated open/close.
 */

import Phaser from 'phaser';
import { COLORS, FONT_SIZES, UI_ANIMATION_DURATION } from '../config/constants';
import type { WeaponConfig} from '../config/types';
import { WeaponRarity } from '../config/types';
import { WeaponPreview } from './WeaponPreview';
import { StatBar } from './StatBar';
import type { EffectivenessData } from './EffectivenessChart';
import { EffectivenessChart } from './EffectivenessChart';
import { EffectCard } from './EffectCard';
import { TierBadge } from './TierBadge';

/**
 * Weapon details modal configuration interface
 */
export interface WeaponDetailsModalConfig {
  weapon: WeaponConfig;
  tier: number;
  maxTier: number;
  onEquip?: () => void;
  onUpgrade?: () => void;
  onClose?: () => void;
}

/**
 * Weapon details modal component for comprehensive weapon information
 */
export class WeaponDetailsModal extends Phaser.GameObjects.Container {
  // UI elements
  private backdrop: Phaser.GameObjects.Rectangle;
  private background: Phaser.GameObjects.Rectangle;
  private closeButton: Phaser.GameObjects.Container | null = null;
  private equipButton: Phaser.GameObjects.Container | null = null;
  private upgradeButton: Phaser.GameObjects.Container | null = null;
  private weaponPreview: WeaponPreview | null = null;
  private statBars: StatBar[] = [];
  private effectivenessChart: EffectivenessChart | null = null;
  private effectCards: EffectCard[] = [];
  private upgradePath: Phaser.GameObjects.Container | null = null;

  // Modal state
  private weapon: WeaponConfig;
  private tier: number;
  private maxTier: number;
  private modalWidth: number;
  private modalHeight: number;
  private isOpen: boolean;

  // Callbacks
  private onEquipCallback: (() => void) | null = null;
  private onUpgradeCallback: (() => void) | null = null;
  private onCloseCallback: (() => void) | null = null;

  /**
   * Create a new weapon details modal
   * @param scene - The scene this modal belongs to
   * @param x - X position
   * @param y - Y position
   * @param config - Weapon details modal configuration
   */
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: WeaponDetailsModalConfig,
  ) {
    super(scene, x, y);

    this.weapon = config.weapon;
    this.tier = config.tier;
    this.maxTier = config.maxTier;
    this.modalWidth = 800;
    this.modalHeight = 600;
    this.isOpen = false;
    this.onEquipCallback = config.onEquip || null;
    this.onUpgradeCallback = config.onUpgrade || null;
    this.onCloseCallback = config.onClose || null;

    // Create backdrop
    this.backdrop = scene.add.rectangle(0, 0, scene.scale.width, scene.scale.height, 0x000000);
    this.backdrop.setAlpha(0);
    this.backdrop.setInteractive({ useHandCursor: true });
    this.backdrop.on('pointerdown', this.onBackdropClick.bind(this));
    this.add(this.backdrop);

    // Create background
    this.background = scene.add.rectangle(0, 0, this.modalWidth, this.modalHeight, 0x1a1a2e);
    this.background.setStrokeStyle(3, COLORS.accent);
    this.add(this.background);

    // Create title
    const title = scene.add.text(0, -this.modalHeight / 2 + 30, 'WEAPON DETAILS', {
      fontSize: `${FONT_SIZES.large}px`,
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    this.add(title);

    // Create close button
    this.createCloseButton();

    // Create weapon preview
    this.createWeaponPreview();

    // Create stats section
    this.createStatsSection();

    // Create effectiveness chart
    this.createEffectivenessChart();

    // Create upgrade path
    this.createUpgradePath();

    // Create special effects
    this.createSpecialEffects();

    // Create action buttons
    this.createActionButtons();

    // Add to scene
    scene.add.existing(this);
  }

  /**
   * Create close button
   */
  private createCloseButton(): void {
    this.closeButton = this.scene.add.container(this.modalWidth / 2 - 30, -this.modalHeight / 2 + 30);

    const closeBg = this.scene.add.rectangle(0, 0, 40, 40, 0xff4444);
    closeBg.setStrokeStyle(2, 0x000000);
    closeBg.setInteractive({ useHandCursor: true });
    this.closeButton.add(closeBg);

    const closeText = this.scene.add.text(0, 0, 'X', {
      fontSize: '20px',
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    closeText.setOrigin(0.5);
    this.closeButton.add(closeText);

    closeBg.on('pointerdown', this.onCloseClick.bind(this));

    this.add(this.closeButton);
  }

  /**
   * Create weapon preview
   */
  private createWeaponPreview(): void {
    this.weaponPreview = new WeaponPreview(this.scene, -this.modalWidth / 2 + 100, -this.modalHeight / 2 + 120, {
      weapon: this.weapon,
      tier: this.tier,
      size: 'medium',
      showTrail: true,
    });
    this.add(this.weaponPreview);
  }

  /**
   * Create stats section
   */
  private createStatsSection(): void {
    const stats = [
      { label: 'Damage', value: this.getStatValue('damage'), max: 100 },
      { label: 'Speed', value: this.getStatValue('speed'), max: 100 },
      { label: 'Range', value: this.getStatValue('range'), max: 100 },
      { label: 'Effectiveness', value: this.getStatValue('effectiveness'), max: 100 },
    ];

    const startY = -this.modalHeight / 2 + 280;
    const statSpacing = 40;

    stats.forEach((stat, index) => {
      const y = startY + index * statSpacing;

      // Create stat label
      const label = this.scene.add.text(-this.modalWidth / 2 + 20, y, stat.label, {
        fontSize: '14px',
        color: '#CCCCCC',
      });
      label.setOrigin(0, 0.5);
      this.add(label);

      // Create stat bar
      const bar = new StatBar(this.scene, 0, y, {
        label: '',
        value: stat.value,
        maxValue: stat.max,
        width: 300,
        height: 20,
        showLabel: false,
        showValue: true,
      });
      this.add(bar);
      this.statBars.push(bar);
    });
  }

  /**
   * Get stat value
   */
  private getStatValue(stat: string): number {
    switch (stat) {
    case 'damage':
      return this.weapon.tiers[this.tier - 1]?.effects[0]?.value || 50;
    case 'speed':
      return this.weapon.id.includes('lightning') ? 90 : this.weapon.id.includes('fire') ? 70 : 60;
    case 'range':
      return this.weapon.id.includes('holy') ? 80 : 60;
    case 'effectiveness':
      return this.weapon.effectiveAgainst ? 80 : 40;
    default:
      return 50;
    }
  }

  /**
   * Create effectiveness chart
   */
  private createEffectivenessChart(): void {
    const data: EffectivenessData[] = [
      { monsterType: 'zombie' as any, effectiveness: this.weapon.effectiveAgainst === 'zombie' ? 80 : 40 },
      { monsterType: 'vampire' as any, effectiveness: this.weapon.effectiveAgainst === 'vampire' ? 80 : 40 },
      { monsterType: 'ghost' as any, effectiveness: this.weapon.effectiveAgainst === 'ghost' ? 80 : 40 },
    ];

    this.effectivenessChart = new EffectivenessChart(this.scene, this.modalWidth / 2 + 100, -this.modalHeight / 2 + 100, {
      data: data,
      chartType: 'bar',
      width: 350,
      height: 150,
      showLabels: true,
      showPercentages: true,
    });
    this.add(this.effectivenessChart);
  }

  /**
   * Create upgrade path
   */
  private createUpgradePath(): void {
    this.upgradePath = this.scene.add.container(this.modalWidth / 2 + 100, -this.modalHeight / 2 + 100);

    const title = this.scene.add.text(0, -50, 'UPGRADE PATH', {
      fontSize: '16px',
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    this.upgradePath.add(title);

    // Create tier indicators
    for (let i = 1; i <= this.maxTier; i++) {
      const x = -120 + (i - 1) * 80;
      const y = 0;

      const tierBg = this.scene.add.rectangle(x, y, 70, 70, i <= this.tier ? 0x2a2a4a : 0x1a1a2e);
      tierBg.setStrokeStyle(2, i <= this.tier ? COLORS.accent : 0x444444);
      this.upgradePath.add(tierBg);

      const tierBadge = new TierBadge(this.scene, x, y, i, this.weapon.rarity, 'small');
      this.upgradePath.add(tierBadge);

      // Add tier description
      const tierData = this.weapon.tiers[i - 1];
      if (tierData) {
        const desc = this.scene.add.text(x, y + 50, tierData.description, {
          fontSize: '10px',
          color: i <= this.tier ? '#CCCCCC' : '#666666',
        });
        desc.setOrigin(0.5);
        desc.setWordWrapWidth(60);
        this.upgradePath.add(desc);
      }
    }

    this.add(this.upgradePath);
  }

  /**
   * Create special effects
   */
  private createSpecialEffects(): void {
    const currentTierData = this.weapon.tiers[this.tier - 1];
    if (!currentTierData?.effects || currentTierData.effects.length === 0) {
      return;
    }

    const title = this.scene.add.text(0, -this.modalHeight / 2 + 100, 'SPECIAL EFFECTS', {
      fontSize: '16px',
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    this.add(title);

    // Create effect cards
    const startX = -this.modalWidth / 2 + 20;
    const cardSpacing = 10;

    currentTierData.effects.forEach((effect, index) => {
      const x = startX + index * (210 + cardSpacing);
      const y = -this.modalHeight / 2 + 130;

      const effectCard = new EffectCard(this.scene, x, y, {
        effect: effect,
        tier: this.tier,
        showTooltip: true,
      });
      this.effectCards.push(effectCard);
      this.add(effectCard);
    });
  }

  /**
   * Create action buttons
   */
  private createActionButtons(): void {
    const buttonY = this.modalHeight / 2 - 50;

    // Equip button
    this.equipButton = this.scene.add.container(-80, buttonY);

    const equipBg = this.scene.add.rectangle(0, 0, 150, 40, 0x4CAF50);
    equipBg.setStrokeStyle(2, 0x000000);
    equipBg.setInteractive({ useHandCursor: true });
    this.equipButton.add(equipBg);

    const equipText = this.scene.add.text(0, 0, 'EQUIP', {
      fontSize: '16px',
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    equipText.setOrigin(0.5);
    this.equipButton.add(equipText);

    equipBg.on('pointerdown', this.onEquipClick.bind(this));

    this.add(this.equipButton);

    // Upgrade button
    this.upgradeButton = this.scene.add.container(80, buttonY);

    const canUpgrade = this.tier < this.maxTier;
    const upgradeBg = this.scene.add.rectangle(0, 0, 150, 40, canUpgrade ? 0x2196F3 : 0x666666);
    upgradeBg.setStrokeStyle(2, 0x000000);
    if (canUpgrade) {
      upgradeBg.setInteractive({ useHandCursor: true });
    }
    this.upgradeButton.add(upgradeBg);

    const upgradeText = this.scene.add.text(0, 0, 'UPGRADE', {
      fontSize: '16px',
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    upgradeText.setOrigin(0.5);
    this.upgradeButton.add(upgradeText);

    if (canUpgrade) {
      upgradeBg.on('pointerdown', this.onUpgradeClick.bind(this));
    }

    this.add(this.upgradeButton);
  }

  /**
   * Handle backdrop click
   */
  private onBackdropClick(): void {
    this.close();
  }

  /**
   * Handle close button click
   */
  private onCloseClick(): void {
    this.close();
  }

  /**
   * Handle equip button click
   */
  private onEquipClick(): void {
    if (this.onEquipCallback) {
      this.onEquipCallback();
    }
  }

  /**
   * Handle upgrade button click
   */
  private onUpgradeClick(): void {
    if (this.onUpgradeCallback) {
      this.onUpgradeCallback();
    }
  }

  /**
   * Open modal with animation
   */
  public open(): void {
    if (this.isOpen) return;

    this.isOpen = true;
    this.backdrop.setAlpha(0.7);

    this.scene.tweens.add({
      targets: this.background,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: UI_ANIMATION_DURATION * 2,
      ease: 'Back.easeOut',
    });
  }

  /**
   * Close modal with animation
   */
  public close(): void {
    if (!this.isOpen) return;

    this.isOpen = false;

    this.scene.tweens.add({
      targets: this.background,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: UI_ANIMATION_DURATION,
      ease: 'Power2',
      onComplete: () => {
        this.backdrop.setAlpha(0);
      },
    });

    // Emit close event
    if (this.onCloseCallback) {
      this.onCloseCallback();
    }
  }

  /**
   * Update weapon data
   * @param weapon - New weapon configuration
   * @param tier - New tier level
   */
  public updateWeapon(weapon: WeaponConfig, tier: number): void {
    this.weapon = weapon;
    this.tier = tier;

    if (this.weaponPreview) {
      this.weaponPreview.updateWeapon(weapon);
      this.weaponPreview.setTier(tier);
    }

    // Update stats
    this.statBars.forEach((bar) => {
      this.remove(bar);
      bar.destroy();
    });
    this.statBars = [];
    this.createStatsSection();

    // Update effectiveness chart
    if (this.effectivenessChart) {
      const data: EffectivenessData[] = [
        { monsterType: 'zombie' as any, effectiveness: weapon.effectiveAgainst === 'zombie' ? 80 : 40 },
        { monsterType: 'vampire' as any, effectiveness: weapon.effectiveAgainst === 'vampire' ? 80 : 40 },
        { monsterType: 'ghost' as any, effectiveness: weapon.effectiveAgainst === 'ghost' ? 80 : 40 },
      ];
      this.effectivenessChart.updateData(data);
    }

    // Update upgrade path
    if (this.upgradePath) {
      this.remove(this.upgradePath);
      this.upgradePath.destroy();
      this.upgradePath = null;
      this.createUpgradePath();
    }

    // Update special effects
    this.effectCards.forEach((card) => {
      this.remove(card);
      card.destroy();
    });
    this.effectCards = [];
    this.createSpecialEffects();

    // Update upgrade button
    const canUpgrade = tier < this.maxTier;
    if (!this.upgradeButton) {
      return;
    }
    const upgradeBg = (this.upgradeButton.getAt(1) as Phaser.GameObjects.Rectangle);
    if (!upgradeBg) {
      return;
    }
    upgradeBg.setFillStyle(canUpgrade ? 0x2196F3 : 0x666666);
    if (canUpgrade) {
      upgradeBg.setInteractive({ useHandCursor: true });
    } else {
      upgradeBg.disableInteractive();
    }
  }

  /**
   * Get current weapon configuration
   */
  public getWeapon(): WeaponConfig {
    return this.weapon;
  }

  /**
   * Get current tier level
   */
  public getTier(): number {
    return this.tier;
  }

  /**
   * Check if modal is open
   */
  public getIsOpen(): boolean {
    return this.isOpen;
  }

  /**
   * Clean up modal resources
   */
  public destroy(): void {
    if (this.backdrop) {
      this.backdrop.off('pointerdown', this.onBackdropClick.bind(this));
    }

    this.statBars.forEach((bar) => {
      bar.destroy();
    });

    if (this.effectivenessChart) {
      this.effectivenessChart.destroy();
    }

    this.effectCards.forEach((card) => {
      card.destroy();
    });

    if (this.upgradePath) {
      this.upgradePath.destroy();
    }

    super.destroy();
  }
}
