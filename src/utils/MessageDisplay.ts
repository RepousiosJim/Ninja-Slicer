/**
 * Message Display Utility
 * 
 * Provides reusable message display functionality across scenes.
 * Features fade-in/y animations with automatic cleanup.
 */

import Phaser from 'phaser';
import { FONT_SIZES, UI_ANIMATION_DURATION } from '../config/constants';

/**
 * Message display configuration
 */
export interface MessageDisplayConfig {
  /** Message text to display */
  text: string;
  /** Text color (hex or CSS color) */
  color?: string;
  /** Font size override */
  fontSize?: number;
  /** Font style (bold, italic, etc.) */
  fontStyle?: string;
  /** Stroke color */
  stroke?: string;
  /** Stroke thickness */
  strokeThickness?: number;
  /** Display duration in milliseconds */
  duration?: number;
  /** Fade in duration in milliseconds */
  fadeInDuration?: number;
  /** Y-axis offset from center */
  yOffset?: number;
  /** Animation ease function */
  ease?: string;
  /** Show yoyo effect */
  yoyo?: boolean;
  /** Hold duration before fade out */
  holdDuration?: number;
}

/**
 * Message type for common scenarios
 */
export enum MessageType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  NEUTRAL = 'neutral',
}

/**
 * Message display color mapping
 */
const MESSAGE_COLORS: Record<MessageType, string> = {
  [MessageType.SUCCESS]: '#44ff44',
  [MessageType.ERROR]: '#ff4444',
  [MessageType.WARNING]: '#ffaa00',
  [MessageType.INFO]: '#44aaff',
  [MessageType.NEUTRAL]: '#ffffff',
};

/**
 * Message Display Utility Class
 * Provides static methods for displaying temporary messages with animations
 */
export class MessageDisplay {
  /**
   * Show a message at the bottom of the screen with animation
   * @param scene - The scene to display the message in
   * @param text - The message text
   * @param color - Text color (hex or CSS color)
   * @param duration - Display duration in milliseconds
   */
  static show(
    scene: Phaser.Scene,
    text: string,
    color: string = '#ffffff',
    duration: number = 1500,
  ): Phaser.GameObjects.Text {
    return this.showAtPosition(
      scene,
      scene.cameras.main.width / 2,
      scene.cameras.main.height - 150,
      text,
      color,
      duration,
    );
  }

  /**
   * Show a message at a specific position
   * @param scene - The scene to display the message in
   * @param x - X position
   * @param y - Y position
   * @param text - The message text
   * @param color - Text color
   * @param duration - Display duration in milliseconds
   */
  static showAtPosition(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    color: string = '#ffffff',
    duration: number = 1500,
  ): Phaser.GameObjects.Text {
    const message = scene.add.text(x, y, text, {
      fontSize: `${FONT_SIZES.medium}px`,
      color: color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });

    message.setOrigin(0.5);
    message.setAlpha(0);

    scene.tweens.add({
      targets: message,
      alpha: 1,
      duration: UI_ANIMATION_DURATION,
      onComplete: () => {
        scene.tweens.add({
          targets: message,
          alpha: 0,
          duration: UI_ANIMATION_DURATION,
          delay: duration,
          yoyo: true,
          hold: duration,
          onComplete: () => {
            message.destroy();
          },
        });
      },
    });

    return message;
  }

  /**
   * Show a success message
   * @param scene - The scene to display the message in
   * @param text - The message text
   * @param duration - Display duration in milliseconds
   */
  static showSuccess(
    scene: Phaser.Scene,
    text: string = 'SUCCESS!',
    duration: number = 1500,
  ): Phaser.GameObjects.Text {
    return this.show(scene, text, MESSAGE_COLORS[MessageType.SUCCESS], duration);
  }

  /**
   * Show an error message
   * @param scene - The scene to display the message in
   * @param text - The message text
   * @param duration - Display duration in milliseconds
   */
  static showError(
    scene: Phaser.Scene,
    text: string = 'ERROR!',
    duration: number = 1500,
  ): Phaser.GameObjects.Text {
    return this.show(scene, text, MESSAGE_COLORS[MessageType.ERROR], duration);
  }

  /**
   * Show a warning message
   * @param scene - The scene to display the message in
   * @param text - The message text
   * @param duration - Display duration in milliseconds
   */
  static showWarning(
    scene: Phaser.Scene,
    text: string = 'WARNING!',
    duration: number = 1500,
  ): Phaser.GameObjects.Text {
    return this.show(scene, text, MESSAGE_COLORS[MessageType.WARNING], duration);
  }

  /**
   * Show an info message
   * @param scene - The scene to display the message in
   * @param text - The message text
   * @param duration - Display duration in milliseconds
   */
  static showInfo(
    scene: Phaser.Scene,
    text: string,
    duration: number = 1500,
  ): Phaser.GameObjects.Text {
    return this.show(scene, text, MESSAGE_COLORS[MessageType.INFO], duration);
  }

