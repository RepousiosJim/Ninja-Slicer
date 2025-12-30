/**
 * SpawnSystem
 * 
 * Manages monster, villager, and power-up spawning with configurable intervals and difficulty scaling.
 */

import Phaser from 'phaser';
import { Monster } from '../entities/Monster';
import { Zombie } from '../entities/Zombie';
import { Vampire } from '../entities/Vampire';
import { Ghost } from '../entities/Ghost';
import { Villager } from '../entities/Villager';
import { PowerUp } from '../entities/PowerUp';
import { SlowMotionPowerUp } from '../entities/SlowMotionPowerUp';
import { FrenzyPowerUp } from '../entities/FrenzyPowerUp';
import { ShieldPowerUp } from '../entities/ShieldPowerUp';
import { SoulMagnetPowerUp } from '../entities/SoulMagnetPowerUp';
import { MonsterFactory } from '../entities/MonsterFactory';
import { MonsterType, PowerUpType, LevelConfig, SpawnPattern } from '@config/types';
import { GRAVITY, POWERUP_BASE_SPAWN_INTERVAL, VILLAGER_SPEED_MULTIPLIER, SPAWN_PATTERNS, SCREEN_BOTTOM_Y } from '@config/constants';
import { calculateLaunchVelocity, randomInt, randomFloat, weightedRandom } from '../utils/helpers';

export class SpawnSystem {
  private scene: Phaser.Scene;
  private monsters: Monster[] = [];
  private villagers: Villager[] = [];
  private powerUps: PowerUp[] = [];
  private spawnTimer: number = 0;
  private spawnInterval: number = 2000; // Start with 2 seconds
  private minSpawnInterval: number = 500; // Minimum 0.5 seconds
  private elapsedTime: number = 0;
  private difficultyScale: number = 0;
  private powerUpTimer: number = 0;
  private powerUpInterval: number = POWERUP_BASE_SPAWN_INTERVAL * 1000; // ms
  private isSpawning: boolean = true;
  private levelConfig: LevelConfig | null = null;
  private spawnPattern: SpawnPattern = SpawnPattern.DEFAULT;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Update spawn system
   * @param time - Current time
   * @param delta - Time since last update
   */
  update(time: number, delta: number): void {
    if (!this.isSpawning) return;

    this.elapsedTime += delta;
    
    // Gradually decrease spawn interval (difficulty scaling)
    this.updateDifficulty();
    
    // Check spawn timer
    this.spawnTimer += delta;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnEntity();
      this.spawnTimer = 0;
    }
    
    // Check power-up spawn timer
    this.powerUpTimer += delta;
    if (this.powerUpTimer >= this.powerUpInterval) {
      this.spawnPowerUp();
      this.powerUpTimer = 0;
    }
    
