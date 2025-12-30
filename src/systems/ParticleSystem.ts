/**
 * Particle System
 *
 * Enhanced particle effects for weapons and UI interactions
 * with object pooling for performance optimization.
 */

import Phaser from 'phaser';
import { COLORS } from '../config/constants';

/**
 * Particle type enum
 */
export enum ParticleType {
  SOUL_WISP = 'soul_wisp',
  GHOST_MIST = 'ghost_mist',
  BLOOD_SPLATTER = 'blood_splatter',
  FIRE = 'fire',
  ICE = 'ice',
  LIGHTNING = 'lightning',
  BUTTON_CLICK = 'button_click',
  WEAPON_TRAIL = 'weapon_trail',
  SPARKLE = 'sparkle',
}

/**
 * Particle configuration
 */
interface ParticleConfig {
  type: ParticleType;
  x: number;
  y: number;
  count?: number;
  scale?: { start: number; end: number };
  speed?: { min: number; max: number };
  lifespan?: number;
  alpha?: { start: number; end: number };
  tint?: number;
  blendMode?: string;
  frequency?: number;
  emitting?: boolean;
}

/**
 * Pooled particle emitter
 */
class PooledEmitter {
  private emitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private inUse: boolean = false;

  constructor(emitter: Phaser.GameObjects.Particles.ParticleEmitter) {
    this.emitter = emitter;
  }

  public getEmitter(): Phaser.GameObjects.Particles.ParticleEmitter {
    return this.emitter;
  }

  public isInUse(): boolean {
    return this.inUse;
  }

  public setInUse(inUse: boolean): void {
    this.inUse = inUse;
  }

  public destroy(): void {
    this.emitter.destroy();
  }
}

/**
 * Particle System Manager
 */
