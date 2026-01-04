/**
 * GameOverScene
 *
 * Displays final game statistics and provides options to retry or return to menu.
 * Supports endless mode with score submission to Supabase.
 */

import Phaser from 'phaser';
import { debugLog, debugWarn, debugError } from '@utils/DebugLogger';


import { SCENE_KEYS, GAME_WIDTH, GAME_HEIGHT, COLORS, FONT_SIZES, DEFAULT_STARTING_LIVES } from '@config/constants';
import { SupabaseService } from '../services/SupabaseService';
import { SaveManager } from '../managers/SaveManager';
import { Panel } from '../ui/Panel';

export class GameOverScene extends Phaser.Scene {
  private finalStats: any = null;
  private isEndlessMode: boolean = false;
  private overlay!: Phaser.GameObjects.Graphics;
  private titleText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private soulsText!: Phaser.GameObjects.Text;
  private monstersSlicedText!: Phaser.GameObjects.Text;
  private villagersSlicedText!: Phaser.GameObjects.Text;
  private livesLostText!: Phaser.GameObjects.Text;
  private maxComboText!: Phaser.GameObjects.Text;
  private timeElapsedText!: Phaser.GameObjects.Text;
  private rankText: Phaser.GameObjects.Text | null = null;
  private personalBestText: Phaser.GameObjects.Text | null = null;
  private retryButton!: Phaser.GameObjects.Container;
  private menuButton!: Phaser.GameObjects.Container;
  private nameInputPanel: Panel | null = null;
  private nameInputText: Phaser.GameObjects.Text | null = null;
  private submitNameButton: Phaser.GameObjects.Container | null = null;

  private supabaseService: SupabaseService;
  private saveManager: SaveManager;

  constructor() {
    super({ key: 'GameOverScene' });
    this.supabaseService = SupabaseService.getInstance();
    this.saveManager = new SaveManager();
  }

  create(data: any): void {
    // Store final stats
    this.finalStats = data;
    this.isEndlessMode = data.isEndlessMode || false;
    
    // Create dark overlay
    this.createOverlay();
    
    // Create UI elements
    this.createUI();
    
    // Handle endless mode score submission
    if (this.isEndlessMode) {
      this.handleEndlessScore();
    }
    
    // Set up input
    this.setupInput();
    
    debugLog('GameOverScene created with stats:', this.finalStats);
  }

  /**
   * Create dark overlay
   */
  private createOverlay(): void {
    this.overlay = this.add.graphics();
    this.overlay.fillStyle(0x000000, 0.85);
    this.overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.overlay.setDepth(1000);
  }

