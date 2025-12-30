/**
 * Animation Manager
 *
 * Centralized animation system for smooth, performant animations
 * with proper easing functions and cleanup.
 */

import Phaser from 'phaser';

/**
 * Animation type enum
 */
export enum AnimationType {
  FADE_IN = 'fade_in',
  FADE_OUT = 'fade_out',
  SLIDE_IN_LEFT = 'slide_in_left',
  SLIDE_IN_RIGHT = 'slide_in_right',
  SLIDE_IN_TOP = 'slide_in_top',
  SLIDE_IN_BOTTOM = 'slide_in_bottom',
  SLIDE_OUT_LEFT = 'slide_out_left',
  SLIDE_OUT_RIGHT = 'slide_out_right',
  SLIDE_OUT_TOP = 'slide_out_top',
  SLIDE_OUT_BOTTOM = 'slide_out_bottom',
  SCALE_IN = 'scale_in',
  SCALE_OUT = 'scale_out',
  BOUNCE_IN = 'bounce_in',
  BOUNCE_OUT = 'bounce_out',
  FLIP_IN = 'flip_in',
  FLIP_OUT = 'flip_out',
  ROTATE_IN = 'rotate_in',
  ROTATE_OUT = 'rotate_out',
  SHAKE = 'shake',
  PULSE = 'pulse',
  GLOW = 'glow',
}

/**
 * Animation configuration
 */
export interface AnimationConfig {
  targets: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[];
  type: AnimationType;
  duration?: number;
  delay?: number;
  ease?: string;
  yoyo?: boolean;
  repeat?: number;
  hold?: number;
  onComplete?: () => void;
  onUpdate?: () => void;
  onStart?: () => void;
  props?: any;
}

/**
 * Active animation tracker
 */
interface ActiveAnimation {
  tween: Phaser.Tweens.Tween;
  targets: Phaser.GameObjects.GameObject[];
  onComplete?: () => void;
}

/**
 * Animation Manager
 */
export class AnimationManager {
  private scene: Phaser.Scene;
  private activeAnimations: Map<string, ActiveAnimation> = new Map();
  private animationIdCounter: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Play animation
   */
  public play(config: AnimationConfig): Phaser.Tweens.Tween | null {
    const animationId = `anim_${this.animationIdCounter++}`;
    const duration = config.duration || 300;
    const ease = config.ease || 'Power2';

    // Get tween configuration based on animation type
    const tweenConfig = this.getTweenConfig(config, duration, ease);

    // Create tween
    const tween = this.scene.tweens.add(tweenConfig);

    // Track animation
    const activeAnimation: ActiveAnimation = {
      tween,
      targets: Array.isArray(config.targets) ? config.targets : [config.targets],
      onComplete: config.onComplete,
    };

    this.activeAnimations.set(animationId, activeAnimation);

    // Clean up on complete
    tween.on('complete', () => {
      if (config.onComplete) {
        config.onComplete();
      }
      this.activeAnimations.delete(animationId);
    });

    return tween;
  }

