/**
 * StatBar Component
 *
 * A visual progress bar component for displaying stats.
 * Features color coding based on value ranges, comparison mode,
 * animated fill transitions, and label/value display.
 */

import Phaser from 'phaser';
import { COLORS, FONT_SIZES, UI_ANIMATION_DURATION } from '../config/constants';
import { DARK_GOTHIC_THEME } from '../config/theme';

/**
 * Stat bar configuration interface
 */
export interface StatBarConfig {
  label: string;
  value: number;
  maxValue: number;
  width?: number;
  height?: number;
  showLabel?: boolean;
  showValue?: boolean;
  comparisonMode?: boolean;
  oldValue?: number;
}

/**
 * Stat bar component for visual stat display
 */
export class StatBar extends Phaser.GameObjects.Container {
  // UI elements
  private background: Phaser.GameObjects.Rectangle;
  private bar: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text | null = null;
  private valueText: Phaser.GameObjects.Text | null = null;
  private comparisonIndicator: Phaser.GameObjects.Text | null = null;

  // Stat state
  private labelStr: string;
  private value: number;
  private maxValue: number;
  private barWidth: number;
  private barHeight: number;
  private showLabel: boolean;
  private showValue: boolean;
  private comparisonMode: boolean;
  private oldValue: number | null = null;

