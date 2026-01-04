/**
 * LazyLoader
 *
 * Utility class for convenient lazy loading of game assets.
 * Provides high-level methods for loading scene-specific and world-specific assets.
 * Automatically manages memory by unloading unused bundles.
 */

import { debugLog, debugWarn, debugError } from '@utils/DebugLogger';
import { LoadingManager } from './LoadingManager';
import { AssetBundle } from './AssetRegistry';

/**
 * Lazy Loader utility class
 * Provides convenient methods for on-demand asset loading
 */
export class LazyLoader {
  private static instance: LazyLoader;
  private loadingManager: LoadingManager;
  private loadedBundles: Set<AssetBundle> = new Set();
  private activeScene: string = '';

  private constructor() {
    this.loadingManager = LoadingManager.getInstance();
  }

  static getInstance(): LazyLoader {
    if (!LazyLoader.instance) {
      LazyLoader.instance = new LazyLoader();
    }
    return LazyLoader.instance;
  }

  /**
   * Preload assets for a specific scene
   * Loads all assets tagged with the scene name
   */
  async preloadSceneAssets(sceneKey: string): Promise<void> {
    debugLog(`[LazyLoader] Preloading assets for scene: ${sceneKey}`);
    this.activeScene = sceneKey;

    try {
      // Map scene to required bundles
      const bundles = this.getSceneBundles(sceneKey);
      
      // Load bundles if not already loaded
      for (const bundle of bundles) {
        if (!this.loadingManager.isBundleLoaded(bundle)) {
          await this.loadingManager.lazyLoadBundle(bundle);
          this.loadedBundles.add(bundle);
          debugLog(`[LazyLoader] Loaded bundle for ${sceneKey}: ${bundle}`);
        }
      }
    } catch (error) {
      const err = error as Error;
      debugError(`[LazyLoader] Failed to preload scene assets for ${sceneKey}:`, err);
      throw err;
    }
  }

  /**
   * Preload assets for a specific world
   * Loads world-specific bundles (backgrounds, music, etc.)
   */
  async preloadWorldAssets(worldId: number): Promise<void> {
    debugLog(`[LazyLoader] Preloading assets for world: ${worldId}`);
    
    try {
      const worldBundle = this.getWorldBundle(worldId);
      
      if (!worldBundle) {
        debugWarn(`[LazyLoader] No bundle configured for world ${worldId}`);
        return;
      }

      if (!this.loadingManager.isBundleLoaded(worldBundle)) {
        await this.loadingManager.lazyLoadBundle(worldBundle);
        this.loadedBundles.add(worldBundle);
        debugLog(`[LazyLoader] Loaded world ${worldId} bundle: ${worldBundle}`);
      } else {
        debugLog(`[LazyLoader] World ${worldId} bundle already loaded`);
      }
    } catch (error) {
      const err = error as Error;
      debugError(`[LazyLoader] Failed to preload world ${worldId} assets:`, err);
      throw err;
    }
  }

  /**
   * Preload assets for boss fight
   * Loads boss sprites, effects, and music
   */
  async preloadBossAssets(bossId: string): Promise<void> {
    debugLog(`[LazyLoader] Preloading assets for boss: ${bossId}`);
    
    try {
      // Core gameplay bundle (already loaded)
      if (!this.loadingManager.isBundleLoaded(AssetBundle.EFFECTS)) {
        await this.loadingManager.lazyLoadBundle(AssetBundle.EFFECTS);
        this.loadedBundles.add(AssetBundle.EFFECTS);
      }

      // Boss-specific assets
      const bossKey = `boss_${bossId}`;
      if (!this.loadingManager.isAssetLoaded(bossKey)) {
        await this.loadingManager.lazyLoadAsset(bossKey);
      }

      // Boss music
      if (!this.loadingManager.isAssetLoaded('music_boss')) {
        await this.loadingManager.lazyLoadAsset('music_boss');
      }

      // Boss sounds
      if (!this.loadingManager.isAssetLoaded('boss_roar')) {
        await this.loadingManager.lazyLoadAsset('boss_roar');
      }
      if (!this.loadingManager.isAssetLoaded('boss_hit')) {
        await this.loadingManager.lazyLoadAsset('boss_hit');
      }
    } catch (error) {
      const err = error as Error;
      debugError(`[LazyLoader] Failed to preload boss assets:`, err);
      throw err;
    }
  }

  /**
   * Preload menu assets
   * Loads UI and menu-specific assets
   */
  async preloadMenuAssets(): Promise<void> {
    debugLog('[LazyLoader] Preloading menu assets');
    
    try {
      // UI bundle (already loaded in preloader)
      if (!this.loadingManager.isBundleLoaded(AssetBundle.UI)) {
        await this.loadingManager.lazyLoadBundle(AssetBundle.UI);
        this.loadedBundles.add(AssetBundle.UI);
      }

      // Menu music
      if (!this.loadingManager.isAssetLoaded('music_menu')) {
        await this.loadingManager.lazyLoadAsset('music_menu');
      }

      // UI sounds
      if (!this.loadingManager.isAssetLoaded('button_click')) {
        await this.loadingManager.lazyLoadAsset('button_click');
      }
      if (!this.loadingManager.isAssetLoaded('button_hover')) {
        await this.loadingManager.lazyLoadAsset('button_hover');
      }
      if (!this.loadingManager.isAssetLoaded('menu_open')) {
        await this.loadingManager.lazyLoadAsset('menu_open');
      }
    } catch (error) {
      const err = error as Error;
      debugError('[LazyLoader] Failed to preload menu assets:', err);
      throw err;
    }
  }

