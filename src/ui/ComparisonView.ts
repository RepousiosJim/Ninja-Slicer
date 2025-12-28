/**
 * ComparisonView Component
 *
 * A side-by-side weapon comparison modal component.
 * Features visual stat differences (green = better, red = worse),
 * two weapon previews, clear/close button, and animated entry.
 */

import Phaser from 'phaser';
import { COLORS, FONT_SIZES, UI_ANIMATION_DURATION } from '../config/constants';
import { WeaponConfig } from '../config/types';
import { WeaponPreview } from './WeaponPreview';
import { StatBar } from './StatBar';
import { EffectivenessChart, EffectivenessData } from './EffectivenessChart';

/**
 * Comparison view configuration interface
 */
export interface ComparisonViewConfig {
  weapon1: WeaponConfig;
  weapon1Tier: number;
  weapon2: WeaponConfig;
  weapon2Tier: number;
  onSwitch?: () => void;
  onClose?: () => void;
}

/**
 * Comparison view component for side-by-side weapon comparison
 */
export class ComparisonView extends Phaser.GameObjects.Container {
  // UI elements
  private background: Phaser.GameObjects.Rectangle;
  private backdrop: Phaser.GameObjects.Rectangle;
  private closeButton: Phaser.GameObjects.Container | null = null;
  private switchButton: Phaser.GameObjects.Container | null = null;
  private weapon1Preview: WeaponPreview | null = null;
  private weapon2Preview: WeaponPreview | null = null;
  private weapon1Stats: StatBar[] = [];
  private weapon2Stats: StatBar[] = [];
  private effectivenessChart1: EffectivenessChart | null = null;
  private effectivenessChart2: EffectivenessChart | null = null;

  // Comparison state
  private weapon1: WeaponConfig;
  private weapon1Tier: number;
  private weapon2: WeaponConfig;
  private weapon2Tier: number;
  private viewWidth: number;
  private viewHeight: number;

  // Callbacks
  private onSwitchCallback: (() => void) | null = null;
  private onCloseCallback: (() => void) | null = null;

