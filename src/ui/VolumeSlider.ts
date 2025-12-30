/**
 * Volume Slider Component
 * 
 * A reusable volume slider component with draggable handle,
 * visual fill indicator, and percentage display.
 */

import Phaser from 'phaser';
import { DARK_GOTHIC_THEME } from '../config/theme';

/**
 * Volume slider configuration
 */
export interface VolumeSliderConfig {
  /** X position */
  x: number;
  /** Y position */
  y: number;
  /** Initial volume value (0-1) */
  value: number;
  /** Label text */
  label?: string;
  /** Callback when value changes */
  onChange: (value: number) => void;
  /** Slider width in pixels */
  width?: number;
  /** Slider height in pixels */
  height?: number;
  /** Custom colors */
  colors?: {
    background?: number;
    fill?: number;
    handle?: number;
    handleStroke?: number;
    text?: string;
    label?: string;
  };
  /** Show percentage display */
  showPercentage?: boolean;
  /** Custom percentage format */
  percentageFormat?: (value: number) => string;
}

/**
 * Volume Slider Component
 * A Phaser Container-based slider for volume control
 */
export class VolumeSlider extends Phaser.GameObjects.Container {
  private config: VolumeSliderConfig;
  private sliderBg!: Phaser.GameObjects.Rectangle;
  private sliderFill!: Phaser.GameObjects.Rectangle;
  private handle!: Phaser.GameObjects.Arc;
  private valueText?: Phaser.GameObjects.Text;
  private labelText?: Phaser.GameObjects.Text;

  private readonly defaultWidth = 200;
  private readonly defaultHeight = 6;
  private readonly handleRadius = 12;
  private readonly minX: number;
  private readonly maxX: number;

  constructor(scene: Phaser.Scene, config: VolumeSliderConfig) {
    super(scene, config.x, config.y);
    this.config = config;

    const width = config.width || this.defaultWidth;
    const height = config.height || this.defaultHeight;

    // Calculate handle bounds
    this.minX = -width / 2;
    this.maxX = width / 2;

    // Create visual elements
    this.createBackground(width, height);
    this.createFill(width, height);
    this.createHandle();
    this.createLabel(config.label);
    this.createPercentageDisplay();

    // Setup interaction
    this.setupInteraction();

    // Add to scene
    this.scene.add.existing(this);
  }

  /**
   * Create slider background
   */
  private createBackground(width: number, height: number): void {
    const colors = this.config.colors || {};

    this.sliderBg = this.scene.add.rectangle(
      0,
      0,
      width,
      height,
      colors.background ?? 0x333333,
    );
    this.sliderBg.setStrokeStyle(1, colors.fill ?? 0x555555);
    this.add(this.sliderBg);
  }

  /**
   * Create slider fill (shows current value)
   */
  private createFill(width: number, height: number): void {
    const colors = this.config.colors || {};
    const fillWidth = this.config.value * width;

    this.sliderFill = this.scene.add.rectangle(
      -width / 2 + fillWidth / 2,
      0,
      fillWidth,
      height,
      colors.fill ?? DARK_GOTHIC_THEME.colors.accent,
    );
    this.add(this.sliderFill);
  }

  /**
   * Create draggable handle
   */
  private createHandle(): void {
    const colors = this.config.colors || {};
    const handleX = this.minX + this.config.value * (this.maxX - this.minX);

    this.handle = this.scene.add.circle(
      handleX,
      0,
      this.handleRadius,
      colors.handle ?? 0xffffff,
    ) as Phaser.GameObjects.Arc;
    this.handle.setStrokeStyle(2, colors.handleStroke ?? 0x000000);
    this.handle.setInteractive({ useHandCursor: true, draggable: true });
    this.add(this.handle);
  }

  /**
   * Create optional label
   */
  private createLabel(text?: string): void {
    if (!text) return;

    const colors = this.config.colors || {};

    this.labelText = this.scene.add.text(
      -this.config.width! / 2 - 30,
      0,
      text,
      {
        fontFamily: DARK_GOTHIC_THEME.fonts.secondary,
        fontSize: '16px',
        color: colors.label ?? '#aaaaaa',
      },
    );
    this.labelText.setOrigin(0, 0.5);
    this.add(this.labelText);
  }

