/**
 * Ninja Slicer - Dark Gothic Theme Configuration
 * Complete theme system with all color palette, typography, spacing, and animation constants
 */

import { ThemeConfig } from '../config/types';

/**
 * Dark Gothic Theme Configuration
 * The primary theme for Ninja Slicer, featuring deep crimson, obsidian black,
 * blood red, and antique gold colors for a supernatural/horror aesthetic.
 */
export const DARK_GOTHIC_THEME: ThemeConfig = {
  colors: {
    // Primary Colors
    primary: 0x8b0000, // Dark Red - Main interactive elements
    secondary: 0x4a0080, // Dark Purple - Secondary elements and accents
    accent: 0xffd700, // Gold - Highlights, borders, and important UI elements
    background: 0x1a1a2e, // Dark Blue-Gray - Panel backgrounds and containers

    // Text Colors
    text: 0xffffff, // White - Main text color
    textSecondary: 0xcccccc, // Light Gray - Subtle text and descriptions
    disabled: 0x666666, // Dark Gray - Disabled or inactive text

    // State Colors
    danger: 0xff4444, // Bright Red - Error states, warnings, destructive actions
    success: 0x44ff44, // Bright Green - Success states, positive feedback
    warning: 0xffaa00, // Bright Orange - Warning states, cautionary messages

    // Extended Palette
    bloodRed: 0xb80000, // For health-related UI elements
    vampirePurple: 0x6a0dad, // For vampire-themed elements
    ghostlyBlue: 0x00a8cc, // For ghost-related elements
    demonGreen: 0x008000, // For demonic elements
    holyWhite: 0xf5f5f5, // For holy/blessed elements
  },

  fonts: {
    primary: 'Arial Black', // Bold, readable font for headings and important text
    secondary: 'Georgia', // Elegant serif font for descriptive text
    monospace: 'Courier New', // For code-like elements and stats
  },

  spacing: {
    unit: 8, // Base spacing unit - all spacing should be multiples of this
    small: 8, // Tight spacing for compact elements
    medium: 16, // Standard padding for most elements
    large: 24, // Comfortable spacing for important elements
    xlarge: 32, // Generous spacing for main containers
  },

  animations: {
    duration: 200, // Default animation duration in milliseconds
    easing: 'Power2', // Smooth acceleration/deceleration easing function
    hoverScale: 1.02, // Subtle enlargement on hover
    pressScale: 0.98, // Subtle compression on press
  },
};

/**
 * Font Sizes
 * Consistent font sizes across the theme
 */
export const FONT_SIZES = {
  small: 16, // Labels, captions, secondary information
  medium: 24, // Buttons, standard text, card titles
  large: 32, // Headings, important information
  xlarge: 48, // Main titles, scene headers
  title: 64, // Game title, major headings
} as const;

/**
 * Font Weights
 * Consistent font weights across the theme
 */
export const FONT_WEIGHTS = {
  regular: 400, // Standard text
  bold: 700, // Headings, important text
  black: 900, // Titles, critical emphasis
} as const;

/**
 * Text Effects
 * Visual effects applied to text for better readability and emphasis
 */
export const TEXT_EFFECTS = {
  stroke: {
    color: 0x000000,
    thickness: 3, // For better readability on dark backgrounds
  },
  shadow: {
    offsetX: 2,
    offsetY: 2,
    blur: 4,
    color: 'rgba(0,0,0,0.8)', // For depth and emphasis
  },
  glow: {
    color: 0xffd700,
    blur: 8, // For interactive elements on hover
  },
} as const;

/**
 * Button Styles
 * Predefined button styles for different button types
 */
