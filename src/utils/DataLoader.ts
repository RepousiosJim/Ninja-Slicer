 
/**
 * DataLoader
 *
 * Loads JSON data files at runtime with caching support.
 * Now integrates with LoadingManager for asset management.
 * Handles weapons, upgrades, and levels data.
 */

import type { WeaponConfig, UpgradeConfig, LevelConfig } from '@config/types';
import { debugError, debugWarn, debugLog } from '@utils/DebugLogger';
import { ErrorHandler, ErrorCategory } from '@utils/ErrorHandler';
import { LoadingManager } from '@managers/LoadingManager';


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
   * Get LoadingManager instance
   */
  private getLoadingManager(): LoadingManager {
    return LoadingManager.getInstance();
  }

  /**
   * Load weapons data with retry logic and LoadingManager integration
   */
  async loadWeapons(): Promise<WeaponConfig[]> {
    if (this.weaponsCache.length > 0) {
      return this.weaponsCache;
    }

    try {
      // Check if asset is already loaded via LoadingManager
      const loadingManager = this.getLoadingManager();
      if (loadingManager.isAssetLoaded('data_weapons')) {
        // Data is already loaded, retrieve from scene registry
        const scene = loadingManager.getScene();
        if (scene) {
          const weapons = scene.registry.get('weapons');
          if (weapons && Array.isArray(weapons)) {
            this.weaponsCache = weapons;
            debugLog('[DataLoader] Weapons retrieved from registry');
            return this.weaponsCache;
          }
        }
      }

      // Load using ErrorHandler with retry logic
      const data = await ErrorHandler.withRetry(
        async () => {
          const response = await fetch('/src/data/weapons.json');
          if (!response.ok) {
            throw new Error(`Failed to load weapons: ${response.statusText}`);
          }
          return await response.json();
        },
        {
          maxRetries: 3,
          delay: 1000,
          backoff: true,
          onRetry: (attempt, error) => {
            debugWarn(`[DataLoader] Retry ${attempt} for weapons:`, error);
          },
          context: {
            scene: 'Global',
            component: 'DataLoader',
            action: 'load_weapons'
          }
        }
      );
      
      this.weaponsCache = data.weapons || [];
      debugLog('[DataLoader] Weapons loaded successfully');
      return this.weaponsCache;
    } catch (error) {
      const err = error as Error;
      debugError('[DataLoader] Failed to load weapons after retries:', err);
      
      ErrorHandler.handle(err, {
        scene: 'Global',
        component: 'DataLoader',
        action: 'load_weapons'
      });
      
      this.weaponsCache = [];
      return [];
    }
  }

  /**
   * Load upgrades data with retry logic and LoadingManager integration
   */
  async loadUpgrades(): Promise<UpgradeConfig[]> {
    if (this.upgradesCache.length > 0) {
      return this.upgradesCache;
    }

    try {
      // Check if asset is already loaded via LoadingManager
      const loadingManager = this.getLoadingManager();
      if (loadingManager.isAssetLoaded('data_upgrades')) {
        // Data is already loaded, retrieve from scene registry
        const scene = loadingManager.getScene();
        if (scene) {
          const upgrades = scene.registry.get('upgrades');
          if (upgrades && Array.isArray(upgrades)) {
            this.upgradesCache = upgrades;
            debugLog('[DataLoader] Upgrades retrieved from registry');
            return this.upgradesCache;
          }
        }
      }

      const data = await ErrorHandler.withRetry(
        async () => {
          const response = await fetch('/src/data/upgrades.json');
          if (!response.ok) {
            throw new Error(`Failed to load upgrades: ${response.statusText}`);
          }
          return await response.json();
        },
        {
          maxRetries: 3,
          delay: 1000,
          backoff: true,
          onRetry: (attempt, error) => {
            debugWarn(`[DataLoader] Retry ${attempt} for upgrades:`, error);
          },
          context: {
            scene: 'Global',
            component: 'DataLoader',
            action: 'load_upgrades'
          }
        }
      );
      
      this.upgradesCache = data.upgrades || [];
      debugLog('[DataLoader] Upgrades loaded successfully');
      return this.upgradesCache;
    } catch (error) {
      const err = error as Error;
      debugError('[DataLoader] Failed to load upgrades after retries:', err);
      
      ErrorHandler.handle(err, {
        scene: 'Global',
        component: 'DataLoader',
        action: 'load_upgrades'
      });
      
      this.upgradesCache = [];
      return [];
    }
  }

  /**
   * Load levels data with retry logic and LoadingManager integration
   */
  async loadLevels(): Promise<LevelConfig[]> {
    if (this.levelsCache.length > 0) {
      return this.levelsCache;
    }

    try {
      // Check if asset is already loaded via LoadingManager
      const loadingManager = this.getLoadingManager();
      if (loadingManager.isAssetLoaded('data_levels')) {
        // Data is already loaded, retrieve from scene registry
        const scene = loadingManager.getScene();
        if (scene) {
          const levels = scene.registry.get('levels');
          if (levels && Array.isArray(levels)) {
            this.levelsCache = levels;
            debugLog('[DataLoader] Levels retrieved from registry');
            return this.levelsCache;
          }
        }
      }

      const data = await ErrorHandler.withRetry(
        async () => {
          const response = await fetch('/src/data/levels.json');
          if (!response.ok) {
            throw new Error(`Failed to load levels: ${response.statusText}`);
          }
          return await response.json();
        },
        {
          maxRetries: 3,
          delay: 1000,
          backoff: true,
          onRetry: (attempt, error) => {
            debugWarn(`[DataLoader] Retry ${attempt} for levels:`, error);
          },
          context: {
            scene: 'Global',
            component: 'DataLoader',
            action: 'load_levels'
          }
        }
      );
      
      this.levelsCache = data.levels || [];
      debugLog('[DataLoader] Levels loaded successfully');
      return this.levelsCache;
    } catch (error) {
      const err = error as Error;
      debugError('[DataLoader] Failed to load levels after retries:', err);
      
      ErrorHandler.handle(err, {
        scene: 'Global',
        component: 'DataLoader',
        action: 'load_levels'
      });
      
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

  /**
   * Get weapons from cache
   */
  getWeapons(): WeaponConfig[] {
    return this.weaponsCache;
  }

  /**
   * Get upgrades from cache
   */
  getUpgrades(): UpgradeConfig[] {
    return this.upgradesCache;
  }

  /**
   * Get levels from cache
   */
  getLevels(): LevelConfig[] {
    return this.levelsCache;
  }
}

// Export singleton instance
export const dataLoader = DataLoader.getInstance();
