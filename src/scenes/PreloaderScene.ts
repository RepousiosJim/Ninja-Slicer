/**
 * PreloaderScene
 *
 * Loads all game assets and displays a progress bar.
 * Uses bundle-based loading with priority ordering.
 * Shows detailed progress including categories and current asset.
 */

import Phaser from 'phaser';
import { SCENE_KEYS, GAME_WIDTH, GAME_HEIGHT } from '@config/constants';
import { ErrorHandler, ErrorCategory, ErrorSeverity } from '@utils/ErrorHandler';
import { ErrorToastManager } from '@ui/ErrorToast';
import { debugError, debugWarn, debugLog } from '@utils/DebugLogger';
import type { LoadProgress } from '@managers/LoadingManager';
import { LoadingManager } from '@managers/LoadingManager';
import { AssetBundle, AssetPriority } from '@managers/AssetRegistry';

export class PreloaderScene extends Phaser.Scene {
  private loadingManager: LoadingManager;
  private errorToastManager: ErrorToastManager | null = null;
  
  // UI Elements
  private progressBox!: Phaser.GameObjects.Graphics;
  private progressBar!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;
  private percentText!: Phaser.GameObjects.Text;
  private assetText!: Phaser.GameObjects.Text;
  private categoryProgressContainer!: Phaser.GameObjects.Container;
  private failedAssetsText!: Phaser.GameObjects.Text;
  
  // Progress tracking
  private categoryProgress: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private categoryText: Map<string, Phaser.GameObjects.Text> = new Map();

  constructor() {
    super({ key: SCENE_KEYS.preloader });
  }

  preload(): void {
    debugLog('[PreloaderScene] Starting preload...');
    
    // Initialize error toast manager
    this.errorToastManager = new ErrorToastManager(this);
    
    // Initialize loading manager
    this.loadingManager = LoadingManager.getInstance();
    this.loadingManager.initialize(this);
    
    // Create loading UI
    this.createLoadingUI();
    
    // Set up progress tracking
    this.setupProgressTracking();
    
    // Load auto-load bundles
    this.loadAutoLoadBundles();
  }

  create(): void {
    const progress = this.loadingManager.getProgress();
    
    // Show summary of failed assets if any
    if (progress.failed > 0) {
      this.errorToastManager?.showWarning(
        `${progress.failed} assets failed to load. Game will continue with reduced visuals.`,
        8000
      );
    }
    
    // Small delay before transitioning to let the player see 100%
    this.time.delayedCall(500, () => {
      this.scene.start(SCENE_KEYS.mainMenu);
    });
  }

  /**
   * Create the modern loading UI
   */
  private createLoadingUI(): void {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    // Progress box (background)
    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x2a2a4e, 0.9);
    this.progressBox.fillRoundedRect(centerX - 200, centerY - 100, 400, 200, 10);
    this.progressBox.lineStyle(2, 0x8b0000, 1);
    this.progressBox.strokeRoundedRect(centerX - 200, centerY - 100, 400, 200, 10);

    // Progress bar (fill)
    this.progressBar = this.add.graphics();

