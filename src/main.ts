/**
 * Monster Slayer - Main Entry Point
 *
 * This file initializes the Phaser game instance with all configuration.
 */

import Phaser from 'phaser';
import * as Sentry from "@sentry/browser";
import { GAME_WIDTH, GAME_HEIGHT, GAME_TITLE } from '@config/constants';
import { debugLog, debugError } from '@utils/DebugLogger';
import { ErrorHandler, ErrorCategory, ErrorSeverity } from '@utils/ErrorHandler';

// Initialize Sentry
Sentry.init({
  dsn: "https://3dd560fc560055e503b1cfbde1f1a694@o4510625805172736.ingest.de.sentry.io/4510625839186000",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  // Tracing
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true
});

// Import scenes
import { BootScene } from '@scenes/BootScene';
import { PreloaderScene } from '@scenes/PreloaderScene';
import { MainMenuScene } from '@scenes/MainMenuScene';
import { WorldSelectScene } from '@scenes/WorldSelectScene';
import { LevelSelectScene } from '@scenes/LevelSelectScene';
import { LevelCompleteScene } from '@scenes/LevelCompleteScene';
import { CampaignCompleteScene } from '@scenes/CampaignCompleteScene';
import { GameplayScene } from '@scenes/GameplayScene';
import { EndlessGameplayScene } from '@scenes/EndlessGameplayScene';
import { GameOverScene } from '@scenes/GameOverScene';
import { CharacterScene } from '@scenes/CharacterScene';
import { InventoryScene } from '@scenes/InventoryScene';
import { ShopScene } from '@scenes/ShopScene';
import { LeaderboardScene } from '@scenes/LeaderboardScene';
import { SettingsScene } from '@scenes/SettingsScene';
import { PauseScene } from '@scenes/PauseScene';
import { ErrorScene } from '@scenes/ErrorScene';

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
    CampaignCompleteScene,
    GameOverScene,
    CharacterScene,
    InventoryScene,
    ShopScene,
    LeaderboardScene,
    SettingsScene,
    PauseScene,
    ErrorScene,
  ],
  
  // Callbacks
  callbacks: {
    preBoot: (_game) => {
      // Called before the game boots
      debugLog(`${GAME_TITLE} - Initializing...`);
    },
    postBoot: (_game) => {
      // Called after the game boots
      debugLog(`${GAME_TITLE} - Ready!`);
    },
  },
};

/**
 * Initialize the game with error handling
 */
function initializeGame(): Phaser.Game | null {
  try {
    debugLog(`${GAME_TITLE} - Initializing game...`);
    const game = new Phaser.Game(config);
    debugLog(`${GAME_TITLE} - Game initialized successfully`);
    return game;
  } catch (error) {
    const err = error as Error;
    debugError(`${GAME_TITLE} - Failed to initialize game:`, err);
    
    ErrorHandler.handle(err, {
      component: 'main.ts',
      action: 'initialize_game'
    });
    
    showInitializationError(err);
    return null;
  }
}

/**
 * Show initialization error screen
 */
function showInitializationError(error: Error): void {
  const container = document.getElementById('game-container');
  if (!container) {
    debugError('Cannot show error - game container not found');
    return;
  }

  container.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #1a1a2e;
      color: #ffffff;
      font-family: Arial, sans-serif;
      z-index: 10000;
    ">
      <div style="
        max-width: 600px;
        padding: 40px;
        background: #2a2a4e;
        border-radius: 10px;
        text-align: center;
        border: 2px solid #8b0000;
      ">
        <h1 style="color: #ff6666; margin-bottom: 20px;">⚠️ Game Initialization Failed</h1>
        <p style="margin-bottom: 20px; line-height: 1.6;">
          We encountered an error while starting the game. This might be due to:
        </p>
        <ul style="text-align: left; margin-bottom: 20px;">
          <li>Browser incompatibility</li>
          <li>JavaScript disabled</li>
          <li>Corrupted cache</li>
          <li>Insufficient memory</li>
        </ul>
        <div style="
          background: #1a1a2e;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
          font-size: 14px;
          color: #ff9999;
        ">
          <strong>Error:</strong> ${error.message}
        </div>
        <button onclick="location.reload()" style="
          background: #8b0000;
          color: white;
          border: none;
          padding: 15px 30px;
          font-size: 16px;
          border-radius: 5px;
          cursor: pointer;
          margin: 10px;
        ">
          Retry
        </button>
        <p style="font-size: 12px; color: #888888;">
          If this error persists, try clearing your browser cache or using a different browser.
        </p>
      </div>
    </div>
  `;
}

// Try to initialize the game
const game: Phaser.Game | null = initializeGame();

// Store game instance for debugging and error recovery
if (game) {
  if (import.meta.env.DEV) {
    (window as any).game = game;
  }
}

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