  /**
   * Create a new stat bar
   * @param scene - The scene this stat bar belongs to
   * @param x - X position
   * @param y - Y position
   * @param config - Stat bar configuration
   */
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: StatBarConfig
  ) {
    super(scene, x, y);

    this.labelStr = config.label;
    this.value = config.value;
    this.maxValue = config.maxValue;
    this.barWidth = config.width || 200;
    this.barHeight = config.height || 20;
    this.showLabel = config.showLabel !== false;
    this.showValue = config.showValue !== false;
    this.comparisonMode = config.comparisonMode || false;
    this.oldValue = config.oldValue || null;

    // Create background with theme
    this.background = scene.add.rectangle(0, 0, this.barWidth, this.barHeight, DARK_GOTHIC_THEME.colors.background);
    this.background.setAlpha(0.5);
    this.background.setStrokeStyle(1, DARK_GOTHIC_THEME.colors.accent);
    this.add(this.background);

    // Create progress bar with theme colors
    const barColor = this.getBarColor(this.value, this.maxValue);
    const barWidth = (this.value / this.maxValue) * this.barWidth;
    this.bar = scene.add.rectangle(-this.barWidth /2 + barWidth / 2, 0, barWidth, this.barHeight, barColor);
    this.bar.setOrigin(0, 0.5);
    this.add(this.bar);

    // Create label if enabled
    if (this.showLabel) {
      this.label = scene.add.text(-this.barWidth / 2, -this.barHeight / 2 - 15, this.labelStr, {
        fontFamily: DARK_GOTHIC_THEME.fonts.primary,
        fontSize: `${FONT_SIZES.small}px`,
        color: '#FFFFFF',
      });
      this.label.setOrigin(0, 0.5);
      this.add(this.label);
    }

    // Create value text if enabled
    if (this.showValue) {
      this.valueText = scene.add.text(this.barWidth / 2, 0, `${this.value}/${this.maxValue}`, {
        fontFamily: DARK_GOTHIC_THEME.fonts.monospace,
        fontSize: `${FONT_SIZES.small}px`,
        color: '#FFFFFF',
        fontStyle: 'bold',
      });
      this.valueText.setOrigin(1, 0.5);
      this.add(this.valueText);
    }

    // Create comparison indicator if in comparison mode
    if (this.comparisonMode && this.oldValue !== null) {
      this.createComparisonIndicator();
    }

    // Add to scene
    scene.add.existing(this);
  }

  /**
   * Get bar color based on value percentage
   */
  private getBarColor(value: number, max: number): number {
    const percentage = value / max;

    if (percentage >= 0.8) {
      return DARK_GOTHIC_THEME.colors.success; // Green for high values
    } else if (percentage >= 0.4) {
      return DARK_GOTHIC_THEME.colors.warning; // Orange for medium values
    } else {
      return DARK_GOTHIC_THEME.colors.danger; // Red for low values
    }
  }

  /**
   * Create comparison indicator
   */
  private createComparisonIndicator(): void {
    if (this.oldValue === null) return;

    const diff = this.value - this.oldValue;
    const isBetter = diff > 0;

    this.comparisonIndicator = this.scene.add.text(
      this.barWidth / 2 + 10,
      0,
      isBetter ? `+${diff}` : `${diff}`,
      {
        fontFamily: DARK_GOTHIC_THEME.fonts.monospace,
        fontSize: `${FONT_SIZES.small}px`,
        color: isBetter ? '#44ff44' : '#ff4444',
        fontStyle: 'bold',
      }
    );
    this.comparisonIndicator.setOrigin(0, 0.5);
    this.add(this.comparisonIndicator);
  }

  /**
   * Update stat value with animation
   * @param value - New value
   */
  public setValue(value: number): void {
    const previousValue = this.value;
    this.value = Math.min(Math.max(value, 0), this.maxValue);

    // Animate bar width change with theme animation
    const targetWidth = (this.value / this.maxValue) * this.barWidth;
    const newColor = this.getBarColor(this.value, this.maxValue);

    this.scene.tweens.add({
      targets: this.bar,
      width: targetWidth,
      x: -this.barWidth / 2 + targetWidth / 2,
      fillStyle: { color: newColor },
      duration: DARK_GOTHIC_THEME.animations.duration,
      ease: DARK_GOTHIC_THEME.animations.easing,
    });

    // Update value text
    if (this.valueText) {
      this.valueText.setText(`${this.value}/${this.maxValue}`);
    }

    // Update comparison indicator
    if (this.comparisonMode && this.oldValue !== null) {
      this.updateComparisonIndicator();
    }
  }

  /**
   * Update comparison indicator
   */
  private updateComparisonIndicator(): void {
    if (!this.comparisonIndicator || this.oldValue === null) return;
    
    const diff = this.value - this.oldValue;
    const isBetter = diff > 0;

    this.comparisonIndicator.setText(isBetter ? `+${diff}` : `${diff}`);
    this.comparisonIndicator.setColor(isBetter ? '#44ff44' : '#ff4444');
  }

  /**
   * Set maximum value
   * @param max - New maximum value
   */
  public setMaxValue(max: number): void {
    this.maxValue = Math.max(max, 1);
    this.setValue(this.value);
  }

  /**
   * Set label text
   * @param label - New label text
   */
  public setLabel(label: string): void {
    this.labelStr = label;

    if (this.label) {
      this.label.setText(label);
    }
  }

  /**
   * Enable or disable comparison mode
   * @param enabled - Whether comparison mode should be enabled
   * @param oldValue - Old value for comparison
   */
  public setComparisonMode(enabled: boolean, oldValue?: number): void {
    this.comparisonMode = enabled;
    this.oldValue = oldValue !== undefined ? oldValue : null;

    if (enabled && this.oldValue !== null) {
      if (!this.comparisonIndicator) {
        this.createComparisonIndicator();
      } else {
        this.updateComparisonIndicator();
      }
    } else if (this.comparisonIndicator) {
      this.remove(this.comparisonIndicator);
      this.comparisonIndicator.destroy();
      this.comparisonIndicator = null;
    }
  }

  /**
   * Get current value
   */
  public getValue(): number {
    return this.value;
  }

  /**
   * Get maximum value
   */
  public getMaxValue(): number {
    return this.maxValue;
  }

  /**
   * Get value percentage (0-1)
   */
  public getPercentage(): number {
    return this.value / this.maxValue;
  }

  /**
   * Clean up stat bar resources
   */
  public destroy(): void {
    super.destroy();
  }
}
