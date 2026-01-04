/**
 * SlashEnergyManager
 *
 * Manages slash energy/stamina system with depletion and regeneration.
 * Singleton pattern for global access.
 *
 * Energy depletes with each slash based on distance swiped.
 * Energy regenerates over time when not slashing.
 * Low energy affects slash effectiveness (damage/score multipliers).
 */

import type Phaser from 'phaser';
import type { SlashEnergyState, SlashEnergyChangedEvent } from '@config/types';
import { SLASH_ENERGY, EVENTS } from '@config/constants';
import { EventBus } from '@utils/EventBus';
import type { UpgradeManager } from './UpgradeManager';
import type { IManager } from './IManager';
import { debugLog } from '@utils/DebugLogger';

export class SlashEnergyManager implements IManager {
  private static instance: SlashEnergyManager | null = null;
  private scene: Phaser.Scene | null = null;
  private upgradeManager: UpgradeManager | null = null;

  private currentEnergy: number = SLASH_ENERGY.maxEnergy;
  private maxEnergy: number = SLASH_ENERGY.maxEnergy;
  private regenRate: number = SLASH_ENERGY.regenRatePerSecond;
  private isRegenerating: boolean = false;
  private lastDepletionTime: number = 0;
  private regenDelayTimer: number = 0;

  private wasLowEnergy: boolean = false;
  private wasDepleted: boolean = false;

  /**
   * Private constructor for singleton pattern
   * @private
   */
  private constructor() {}

  /**
   * Get singleton instance of slash energy manager
   * 
   * @returns The global SlashEnergyManager instance
   * 
   * @example
   * ```typescript
   * const energyManager = SlashEnergyManager.getInstance();
   * energyManager.initialize(this);
   * ```
   */
  static getInstance(): SlashEnergyManager {
    if (!SlashEnergyManager.instance) {
      SlashEnergyManager.instance = new SlashEnergyManager();
    }
    return SlashEnergyManager.instance;
  }

  /**
   * Initialize slash energy manager with scene reference
   * 
   * @param scene - The Phaser scene to use for events
   * 
   * @example
   * ```typescript
   * const energyManager = SlashEnergyManager.getInstance();
   * energyManager.initialize(this);
   * ```
   */
  initialize(scene?: Phaser.Scene): void {
    if (scene) {
      this.scene = scene;
    }
    this.reset();
  }

  /**
   * Set the upgrade manager and apply energy-related upgrades
   * 
   * @param upgradeManager - The upgrade manager instance to use
   * 
   * @example
   * ```typescript
   * const energyManager = SlashEnergyManager.getInstance();
   * const upgradeManager = UpgradeManager.getInstance();
   * energyManager.setUpgradeManager(upgradeManager);
   * ```
   */
  setUpgradeManager(upgradeManager: UpgradeManager): void {
    this.upgradeManager = upgradeManager;
    this.applyUpgrades();
  }

  private applyUpgrades(): void {
    this.maxEnergy = SLASH_ENERGY.maxEnergy;
    this.regenRate = SLASH_ENERGY.regenRatePerSecond;
  }

  /**
   * Consume energy based on slash distance
   * Returns effectiveness factor (0-1) which affects damage and scoring
   * Effectiveness drops when energy is low
   * 
   * @param distance - The distance of the slash in pixels
   * @returns Effectiveness multiplier (1.0 = full, 0.0 = ineffective)
   * 
   * @example
   * ```typescript
   * const effectiveness = energyManager.consumeEnergy(200);
   * if (effectiveness < 1.0) {
   *   console.log('Low energy! Slash effectiveness reduced');
   * }
   * ```
   */
  consumeEnergy(distance: number): number {
    const distanceCost = distance * SLASH_ENERGY.baseCostPerDistance;
    const totalCost = Math.max(SLASH_ENERGY.minCostPerSlash, distanceCost);

    const previousEnergy = this.currentEnergy;
    this.currentEnergy = Math.max(0, this.currentEnergy - totalCost);

    this.lastDepletionTime = Date.now();
    this.isRegenerating = false;
    this.regenDelayTimer = 0;

    const effectiveness = this.getEffectiveness();

    if (previousEnergy !== this.currentEnergy) {
      this.emitEnergyChanged();
    }

    return effectiveness;
  }

