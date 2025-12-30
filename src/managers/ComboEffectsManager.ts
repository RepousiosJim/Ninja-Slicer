/**
 * ComboEffectsManager
 *
 * Manages visual effects for combo milestones.
 * Triggers particle bursts, screen flashes, and text animations
 * when players reach 5x, 10x, 15x+ combo milestones.
 */

import Phaser from 'phaser';
import { ParticleSystem, ParticleType } from '../systems/ParticleSystem';
import { EventBus } from '../utils/EventBus';

/**
 * Milestone effect configuration
 */
interface MilestoneEffectConfig {
  text: string;
  color: string;
  fontSize: number;
  particleCount: number;
  particleType: ParticleType;
  screenFlash: boolean;
  screenFlashAlpha: number;
  screenFlashColor: number;
  secondaryParticles: boolean;
  secondaryParticleType?: ParticleType;
  secondaryParticleCount?: number;
}

/**
 * Milestone configuration map
 */
const MILESTONE_CONFIGS: { [key: number]: MilestoneEffectConfig } = {
  5: {
    text: 'COMBO x5!',
    color: '#ffff00',
    fontSize: 48,
    particleCount: 20,
    particleType: ParticleType.SPARKLE,
    screenFlash: false,
    screenFlashAlpha: 0,
    screenFlashColor: 0xffffff,
    secondaryParticles: false,
  },
  10: {
    text: 'COMBO x10!',
    color: '#ff9900',
    fontSize: 56,
    particleCount: 35,
    particleType: ParticleType.SPARKLE,
    screenFlash: true,
    screenFlashAlpha: 0.2,
    screenFlashColor: 0xff9900,
    secondaryParticles: true,
    secondaryParticleType: ParticleType.FIRE,
    secondaryParticleCount: 15,
  },
  15: {
    text: 'LEGENDARY!',
    color: '#ff0066',
    fontSize: 64,
    particleCount: 50,
    particleType: ParticleType.SPARKLE,
    screenFlash: true,
    screenFlashAlpha: 0.4,
    screenFlashColor: 0xff0066,
    secondaryParticles: true,
    secondaryParticleType: ParticleType.FIRE,
    secondaryParticleCount: 30,
  },
  20: {
    text: 'UNSTOPPABLE!',
    color: '#ff00ff',
    fontSize: 64,
    particleCount: 60,
    particleType: ParticleType.LIGHTNING,
    screenFlash: true,
    screenFlashAlpha: 0.5,
    screenFlashColor: 0xff00ff,
    secondaryParticles: true,
    secondaryParticleType: ParticleType.FIRE,
    secondaryParticleCount: 40,
  },
  25: {
    text: 'GODLIKE!',
    color: '#00ffff',
    fontSize: 72,
    particleCount: 75,
    particleType: ParticleType.LIGHTNING,
    screenFlash: true,
    screenFlashAlpha: 0.6,
    screenFlashColor: 0x00ffff,
    secondaryParticles: true,
    secondaryParticleType: ParticleType.FIRE,
    secondaryParticleCount: 50,
  },
};

/**
 * Default configuration for milestones not explicitly defined
 */
const DEFAULT_CONFIG: MilestoneEffectConfig = {
  text: 'INCREDIBLE!',
  color: '#ffffff',
  fontSize: 64,
  particleCount: 60,
  particleType: ParticleType.LIGHTNING,
  screenFlash: true,
  screenFlashAlpha: 0.5,
  screenFlashColor: 0xffffff,
  secondaryParticles: true,
  secondaryParticleType: ParticleType.FIRE,
  secondaryParticleCount: 35,
};

export class ComboEffectsManager {
  private scene: Phaser.Scene;
  private particleSystem: ParticleSystem | null = null;
  private screenFlashGraphics: Phaser.GameObjects.Graphics | null = null;
  private activeTexts: Phaser.GameObjects.Text[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initialize();
  }

  /**
   * Initialize the manager
   */
  private initialize(): void {
    // Create graphics for screen flash effects
    this.screenFlashGraphics = this.scene.add.graphics();
    this.screenFlashGraphics.setDepth(900); // Below UI but above game elements
    this.screenFlashGraphics.setScrollFactor(0);

    // Listen for combo milestone events
    EventBus.on('combo-milestone', this.onComboMilestone, this);
  }

  /**
   * Set particle system reference
   */
  setParticleSystem(particleSystem: ParticleSystem): void {
    this.particleSystem = particleSystem;
  }

  /**
   * Handle combo milestone event
   */
  private onComboMilestone = (data: { milestone: number; multiplier: number }): void => {
    this.triggerMilestoneEffect(data.milestone, data.multiplier);
  };

  /**
   * Trigger visual effects for a milestone
   */
  triggerMilestoneEffect(milestone: number, multiplier: number): void {
    const config = this.getConfigForMilestone(milestone);
    const centerX = this.scene.cameras.main.width / 2;
    const centerY = this.scene.cameras.main.height / 2;

    // Create screen flash effect
    if (config.screenFlash) {
      this.createScreenFlash(config.screenFlashColor, config.screenFlashAlpha, milestone);
    }

    // Create milestone text animation
    this.createMilestoneText(config, centerX, centerY, milestone);

    // Create particle effects
    this.createMilestoneParticles(config, centerX, centerY);

    // Create multiplier text below main text
    this.createMultiplierText(multiplier, centerX, centerY);
  }

