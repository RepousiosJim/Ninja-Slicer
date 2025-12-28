/**
 * BootScene
 *
 * The first scene loaded. Responsible for:
 * - Minimal asset loading (loading bar graphics)
 * - Initializing game managers
 * - Transitioning to PreloaderScene
 *
 * This scene should be as lightweight as possible.
 */

import Phaser from 'phaser';
import { SCENE_KEYS, COLORS } from '@config/constants';
import { LevelManager } from '@managers/LevelManager';
import { WeaponManager } from '@managers/WeaponManager';
import { SaveManager } from '@managers/SaveManager';
import { ResponsiveUtils } from '../utils/ResponsiveUtils';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.boot });
  }

  /**
   * Preload minimal assets needed for loading screen
   */
  preload(): void {
    // For now, we don't have any boot assets
    // Later you might load a logo or loading bar sprites here
    
    // Example:
    // this.load.image('logo', 'assets/sprites/ui/logo.png');
    // this.load.image('loading-bar-bg', 'assets/sprites/ui/loading-bar-bg.png');
    // this.load.image('loading-bar-fill', 'assets/sprites/ui/loading-bar-fill.png');
  }

  /**
   * Initialize managers and start preloader
   */
  create(): void {
    console.log('[BootScene] Initializing...');

    // Generate button textures
    this.generateButtonTextures();

    // Initialize managers and store in registry for global access
    this.initializeManagers();

    // Set up global game settings
    this.setupGameSettings();

    // Transition to preloader (or main menu for testing)
    this.transitionToNextScene();
  }

  /**
   * Initialize all game managers
   */
  private initializeManagers(): void {
    // Level Manager - handles level data and progression
    const levelManager = LevelManager.getInstance();
    this.game.registry.set('levelManager', levelManager);
    
    // Weapon Manager - load weapon data
    const weaponManager = WeaponManager.getInstance();
    weaponManager.loadWeapons().then(() => {
      console.log('[BootScene] Weapons loaded successfully');
    }).catch((err: unknown) => {
      console.error('[BootScene] Failed to load weapons:', err);
    });
    
    console.log('[BootScene] Managers initialized');
  }

  /**
   * Set up global game settings
   */
  private setupGameSettings(): void {
    // Load saved settings or use defaults
    const saveManager = new SaveManager();
    const uiScale = saveManager.getUIScale();

    // Apply UI scale to ResponsiveUtils
    ResponsiveUtils.setUIScale(uiScale);

    console.log(`[BootScene] Settings applied - UI Scale: ${uiScale}`);
  }

  /**
   * Transition to the next scene
   */
  private transitionToNextScene(): void {
    // Hide the HTML loading screen
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
      // Remove from DOM after fade
      setTimeout(() => {
        loadingScreen.remove();
      }, 500);
    }
    
    // Start PreloaderScene
    this.scene.start(SCENE_KEYS.preloader);
  }

  /**
   * Generate button textures procedurally
   */
  private generateButtonTextures(): void {
    console.log('[BootScene] Generating button textures...');
    const graphics = this.add.graphics();

    // Define button dimensions (will be scaled by Button component)
    const width = 200;
    const height = 60;
    const radius = 8;

    // Generate for each state
    this.createButtonTexture(graphics, 'ui_button_normal', width, height, radius, 0x8b0000, 0xff0000);
    this.createButtonTexture(graphics, 'ui_button_hover', width, height, radius, 0xa00000, 0xff3333);
    this.createButtonTexture(graphics, 'ui_button_pressed', width, height, radius, 0x6b0000, 0xcc0000);
    this.createButtonTexture(graphics, 'ui_button_disabled', width, height, radius, 0x4a4a4a, 0x888888);

    graphics.destroy();
    console.log('[BootScene] Button textures generated successfully');
  }

  /**
   * Create a single button texture
   */
  private createButtonTexture(
    graphics: Phaser.GameObjects.Graphics,
    key: string,
    width: number,
    height: number,
    radius: number,
    fillColor: number,
    borderColor: number
  ): void {
    graphics.clear();

    // Draw rounded rectangle with gradient effect
    graphics.lineStyle(3, borderColor, 1);
    graphics.fillStyle(fillColor, 1);
    graphics.fillRoundedRect(0, 0, width, height, radius);
    graphics.strokeRoundedRect(0, 0, width, height, radius);

    // Generate texture from graphics
    graphics.generateTexture(key, width, height);
  }

}
