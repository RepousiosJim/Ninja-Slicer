/**
 * Atmospheric Background Component
 * Multi-layer parallax background with dynamic elements and theme variants
 */

import Phaser from 'phaser';
import { TextureGenerator } from '../utils/TextureGenerator';
import { DARK_GOTHIC_THEME } from '../config/theme';

export interface BackgroundLayer {
  type: 'gradient' | 'particles' | 'ghosts' | 'weapons' | 'vignette';
  speed: number;
  depth: number;
  enabled: boolean;
}

export interface AtmosphericBackgroundConfig {
  layers?: BackgroundLayer[];
  theme?: 'graveyard' | 'village' | 'castle' | 'ghost' | 'hell';
  quality?: 'low' | 'medium' | 'high';
}

export class AtmosphericBackground extends Phaser.GameObjects.Container {
  private layers: Map<string, Phaser.GameObjects.Container> = new Map();
  private config: Required<AtmosphericBackgroundConfig>;
  private particleEmitters: Map<string, Phaser.GameObjects.Particles.ParticleEmitter> = new Map();
  private ghostSprites: Phaser.GameObjects.Sprite[] = [];
  private weaponSprites: Phaser.GameObjects.Image[] = [];
  private currentGradient: Phaser.GameObjects.Graphics | null = null;

  constructor(scene: Phaser.Scene, config: AtmosphericBackgroundConfig = {}) {
    super(scene, 0, 0);

    this.config = {
      layers: config.layers || this.getDefaultLayers(),
      theme: config.theme || 'graveyard',
      quality: config.quality || 'medium',
    };

    this.createLayers();
    this.setupThemeVariant(this.config.theme);
  }

  private getDefaultLayers(): BackgroundLayer[] {
    return [
      { type: 'gradient', speed: 0, depth: -30, enabled: true },
      { type: 'ghosts', speed: 0.3, depth: -25, enabled: true },
      { type: 'weapons', speed: 0.2, depth: -20, enabled: true },
      { type: 'particles', speed: 0.5, depth: -15, enabled: true },
      { type: 'vignette', speed: 0, depth: -10, enabled: true },
    ];
  }

  private createLayers(): void {
    this.config.layers.forEach((layerConfig) => {
      switch (layerConfig.type) {
        case 'gradient':
          this.createGradientLayer(layerConfig);
          break;
        case 'particles':
          this.createParticleLayer(layerConfig);
          break;
        case 'ghosts':
          this.createGhostLayer(layerConfig);
          break;
        case 'weapons':
          this.createWeaponLayer(layerConfig);
          break;
        case 'vignette':
          this.createVignetteLayer(layerConfig);
          break;
      }
    });
  }

  private createGradientLayer(config: BackgroundLayer): void {
    const layer = this.scene.add.container(0, 0);
    layer.setDepth(config.depth);

    const graphics = this.scene.add.graphics();
    graphics.fillGradientStyle(
      DARK_GOTHIC_THEME.colors.gradients.backgroundGradient.start,
      DARK_GOTHIC_THEME.colors.gradients.backgroundGradient.start,
      DARK_GOTHIC_THEME.colors.gradients.backgroundGradient.end,
      DARK_GOTHIC_THEME.colors.gradients.backgroundGradient.end,
      1,
    );
    graphics.fillRect(-2000, -2000, 4000, 4000);
    layer.add(graphics);

    this.currentGradient = graphics;
    this.layers.set('gradient', layer);
    this.add(layer);
  }

