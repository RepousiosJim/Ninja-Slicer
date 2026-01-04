/**
 * Particle Background Component
 * Creates atmospheric particle systems for menu backgrounds
 * Supports multiple particle types with cursor interaction and performance optimization
 */

import Phaser from 'phaser';
import { DARK_GOTHIC_THEME } from '../config/theme';
import { TextureGenerator } from '../utils/TextureGenerator';

export interface ParticleBackgroundConfig {
  types?: Array<'soulWisp' | 'ember' | 'mist'>;
  depth?: number;
  interactive?: boolean; // Particles avoid cursor
  bounds?: { width: number; height: number };
}

export class ParticleBackground extends Phaser.GameObjects.Container {
  private emitters: Map<string, Phaser.GameObjects.Particles.ParticleEmitter> = new Map();
  private config: Required<ParticleBackgroundConfig>;
  private cursorX: number = 0;
  private cursorY: number = 0;
  private particleManagers: Map<string, Phaser.GameObjects.Particles.ParticleEmitter> = new Map();

  constructor(scene: Phaser.Scene, config: ParticleBackgroundConfig = {}) {
    super(scene, 0, 0);

    const gameWidth = scene.scale.width;
    const gameHeight = scene.scale.height;

    this.config = {
      types: config.types ?? ['soulWisp', 'ember', 'mist'],
      depth: config.depth ?? -10,
      interactive: config.interactive ?? true,
      bounds: config.bounds ?? { width: gameWidth, height: gameHeight },
    };

    this.setDepth(this.config.depth);

    // Generate particle textures
    TextureGenerator.createAllParticleTextures(scene, 32);

    // Create particle emitters for each type
    this.config.types.forEach((type) => {
      this.createParticleEmitter(type);
    });

    // Setup cursor interaction
    if (this.config.interactive) {
      this.setupCursorInteraction();
    }
  }

  /**
   * Create a particle emitter for a specific type
   */
  private createParticleEmitter(type: 'soulWisp' | 'ember' | 'mist'): void {
    const particleConfig = DARK_GOTHIC_THEME.effects.particles[type];
    const textureKey = `particle_${type}_32`;

    // Ensure texture exists (larger for mist)
    if (type === 'mist' && !this.scene.textures.exists('particle_mist_64')) {
      TextureGenerator.createParticleTexture(this.scene, 'mist', 64);
    }

    const actualTextureKey = type === 'mist' ? 'particle_mist_64' : textureKey;

    // Create particle emitter
    const emitter = this.scene.add.particles(0, 0, actualTextureKey, {
      x: { min: 0, max: this.config.bounds.width },
      y: { min: -50, max: this.config.bounds.height + 50 },
      speedX: { min: particleConfig.speed.min, max: particleConfig.speed.max },
      speedY: { min: particleConfig.speed.min * 0.5, max: particleConfig.speed.max * 0.5 },
      lifespan: particleConfig.lifespan,
      frequency: particleConfig.frequency,
      maxAliveParticles: particleConfig.count,
      scale: {
        start: particleConfig.scale.start,
        end: particleConfig.scale.end,
      },
      alpha: {
        start: particleConfig.alpha.start,
        end: particleConfig.alpha.end,
      },
      blendMode: Phaser.BlendModes.ADD,
      tint: particleConfig.color,
    });

    this.emitters.set(type, emitter);
    this.particleManagers.set(type, emitter);
    this.add(emitter);
  }

  /**
   * Setup cursor interaction - particles avoid cursor
   */
  private setupCursorInteraction(): void {
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.cursorX = pointer.x;
      this.cursorY = pointer.y;
    });

    // Update particle positions in relation to cursor
    this.scene.events.on('update', this.updateParticleInteraction, this);
  }

  /**
   * Update particle interaction with cursor
   * Particles are repelled by the cursor position
   */
  private updateParticleInteraction(): void {
    const repelRadius = 150;
    const repelForce = 3;

    this.emitters.forEach((emitter) => {
      emitter.forEachAlive((particle) => {
        const dx = particle.x - this.cursorX;
        const dy = particle.y - this.cursorY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < repelRadius && distance > 0) {
          const force = (repelRadius - distance) / repelRadius * repelForce;
          const angle = Math.atan2(dy, dx);
          
          particle.x += Math.cos(angle) * force;
          particle.y += Math.sin(angle) * force;
        }
      }, this);
    });
  }

  /**
   * Enable/disable a specific particle type
   */
  setParticleTypeEnabled(type: 'soulWisp' | 'ember' | 'mist', enabled: boolean): void {
    const emitter = this.emitters.get(type);
    if (emitter) {
      if (enabled) {
        emitter.start();
      } else {
        emitter.stop();
      }
    }
  }

  /**
   * Set particle density (multiplier for particle count)
   */
  setParticleDensity(multiplier: number): void {
    this.emitters.forEach((emitter, type) => {
      const particleConfig = DARK_GOTHIC_THEME.effects.particles[type as keyof typeof DARK_GOTHIC_THEME.effects.particles];
      emitter.setQuantity(Math.floor(particleConfig.count * multiplier));
    });
  }

  /**
   * Pause all particle emitters
   */
  pause(): void {
    this.emitters.forEach((emitter) => {
      emitter.pause();
    });
  }

  /**
   * Resume all particle emitters
   */
  resume(): void {
    this.emitters.forEach((emitter) => {
      emitter.resume();
    });
  }

  /**
   * Stop all particle emitters
   */
  stopAll(): void {
    this.emitters.forEach((emitter) => {
      emitter.stop();
    });
  }

  /**
   * Start all particle emitters
   */
  startAll(): void {
    this.emitters.forEach((emitter) => {
      emitter.start();
    });
  }

  /**
   * Cleanup
   */
  destroy(fromScene?: boolean): void {
    // Remove event listeners
    this.scene.events.off('update', this.updateParticleInteraction, this);

    // Stop and destroy all emitters
    this.emitters.forEach((emitter) => {
      emitter.stop();
    });

    this.particleManagers.forEach((manager) => {
      manager.destroy();
    });

    this.emitters.clear();
    this.particleManagers.clear();

    super.destroy(fromScene);
  }
}
