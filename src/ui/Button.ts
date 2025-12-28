/**
 * Button Component
 * 
 * A reusable button class with states (normal, hover, pressed, disabled).
 * Supports different button styles, text, and icons.
 */

import Phaser from 'phaser';
import { COLORS, FONT_SIZES, UI_ANIMATION_DURATION } from '../config/constants';
import { DARK_GOTHIC_THEME } from '../config/theme';
import { getButtonStyle } from '../utils/ThemeUtils';

/**
 * Button style configuration
 */
export enum ButtonStyle {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  DANGER = 'danger',
  DISABLED = 'disabled',
}

/**
 * Button configuration interface
 */
export interface ButtonConfig {
  x: number;
  y: number;
  width?: number;
  height?: number;
  text: string;
  fontSize?: number;
  style?: ButtonStyle;
  icon?: string;
  onClick?: () => void;
  disabled?: boolean;
}

/**
 * Button component with multiple states and styles
 */
export class Button extends Phaser.GameObjects.Container {
  // UI elements
  private background: Phaser.GameObjects.Image;
  private text: Phaser.GameObjects.Text;
  private icon: Phaser.GameObjects.Image | null = null;

  // Button state
  private style: ButtonStyle;
  private isEnabled: boolean;
  private isHovered: boolean;
  private isPressed: boolean;
  private callback: (() => void) | null = null;

  // Texture keys
  private textureKeys: {
    normal: string;
    hover: string;
    pressed: string;
    disabled: string;
  };

  /**
   * Create a new button
   * @param scene - The scene this button belongs to
   * @param x - X position
   * @param y - Y position
   * @param width - Button width (default: 200)
   * @param height - Button height (default: 50)
   * @param text - Button text
   * @param config - Button configuration
   */
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number = 200,
    height: number = 50,
    text: string,
    config: Partial<ButtonConfig> = {}
  ) {
    super(scene, x, y);

    // Set dimensions
    const buttonWidth = config.width || width;
    const buttonHeight = config.height || height;

    // Use uniform texture keys for all buttons
    this.textureKeys = {
      normal: 'ui_button_normal',
      hover: 'ui_button_hover',
      pressed: 'ui_button_pressed',
      disabled: 'ui_button_disabled'
    };

    // Create background with scaling to match requested dimensions
    this.background = scene.add.image(0, 0, this.textureKeys.normal);
    this.background.setDisplaySize(buttonWidth, buttonHeight); // Actually use the width/height params!
    this.background.setInteractive({ useHandCursor: true });
    this.add(this.background);

    // Create text
    const fontSize = config.fontSize || FONT_SIZES.medium;
    this.text = scene.add.text(0, 0, text, {
      fontFamily: DARK_GOTHIC_THEME.fonts.primary,
      fontSize: `${fontSize}px`,
      color: '#' + DARK_GOTHIC_THEME.colors.text.toString(16).padStart(6, '0'),
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    });
    this.text.setOrigin(0.5);
    this.text.setDepth(1);
    this.add(this.text);

    // Create icon if provided
    if (config.icon) {
      this.icon = scene.add.image(-buttonWidth / 2 + 30, 0, config.icon);
      this.icon.setScale(0.5);
      this.icon.setDepth(1);
      this.add(this.icon);
      this.text.setX(20); // Offset text to make room for icon
    }

    // Set initial state
    this.style = config.style || ButtonStyle.PRIMARY;
    this.isEnabled = config.disabled !== true;
    this.isHovered = false;
    this.isPressed = false;
    this.callback = config.onClick || null;

    // Setup event listeners
    this.setupEvents();

    // Initial appearance update
    this.updateAppearance();

    // Add to scene
    scene.add.existing(this);
  }

  /**
   * Setup button event listeners
   */
  private setupEvents(): void {
    this.background.on('pointerover', this.onHover.bind(this));
    this.background.on('pointerout', this.onHoverEnd.bind(this));
    this.background.on('pointerdown', this.onPress.bind(this));
    this.background.on('pointerup', this.onRelease.bind(this));
  }

  /**
   * Handle hover event
   */
  private onHover(): void {
    if (!this.isEnabled) return;
    this.isHovered = true;
    this.updateAppearance();
  }

  /**
   * Handle hover end event
   */
  private onHoverEnd(): void {
    if (!this.isEnabled) return;
    this.isHovered = false;
    this.isPressed = false;
    this.updateAppearance();
  }

  /**
   * Handle press event
   */
  private onPress(): void {
    if (!this.isEnabled) return;
    this.isPressed = true;
    this.updateAppearance();
  }

  /**
   * Handle release event
   */
  private onRelease(): void {
    if (!this.isEnabled) return;
    this.isPressed = false;
    this.updateAppearance();

    // Trigger callback
    if (this.callback) {
      this.callback();
    }
  }

  /**
   * Update button appearance based on state
   */
  private updateAppearance(): void {
    // Store current dimensions
    const currentWidth = this.background.displayWidth;
    const currentHeight = this.background.displayHeight;

    if (!this.isEnabled) {
      this.background.setTexture(this.textureKeys.disabled);
      this.background.setDisplaySize(currentWidth, currentHeight);
      this.text.setAlpha(0.5);
      return;
    }

    this.text.setAlpha(1.0);

    if (this.isPressed) {
      this.background.setTexture(this.textureKeys.pressed);
      this.background.setDisplaySize(currentWidth * 0.98, currentHeight * 0.98);
    } else if (this.isHovered) {
      this.background.setTexture(this.textureKeys.hover);
      this.background.setDisplaySize(currentWidth * 1.02, currentHeight * 1.02);
    } else {
      this.background.setTexture(this.textureKeys.normal);
      this.background.setDisplaySize(currentWidth, currentHeight);
    }
  }

  /**
   * Change button style (legacy, can be extended for more visual variety)
   * @param style - New button style
   */
  public setStyle(style: ButtonStyle): void {
    this.style = style;
    this.setEnabled(style !== ButtonStyle.DISABLED);
  }

  /**
   * Enable or disable button
   * @param enabled - Whether button should be enabled
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (this.background.input) {
      this.background.input.enabled = enabled;
    }
    this.updateAppearance();
  }

  /**
   * Set click callback
   * @param callback - Function to call on click
   */
  public setCallback(callback: () => void): void {
    this.callback = callback;
  }

  /**
   * Set button text
   * @param text - New button text
   */
  public setText(text: string): void {
    this.text.setText(text);
  }

  /**
   * Get current enabled state
   */
  public getEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Get current style
   */
  public getStyle(): ButtonStyle {
    return this.style;
  }

  /**
   * Clean up button resources
   */
  public destroy(): void {
    if (this.background) {
      this.background.off('pointerover', this.onHover.bind(this));
      this.background.off('pointerout', this.onHoverEnd.bind(this));
      this.background.off('pointerdown', this.onPress.bind(this));
      this.background.off('pointerup', this.onRelease.bind(this));
    }
    super.destroy();
  }
}
