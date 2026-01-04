/**
 * LoadingManager
 *
 * Main asset loading manager that coordinates all asset loading operations.
 * Handles bundle loading, lazy loading, progress tracking, and memory management.
 */

import type Phaser from 'phaser';
import { debugLog, debugWarn, debugError } from '@utils/DebugLogger';
import { ErrorHandler, ErrorCategory, ErrorSeverity } from '@utils/ErrorHandler';
import type { LoadProgress } from './ProgressTracker';
import { ProgressTracker } from './ProgressTracker';

// Note: AssetRegistry and related types are not currently implemented
// These will be stubbed to allow compilation
interface AssetConfig {
  key: string;
  type: AssetType;
  priority?: AssetPriority;
  path?: string;
  bundle?: AssetBundle;
}

interface BundleConfig {
  name: AssetBundle;
  assets: AssetConfig[];
  spritesheetConfig?: {
    frameWidth: number;
    frameHeight: number;
  };
  atlasConfig?: {
    frames: string[];
  };
}

enum AssetType {
  IMAGE = 'image',
  AUDIO = 'audio',
  JSON = 'json',
  SPRITESHEET = 'spritesheet',
  ATLAS = 'atlas',
}

enum AssetPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

enum AssetBundle {
  ALL = 'all',
  AUDIO_MUSIC = 'audio_music',
  AUDIO_SFX = 'audio_sfx',
  EFFECTS = 'effects',
  UI = 'ui',
}

// Stub AssetRegistry class
class AssetRegistry {
  private static instance: AssetRegistry;
  private assets: Map<string, AssetConfig> = new Map();
  private bundles: Map<AssetBundle, BundleConfig> = new Map();

  static getInstance(): AssetRegistry {
    if (!AssetRegistry.instance) {
      AssetRegistry.instance = new AssetRegistry();
    }
    return AssetRegistry.instance;
  }

  getAsset(key: string): AssetConfig | undefined {
    return this.assets.get(key);
  }

  getAssetsByBundle(bundle: AssetBundle): AssetConfig[] {
    return this.assets.values().filter(asset => asset.bundle === bundle);
  }

  getBundle(bundleName: AssetBundle): BundleConfig | undefined {
    return this.bundles.get(bundleName);
  }

  getAllBundles(): BundleConfig[] {
    return Array.from(this.bundles.values());
  }

  getAutoLoadBundles(): BundleConfig[] {
    // Return all bundles for auto-loading
    return Array.from(this.bundles.values());
  }
}

/**
 * Main Loading Manager
 * Coordinates all asset loading operations with progress tracking
 */
export class LoadingManager {
  private static instance: LoadingManager;
  private scene: Phaser.Scene | null = null;
  private registry: AssetRegistry;
  private progressTracker: ProgressTracker;
  private basePath: string = 'assets/';

  // Asset tracking
  private loadedAssets: Set<string> = new Set();
  private failedAssets: Set<string> = new Set();
  private loadingPromises: Map<string, Promise<void>> = new Map();
  
