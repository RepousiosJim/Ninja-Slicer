/**
 * ResponsiveUtils
 *
 * Helper utilities for responsive UI positioning and sizing
 */

import { GAME_WIDTH, GAME_HEIGHT } from '@config/constants';

export class ResponsiveUtils {
  private static currentUIScale: 'small' | 'medium' | 'large' = 'medium';

  /**
   * Set UI scale globally
   */
  static setUIScale(scale: 'small' | 'medium' | 'large'): void {
    this.currentUIScale = scale;
  }

  /**
   * Get UI scale multiplier
   */
  static getUIScaleMultiplier(): number {
    switch (this.currentUIScale) {
    case 'small':
      return 0.85;
    case 'medium':
      return 1.0;
    case 'large':
      return 1.15;
    default:
      return 1.0;
    }
  }

  /**
   * Get current UI scale
   */
  static getUIScale(): 'small' | 'medium' | 'large' {
    return this.currentUIScale;
  }

  /**
   * Get current screen size category
   */
  static getScreenSize(): 'mobile' | 'tablet' | 'desktop' | 'large-desktop' {
    const width = window.innerWidth;

    if (width < 768) {
      return 'mobile';
    } else if (width < 1024) {
      return 'tablet';
    } else if (width < 1920) {
      return 'desktop';
    } else {
      return 'large-desktop';
    }
  }

  /**
   * Get current screen orientation
   */
  static getOrientation(): 'portrait' | 'landscape' {
    return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  }

  /**
   * Check if screen is small (mobile in portrait or narrow)
   */
  static isSmallScreen(): boolean {
    return window.innerWidth < 768 || (this.isMobile() && this.getOrientation() === 'portrait');
  }

  /**
   * Get actual viewport dimensions
   */
  static getViewportSize(): { width: number; height: number } {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }

  /**
   * Get responsive position based on percentage of screen
   */
  static getX(percent: number): number {
    return GAME_WIDTH * (percent / 100);
  }

  static getY(percent: number): number {
    return GAME_HEIGHT * (percent / 100);
  }

  /**
   * Get responsive padding/margin
   */
  static getPadding(size: 'small' | 'medium' | 'large'): number {
    const scale = this.getUIScaleMultiplier();
    const basePadding = GAME_WIDTH * 0.015; // 1.5% of screen width

    let padding = basePadding;
    switch (size) {
    case 'small':
      padding = basePadding;
      break;
    case 'medium':
      padding = basePadding * 1.5;
      break;
    case 'large':
      padding = basePadding * 2;
      break;
    default:
      padding = basePadding;
    }

    return Math.floor(padding * scale);
  }

  /**
   * Get responsive font size
   */
  static getFontSize(size: 'small' | 'medium' | 'large' | 'xlarge' | 'title'): number {
    const scale = this.getUIScaleMultiplier();
    const baseFontSize = GAME_WIDTH * 0.02; // 2% of screen width

    let fontSize = baseFontSize;
    switch (size) {
    case 'small':
      fontSize = baseFontSize * 0.8;
      break;
    case 'medium':
      fontSize = baseFontSize;
      break;
    case 'large':
      fontSize = baseFontSize * 1.5;
      break;
    case 'xlarge':
      fontSize = baseFontSize * 2;
      break;
    case 'title':
      fontSize = baseFontSize * 2.5;
      break;
    default:
      fontSize = baseFontSize;
    }

    return Math.floor(fontSize * scale);
  }

  /**
   * Get minimum touch target size (44x44 for mobile)
   */
  static getMinTouchSize(): number {
    return Math.max(44, GAME_WIDTH * 0.04); // At least 44px or 4% of width
  }

  /**
   * Check if device is mobile (touch-enabled)
   */
  static isMobile(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * Get safe area insets (for notched devices)
   */
  static getSafeAreaInsets() {
    return {
      top: 20,    // Default safe area
      right: 20,
      bottom: 20,
      left: 20,
    };
  }

  /**
   * Convert design coordinates to responsive coordinates
   * Assumes design was created at 1280x720
   */
  static toResponsive(x: number, y: number): { x: number; y: number } {
    return {
      x: (x / 1280) * GAME_WIDTH,
      y: (y / 720) * GAME_HEIGHT,
    };
  }

  /**
   * Get responsive button size
   * NOTE: All buttons now return the same size (uniform) - only UI scale affects size
   */
  static getButtonSize(size?: 'small' | 'medium' | 'large'): { width: number; height: number } {
    const scale = this.getUIScaleMultiplier();
    const baseWidth = GAME_WIDTH * 0.15;  // ~192px at 1280
    const baseHeight = GAME_HEIGHT * 0.08; // ~58px at 720

    // All buttons same size, only scale changes
    return {
      width: Math.floor(baseWidth * scale),
      height: Math.floor(baseHeight * scale),
    };
  }
}
