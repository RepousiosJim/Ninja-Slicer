/**
 * Ninja Slicer - Theme Utility Functions
 * Helper functions for working with the theme system
 */

import Phaser from 'phaser';
import { ThemeConfig, GradientPalette, ShadowConfig } from '../config/types';
import { DARK_GOTHIC_THEME } from '../config/theme';

/**
 * Convert a hex color number to CSS hex string
 */
export function hexToCssColor(hex: number): string {
  return '#' + hex.toString(16).padStart(6, '0');
}

/**
 * Convert a CSS hex string to hex number
 */
export function cssColorToHex(css: string): number {
  return parseInt(css.replace('#', ''), 16);
}

/**
 * Lighten a color by a percentage
 */
export function lightenColor(hex: number, percent: number): number {
  const r = ((hex >> 16) & 0xff);
  const g = ((hex >> 8) & 0xff);
  const b = (hex & 0xff);

  const newR = Math.min(255, Math.floor(r + (255 - r) * percent));
  const newG = Math.min(255, Math.floor(g + (255 - g) * percent));
  const newB = Math.min(255, Math.floor(b + (255 - b) * percent));

  return (newR << 16) | (newG << 8) | newB;
}

/**
 * Darken a color by a percentage
 */
export function darkenColor(hex: number, percent: number): number {
  const r = ((hex >> 16) & 0xff);
  const g = ((hex >> 8) & 0xff);
  const b = (hex & 0xff);

  const newR = Math.max(0, Math.floor(r * (1 - percent)));
  const newG = Math.max(0, Math.floor(g * (1 - percent)));
  const newB = Math.max(0, Math.floor(b * (1 - percent)));

  return (newR << 16) | (newG << 8) | newB;
}

/**
 * Get a color with alpha transparency
 */
export function getColorWithAlpha(hex: number, alpha: number): number {
  const r = ((hex >> 16) & 0xff);
  const g = ((hex >> 8) & 0xff);
  const b = (hex & 0xff);
  const a = Math.floor(alpha * 255);

  return (a << 24) | (r << 16) | (g << 8) | b;
}

/**
 * Create a gradient between two colors
 */
export function createGradient(
  startColor: number,
  endColor: number,
  steps: number,
): number[] {
  const gradient: number[] = [];
  const r1 = (startColor >> 16) & 0xff;
  const g1 = (startColor >> 8) & 0xff;
  const b1 = startColor & 0xff;
  const r2 = (endColor >> 16) & 0xff;
  const g2 = (endColor >> 8) & 0xff;
  const b2 = endColor & 0xff;

  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    gradient.push((r << 16) | (g << 8) | b);
  }

  return gradient;
}

/**
 * Get a theme color by name
 */
export function getThemeColor(colorName: keyof ThemeConfig['colors']): number | GradientPalette | ShadowConfig {
  return DARK_GOTHIC_THEME.colors[colorName] as number | GradientPalette | ShadowConfig;
}

/**
 * Get a theme font by name
 */
export function getThemeFont(fontName: keyof ThemeConfig['fonts']): string {
  return DARK_GOTHIC_THEME.fonts[fontName];
}

/**
 * Get theme spacing by name
 */
export function getThemeSpacing(spacingName: keyof ThemeConfig['spacing']): number {
  return DARK_GOTHIC_THEME.spacing[spacingName];
}

/**
 * Get theme animation config
 */
export function getThemeAnimationConfig(): {
  duration: number;
  easing: string;
  hoverScale: number;
  pressScale: number;
  } {
  return {
    duration: DARK_GOTHIC_THEME.animations.duration,
    easing: DARK_GOTHIC_THEME.animations.easing,
    hoverScale: DARK_GOTHIC_THEME.animations.hoverScale,
    pressScale: DARK_GOTHIC_THEME.animations.pressScale,
  };
}

/**
 * Apply theme to a Phaser text object
 */
