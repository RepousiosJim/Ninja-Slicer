/**
 * Texture Generator Utility
 * Programmatically generates textures for buttons, particles, and effects
 * without requiring external image assets
 */

import Phaser from 'phaser';

export class TextureGenerator {
  /**
   * Generate gradient button texture
   * Creates a rounded rectangle button with gradient fill and border
   */
  static createGradientButton(
    scene: Phaser.Scene,
    width: number,
    height: number,
    startColor: number,
    endColor: number,
    borderColor: number,
    state: 'normal' | 'hover' | 'pressed' | 'disabled',
  ): Phaser.Textures.CanvasTexture {
    const key = `button_gradient_${state}_${Date.now()}`;
    const texture = scene.textures.createCanvas(key, width, height);
    if (!texture) {
      throw new Error(`Failed to create canvas texture: ${key}`);
    }

    const ctx = texture.getContext();

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, this.colorToHex(startColor));
    gradient.addColorStop(1, this.colorToHex(endColor));

    // Fill rounded rectangle
    ctx.fillStyle = gradient;
    this.roundRect(ctx, 0, 0, width, height, 8);
    ctx.fill();

    // Border
    ctx.strokeStyle = this.colorToHex(borderColor);
    ctx.lineWidth = 3;
    this.roundRect(ctx, 1.5, 1.5, width - 3, height - 3, 8);
    ctx.stroke();

    // Inner shadow (for depth)
    if (state === 'normal' || state === 'hover') {
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 2;
      this.roundRect(ctx, 2, 2, width - 4, height - 4, 7);
      ctx.stroke();
    }

    // Brightness adjustment for pressed state
    if (state === 'pressed') {
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      this.roundRect(ctx, 0, 0, width, height, 8);
      ctx.fill();
    }

