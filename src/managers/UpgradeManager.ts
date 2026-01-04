/**
 * UpgradeManager
 *
 * Manages upgrade definitions, upgrade tiers, and calculates bonus values.
 * Provides combined player stats from all upgrades.
 */

import type { UpgradeConfig, PlayerStats } from '@config/types';
import { UpgradeId } from '@config/types';
import { debugLog, debugWarn, debugError } from '@utils/DebugLogger';


import { dataLoader } from '@utils/DataLoader';
import { SaveManager } from '@managers/SaveManager';
import { EventBus } from '@utils/EventBus';
import type { IManager } from './IManager';

export class UpgradeManager implements IManager {
  private static instance: UpgradeManager;

  // Loaded upgrade data
  private upgrades: Map<UpgradeId, UpgradeConfig> = new Map();

  // Current state
  private upgradeTiers: Map<UpgradeId, number> = new Map();

  // References
  private saveManager: SaveManager;

  /**
   * Private constructor for singleton pattern
   * Initializes with save manager and loads upgrade tiers
   * 
   * @private
   */
  private constructor() {
    this.saveManager = new SaveManager();
    this.loadUpgradeTiersFromSave();
  }

  /**
   * Get singleton instance of upgrade manager
   * 
   * @returns The global UpgradeManager instance
   * 
   * @example
   * ```typescript
   * const upgradeManager = UpgradeManager.getInstance();
   * const stats = upgradeManager.getPlayerStats();
   * ```
   */
  static getInstance(): UpgradeManager {
    if (!UpgradeManager.instance) {
      UpgradeManager.instance = new UpgradeManager();
    }
    return UpgradeManager.instance;
  }

  /**
   * Initialize manager
   */
  initialize(scene?: Phaser.Scene): void {
    this.loadUpgradeTiersFromSave();
  }

  /**
   * Load upgrade definitions from data files
   */
  async loadUpgrades(): Promise<void> {
    const upgrades = await dataLoader.loadUpgrades();
    this.upgrades.clear();

    for (const upgrade of upgrades) {
      this.upgrades.set(upgrade.id as UpgradeId, upgrade);
    }

    debugLog('[UpgradeManager] Loaded', this.upgrades.size, 'upgrades');
  }

  /**
   * Get upgrade configuration by ID
   */
  getUpgradeConfig(upgradeId: UpgradeId): UpgradeConfig | undefined {
    return this.upgrades.get(upgradeId);
  }

  /**
   * Get all loaded upgrades
   */
  getAllUpgrades(): UpgradeConfig[] {
    return Array.from(this.upgrades.values());
  }

  /**
   * Get current tier for an upgrade (0-4)
   */
  getUpgradeTier(upgradeId: UpgradeId): number {
    return this.upgradeTiers.get(upgradeId) || 0;
  }

  /**
   * Get current bonus value for an upgrade
   */
  getUpgradeValue(upgradeId: UpgradeId): number {
    const config = this.getUpgradeConfig(upgradeId);
    if (!config) return 0;

    const tier = this.getUpgradeTier(upgradeId);
    const tierConfig = config.tiers[tier];

    return tierConfig?.value || config.baseValue;
  }

  /**
   * Purchase an upgrade tier
   */
  purchaseUpgrade(upgradeId: UpgradeId): boolean {
    const config = this.getUpgradeConfig(upgradeId);
    if (!config) {
      debugWarn('[UpgradeManager] Cannot purchase unknown upgrade:', upgradeId);
      return false;
    }

    const currentTier = this.getUpgradeTier(upgradeId);
    if (currentTier >= config.maxTier) {
      debugWarn('[UpgradeManager] Upgrade already at max tier:', upgradeId);
      return false;
    }

    this.upgradeTiers.set(upgradeId, currentTier + 1);
    this.saveManager.purchaseUpgrade(upgradeId as any);
    EventBus.emit('upgrade-purchased', { upgradeId, tier: currentTier + 1 });
    return true;
  }

  /**
   * Get combined player stats from all upgrades
   */
  getPlayerStats(): PlayerStats {
    return {
      slashWidthMultiplier: this.getUpgradeValue(UpgradeId.SLASH_WIDTH),
      startingLives: this.getUpgradeValue(UpgradeId.EXTRA_LIVES),
      scoreMultiplier: this.getUpgradeValue(UpgradeId.SCORE_MULTIPLIER),
      slowMotionDuration: this.getUpgradeValue(UpgradeId.SLOW_MOTION_DURATION),
      criticalHitChance: this.getUpgradeValue(UpgradeId.CRITICAL_HIT),
      criticalHitMultiplier: 2.0, // Fixed 2x multiplier for critical hits
    };
  }

  /**
   * Get upgrade cost for a specific tier
   */
  getUpgradeCost(upgradeId: UpgradeId, currentTier: number): number {
    const config = this.getUpgradeConfig(upgradeId);
    if (!config || currentTier >= config.maxTier) {
      return 0;
    }

    const tierConfig = config.tiers[currentTier];
    return tierConfig?.cost || 0;
  }

  /**
   * Get max tier for an upgrade
   */
  getMaxTier(upgradeId: UpgradeId): number {
    const config = this.getUpgradeConfig(upgradeId);
    return config?.maxTier || 0;
  }

  /**
   * Check if an upgrade is at max tier
   */
  isMaxTier(upgradeId: UpgradeId): boolean {
    const currentTier = this.getUpgradeTier(upgradeId);
    const maxTier = this.getMaxTier(upgradeId);
    return currentTier >= maxTier;
  }

  /**
   * Get total cost to max out an upgrade
   */
  getTotalCostToMax(upgradeId: UpgradeId): number {
    const config = this.getUpgradeConfig(upgradeId);
    return config?.totalCost || 0;
  }

  /**
   * Load upgrade tiers from save data
   */
  private loadUpgradeTiersFromSave(): void {
    const saveData = this.saveManager.getSaveData();
    this.upgradeTiers.clear();

    for (const [upgradeId, tier] of Object.entries(saveData.upgrades)) {
      this.upgradeTiers.set(upgradeId as UpgradeId, tier);
    }
  }

  /**
   * Reset all upgrade data (for testing)
   */
  reset(): void {
    this.upgrades.clear();
    this.upgradeTiers.clear();
  }

  /**
   * Shutdown and cleanup
   */
  shutdown(): void {
    this.upgrades.clear();
    this.upgradeTiers.clear();
  }
}

// Export singleton instance
export const upgradeManager = UpgradeManager.getInstance();