  /**
   * Get configuration for a milestone level
   */
  private getConfigForMilestone(milestone: number): MilestoneEffectConfig {
    // Find the closest defined milestone
    if (MILESTONE_CONFIGS[milestone]) {
      return MILESTONE_CONFIGS[milestone];
    }

    // For milestones higher than defined, use highest defined or default
    const definedMilestones = Object.keys(MILESTONE_CONFIGS).map(Number).sort((a, b) => b - a);
    for (const defined of definedMilestones) {
      if (milestone >= defined) {
        // Create a modified config for higher milestones
        const baseConfig = { ...MILESTONE_CONFIGS[defined] };
        baseConfig.text = `COMBO x${milestone}!`;
        return baseConfig;
      }
    }

    return { ...DEFAULT_CONFIG, text: `COMBO x${milestone}!` };
  }

  /**
   * Create screen flash effect
   */
  private createScreenFlash(color: number, alpha: number, milestone: number): void {
    if (!this.screenFlashGraphics) return;

    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    this.screenFlashGraphics.clear();

    // For lower milestones (5-10), create edge flash
    if (milestone <= 10) {
      this.createEdgeFlash(color, alpha, width, height);
    } else {
      // For higher milestones, create full screen flash
      this.createFullScreenFlash(color, alpha, width, height);
    }
  }

  /**
   * Create edge flash effect (screen edges glow)
   */
  private createEdgeFlash(color: number, alpha: number, width: number, height: number): void {
    if (!this.screenFlashGraphics) return;

    const edgeWidth = 60;

    // Create gradient-like edge flash using multiple rectangles
    for (let i = 0; i < 3; i++) {
      const layerAlpha = alpha * (1 - i * 0.3);
      const layerWidth = edgeWidth - i * 15;

      this.screenFlashGraphics.fillStyle(color, layerAlpha);

      // Top edge
      this.screenFlashGraphics.fillRect(0, 0, width, layerWidth);
      // Bottom edge
      this.screenFlashGraphics.fillRect(0, height - layerWidth, width, layerWidth);
      // Left edge
      this.screenFlashGraphics.fillRect(0, 0, layerWidth, height);
      // Right edge
      this.screenFlashGraphics.fillRect(width - layerWidth, 0, layerWidth, height);
    }

    // Fade out the flash
    this.scene.tweens.add({
      targets: this.screenFlashGraphics,
      alpha: 0,
      duration: 400,
      ease: 'Quad.easeOut',
      onComplete: () => {
        if (this.screenFlashGraphics) {
          this.screenFlashGraphics.clear();
          this.screenFlashGraphics.alpha = 1;
        }
      },
    });
  }

  /**
   * Create full screen flash effect
   */
  private createFullScreenFlash(color: number, alpha: number, width: number, height: number): void {
    if (!this.screenFlashGraphics) return;

    this.screenFlashGraphics.fillStyle(color, alpha);
    this.screenFlashGraphics.fillRect(0, 0, width, height);

    // Fade out the flash
    this.scene.tweens.add({
      targets: this.screenFlashGraphics,
      alpha: 0,
      duration: 300,
      ease: 'Quad.easeOut',
      onComplete: () => {
        if (this.screenFlashGraphics) {
          this.screenFlashGraphics.clear();
          this.screenFlashGraphics.alpha = 1;
        }
      },
    });
  }

  /**
   * Create milestone text animation
   */
  private createMilestoneText(
    config: MilestoneEffectConfig,
    x: number,
    y: number,
    milestone: number
  ): void {
    const text = this.scene.add.text(x, y - 50, config.text, {
      fontSize: `${config.fontSize}px`,
      color: config.color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8,
      shadow: {
        offsetX: 3,
        offsetY: 3,
        color: '#000000',
        blur: 8,
        fill: true,
      },
    });
    text.setOrigin(0.5);
    text.setDepth(950);
    text.setScrollFactor(0);

    // Track active text for cleanup
    this.activeTexts.push(text);

    // Start with scale 0
    text.setScale(0);

    // Scale up with bounce
    this.scene.tweens.add({
      targets: text,
      scale: 1.2,
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Slight bounce back
        this.scene.tweens.add({
          targets: text,
          scale: 1,
          duration: 100,
          ease: 'Quad.easeInOut',
        });
      },
    });

    // Create pulsing glow effect for higher milestones
    if (milestone >= 15) {
      this.scene.tweens.add({
        targets: text,
        alpha: { from: 1, to: 0.7 },
        duration: 150,
        yoyo: true,
        repeat: 3,
      });
    }

