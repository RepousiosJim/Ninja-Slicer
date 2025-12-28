/**
 * PowerUpManager
 *
 * Manages active power-ups and their effects.
 * Singleton pattern for global access.
 */

import Phaser from 'phaser';
import { PowerUpType, UpgradeId } from '@config/types';
import { POWERUP_SLOW_MOTION, POWERUP_FRENZY, POWERUP_SHIELD, POWERUP_SOUL_MAGNET } from '@config/constants';
import { EventBus } from '@utils/EventBus';
import { UpgradeManager } from './UpgradeManager';

export class PowerUpManager {
  private static instance: PowerUpManager | null = null;
  private activePowerUps: Map<PowerUpType, number> = new Map();
  private scene: Phaser.Scene | null = null;
  private shieldInstance: any = null; // Reference to active ShieldPowerUp
  private upgradeManager: UpgradeManager | null = null;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): PowerUpManager {
    if (!PowerUpManager.instance) {
      PowerUpManager.instance = new PowerUpManager();
    }
    return PowerUpManager.instance;
  }

  /**
   * Initialize the manager with a scene reference
   */
  initialize(scene: Phaser.Scene): void {
    this.scene = scene;
  }

  /**
   * Set upgrade manager reference
   */
  setUpgradeManager(upgradeManager: UpgradeManager): void {
    this.upgradeManager = upgradeManager;
  }

  /**
   * Activate a power-up
   * @param type - Type of power-up to activate
   */
  activatePowerUp(type: PowerUpType): void {
    const duration = this.getDuration(type);
    const expirationTime = Date.now() + duration * 1000;
    
    this.activePowerUps.set(type, expirationTime);
    
    // Store reference to shield power-up for consumption
    if (type === PowerUpType.SHIELD) {
      // Find the shield power-up instance in the scene
      const powerUpObj = this.scene?.children.getByName('powerup');
      if (powerUpObj) {
        const powerUp = powerUpObj as any;
        if (powerUp.getPowerUpType && powerUp.getPowerUpType() === PowerUpType.SHIELD) {
          this.shieldInstance = powerUp;
        }
      }
    }
  }

  /**
   * Deactivate a power-up
   * @param type - Type of power-up to deactivate
   */
  deactivatePowerUp(type: PowerUpType): void {
    this.activePowerUps.delete(type);
    
    // Clear shield reference
    if (type === PowerUpType.SHIELD) {
      this.shieldInstance = null;
    }
  }

  /**
   * Consume the shield (called when villager is sliced)
   */
  consumeShield(): void {
    if (this.shieldInstance && this.activePowerUps.has(PowerUpType.SHIELD)) {
      this.shieldInstance.consume();
      this.deactivatePowerUp(PowerUpType.SHIELD);
    }
  }

  /**
   * Update active power-ups and check for expiration
   * @param time - Current time
   * @param delta - Time since last update
   */
  update(time: number, delta: number): void {
    const currentTime = Date.now();
    const expiredTypes: PowerUpType[] = [];
    
    // Check for expired power-ups
    this.activePowerUps.forEach((expirationTime, type) => {
      if (currentTime >= expirationTime) {
        expiredTypes.push(type);
      }
    });
    
    // Deactivate expired power-ups
    expiredTypes.forEach((type) => {
      this.deactivatePowerUp(type);
    });
  }

  /**
   * Check if a power-up is currently active
   * @param type - Type of power-up to check
   */
  isActive(type: PowerUpType): boolean {
    return this.activePowerUps.has(type);
  }

  /**
   * Get remaining time for a power-up in seconds
   * @param type - Type of power-up to check
   */
  getRemainingTime(type: PowerUpType): number {
    const expirationTime = this.activePowerUps.get(type);
    if (!expirationTime) return 0;
    
    const remaining = Math.max(0, (expirationTime - Date.now()) / 1000);
    return remaining;
  }

  /**
   * Get the duration for a power-up type
   * @param type - Type of power-up
   */
  private getDuration(type: PowerUpType): number {
    switch (type) {
      case PowerUpType.SLOW_MOTION:
        // Apply upgrade bonus to slow motion duration
        let duration: number = POWERUP_SLOW_MOTION.duration;
        if (this.upgradeManager) {
          const bonus = this.upgradeManager.getUpgradeValue(UpgradeId.SLOW_MOTION_DURATION);
          duration = bonus;
        }
        return duration;
      case PowerUpType.FRENZY:
        return POWERUP_FRENZY.duration;
      case PowerUpType.SHIELD:
        return POWERUP_SHIELD.duration;
      case PowerUpType.SOUL_MAGNET:
        return POWERUP_SOUL_MAGNET.duration;
      default:
        return 0;
    }
  }

  /**
   * Get all active power-up types
   */
  getActivePowerUps(): PowerUpType[] {
    return Array.from(this.activePowerUps.keys());
  }

  /**
   * Reset all power-ups (call when starting new game)
   */
  reset(): void {
    this.activePowerUps.clear();
    this.shieldInstance = null;
  }

  /**
   * Check if frenzy is active (for score calculation)
   */
  isFrenzyActive(): boolean {
    return this.isActive(PowerUpType.FRENZY);
  }

  /**
   * Check if soul magnet is active (for soul calculation)
   */
  isSoulMagnetActive(): boolean {
    return this.isActive(PowerUpType.SOUL_MAGNET);
  }

  /**
   * Check if shield is active (for villager penalty)
   */
  isShieldActive(): boolean {
    return this.isActive(PowerUpType.SHIELD);
  }
}