  /**
   * Create all UI elements
   */
  private createUI(): void {
    // Game Over title
    this.titleText = this.add.text(
      GAME_WIDTH / 2,
      100,
      'GAME OVER',
      {
        fontFamily: 'Arial',
        fontSize: `${FONT_SIZES.title * 1.5}px`,
        color: '#ff0000',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 10,
      },
    );
    this.titleText.setOrigin(0.5, 0);
    this.titleText.setDepth(1001);

    // Score display
    this.scoreText = this.add.text(
      GAME_WIDTH / 2,
      200,
      `Score: ${this.finalStats.score}`,
      {
        fontFamily: 'Arial',
        fontSize: `${FONT_SIZES.xlarge}px`,
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6,
      },
    );
    this.scoreText.setOrigin(0.5, 0);
    this.scoreText.setDepth(1001);

    // Souls display
    this.soulsText = this.add.text(
      GAME_WIDTH / 2,
      260,
      `Souls: ${this.finalStats.souls}`,
      {
        fontFamily: 'Arial',
        fontSize: `${FONT_SIZES.large}px`,
        color: '#9900ff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      },
    );
    this.soulsText.setOrigin(0.5, 0);
    this.soulsText.setDepth(1001);

    // Monsters sliced display
    this.monstersSlicedText = this.add.text(
      GAME_WIDTH / 2,
      320,
      `Monsters Sliced: ${this.finalStats.monstersSliced}`,
      {
        fontFamily: 'Arial',
        fontSize: `${FONT_SIZES.medium}px`,
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      },
    );
    this.monstersSlicedText.setOrigin(0.5, 0);
    this.monstersSlicedText.setDepth(1001);

    // Villagers sliced display
    this.villagersSlicedText = this.add.text(
      GAME_WIDTH / 2,
      360,
      `Villagers Sliced: ${this.finalStats.villagersSliced || 0}`,
      {
        fontFamily: 'Arial',
        fontSize: `${FONT_SIZES.medium}px`,
        color: '#ff0000',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      },
    );
    this.villagersSlicedText.setOrigin(0.5, 0);
    this.villagersSlicedText.setDepth(1001);

    // Lives lost display
    const livesLost = (this.finalStats.startingLives || DEFAULT_STARTING_LIVES) - (this.finalStats.lives || 0);
    this.livesLostText = this.add.text(
      GAME_WIDTH / 2,
      400,
      `Lives Lost: ${livesLost}`,
      {
        fontFamily: 'Arial',
        fontSize: `${FONT_SIZES.medium}px`,
        color: '#ff6600',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      },
    );
    this.livesLostText.setOrigin(0.5, 0);
    this.livesLostText.setDepth(1001);

    // Max combo display
    this.maxComboText = this.add.text(
      GAME_WIDTH / 2,
      440,
      `Max Combo: ${this.finalStats.maxCombo}x`,
      {
        fontFamily: 'Arial',
        fontSize: `${FONT_SIZES.medium}px`,
        color: '#ffaa00',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      },
    );
    this.maxComboText.setOrigin(0.5, 0);
    this.maxComboText.setDepth(1001);

    // Time elapsed display
    this.timeElapsedText = this.add.text(
      GAME_WIDTH / 2,
      480,
      `Time: ${this.formatTime(this.finalStats.timeElapsed)}`,
      {
        fontFamily: 'Arial',
        fontSize: `${FONT_SIZES.medium}px`,
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      },
    );
    this.timeElapsedText.setOrigin(0.5, 0);
    this.timeElapsedText.setDepth(1001);

    // Rank display (for endless mode)
    if (this.isEndlessMode) {
      this.createRankDisplay();
    }

    // Retry button
    this.createRetryButton();

    // Menu button
    this.createMenuButton();
  }

  /**
   * Create rank display for endless mode
   */
  private createRankDisplay(): void {
    this.rankText = this.add.text(
      GAME_WIDTH / 2,
      520,
      'Loading rank...',
      {
        fontFamily: 'Arial',
        fontSize: `${FONT_SIZES.medium}px`,
        color: '#ffd700',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      },
    );
    this.rankText.setOrigin(0.5, 0);
    this.rankText.setDepth(1001);

    this.personalBestText = this.add.text(
      GAME_WIDTH / 2,
      560,
      '',
      {
        fontFamily: 'Arial',
        fontSize: `${FONT_SIZES.medium}px`,
        color: '#00ff00',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      },
    );
    this.personalBestText.setOrigin(0.5, 0);
    this.personalBestText.setDepth(1001);
    this.personalBestText.setVisible(false);
  }

  /**
   * Create retry button
   */
  private createRetryButton(): void {
    this.retryButton = this.add.container(GAME_WIDTH / 2, 600);

    // Button background
    const buttonBg = this.add.graphics();
    buttonBg.fillStyle(0x00ff00, 1);
    buttonBg.fillRoundedRect(-150, -30, 300, 60, 10);
    buttonBg.lineStyle(4, 0x000000, 1);
    buttonBg.strokeRoundedRect(-150, -30, 300, 60, 10);
    this.retryButton.add(buttonBg);

    // Button text
    const buttonText = this.add.text(0, 0, 'RETRY', {
      fontFamily: 'Arial',
      fontSize: `${FONT_SIZES.large}px`,
      color: '#000000',
      fontStyle: 'bold',
    });
    buttonText.setOrigin(0.5, 0.5);
    this.retryButton.add(buttonText);

    // Make button interactive
    buttonBg.setInteractive({ useHandCursor: true });
    buttonBg.on('pointerover', () => {
      buttonBg.clear();
      buttonBg.fillStyle(0x00cc00, 1);
      buttonBg.fillRoundedRect(-150, -30, 300, 60, 10);
      buttonBg.lineStyle(4, 0x000000, 1);
      buttonBg.strokeRoundedRect(-150, -30, 300, 60, 10);
    });
    buttonBg.on('pointerout', () => {
      buttonBg.clear();
      buttonBg.fillStyle(0x00ff00, 1);
      buttonBg.fillRoundedRect(-150, -30, 300, 60, 10);
      buttonBg.lineStyle(4, 0x000000, 1);
      buttonBg.strokeRoundedRect(-150, -30, 300, 60, 10);
    });
    buttonBg.on('pointerdown', () => {
      this.onRetry();
    });

    this.retryButton.setDepth(1001);
  }

  /**
   * Create menu button
   */
  private createMenuButton(): void {
    this.menuButton = this.add.container(GAME_WIDTH / 2, 680);

    // Button background
    const buttonBg = this.add.graphics();
    buttonBg.fillStyle(0x888888, 1);
    buttonBg.fillRoundedRect(-150, -30, 300, 60, 10);
    buttonBg.lineStyle(4, 0x000000, 1);
    buttonBg.strokeRoundedRect(-150, -30, 300, 60, 10);
    this.menuButton.add(buttonBg);

    // Button text
    const buttonText = this.add.text(0, 0, 'MENU', {
      fontFamily: 'Arial',
      fontSize: `${FONT_SIZES.large}px`,
      color: '#000000',
      fontStyle: 'bold',
    });
    buttonText.setOrigin(0.5, 0.5);
    this.menuButton.add(buttonText);

    // Make button interactive
    buttonBg.setInteractive({ useHandCursor: true });
    buttonBg.on('pointerover', () => {
      buttonBg.clear();
      buttonBg.fillStyle(0x666666, 1);
      buttonBg.fillRoundedRect(-150, -30, 300, 60, 10);
      buttonBg.lineStyle(4, 0x000000, 1);
      buttonBg.strokeRoundedRect(-150, -30, 300, 60, 10);
    });
    buttonBg.on('pointerout', () => {
      buttonBg.clear();
      buttonBg.fillStyle(0x888888, 1);
      buttonBg.fillRoundedRect(-150, -30, 300, 60, 10);
      buttonBg.lineStyle(4, 0x000000, 1);
      buttonBg.strokeRoundedRect(-150, -30, 300, 60, 10);
    });
    buttonBg.on('pointerdown', () => {
      this.onMenu();
    });

    this.menuButton.setDepth(1001);
  }

  /**
   * Set up input handlers
   */
  private setupInput(): void {
    // R key to retry
    this.input.keyboard?.on('keydown-R', () => {
      this.onRetry();
    });

    // ESC key to go to menu
    this.input.keyboard?.on('keydown-ESC', () => {
      this.onMenu();
    });
  }

  /**
   * Handle endless mode score submission
   */
  private async handleEndlessScore(): Promise<void> {
    if (!this.supabaseService.isAvailable()) {
      if (this.rankText) {
        this.rankText.setText('Leaderboard unavailable');
      }
      return;
    }

    // Check if player name is set
    const saveData = this.saveManager.load();
    if (!saveData.playerName) {
      // Prompt for player name
      this.promptPlayerName();
      return;
    }

    // Submit score
    await this.submitEndlessScore();
  }

  /**
   * Prompt player for name
   */
  private promptPlayerName(): void {
    // Create panel
    this.nameInputPanel = new Panel(
      this,
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      400,
      200,
      'Enter Your Name',
    );

    // Create input text
    this.nameInputText = this.add.text(0, -20, '', {
      fontFamily: 'Arial',
      fontSize: `${FONT_SIZES.large}px`,
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 },
    });
    this.nameInputText.setOrigin(0.5);
    this.nameInputPanel.add(this.nameInputText);

    // Create submit button
    this.submitNameButton = this.add.container(0, 50);

    const buttonBg = this.add.graphics();
    buttonBg.fillStyle(0x00ff00, 1);
    buttonBg.fillRoundedRect(-80, -20, 160, 40, 10);
    buttonBg.lineStyle(2, 0x000000, 1);
    buttonBg.strokeRoundedRect(-80, -20, 160, 40, 10);
    this.submitNameButton.add(buttonBg);

    const buttonText = this.add.text(0, 0, 'Submit', {
      fontFamily: 'Arial',
      fontSize: `${FONT_SIZES.medium}px`,
      color: '#000000',
      fontStyle: 'bold',
    });
    buttonText.setOrigin(0.5);
    this.submitNameButton.add(buttonText);

    buttonBg.setInteractive({ useHandCursor: true });
    buttonBg.on('pointerdown', () => {
      this.onSubmitName();
    });

    this.nameInputPanel.add(this.submitNameButton);

    // Setup keyboard input
    this.setupNameInput();
  }

