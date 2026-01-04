/**
 * Base Component Class
 * Provides common functionality for all UI components
 * Standardizes interactivity, lifecycle, and cleanup
 */

import Phaser from 'phaser';

export interface ComponentConfig {
  x: number;
  y: number;
  width?: number;
  height?: number;
  interactive?: boolean;
  cursor?: string;
}

/**
 * Base Component Class
 * Provides common functionality for all UI components
 * Standardizes interactivity, lifecycle, and cleanup
 * 
 * @example
 * ```typescript
 * class MyButton extends BaseComponent {
 *   protected createContent(): void {
 *     this.add.text(0, 0, 'Click me');
 *   }
 * }
 * ```
 */
export abstract class BaseComponent extends Phaser.GameObjects.Container {
  protected isHovered: boolean = false;
  protected isPressed: boolean = false;
  protected isDisabled: boolean = false;
  protected baseX: number = 0;
  protected baseY: number = 0;
  protected hoverTween?: Phaser.Tweens.Tween;
  protected pressTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, config: ComponentConfig) {
    super(scene, config.x, config.y);
    this.baseX = config.x;
    this.baseY = config.y;

    this.createContent();

    if (config.interactive !== false) {
      this.setupInteractivity();
    }
  }

  /**
   * Create component content - override in subclasses
   */
  protected abstract createContent(): void;

  /**
   * Setup interactivity (hover, click)
   */
  protected setupInteractivity(): void {
    this.setSize(
      this.width || 100,
      this.height || 50,
    );

    this.setInteractive({
      useHandCursor: true,
    });

    this.on('pointerover', this.onHoverStart, this);
    this.on('pointerout', this.onHoverEnd, this);
    this.on('pointerdown', this.onPointerDown, this);
    this.on('pointerup', this.onPointerUp, this);
  }

  /**
   * Handle hover start
   */
  protected onHoverStart(): void {
    if (this.isDisabled || this.isHovered) return;
    this.isHovered = true;

    if (this.hoverTween) {
      this.hoverTween.stop();
    }

    this.onHoverEnter();
  }

  /**
   * Handle hover end
   */
  protected onHoverEnd(): void {
    if (!this.isHovered) return;
    this.isHovered = false;

    if (this.hoverTween) {
      this.hoverTween.stop();
    }

    this.onHoverLeave();
  }

  /**
   * Handle pointer down
   */
  protected onPointerDown(): void {
    if (this.isDisabled) return;
    this.isPressed = true;
    this.onPress();
  }

  /**
   * Handle pointer up
   */
  protected onPointerUp(): void {
    if (this.isDisabled) return;
    
    if (this.isPressed) {
      this.isPressed = false;
      this.onClick();
    }
  }

  /**
   * Hover enter - override in subclasses
   */
  protected onHoverEnter(): void {
    // Override for custom hover behavior
  }

  /**
   * Hover leave - override in subclasses
   */
  protected onHoverLeave(): void {
    // Override for custom hover behavior
  }

  /**
   * Press - override in subclasses
   */
  protected onPress(): void {
    // Override for custom press behavior
  }

  /**
   * Click - override in subclasses
   */
  protected onClick(): void {
    // Override for custom click behavior
  }

  /**
   * Disable component
   */
  public disable(): void {
    this.isDisabled = true;
    this.disableInteractive();
    this.setAlpha(0.5);
  }

  /**
   * Enable component
   */
  public enable(): void {
    this.isDisabled = false;
    this.setInteractive({
      useHandCursor: true,
    });
    this.setAlpha(1);
  }

  /**
   * Update component position
   */
  public updatePosition(x: number, y: number): void {
    this.baseX = x;
    this.baseY = y;

    if (this.isHovered) {
      this.x = x;
      this.y = y;
    } else {
      this.x = x;
      this.y = y;
    }
  }

  /**
   * Cleanup component
   */
  public destroy(fromScene?: boolean): void {
    if (this.hoverTween) {
      this.hoverTween.stop();
      this.hoverTween = undefined;
    }

    if (this.pressTween) {
      this.pressTween.stop();
      this.pressTween = undefined;
    }

    this.off('pointerover');
    this.off('pointerout');
    this.off('pointerdown');
    this.off('pointerup');

    super.destroy(fromScene);
  }

  /**
   * Fade in animation
   */
  public fadeIn(duration: number = 300): void {
    this.setAlpha(0);
    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      duration,
      ease: 'Power2.easeOut',
    });
  }

  /**
   * Fade out animation
   */
  public fadeOut(duration: number = 300, callback?: () => void): void {
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration,
      ease: 'Power2.easeIn',
      onComplete: callback,
    });
  }

  /**
   * Scale in animation
   */
  public scaleIn(targetScale: number = 1, duration: number = 300): void {
    this.setScale(0);
    this.scene.tweens.add({
      targets: this,
      scale: targetScale,
      duration,
      ease: 'Back.easeOut',
    });
  }

  /**
   * Scale out animation
   */
  public scaleOut(duration: number = 300, callback?: () => void): void {
    this.scene.tweens.add({
      targets: this,
      scale: 0,
      duration,
      ease: 'Back.easeIn',
      onComplete: callback,
    });
  }

  /**
   * Pulse animation
   */
  public pulse(duration: number = 1000, scale: number = 1.1): void {
    this.scene.tweens.add({
      targets: this,
      scale,
      duration,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Shake animation
   */
  public shake(intensity: number = 5, duration: number = 100): void {
    const originalX = this.x;
    const originalY = this.y;

    this.scene.tweens.add({
      targets: this,
      x: {
        value: [
          originalX - intensity,
          originalX + intensity,
          originalX,
        ],
      },
      y: {
        value: [
          originalY - intensity,
          originalY + intensity,
          originalY,
        ],
      },
      duration,
      ease: 'Sine.easeInOut',
    });
  }
}
