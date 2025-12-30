/**
 * UITheme
 *
 * Provides consistent UI component creation across all scenes
 * Uses DARK_GOTHIC_THEME and ResponsiveUtils for unified styling
 */

import Phaser from 'phaser';
import { DARK_GOTHIC_THEME } from '@config/theme';
import { FONT_SIZES, GAME_WIDTH, GAME_HEIGHT } from '@config/constants';
import { ResponsiveUtils } from './ResponsiveUtils';
import { formatNumber } from './helpers';

export class UITheme {
  /**
   * Create a styled panel with optional title
   */
  static createPanel(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    title?: string,
  ): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);

    // Panel background
    const background = scene.add.rectangle(0, 0, width, height, 0x2a2a4a, 0.9);
    background.setStrokeStyle(3, DARK_GOTHIC_THEME.colors.accent, 0.5);
    container.add(background);

    // Title if provided
    if (title) {
      const titleText = scene.add.text(0, -height / 2 + 20, title, {
        fontFamily: DARK_GOTHIC_THEME.fonts.primary,
        fontSize: `${ResponsiveUtils.getFontSize('medium')}px`,
        color: '#' + DARK_GOTHIC_THEME.colors.accent.toString(16).padStart(6, '0'),
        fontStyle: 'bold',
      });
      titleText.setOrigin(0.5, 0);
      container.add(titleText);
    }

    return container;
  }

  /**
   * Create a section header with underline
   */
  static createSectionHeader(
    scene: Phaser.Scene,
    text: string,
    x: number = 0,
    y: number = 0,
  ): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);
    const fontSize = ResponsiveUtils.getFontSize('large');

    const headerText = scene.add.text(0, 0, text, {
      fontFamily: DARK_GOTHIC_THEME.fonts.primary,
      fontSize: `${fontSize}px`,
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });
    headerText.setOrigin(0.5, 0.5);
    container.add(headerText);

    // Underline
    const underline = scene.add.graphics();
    underline.lineStyle(2, DARK_GOTHIC_THEME.colors.accent, 1);
    underline.beginPath();
    underline.moveTo(-100, fontSize / 2 + 5);
    underline.lineTo(100, fontSize / 2 + 5);
    underline.strokePath();
    container.add(underline);

    return container;
  }

  /**
   * Create a cost display with soul icon
   */
  static createCostDisplay(
    scene: Phaser.Scene,
    amount: number,
    affordable: boolean,
    x: number = 0,
    y: number = 0,
  ): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);
    const fontSize = ResponsiveUtils.getFontSize('medium');

    // Background
    const bgColor = affordable ? 0x2a4a2a : 0x4a2a2a;
    const background = scene.add.rectangle(0, 0, 120, 40, bgColor, 0.9);
    background.setStrokeStyle(2, affordable ? 0x00ff00 : 0xff0000, 0.8);
    container.add(background);

    // Soul icon
    const soulIcon = scene.add.text(-45, 0, '💀', {
      fontSize: `${fontSize}px`,
    });
    soulIcon.setOrigin(0.5, 0.5);
    container.add(soulIcon);

    // Cost amount
    const costText = scene.add.text(10, 0, formatNumber(amount), {
      fontFamily: DARK_GOTHIC_THEME.fonts.monospace,
      fontSize: `${fontSize}px`,
      color: affordable ? '#00ff00' : '#ff8888',
      fontStyle: 'bold',
    });
    costText.setOrigin(0, 0.5);
    container.add(costText);

    return container;
  }

  /**
   * Create a stat display with label and value
   */
  static createStatDisplay(
    scene: Phaser.Scene,
    label: string,
    value: string | number,
    icon?: string,
    x: number = 0,
    y: number = 0,
  ): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);
    const fontSize = ResponsiveUtils.getFontSize('small');

    let offsetX = 0;

    // Icon if provided
    if (icon) {
      const iconText = scene.add.text(0, 0, icon, {
        fontSize: `${fontSize * 1.5}px`,
      });
      iconText.setOrigin(0, 0.5);
      container.add(iconText);
      offsetX = 30;
    }

    // Label
    const labelText = scene.add.text(offsetX, 0, label + ':', {
      fontFamily: DARK_GOTHIC_THEME.fonts.secondary,
      fontSize: `${fontSize}px`,
      color: '#aaaaaa',
    });
    labelText.setOrigin(0, 0.5);
    container.add(labelText);

    // Value
    const valueText = scene.add.text(offsetX + labelText.width + 10, 0, value.toString(), {
      fontFamily: DARK_GOTHIC_THEME.fonts.monospace,
      fontSize: `${fontSize}px`,
      color: '#ffffff',
      fontStyle: 'bold',
    });
    valueText.setOrigin(0, 0.5);
    container.add(valueText);

    return container;
  }

  /**
   * Create souls balance display
   */
  static createSoulsBalance(
    scene: Phaser.Scene,
    souls: number,
    x: number,
    y: number,
  ): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);
    const fontSize = ResponsiveUtils.getFontSize('large');

    // Background
    const background = scene.add.rectangle(0, 0, 200, 50, 0x2a2a4a, 0.9);
    background.setStrokeStyle(2, DARK_GOTHIC_THEME.colors.accent, 0.6);
    container.add(background);

    // Soul icon
    const soulIcon = scene.add.text(-70, 0, '💀', {
      fontSize: `${fontSize}px`,
    });
    soulIcon.setOrigin(0.5, 0.5);
    container.add(soulIcon);

    // Souls text
    const soulsText = scene.add.text(-30, 0, formatNumber(souls), {
      fontFamily: DARK_GOTHIC_THEME.fonts.monospace,
      fontSize: `${fontSize}px`,
      color: '#' + DARK_GOTHIC_THEME.colors.accent.toString(16).padStart(6, '0'),
      fontStyle: 'bold',
    });
    soulsText.setOrigin(0, 0.5);
    container.add(soulsText);

    return container;
  }

  /**
   * Create a max tier badge
   */
  static createMaxTierBadge(
    scene: Phaser.Scene,
    x: number,
    y: number,
  ): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);
    const fontSize = ResponsiveUtils.getFontSize('medium');

    // Badge background with glow
    const glow = scene.add.rectangle(0, 0, 150, 50, 0xffd700, 0.3);
    glow.setStrokeStyle(3, 0xffd700, 0.8);
    container.add(glow);

    const background = scene.add.rectangle(0, 0, 140, 45, 0x4a4a2a, 0.95);
    background.setStrokeStyle(2, 0xffd700, 1);
    container.add(background);

    // Text
    const text = scene.add.text(0, 0, 'MAX TIER', {
      fontFamily: DARK_GOTHIC_THEME.fonts.primary,
      fontSize: `${fontSize}px`,
      color: '#ffd700',
      fontStyle: 'bold',
    });
    text.setOrigin(0.5, 0.5);
    container.add(text);

    // Pulse animation
    scene.tweens.add({
      targets: glow,
      alpha: 0.6,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    return container;
  }

  /**
   * Create a lock overlay for locked content
   */
  static createLockOverlay(
    scene: Phaser.Scene,
    width: number,
    height: number,
    unlockCost: number,
    affordable: boolean,
  ): Phaser.GameObjects.Container {
    const container = scene.add.container(0, 0);

    // Dark overlay
    const overlay = scene.add.rectangle(0, 0, width, height, 0x000000, 0.7);
    container.add(overlay);

    // Lock icon (using text emoji for now)
    const lockIcon = scene.add.text(0, -30, '🔒', {
      fontSize: `${ResponsiveUtils.getFontSize('xlarge')}px`,
    });
    lockIcon.setOrigin(0.5, 0.5);
    container.add(lockIcon);

    // "LOCKED" text
    const lockedText = scene.add.text(0, 10, 'LOCKED', {
      fontFamily: DARK_GOTHIC_THEME.fonts.primary,
      fontSize: `${ResponsiveUtils.getFontSize('medium')}px`,
      color: '#ff8888',
      fontStyle: 'bold',
    });
    lockedText.setOrigin(0.5, 0.5);
    container.add(lockedText);

    // Cost display
    const costDisplay = UITheme.createCostDisplay(scene, unlockCost, affordable, 0, 50);
    container.add(costDisplay);

    return container;
  }

  /**
   * Create a tooltip
   */
  static createTooltip(
    scene: Phaser.Scene,
    text: string,
    x: number,
    y: number,
    maxWidth: number = 300,
  ): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);
    const fontSize = ResponsiveUtils.getFontSize('small');

    // Text
    const tooltipText = scene.add.text(0, 0, text, {
      fontFamily: DARK_GOTHIC_THEME.fonts.secondary,
      fontSize: `${fontSize}px`,
      color: '#ffffff',
      wordWrap: { width: maxWidth - 20 },
    });
    tooltipText.setOrigin(0.5, 0.5);

    const textBounds = tooltipText.getBounds();

    // Background
    const background = scene.add.rectangle(
      0,
      0,
      textBounds.width + 20,
      textBounds.height + 20,
      0x1a1a2e,
      0.95,
    );
    background.setStrokeStyle(2, DARK_GOTHIC_THEME.colors.accent, 0.8);

    container.add(background);
    container.add(tooltipText);
    container.setDepth(10000); // Always on top

    return container;
  }
}
