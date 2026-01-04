/**
 * ShopManager
 *
 * Calculates prices for weapons and upgrades.
 * Handles purchase logic and integrates with SaveManager.
 */

import type { WeaponId, UpgradeId } from '@config/types';
import { debugLog, debugWarn, debugError } from '@utils/DebugLogger';


import { SaveManager } from '@managers/SaveManager';
import { WeaponManager } from '@managers/WeaponManager';
import { UpgradeManager } from '@managers/UpgradeManager';
import { EventBus } from '@utils/EventBus';

export class ShopManager {
  private static instance: ShopManager;

  // References
  private saveManager: SaveManager;
  private weaponManager: WeaponManager;
  private upgradeManager: UpgradeManager;

  private constructor() {
    this.saveManager = new SaveManager();
    this.weaponManager = WeaponManager.getInstance();
    this.upgradeManager = UpgradeManager.getInstance();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ShopManager {
    if (!ShopManager.instance) {
      ShopManager.instance = new ShopManager();
    }
    return ShopManager.instance;
  }

  /**
   * Check if player can afford an item
   */
  canAfford(cost: number): boolean {
    return this.saveManager.getSouls() >= cost;
  }

  /**
   * Purchase a weapon (unlock)
   */
  purchaseWeapon(weaponId: WeaponId): boolean {
    // Check if already owned
    if (this.weaponManager.isWeaponOwned(weaponId)) {
      debugWarn('[ShopManager] Weapon already owned:', weaponId);
      return false;
    }

    // Get unlock cost
    const cost = this.weaponManager.getUnlockCost(weaponId);

    // Check if can afford
    if (!this.canAfford(cost)) {
      debugWarn('[ShopManager] Cannot afford weapon:', weaponId, 'cost:', cost);
      return false;
    }

    // Deduct souls
    if (!this.saveManager.spendSouls(cost)) {
      return false;
    }

    // Unlock weapon
    this.saveManager.purchaseWeapon(weaponId);
    EventBus.emit('weapon-purchased', { weaponId, cost });
    return true;
  }

  /**
   * Upgrade a weapon tier
   */
  upgradeWeapon(weaponId: WeaponId): boolean {
    // Check if owned
    if (!this.weaponManager.isWeaponOwned(weaponId)) {
      debugWarn('[ShopManager] Cannot upgrade unowned weapon:', weaponId);
      return false;
    }

    // Get current tier
    const currentTier = this.weaponManager.getWeaponTier(weaponId);

    // Get upgrade cost
    const cost = this.weaponManager.getUpgradeCost(weaponId, currentTier);

    // Check if can afford
    if (!this.canAfford(cost)) {
      debugWarn('[ShopManager] Cannot afford weapon upgrade:', weaponId, 'tier:', currentTier, 'cost:', cost);
      return false;
    }

    // Deduct souls
    if (!this.saveManager.spendSouls(cost)) {
      return false;
    }

    // Upgrade weapon
    this.weaponManager.upgradeWeapon(weaponId);
    EventBus.emit('weapon-upgraded', { weaponId, tier: currentTier + 1, cost });
    return true;
  }

  /**
   * Purchase an upgrade tier
   */
  purchaseUpgrade(upgradeId: UpgradeId): boolean {
    // Get current tier
    const currentTier = this.upgradeManager.getUpgradeTier(upgradeId);

    // Check if at max tier
    if (this.upgradeManager.isMaxTier(upgradeId)) {
      debugWarn('[ShopManager] Upgrade already at max tier:', upgradeId);
      return false;
    }

    // Get upgrade cost
    const cost = this.upgradeManager.getUpgradeCost(upgradeId, currentTier);

    // Check if can afford
    if (!this.canAfford(cost)) {
      debugWarn('[ShopManager] Cannot afford upgrade:', upgradeId, 'tier:', currentTier, 'cost:', cost);
      return false;
    }

    // Deduct souls
    if (!this.saveManager.spendSouls(cost)) {
      return false;
    }

    // Purchase upgrade
    this.upgradeManager.purchaseUpgrade(upgradeId);
    EventBus.emit('upgrade-purchased', { upgradeId, tier: currentTier + 1, cost });
    return true;
  }

  /**
   * Get weapon unlock cost
   */
  getWeaponUnlockCost(weaponId: WeaponId): number {
    return this.weaponManager.getUnlockCost(weaponId);
  }

  /**
   * Get weapon upgrade cost
   */
  getWeaponUpgradeCost(weaponId: WeaponId, currentTier: number): number {
    return this.weaponManager.getUpgradeCost(weaponId, currentTier);
  }

  /**
   * Get upgrade cost
   */
  getUpgradeCost(upgradeId: UpgradeId, currentTier: number): number {
    return this.upgradeManager.getUpgradeCost(upgradeId, currentTier);
  }

  /**
   * Get current player souls
   */
  getSouls(): number {
    return this.saveManager.getSouls();
  }

  /**
   * Check if weapon is owned
   */
  isWeaponOwned(weaponId: WeaponId): boolean {
    return this.weaponManager.isWeaponOwned(weaponId);
  }

  /**
   * Check if upgrade is at max tier
   */
  isUpgradeMaxTier(upgradeId: UpgradeId): boolean {
    return this.upgradeManager.isMaxTier(upgradeId);
  }

  /**
   * Get weapon tier
   */
  getWeaponTier(weaponId: WeaponId): number {
    return this.weaponManager.getWeaponTier(weaponId);
  }

  /**
   * Get upgrade tier
   */
  getUpgradeTier(upgradeId: UpgradeId): number {
    return this.upgradeManager.getUpgradeTier(upgradeId);
  }

  /**
   * Calculate total cost to max out a weapon
   */
  getTotalWeaponCost(weaponId: WeaponId): number {
    const unlockCost = this.weaponManager.getUnlockCost(weaponId);
    let totalCost = unlockCost;

    for (let tier = 0; tier < 3; tier++) {
      totalCost += this.weaponManager.getUpgradeCost(weaponId, tier);
    }

    return totalCost;
  }

  /**
   * Calculate total cost to max out an upgrade
   */
  getTotalUpgradeCost(upgradeId: UpgradeId): number {
    return this.upgradeManager.getTotalCostToMax(upgradeId);
  }

  /**
   * Reset shop data (for testing)
   */
  reset(): void {
    // Shop manager doesn't store state, just references other managers
  }
}

// Export singleton instance
export const shopManager = ShopManager.getInstance();
