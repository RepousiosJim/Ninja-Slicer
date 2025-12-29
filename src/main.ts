/**
 * Monster Slayer - Main Entry Point
 * 
 * This file initializes the Phaser game instance with all configuration.
 */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, GAME_TITLE } from '@config/constants';

// Import scenes
import { BootScene } from '@scenes/BootScene';
import { PreloaderScene } from '@scenes/PreloaderScene';
import { MainMenuScene } from '@scenes/MainMenuScene';
import { WorldSelectScene } from '@scenes/WorldSelectScene';
import { LevelSelectScene } from '@scenes/LevelSelectScene';
import { LevelCompleteScene } from '@scenes/LevelCompleteScene';
import { GameplayScene } from '@scenes/GameplayScene';
import { EndlessGameplayScene } from '@scenes/EndlessGameplayScene';
import { GameOverScene } from '@scenes/GameOverScene';
import { CharacterScene } from '@scenes/CharacterScene';
import { InventoryScene } from '@scenes/InventoryScene';
import { ShopScene } from '@scenes/ShopScene';
import { LeaderboardScene } from '@scenes/LeaderboardScene';
import { SettingsScene } from '@scenes/SettingsScene';
import { PauseScene } from '@scenes/PauseScene';
import { UpdatesScene } from '@scenes/UpdatesScene';

/**
 * Phaser Game Configuration
 */
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO, // Auto-detect WebGL or Canvas
  
  // Game dimensions
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  
  // Parent container
  parent: 'game-container',
  
  // Background color
  backgroundColor: '#1a1a2e',
  
  // Scaling configuration for responsive design
  scale: {
    mode: Phaser.Scale.FIT, // Maintains aspect ratio and fits within container
    autoCenter: Phaser.Scale.CENTER_BOTH, // Centers horizontally and vertically
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    min: {
      width: 320,  // Minimum width (mobile portrait)
      height: 568, // Minimum height (iPhone SE size)
    },
    max: {
      width: 3840,  // Support 4K displays
      height: 2160,
    },
    // Allow fullscreen on supported devices
    fullscreenTarget: 'game-container',
    // Automatically expand to fill available space
    expandParent: false,
    // Maintain aspect ratio
    autoRound: true,
  },
  
  // Physics configuration
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 800 },
      debug: import.meta.env.DEV, // Show debug info in development
    },
  },
  
  // Input configuration
  input: {
    activePointers: 3, // Support multi-touch (for mobile)
    touch: {
      capture: true, // Prevent default touch behaviors
      target: null,  // Use game canvas
    },
    mouse: {
      target: null,  // Use game canvas
    },
    windowEvents: true, // Handle window events
  },
  
  // Rendering configuration
  render: {
    pixelArt: true, // Crisp pixel art scaling
    antialias: false,
    roundPixels: true,
  },
  
  // Audio configuration
  audio: {
    disableWebAudio: false,
  },
  
  // Scene list (order matters - first scene is started first)
  scene: [
    BootScene,
    PreloaderScene,
    MainMenuScene,
    WorldSelectScene,
    LevelSelectScene,
    GameplayScene,
    EndlessGameplayScene,
    LevelCompleteScene,
    GameOverScene,
    CharacterScene,
    InventoryScene,
    ShopScene,
    LeaderboardScene,
    SettingsScene,
    PauseScene,
    UpdatesScene,
  ],
  
  // Callbacks
  callbacks: {
    preBoot: (_game) => {
      // Called before the game boots
      console.log(`${GAME_TITLE} - Initializing...`);
    },
    postBoot: (_game) => {
      // Called after the game boots
      console.log(`${GAME_TITLE} - Ready!`);
    },
  },
};

/**
 * Initialize the game
 */
const game = new Phaser.Game(config);

/**
 * Handle window resize and orientation changes
 */
let resizeTimeout: number;
window.addEventListener('resize', () => {
  // Debounce resize events to improve performance
  clearTimeout(resizeTimeout);
  resizeTimeout = window.setTimeout(() => {
    game.scale.refresh();

    // Emit resize event to all active scenes
    game.scene.scenes.forEach((scene) => {
      if (scene.scene.isActive()) {
        scene.events.emit('resize', {
          width: game.scale.width,
          height: game.scale.height,
        });
      }
    });
  }, 100);
});

/**
 * Handle orientation changes (mobile devices)
 */
window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    game.scale.refresh();

    // Emit orientation change event to all active scenes
    game.scene.scenes.forEach((scene) => {
      if (scene.scene.isActive()) {
        scene.events.emit('orientationchange', {
          orientation: screen.orientation?.type || 'unknown',
        });
      }
    });
  }, 300); // Delay to ensure DOM has updated
});

/**
 * Handle visibility change (pause when tab is hidden)
 */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    game.scene.scenes.forEach((scene) => {
      if (scene.scene.isActive()) {
        // You could emit a pause event here
        // scene.events.emit('pause');
      }
    });
  }
});

/**
 * Prevent context menu on right-click (for desktop)
 */
window.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

/**
 * Export game instance for debugging
 */
if (import.meta.env.DEV) {
  (window as any).game = game;
}

export default game;
