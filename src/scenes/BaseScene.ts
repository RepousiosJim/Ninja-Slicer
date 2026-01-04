/**
 * Base Scene Class
 * Provides common functionality for all game scenes
 * Implements consistent lifecycle management and event handling
 * 
 * @example
 * ```typescript
 * class GameplayScene extends BaseScene {
 *   public create(): void {
 *     super.create();
 *     this.createUI();
 *     this.setupGameLogic();
 *   }
 *   
 *   private createUI(): void {
 *     // Create game UI elements
 *   }
 *   
 *   private setupGameLogic(): void {
 *     // Setup game systems
 *   }
 * }
 * ```
 */
import Phaser from 'phaser';
import { AudioManager } from '@managers/AudioManager';
import { SaveManager } from '@managers/SaveManager';
import { PerformanceMonitor } from '@utils/PerformanceMonitor';
import { ErrorHandler, ErrorSeverity, ErrorCategory } from '@utils/ErrorHandler';
import { ErrorToastManager } from '@ui/ErrorToast';
import { debugLog, debugError } from '@utils/DebugLogger';

export abstract class BaseScene extends Phaser.Scene {
  protected audioManager: AudioManager | null = null;
  protected saveManager: SaveManager;
  protected performanceMonitor: PerformanceMonitor;
  protected debugMode: boolean = false;
  protected errorToastManager: ErrorToastManager | null = null;

  constructor(key: string) {
    super({ key });
    this.saveManager = new SaveManager();
    this.performanceMonitor = new PerformanceMonitor();
  }

  /**
   * Init - called after constructor, before preload
   */
  public init(): void {
    // Setup error handling now that scene is initialized
    this.errorToastManager = new ErrorToastManager(this);

    this.events.on('destroy', () => {
      this.errorToastManager?.destroy();
    });
  }

  /**
   * Safe create wrapper with error boundary
   */
  protected safeCreate(): void {
    try {
      this.create();
    } catch (error) {
      this.handleSceneError(error as Error, 'create');
    }
  }

  /**
   * Safe preload wrapper with error boundary
   */
  protected safePreload(): void {
    try {
      this.preload();
    } catch (error) {
      this.handleSceneError(error as Error, 'preload');
    }
  }

  /**
   * Handle critical scene error
   */
  private handleSceneError(error: Error, action: string): void {
    const context = {
      scene: this.scene.key,
      component: 'Scene',
      action: action
    };
    
    ErrorHandler.handle(error, context);
    
    this.errorToastManager?.showError(
      `Scene error during ${action}: ${error.message}`,
      8000
    );
  }

  /**
   * Handle non-blocking error (logged but doesn't stop game)
   */
  private handleNonBlockingError(error: Error, action: string): void {
    const context = {
      scene: this.scene.key,
      component: 'Scene',
      action: action
    };
    
    ErrorHandler.handle(error, context);
  }

  /**
   * Show error screen for critical errors
   */
  protected showErrorScreen(message: string, canRetry: boolean = true): void {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    const overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.9);
    overlay.setDepth(10000);

    const errorText = this.add.text(centerX, centerY - 50, message, {
      fontSize: '24px',
      color: '#ff6666',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: this.scale.width - 100 }
    }).setOrigin(0.5);
    errorText.setDepth(10001);

    if (canRetry) {
      const retryText = this.add.text(centerX, centerY + 50, 'Press R to Retry', {
        fontSize: '20px',
        color: '#ffffff',
        align: 'center'
      }).setOrigin(0.5);
      retryText.setDepth(10001);

      this.input.keyboard?.once('keydown-R', () => {
        overlay.destroy();
        errorText.destroy();
        retryText.destroy();
        this.scene.restart();
      });
    } else {
      const menuText = this.add.text(centerX, centerY + 50, 'Press ESC for Main Menu', {
        fontSize: '20px',
        color: '#ffffff',
        align: 'center'
      }).setOrigin(0.5);
      menuText.setDepth(10001);

      this.input.keyboard?.once('keydown-ESC', () => {
        this.scene.start('mainMenu');
      });
    }
  }

  /**
   * Create scene - override in subclasses
   */
  public abstract create(): void;

  /**
   * Update scene - override in subclasses
   */
  public update(_time: number, _delta: number): void {}

  /**
   * Preload assets - override in subclasses
   */
  public preload(): void {}

  /**
   * Initialize audio manager
   */
  protected initializeAudio(): void {
    this.audioManager = new AudioManager(this);
    this.audioManager.initialize();
  }

  /**
   * Setup event listeners
   */
  protected setupEventListeners(): void {
    this.events.on('resize', this.handleResize, this);
    this.events.on('orientationchange', this.handleOrientationChange, this);
  }

  /**
   * Handle window resize
   */
  protected handleResize(width: number, height: number): void {
    debugLog(`${this.scene.key} resized to ${width}x${height}`);
  }

  /**
   * Handle orientation change
   */
  protected handleOrientationChange(orientation: string): void {
    debugLog(`${this.scene.key} orientation changed to ${orientation}`);
    this.time.delayedCall(100, () => {
      const newWidth = this.scale.width;
      const newHeight = this.scale.height;
      this.handleResize(newWidth, newHeight);
    });
  }

  /**
   * Toggle debug mode
   */
  protected toggleDebugMode(): void {
    this.debugMode = !this.debugMode;
    debugLog(`Debug mode: ${this.debugMode ? 'ON' : 'OFF'}`);
  }

  /**
   * Update performance monitoring
   * Call this in scene update() method
   * @param delta - Time since last frame in milliseconds
   */
  protected updatePerformance(delta: number): void {
    this.performanceMonitor.updateFPS(delta);

    if (this.debugMode) {
      this.updateDebugInfo();
    }
  }

  /**
   * Get current performance stats
   */
  protected getPerformanceStats() {
    return this.performanceMonitor.getPerformanceStats();
  }

  /**
   * Get performance grade (A-F)
   */
  protected getPerformanceGrade(): string {
    return this.performanceMonitor.getPerformanceGrade();
  }

  /**
   * Check if performance is low
   */
  protected isLowPerformance(): boolean {
    return this.performanceMonitor.isLowPerformance();
  }

  /**
   * Get recommended quality setting
   */
  protected getRecommendedQuality(): 'low' | 'medium' | 'high' {
    return this.performanceMonitor.getRecommendedQuality();
  }

  /**
   * Adjust quality if needed based on performance
   * @param currentQuality - Current quality setting
   * @param setQuality - Callback to change quality
   */
  protected adjustQualityIfNeeded(
    currentQuality: 'low' | 'medium' | 'high',
    setQuality: (quality: 'low' | 'medium' | 'high') => void
  ): void {
    this.performanceMonitor.adjustQualityIfNeeded(currentQuality, setQuality);
  }

  /**
   * Update debug info display (can be overridden in subclasses)
   */
  protected updateDebugInfo(): void {
    const stats = this.getPerformanceStats();
    const grade = this.getPerformanceGrade();
    debugLog(`[${this.scene.key}] FPS: ${stats.fps.toFixed(1)} (avg: ${stats.averageFPS.toFixed(1)}) Grade: ${grade}`);
  }
}