  /**
   * Show a message with full configuration
   * @param scene - The scene to display the message in
   * @param config - Message display configuration
   */
  static showWithConfig(
    scene: Phaser.Scene,
    config: MessageDisplayConfig,
  ): Phaser.GameObjects.Text {
    const {
      text,
      color = '#ffffff',
      fontSize,
      fontStyle,
      stroke = '#000000',
      strokeThickness = 4,
      duration = 1500,
      fadeInDuration = UI_ANIMATION_DURATION,
      yOffset = -150,
      ease = 'Power2',
      yoyo = true,
      holdDuration = 1500,
    } = config;

    const message = scene.add.text(
      scene.cameras.main.width / 2,
      scene.cameras.main.height + yOffset,
      text,
      {
        fontSize: fontSize ? `${fontSize}px` : `${FONT_SIZES.medium}px`,
        color: color,
        fontStyle: fontStyle,
        stroke: stroke,
        strokeThickness: strokeThickness,
      },
    );

    message.setOrigin(0.5);
    message.setAlpha(0);

    scene.tweens.add({
      targets: message,
      alpha: 1,
      duration: fadeInDuration,
      ease: ease,
    });

    scene.tweens.add({
      targets: message,
      alpha: 0,
      duration: fadeInDuration,
      delay: duration,
      yoyo: yoyo,
      hold: holdDuration,
      ease: ease,
      onComplete: () => {
        message.destroy();
      },
    });

    return message;
  }

  /**
   * Show a floating text that moves upward while fading out
   * @param scene - The scene to display the text in
   * @param x - X position
   * @param y - Y position
   * @param text - The text to display
   * @param color - Text color
   * @param fontSize - Font size in pixels
   * @param duration - Animation duration in milliseconds
   * @param floatDistance - Distance to float upward
   */
  static showFloatingText(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    color: string = '#ffffff',
    fontSize: number = 24,
    duration: number = 1000,
    floatDistance: number = 50,
  ): Phaser.GameObjects.Text {
    const textObj = scene.add.text(x, y, text, {
      fontSize: `${fontSize}px`,
      color: color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    });

    textObj.setOrigin(0.5);

    scene.tweens.add({
      targets: textObj,
      y: y - floatDistance,
      alpha: 0,
      duration: duration,
      ease: 'Quad.easeOut',
      onComplete: () => {
        textObj.destroy();
      },
    });

    return textObj;
  }

  /**
   * Show a critical hit notification
   * @param scene - The scene to display the notification in
   * @param x - X position
   * @param y - Y position
   */
  static showCriticalHit(
    scene: Phaser.Scene,
    x: number,
    y: number,
  ): Phaser.GameObjects.Text {
    return this.showFloatingText(scene, x, y, 'CRITICAL!', '#ff0000', 32);
  }

  /**
   * Show a shielded notification
   * @param scene - The scene to display the notification in
   * @param x - X position
   * @param y - Y position
   */
  static showShielded(
    scene: Phaser.Scene,
    x: number,
    y: number,
  ): Phaser.GameObjects.Text {
    return this.showFloatingText(scene, x, y, 'SHIELDED!', '#00ff00', 32);
  }

  /**
   * Show an equipped message
   * @param scene - The scene to display the message in
   */
  static showEquipped(scene: Phaser.Scene): Phaser.GameObjects.Text {
    return this.show(scene, 'WEAPON EQUIPPED!', '#44ff44');
  }

  /**
   * Show an unlocked message
   * @param scene - The scene to display the message in
   */
  static showUnlocked(scene: Phaser.Scene): Phaser.GameObjects.Text {
    return this.show(scene, 'WEAPON UNLOCKED!', '#ffd700');
  }

  /**
   * Show an upgraded message
   * @param scene - The scene to display the message in
   */
  static showUpgraded(scene: Phaser.Scene): Phaser.GameObjects.Text {
    return this.show(scene, 'WEAPON UPGRADED!', '#44aaff');
  }

  /**
   * Show an upgrade failed message
   * @param scene - The scene to display the message in
   */
  static showUpgradeFailed(scene: Phaser.Scene): Phaser.GameObjects.Text {
    return this.show(scene, 'UPGRADE FAILED', '#ff4444');
  }

  /**
   * Show a select weapon message
   * @param scene - The scene to display the message in
   */
  static showSelectWeapon(scene: Phaser.Scene): Phaser.GameObjects.Text {
    return this.show(scene, 'SELECT A WEAPON TO COMPARE', '#ffaa00');
  }

  /**
   * Show a select different weapon message
   * @param scene - The scene to display the message in
   */
  static showSelectDifferentWeapon(scene: Phaser.Scene): Phaser.GameObjects.Text {
    return this.show(scene, 'SELECT A DIFFERENT WEAPON TO COMPARE', '#ffaa00');
  }

  /**
   * Show an insufficient souls message
   * @param scene - The scene to display the message in
   */
  static showInsufficientSouls(scene: Phaser.Scene): Phaser.GameObjects.Text {
    return this.show(scene, 'NOT ENOUGH SOULS!', '#ff4444');
  }

  /**
   * Show a purchase successful message
   * @param scene - The scene to display the message in
   */
  static showPurchaseSuccess(scene: Phaser.Scene): Phaser.GameObjects.Text {
    return this.show(scene, 'PURCHASE SUCCESSFUL!', '#44ff44');
  }
}
