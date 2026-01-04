/**
 * ErrorHandler
 *
 * Centralized error handling utility with recovery strategies,
 * user-friendly messages, and severity levels.
 */

import * as Sentry from "@sentry/browser";
import { debugLog, debugWarn, debugError } from './DebugLogger';

export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  INITIALIZATION = 'initialization',
  ASSET_LOADING = 'asset_loading',
  AUDIO = 'audio',
  NETWORK = 'network',
  DATA = 'data',
  GAMEPLAY = 'gameplay',
  VALIDATION = 'validation',
  PERFORMANCE = 'performance',
  SAVE_DATA = 'save_data',
  SCENE_TRANSITION = 'scene_transition'
}

export interface ErrorContext {
  scene?: string;
  component: string;
  action: string;
  [key: string]: unknown;
}

export type RecoveryStrategy = 'retry' | 'continue' | 'reset_save' | 'restart_game' | 'fallback' | 'ignore';

export interface ErrorMessage {
  userMessage: string;
  severity: ErrorSeverity;
  recovery: RecoveryStrategy;
  suggestion?: string;
}

class GameError extends Error {
  constructor(
    message: string,
    public category: ErrorCategory,
    public severity: ErrorSeverity = ErrorSeverity.ERROR,
    public context?: ErrorContext,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'GameError';
  }
}

class NetworkError extends GameError {
  constructor(message: string, context?: ErrorContext) {
    super(message, ErrorCategory.NETWORK, ErrorSeverity.ERROR, context);
    this.name = 'NetworkError';
  }
}

class AssetLoadError extends GameError {
  constructor(assetKey: string, context?: ErrorContext) {
    super(`Failed to load asset: ${assetKey}`, ErrorCategory.ASSET_LOADING, ErrorSeverity.WARNING, context);
    this.name = 'AssetLoadError';
  }
}

class ValidationError extends GameError {
  constructor(message: string, context?: ErrorContext) {
    super(message, ErrorCategory.VALIDATION, ErrorSeverity.WARNING, context);
    this.name = 'ValidationError';
    this.recoverable = false;
  }
}

export class ErrorHandler {
  private static circuitBreakers: Map<string, { failures: number; lastFailure: number; isOpen: boolean }> = new Map();
  private static readonly CIRCUIT_BREAKER_THRESHOLD = 5;
  private static readonly CIRCUIT_BREAKER_TIMEOUT = 60000;
  private static errorAggregator: Map<string, { count: number; lastReported: number }> = new Map();
  private static readonly ERROR_AGGREGATION_WINDOW = 5000;
  private static recoveryStrategies: Map<string, RecoveryStrategy> = new Map();