  /**
   * Get tween configuration based on animation type
   */
  private getTweenConfig(
    config: AnimationConfig,
    duration: number,
    ease: string,
  ): Phaser.Types.Tweens.TweenBuilderConfig {
    const targets = config.targets;
    const baseConfig: Phaser.Types.Tweens.TweenBuilderConfig = {
      targets,
      duration,
      ease,
      delay: config.delay || 0,
      yoyo: config.yoyo || false,
      repeat: config.repeat || 0,
      hold: config.hold,
      onStart: config.onStart,
      onUpdate: config.onUpdate,
    };

    // Apply animation-specific configuration
    switch (config.type) {
    case AnimationType.FADE_IN:
      return {
        ...baseConfig,
        alpha: { from: 0, to: 1 },
        ...config.props,
      };

    case AnimationType.FADE_OUT:
      return {
        ...baseConfig,
        alpha: { from: 1, to: 0 },
        ...config.props,
      };

    case AnimationType.SLIDE_IN_LEFT:
      return {
        ...baseConfig,
        x: { from: -100, to: (targets as any).x || 0 },
        alpha: { from: 0, to: 1 },
        ...config.props,
      };

    case AnimationType.SLIDE_IN_RIGHT:
      return {
        ...baseConfig,
        x: { from: this.scene.cameras.main.width + 100, to: (targets as any).x || 0 },
        alpha: { from: 0, to: 1 },
        ...config.props,
      };

    case AnimationType.SLIDE_IN_TOP:
      return {
        ...baseConfig,
        y: { from: -100, to: (targets as any).y || 0 },
        alpha: { from: 0, to: 1 },
        ...config.props,
      };

    case AnimationType.SLIDE_IN_BOTTOM:
      return {
        ...baseConfig,
        y: { from: this.scene.cameras.main.height + 100, to: (targets as any).y || 0 },
        alpha: { from: 0, to: 1 },
        ...config.props,
      };

    case AnimationType.SLIDE_OUT_LEFT:
      return {
        ...baseConfig,
        x: { from: (targets as any).x || 0, to: -100 },
        alpha: { from: 1, to: 0 },
        ...config.props,
      };

    case AnimationType.SLIDE_OUT_RIGHT:
      return {
        ...baseConfig,
        x: { from: (targets as any).x || 0, to: this.scene.cameras.main.width + 100 },
        alpha: { from: 1, to: 0 },
        ...config.props,
      };

    case AnimationType.SLIDE_OUT_TOP:
      return {
        ...baseConfig,
        y: { from: (targets as any).y || 0, to: -100 },
        alpha: { from: 1, to: 0 },
        ...config.props,
      };

    case AnimationType.SLIDE_OUT_BOTTOM:
      return {
        ...baseConfig,
        y: { from: (targets as any).y || 0, to: this.scene.cameras.main.height + 100 },
        alpha: { from: 1, to: 0 },
        ...config.props,
      };

    case AnimationType.SCALE_IN:
      return {
        ...baseConfig,
        scale: { from: 0, to: 1 },
        alpha: { from: 0, to: 1 },
        ease: 'Back.easeOut',
        ...config.props,
      };

    case AnimationType.SCALE_OUT:
      return {
        ...baseConfig,
        scale: { from: 1, to: 0 },
        alpha: { from: 1, to: 0 },
        ...config.props,
      };

    case AnimationType.BOUNCE_IN:
      return {
        ...baseConfig,
        scale: { from: 0, to: 1 },
        alpha: { from: 0, to: 1 },
        ease: 'Elastic.easeOut',
        ...config.props,
      };

    case AnimationType.BOUNCE_OUT:
      return {
        ...baseConfig,
        scale: { from: 1, to: 0 },
        alpha: { from: 1, to: 0 },
        ease: 'Elastic.easeIn',
        ...config.props,
      };

    case AnimationType.FLIP_IN:
      return {
        ...baseConfig,
        scaleX: { from: 0, to: 1 },
        alpha: { from: 0, to: 1 },
        ease: 'Back.easeOut',
        ...config.props,
      };

    case AnimationType.FLIP_OUT:
      return {
        ...baseConfig,
        scaleX: { from: 1, to: 0 },
        alpha: { from: 1, to: 0 },
        ...config.props,
      };

    case AnimationType.ROTATE_IN:
      return {
        ...baseConfig,
        angle: { from: -180, to: 0 },
        scale: { from: 0, to: 1 },
        alpha: { from: 0, to: 1 },
        ease: 'Back.easeOut',
        ...config.props,
      };

    case AnimationType.ROTATE_OUT:
      return {
        ...baseConfig,
        angle: { from: 0, to: 180 },
        scale: { from: 1, to: 0 },
        alpha: { from: 1, to: 0 },
        ...config.props,
      };

    case AnimationType.SHAKE:
      return {
        ...baseConfig,
        x: { from: (targets as any).x || 0, to: (targets as any).x || 0 },
        y: { from: (targets as any).y || 0, to: (targets as any).y || 0 },
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: 5,
        duration: 50,
        ...config.props,
      };

    case AnimationType.PULSE:
      return {
        ...baseConfig,
        scale: { from: 1, to: 1.1 },
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
        duration: 1000,
        ...config.props,
      };

    case AnimationType.GLOW:
      return {
        ...baseConfig,
        alpha: { from: 0.5, to: 1 },
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
        duration: 1500,
        ...config.props,
      };

    default:
      return baseConfig;
    }
  }