  /**
   * Create percentage display
   */
  private createPercentageDisplay(): void {
    const colors = this.config.colors || {};

    const percentage = this.config.percentageFormat
      ? this.config.percentageFormat(this.config.value)
      : `${Math.round(this.config.value * 100)}%`;

    this.valueText = this.scene.add.text(
      (this.config.width || this.defaultWidth) / 2 + 20,
      0,
      percentage,
      {
        fontFamily: DARK_GOTHIC_THEME.fonts.monospace,
        fontSize: '14px',
        color: colors.text ?? '#cccccc',
      },
    );
    this.valueText.setOrigin(0, 0.5);
    this.add(this.valueText);
  }

  /**
   * Setup drag interaction for handle
   */
  private setupInteraction(): void {
    this.handle.on('drag', (pointer: Phaser.Input.Pointer, dragX: number) => {
      const clampedX = Phaser.Math.Clamp(dragX, this.minX, this.maxX);
      this.handle.x = clampedX;

      // Calculate new value (0-1)
      const newValue = (clampedX - this.minX) / (this.maxX - this.minX);

      // Update fill
      const width = this.config.width || this.defaultWidth;
      const fillWidth = newValue * width;
      this.sliderFill.width = fillWidth;
      this.sliderFill.x = -width / 2 + fillWidth / 2;

      // Update percentage text
      if (this.valueText) {
        const percentage = this.config.percentageFormat
          ? this.config.percentageFormat(newValue)
          : `${Math.round(newValue * 100)}%`;
        this.valueText.setText(percentage);
      }

      // Callback
      this.config.onChange(newValue);
    });
  }

  /**
   * Set the slider value
   * @param value - New value (0-1)
   * @param animate - Whether to animate the change
   */
  setValue(value: number, animate: boolean = false): void {
    const clampedValue = Phaser.Math.Clamp(value, 0, 1);
    this.config.value = clampedValue;

    const width = this.config.width || this.defaultWidth;
    const handleX = this.minX + clampedValue * (this.maxX - this.minX);
    const fillWidth = clampedValue * width;

    if (animate) {
      // Animate handle
      this.scene.tweens.add({
        targets: this.handle,
        x: handleX,
        duration: 100,
        ease: 'Power2',
      });

      // Animate fill
      this.scene.tweens.add({
        targets: this.sliderFill,
        width: fillWidth,
        x: -width / 2 + fillWidth / 2,
        duration: 100,
        ease: 'Power2',
      });
    } else {
      this.handle.x = handleX;
      this.sliderFill.width = fillWidth;
      this.sliderFill.x = -width / 2 + fillWidth / 2;
    }

    // Update percentage text
    if (this.valueText) {
      const percentage = this.config.percentageFormat
        ? this.config.percentageFormat(clampedValue)
        : `${Math.round(clampedValue * 100)}%`;
      this.valueText.setText(percentage);
    }
  }

  /**
   * Get current value
   * @returns Current value (0-1)
   */
  getValue(): number {
    return this.config.value;
  }

  /**
   * Set label text
   * @param text - New label text
   */
  setLabel(text: string): void {
    if (this.labelText) {
      this.labelText.setText(text);
    } else {
      this.createLabel(text);
    }
  }

  /**
   * Set percentage format function
   * @param format - Format function that takes value and returns string
   */
  setPercentageFormat(format: (value: number) => string): void {
    this.config.percentageFormat = format;
    if (this.valueText) {
      this.valueText.setText(format(this.config.value));
    }
  }

  /**
   * Enable or disable the slider
   * @param enabled - Whether the slider should be enabled
   */
  setEnabled(enabled: boolean): void {
    this.handle.setInteractive({ useHandCursor: enabled, draggable: enabled });
    this.handle.setAlpha(enabled ? 1 : 0.5);
    this.sliderFill.setAlpha(enabled ? 1 : 0.3);
    this.sliderBg.setAlpha(enabled ? 1 : 0.3);
    if (this.valueText) {
      this.valueText.setAlpha(enabled ? 1 : 0.3);
    }
    if (this.labelText) {
      this.labelText.setAlpha(enabled ? 1 : 0.3);
    }
  }

  /**
   * Destroy the slider and cleanup
   */
  destroy(): void {
    this.handle.off('drag');
    super.destroy();
  }
}