export function applyThemeToText(
  textObject: Phaser.GameObjects.Text,
  options: {
    color?: keyof ThemeConfig['colors'];
    font?: keyof ThemeConfig['fonts'];
    fontSize?: number;
    stroke?: boolean;
    shadow?: boolean;
  } = {},
): void {
  const theme = DARK_GOTHIC_THEME;
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
    const color = theme.colors[options.color];
    if (typeof color === 'number') {
      style.color = hexToCssColor(color);
    }
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
 * Apply theme to a Phaser rectangle
 */
export function applyThemeToRectangle(
  rectangle: Phaser.GameObjects.Rectangle,
  options: {
    fillColor?: keyof ThemeConfig['colors'];
    borderColor?: keyof ThemeConfig['colors'];
    borderWidth?: number;
    alpha?: number;
  } = {},
): void {
  const theme = DARK_GOTHIC_THEME;

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
export function createThemedText(
  scene: Phaser.Scene,
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
  applyThemeToText(textObject, options);
  return textObject;
}

/**
 * Create a themed rectangle
 */
export function createThemedRectangle(
  scene: Phaser.Scene,
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
  applyThemeToRectangle(rectangle, options);
  return rectangle;
}

/**
 * Get button style based on type
 */
export function getButtonStyle(type: 'primary' | 'secondary' | 'danger' | 'disabled'): {
  backgroundColor: number;
  borderColor: number;
  textColor: number;
} {
  const theme = DARK_GOTHIC_THEME;

  switch (type) {
  case 'primary':
    return {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.accent,
      textColor: theme.colors.text,
    };
  case 'secondary':
    return {
      backgroundColor: theme.colors.secondary,
      borderColor: theme.colors.accent,
      textColor: theme.colors.text,
    };
  case 'danger':
    return {
      backgroundColor: theme.colors.danger,
      borderColor: theme.colors.primary,
      textColor: theme.colors.text,
    };
  case 'disabled':
    return {
      backgroundColor: 0x333333,
      borderColor: 0x333333,
      textColor: theme.colors.disabled,
    };
  }
}

/**
 * Get card style based on state
 */
export function getCardStyle(state: 'normal' | 'locked' | 'selected'): {
  backgroundColor: number;
  backgroundAlpha: number;
  borderColor: number;
  borderWidth: number;
} {
  const theme = DARK_GOTHIC_THEME;

  switch (state) {
  case 'normal':
    return {
      backgroundColor: 0x2a2a4a,
      backgroundAlpha: 0.9,
      borderColor: theme.colors.accent,
      borderWidth: 3,
    };
  case 'locked':
    return {
      backgroundColor: theme.colors.background,
      backgroundAlpha: 0.7,
      borderColor: theme.colors.disabled,
      borderWidth: 3,
    };
  case 'selected':
    return {
      backgroundColor: 0x2a2a4a,
      backgroundAlpha: 0.9,
      borderColor: theme.colors.success,
      borderWidth: 3,
    };
  }
}

/**
 * Get tier color based on rarity
 */
export function getTierColor(rarity: string): number {
  const tierColors: Record<string, number> = {
    common: 0x888888,
    uncommon: 0x00ff00,
    rare: 0x0088ff,
    epic: 0x8800ff,
    legendary: 0xffd700,
  };

  return tierColors[rarity] || 0x888888;
}

/**
 * Get monster type color
 */
export function getMonsterColor(monsterType: string): number {
  const monsterColors: Record<string, number> = {
    zombie: 0x44aa44,
    vampire: 0x6a0dad,
    ghost: 0x00a8cc,
    villager: 0xcccccc,
  };

  return monsterColors[monsterType] || 0x888888;
}

/**
 * Get element color
 */
export function getElementColor(element: string): number {
  const elementColors: Record<string, number> = {
    fire: 0xff4400,
    ice: 0x00ccff,
    lightning: 0xffff00,
    holy: 0xffffff,
    poison: 0x00ff00,
  };

  return elementColors[element] || 0x888888;
}