  /**
   * Play staggered animation for multiple targets
   */
  public playStaggered(
    targets: Phaser.GameObjects.GameObject[],
    config: Omit<AnimationConfig, 'targets'>,
    staggerDelay: number = 50,
  ): Phaser.Tweens.Tween[] {
    const tweens: Phaser.Tweens.Tween[] = [];

    targets.forEach((target, index) => {
      const tween = this.play({
        ...config,
        targets: target,
        delay: (config.delay || 0) + index * staggerDelay,
      });

      if (tween) {
        tweens.push(tween);
      }
    });

    return tweens;
  }

  /**
   * Play sequential animations
   */
  public playSequential(
    animations: AnimationConfig[],
  ): Phaser.Tweens.Tween[] {
    const tweens: Phaser.Tweens.Tween[] = [];
    let totalDelay = 0;

    animations.forEach(animConfig => {
      const tween = this.play({
        ...animConfig,
        delay: totalDelay + (animConfig.delay || 0),
      });

      if (tween) {
        tweens.push(tween);
        totalDelay += (animConfig.duration || 300) + (animConfig.delay || 0);
      }
    });

    return tweens;
  }

  /**
   * Stop all animations
   */
  public stopAll(): void {
    this.scene.tweens.killAll();
    this.activeAnimations.clear();
  }

  /**
   * Stop animation for specific targets
   */
  public stop(targets: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[]): void {
    const targetArray = Array.isArray(targets) ? targets : [targets];

    targetArray.forEach(target => {
      this.scene.tweens.killTweensOf(target);
    });

    // Remove from active animations
    for (const [id, anim] of this.activeAnimations) {
      if (anim.targets.some(t => targetArray.includes(t))) {
        this.activeAnimations.delete(id);
      }
    }
  }

  /**
   * Pause all animations
   */
  public pauseAll(): void {
    this.scene.tweens.pauseAll();
  }

  /**
   * Resume all animations
   */
  public resumeAll(): void {
    this.scene.tweens.resumeAll();
  }