    // Glow overlay for hover state
    if (state === 'hover') {
      const glowGradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, width / 2,
      );
      glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.2)');
      glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
      ctx.fillStyle = glowGradient;
      ctx.fillRect(0, 0, width, height);
    }

    texture.refresh();
    return texture;
  }

  /**
   * Create particle texture (wisp, ember, mist)
   * Generates a radial gradient particle texture
   */
  static createParticleTexture(
    scene: Phaser.Scene,
    type: 'wisp' | 'ember' | 'mist',
    size: number,
  ): Phaser.Textures.CanvasTexture {
    const key = `particle_${type}_${size}`;

    // Check if texture already exists
    if (scene.textures.exists(key)) {
      return scene.textures.get(key) as Phaser.Textures.CanvasTexture;
    }

    const texture = scene.textures.createCanvas(key, size, size);
    if (!texture) {
      throw new Error(`Failed to create canvas texture: ${key}`);
    }

    const ctx = texture.getContext();

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2;

    // Create radial gradient based on type
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius,
    );

    switch (type) {
    case 'wisp':
      gradient.addColorStop(0, 'rgba(255, 215, 0, 1)');
      gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.5)');
      gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
      break;
    case 'ember':
      gradient.addColorStop(0, 'rgba(255, 69, 0, 1)');
      gradient.addColorStop(0.4, 'rgba(255, 140, 0, 0.7)');
      gradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
      break;
    case 'mist':
      gradient.addColorStop(0, 'rgba(74, 0, 128, 0.6)');
      gradient.addColorStop(0.7, 'rgba(74, 0, 128, 0.3)');
      gradient.addColorStop(1, 'rgba(74, 0, 128, 0)');
      break;
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    texture.refresh();
    return texture;
  }

  /**
   * Create noise texture for overlay
   * Generates a subtle noise pattern
   */
  static createNoiseTexture(
    scene: Phaser.Scene,
    width: number,
    height: number,
    intensity: number = 0.1,
  ): Phaser.Textures.CanvasTexture {
    const key = `noise_${width}x${height}`;

    // Check if texture already exists
    if (scene.textures.exists(key)) {
      return scene.textures.get(key) as Phaser.Textures.CanvasTexture;
    }

    const texture = scene.textures.createCanvas(key, width, height);
    if (!texture) {
      throw new Error(`Failed to create canvas texture: ${key}`);
    }

    const ctx = texture.getContext();
    const imageData = ctx.createImageData(width, height);

    // Generate noise
    for (let i = 0; i < imageData.data.length; i += 4) {
      const value = Math.random() * 255 * intensity;
      imageData.data[i] = value; // R
      imageData.data[i + 1] = value; // G
      imageData.data[i + 2] = value; // B
      imageData.data[i + 3] = 255; // A
    }

    ctx.putImageData(imageData, 0, 0);
    texture.refresh();
    return texture;
  }

  /**
   * Create glow texture for effects
   * Generates a soft glow texture with multiple layers
   */
  static createGlowTexture(
    scene: Phaser.Scene,
    size: number,
    color: number,
    intensity: number = 1.0,
  ): Phaser.Textures.CanvasTexture {
    const key = `glow_${size}_${color}_${intensity}`;

    // Check if texture already exists
    if (scene.textures.exists(key)) {
      return scene.textures.get(key) as Phaser.Textures.CanvasTexture;
    }

    const texture = scene.textures.createCanvas(key, size, size);
    if (!texture) {
      throw new Error(`Failed to create canvas texture: ${key}`);
    }

    const ctx = texture.getContext();

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2;

    // Convert color to RGB
    const r = (color >> 16) & 255;
    const g = (color >> 8) & 255;
    const b = color & 255;

    // Create multi-layer glow
    // Inner bright glow
    const innerGradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius * 0.3,
    );
    innerGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.8 * intensity})`);
    innerGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${0.4 * intensity})`);

    ctx.fillStyle = innerGradient;
    ctx.fillRect(0, 0, size, size);

    // Outer soft glow
    const outerGradient = ctx.createRadialGradient(
      centerX, centerY, radius * 0.3,
      centerX, centerY, radius,
    );
    outerGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.4 * intensity})`);
    outerGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

    ctx.fillStyle = outerGradient;
    ctx.fillRect(0, 0, size, size);

    texture.refresh();
    return texture;
  }

  /**
   * Create vignette texture
   * Generates a radial vignette overlay
   */
  static createVignetteTexture(
    scene: Phaser.Scene,
    width: number,
    height: number,
    color: number = 0x000000,
    intensity: number = 0.5,
    radius: number = 0.7,
  ): Phaser.Textures.CanvasTexture {
    const key = `vignette_${width}x${height}_${color}`;

    // Check if texture already exists
    if (scene.textures.exists(key)) {
      return scene.textures.get(key) as Phaser.Textures.CanvasTexture;
    }

    const texture = scene.textures.createCanvas(key, width, height);
    if (!texture) {
      throw new Error(`Failed to create canvas texture: ${key}`);
    }

    const ctx = texture.getContext();

    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.max(width, height);

    // Convert color to RGB
    const r = (color >> 16) & 255;
    const g = (color >> 8) & 255;
    const b = color & 255;

    // Create radial gradient vignette
    for (let i = 0; i < 20; i++) {
      const currentRadius = (maxRadius * radius) + (i * 30);
      const alpha = i * 0.025 * intensity; // Gradually increase opacity
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    texture.refresh();
    return texture;
  }

  /**
   * Helper: Draw rounded rectangle path
   */
  private static roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  /**
   * Helper: Convert color number to hex string
   */
  private static colorToHex(color: number): string {
    return `#${color.toString(16).padStart(6, '0')}`;
  }

  /**
   * Helper: Convert hex string to color number
   */
  static hexToColor(hex: string): number {
    return parseInt(hex.replace('#', ''), 16);
  }

  /**
   * Batch create all particle textures
   * Creates all particle types at once for efficiency
   */
  static createAllParticleTextures(scene: Phaser.Scene, size: number = 32): void {
    this.createParticleTexture(scene, 'wisp', size);
    this.createParticleTexture(scene, 'ember', size);
    this.createParticleTexture(scene, 'mist', size * 2); // Mist particles are larger
  }

  /**
   * Clear cached textures
   * Removes generated textures from the texture manager
   */
  static clearCachedTextures(scene: Phaser.Scene, prefix: string): void {
    const textureManager = scene.textures;
    const keys = textureManager.getTextureKeys();

    keys.forEach((key) => {
      if (key.startsWith(prefix)) {
        textureManager.remove(key);
      }
    });
  }
}