  private createParticleLayer(config: BackgroundLayer): void {
    const layer = this.scene.add.container(0, 0);
    layer.setDepth(config.depth);

    TextureGenerator.createAllParticleTextures(this.scene, 32);

    const particleCount = {
      low: 15,
      medium: 30,
      high: 50,
    }[this.config.quality];

    ['soulWisp', 'ember', 'mist'].forEach((type) => {
      const particleConfig = DARK_GOTHIC_THEME.effects.particles[type as keyof typeof DARK_GOTHIC_THEME.effects.particles];
      const textureKey = type === 'mist' ? 'particle_mist_64' : `particle_${type}_32`;

      const emitter = this.scene.add.particles(0, 0, textureKey, {
        x: { min: -500, max: 2000 },
        y: { min: -200, max: 1000 },
        speedX: { min: -20, max: 20 },
        speedY: { min: -30, max: -10 },
        lifespan: particleConfig.lifespan,
        frequency: particleConfig.frequency,
        maxAliveParticles: Math.floor(particleCount / 3),
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

      this.particleEmitters.set(type, emitter);
      layer.add(emitter);
    });

    this.layers.set('particles', layer);
    this.add(layer);
  }

  private createGhostLayer(config: BackgroundLayer): void {
    const layer = this.scene.add.container(0, 0);
    layer.setDepth(config.depth);

    const ghostTexture = this.createGhostTexture();
    const ghostCount = { low: 3, medium: 5, high: 8 }[this.config.quality];

    for (let i = 0; i < ghostCount; i++) {
      const ghost = this.scene.add.sprite(
        Phaser.Math.Between(-500, 2000),
        Phaser.Math.Between(-200, 1000),
        ghostTexture,
      );
      ghost.setAlpha(Phaser.Math.FloatBetween(0.05, 0.15));
      ghost.setScale(Phaser.Math.FloatBetween(0.5, 1.5));
      ghost.setFlipX(Phaser.Math.Between(0, 1) === 1);

      this.scene.tweens.add({
        targets: ghost,
        x: ghost.x + Phaser.Math.Between(-200, 200),
        y: ghost.y + Phaser.Math.Between(-100, 100),
        duration: Phaser.Math.Between(8000, 15000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Phaser.Math.Between(0, 5000),
      });

      this.ghostSprites.push(ghost);
      layer.add(ghost);
    }

    this.layers.set('ghosts', layer);
    this.add(layer);
  }

  private createGhostTexture(): string {
    const key = 'ghost_silhouette';
    if (this.scene.textures.exists(key)) {
      return key;
    }

    const size = 128;
    const texture = this.scene.textures.createCanvas(key, size, size);
    if (!texture) return key;

    const ctx = texture.getContext();

    ctx.fillStyle = 'rgba(200, 200, 220, 0.8)';
    
    ctx.beginPath();
    ctx.moveTo(size / 2, 10);
    ctx.bezierCurveTo(size * 0.3, 20, size * 0.2, 40, size * 0.2, 60);
    ctx.lineTo(size * 0.1, size - 10);
    ctx.lineTo(size * 0.3, size - 30);
    ctx.lineTo(size * 0.5, size - 10);
    ctx.lineTo(size * 0.7, size - 30);
    ctx.lineTo(size * 0.9, size - 10);
    ctx.lineTo(size * 0.8, 60);
    ctx.bezierCurveTo(size * 0.8, 40, size * 0.7, 20, size / 2, 10);
    ctx.fill();

    texture.refresh();
    return key;
  }

  private createWeaponLayer(config: BackgroundLayer): void {
    const layer = this.scene.add.container(0, 0);
    layer.setDepth(config.depth);

    const weaponIcons = ['sword', 'axe', 'hammer'];
    const weaponCount = { low: 2, medium: 4, high: 6 }[this.config.quality];

    for (let i = 0; i < weaponCount; i++) {
      const weaponIcon = weaponIcons[i % weaponIcons.length];
      const textureKey = `bg_${weaponIcon}_${i}`;
      
      this.createWeaponTexture(weaponIcon);
      
      const weapon = this.scene.add.image(
        Phaser.Math.Between(-300, 1800),
        Phaser.Math.Between(-200, 1000),
        textureKey,
      );
      weapon.setAlpha(Phaser.Math.FloatBetween(0.1, 0.2));
      weapon.setScale(Phaser.Math.FloatBetween(0.3, 0.6));
      weapon.setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));

      this.scene.tweens.add({
        targets: weapon,
        rotation: weapon.rotation + Math.PI * 2,
        duration: Phaser.Math.Between(15000, 30000),
        repeat: -1,
        ease: 'Linear',
      });

      this.weaponSprites.push(weapon);
      layer.add(weapon);
    }

    this.layers.set('weapons', layer);
    this.add(layer);
  }

  private createWeaponTexture(type: string): string {
    const key = `bg_${type}`;
    if (this.scene.textures.exists(key)) {
      return key;
    }

    const size = 128;
    const texture = this.scene.textures.createCanvas(key, size, size);
    if (!texture) return key;

    const ctx = texture.getContext();
    
    ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
    ctx.lineWidth = 4;

    if (type === 'sword') {
      ctx.beginPath();
      ctx.moveTo(size / 2, 10);
      ctx.lineTo(size / 2 + 10, size - 30);
      ctx.lineTo(size / 2 - 10, size - 30);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (type === 'axe') {
      ctx.beginPath();
      ctx.arc(size / 2, 30, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(size / 2, 30);
      ctx.lineTo(size / 2, size - 30);
      ctx.stroke();
    } else if (type === 'hammer') {
      ctx.fillRect(size / 2 - 25, 20, 50, 30);
      ctx.strokeRect(size / 2 - 25, 20, 50, 30);
      ctx.beginPath();
      ctx.moveTo(size / 2, 20);
      ctx.lineTo(size / 2, size - 30);
      ctx.stroke();
    }

    texture.refresh();
    return key;
  }

  private createVignetteLayer(config: BackgroundLayer): void {
    const layer = this.scene.add.container(0, 0);
    layer.setDepth(config.depth);

    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    const vignetteTexture = TextureGenerator.createVignetteTexture(
      this.scene,
      width,
      height,
      0x000000,
      0.6,
      0.7,
    );

    const vignette = this.scene.add.image(width / 2, height / 2, vignetteTexture.key);
    vignette.setAlpha(0.8);
    
    this.scene.tweens.add({
      targets: vignette,
      alpha: 0.8,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    layer.add(vignette);
    this.layers.set('vignette', layer);
    this.add(layer);
  }

  private setupThemeVariant(theme: string): void {
    if (this.currentGradient) {
      const themeColors = {
        graveyard: { start: 0x0a0a1e, end: 0x1a1a2e },
        village: { start: 0x1a1a2e, end: 0x2a2a3e },
        castle: { start: 0x1a0a1e, end: 0x2a1a2e },
        ghost: { start: 0x0a1a2e, end: 0x1a2a3e },
        hell: { start: 0x1e0a0a, end: 0x2e1a1a },
      };

      const colors = themeColors[theme as keyof typeof themeColors] || themeColors.graveyard;
      this.currentGradient.clear();
      this.currentGradient.fillGradientStyle(colors.start, colors.start, colors.end, colors.end, 1);
      this.currentGradient.fillRect(-2000, -2000, 4000, 4000);
    }
  }

  public setTheme(theme: 'graveyard' | 'village' | 'castle' | 'ghost' | 'hell'): void {
    this.config.theme = theme;
    this.setupThemeVariant(theme);
  }

  public setQuality(quality: 'low' | 'medium' | 'high'): void {
    this.config.quality = quality;
    if (this.layers.has('particles')) {
      this.layers.get('particles')?.destroy();
      this.createParticleLayer({ type: 'particles', speed: 0.5, depth: -15, enabled: true });
    }
  }

  destroy(fromScene?: boolean): void {
    this.ghostSprites.forEach(sprite => sprite.destroy());
    this.weaponSprites.forEach(sprite => sprite.destroy());
    this.particleEmitters.forEach(emitter => emitter.stop());
    super.destroy(fromScene);
  }
}