  /**
   * Create a new comparison view
   * @param scene - The scene this view belongs to
   * @param x - X position
   * @param y - Y position
   * @param config - Comparison view configuration
   */
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: ComparisonViewConfig
  ) {
    super(scene, x, y);

    this.weapon1 = config.weapon1;
    this.weapon1Tier = config.weapon1Tier;
    this.weapon2 = config.weapon2;
    this.weapon2Tier = config.weapon2Tier;
    this.viewWidth = 900;
    this.viewHeight = 600;
    this.onSwitchCallback = config.onSwitch || null;
    this.onCloseCallback = config.onClose || null;

    // Create backdrop
    this.backdrop = scene.add.rectangle(0, 0, scene.scale.width, scene.scale.height, 0x000000);
    this.backdrop.setAlpha(0.7);
    this.backdrop.setInteractive({ useHandCursor: true });
    this.backdrop.on('pointerdown', this.onBackdropClick.bind(this));
    this.add(this.backdrop);

    // Create background
    this.background = scene.add.rectangle(0, 0, this.viewWidth, this.viewHeight, 0x1a1a2e);
    this.background.setStrokeStyle(3, COLORS.accent);
    this.add(this.background);

    // Create title
    const title = scene.add.text(0, -this.viewHeight / 2 + 30, 'WEAPON COMPARISON', {
      fontSize: `${FONT_SIZES.large}px`,
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    this.add(title);

    // Create close button
    this.createCloseButton();

    // Create weapon previews
    this.createWeaponPreviews();

    // Create stat comparisons
    this.createStatComparisons();

    // Create effectiveness charts
    this.createEffectivenessCharts();

    // Create switch button
    this.createSwitchButton();

    // Animate entry
    this.animateEntry();

    // Add to scene
    scene.add.existing(this);
  }

  /**
   * Create close button
   */
  private createCloseButton(): void {
    this.closeButton = this.scene.add.container(this.viewWidth / 2 - 40, -this.viewHeight / 2 + 30);

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
   * Create weapon previews
   */
  private createWeaponPreviews(): void {
    const previewX = -this.viewWidth / 4;
    const previewY = -this.viewHeight / 2 + 100;

    // Weapon 1 preview
    this.weapon1Preview = new WeaponPreview(this.scene, previewX, previewY, {
      weapon: this.weapon1,
      tier: this.weapon1Tier,
      size: 'medium',
      showTrail: true,
    });
    this.add(this.weapon1Preview);

    // Weapon 2 preview
    this.weapon2Preview = new WeaponPreview(this.scene, -previewX, previewY, {
      weapon: this.weapon2,
      tier: this.weapon2Tier,
      size: 'medium',
      showTrail: true,
    });
    this.add(this.weapon2Preview);

    // Create weapon labels
    const label1 = this.scene.add.text(previewX, previewY + 120, this.weapon1.name, {
      fontSize: `${FONT_SIZES.medium}px`,
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    label1.setOrigin(0.5);
    this.add(label1);

    const label2 = this.scene.add.text(-previewX, previewY + 120, this.weapon2.name, {
      fontSize: `${FONT_SIZES.medium}px`,
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    label2.setOrigin(0.5);
    this.add(label2);
  }

  /**
   * Create stat comparisons
   */
  private createStatComparisons(): void {
    const stats = ['Damage', 'Speed', 'Range', 'Effectiveness'];
    const startY = -this.viewHeight / 2 + 220;
    const statHeight = 30;
    const statSpacing = 40;

    stats.forEach((stat, index) => {
      const y = startY + index * statSpacing;

      // Create stat label
      const label = this.scene.add.text(0, y, stat, {
        fontSize: '14px',
        color: '#CCCCCC',
      });
      label.setOrigin(0.5);
      this.add(label);

      // Get stat values for both weapons
      const value1 = this.getStatValue(this.weapon1, stat);
      const value2 = this.getStatValue(this.weapon2, stat);

      // Create stat bars
      const bar1 = new StatBar(this.scene, -this.viewWidth / 4, y + 20, {
        label: '',
        value: value1,
        maxValue: 100,
        width: 150,
        height: 15,
        showLabel: false,
        showValue: false,
      });
      this.add(bar1);
      this.weapon1Stats.push(bar1);

      const bar2 = new StatBar(this.scene, this.viewWidth / 4, y + 20, {
        label: '',
        value: value2,
        maxValue: 100,
        width: 150,
        height: 15,
        showLabel: false,
        showValue: false,
      });
      this.add(bar2);
      this.weapon2Stats.push(bar2);

      // Create comparison indicator
      const diff = value2 - value1;
      const indicator = this.scene.add.text(0, y + 20, diff > 0 ? `+${diff}` : `${diff}`, {
        fontSize: '12px',
        color: diff > 0 ? '#44ff44' : '#ff4444',
        fontStyle: 'bold',
      });
      indicator.setOrigin(0.5);
      this.add(indicator);
    });
  }

  /**
   * Get stat value for weapon
   */
  private getStatValue(weapon: WeaponConfig, stat: string): number {
    // Simple stat calculation based on weapon properties
    switch (stat) {
      case 'Damage':
        return weapon.tiers[weapon.tiers.length - 1]?.effects[0]?.value || 50;
      case 'Speed':
        return weapon.id.includes('lightning') ? 90 : weapon.id.includes('fire') ? 70 : 60;
      case 'Range':
        return weapon.id.includes('holy') ? 80 : 60;
      case 'Effectiveness':
        return weapon.effectiveAgainst ? 80 : 40;
      default:
        return 50;
    }
  }

  /**
   * Create effectiveness charts
   */
  private createEffectivenessCharts(): void {
    const chartY = -this.viewHeight / 2 + 400;

    // Create effectiveness data for both weapons
    const data1: EffectivenessData[] = [
      { monsterType: 'zombie' as any, effectiveness: this.weapon1.effectiveAgainst === 'zombie' ? 80 : 40 },
      { monsterType: 'vampire' as any, effectiveness: this.weapon1.effectiveAgainst === 'vampire' ? 80 : 40 },
      { monsterType: 'ghost' as any, effectiveness: this.weapon1.effectiveAgainst === 'ghost' ? 80 : 40 },
    ];

    const data2: EffectivenessData[] = [
      { monsterType: 'zombie' as any, effectiveness: this.weapon2.effectiveAgainst === 'zombie' ? 80 : 40 },
      { monsterType: 'vampire' as any, effectiveness: this.weapon2.effectiveAgainst === 'vampire' ? 80 : 40 },
      { monsterType: 'ghost' as any, effectiveness: this.weapon2.effectiveAgainst === 'ghost' ? 80 : 40 },
    ];

    // Create charts
    this.effectivenessChart1 = new EffectivenessChart(this.scene, -this.viewWidth / 4, chartY, {
      data: data1,
      chartType: 'bar',
      width: 350,
      height: 150,
      showLabels: true,
      showPercentages: true,
    });
    this.add(this.effectivenessChart1);

    this.effectivenessChart2 = new EffectivenessChart(this.scene, this.viewWidth / 4, chartY, {
      data: data2,
      chartType: 'bar',
      width: 350,
      height: 150,
      showLabels: true,
      showPercentages: true,
    });
    this.add(this.effectivenessChart2);
  }

  /**
   * Create switch button
   */
  private createSwitchButton(): void {
    this.switchButton = this.scene.add.container(0, this.viewHeight / 2 - 50);

    const switchBg = this.scene.add.rectangle(0, 0, 150, 40, 0x4CAF50);
    switchBg.setStrokeStyle(2, 0x000000);
    switchBg.setInteractive({ useHandCursor: true });
    this.switchButton.add(switchBg);

    const switchText = this.scene.add.text(0, 0, 'SWITCH WEAPONS', {
      fontSize: '14px',
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    switchText.setOrigin(0.5);
    this.switchButton.add(switchText);

    switchBg.on('pointerdown', this.onSwitchClick.bind(this));

    this.add(this.switchButton);
  }

  /**
   * Animate view entry
   */
  private animateEntry(): void {
    this.setScale(0);

    this.scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      duration: UI_ANIMATION_DURATION * 2,
      ease: 'Back.easeOut',
    });
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
   * Handle switch button click
   */
  private onSwitchClick(): void {
    // Swap weapons
    const tempWeapon = this.weapon1;
    const tempTier = this.weapon1Tier;

    this.weapon1 = this.weapon2;
    this.weapon1Tier = this.weapon2Tier;
    this.weapon2 = tempWeapon;
    this.weapon2Tier = tempTier;

    // Update previews
    if (this.weapon1Preview) {
      this.weapon1Preview.updateWeapon(this.weapon1);
      this.weapon1Preview.setTier(this.weapon1Tier);
    }
    if (this.weapon2Preview) {
      this.weapon2Preview.updateWeapon(this.weapon2);
      this.weapon2Preview.setTier(this.weapon2Tier);
    }

    // Update stats and charts
    this.updateComparisons();

    // Emit switch event
    if (this.onSwitchCallback) {
      this.onSwitchCallback();
    }
  }

  /**
   * Update stat comparisons and effectiveness charts
   */
  private updateComparisons(): void {
    // Clear existing stats
    this.weapon1Stats.forEach((stat) => {
      this.remove(stat);
      stat.destroy();
    });
    this.weapon1Stats = [];

    this.weapon2Stats.forEach((stat) => {
      this.remove(stat);
      stat.destroy();
    });
    this.weapon2Stats = [];

    // Clear existing charts
    if (this.effectivenessChart1) {
      this.remove(this.effectivenessChart1);
      this.effectivenessChart1.destroy();
    }
    if (this.effectivenessChart2) {
      this.remove(this.effectivenessChart2);
      this.effectivenessChart2.destroy();
    }

    // Recreate stats and charts
    this.createStatComparisons();
    this.createEffectivenessCharts();
  }

  /**
   * Close comparison view
   */
  public close(): void {
    this.scene.tweens.add({
      targets: this,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: UI_ANIMATION_DURATION,
      ease: 'Power2',
      onComplete: () => {
        this.destroy();
      },
    });
  }

  /**
   * Update weapon 1
   * @param weapon - New weapon configuration
   * @param tier - New tier level
   */
  public updateWeapon1(weapon: WeaponConfig, tier: number): void {
    this.weapon1 = weapon;
    this.weapon1Tier = tier;
    if (this.weapon1Preview) {
      this.weapon1Preview.updateWeapon(weapon);
      this.weapon1Preview.setTier(tier);
    }
    this.updateComparisons();
  }

  /**
   * Update weapon 2
   * @param weapon - New weapon configuration
   * @param tier - New tier level
   */
  public updateWeapon2(weapon: WeaponConfig, tier: number): void {
    this.weapon2 = weapon;
    this.weapon2Tier = tier;
    if (this.weapon2Preview) {
      this.weapon2Preview.updateWeapon(weapon);
      this.weapon2Preview.setTier(tier);
    }
    this.updateComparisons();
  }

  /**
   * Clean up comparison view resources
   */
  public destroy(): void {
    if (this.backdrop) {
      this.backdrop.off('pointerdown', this.onBackdropClick.bind(this));
    }

    this.weapon1Stats.forEach((stat) => {
      stat.destroy();
    });

    this.weapon2Stats.forEach((stat) => {
      stat.destroy();
    });

    if (this.effectivenessChart1) {
      this.effectivenessChart1.destroy();
    }

    if (this.effectivenessChart2) {
      this.effectivenessChart2.destroy();
    }

    super.destroy();
  }
}