    // Loading text
    this.loadingText = this.add.text(centerX, centerY - 80, 'Loading Game Assets', {
      fontFamily: 'Arial',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Percentage text
    this.percentText = this.add.text(centerX, centerY, '0%', {
      fontFamily: 'Arial',
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#ff6666',
    }).setOrigin(0.5);

    // Asset being loaded text
    this.assetText = this.add.text(centerX, centerY + 60, 'Initializing...', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    // Failed assets text
    this.failedAssetsText = this.add.text(centerX, centerY + 90, 'Failed: 0', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#ff6666',
    }).setOrigin(0.5);

    // Category progress container
    this.categoryProgressContainer = this.add.container(centerX - 180, centerY + 25);
    this.createCategoryProgressBars();
  }

  /**
   * Create category progress bars
   */
  private createCategoryProgressBars(): void {
    const categories = [
      { name: 'UI', y: 0, color: 0x4CAF50 },
      { name: 'Core', y: 20, color: 0x2196F3 },
      { name: 'Effects', y: 40, color: 0xFF9800 },
      { name: 'Audio', y: 60, color: 0x9C27B0 },
    ];

    categories.forEach(cat => {
      // Label
      const label = this.add.text(0, cat.y, cat.name, {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: '#888888',
      }).setOrigin(0, 0.5);

      // Progress bar background
      const bg = this.add.graphics();
      bg.fillStyle(0x1a1a2e, 0.8);
      bg.fillRect(50, cat.y - 8, 330, 16);

      // Progress bar fill
      const bar = this.add.graphics();
      bar.fillStyle(cat.color, 1);
      bar.fillRect(50, cat.y - 8, 0, 16);

      // Percentage text
      const pctText = this.add.text(390, cat.y, '0%', {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: cat.color.toString(16),
      }).setOrigin(1, 0.5);

      this.categoryProgress.set(cat.name, bar);
      this.categoryText.set(cat.name, pctText);
      this.categoryProgressContainer.add([label, bg, bar, pctText]);
    });
  }

  /**
   * Set up progress tracking with LoadingManager
   */
  private setupProgressTracking(): void {
    this.loadingManager.onProgress((progress: LoadProgress) => {
      this.updateProgressUI(progress);
    });
  }

  /**
   * Update progress UI
   */
  private updateProgressUI(progress: LoadProgress): void {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    // Update overall progress bar
    this.progressBar.clear();
    this.progressBar.fillStyle(0x8b0000, 1);
    this.progressBar.fillRoundedRect(
      centerX - 190,
      centerY - 15,
      380 * (progress.percentage / 100),
      30,
      5,
    );
    this.percentText.setText(`${Math.floor(progress.percentage)}%`);

    // Update current asset text
    if (progress.currentAsset) {
      const assetName = progress.currentAsset.replace(/_/g, ' ').toUpperCase();
      this.assetText.setText(`Loading: ${assetName}`);
    }

    // Update failed assets text
    if (progress.failed > 0) {
      this.failedAssetsText.setText(`Failed: ${progress.failed} assets`);
      this.failedAssetsText.setColor('#ff0000');
    }

    // Update category progress (estimated based on bundle completion)
    this.updateCategoryProgress(progress);
  }

  /**
   * Update category progress bars
   */
  private updateCategoryProgress(progress: LoadProgress): void {
    // Get bundle progress from loaded assets
    const loadedAssets = this.loadingManager.getLoadedAssets();
    const totalAssets = progress.total;

    // Update UI bundle (mostly buttons)
    const uiAssets = ['ui_button', 'ui_heart', 'ui_star', 'ui_soul', 'ui_pause', 'ui_lock', 'ui_settings', 'ui_panel', 'ui_card_frame', 'ui_arrow', 'ui_sound_', 'ui_music_'];
    const uiLoaded = loadedAssets.filter(a => uiAssets.some(prefix => a.startsWith(prefix))).length;
    const uiTotal = totalAssets * 0.25; // Approximate
    this.updateCategoryBar('UI', uiLoaded, uiTotal);

    // Core bundle (enemies, weapons, villagers)
    const coreAssets = ['monster_', 'villager_', 'boss_', 'basic_sword', 'silver_blade', 'shadow_blade', 'holy_cross_blade', 'fire_sword', 'ice_blade', 'lightning_katana'];
    const coreLoaded = loadedAssets.filter(a => coreAssets.some(prefix => a.startsWith(prefix))).length;
    const coreTotal = totalAssets * 0.35;
    this.updateCategoryBar('Core', coreLoaded, coreTotal);

    // Effects bundle
    const effectsAssets = ['effect_', 'zombie_left_half', 'zombie_right_half', 'vampire_left_half', 'vampire_right_half', 'vampire_bat', 'horseman_head'];
    const effectsLoaded = loadedAssets.filter(a => effectsAssets.some(prefix => a.startsWith(prefix))).length;
    const effectsTotal = totalAssets * 0.20;
    this.updateCategoryBar('Effects', effectsLoaded, effectsTotal);

    // Audio bundle
    const audioAssets = ['music_', 'slash_', 'hit_', 'zombie_moan', 'vampire_hiss', 'ghost_wail', 'button_', 'pause_', 'menu_', 'powerup_', 'boss_', 'death_'];
    const audioLoaded = loadedAssets.filter(a => audioAssets.some(prefix => a.startsWith(prefix))).length;
    const audioTotal = totalAssets * 0.20;
    this.updateCategoryBar('Audio', audioLoaded, audioTotal);
  }

  /**
   * Update a single category bar
   */
  private updateCategoryBar(categoryName: string, loaded: number, total: number): void {
    const percentage = total > 0 ? (loaded / total) * 100 : 0;
    const bar = this.categoryProgress.get(categoryName);
    const text = this.categoryText.get(categoryName);

    if (bar && text) {
      bar.clear();
      const color = categoryName === 'UI' ? 0x4CAF50 
                  : categoryName === 'Core' ? 0x2196F3
                  : categoryName === 'Effects' ? 0xFF9800
                  : 0x9C27B0;
      bar.fillStyle(color, 1);
      bar.fillRect(50, 0, 330 * (percentage / 100), 16);
      text.setText(`${Math.floor(percentage)}%`);
    }
  }

  /**
   * Load auto-load bundles
   */
  private async loadAutoLoadBundles(): Promise<void> {
    try {
      const autoLoadBundles = this.loadingManager.getRegistry()
        .getAutoLoadBundles()
        .map((b: { name: string }) => b.name);

      debugLog('[PreloaderScene] Loading bundles:', autoLoadBundles);

      await this.loadingManager.loadBundles(autoLoadBundles);
      
      // Loading complete, create() will be called
    } catch (error) {
      const err = error as Error;
      debugError('[PreloaderScene] Failed to load bundles:', err);
      
      ErrorHandler.handle(err, {
        scene: this.scene.key,
        component: 'PreloaderScene',
        action: 'load_bundles'
      });

      // Show error and continue anyway
      if (this.errorToastManager) {
        this.errorToastManager.showError(
          'Some assets failed to load. Game will continue with reduced features.',
          10000
        );
      }
    }
  }
}
