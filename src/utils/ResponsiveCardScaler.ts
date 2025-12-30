/**
 * ResponsiveCardScaler
 *
 * Dynamically calculates optimal card dimensions and grid layout
 * based on available viewport space. Ensures cards never overflow.
 */

import { DashboardCardConfig } from '../config/types';

export interface ScalerInput {
  viewportWidth: number;
  viewportHeight: number;
  logoHeight: number;
  soulsHeight: number;
  baseConfig: DashboardCardConfig;
}

export interface ScaledCardConfig {
  width: number;
  height: number;
  columns: number;
  rows: number;
  gap: number;
  hoverLift: number;
  hoverScale: number;
}

export class ResponsiveCardScaler {
  /**
   * Calculate optimal card configuration for given viewport
   */
  static getOptimalCardConfig(input: ScalerInput): ScaledCardConfig {
    const { viewportWidth, viewportHeight, logoHeight, soulsHeight, baseConfig } = input;

    // Calculate available space (with safety margins)
    const horizontalMargin = 40; // 20px per side
    const verticalMargin = 40; // 20px top and bottom
    const safetyMargin = 1.2; // 20% extra space for animations and safety

    const availableWidth = viewportWidth - horizontalMargin;
    const availableHeight = (viewportHeight - logoHeight - soulsHeight - verticalMargin);

    // Determine grid layout based on available width
    let columns: number;
    let rows: number;

    if (availableWidth >= 1140) {
      // Large screens: 3×2 layout
      columns = 3;
      rows = 2;
    } else if (availableWidth >= 780 && availableHeight >= 900) {
      // Medium screens with good height: 2×3 layout
      columns = 2;
      rows = 3;
    } else if (availableWidth >= 780) {
      // Medium screens with limited height: 2×2 layout (show 4 cards)
      columns = 2;
      rows = 2;
    } else {
      // Small screens: 1×6 vertical layout (or 1×4 if space limited)
      columns = 1;
      rows = availableHeight >= 900 ? 6 : 4;
    }

    // Calculate maximum card dimensions that fit
    const minGap = baseConfig.minGap || 10;
    const maxGap = baseConfig.maxGap || 20;

    // Calculate gap based on available space
    const gap = Math.max(minGap, Math.min(maxGap, availableWidth * 0.015));

    // Calculate card size to fit in available space
    const maxCardWidth = (availableWidth - (columns - 1) * gap) / columns;
    const maxCardHeight = (availableHeight / safetyMargin - (rows - 1) * gap) / rows;

    // Constrain to min/max values
    const minWidth = baseConfig.minWidth || 200;
    const maxWidth = baseConfig.maxWidth || 380;
    const minHeight = baseConfig.minHeight || 150;
    const maxHeight = baseConfig.maxHeight || 280;

    const cardWidth = Math.max(minWidth, Math.min(maxWidth, maxCardWidth));
    const cardHeight = Math.max(minHeight, Math.min(maxHeight, maxCardHeight));

    // Maintain aspect ratio approximately (380:280 = 1.357)
    const targetRatio = 1.357;
    const actualRatio = cardWidth / cardHeight;

    let finalWidth = cardWidth;
    let finalHeight = cardHeight;

    // Adjust to maintain ratio if space allows
    if (actualRatio > targetRatio) {
      // Too wide, reduce width
      finalWidth = Math.min(cardWidth, cardHeight * targetRatio);
    } else if (actualRatio < targetRatio) {
      // Too tall, reduce height
      finalHeight = Math.min(cardHeight, cardWidth / targetRatio);
    }

    // Scale hover effects proportionally
    const scaleFactor = finalWidth / maxWidth;
    const hoverLift = (baseConfig.hoverLift || -12) * scaleFactor;
    const hoverScale = 1 + ((baseConfig.hoverScale || 1.03) - 1) * scaleFactor;

    return {
      width: Math.round(finalWidth),
      height: Math.round(finalHeight),
      columns,
      rows,
      gap: Math.round(gap),
      hoverLift: Math.round(hoverLift),
      hoverScale: Math.round(hoverScale * 100) / 100,
    };
  }

  /**
   * Calculate adaptive logo height based on screen size
   */
  static getAdaptiveLogoHeight(screenHeight: number, basePadding: number): number {
    if (screenHeight < 600) {
      return basePadding * 2; // Very small screens
    } else if (screenHeight < 700) {
      return basePadding * 2.5; // Small screens
    } else if (screenHeight < 900) {
      return basePadding * 3.5; // Medium screens
    } else {
      return basePadding * 4; // Large screens
    }
  }

  /**
   * Calculate safe logo floating animation range
   */
  static getAdaptiveFloatRange(screenHeight: number): number {
    if (screenHeight < 600) {
      return 3; // Minimal float on tiny screens
    } else if (screenHeight < 700) {
      return 5; // Small float
    } else {
      return 8; // Normal float
    }
  }
}