  /**
   * Setup keyboard input for name
   */
  private setupNameInput(): void {
    let playerName = '';

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (!this.nameInputText) return;

      if (event.key === 'Backspace') {
        playerName = playerName.slice(0, -1);
      } else if (event.key === 'Enter') {
        this.onSubmitName();
        return;
      } else if (event.key.length === 1 && playerName.length < 20) {
        // Only allow alphanumeric characters and spaces
        if (/^[a-zA-Z0-9 ]$/.test(event.key)) {
          playerName += event.key;
        }
      }

      this.nameInputText.setText(playerName);
    });
  }

  /**
   * Submit player name
   */
  private onSubmitName(): void {
    if (!this.nameInputText) return;

    const playerName = this.nameInputText.text.trim();
    if (playerName.length === 0) return;

    // Save player name
    const saveData = this.saveManager.load();
    saveData.playerName = playerName;
    this.saveManager.save();

    // Close panel
    if (this.nameInputPanel) {
      this.nameInputPanel.destroy();
      this.nameInputPanel = null;
    }

    // Submit score
    this.submitEndlessScore();
  }

  /**
   * Submit endless score to Supabase
   */
  private async submitEndlessScore(): Promise<void> {
    if (!this.supabaseService.isAvailable()) return;

    const saveData = this.saveManager.load();
    const playerName = saveData.playerName || 'Anonymous';

    // Submit score
    const result = await this.supabaseService.submitScore({
      playerName,
      score: this.finalStats.score,
      weaponUsed: this.finalStats.weapon || 'Unknown',
      monstersSliced: this.finalStats.monstersSliced,
      maxCombo: this.finalStats.maxCombo,
      timeElapsedSeconds: this.finalStats.timeElapsed,
    });

    if (result) {
      // Get rank
      const rank = await this.supabaseService.getRankForScore(this.finalStats.score);
      this.displayRank(rank);

      // Check if personal best
      const personalBests = saveData.personalBests || [];
      const isPersonalBest = !personalBests.some((pb: any) => pb.score >= this.finalStats.score);
      
      if (isPersonalBest && this.personalBestText) {
        this.personalBestText.setVisible(true);
        this.personalBestText.setText('New Personal Best!');
      }
    } else {
      if (this.rankText) {
        this.rankText.setText('Failed to submit score');
      }
    }
  }

  /**
   * Display player rank
   */
  private displayRank(rank: number): void {
    if (!this.rankText) return;

    if (rank > 0) {
      this.rankText.setText(`Rank: #${rank}`);
    } else {
      this.rankText.setText('Rank: Unknown');
    }
  }

  /**
   * Handle retry button click
   */
  private onRetry(): void {
    debugLog('Retrying game...');
    if (this.isEndlessMode) {
      this.scene.start(SCENE_KEYS.endlessGameplay);
    } else {
      this.scene.start(SCENE_KEYS.gameplay);
    }
  }

  /**
   * Handle menu button click
   */
  private onMenu(): void {
    debugLog('Going to menu...');
    this.scene.start(SCENE_KEYS.mainMenu);
  }

  /**
   * Format time in seconds to MM:SS
   */
  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Clean up when scene is destroyed
   */
  shutdown(): void {
    // Remove keyboard listeners
    this.input.keyboard?.off('keydown-R');
    this.input.keyboard?.off('keydown-ESC');
    this.input.keyboard?.off('keydown');

    // Destroy panel if exists
    if (this.nameInputPanel) {
      this.nameInputPanel.destroy();
    }
  }
}