export const BUTTON_STYLES = {
  primary: {
    backgroundColor: DARK_GOTHIC_THEME.colors.primary,
    borderColor: DARK_GOTHIC_THEME.colors.accent,
    textColor: DARK_GOTHIC_THEME.colors.text,
  },
  secondary: {
    backgroundColor: DARK_GOTHIC_THEME.colors.secondary,
    borderColor: DARK_GOTHIC_THEME.colors.accent,
    textColor: DARK_GOTHIC_THEME.colors.text,
  },
  danger: {
    backgroundColor: DARK_GOTHIC_THEME.colors.danger,
    borderColor: DARK_GOTHIC_THEME.colors.primary,
    textColor: DARK_GOTHIC_THEME.colors.text,
  },
  disabled: {
    backgroundColor: 0x333333,
    borderColor: 0x333333,
    textColor: DARK_GOTHIC_THEME.colors.disabled,
  },
} as const;

/**
 * Card Styles
 * Predefined card styles for different card states
 */
export const CARD_STYLES = {
  normal: {
    backgroundColor: 0x2a2a4a,
    backgroundAlpha: 0.9,
    borderColor: DARK_GOTHIC_THEME.colors.accent,
    borderWidth: 3,
  },
  locked: {
    backgroundColor: DARK_GOTHIC_THEME.colors.background,
    backgroundAlpha: 0.7,
    borderColor: DARK_GOTHIC_THEME.colors.disabled,
    borderWidth: 3,
  },
  selected: {
    backgroundColor: 0x2a2a4a,
    backgroundAlpha: 0.9,
    borderColor: DARK_GOTHIC_THEME.colors.success,
    borderWidth: 3,
  },
} as const;

/**
 * Panel Styles
 * Predefined panel styles for different panel types
 */
export const PANEL_STYLES = {
  default: {
    backgroundColor: DARK_GOTHIC_THEME.colors.background,
    backgroundAlpha: 0.95,
    borderColor: DARK_GOTHIC_THEME.colors.accent,
    borderWidth: 3,
    titleBarBackgroundColor: 0x2a2a4a,
  },
} as const;

/**
 * Progress Bar Styles
 * Predefined progress bar styles
 */
export const PROGRESS_BAR_STYLES = {
  background: {
    color: 0x333333,
    alpha: 1.0,
  },
  fill: {
    startColor: DARK_GOTHIC_THEME.colors.primary,
    endColor: DARK_GOTHIC_THEME.colors.danger,
  },
  border: {
    color: DARK_GOTHIC_THEME.colors.accent,
    width: 2,
  },
} as const;

/**
 * Stat Bar Styles
 * Predefined stat bar styles for different stat types
 */
export const STAT_BAR_STYLES = {
  background: {
    color: 0x000000,
    alpha: 0.5,
  },
  border: {
    color: DARK_GOTHIC_THEME.colors.accent,
    width: 1,
  },
  health: {
    color: DARK_GOTHIC_THEME.colors.bloodRed,
  },
  mana: {
    color: DARK_GOTHIC_THEME.colors.ghostlyBlue,
  },
  stamina: {
    color: DARK_GOTHIC_THEME.colors.vampirePurple,
  },
} as const;

/**
 * Tier Colors
 * Colors for weapon rarity tiers
 */
export const TIER_COLORS = {
  common: 0x888888, // Gray
  uncommon: 0x00ff00, // Green
  rare: 0x0088ff, // Blue
  epic: 0x8800ff, // Purple
  legendary: 0xffd700, // Gold
} as const;

/**
 * Monster Type Colors
 * Colors for different monster types
 */
export const MONSTER_COLORS = {
  zombie: 0x44aa44, // Green
  vampire: 0x6a0dad, // Purple
  ghost: 0x00a8cc, // Blue
  villager: 0xcccccc, // Light gray
} as const;

/**
 * Element Colors
 * Colors for elemental effects
 */
export const ELEMENT_COLORS = {
  fire: 0xff4400, // Orange-red
  ice: 0x00ccff, // Light blue
  lightning: 0xffff00, // Yellow
  holy: 0xffffff, // White
  poison: 0x00ff00, // Green
} as const;

/**
 * Export the default theme
 */
export const DEFAULT_THEME = DARK_GOTHIC_THEME;
