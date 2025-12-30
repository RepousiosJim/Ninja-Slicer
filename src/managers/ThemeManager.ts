/**
 * Ninja Slicer - Theme Manager
 * Centralized theme management system for applying and managing themes across the game
 */

import { Scene } from 'phaser';
import { debugLog, debugWarn, debugError } from '@utils/DebugLogger';


import { ThemeConfig, GradientPalette, ShadowConfig, AnimationPresets } from '../config/types';
import { DARK_GOTHIC_THEME } from '../config/theme';

/**
 * Theme Manager Class
 * Manages theme application, switching, and validation
 */
export class ThemeManager {
  private static instance: ThemeManager;
  private currentTheme: ThemeConfig;
  private scene: Scene | null = null;

  private constructor() {
    this.currentTheme = DARK_GOTHIC_THEME;
  }

  /**
   * Get the singleton instance of ThemeManager
   */
  public static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  /**
   * Initialize the theme manager with a scene
   */
  public initialize(scene: Scene): void {
    this.scene = scene;
  }

  /**
   * Get the current theme configuration
   */
  public getTheme(): ThemeConfig {
    return this.currentTheme;
  }

  /**
   * Set a new theme
   */
  public setTheme(theme: ThemeConfig): void {
    if (this.validateTheme(theme)) {
      this.currentTheme = theme;
    } else {
      debugError('Invalid theme configuration provided');
    }
  }

  /**
   * Validate a theme configuration
   */
  private validateTheme(theme: ThemeConfig): boolean {
    try {
      // Check if all required properties exist
      if (!theme.colors || !theme.fonts || !theme.spacing || !theme.animations) {
        return false;
      }

      // Validate colors
      const requiredColors = [
        'primary',
        'secondary',
        'accent',
        'background',
        'text',
        'textSecondary',
        'disabled',
        'danger',
        'success',
        'warning',
        'bloodRed',
        'vampirePurple',
        'ghostlyBlue',
        'demonGreen',
        'holyWhite',
      ];

      for (const color of requiredColors) {
        if (typeof theme.colors[color as keyof typeof theme.colors] !== 'number') {
          return false;
        }
      }

      // Validate fonts
      if (
        typeof theme.fonts.primary !== 'string' ||
        typeof theme.fonts.secondary !== 'string' ||
        typeof theme.fonts.monospace !== 'string'
      ) {
        return false;
      }

      // Validate spacing
      if (
        typeof theme.spacing.unit !== 'number' ||
        typeof theme.spacing.small !== 'number' ||
        typeof theme.spacing.medium !== 'number' ||
        typeof theme.spacing.large !== 'number' ||
        typeof theme.spacing.xlarge !== 'number'
      ) {
        return false;
      }

      // Validate animations
      if (
        typeof theme.animations.duration !== 'number' ||
        typeof theme.animations.easing !== 'string' ||
        typeof theme.animations.hoverScale !== 'number' ||
        typeof theme.animations.pressScale !== 'number'
      ) {
        return false;
      }

      return true;
    } catch (error) {
      debugError('Theme validation error:', error);
      return false;
    }
  }

  /**
   * Check color contrast ratio for accessibility
   * Returns true if contrast meets WCAG AA standard (4.5:1 for normal text)
   */
  public checkContrastRatio(foregroundColor: number, backgroundColor: number): boolean {
    const fgLuminance = this.calculateLuminance(foregroundColor);
    const bgLuminance = this.calculateLuminance(backgroundColor);

    const lighter = Math.max(fgLuminance, bgLuminance);
    const darker = Math.min(fgLuminance, bgLuminance);

    const contrastRatio = (lighter + 0.05) / (darker + 0.05);
    return contrastRatio >= 4.5;
  }

  /**
   * Calculate relative luminance of a color
   */
  private calculateLuminance(color: number): number {
    const r = ((color >> 16) & 0xff) / 255;
    const g = ((color >> 8) & 0xff) / 255;
    const b = (color & 0xff) / 255;

    const a = [r, g, b].map((v) => {
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });

    const a0 = a[0] ?? 0;
    const a1 = a[1] ?? 0;
    const a2 = a[2] ?? 0;

    return 0.2126 * a0 + 0.7152 * a1 + 0.0722 * a2;
  }

  /**
   * Get a color from the current theme
   */
  public getColor(colorName: keyof ThemeConfig['colors']): number | GradientPalette | ShadowConfig {
    return this.currentTheme.colors[colorName] as number | GradientPalette | ShadowConfig;
  }

