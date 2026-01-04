/**
 * ErrorScene
 *
 * Dedicated scene for displaying critical error information
 * and providing recovery options.
 */

import Phaser from 'phaser';
import { SCENE_KEYS, GAME_WIDTH, GAME_HEIGHT } from '@config/constants';
import { ErrorToastManager } from '@ui/ErrorToast';

interface ErrorData {
  message: string;
  suggestion?: string;
  errorDetails?: {
    name: string;
    message: string;
    category: string;
    context?: Record<string, unknown>;
  };
  recovery: 'retry' | 'continue' | 'reset_save' | 'restart_game' | 'fallback' | 'ignore';
  sceneToReturn?: string;
}

export class ErrorScene extends Phaser.Scene {
  private errorData: ErrorData | null = null;
  private errorText!: Phaser.GameObjects.Text;
  private suggestionText!: Phaser.GameObjects.Text;
  private errorDetailsText!: Phaser.GameObjects.Text;
  private retryButton!: Phaser.GameObjects.Container;
  private continueButton!: Phaser.GameObjects.Container;
  private menuButton!: Phaser.GameObjects.Container;
  private background!: Phaser.GameObjects.Rectangle;
  private errorToastManager: ErrorToastManager | null = null;

  constructor() {
    super({ key: 'ErrorScene' });
  }

  create(): void {
    this.errorToastManager = new ErrorToastManager(this);
    this.createBackground();
    
    if (this.errorData) {
      this.createErrorUI();
    } else {
      this.showGenericError();
    }
    
    this.setupKeyboard();
  }

  public setErrorData(data: ErrorData): void {
    this.errorData = data;
  }