  static readonly ERROR_MESSAGES: Record<string, ErrorMessage> = {
    ASSET_LOAD_FAILED: {
      userMessage: "Some game assets couldn't be loaded. The game will continue with reduced visuals.",
      severity: ErrorSeverity.WARNING,
      recovery: 'continue',
      suggestion: "Refresh the page to try loading all assets again."
    },
    AUDIO_INIT_FAILED: {
      userMessage: "Audio couldn't be initialized. You can play without sound.",
      severity: ErrorSeverity.INFO,
      recovery: 'continue',
      suggestion: "Check your browser settings and try again."
    },
    AUDIO_PLAY_FAILED: {
      userMessage: "A sound effect failed to play. The game will continue.",
      severity: ErrorSeverity.WARNING,
      recovery: 'ignore'
    },
    SAVE_CORRUPTED: {
      userMessage: "Your save file appears to be corrupted. Using default progress.",
      severity: ErrorSeverity.ERROR,
      recovery: 'reset_save',
      suggestion: "If this persists, please contact support."
    },
    SAVE_FAILED: {
      userMessage: "Unable to save your progress. Please check your storage settings.",
      severity: ErrorSeverity.WARNING,
      recovery: 'retry'
    },
    NETWORK_FAILED: {
      userMessage: "Connection failed. Please check your internet connection.",
      severity: ErrorSeverity.ERROR,
      recovery: 'retry',
      suggestion: "Offline mode has been enabled."
    },
    NETWORK_TIMEOUT: {
      userMessage: "Request timed out. Please try again.",
      severity: ErrorSeverity.WARNING,
      recovery: 'retry'
    },
    SCENE_TRANSITION_FAILED: {
      userMessage: "Unable to load the game screen. Returning to main menu.",
      severity: ErrorSeverity.ERROR,
      recovery: 'fallback'
    },
    VALIDATION_FAILED: {
      userMessage: "Invalid operation detected. Please try again.",
      severity: ErrorSeverity.WARNING,
      recovery: 'ignore'
    },
    INITIALIZATION_FAILED: {
      userMessage: "Game failed to initialize. Please refresh the page.",
      severity: ErrorSeverity.CRITICAL,
      recovery: 'restart_game',
      suggestion: "If this persists, try a different browser."
    },
    DATA_LOAD_FAILED: {
      userMessage: "Unable to load game data. Using default values.",
      severity: ErrorSeverity.ERROR,
      recovery: 'continue'
    },
    MEMORY_LOW: {
      userMessage: "Your device is running low on memory. Some features may be limited.",
      severity: ErrorSeverity.WARNING,
      recovery: 'continue',
      suggestion: "Try lowering the quality in settings."
    },
    PERFORMANCE_LOW: {
      userMessage: "Performance is below optimal. Adjusting quality settings.",
      severity: ErrorSeverity.INFO,
      recovery: 'continue'
    }
  };

  static handle(error: Error | GameError, context: ErrorContext): void {
    const gameError = error instanceof GameError ? error : new GameError(error.message, ErrorCategory.GAMEPLAY, ErrorSeverity.ERROR, context);
    
    if (gameError.severity === ErrorSeverity.CRITICAL || gameError.severity === ErrorSeverity.ERROR) {
      debugError(`[${gameError.category.toUpperCase()}] ${gameError.message}`, context, gameError);
    } else if (gameError.severity === ErrorSeverity.WARNING) {
      debugWarn(`[${gameError.category.toUpperCase()}] ${gameError.message}`, context);
    } else {
      debugLog(`[${gameError.category.toUpperCase()}] ${gameError.message}`, context);
    }

    if (this.shouldAggregateError(gameError.message)) {
      return;
    }

    this.reportToSentry(gameError, context);
    
    if (gameError.severity === ErrorSeverity.CRITICAL) {
      this.handleCriticalError(gameError);
    }
  }

  static shouldAggregateError(message: string): boolean {
    const now = Date.now();
    const aggregated = this.errorAggregator.get(message);
    
    if (!aggregated) {
      this.errorAggregator.set(message, { count: 1, lastReported: now });
      return false;
    }

    if (now - aggregated.lastReported < this.ERROR_AGGREGATION_WINDOW) {
      aggregated.count++;
      return aggregated.count > 3;
    }

    this.errorAggregator.delete(message);
    return false;
  }

  static recoverable(error: Error): boolean {
    if (error instanceof GameError) {
      return error.recoverable;
    }
    return true;
  }

  static getUserMessage(error: Error): string {
    if (error instanceof GameError) {
      const errorType = Object.keys(this.ERROR_MESSAGES).find(key => 
        error.message.includes(key) || error.message.includes(key.toLowerCase().replace('_', ' '))
      );
      return errorType 
        ? this.ERROR_MESSAGES[errorType].userMessage 
        : error.message;
    }
    return error.message;
  }

  static getErrorMessage(error: Error): ErrorMessage | undefined {
    const errorType = Object.keys(this.ERROR_MESSAGES).find(key => 
      error.message.includes(key) || error.message.includes(key.toLowerCase().replace('_', ' '))
    );
    return errorType ? this.ERROR_MESSAGES[errorType] : undefined;
  }