    // Update all entities
    this.updateMonsters(time, delta);
    this.updateVillagers(time, delta);
    this.updatePowerUps(time, delta);
  }

  /**
   * Update difficulty based on elapsed time
   */
  private updateDifficulty(): void {
    // Decrease spawn interval over time (faster spawning)
    // Scale from 2000ms down to 500ms over 60 seconds
    const maxTime = 60000; // 60 seconds
    const progress = Math.min(this.elapsedTime / maxTime, 1);
    this.difficultyScale = progress;
    
    this.spawnInterval = 2000 - (progress * 1500); // 2000 -> 500
  }

  /**
   * Set level configuration
   */
  setLevelConfig(config: LevelConfig): void {
    this.levelConfig = config;
    this.spawnPattern = config.spawnPattern || SpawnPattern.DEFAULT;
    
    // Update spawn interval based on level config
    if (config.spawnRate > 0) {
      this.spawnInterval = (1 / config.spawnRate) * 1000;
    }
    
    // Update power-up interval based on level config
    if (config.powerUpInterval > 0) {
      this.powerUpInterval = config.powerUpInterval * 1000;
    }
  }

  /**
   * Set spawn pattern
   */
  setSpawnPattern(pattern: SpawnPattern): void {
    this.spawnPattern = pattern;
  }

  /**
   * Set difficulty modifiers for endless mode
   */
  setDifficultyModifiers(modifiers: {
    spawnRateMultiplier: number;
    speedMultiplier: number;
    villagerChance: number;
  }): void {
    // Apply spawn rate multiplier
    this.spawnInterval = Math.max(
      this.minSpawnInterval,
      this.spawnInterval / modifiers.spawnRateMultiplier,
    );

    // Store villager chance for spawnEntity
    (this as any).difficultyVillagerChance = modifiers.villagerChance;
  }

  /**
   * Spawn a new entity (monster or villager)
   */
  private spawnEntity(): void {
    // Calculate villager spawn chance (use level config if available)
    const gameTimeSeconds = this.elapsedTime / 1000;
    let villagerChance = Math.min(0.05 + (gameTimeSeconds / 120), 0.15);

    // Use difficulty modifier if set
    if ((this as any).difficultyVillagerChance !== undefined) {
      villagerChance = (this as any).difficultyVillagerChance;
    }
    
    // Use level-specific villager chance if in campaign mode
    if (this.levelConfig) {
      villagerChance = this.levelConfig.villagerChance;
    }
    
    // Determine if spawning villager
    if (Math.random() < villagerChance) {
      this.spawnVillager();
    } else {
      this.spawnMonster();
    }
  }

  /**
   * Spawn a new monster with weighted random type
   */
  private spawnMonster(): void {
    // Get monster weights (use level config if available)
    let weights = this.getMonsterWeights();
    
    if (this.levelConfig) {
      weights = {
        zombie: this.levelConfig.monsterWeights.zombie,
        vampire: this.levelConfig.monsterWeights.vampire,
        ghost: this.levelConfig.monsterWeights.ghost,
      };
    }
    
    const monsterType = weightedRandom(weights);
    
    // Random spawn position based on spawn pattern
    let spawnX: number = randomInt(100, 1180);
    let spawnY: number = 750;
    
    if (this.spawnPattern === SpawnPattern.GHOST_REALM) {
      // Ghost realm: spawn from all sides
      const side = Math.floor(Math.random() * 4);
      switch (side) {
      case 0: // Bottom
        spawnX = randomInt(100, 1180);
        spawnY = 750;
        break;
      case 1: // Top
        spawnX = randomInt(100, 1180);
        spawnY = -50;
        break;
      case 2: // Left
        spawnX = -50;
        spawnY = randomInt(100, 620);
        break;
      case 3: // Right
        spawnX = 1330;
        spawnY = randomInt(100, 620);
        break;
      }
    }
    
    // Random target point in upper screen area
    const targetX = randomInt(200, 1080);
    const targetY = randomInt(100, 400);
    
    // Calculate launch velocity
    const speed = randomFloat(200, 300);
    const velocity = calculateLaunchVelocity(spawnX, spawnY, targetX, targetY, GRAVITY);
    
    // Scale velocity by speed
    const velocityX = velocity.x * (speed / 200);
    const velocityY = velocity.y * (speed / 200);
    
    // Create monster using factory
    const monster = MonsterFactory.create(monsterType, this.scene, spawnX, spawnY);
    
    monster.spawn(spawnX, spawnY, velocityX, velocityY);
    
    // Add to active monsters
    this.monsters.push(monster);
  }

  /**
   * Spawn a new villager
   */
  private spawnVillager(): void {
    // Random spawn position along bottom edge
    const spawnX = randomInt(100, 1180);
    const spawnY = 750;
    
    // Random target point in upper screen area
    const targetX = randomInt(200, 1080);
    const targetY = randomInt(100, 400);
    
    // Calculate launch velocity (slower than monsters)
    const speed = randomFloat(200, 300) * VILLAGER_SPEED_MULTIPLIER;
    const velocity = calculateLaunchVelocity(spawnX, spawnY, targetX, targetY, GRAVITY);
    
    // Scale velocity by speed
    const velocityX = velocity.x * (speed / 200);
    const velocityY = velocity.y * (speed / 200);
    
    // Create villager
    const villager = new Villager(this.scene, spawnX, spawnY);
    villager.spawn(spawnX, spawnY, velocityX, velocityY);
    
    // Add to active villagers
    this.villagers.push(villager);
  }

  /**
   * Spawn a new power-up
   */
  private spawnPowerUp(): void {
    // Random spawn position along bottom edge
    const spawnX = randomInt(100, 1180);
    const spawnY = 750;
    
    // Random target point in upper screen area
    const targetX = randomInt(200, 1080);
    const targetY = randomInt(100, 400);
    
    // Calculate launch velocity
    const speed = randomFloat(200, 300);
    const velocity = calculateLaunchVelocity(spawnX, spawnY, targetX, targetY, GRAVITY);
    
    // Scale velocity by speed
    const velocityX = velocity.x * (speed / 200);
    const velocityY = velocity.y * (speed / 200);
    
    // Random power-up type
    const powerUpTypes = [
      PowerUpType.SLOW_MOTION,
      PowerUpType.FRENZY,
      PowerUpType.SHIELD,
      PowerUpType.SOUL_MAGNET,
    ];
    const powerUpType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    
    // Create power-up based on type
    let powerUp: PowerUp;
    switch (powerUpType) {
    case PowerUpType.SLOW_MOTION:
      powerUp = new SlowMotionPowerUp(this.scene, spawnX, spawnY);
      break;
    case PowerUpType.FRENZY:
      powerUp = new FrenzyPowerUp(this.scene, spawnX, spawnY);
      break;
    case PowerUpType.SHIELD:
      powerUp = new ShieldPowerUp(this.scene, spawnX, spawnY);
      break;
    case PowerUpType.SOUL_MAGNET:
      powerUp = new SoulMagnetPowerUp(this.scene, spawnX, spawnY);
      break;
    default:
      powerUp = new SlowMotionPowerUp(this.scene, spawnX, spawnY);
      break;
    }
    
    powerUp.spawn(spawnX, spawnY, velocityX, velocityY);
    
    // Add to active power-ups
    this.powerUps.push(powerUp);
  }

  /**
   * Get monster weights based on game time
   */
  private getMonsterWeights(): Record<MonsterType, number> {
    const gameTimeSeconds = this.elapsedTime / 1000;
    
    if (gameTimeSeconds < 30) {
      // 0-30s: 80% zombie, 15% vampire, 5% ghost
      return {
        zombie: 80,
        vampire: 15,
        ghost: 5,
      };
    } else if (gameTimeSeconds < 60) {
      // 30-60s: 60% zombie, 25% vampire, 15% ghost
      return {
        zombie: 60,
        vampire: 25,
        ghost: 15,
      };
    } else {
      // 60s+: 40% zombie, 35% vampire, 25% ghost
      return {
        zombie: 40,
        vampire: 35,
        ghost: 25,
      };
    }
  }

  /**
   * Update all active monsters
   * @param time - Current time
   * @param delta - Time since last update
   */
  private updateMonsters(time: number, delta: number): void {
    this.monsters = this.updateEntities(this.monsters, time, delta);
  }

  /**
   * Update all active villagers
   * @param time - Current time
   * @param delta - Time since last update
   */
  private updateVillagers(time: number, delta: number): void {
    this.villagers = this.updateEntities(this.villagers, time, delta);
  }

  /**
   * Update all active power-ups
   * @param time - Current time
   * @param delta - Time since last update
   */
  private updatePowerUps(time: number, delta: number): void {
    this.powerUps = this.updateEntities(this.powerUps, time, delta);
  }

  /**
   * Generic entity update method
   * Filters out inactive entities and updates active ones
   */
  private updateEntities<T extends { active: boolean; update: (t: number, d: number) => void }>(
    entities: T[],
    time: number,
    delta: number,
  ): T[] {
    return entities.filter(entity => {
      if (!entity || !entity.active) {
        return false;
      }
      entity.update(time, delta);
      return true;
    });
  }

  /**
   * Get all active monsters
   * @param outputArray - Optional pre-allocated array to populate
   * @returns Array of active monsters
   */
  getActiveMonsters(outputArray?: Monster[]): Monster[] {
    if (outputArray) {
      outputArray.length = 0;
      for (const monster of this.monsters) {
        if (monster.active) {
          outputArray.push(monster);
        }
      }
      return outputArray;
    }
    return this.monsters.filter(m => m.active);
  }

  /**
   * Get all active villagers
   * @param outputArray - Optional pre-allocated array to populate
   * @returns Array of active villagers
   */
  getActiveVillagers(outputArray?: Villager[]): Villager[] {
    if (outputArray) {
      outputArray.length = 0;
      for (const villager of this.villagers) {
        if (villager.active) {
          outputArray.push(villager);
        }
      }
      return outputArray;
    }
    return this.villagers.filter(v => v.active);
  }

  /**
   * Get all active power-ups
   * @param outputArray - Optional pre-allocated array to populate
   * @returns Array of active power-ups
   */
  getActivePowerUps(outputArray?: PowerUp[]): PowerUp[] {
    if (outputArray) {
      outputArray.length = 0;
      for (const powerUp of this.powerUps) {
        if (powerUp.active) {
          outputArray.push(powerUp);
        }
      }
      return outputArray;
    }
    return this.powerUps.filter(p => p.active);
  }

  /**
   * Stop spawning new entities
   */
  stopSpawning(): void {
    this.isSpawning = false;
  }

  /**
   * Resume spawning new entities
   */
  resumeSpawning(): void {
    this.isSpawning = true;
  }

  /**
   * Clear all entities
   */
  clearEntities(): void {
    for (const monster of this.monsters) {
      if (monster.active) {
        monster.destroy();
      }
    }
    this.monsters = [];
    
    for (const villager of this.villagers) {
      if (villager.active) {
        villager.destroy();
      }
    }
    this.villagers = [];
    
    for (const powerUp of this.powerUps) {
      if (powerUp.active) {
        powerUp.destroy();
      }
    }
    this.powerUps = [];
  }

  /**
   * Get current spawn interval
   * @returns Current spawn interval in milliseconds
   */
  getSpawnInterval(): number {
    return this.spawnInterval;
  }

  /**
   * Get current difficulty scale (0-1)
   * @returns Difficulty scale
   */
  getDifficultyScale(): number {
    return this.difficultyScale;
  }

  /**
   * Get elapsed game time in seconds
   * @returns Elapsed time in seconds
   */
  getElapsedTime(): number {
    return this.elapsedTime / 1000;
  }

  /**
   * Reset spawn system
   */
  reset(): void {
    this.clearEntities();
    this.spawnTimer = 0;
    this.spawnInterval = 2000;
    this.elapsedTime = 0;
    this.difficultyScale = 0;
    this.powerUpTimer = 0;
    this.isSpawning = true;
  }

  /**
   * Destroy spawn system
   */
  destroy(): void {
    this.clearEntities();
  }
}
