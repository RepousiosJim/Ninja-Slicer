/**
 * EventBus
 *
 * A global event emitter for communication between scenes and systems.
 * Use this instead of trying to access other scenes directly.
 *
 * Usage:
 *   import { EventBus } from '@utils/EventBus';
 *
 *   // Emit an event
 *   EventBus.emit('player-died', { score: 1000 });
 *
 *   // Listen for an event
 *   EventBus.on('player-died', (data) => { console.log(data.score); });
 *
 *   // Remove listener (important for cleanup!)
 *   EventBus.off('player-died', myCallback);
 */

import Phaser from 'phaser';
import {
  SlashEnergyChangedEvent,
  SlashPowerChangedEvent,
  SlashPatternDetectedEvent,
  SlashPowerLevel,
  SlashPatternType,
  Vector2,
} from '@config/types';

// Create a single shared event emitter instance
export const EventBus = new Phaser.Events.EventEmitter();

/**
 * Event type definitions for TypeScript autocompletion
 * Add your custom events here
 */
export interface GameEvents {
  // Gameplay events
  'monster-sliced': { 
    monsterType: string; 
    position: { x: number; y: number }; 
    points: number;
    souls: number;
    isCritical: boolean;
  };
  'villager-sliced': { 
    position: { x: number; y: number }; 
    penalty: number; 
  };
  'monster-missed': { 
    monsterType: string; 
  };
  'powerup-collected': { 
    type: string; 
  };
  'boss-hit': { 
    bossId: string; 
    damage: number; 
    remainingHealth: number; 
  };
  'boss-defeated': { 
    bossId: string; 
    souls: number; 
  };
  
  // State events
  'score-updated': { 
    score: number; 
    delta: number; 
  };
  'souls-updated': { 
    souls: number; 
    delta: number; 
  };
  'combo-updated': { 
    count: number; 
    multiplier: number; 
  };
  'lives-changed': { 
    lives: number; 
    delta: number; 
  };
  'level-complete': { 
    levelId: string; 
    score: number; 
    stars: number; 
  };
  'game-over': { 
    score: number; 
    souls: number; 
  };
  
  // UI events
  'pause-game': void;
  'resume-game': void;
  'open-shop': void;
  'close-shop': void;
  
  // System events
  'save-completed': void;
  'settings-changed': { 
    setting: string; 
    value: unknown; 
  };
  
  // Scene events
  'scene-ready': {
    scene: string;
  };

  // Slash energy events
  'slash-energy-changed': SlashEnergyChangedEvent;
  'slash-energy-depleted': SlashEnergyChangedEvent;
  'slash-energy-low': SlashEnergyChangedEvent;

  // Slash power events
  'slash-power-changed': SlashPowerChangedEvent;
  'slash-power-charged': {
    level: SlashPowerLevel;
    position: Vector2;
  };

  // Slash pattern events
  'slash-pattern-detected': SlashPatternDetectedEvent;
  'slash-pattern-started': {
    position: Vector2;
    timestamp: number;
  };
  'slash-pattern-failed': {
    pattern: SlashPatternType;
    reason: string;
  };
}

/**
 * Type-safe event emitter wrapper (optional, for stricter typing)
 */
export function emitEvent<K extends keyof GameEvents>(
  event: K, 
  data?: GameEvents[K]
): void {
  EventBus.emit(event, data);
}

export function onEvent<K extends keyof GameEvents>(
  event: K, 
  callback: (data: GameEvents[K]) => void,
  context?: unknown
): void {
  EventBus.on(event, callback, context);
}

export function offEvent<K extends keyof GameEvents>(
  event: K, 
  callback: (data: GameEvents[K]) => void,
  context?: unknown
): void {
  EventBus.off(event, callback, context);
}