  static addRecoveryStrategy(errorKey: string, strategy: RecoveryStrategy): void {
    this.recoveryStrategies.set(errorKey, strategy);
  }

  static reportToSentry(error: Error, context: ErrorContext): void {
    if (typeof Sentry !== 'undefined' && (Sentry as any).captureException) {
      const sentryError = error instanceof GameError ? new Error(error.message) : error;
      
      (Sentry as any).captureException(sentryError, {
        level: error instanceof GameError ? error.severity.toLowerCase() : 'error',
        tags: {
          category: error instanceof GameError ? error.category : 'unknown',
          scene: context.scene || 'unknown',
          component: context.component || 'unknown'
        },
        extra: {
          ...context,
          timestamp: new Date().toISOString()
        }
      } as any);
    }
  }

  static handleCriticalError(error: GameError): void {
    debugError('CRITICAL ERROR:', error);
    
    const errorMessage = this.getErrorMessage(error) || {
      userMessage: error.message,
      severity: ErrorSeverity.CRITICAL,
      recovery: 'restart_game'
    };

    const eventData = {
      message: errorMessage.userMessage,
      suggestion: errorMessage.suggestion,
      recovery: errorMessage.recovery,
      errorDetails: {
        name: error.name,
        message: error.message,
        category: error.category,
        context: error.context
      }
    };

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('game-critical-error', { detail: eventData }));
    }
  }

  static checkCircuitBreaker(key: string): boolean {
    const circuit = this.circuitBreakers.get(key);
    
    if (!circuit || !circuit.isOpen) {
      return false;
    }

    if (Date.now() - circuit.lastFailure > this.CIRCUIT_BREAKER_TIMEOUT) {
      circuit.isOpen = false;
      circuit.failures = 0;
      return false;
    }

    return true;
  }

  static recordCircuitBreakerFailure(key: string): void {
    const now = Date.now();
    const circuit = this.circuitBreakers.get(key);
    
    if (!circuit) {
      this.circuitBreakers.set(key, { failures: 1, lastFailure: now, isOpen: false });
      return;
    }

    circuit.failures++;
    circuit.lastFailure = now;
    
    if (circuit.failures >= this.CIRCUIT_BREAKER_THRESHOLD) {
      circuit.isOpen = true;
      debugWarn(`[CircuitBreaker] Circuit opened for key: ${key}`);
    }
  }

  static resetCircuitBreaker(key: string): void {
    this.circuitBreakers.delete(key);
  }

  static wrapAsync<T extends unknown[], R>(
    fn: (...args: T) => Promise<R>,
    context: ErrorContext
  ): (...args: T) => Promise<R> {
    return async (...args: T): Promise<R> => {
      try {
        return await fn(...args);
      } catch (error) {
        if (error instanceof Error) {
          this.handle(error, context);
        }
        throw error;
      }
    };
  }

  static wrap<T extends unknown[], R>(
    fn: (...args: T) => R,
    context: ErrorContext
  ): (...args: T) => R {
    return (...args: T): R => {
      try {
        return fn(...args);
      } catch (error) {
        if (error instanceof Error) {
          this.handle(error, context);
        }
        throw error;
      }
    };
  }

  static async withRetry<T>(
    operation: () => Promise<T>,
    options: {
      maxRetries?: number;
      delay?: number;
      backoff?: boolean;
      onRetry?: (attempt: number, error: Error) => void;
      context?: ErrorContext;
    } = {}
  ): Promise<T> {
    const { maxRetries = 3, delay = 1000, backoff = true, onRetry, context } = options;
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          this.handle(lastError, context || { component: 'retry', action: 'final_attempt' });
          throw lastError;
        }

        if (onRetry) {
          onRetry(attempt, lastError);
        }

        const retryDelay = backoff ? delay * Math.pow(2, attempt - 1) : delay;
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    throw lastError!;
  }
}

export { GameError, NetworkError, AssetLoadError, ValidationError };
