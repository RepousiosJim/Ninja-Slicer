/**
 * Toggle Component
 *
 * A modern toggle switch component with smooth animations.
 * Perfect for on/off settings in a minimalist UI.
 */

import Phaser from 'phaser';
import { DARK_GOTHIC_THEME } from '../config/theme';

export interface ToggleConfig {
  x: number;
  y: number;
  width?: number;
  height?: number;
  initialValue?: boolean;
  label?: string;
  labelPosition?: 'left' | 'right';
  onChange?: (value: boolean) => void;
  disabled?: boolean;
}

/**
 * Modern toggle switch component
 */
export class Toggle extends Phaser.GameObjects.Container {
  // UI elements
  private track: Phaser.GameObjects.Rectangle;
  private thumb: Phaser.GameObjects.Arc;
  private label: Phaser.GameObjects.Text | null = null;
  private glow: Phaser.GameObjects.Arc | null = null;

  // Toggle state
  private isOn: boolean;
  private isEnabled: boolean;
  private callback: ((value: boolean) => void) | null = null;
  private isAnimating: boolean = false;

  // Dimensions
  private trackWidth: number;
  private trackHeight: number;
  private thumbRadius: number;

  /**
   * Create a new toggle switch
   */
  constructor(scene: Phaser.Scene, config: ToggleConfig) {
    super(scene, config.x, config.y);

    // Set dimensions
    this.trackWidth = config.width || 60;
    this.trackHeight = config.height || 30;
    this.thumbRadius = this.trackHeight * 0.7 / 2;

    // Initial state
    this.isOn = config.initialValue || false;
    this.isEnabled = config.disabled !== true;
    this.callback = config.onChange || null;

    // Create track background
    this.track = scene.add.rectangle(
      0,
      0,
      this.trackWidth,
      this.trackHeight,
      this.isOn ? DARK_GOTHIC_THEME.colors.success : 0x333333,
      1.0,
    );
    this.track.setStrokeStyle(2, this.isOn ? DARK_GOTHIC_THEME.colors.success : 0x555555);
    this.track.setInteractive({ useHandCursor: this.isEnabled });
    this.add(this.track);

    // Create glow effect (only visible when on)
    this.glow = scene.add.circle(
      this.isOn ? this.trackWidth / 2 - this.thumbRadius - 4 : -this.trackWidth / 2 + this.thumbRadius + 4,
      0,
      this.thumbRadius + 8,
      DARK_GOTHIC_THEME.colors.success,
      0.3,
    );
    this.glow.setVisible(this.isOn);
    this.add(this.glow);

    // Create thumb/handle
    const thumbX = this.isOn ? this.trackWidth / 2 - this.thumbRadius - 4 : -this.trackWidth / 2 + this.thumbRadius + 4;
    this.thumb = scene.add.circle(thumbX, 0, this.thumbRadius, 0xffffff, 1.0);
    this.thumb.setStrokeStyle(2, 0x000000);
    this.add(this.thumb);

    // Create label if provided
    if (config.label) {
      const labelX = config.labelPosition === 'right' ? this.trackWidth / 2 + 20 : -this.trackWidth / 2 - 20;
      const labelOrigin = config.labelPosition === 'right' ? 0 : 1;

      this.label = scene.add.text(labelX, 0, config.label, {
        fontFamily: DARK_GOTHIC_THEME.fonts.primary,
        fontSize: '18px',
        color: '#ffffff',
      });
      this.label.setOrigin(labelOrigin, 0.5);
      this.add(this.label);
    }

    // Setup events
    if (this.isEnabled) {
      this.track.on('pointerdown', this.onToggle.bind(this));
      this.track.on('pointerover', this.onHover.bind(this));
      this.track.on('pointerout', this.onHoverEnd.bind(this));
    }

    // Update appearance
    this.updateAppearance();

    // Add to scene
    scene.add.existing(this);
  }

  /**
   * Handle toggle click
   */
  private onToggle(): void {
    if (!this.isEnabled || this.isAnimating) return;

    this.isOn = !this.isOn;
    this.animateToggle();

    // Trigger callback
    if (this.callback) {
      this.callback(this.isOn);
    }
  }

  /**
   * Handle hover
   */
  private onHover(): void {
    if (!this.isEnabled) return;
    this.scene.tweens.add({
      targets: this.thumb,
      scale: 1.1,
      duration: 150,
      ease: 'Power2',
    });
  }

