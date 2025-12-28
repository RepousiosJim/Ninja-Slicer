/**
 * LevelManager
 *
 * Manages level data, progression, and star ratings for the campaign mode.
 * Handles level loading, completion tracking, and unlock status.
 */

import { LevelConfig, WorldConfig, BossConfig } from '@config/types';
import { SaveManager } from './SaveManager';
import { DataLoader } from '../utils/DataLoader';
import { LEVEL_COMPLETE_SOULS, BOSS_DEFEAT_SOULS, STAR_BONUS_MULTIPLIER } from '@config/constants';

export class LevelManager {
  private static instance: LevelManager;

  // Loaded data
  private levels: Map<string, LevelConfig> = new Map();
  private worlds: Map<number, WorldConfig> = new Map();
  private bosses: Map<string, BossConfig> = new Map();

  // Dependencies
  private saveManager: SaveManager;
  private dataLoader: DataLoader;

  private constructor() {
    this.saveManager = new SaveManager();
    this.dataLoader = DataLoader.getInstance();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): LevelManager {
    if (!LevelManager.instance) {
      LevelManager.instance = new LevelManager();
    }
    return LevelManager.instance;
  }

  /**
   * Load all level data from DataLoader
   */
  async loadLevels(): Promise<void> {
    try {
      const levelsData = await this.dataLoader.loadLevels();
      
      // Load levels
      for (const level of levelsData) {
        this.levels.set(level.id, level);
      }

      // Load worlds and bosses from the raw JSON
      const response = await fetch('/src/data/levels.json');
      const rawData = await response.json();
      
      // Load worlds
      if (rawData.worlds) {
        for (const world of rawData.worlds) {
          this.worlds.set(world.id, world);
        }
      }

      // Load bosses
      if (rawData.bosses) {
        for (const bossId in rawData.bosses) {
          this.bosses.set(bossId, rawData.bosses[bossId]);
        }
      }

      console.log('[LevelManager] Loaded', this.levels.size, 'levels,', this.worlds.size, 'worlds,', this.bosses.size, 'bosses');
    } catch (error) {
      console.error('[LevelManager] Failed to load levels:', error);
    }
  }

  /**
   * Get level configuration by world and level number
   */
  getLevelConfig(world: number, level: number): LevelConfig | undefined {
    const levelId = `${world}-${level}`;
    return this.levels.get(levelId);
  }

  /**
   * Get level configuration by level ID
   */
  getLevelConfigById(levelId: string): LevelConfig | undefined {
    return this.levels.get(levelId);
  }

  /**
   * Get world configuration
   */
  getWorldConfig(world: number): WorldConfig | undefined {
    return this.worlds.get(world);
  }

  /**
   * Get boss configuration by boss ID
   */
  getBossConfig(bossId: string): BossConfig | undefined {
    return this.bosses.get(bossId);
  }

  /**
   * Check if a level is unlocked
   */
  isLevelUnlocked(world: number, level: number): boolean {
    const levelId = `${world}-${level}`;
    return this.saveManager.isLevelUnlocked(levelId);
  }

  /**
   * Check if a world is unlocked
   */
  isWorldUnlocked(world: number): boolean {
    // World 1 is always unlocked
    if (world === 1) return true;

    // Check if the boss of the previous world is defeated
    const prevWorld = world - 1;
    const bossLevelId = `${prevWorld}-5`;
    return (this.saveManager.getLevelStars(bossLevelId) || 0) > 0;
  }

  /**
   * Complete a level and calculate stars
   */
  completeLevel(world: number, level: number, score: number): number {
    const levelConfig = this.getLevelConfig(world, level);
    if (!levelConfig) {
      console.error(`[LevelManager] Level ${world}-${level} not found`);
      return 0;
    }

    const stars = this.calculateStars(levelConfig, score);
    const levelId = `${world}-${level}`;

    // Save level completion
    this.saveManager.completeLevel(levelId, stars);

    // Calculate and award souls
    let soulsReward: number;
    if (levelConfig.isBoss) {
      // Boss defeat reward
      const baseSouls = BOSS_DEFEAT_SOULS.base + (BOSS_DEFEAT_SOULS.perWorld * (world - 1));
      soulsReward = Math.floor(baseSouls * STAR_BONUS_MULTIPLIER[stars as keyof typeof STAR_BONUS_MULTIPLIER]);
    } else {
      // Normal level completion reward
      const baseSouls = LEVEL_COMPLETE_SOULS.base + (LEVEL_COMPLETE_SOULS.perWorld * (world - 1));
      soulsReward = Math.floor(baseSouls * STAR_BONUS_MULTIPLIER[stars as keyof typeof STAR_BONUS_MULTIPLIER]);
    }

    // Award souls
    this.saveManager.addSouls(soulsReward);

    console.log(`[LevelManager] Level ${levelId} completed with ${stars} stars, earned ${soulsReward} souls`);
    return stars;
  }

  /**
   * Calculate star rating from score
   */
  calculateStars(levelConfig: LevelConfig, score: number): number {
    const thresholds = levelConfig.starThresholds;
    
    if (score >= thresholds[2]) return 3;
    if (score >= thresholds[1]) return 2;
    if (score >= thresholds[0]) return 1;
    return 0;
  }

  /**
   * Get stars earned for a level
   */
  getLevelStars(world: number, level: number): number {
    const levelId = `${world}-${level}`;
    return this.saveManager.getLevelStars(levelId);
  }

  /**
   * Get world completion percentage (0-100)
   */
  getWorldProgress(world: number): number {
    let totalStars = 0;
    let maxStars = 0;

    for (let level = 1; level <= 5; level++) {
      const stars = this.getLevelStars(world, level);
      totalStars += stars;
      maxStars += 3;
    }

    return maxStars > 0 ? Math.floor((totalStars / maxStars) * 100) : 0;
  }

  /**
   * Get total stars earned across all levels
   */
  getTotalStars(): number {
    let total = 0;
    for (const [levelId, stars] of Object.entries(this.saveManager.getSaveData().levelStars)) {
      total += stars;
    }
    return total;
  }

  /**
   * Get total possible stars
   */
  getMaxStars(): number {
    return this.levels.size * 3;
  }

  /**
   * Get all levels for a world
   */
  getLevelsForWorld(world: number): LevelConfig[] {
    const levels: LevelConfig[] = [];
    for (let level = 1; level <= 5; level++) {
      const config = this.getLevelConfig(world, level);
      if (config) {
        levels.push(config);
      }
    }
    return levels;
  }

  /**
   * Get all worlds
   */
  getAllWorlds(): WorldConfig[] {
    return Array.from(this.worlds.values()).sort((a, b) => a.id - b.id);
  }

  /**
   * Get next level after current level
   */
  getNextLevel(world: number, level: number): { world: number; level: number } | null {
    // Try next level in same world
    if (level < 5) {
      return { world, level: level + 1 };
    }

    // Try first level of next world
    if (world < 5) {
      return { world: world + 1, level: 1 };
    }

    // No more levels
    return null;
  }

  /**
   * Check if level is a boss level
   */
  isBossLevel(world: number, level: number): boolean {
    const config = this.getLevelConfig(world, level);
    return config?.isBoss || false;
  }

  /**
   * Get boss ID for a level
   */
  getBossIdForLevel(world: number, level: number): string | undefined {
    const config = this.getLevelConfig(world, level);
    return config?.bossId;
  }
}

// Export singleton instance
export const levelManager = LevelManager.getInstance();
