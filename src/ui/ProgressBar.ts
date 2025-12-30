/**
 * Progress Bar Component
 * 
 * A reusable progress bar component with animated progress changes,
 * label support, and percentage display.
 */

import Phaser from 'phaser';
import { FONT_SIZES } from '../config/constants';
import { DARK_GOTHIC_THEME } from '../config/theme';

/**
 * Progress bar configuration interface
 */
export interface ProgressBarConfig {
  width: number;
  height: number;
  max: number;
  current: number;
  color?: number;
  backgroundColor?: number;
  showLabel?: boolean;
  showPercentage?: boolean;
  label?: string;
}

/**
 * Progress bar component
 */
export class ProgressBar extends Phaser.GameObjects.Container {
  // UI elements
  private background: Phaser.GameObjects.Rectangle;
  private bar: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text | null = null;
  private percentage: Phaser.GameObjects.Text | null = null;

  // Progress state
  private max: number;
  private current: number;
  private color: number;
  private backgroundColor: number;
  private showLabel: boolean;
  private showPercentage: boolean;
  private labelText: string;

  /**
   * Create a new progress bar
   * @param scene - The scene this progress bar belongs to
   * @param x - X position
   * @param y - Y position
   * @param width - Progress bar width
   * @param height - Progress bar height
   * @param max - Maximum value
   * @param current - Current value
   */
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    max: number,
    current: number,
  ) {
    super(scene, x, y);

    // Initialize state
    this.max = max;
    this.current = Math.min(current, max);
    this.color = DARK_GOTHIC_THEME.colors.primary;
    this.backgroundColor = DARK_GOTHIC_THEME.colors.background;
    this.showLabel = false;
    this.showPercentage = false;
    this.labelText = '';

    // Create background with theme
    this.background = scene.add.rectangle(0, 0, width, height, this.backgroundColor);
    this.background.setStrokeStyle(2, DARK_GOTHIC_THEME.colors.accent, 0.3);
    this.add(this.background);

    // Create progress bar with theme gradient
    const barWidth = (this.current / this.max) * width;
    this.bar = scene.add.rectangle(-width / 2 + barWidth / 2, 0, barWidth, height, this.color);
    this.bar.setOrigin(0, 0.5);
    this.add(this.bar);

    // Add to scene
    scene.add.existing(this);
  }

  /**
   * Set current progress value
   * @param current - New current value
   */
  public setProgress(current: number): void {
    const previousProgress = this.current / this.max;
    this.current = Math.min(Math.max(current, 0), this.max);
    const newProgress = this.current / this.max;

    // Animate bar width change with theme animation
    const targetWidth = newProgress * this.background.width;
    this.scene.tweens.add({
      targets: this.bar,
      width: targetWidth,
      x: -this.background.width / 2 + targetWidth / 2,
      duration: DARK_GOTHIC_THEME.animations.duration,
      ease: DARK_GOTHIC_THEME.animations.easing,
    });

    // Update label and percentage
    this.updateText();
  }

  /**
   * Set maximum value
   * @param max - New maximum value
   */
  public setMax(max: number): void {
    this.max = Math.max(max, 1);
    this.setProgress(this.current);
  }

  /**
   * Set bar color
   * @param color - New bar color
   */
  public setColor(color: number): void {
    this.color = color;
    this.bar.setFillStyle(color);
  }

  /**
   * Set background color
   * @param color - New background color
   */
  public setBackgroundColor(color: number): void {
    this.backgroundColor = color;
    this.background.setFillStyle(color);
  }

  /**
   * Set progress label
   * @param label - Label text to display
   */
  public setLabel(label: string): void {
    this.labelText = label;
    this.showLabel = true;

    // Create label if it doesn't exist
    if (!this.label) {
      this.label = this.scene.add.text(
        -this.background.width / 2,
        -this.background.height / 2 - 20,
        label,
        {
          fontFamily: DARK_GOTHIC_THEME.fonts.primary,
          fontSize: `${FONT_SIZES.small}px`,
          color: '#FFFFFF',
        },
      );
      this.label.setOrigin(0, 0.5);
      this.add(this.label);
    } else {
      this.label.setText(label);
    }

    this.updateText();
  }

  /**
   * Show or hide percentage display
   * @param show - Whether to show percentage
   */
  public setShowPercentage(show: boolean): void {
    this.showPercentage = show;

    if (show && !this.percentage) {
      this.percentage = this.scene.add.text(
        0,
        0,
        '0%',
        {
          fontFamily: DARK_GOTHIC_THEME.fonts.primary,
          fontSize: `${FONT_SIZES.small}px`,
          color: '#FFFFFF',
          fontStyle: 'bold',
        },
      );
      this.percentage.setOrigin(0.5);
      this.add(this.percentage);
    } else if (!show && this.percentage) {
      this.remove(this.percentage);
      this.percentage.destroy();
      this.percentage = null;
    }

    this.updateText();
  }

  /**
   * Update label and percentage text
   */
  private updateText(): void {
    const percentage = Math.round((this.current / this.max) * 100);

    if (this.label) {
      this.label.setText(`${this.labelText}: ${this.current}/${this.max}`);
    }

    if (this.percentage) {
      this.percentage.setText(`${percentage}%`);
    }
  }

  /**
   * Get current progress value
   */
  public getCurrent(): number {
    return this.current;
  }

  /**
   * Get maximum value
   */
  public getMax(): number {
    return this.max;
  }

  /**
   * Get progress percentage (0-100)
   */
  public getPercentage(): number {
    return Math.round((this.current / this.max) * 100);
  }

  /**
   * Check if progress is complete
   */
  public isComplete(): boolean {
    return this.current >= this.max;
  }

  /**
   * Reset progress to 0
   */
  public reset(): void {
    this.setProgress(0);
  }

  /**
   * Increment progress by amount
   * @param amount - Amount to increment
   */
  public increment(amount: number): void {
    this.setProgress(this.current + amount);
  }

  /**
   * Decrement progress by amount
   * @param amount - Amount to decrement
   */
  public decrement(amount: number): void {
    this.setProgress(this.current - amount);
  }

  /**
   * Clean up progress bar resources
   */
  public destroy(): void {
    super.destroy();
  }
}
