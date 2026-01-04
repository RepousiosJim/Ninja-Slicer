/**
 * EntityVisibility
 * 
 * Utility for enhancing entity visibility with colored backgrounds.
 * Used by Monster and Villager classes to create consistent visual styling.
 */

import type Phaser from 'phaser';

export interface EntityVisibilityConfig {
  backgroundColor: number;
  borderColor: number;
  radius: number;
  scale: number;
  innerBorderColor?: number;
  innerBorderRadius?: number;
  pulse?: boolean;
}

/**
 * Interface for entities that can be enhanced with visibility
 */
interface VisibleEntity {
  texture: Phaser.Textures.Texture;
  x: number;
  y: number;
  depth: number;
  active: boolean;
  setScale(scale: number): void;
  setTint(color: number): void;
  rotation?: number;
}

/**
 * Enhance entity visibility with colored background circle
 * @param entity - The game object to enhance
 * @param scene - The scene entity belongs to
 * @param config - Configuration for visual enhancement
 */
export function enhanceEntityVisibility(
  entity: VisibleEntity,
  scene: Phaser.Scene,
  config: EntityVisibilityConfig,
): void {
  const {
    backgroundColor,
    borderColor,
    radius,
    scale,
    innerBorderColor,
    innerBorderRadius,
    pulse,
  } = config;

  // Create background graphics
  const background = scene.add.graphics();
  background.fillStyle(backgroundColor, 0.6);
  background.fillCircle(0, 0, radius);

  // Add outer border
  background.lineStyle(4, borderColor, 1);
  background.strokeCircle(0, 0, radius);

  // Add inner border if specified
  if (innerBorderColor && innerBorderRadius) {
    background.lineStyle(3, innerBorderColor, 1);
    background.strokeCircle(0, 0, innerBorderRadius);
  }

  // Generate texture
  const textureKey = `entity_bg_${entity.texture.key}`;
  background.generateTexture(textureKey, radius * 2, radius * 2);
  background.destroy();

  // Create background sprite
  const bgSprite = scene.add.sprite(entity.x, entity.y, textureKey);
  bgSprite.setDepth(entity.depth - 1);

  // Make background follow entity
  scene.events.on('update', () => {
    if (entity.active && bgSprite.active) {
      bgSprite.setPosition(entity.x, entity.y);
      if (entity.rotation !== undefined) {
        bgSprite.setRotation(entity.rotation);
      }
    } else if (bgSprite.active) {
      bgSprite.destroy();
    }
  });

  // Add pulse effect if specified
  if (pulse) {
    scene.tweens.add({
      targets: bgSprite,
      scale: 1.3,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // Scale up entity for better visibility
  entity.setScale(scale);

  // Make sprite bright
  entity.setTint(0xffffff);
}

/**
 * Get default visibility config for monster types
 */
export function getMonsterVisibilityConfig(monsterType: string): EntityVisibilityConfig {
  const configs: Record<string, EntityVisibilityConfig> = {
    zombie: {
      backgroundColor: 0x00ff00,
      borderColor: 0x00aa00,
      radius: 45,
      scale: 2.0,
    },
    vampire: {
      backgroundColor: 0xff0000,
      borderColor: 0xaa0000,
      radius: 45,
      scale: 2.0,
    },
    ghost: {
      backgroundColor: 0x00ffff,
      borderColor: 0x0088ff,
      radius: 45,
      scale: 2.0,
    },
  };

  return configs[monsterType] || configs.zombie;
}

/**
 * Get default visibility config for villagers
 */
export function getVillagerVisibilityConfig(): EntityVisibilityConfig {
  return {
    backgroundColor: 0xffff00,
    borderColor: 0xffffff,
    radius: 40,
    scale: 1.8,
    innerBorderColor: 0xff8800,
    innerBorderRadius: 32,
    pulse: true,
  };
}