  // Configuration
  private retryConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    backoff: true,
  };

  private constructor() {
    this.registry = AssetRegistry.getInstance();
    this.progressTracker = new ProgressTracker();
  }

  static getInstance(): LoadingManager {
    if (!LoadingManager.instance) {
      LoadingManager.instance = new LoadingManager();
    }
    return LoadingManager.instance;
  }

  /**
   * Initialize loading manager with a scene
   */
  initialize(scene: Phaser.Scene): void {
    this.scene = scene;
    this.scene.load.setPath(this.basePath);
    debugLog('[LoadingManager] Initialized with scene:', scene.scene.key);
  }

  /**
   * Load multiple bundles
   */
  async loadBundles(bundles: AssetBundle[]): Promise<void> {
    if (!this.scene) {
      throw new Error('LoadingManager not initialized. Call initialize() first.');
    }

    debugLog('[LoadingManager] Loading bundles:', bundles);

    // Gather all assets from bundles
    const allAssets: AssetConfig[] = [];
    bundles.forEach(bundleName => {
      const assets = this.registry.getAssetsByBundle(bundleName);
      allAssets.push(...assets);
    });

    // Sort by priority
    allAssets.sort((a, b) => a.priority - b.priority);

    // Set total for progress tracking
    this.progressTracker.setTotal(allAssets.length);

    // Load assets by priority
    await this.loadAssets(allAssets);
  }

  /**
   * Load specific assets
   */
  async loadAssets(assets: AssetConfig[]): Promise<void> {
    if (!this.scene) {
      throw new Error('LoadingManager not initialized. Call initialize() first.');
    }

    const loadPromises: Promise<void>[] = [];

    for (const asset of assets) {
      if (this.loadedAssets.has(asset.key) || this.failedAssets.has(asset.key)) {
        // Already loaded or failed
        this.progressTracker.incrementLoaded(asset.key);
        continue;
      }

      const promise = this.loadAssetWithRetry(asset);
      this.loadingPromises.set(asset.key, promise);
      loadPromises.push(promise);
    }

    await Promise.allSettled(loadPromises);
    
    debugLog(`[LoadingManager] Loading complete. Loaded: ${this.loadedAssets.size}, Failed: ${this.failedAssets.size}`);
  }

  /**
   * Load a single asset with retry logic
   */
  private async loadAssetWithRetry(asset: AssetConfig, retryCount: number = 0): Promise<void> {
    this.progressTracker.setCurrentAsset(asset.key, this.getCategoryName(asset.bundle));

    try {
      await this.loadAsset(asset);
    } catch (error) {
      const err = error as Error;
      debugError(`[LoadingManager] Failed to load ${asset.key} (attempt ${retryCount + 1}):`, err);

      if (retryCount < this.retryConfig.maxRetries) {
        // Calculate delay with exponential backoff
        const delay = this.retryConfig.backoff
          ? this.retryConfig.retryDelay * Math.pow(2, retryCount)
          : this.retryConfig.retryDelay;

        debugLog(`[LoadingManager] Retrying ${asset.key} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return this.loadAssetWithRetry(asset, retryCount + 1);
      } else {
        // Max retries reached
        throw new Error(`Failed to load ${asset.key} after ${this.retryConfig.maxRetries} attempts: ${err.message}`);
      }
    }
  }

  /**
   * Load a single asset
   */
  private async loadAsset(asset: AssetConfig): Promise<void> {
    if (!this.scene) {
      throw new Error('LoadingManager not initialized');
    }

    return new Promise((resolve, reject) => {
      try {
        switch (asset.type) {
          case AssetType.IMAGE:
            this.scene!.load.image(asset.key, asset.path);
            break;

          case AssetType.SPRITESHEET:
            this.scene!.load.spritesheet(
              asset.key,
              asset.path,
              asset.spritesheetConfig!
            );
            break;

          case AssetType.AUDIO:
            this.scene!.load.audio(asset.key, asset.path);
            break;

          case AssetType.JSON:
            // JSON is loaded via fetch, not Phaser loader
            this.loadJSONData(asset).then(resolve).catch(reject);
            return;

          case AssetType.ATLAS:
            this.scene!.load.atlas(
              asset.key,
              asset.atlasConfig!.textureURL,
              asset.atlasConfig!.atlasURL
            );
            break;

          default:
            throw new Error(`Unknown asset type: ${asset.type}`);
        }

        // Set up event listeners for Phaser loader
        const completeKey = `filecomplete-${asset.type}-${asset.key}`;

        this.scene!.load.once(completeKey, () => {
          this.loadedAssets.add(asset.key);
          this.progressTracker.incrementLoaded(asset.key);
          this.loadingPromises.delete(asset.key);
          resolve();
        });

        this.scene!.load.once(`loaderror-${asset.key}`, (file: any) => {
          const error = `Failed to load ${asset.key}: ${file.message || 'Unknown error'}`;
          reject(new Error(error));
        });

        // Start loading if not already started
        if (this.scene!.load.isLoading) {
          this.scene!.load.start();
        }

      } catch (error) {
        const err = error as Error;
        this.failedAssets.add(asset.key);
        this.progressTracker.incrementFailed(asset.key, err.message);
        this.loadingPromises.delete(asset.key);
        reject(err);
      }
    });
  }

  /**
   * Load JSON data via fetch
   */
  private async loadJSONData(asset: AssetConfig): Promise<void> {
    try {
      const response = await fetch(asset.path);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      
      // Store data in scene registry
      if (this.scene) {
        const key = asset.key.replace('data_', '');
        this.scene.registry.set(key, data);
        debugLog(`[LoadingManager] Loaded JSON data: ${key}`);
      }
      
      this.loadedAssets.add(asset.key);
      this.progressTracker.incrementLoaded(asset.key);
    } catch (error) {
      const err = error as Error;
      this.failedAssets.add(asset.key);
      this.progressTracker.incrementFailed(asset.key, err.message);
      throw err;
    }
  }

  /**
   * Lazy load an asset on-demand
   */
  async lazyLoadAsset(key: string): Promise<void> {
    if (this.loadedAssets.has(key)) {
      return; // Already loaded
    }

    const asset = this.registry.getAsset(key);
    if (!asset) {
      throw new Error(`Asset not found in registry: ${key}`);
    }

    debugLog(`[LoadingManager] Lazy loading asset: ${key}`);
    await this.loadAssetWithRetry(asset);
  }

  /**
   * Lazy load an entire bundle
   */
  async lazyLoadBundle(bundleName: AssetBundle): Promise<void> {
    const bundle = this.registry.getBundle(bundleName);
    if (!bundle) {
      throw new Error(`Bundle not found: ${bundleName}`);
    }

    debugLog(`[LoadingManager] Lazy loading bundle: ${bundleName}`);
    const assets = bundle.assets
      .map(key => this.registry.getAsset(key))
      .filter((a): a is AssetConfig => a !== undefined);

    await this.loadAssets(assets);
  }

  /**
   * Get category name from bundle
   */
  private getCategoryName(bundle: AssetBundle): string {
    switch (bundle) {
      case AssetBundle.BOOT:
        return 'Boot';
      case AssetBundle.UI:
        return 'UI';
      case AssetBundle.CORE_GAMEPLAY:
        return 'Core Gameplay';
      case AssetBundle.EFFECTS:
        return 'Effects';
      case AssetBundle.AUDIO_MUSIC:
        return 'Music';
      case AssetBundle.AUDIO_SFX:
        return 'Sound Effects';
      case AssetBundle.WORLD_1:
        return 'Graveyard';
      case AssetBundle.WORLD_2:
        return 'Haunted Village';
      case AssetBundle.WORLD_3:
        return 'Vampire Castle';
      case AssetBundle.WORLD_4:
        return 'Ghost Realm';
      case AssetBundle.WORLD_5:
        return 'Hell Dimension';
      default:
        return 'Unknown';
    }
  }

  /**
   * Check if asset is loaded
   */
  isAssetLoaded(key: string): boolean {
    return this.loadedAssets.has(key);
  }

  /**
   * Check if bundle is loaded
   */
  isBundleLoaded(bundleName: AssetBundle): boolean {
    const bundle = this.registry.getBundle(bundleName);
    if (!bundle) return false;

    return bundle.assets.every(key => this.loadedAssets.has(key));
  }

  /**
   * Get progress
   */
  getProgress(): LoadProgress {
    return this.progressTracker.getProgress();
  }

  /**
   * Subscribe to progress updates
   */
  onProgress(callback: (progress: LoadProgress) => void): void {
    this.progressTracker.onProgress(callback);
  }

  /**
   * Unsubscribe from progress updates
   */
  offProgress(callback: (progress: LoadProgress) => void): void {
    this.progressTracker.offProgress(callback);
  }

  /**
   * Get asset config
   */
  getAssetConfig(key: string): AssetConfig | undefined {
    return this.registry.getAsset(key);
  }

  /**
   * Get all loaded assets
   */
  getLoadedAssets(): string[] {
    return Array.from(this.loadedAssets);
  }

  /**
   * Get all failed assets
   */
  getFailedAssets(): string[] {
    return Array.from(this.failedAssets);
  }

  /**
   * Get registry (for advanced usage)
   */
  getRegistry(): AssetRegistry {
    return this.registry;
  }

  /**
   * Get current scene (for external managers)
   */
  getScene(): Phaser.Scene | null {
    return this.scene;
  }

  /**
   * Unload an asset to free memory
   */
  unloadAsset(key: string): void {
    if (!this.scene) return;

    const asset = this.registry.getAsset(key);
    if (!asset) return;

    try {
      // Type assertion needed because Phaser cache is indexed by string literals
      const cache = this.scene.cache as any;
      cache[asset.type].remove(key);
      this.loadedAssets.delete(key);
      debugLog(`[LoadingManager] Unloaded asset: ${key}`);
    } catch (error) {
      debugError(`[LoadingManager] Failed to unload asset ${key}:`, error);
    }
  }

  /**
   * Unload an entire bundle
   */
  unloadBundle(bundleName: AssetBundle): void {
    const bundle = this.registry.getBundle(bundleName);
    if (!bundle) return;

    debugLog(`[LoadingManager] Unloading bundle: ${bundleName}`);
    bundle.assets.forEach(key => this.unloadAsset(key));
  }

  /**
   * Unload bundles that are not in the keep list
   */
  unloadUnusedBundles(keepBundles: AssetBundle[]): void {
    const allBundles = this.registry.getAllBundles();
    allBundles.forEach(bundle => {
      if (!keepBundles.includes(bundle.name)) {
        this.unloadBundle(bundle.name);
      }
    });
  }

  /**
   * Reset loading manager
   */
  reset(): void {
    this.loadedAssets.clear();
    this.failedAssets.clear();
    this.loadingPromises.clear();
    this.progressTracker.reset();
    debugLog('[LoadingManager] Reset');
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalAssets: number;
    loadedAssets: number;
    failedAssets: number;
    progress: number;
  } {
    return {
      totalAssets: this.progressTracker.getTotal(),
      loadedAssets: this.loadedAssets.size,
      failedAssets: this.failedAssets.size,
      progress: this.progressTracker.getPercentage(),
    };
  }

  /**
   * Check if loading is in progress
   */
  isLoading(): boolean {
    return this.loadingPromises.size > 0;
  }

  /**
   * Wait for loading to complete
   */
  async waitForLoad(): Promise<void> {
    while (this.isLoading()) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

// Export singleton instance
export const loadingManager = LoadingManager.getInstance();

// Re-export types
export type { LoadProgress };