  private createBackground(): void {
    this.background = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x1a0a0a);
    this.background.setDepth(0);
  }

  private createErrorUI(): void {
    if (!this.errorData) return;

    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    // Error icon
    const icon = this.add.text(centerX, centerY - 150, '⛔', {
      fontSize: '80px',
      color: '#ff6666',
    }).setOrigin(0.5);
    icon.setDepth(1);

    // Error title
    const title = this.add.text(centerX, centerY - 100, 'Oops! Something went wrong', {
      fontSize: '32px',
      color: '#ff6666',
      fontStyle: 'bold',
      fontFamily: 'Arial',
    }).setOrigin(0.5);
    title.setDepth(1);

    // Error message
    this.errorText = this.add.text(centerX, centerY - 40, this.errorData.message, {
      fontSize: '20px',
      color: '#cccccc',
      fontFamily: 'Arial',
      align: 'center',
      wordWrap: { width: GAME_WIDTH - 100 },
    }).setOrigin(0.5);
    this.errorText.setDepth(1);

    // Suggestion if available
    if (this.errorData.suggestion) {
      this.suggestionText = this.add.text(centerX, centerY + 40, `💡 ${this.errorData.suggestion}`, {
        fontSize: '16px',
        color: '#ffcc00',
        fontFamily: 'Arial',
        align: 'center',
        wordWrap: { width: GAME_WIDTH - 100 },
      }).setOrigin(0.5);
      this.suggestionText.setDepth(1);
    }

    // Error details (expandable in debug mode)
    if (import.meta.env.DEV && this.errorData.errorDetails) {
      const details = `${this.errorData.errorDetails.name}: ${this.errorData.errorDetails.message}`;
      this.errorDetailsText = this.add.text(centerX, centerY + 100, details, {
        fontSize: '12px',
        color: '#666666',
        fontFamily: 'monospace',
        align: 'center',
        wordWrap: { width: GAME_WIDTH - 100 },
      }).setOrigin(0.5);
      this.errorDetailsText.setDepth(1);
    }

    // Create action buttons based on recovery type
    this.createActionButtons(centerX, centerY + 180);
  }

  private showGenericError(): void {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    const icon = this.add.text(centerX, centerY - 80, '🤔', {
      fontSize: '80px',
    }).setOrigin(0.5);
    icon.setDepth(1);

    const message = 'An unexpected error occurred. Please try again or restart the game.';
    const text = this.add.text(centerX, centerY, message, {
      fontSize: '20px',
      color: '#cccccc',
      fontFamily: 'Arial',
      align: 'center',
      wordWrap: { width: GAME_WIDTH - 100 },
    }).setOrigin(0.5);
    text.setDepth(1);

    this.createMenuButton(centerX, centerY + 100);
  }

  private createActionButtons(x: number, y: number): void {
    if (!this.errorData) return;

    switch (this.errorData.recovery) {
      case 'retry':
        this.createRetryButton(x, y);
        this.createMenuButton(x, y + 70);
        break;
      case 'continue':
        this.createContinueButton(x, y);
        break;
      case 'reset_save':
        this.createResetSaveButton(x, y);
        this.createMenuButton(x, y + 70);
        break;
      case 'restart_game':
        this.createRestartButton(x, y);
        break;
      case 'fallback':
        this.createFallbackButton(x, y);
        break;
      default:
        this.createMenuButton(x, y);
        break;
    }
  }

  private createRetryButton(x: number, y: number): void {
    this.retryButton = this.createButton(x, y, '🔄 Retry', 0x8b0000, () => {
      this.handleRetry();
    });
  }

  private createContinueButton(x: number, y: number): void {
    this.continueButton = this.createButton(x, y, '▶️ Continue', 0x228B22, () => {
      this.handleContinue();
    });
  }

  private createResetSaveButton(x: number, y: number): void {
    this.continueButton = this.createButton(x, y, '🔄 Reset Save', 0xFF9800, () => {
      this.handleResetSave();
    });
  }

  private createRestartButton(x: number, y: number): void {
    this.retryButton = this.createButton(x, y, '🔄 Restart Game', 0x8b0000, () => {
      this.handleRestart();
    });
  }

  private createFallbackButton(x: number, y: number): void {
    this.continueButton = this.createButton(x, y, '↩️ Go Back', 0x228B22, () => {
      this.handleFallback();
    });
  }

  private createMenuButton(x: number, y: number): void {
    this.menuButton = this.createButton(x, y, '🏠 Main Menu', 0x666666, () => {
      this.handleMenu();
    });
  }

  private createButton(
    x: number,
    y: number,
    text: string,
    color: number,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 200, 50, color, 0.9);
    bg.setStrokeStyle(2, 0x000000);
    bg.setOrigin(0.5);
    
    const label = this.add.text(0, 0, text, {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    container.add([bg, label]);
    container.setSize(200, 50);
    container.setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        this.tweens.add({
          targets: bg,
          scale: 1.05,
          duration: 150,
        });
      })
      .on('pointerout', () => {
        this.tweens.add({
          targets: bg,
          scale: 1,
          duration: 150,
        });
      })
      .on('pointerdown', onClick);

    container.setDepth(2);
    this.add.existing(container);
    
    return container;
  }

  private setupKeyboard(): void {
    if (this.retryButton) {
      this.input.keyboard?.on('keydown-R', () => this.handleRetry());
    }
    if (this.continueButton) {
      this.input.keyboard?.on('keydown-ENTER', () => this.handleContinue());
    }
    if (this.menuButton) {
      this.input.keyboard?.on('keydown-ESC', () => this.handleMenu());
    }
  }

  private handleRetry(): void {
    this.scene.restart();
  }

  private handleContinue(): void {
    if (this.errorData?.sceneToReturn) {
      this.scene.start(this.errorData.sceneToReturn);
    } else {
      this.scene.start(SCENE_KEYS.mainMenu);
    }
  }

  private handleResetSave(): void {
    if (confirm('Are you sure you want to reset your save? This cannot be undone.')) {
      // Trigger save reset
      localStorage.removeItem('monster_slayer_save');
      this.handleContinue();
    }
  }

  private handleRestart(): void {
    // Full page reload to restart everything
    window.location.reload();
  }

  private handleFallback(): void {
    this.handleContinue();
  }

  private handleMenu(): void {
    this.scene.start(SCENE_KEYS.mainMenu);
  }

  public shutdown(): void {
    this.errorToastManager?.destroy();
    this.tweens.killTweensOf(this.background);
  }
}