  /**
   * Get a font from the current theme
   */
  public getFont(fontName: keyof ThemeConfig['fonts']): string {
    return this.currentTheme.fonts[fontName];
  }

  /**
   * Get spacing value from the current theme
   */
  public getSpacing(spacingName: keyof ThemeConfig['spacing']): number {
    return this.currentTheme.spacing[spacingName];
  }

  /**
   * Get animation config from the current theme
   */
  public getAnimation(animationName: keyof ThemeConfig['animations']): number | string | AnimationPresets {
    return this.currentTheme.animations[animationName] as number | string | AnimationPresets;
  }

  /**
   * Apply theme to a text object
   */
  public applyThemeToText(
    textObject: Phaser.GameObjects.Text,
    options: {
      color?: keyof ThemeConfig['colors'];
      font?: keyof ThemeConfig['fonts'];
      fontSize?: number;
      stroke?: boolean;
      shadow?: boolean;
    } = {},
  ): void {
    const theme = this.currentTheme;
    const style: Phaser.Types.GameObjects.Text.TextStyle = {};

    // Set font family
    if (options.font) {
      style.fontFamily = theme.fonts[options.font];
    }

    // Set font size
    if (options.fontSize) {
      style.fontSize = `${options.fontSize}px`;
    }

    // Set color
    if (options.color) {
      style.color = '#' + theme.colors[options.color].toString(16).padStart(6, '0');
    }

    // Apply stroke if requested
    if (options.stroke) {
      style.stroke = '#000000';
      style.strokeThickness = 3;
    }

    // Apply shadow if requested
    if (options.shadow) {
      style.shadow = {
        offsetX: 2,
        offsetY: 2,
        color: '#000000',
        blur: 4,
        stroke: false,
        fill: true,
      };
    }

    textObject.setStyle(style);
  }

  /**
   * Apply theme to a rectangle (background/border)
   */
  public applyThemeToRectangle(
    rectangle: Phaser.GameObjects.Rectangle,
    options: {
      fillColor?: keyof ThemeConfig['colors'];
      borderColor?: keyof ThemeConfig['colors'];
      borderWidth?: number;
      alpha?: number;
    } = {},
  ): void {
    const theme = this.currentTheme;

    // Set fill color
    if (options.fillColor) {
      const fillColor = theme.colors[options.fillColor];
      if (typeof fillColor === 'number') {
        rectangle.setFillStyle(fillColor, options.alpha ?? 1);
      }
    }

    // Set border
    if (options.borderColor && options.borderWidth) {
      const borderColor = theme.colors[options.borderColor];
      if (typeof borderColor === 'number') {
        rectangle.setStrokeStyle(options.borderWidth, borderColor);
      }
    }
  }

  /**
   * Create a themed text object
   */
  public createThemedText(
    scene: Scene,
    x: number,
    y: number,
    text: string,
    options: {
      color?: keyof ThemeConfig['colors'];
      font?: keyof ThemeConfig['fonts'];
      fontSize?: number;
      stroke?: boolean;
      shadow?: boolean;
    } = {},
  ): Phaser.GameObjects.Text {
    const textObject = scene.add.text(x, y, text);
    this.applyThemeToText(textObject, options);
    return textObject;
  }

  /**
   * Create a themed rectangle
   */
  public createThemedRectangle(
    scene: Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    options: {
      fillColor?: keyof ThemeConfig['colors'];
      borderColor?: keyof ThemeConfig['colors'];
      borderWidth?: number;
      alpha?: number;
    } = {},
  ): Phaser.GameObjects.Rectangle {
    const rectangle = scene.add.rectangle(x, y, width, height);
    this.applyThemeToRectangle(rectangle, options);
    return rectangle;
  }

  /**
   * Get theme-aware animation config
   */
  public getAnimationConfig(): {
    duration: number;
    easing: string;
    hoverScale: number;
    pressScale: number;
    } {
    return {
      duration: this.currentTheme.animations.duration,
      easing: this.currentTheme.animations.easing,
      hoverScale: this.currentTheme.animations.hoverScale,
      pressScale: this.currentTheme.animations.pressScale,
    };
  }

  /**
   * Reset to default theme
   */
  public resetToDefault(): void {
    this.currentTheme = DARK_GOTHIC_THEME;
  }
}

/**
 * Export singleton instance getter for convenience
 */
export const getThemeManager = (): ThemeManager => ThemeManager.getInstance();