  /**
   * Preload gameplay music and SFX
   */
  async preloadGameplayAudio(): Promise<void> {
    debugLog('[LazyLoader] Preloading gameplay audio');
    
    try {
      // Load music bundle
      if (!this.loadingManager.isBundleLoaded(AssetBundle.AUDIO_MUSIC)) {
        await this.loadingManager.lazyLoadBundle(AssetBundle.AUDIO_MUSIC);
        this.loadedBundles.add(AssetBundle.AUDIO_MUSIC);
      }

      // Load SFX bundle
      if (!this.loadingManager.isBundleLoaded(AssetBundle.AUDIO_SFX)) {
        await this.loadingManager.lazyLoadBundle(AssetBundle.AUDIO_SFX);
        this.loadedBundles.add(AssetBundle.AUDIO_SFX);
      }
    } catch (error) {
      const err = error as Error;
      debugError('[LazyLoader] Failed to preload gameplay audio:', err);
      throw err;
    }
  }

  /**
   * Unload bundles that are not in the keep list
   * Call this when transitioning between scenes to free memory
   */
  unloadUnusedBundles(keepBundles?: AssetBundle[]): void {
    const bundlesToKeep = keepBundles || [AssetBundle.UI, AssetBundle.CORE_GAMEPLAY];
    
    debugLog(`[LazyLoader] Unloading unused bundles, keeping:`, bundlesToKeep);
    
    this.loadedBundles.forEach(bundle => {
      if (!bundlesToKeep.includes(bundle)) {
        try {
          this.loadingManager.unloadBundle(bundle);
          this.loadedBundles.delete(bundle);
          debugLog(`[LazyLoader] Unloaded bundle: ${bundle}`);
        } catch (error) {
          debugError(`[LazyLoader] Failed to unload bundle ${bundle}:`, error);
        }
      }
    });
  }

  /**
   * Unload all non-critical bundles
   * Use this to free maximum memory
   */
  unloadAllNonCritical(): void {
    const criticalBundles = [
      AssetBundle.UI,
      AssetBundle.CORE_GAMEPLAY,
    ];
    
    debugLog('[LazyLoader] Unloading all non-critical bundles');
    this.unloadUnusedBundles(criticalBundles);
  }

  /**
   * Get bundles required for a scene
   */
  private getSceneBundles(sceneKey: string): AssetBundle[] {
    const bundles: AssetBundle[] = [];

    switch (sceneKey) {
      case 'MainMenuScene':
      case 'WorldSelectScene':
      case 'LevelSelectScene':
      case 'SettingsScene':
      case 'InventoryScene':
      case 'ShopScene':
      case 'LeaderboardScene':
      case 'CharacterScene':
        bundles.push(AssetBundle.UI);
        break;

      case 'GameplayScene':
      case 'EndlessGameplayScene':
        bundles.push(AssetBundle.CORE_GAMEPLAY, AssetBundle.EFFECTS);
        break;

      case 'LevelCompleteScene':
      case 'CampaignCompleteScene':
        bundles.push(AssetBundle.UI);
        break;

      case 'GameOverScene':
        bundles.push(AssetBundle.UI);
        break;
    }

    return bundles;
  }

  /**
   * Get bundle for a specific world
   */
  private getWorldBundle(worldId: number): AssetBundle | null {
    switch (worldId) {
      case 1:
        return AssetBundle.WORLD_1;
      case 2:
        return AssetBundle.WORLD_2;
      case 3:
        return AssetBundle.WORLD_3;
      case 4:
        return AssetBundle.WORLD_4;
      case 5:
        return AssetBundle.WORLD_5;
      default:
        return null;
    }
  }

  /**
   * Check if a bundle is loaded
   */
  isBundleLoaded(bundle: AssetBundle): boolean {
    return this.loadingManager.isBundleLoaded(bundle);
  }

  /**
   * Check if an asset is loaded
   */
  isAssetLoaded(key: string): boolean {
    return this.loadingManager.isAssetLoaded(key);
  }

  /**
   * Get all loaded bundles
   */
  getLoadedBundles(): AssetBundle[] {
    return Array.from(this.loadedBundles);
  }

  /**
   * Reset lazy loader (for game restart)
   */
  reset(): void {
    this.loadedBundles.clear();
    this.activeScene = '';
    debugLog('[LazyLoader] Reset');
  }

  /**
   * Get active scene
   */
  getActiveScene(): string {
    return this.activeScene;
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats(): {
    loadedBundles: number;
    totalBundles: number;
    estimatedMemory: string;
  } {
    const totalBundles = 10; // Total bundles in registry
    const loadedBundles = this.loadedBundles.size;
    
    // Rough estimate: each bundle ~2-5MB
    const estimatedMB = loadedBundles * 3;
    const estimatedMemory = estimatedMB > 1024 
      ? `${(estimatedMB / 1024).toFixed(2)} GB`
      : `${estimatedMB} MB`;

    return {
      loadedBundles,
      totalBundles,
      estimatedMemory,
    };
  }
}

// Export singleton instance
export const lazyLoader = LazyLoader.getInstance();
