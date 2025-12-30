/**
 * Glow Effect Component
 * Creates a multi-layer glow effect that can be applied to any game object
 * Supports pulsing animation, color customization, and dynamic intensity
 */

import Phaser from 'phaser';
import { DARK_GOTHIC_THEME } from '../config/theme';
import { TextureGenerator } from '../utils/TextureGenerator';

export interface GlowConfig {
  color?: number;
  innerIntensity?: number;
  outerIntensity?: number;
  blur?: number;
  pulse?: boolean;
  pulseSpeed?: number;
  pulseMin?: number;
  pulseMax?: number;
}

export class GlowEffect extends Phaser.GameObjects.Container {
  private glowInner!: Phaser.GameObjects.Image;
  private glowOuter!: Phaser.GameObjects.Image;
  private config: Required<GlowConfig>;
  private pulseTween?: Phaser.Tweens.Tween;

  constructor(
    scene: Phaser.Scene,
    x: number = 0,
    y: number = 0,
    config: GlowConfig = {},
  ) {
    super(scene, x, y);

    // Apply default configuration
    this.config = {
      color: config.color ?? DARK_GOTHIC_THEME.effects.glow.color,
      innerIntensity: config.innerIntensity ?? DARK_GOTHIC_THEME.effects.glow.innerAlpha,
      outerIntensity: config.outerIntensity ?? DARK_GOTHIC_THEME.effects.glow.outerAlpha,
      blur: config.blur ?? DARK_GOTHIC_THEME.effects.glow.intensity,
      pulse: config.pulse ?? false,
      pulseSpeed: config.pulseSpeed ?? 2000,
      pulseMin: config.pulseMin ?? 0.6,
      pulseMax: config.pulseMax ?? 1.0,
    };

    this.createGlowLayers();

    if (this.config.pulse) {
      this.startPulseAnimation();
    }
  }

  /**
   * Create the glow layers (inner bright, outer soft)
   */
  private createGlowLayers(): void {
    const glowSize = this.config.blur * 4; // Glow texture size based on blur radius

    // Generate glow textures
    TextureGenerator.createGlowTexture(
      this.scene,
      glowSize,
      this.config.color,
      1.0,
    );

    // Inner glow layer (bright and concentrated)
    this.glowInner = this.scene.add.image(0, 0, `glow_${glowSize}_${this.config.color}_1`);
    this.glowInner.setAlpha(this.config.innerIntensity);
    this.glowInner.setBlendMode(Phaser.BlendModes.ADD);
    this.glowInner.setScale(0.6); // Smaller for inner glow
    this.add(this.glowInner);

    // Outer glow layer (soft and diffused)
    this.glowOuter = this.scene.add.image(0, 0, `glow_${glowSize}_${this.config.color}_1`);
    this.glowOuter.setAlpha(this.config.outerIntensity);
    this.glowOuter.setBlendMode(Phaser.BlendModes.ADD);
    this.glowOuter.setScale(1.2); // Larger for outer glow
    this.add(this.glowOuter);
  }

  /**
   * Start pulsing animation
   */
  private startPulseAnimation(): void {
    if (this.pulseTween) {
      this.pulseTween.stop();
    }

    this.pulseTween = this.scene.tweens.add({
      targets: [this.glowInner, this.glowOuter],
      alpha: {
        from: this.config.pulseMin,
        to: this.config.pulseMax,
      },
      duration: this.config.pulseSpeed,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Stop pulsing animation
   */
  stopPulse(): void {
    if (this.pulseTween) {
      this.pulseTween.stop();
      this.pulseTween = undefined;
    }

    // Reset alpha to original values
    this.glowInner.setAlpha(this.config.innerIntensity);
    this.glowOuter.setAlpha(this.config.outerIntensity);
  }

  /**
   * Set glow color
   */
  setGlowColor(color: number): void {
    this.config.color = color;
    this.removeAll(true);
    this.createGlowLayers();

    if (this.config.pulse) {
      this.startPulseAnimation();
    }
  }

  /**
   * Set glow intensity
   */
  setGlowIntensity(innerIntensity: number, outerIntensity?: number): void {
    this.config.innerIntensity = innerIntensity;
    this.config.outerIntensity = outerIntensity ?? innerIntensity * 0.5;

    this.glowInner.setAlpha(this.config.innerIntensity);
    this.glowOuter.setAlpha(this.config.outerIntensity);
  }

  /**
   * Enable/disable pulsing
   */
  setPulse(enabled: boolean, speed?: number): void {
    this.config.pulse = enabled;
    if (speed !== undefined) {
      this.config.pulseSpeed = speed;
    }

    if (enabled) {
      this.startPulseAnimation();
    } else {
      this.stopPulse();
    }
  }

  /**
   * Cleanup
   */
  destroy(fromScene?: boolean): void {
    this.stopPulse();
    super.destroy(fromScene);
  }
}

/**
 * Helper function to add glow to an existing game object
 * Creates a glow effect and positions it relative to the target
 */
export function addGlowToObject(
  target: Phaser.GameObjects.GameObject,
  config: GlowConfig = {},
): GlowEffect {
  const scene = target.scene;

  // Get position from target
  let x = 0;
  let y = 0;
  if ('x' in target && 'y' in target) {
    x = target.x as number;
    y = target.y as number;
  }

  const glow = new GlowEffect(scene, x, y, config);

  // Set depth below target
  if ('depth' in target) {
    glow.setDepth((target.depth as number) - 1);
  }

  scene.add.existing(glow);

  // Update glow position when target moves (if target is a container/sprite)
  if ('on' in target) {
    const updatePosition = () => {
      if ('x' in target && 'y' in target) {
        glow.setPosition(target.x as number, target.y as number);
      }
    };

    // Try to listen to position changes
    try {
      (target as any).on('move', updatePosition);
    } catch (e) {
      // Target doesn't emit move events, that's fine
    }
  }

  return glow;
}