    // Float up and fade out
    this.scene.tweens.add({
      targets: text,
      y: y - 150,
      alpha: 0,
      duration: 1500,
      delay: 500,
      ease: 'Quad.easeOut',
      onComplete: () => {
        const index = this.activeTexts.indexOf(text);
        if (index > -1) {
          this.activeTexts.splice(index, 1);
        }
        text.destroy();
      },
    });
  }

  /**
   * Create multiplier text below main milestone text
   */
  private createMultiplierText(multiplier: number, x: number, y: number): void {
    const multiplierString = `${multiplier.toFixed(1)}x MULTIPLIER`;
    const text = this.scene.add.text(x, y + 20, multiplierString, {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });
    text.setOrigin(0.5);
    text.setDepth(950);
    text.setScrollFactor(0);

    // Track for cleanup
    this.activeTexts.push(text);

    // Scale in animation
    text.setScale(0);
    this.scene.tweens.add({
      targets: text,
      scale: 1,
      duration: 150,
      delay: 150,
      ease: 'Back.easeOut',
    });

    // Float up and fade out
    this.scene.tweens.add({
      targets: text,
      y: y - 80,
      alpha: 0,
      duration: 1200,
      delay: 600,
      ease: 'Quad.easeOut',
      onComplete: () => {
        const index = this.activeTexts.indexOf(text);
        if (index > -1) {
          this.activeTexts.splice(index, 1);
        }
        text.destroy();
      },
    });
  }

  /**
   * Create particle effects for milestone
   */
  private createMilestoneParticles(config: MilestoneEffectConfig, x: number, y: number): void {
    if (!this.particleSystem) return;

    // Create main particle burst at center
    this.particleSystem.emit({
      type: config.particleType,
      x: x,
      y: y,
      count: config.particleCount,
      scale: { start: 0.8, end: 0 },
      lifespan: 1000,
    });

    // Create secondary particles if enabled
    if (config.secondaryParticles && config.secondaryParticleType) {
      // Emit from multiple positions around the center
      const positions = this.getRadialPositions(x, y, 100, 8);
      for (const pos of positions) {
        this.particleSystem.emit({
          type: config.secondaryParticleType,
          x: pos.x,
          y: pos.y,
          count: Math.floor((config.secondaryParticleCount || 10) / 8),
          scale: { start: 0.5, end: 0.1 },
          lifespan: 800,
        });
      }
    }

    // For high milestones (15+), create corner particle bursts
    if (config.particleCount >= 50) {
      this.createCornerParticles(config.particleType);
    }
  }

  /**
   * Create particles at screen corners for dramatic effect
   */
  private createCornerParticles(particleType: ParticleType): void {
    if (!this.particleSystem) return;

    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const offset = 80;

    const corners = [
      { x: offset, y: offset },
      { x: width - offset, y: offset },
      { x: offset, y: height - offset },
      { x: width - offset, y: height - offset },
    ];

    for (const corner of corners) {
      this.particleSystem.emit({
        type: particleType,
        x: corner.x,
        y: corner.y,
        count: 15,
        scale: { start: 0.6, end: 0 },
        lifespan: 700,
      });
    }
  }

  /**
   * Get positions in a radial pattern around a center point
   */
  private getRadialPositions(
    centerX: number,
    centerY: number,
    radius: number,
    count: number
  ): { x: number; y: number }[] {
    const positions: { x: number; y: number }[] = [];
    const angleStep = (Math.PI * 2) / count;

    for (let i = 0; i < count; i++) {
      const angle = i * angleStep;
      positions.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      });
    }

    return positions;
  }

  /**
   * Trigger a custom celebration effect (for testing or special events)
   */
  triggerCelebration(intensity: 'small' | 'medium' | 'large' = 'medium'): void {
    const centerX = this.scene.cameras.main.width / 2;
    const centerY = this.scene.cameras.main.height / 2;

    let config: MilestoneEffectConfig;
    switch (intensity) {
      case 'small':
        config = MILESTONE_CONFIGS[5];
        break;
      case 'large':
        config = MILESTONE_CONFIGS[15];
        break;
      case 'medium':
      default:
        config = MILESTONE_CONFIGS[10];
    }

    if (config.screenFlash) {
      this.createFullScreenFlash(config.screenFlashColor, config.screenFlashAlpha * 0.5,
        this.scene.cameras.main.width, this.scene.cameras.main.height);
    }

    this.createMilestoneParticles(config, centerX, centerY);
  }

  /**
   * Cleanup active effects
   */
  cleanup(): void {
    // Destroy active texts
    for (const text of this.activeTexts) {
      if (text && text.active) {
        text.destroy();
      }
    }
    this.activeTexts = [];

    // Clear screen flash
    if (this.screenFlashGraphics) {
      this.screenFlashGraphics.clear();
    }
  }

  /**
   * Destroy the manager and cleanup resources
   */
  destroy(): void {
    // Remove event listener
    EventBus.off('combo-milestone', this.onComboMilestone, this);

    // Cleanup effects
    this.cleanup();

    // Destroy graphics
    if (this.screenFlashGraphics) {
      this.screenFlashGraphics.destroy();
      this.screenFlashGraphics = null;
    }

    this.particleSystem = null;
  }
}
