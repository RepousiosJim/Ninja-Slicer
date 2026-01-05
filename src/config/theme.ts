/**
 * Ninja Slicer - Dark Gothic Theme Configuration
 * Complete theme system with all color palette, typography, spacing, and animation constants
 */

import type { ThemeConfig, DashboardCardConfig, BackgroundLayerConfig } from '../config/types';

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

    // Gradient Definitions
    gradients: {
      primaryGradient: {
        start: 0x8b0000, // Dark red
        end: 0x5a0000, // Darker red
        angle: 90, // Vertical gradient
      },
      secondaryGradient: {
        start: 0x4a0080, // Dark purple
        end: 0x2a0050, // Darker purple
        angle: 90,
      },
      cardGradient: {
        start: 0x2a2a4a, // Current card bg
        end: 0x1a1a2e, // Darker variant
        angle: 135, // Diagonal
      },
      backgroundGradient: {
        start: 0x0a0a1e, // Very dark blue-gray
        end: 0x1a1a2e, // Current background
        angle: 180, // Bottom to top
      },
      glowGradient: {
        start: { color: 0xffd700, alpha: 0.6 }, // Gold glow
        end: { color: 0xff8c00, alpha: 0 }, // Orange fade
      },
    },

    // Shadow/Depth colors
    shadows: {
      deep: 0x000000,
      medium: 0x0a0a0a,
      light: 0x1a1a1a,
    },
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
    hoverScale: 1.05, // Increased from 1.02
    pressScale: 0.95, // Decreased from 0.98

    // Enhanced animation presets
    presets: {
      cardEntrance: {
        duration: 600,
        easing: 'Back.easeOut',
        from: { alpha: 0, scale: 0.8, y: 50 },
        to: { alpha: 1, scale: 1, y: 0 },
      },
      cardHover: {
        duration: 200,            // ENHANCED: from 300 to 200 (snappier response)
        easing: 'Back.easeOut',   // ENHANCED: from 'Power2.easeOut' (more bounce)
        scale: 1.05,
        y: -8, // Lift effect
        shadow: { blur: 20 }, // Enhanced shadow
      },
      buttonPress: {
        duration: 100,
        easing: 'Power2.easeIn',
        scale: 0.95,
        brightness: 0.85,
      },
      glowPulse: {
        duration: 2000,
        easing: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
        alpha: { from: 0.6, to: 1.0 },
      },
      staggerDelay: 100, // Delay between staggered elements
    },
  },

  // Visual effects configuration
  effects: {
    glow: {
      intensity: 8, // Blur radius for glow
      color: 0xffd700, // Gold glow
      innerAlpha: 0.8, // Inner glow strength
      outerAlpha: 0.3, // Outer glow strength
    },
    shadow: {
      offsetX: 4,
      offsetY: 6,
      blur: 12,
      color: 'rgba(0,0,0,0.9)',
      spread: 2, // Shadow spread
    },
    particles: {
      soulWisp: {
        color: 0xffd700,
        count: 30,
        speed: { min: -20, max: 20 },
        lifespan: 4000,
        scale: { start: 0.3, end: 0 },
        alpha: { start: 0.6, end: 0 },
        frequency: 200,
      },
      ember: {
        color: 0xff4500,
        count: 20,
        speed: { min: -10, max: 10 },
        lifespan: 3000,
        scale: { start: 0.2, end: 0 },
        alpha: { start: 0.8, end: 0 },
        frequency: 300,
      },
      mist: {
        color: 0x4a0080,
        count: 15,
        speed: { min: -5, max: 5 },
        lifespan: 6000,
        scale: { start: 1.0, end: 0.5 },
        alpha: { start: 0.3, end: 0 },
        frequency: 500,
      },
    },
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
 * Card Dashboard Configuration
 * New constants for card-based main menu layout
 */
export const DASHBOARD_CARD_CONFIG: DashboardCardConfig = {
  // Card dimensions (serve as maximum, will scale down for smaller screens)
  width: 380,
  height: 280,
  minWidth: 200,    // NEW - minimum card width
  maxWidth: 380,    // NEW - maximum card width
  minHeight: 150,   // NEW - minimum card height
  maxHeight: 280,   // NEW - maximum card height

  // Layout
  columns: 3,
  rows: 2,
  gap: 20,
  minGap: 10,       // NEW - minimum gap for small screens
  maxGap: 20,       // NEW - maximum gap for large screens
  adaptiveLayout: true,  // NEW - enable responsive grid layout

  // Visual style
  borderRadius: 12,
  borderWidth: 3,
  innerPadding: 20,

  // Animation (constrained to prevent overflow)
  hoverLift: -8,     // REDUCED from -12 to prevent viewport overflow
  hoverScale: 1.02,   // REDUCED from 1.03 for better control
  hoverGlowIntensity: 15,

  // NEW - Magnetic hover configuration
  magneticHoverStrength: 15, // pixels of pull
  magneticHoverSmoothness: 0.1, // interpolation factor (0-1)
  magneticHoverMaxOffset: 20, // max pixels offset

  // Content
  iconSize: 80,
  titleFontSize: 28,
  descriptionFontSize: 16,
  statFontSize: 14,
} as const;

/**
 * Layered Background Configuration
 */
export const BACKGROUND_LAYERS: Record<string, BackgroundLayerConfig> = {
  base: {
    type: 'gradient',
    colors: [0x0a0a1e, 0x1a1a2e],
    angle: 180,
  },
  particles: {
    type: 'particles',
    enabled: true,
    types: ['soulWisp', 'ember', 'mist'],
  },
  vignette: {
    type: 'vignette',
    enabled: true,
    color: 0x000000,
    alpha: 0.5,
    radius: 0.7,
  },
  overlay: {
    type: 'overlay',
    enabled: true,
    texture: 'noise', // Subtle noise texture
    alpha: 0.1,
    blend: 'overlay',
  },
} as const;

/**
 * Export the default theme
 */
export const DEFAULT_THEME = DARK_GOTHIC_THEME;

/**
 * Toast Notification Styles
 * Configuration for different toast notification types
 */
export const TOAST_STYLES = {
  info: {
    backgroundColor: DARK_GOTHIC_THEME.colors.background,
    textColor: DARK_GOTHIC_THEME.colors.text,
    borderColor: DARK_GOTHIC_THEME.colors.ghostlyBlue,
    icon: 'ℹ️',
  },
  success: {
    backgroundColor: DARK_GOTHIC_THEME.colors.background,
    textColor: DARK_GOTHIC_THEME.colors.text,
    borderColor: DARK_GOTHIC_THEME.colors.success,
    icon: '✓',
  },
  warning: {
    backgroundColor: DARK_GOTHIC_THEME.colors.background,
    textColor: DARK_GOTHIC_THEME.colors.text,
    borderColor: DARK_GOTHIC_THEME.colors.warning,
    icon: '⚠️',
  },
  error: {
    backgroundColor: DARK_GOTHIC_THEME.colors.background,
    textColor: DARK_GOTHIC_THEME.colors.text,
    borderColor: DARK_GOTHIC_THEME.colors.danger,
    icon: '✕',
  },
} as const;