  /**
   * Handle hover end
   */
  private onHoverEnd(): void {
    if (!this.isEnabled) return;
    this.scene.tweens.add({
      targets: this.thumb,
      scale: 1.0,
      duration: 150,
      ease: 'Power2',
    });
  }

  /**
   * Animate toggle transition
   */
  private animateToggle(): void {
    this.isAnimating = true;

    const targetX = this.isOn
      ? this.trackWidth / 2 - this.thumbRadius - 4
      : -this.trackWidth / 2 + this.thumbRadius + 4;

    // Animate thumb position
    this.scene.tweens.add({
      targets: [this.thumb, this.glow],
      x: targetX,
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.isAnimating = false;
      },
    });

    // Animate track color
    const targetColor = this.isOn ? DARK_GOTHIC_THEME.colors.success : 0x333333;
    const targetBorderColor = this.isOn ? DARK_GOTHIC_THEME.colors.success : 0x555555;

    this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 200,
      onUpdate: (tween) => {
        const value = tween.getValue() || 0;
        const currentColor = this.isOn ? 0x333333 : DARK_GOTHIC_THEME.colors.success;

        // Interpolate colors
        const r1 = (currentColor >> 16) & 0xff;
        const g1 = (currentColor >> 8) & 0xff;
        const b1 = currentColor & 0xff;

        const r2 = (targetColor >> 16) & 0xff;
        const g2 = (targetColor >> 8) & 0xff;
        const b2 = targetColor & 0xff;

        const r = Math.round(r1 + (r2 - r1) * value);
        const g = Math.round(g1 + (g2 - g1) * value);
        const b = Math.round(b1 + (b2 - b1) * value);

        const interpolatedColor = (r << 16) | (g << 8) | b;
        this.track.setFillStyle(interpolatedColor, 1.0);
      },
    });

    // Show/hide glow
    if (this.glow) {
      this.glow.setVisible(this.isOn);
      if (this.isOn) {
        this.glow.setAlpha(0);
        this.scene.tweens.add({
          targets: this.glow,
          alpha: 0.3,
          duration: 200,
          ease: 'Power2',
        });
      }
    }

    // Update stroke color
    this.track.setStrokeStyle(2, targetBorderColor);

    this.updateAppearance();
  }

  /**
   * Update toggle appearance
   */
  private updateAppearance(): void {
    if (!this.isEnabled) {
      this.track.setFillStyle(0x222222, 0.5);
      this.track.setStrokeStyle(2, 0x333333);
      this.thumb.setAlpha(0.5);
      if (this.label) {
        this.label.setAlpha(0.5);
      }
      if (this.glow) {
        this.glow.setVisible(false);
      }
    } else {
      this.thumb.setAlpha(1.0);
      if (this.label) {
        this.label.setAlpha(1.0);
      }
    }
  }

  /**
   * Set toggle value programmatically
   */
  public setValue(value: boolean, animate: boolean = true): void {
    if (this.isOn === value) return;

    this.isOn = value;

    if (animate) {
      this.animateToggle();
    } else {
      const targetX = this.isOn
        ? this.trackWidth / 2 - this.thumbRadius - 4
        : -this.trackWidth / 2 + this.thumbRadius + 4;

      this.thumb.setX(targetX);
      if (this.glow) {
        this.glow.setX(targetX);
        this.glow.setVisible(this.isOn);
      }

      const targetColor = this.isOn ? DARK_GOTHIC_THEME.colors.success : 0x333333;
      const targetBorderColor = this.isOn ? DARK_GOTHIC_THEME.colors.success : 0x555555;

      this.track.setFillStyle(targetColor, 1.0);
      this.track.setStrokeStyle(2, targetBorderColor);
    }
  }

  /**
   * Get current toggle value
   */
  public getValue(): boolean {
    return this.isOn;
  }

  /**
   * Enable or disable toggle
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (this.track.input) {
      this.track.input.enabled = enabled;
    }
    this.updateAppearance();
  }

  /**
   * Set toggle callback
   */
  public setCallback(callback: (value: boolean) => void): void {
    this.callback = callback;
  }

  /**
   * Set label text
   */
  public setLabel(text: string): void {
    if (this.label) {
      this.label.setText(text);
    }
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    if (this.track) {
      this.track.off('pointerdown', this.onToggle.bind(this));
      this.track.off('pointerover', this.onHover.bind(this));
      this.track.off('pointerout', this.onHoverEnd.bind(this));
    }
    super.destroy();
  }
}
