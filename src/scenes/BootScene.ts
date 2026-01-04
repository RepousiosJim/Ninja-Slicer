/**
 * BootScene
 *
 * The first scene loaded. Responsible for:
 * - Initializing the loading manager
 * - Setting up global game settings
 * - Transitioning to PreloaderScene
 *
 * This scene should be as lightweight as possible.
 */

import Phaser from 'phaser';
import { debugLog, debugWarn, debugError } from '@utils/DebugLogger';
import { ErrorHandler, ErrorCategory, ErrorSeverity } from '@utils/ErrorHandler';
import { ErrorToastManager } from '@ui/ErrorToast';


import { SCENE_KEYS, COLORS } from '@config/constants';
import { LoadingManager } from '@managers/LoadingManager';
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
    // Initialize loading manager
    LoadingManager.getInstance().initialize(this);
    debugLog('[BootScene] Loading Manager initialized');
  }

  /**
   * Initialize managers and start preloader
   */
  create(): void {
    debugLog('[BootScene] Initializing...');

    // Set up global game settings
    this.setupGameSettings();

    // Transition to preloader (or main menu for testing)
    this.transitionToNextScene();
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

    debugLog(`[BootScene] Settings applied - UI Scale: ${uiScale}`);
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

}
