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

import Phaser from 'phaser';
import { SlashEnergyState, SlashEnergyChangedEvent } from '@config/types';
import { SLASH_ENERGY, EVENTS } from '@config/constants';
import { EventBus } from '@utils/EventBus';
import { UpgradeManager } from './UpgradeManager';

export class SlashEnergyManager {
  private static instance: SlashEnergyManager | null = null;
  private scene: Phaser.Scene | null = null;
  private upgradeManager: UpgradeManager | null = null;

  // Energy state
  private currentEnergy: number = SLASH_ENERGY.maxEnergy;
  private maxEnergy: number = SLASH_ENERGY.maxEnergy;
  private regenRate: number = SLASH_ENERGY.regenRatePerSecond;
  private isRegenerating: boolean = false;
  private lastDepletionTime: number = 0;
  private regenDelayTimer: number = 0;

  // Low energy tracking
  private wasLowEnergy: boolean = false;
  private wasDepleted: boolean = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): SlashEnergyManager {
    if (!SlashEnergyManager.instance) {
      SlashEnergyManager.instance = new SlashEnergyManager();
    }
    return SlashEnergyManager.instance;
  }

  /**
   * Initialize the manager with a scene reference
   */
  initialize(scene: Phaser.Scene): void {
    this.scene = scene;
    this.reset();
  }

  /**
   * Set upgrade manager reference for potential energy upgrades
   */
  setUpgradeManager(upgradeManager: UpgradeManager): void {
    this.upgradeManager = upgradeManager;
    // Apply any upgrade bonuses to max energy or regen rate here
    this.applyUpgrades();
  }

  /**
   * Apply upgrade bonuses to energy stats
   */
  private applyUpgrades(): void {
    // Future: Apply upgrades for max energy, regen rate, etc.
    // For now, use base values from constants
    this.maxEnergy = SLASH_ENERGY.maxEnergy;
    this.regenRate = SLASH_ENERGY.regenRatePerSecond;
  }

  /**
   * Consume energy based on slash distance
   * @param distance - Distance of the slash in pixels
   * @returns The effectiveness multiplier (1.0 at full energy, minEffectiveness at 0)
   */
  consumeEnergy(distance: number): number {
    // Calculate energy cost
    const distanceCost = distance * SLASH_ENERGY.baseCostPerDistance;
    const totalCost = Math.max(SLASH_ENERGY.minCostPerSlash, distanceCost);

    // Deplete energy
    const previousEnergy = this.currentEnergy;
    this.currentEnergy = Math.max(0, this.currentEnergy - totalCost);

    // Update state
    this.lastDepletionTime = Date.now();
    this.isRegenerating = false;
    this.regenDelayTimer = 0;

    // Calculate effectiveness based on energy level
    const effectiveness = this.getEffectiveness();

    // Emit energy changed event if significant change
    if (previousEnergy !== this.currentEnergy) {
      this.emitEnergyChanged();
    }

    return effectiveness;
  }

  /**
   * Get current effectiveness multiplier based on energy level
   * @returns Multiplier from minEffectiveness (at 0 energy) to 1.0 (at full energy)
   */
  getEffectiveness(): number {
    const energyPercentage = this.currentEnergy / this.maxEnergy;

    // Linear interpolation from minEffectiveness to 1.0 based on energy
    const effectiveness =
      SLASH_ENERGY.minEffectiveness +
      (1.0 - SLASH_ENERGY.minEffectiveness) * energyPercentage;

    return effectiveness;
  }

  /**
   * Update energy regeneration
   * @param time - Current game time
   * @param delta - Time since last update in milliseconds
   */
  update(time: number, delta: number): void {
    const deltaSeconds = delta / 1000;

    // Check if we should start regenerating
    if (!this.isRegenerating && this.currentEnergy < this.maxEnergy) {
      this.regenDelayTimer += deltaSeconds;

      if (this.regenDelayTimer >= SLASH_ENERGY.regenDelay) {
        this.isRegenerating = true;
      }
    }

    // Regenerate energy
    if (this.isRegenerating && this.currentEnergy < this.maxEnergy) {
      const previousEnergy = this.currentEnergy;
      const regenAmount = this.regenRate * deltaSeconds;
      this.currentEnergy = Math.min(this.maxEnergy, this.currentEnergy + regenAmount);

      // Emit event if energy changed
      if (previousEnergy !== this.currentEnergy) {
        this.emitEnergyChanged();
      }

      // Stop regenerating when full
      if (this.currentEnergy >= this.maxEnergy) {
        this.isRegenerating = false;
      }
    }
  }

  /**
   * Emit energy changed event with current state
   */
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

    EventBus.emit(EVENTS.slashEnergyChanged, eventData);

    // Emit special events for state transitions
    if (isDepleted && !this.wasDepleted) {
      EventBus.emit(EVENTS.slashEnergyDepleted, eventData);
    }

    if (isLow && !this.wasLowEnergy) {
      EventBus.emit(EVENTS.slashEnergyLow, eventData);
    }

    // Update state tracking
    this.wasLowEnergy = isLow;
    this.wasDepleted = isDepleted;
  }

  /**
   * Get current energy value
   */
  getCurrentEnergy(): number {
    return this.currentEnergy;
  }

  /**
   * Get maximum energy value
   */
  getMaxEnergy(): number {
    return this.maxEnergy;
  }

  /**
   * Get energy as percentage (0-100)
   */
  getEnergyPercentage(): number {
    return (this.currentEnergy / this.maxEnergy) * 100;
  }

  /**
   * Check if energy is low (below threshold)
   */
  isLowEnergy(): boolean {
    return this.getEnergyPercentage() <= SLASH_ENERGY.lowEnergyThreshold;
  }

  /**
   * Check if energy is depleted (at zero)
   */
  isDepleted(): boolean {
    return this.currentEnergy <= 0;
  }

  /**
   * Check if energy is currently regenerating
   */
  isCurrentlyRegenerating(): boolean {
    return this.isRegenerating;
  }

  /**
   * Get the full energy state
   */
  getState(): SlashEnergyState {
    return {
      current: this.currentEnergy,
      max: this.maxEnergy,
      regenRate: this.regenRate,
      isRegenerating: this.isRegenerating,
      lastDepletionTime: this.lastDepletionTime,
    };
  }

  /**
   * Add energy (e.g., from power-ups or pickups)
   * @param amount - Amount of energy to add
   */
  addEnergy(amount: number): void {
    const previousEnergy = this.currentEnergy;
    this.currentEnergy = Math.min(this.maxEnergy, this.currentEnergy + amount);

    if (previousEnergy !== this.currentEnergy) {
      this.emitEnergyChanged();
    }
  }

  /**
   * Set energy to a specific value (for debugging or special effects)
   * @param value - Energy value to set
   */
  setEnergy(value: number): void {
    const previousEnergy = this.currentEnergy;
    this.currentEnergy = Math.max(0, Math.min(this.maxEnergy, value));

    if (previousEnergy !== this.currentEnergy) {
      this.emitEnergyChanged();
    }
  }

  /**
   * Reset energy to maximum (call when starting new game)
   */
  reset(): void {
    this.applyUpgrades();
    this.currentEnergy = this.maxEnergy;
    this.isRegenerating = false;
    this.lastDepletionTime = 0;
    this.regenDelayTimer = 0;
    this.wasLowEnergy = false;
    this.wasDepleted = false;

    // Emit initial state
    this.emitEnergyChanged();
  }

  /**
   * Check if player can perform a slash (has any energy)
   * Note: Players can always slash, but with reduced effectiveness at 0 energy
   */
  canSlash(): boolean {
    // Always allow slashing, but with reduced effectiveness
    return true;
  }

  /**
   * Get regeneration rate per second
   */
  getRegenRate(): number {
    return this.regenRate;
  }

  /**
   * Get time until regeneration starts (if in delay period)
   */
  getRegenDelayRemaining(): number {
    if (this.isRegenerating || this.currentEnergy >= this.maxEnergy) {
      return 0;
    }
    return Math.max(0, SLASH_ENERGY.regenDelay - this.regenDelayTimer);
  }
}