  getEffectiveness(): number {
    const energyPercentage = this.currentEnergy / this.maxEnergy;

    const effectiveness =
      SLASH_ENERGY.minEffectiveness +
      (1.0 - SLASH_ENERGY.minEffectiveness) * energyPercentage;

    return effectiveness;
  }

  update(time: number, delta: number): void {
    const deltaSeconds = delta / 1000;

    if (!this.isRegenerating && this.currentEnergy < this.maxEnergy) {
      this.regenDelayTimer += deltaSeconds;

      if (this.regenDelayTimer >= SLASH_ENERGY.regenDelay) {
        this.isRegenerating = true;
      }
    }

    if (this.isRegenerating && this.currentEnergy < this.maxEnergy) {
      const previousEnergy = this.currentEnergy;
      const regenAmount = this.regenRate * deltaSeconds;
      this.currentEnergy = Math.min(this.maxEnergy, this.currentEnergy + regenAmount);

      if (previousEnergy !== this.currentEnergy) {
        this.emitEnergyChanged();
      }

      if (this.currentEnergy >= this.maxEnergy) {
        this.isRegenerating = false;
      }
    }
  }

  private emitEnergyChanged(): void {
    const percentage = this.getEnergyPercentage();
    const isLow = percentage <= SLASH_ENERGY.lowEnergyThreshold;
    const isDepleted = this.currentEnergy <= 0;

    const eventData: SlashEnergyChangedEvent = {
      current: this.currentEnergy,
      max: this.maxEnergy,
      percentage,
      isLow,
      isDepleted,
    };

    EventBus.emit('slash-energy-changed', eventData);

    if (isDepleted && !this.wasDepleted) {
      EventBus.emit('slash-energy-depleted', eventData);
    }

    if (isLow && !this.wasLowEnergy) {
      EventBus.emit('slash-energy-low', eventData);
    }

    this.wasLowEnergy = isLow;
    this.wasDepleted = isDepleted;
  }

  getCurrentEnergy(): number {
    return this.currentEnergy;
  }

  getMaxEnergy(): number {
    return this.maxEnergy;
  }

  getEnergyPercentage(): number {
    return (this.currentEnergy / this.maxEnergy) * 100;
  }

  isLowEnergy(): boolean {
    return this.getEnergyPercentage() <= SLASH_ENERGY.lowEnergyThreshold;
  }

  isDepleted(): boolean {
    return this.currentEnergy <= 0;
  }

  isCurrentlyRegenerating(): boolean {
    return this.isRegenerating;
  }

  getState(): SlashEnergyState {
    return {
      current: this.currentEnergy,
      max: this.maxEnergy,
      regenRate: this.regenRate,
      isRegenerating: this.isRegenerating,
      lastDepletionTime: this.lastDepletionTime,
    };
  }

  addEnergy(amount: number): void {
    const previousEnergy = this.currentEnergy;
    this.currentEnergy = Math.min(this.maxEnergy, this.currentEnergy + amount);

    if (previousEnergy !== this.currentEnergy) {
      this.emitEnergyChanged();
    }
  }

  setEnergy(value: number): void {
    const previousEnergy = this.currentEnergy;
    this.currentEnergy = Math.max(0, Math.min(this.maxEnergy, value));

    if (previousEnergy !== this.currentEnergy) {
      this.emitEnergyChanged();
    }
  }

  reset(): void {
    this.applyUpgrades();
    this.currentEnergy = this.maxEnergy;
    this.isRegenerating = false;
    this.lastDepletionTime = 0;
    this.regenDelayTimer = 0;
    this.wasLowEnergy = false;
    this.wasDepleted = false;

    this.emitEnergyChanged();
  }

  canSlash(): boolean {
    return true;
  }

  getRegenRate(): number {
    return this.regenRate;
  }

  getRegenDelayRemaining(): number {
    if (this.isRegenerating || this.currentEnergy >= this.maxEnergy) {
      return 0;
    }
    return Math.max(0, SLASH_ENERGY.regenDelay - this.regenDelayTimer);
  }

  shutdown(): void {
    this.scene = null;
    this.upgradeManager = null;
  }
}