  /**
   * Check if target is animating
   */
  public isAnimating(target: Phaser.GameObjects.GameObject): boolean {
    for (const anim of this.activeAnimations.values()) {
      if (anim.targets.includes(target)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get active animation count
   */
  public getActiveAnimationCount(): number {
    return this.activeAnimations.size;
  }

  /**
   * Create screen transition
   */
  public createScreenTransition(
    direction: 'in' | 'out',
    color: number = 0x000000,
    duration: number = 500,
    onComplete?: () => void,
  ): void {
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(color, 1);
    graphics.fillRect(0, 0, this.scene.cameras.main.width, this.scene.cameras.main.height);
    graphics.setDepth(9999);

    if (direction === 'in') {
      graphics.setAlpha(1);
      this.scene.tweens.add({
        targets: graphics,
        alpha: 0,
        duration,
        ease: 'Power2',
        onComplete: () => {
          graphics.destroy();
          if (onComplete) onComplete();
        },
      });
    } else {
      graphics.setAlpha(0);
      this.scene.tweens.add({
        targets: graphics,
        alpha: 1,
        duration,
        ease: 'Power2',
        onComplete: () => {
          if (onComplete) onComplete();
        },
      });
    }
  }

  /**
   * Create page transition
   */
  public createPageTransition(
    oldPage: Phaser.GameObjects.Container,
    newPage: Phaser.GameObjects.Container,
    direction: 'left' | 'right' | 'up' | 'down',
    duration: number = 400,
    onComplete?: () => void,
  ): void {
    const camera = this.scene.cameras.main;
    const width = camera.width;
    const height = camera.height;

    // Set initial positions
    switch (direction) {
    case 'left':
      newPage.setX(width);
      break;
    case 'right':
      newPage.setX(-width);
      break;
    case 'up':
      newPage.setY(height);
      break;
    case 'down':
      newPage.setY(-height);
      break;
    }

    newPage.setAlpha(1);

    // Animate
    this.scene.tweens.add({
      targets: oldPage,
      x: direction === 'left' ? -width : direction === 'right' ? width : oldPage.x,
      y: direction === 'up' ? -height : direction === 'down' ? height : oldPage.y,
      alpha: 0,
      duration,
      ease: 'Power2',
    });

    this.scene.tweens.add({
      targets: newPage,
      x: 0,
      y: 0,
      alpha: 1,
      duration,
      ease: 'Power2',
      onComplete: () => {
        if (onComplete) onComplete();
      },
    });
  }

  /**
   * Create stat bar fill animation
   */
  public createStatBarAnimation(
    bar: Phaser.GameObjects.Rectangle,
    targetWidth: number,
    duration: number = 500,
    bounce: boolean = true,
  ): Phaser.Tweens.Tween {
    const config: Phaser.Types.Tweens.TweenBuilderConfig = {
      targets: bar,
      width: targetWidth,
      duration,
      ease: bounce ? 'Back.easeOut' : 'Power2',
    };

    return this.scene.tweens.add(config);
  }

  /**
   * Create card flip animation
   */
  public createCardFlipAnimation(
    card: Phaser.GameObjects.Container,
    duration: number = 400,
    onComplete?: () => void,
  ): Phaser.Tweens.Tween {
    return this.scene.tweens.add({
      targets: card,
      scaleX: 0,
      duration: duration / 2,
      ease: 'Power2',
      yoyo: true,
      onYoyo: () => {
        // Flip card content here if needed
      },
      onComplete: () => {
        if (onComplete) onComplete();
      },
    });
  }

  /**
   * Create modal slide animation
   */
  public createModalAnimation(
    modal: Phaser.GameObjects.Container,
    direction: 'in' | 'out',
    duration: number = 300,
    onComplete?: () => void,
  ): Phaser.Tweens.Tween {
    const camera = this.scene.cameras.main;
    const targetY = direction === 'in' ? camera.height / 2 : camera.height + 300;

    return this.scene.tweens.add({
      targets: modal,
      y: targetY,
      alpha: direction === 'in' ? 1 : 0,
      duration,
      ease: 'Back.easeOut',
      onComplete: () => {
        if (onComplete) onComplete();
      },
    });
  }

  /**
   * Create button press animation
   */
  public createButtonPressAnimation(
    button: Phaser.GameObjects.Container,
    duration: number = 100,
  ): Phaser.Tweens.Tween {
    return this.scene.tweens.add({
      targets: button,
      scale: 0.95,
      duration,
      yoyo: true,
      ease: 'Power2',
    });
  }

  /**
   * Create hover effect animation
   */
  public createHoverAnimation(
    target: Phaser.GameObjects.GameObject,
    scale: number = 1.05,
    duration: number = 200,
  ): Phaser.Tweens.Tween {
    return this.scene.tweens.add({
      targets: target,
      scale,
      duration,
      ease: 'Power2',
    });
  }

  /**
   * Create glow effect animation
   */
  public createGlowAnimation(
    target: Phaser.GameObjects.GameObject,
    glowColor: number = 0xffffff,
    duration: number = 1000,
  ): Phaser.Tweens.Tween {
    // Note: This would require a glow sprite/graphics overlay
    // For now, just animate alpha
    return this.scene.tweens.add({
      targets: target,
      alpha: { from: 0.7, to: 1 },
      duration,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Destroy animation manager
   */
  public destroy(): void {
    this.stopAll();
    this.activeAnimations.clear();
  }
}