export class ParticleSystem {
  private scene: Phaser.Scene;
  private emitters: Map<ParticleType, PooledEmitter[]> = new Map();
  private activeEmitters: Set<PooledEmitter> = new Set();
  private maxEmittersPerType: number = 5;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initializeParticleTextures();
  }

  /**
   * Initialize particle textures
   */
  private initializeParticleTextures(): void {
    // Soul wisp texture
    if (!this.scene.textures.exists('particle_soul_wisp')) {
      const wispTexture = this.scene.textures.createCanvas('particle_soul_wisp', 32, 32);
      if (wispTexture) {
        const ctx = wispTexture.getContext();
        if (ctx) {
          const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
          gradient.addColorStop(0, 'rgba(255, 215, 0, 1)');
          gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.5)');
          gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 32, 32);
          wispTexture.refresh();
        }
      }
    }

    // Ghost mist texture
    if (!this.scene.textures.exists('particle_ghost_mist')) {
      const mistTexture = this.scene.textures.createCanvas('particle_ghost_mist', 64, 64);
      if (mistTexture) {
        const ctx = mistTexture.getContext();
        if (ctx) {
          const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
          gradient.addColorStop(0, 'rgba(200, 200, 255, 0.3)');
          gradient.addColorStop(0.5, 'rgba(150, 150, 200, 0.15)');
          gradient.addColorStop(1, 'rgba(100, 100, 150, 0)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 64, 64);
          mistTexture.refresh();
        }
      }
    }

    // Blood splatter texture
    if (!this.scene.textures.exists('particle_blood')) {
      const bloodTexture = this.scene.textures.createCanvas('particle_blood', 16, 16);
      if (bloodTexture) {
        const ctx = bloodTexture.getContext();
        if (ctx) {
          ctx.fillStyle = 'rgba(200, 0, 0, 1)';
          ctx.beginPath();
          ctx.arc(8, 8, 6, 0, Math.PI * 2);
          ctx.fill();
          bloodTexture.refresh();
        }
      }
    }

    // Fire texture
    if (!this.scene.textures.exists('particle_fire')) {
      const fireTexture = this.scene.textures.createCanvas('particle_fire', 32, 32);
      if (fireTexture) {
        const ctx = fireTexture.getContext();
        if (ctx) {
          const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
          gradient.addColorStop(0, 'rgba(255, 255, 200, 1)');
          gradient.addColorStop(0.3, 'rgba(255, 200, 0, 0.8)');
          gradient.addColorStop(0.7, 'rgba(255, 100, 0, 0.4)');
          gradient.addColorStop(1, 'rgba(200, 0, 0, 0)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 32, 32);
          fireTexture.refresh();
        }
      }
    }

    // Ice texture
    if (!this.scene.textures.exists('particle_ice')) {
      const iceTexture = this.scene.textures.createCanvas('particle_ice', 32, 32);
      if (iceTexture) {
        const ctx = iceTexture.getContext();
        if (ctx) {
          const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
          gradient.addColorStop(0, 'rgba(200, 255, 255, 1)');
          gradient.addColorStop(0.5, 'rgba(100, 200, 255, 0.6)');
          gradient.addColorStop(1, 'rgba(50, 150, 255, 0)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 32, 32);
          iceTexture.refresh();
        }
      }
    }

    // Lightning texture
    if (!this.scene.textures.exists('particle_lightning')) {
      const lightningTexture = this.scene.textures.createCanvas('particle_lightning', 32, 32);
      if (lightningTexture) {
        const ctx = lightningTexture.getContext();
        if (ctx) {
          const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
          gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
          gradient.addColorStop(0.3, 'rgba(255, 255, 200, 0.8)');
          gradient.addColorStop(0.7, 'rgba(200, 200, 100, 0.4)');
          gradient.addColorStop(1, 'rgba(150, 150, 0, 0)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 32, 32);
          lightningTexture.refresh();
        }
      }
    }

    // Sparkle texture
    if (!this.scene.textures.exists('particle_sparkle')) {
      const sparkleTexture = this.scene.textures.createCanvas('particle_sparkle', 16, 16);
      if (sparkleTexture) {
        const ctx = sparkleTexture.getContext();
        if (ctx) {
          ctx.fillStyle = 'rgba(255, 255, 255, 1)';
          ctx.beginPath();
          ctx.moveTo(8, 0);
          ctx.lineTo(10, 6);
          ctx.lineTo(16, 8);
          ctx.lineTo(10, 10);
          ctx.lineTo(8, 16);
          ctx.lineTo(6, 10);
          ctx.lineTo(0, 8);
          ctx.lineTo(6, 6);
          ctx.closePath();
          ctx.fill();
          sparkleTexture.refresh();
        }
      }
    }
  }

  /**
   * Get or create pooled emitter
   */
  private getEmitter(type: ParticleType): PooledEmitter | null {
    if (!this.emitters.has(type)) {
      this.emitters.set(type, []);
    }

    const pool = this.emitters.get(type)!;

    // Find available emitter
    for (const pooledEmitter of pool) {
      if (!pooledEmitter.isInUse()) {
        return pooledEmitter;
      }
    }

    // Create new emitter if under limit
    if (pool.length < this.maxEmittersPerType) {
      const emitter = this.createEmitter(type);
      if (emitter) {
        const pooledEmitter = new PooledEmitter(emitter);
        pool.push(pooledEmitter);
        return pooledEmitter;
      }
    }

    return null;
  }

  /**
   * Create emitter for particle type
   */
  private createEmitter(type: ParticleType): Phaser.GameObjects.Particles.ParticleEmitter | null {
    let textureKey: string;
    let config: any = {};

    switch (type) {
      case ParticleType.SOUL_WISP:
        textureKey = 'particle_soul_wisp';
        config = {
          speedX: { min: -20, max: 20 },
          speedY: { min: -30, max: -10 },
          scale: { start: 0.3, end: 0 },
          alpha: { start: 0.6, end: 0 },
          lifespan: 4000,
          frequency: 200,
          blendMode: 'ADD',
        };
        break;

      case ParticleType.GHOST_MIST:
        textureKey = 'particle_ghost_mist';
        config = {
          speedX: { min: -10, max: 10 },
          speedY: { min: -5, max: 5 },
          scale: { start: 1, end: 2 },
          alpha: { start: 0.2, end: 0 },
          lifespan: 6000,
          frequency: 300,
          blendMode: 'ADD',
        };
        break;

      case ParticleType.BLOOD_SPLATTER:
        textureKey = 'particle_blood';
        config = {
          speed: { min: 150, max: 350 },
          scale: { start: 0.6, end: 0.1 },
          alpha: { start: 1, end: 0 },
          lifespan: 900,
          quantity: 5,
          angle: { min: 0, max: 360 },
          blendMode: 'NORMAL',
        };
        break;

      case ParticleType.FIRE:
        textureKey = 'particle_fire';
        config = {
          speed: { min: 30, max: 80 },
          scale: { start: 0.3, end: 0.1 },
          alpha: { start: 1, end: 0 },
          lifespan: 1000,
          quantity: 10,
          blendMode: 'ADD',
        };
        break;

      case ParticleType.ICE:
        textureKey = 'particle_ice';
        config = {
          speed: { min: 20, max: 60 },
          scale: { start: 0.4, end: 0.1 },
          alpha: { start: 1, end: 0 },
          lifespan: 1200,
          quantity: 8,
          blendMode: 'ADD',
        };
        break;

      case ParticleType.LIGHTNING:
        textureKey = 'particle_lightning';
        config = {
          speed: { min: 100, max: 200 },
          scale: { start: 0.3, end: 0 },
          alpha: { start: 1, end: 0 },
          lifespan: 500,
          quantity: 15,
          blendMode: 'ADD',
        };
        break;

      case ParticleType.BUTTON_CLICK:
        textureKey = 'particle_sparkle';
        config = {
          speed: { min: 50, max: 150 },
          scale: { start: 0.5, end: 0 },
          alpha: { start: 1, end: 0 },
          lifespan: 400,
          quantity: 8,
          blendMode: 'ADD',
        };
        break;

      case ParticleType.WEAPON_TRAIL:
        textureKey = 'particle_sparkle';
        config = {
          speed: { min: 10, max: 30 },
          scale: { start: 0.3, end: 0 },
          alpha: { start: 0.8, end: 0 },
          lifespan: 300,
          quantity: 3,
          blendMode: 'ADD',
        };
        break;

      case ParticleType.SPARKLE:
        textureKey = 'particle_sparkle';
        config = {
          speed: { min: 20, max: 50 },
          scale: { start: 0.4, end: 0 },
          alpha: { start: 1, end: 0 },
          lifespan: 600,
          quantity: 5,
          blendMode: 'ADD',
        };
        break;

      default:
        return null;
    }

    return this.scene.add.particles(0, 0, textureKey, config);
  }

  /**
   * Emit particles at position
   */
  public emit(config: ParticleConfig): void {
    const pooledEmitter = this.getEmitter(config.type);
    if (!pooledEmitter) return;

    const emitter = pooledEmitter.getEmitter();

    // Set position
    emitter.setPosition(config.x, config.y);

    // Emit particles
    if (config.emitting !== false) {
      emitter.explode(config.count || 10);
    }

    // Mark as in use
    pooledEmitter.setInUse(true);
    this.activeEmitters.add(pooledEmitter);

    // Auto-release after lifespan
    const lifespan = config.lifespan || 1000;
    this.scene.time.delayedCall(lifespan + 100, () => {
      pooledEmitter.setInUse(false);
      this.activeEmitters.delete(pooledEmitter);
    });
  }

  /**
   * Create continuous emitter (for ambient effects)
   */
  public createContinuousEmitter(type: ParticleType, x: number, y: number): Phaser.GameObjects.Particles.ParticleEmitter | null {
    const emitter = this.createEmitter(type);
    if (!emitter) return null;

    emitter.setPosition(x, y);
    emitter.start();

    return emitter;
  }

  /**
   * Create weapon trail effect
   */
  public createWeaponTrail(x: number, y: number, weaponType: string): void {
    let particleType: ParticleType;

    if (weaponType.includes('fire')) {
      particleType = ParticleType.FIRE;
    } else if (weaponType.includes('ice')) {
      particleType = ParticleType.ICE;
    } else if (weaponType.includes('lightning')) {
      particleType = ParticleType.LIGHTNING;
    } else if (weaponType.includes('holy')) {
      particleType = ParticleType.SPARKLE;
    } else {
      particleType = ParticleType.WEAPON_TRAIL;
    }

    this.emit({
      type: particleType,
      x: x,
      y: y,
      count: 5,
      scale: { start: 0.3, end: 0 },
      lifespan: 300,
    });
  }

  /**
   * Create button click effect
   */
  public createButtonClickEffect(x: number, y: number): void {
    this.emit({
      type: ParticleType.BUTTON_CLICK,
      x: x,
      y: y,
      count: 8,
      scale: { start: 0.5, end: 0 },
      lifespan: 400,
    });
  }

  /**
   * Create hit effect
   * Enhanced to spawn 15-30 particles with dramatic spray pattern
   */
  public createHitEffect(x: number, y: number, weaponType: string): void {
    // Calculate random particle count between 15-30 for organic feel
    const particleCount = Math.floor(Math.random() * 16) + 15;

    // Blood splatter with enhanced velocity and spread
    this.emit({
      type: ParticleType.BLOOD_SPLATTER,
      x: x,
      y: y,
      count: particleCount,
      scale: { start: 0.6, end: 0.1 },
      lifespan: 900,
    });

    // Weapon-specific effect
    if (weaponType.includes('fire')) {
      this.emit({
        type: ParticleType.FIRE,
        x: x,
        y: y,
        count: 10,
        scale: { start: 0.3, end: 0.1 },
        lifespan: 1000,
      });
    } else if (weaponType.includes('ice')) {
      this.emit({
        type: ParticleType.ICE,
        x: x,
        y: y,
        count: 8,
        scale: { start: 0.4, end: 0.1 },
        lifespan: 1200,
      });
    } else if (weaponType.includes('lightning')) {
      this.emit({
        type: ParticleType.LIGHTNING,
        x: x,
        y: y,
        count: 15,
        scale: { start: 0.3, end: 0 },
        lifespan: 500,
      });
    }
  }

  /**
   * Create ambient soul wisps
   */
  public createAmbientWisps(width: number, height: number): Phaser.GameObjects.Particles.ParticleEmitter | null {
    return this.createContinuousEmitter(ParticleType.SOUL_WISP, width / 2, height / 2);
  }

  /**
   * Create ghost mist effect
   */
  public createGhostMist(width: number, height: number): Phaser.GameObjects.Particles.ParticleEmitter | null {
    return this.createContinuousEmitter(ParticleType.GHOST_MIST, width / 2, height / 2);
  }

  /**
   * Update particle system
   */
  public update(): void {
    // Clean up inactive emitters periodically
    if (this.scene.time.now % 1000 < 20) {
      this.cleanupInactiveEmitters();
    }
  }

  /**
   * Clean up inactive emitters
   */
  private cleanupInactiveEmitters(): void {
    for (const [type, pool] of this.emitters) {
      for (let i = pool.length - 1; i >= 0; i--) {
        const emitter = pool[i];
        if (emitter && !emitter.isInUse() && pool.length > 2) {
          emitter.destroy();
          pool.splice(i, 1);
        }
      }
    }
  }

  /**
   * Destroy particle system
   */
  public destroy(): void {
    for (const pool of this.emitters.values()) {
      for (const emitter of pool) {
        emitter.destroy();
      }
    }
    this.emitters.clear();
    this.activeEmitters.clear();
  }
}
