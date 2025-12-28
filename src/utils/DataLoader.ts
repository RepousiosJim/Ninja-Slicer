/**
 * DataLoader
 *
 * Loads JSON data files at runtime with caching support.
 * Handles weapons, upgrades, and levels data.
 */

import { WeaponConfig, UpgradeConfig, LevelConfig } from '@config/types';

export class DataLoader {
  private static instance: DataLoader;

  // Cached data
  private weaponsCache: WeaponConfig[] = [];
  private upgradesCache: UpgradeConfig[] = [];
  private levelsCache: LevelConfig[] = [];

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): DataLoader {
    if (!DataLoader.instance) {
      DataLoader.instance = new DataLoader();
    }
    return DataLoader.instance;
  }

  /**
   * Load weapons data from weapons.json
   */
  async loadWeapons(): Promise<WeaponConfig[]> {
    if (this.weaponsCache.length > 0) {
      return this.weaponsCache;
    }

    try {
      const response = await fetch('/src/data/weapons.json');
      if (!response.ok) {
        throw new Error(`Failed to load weapons: ${response.statusText}`);
      }

      const data = await response.json();
      this.weaponsCache = data.weapons || [];
      return this.weaponsCache;
    } catch (error) {
      console.error('[DataLoader] Failed to load weapons:', error);
      this.weaponsCache = [];
      return [];
    }
  }

  /**
   * Load upgrades data from upgrades.json
   */
  async loadUpgrades(): Promise<UpgradeConfig[]> {
    if (this.upgradesCache.length > 0) {
      return this.upgradesCache;
    }

    try {
      const response = await fetch('/src/data/upgrades.json');
      if (!response.ok) {
        throw new Error(`Failed to load upgrades: ${response.statusText}`);
      }

      const data = await response.json();
      this.upgradesCache = data.upgrades || [];
      return this.upgradesCache;
    } catch (error) {
      console.error('[DataLoader] Failed to load upgrades:', error);
      this.upgradesCache = [];
      return [];
    }
  }

  /**
   * Load levels data from levels.json
   */
  async loadLevels(): Promise<LevelConfig[]> {
    if (this.levelsCache.length > 0) {
      return this.levelsCache;
    }

    try {
      const response = await fetch('/src/data/levels.json');
      if (!response.ok) {
        throw new Error(`Failed to load levels: ${response.statusText}`);
      }

      const data = await response.json();
      this.levelsCache = data.levels || [];
      return this.levelsCache;
    } catch (error) {
      console.error('[DataLoader] Failed to load levels:', error);
      this.levelsCache = [];
      return [];
    }
  }

  /**
   * Clear all cached data (useful for testing or hot reload)
   */
  clearCache(): void {
    this.weaponsCache = [];
    this.upgradesCache = [];
    this.levelsCache = [];
  }

  /**
   * Preload all data files
   */
  async loadAll(): Promise<{
    weapons: WeaponConfig[];
    upgrades: UpgradeConfig[];
    levels: LevelConfig[];
  }> {
    const [weapons, upgrades, levels] = await Promise.all([
      this.loadWeapons(),
      this.loadUpgrades(),
      this.loadLevels(),
    ]);

    return { weapons, upgrades, levels };
  }
}

// Export singleton instance
export const dataLoader = DataLoader.getInstance();
