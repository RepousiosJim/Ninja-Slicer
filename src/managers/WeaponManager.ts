/**
 * WeaponManager
 *
 * Manages weapon definitions, equipped weapon, and weapon tiers.
 * Applies weapon effects to gameplay and provides trail styles.
 */

import type { WeaponConfig, WeaponStats, WeaponEffect} from '@config/types';
import { WeaponId, MonsterType } from '@config/types';
import { debugLog, debugWarn, debugError } from '@utils/DebugLogger';


import { dataLoader } from '@utils/DataLoader';
import { SaveManager } from '@managers/SaveManager';
import { EventBus } from '@utils/EventBus';
import type { IManager } from './IManager';

export class WeaponManager implements IManager {
  private static instance: WeaponManager;

  // Loaded weapon data
  private weapons: Map<WeaponId, WeaponConfig> = new Map();

  // Current state
  private equippedWeapon: WeaponId = WeaponId.BASIC_SWORD;
  private weaponTiers: Map<WeaponId, number> = new Map();

  // References
  private saveManager: SaveManager;

  /**
   * Private constructor for singleton pattern
   * Initializes weapon manager with save data
   * 
   * @private
   */
  private constructor() {
    this.saveManager = new SaveManager();
    this.loadWeaponTiersFromSave();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): WeaponManager {
    if (!WeaponManager.instance) {
      WeaponManager.instance = new WeaponManager();
    }
    return WeaponManager.instance;
  }

  /**
   * Initialize manager and load weapon tiers from save data
   * 
   * @param scene - Optional Phaser scene (not currently used)
   * 
   * @example
   * ```typescript
   * const weaponManager = WeaponManager.getInstance();
   * await weaponManager.loadWeapons();
   * weaponManager.initialize();
   * ```
   */
  initialize(scene?: Phaser.Scene): void {
    this.loadWeaponTiersFromSave();
  }

  /**
   * Load weapon definitions from data files
   */
  async loadWeapons(): Promise<void> {
    const weapons = await dataLoader.loadWeapons();
    this.weapons.clear();

    for (const weapon of weapons) {
      this.weapons.set(weapon.id as WeaponId, weapon);
    }

    debugLog('[WeaponManager] Loaded', this.weapons.size, 'weapons');
  }

  /**
   * Get weapon configuration by ID
   */
  getWeaponConfig(weaponId: WeaponId): WeaponConfig | undefined {
    return this.weapons.get(weaponId);
  }

  /**
   * Get all loaded weapons
   */
  getAllWeapons(): WeaponConfig[] {
    debugLog('[WeaponManager] getAllWeapons called, weapons map size:', this.weapons.size);
    debugLog('[WeaponManager] Weapons in map:', Array.from(this.weapons.keys()));
    return Array.from(this.weapons.values());
  }

  /**
   * Get currently equipped weapon ID
   */
  getEquippedWeapon(): WeaponId {
    return this.equippedWeapon;
  }

  /**
   * Equip a weapon
   */
  equipWeapon(weaponId: WeaponId): void {
    if (!this.weapons.has(weaponId)) {
      debugWarn('[WeaponManager] Cannot equip unknown weapon:', weaponId);
      return;
    }

    this.equippedWeapon = weaponId;
    this.saveManager.equipWeapon(weaponId);
    EventBus.emit('weapon-equipped', { weaponId });
  }

  /**
   * Get current tier for a weapon (0-2)
   */
  getWeaponTier(weaponId: WeaponId): number {
    return this.weaponTiers.get(weaponId) || 0;
  }

  /**
   * Upgrade a weapon to the next tier
   * Returns false if weapon doesn't exist or is already at max tier
   * 
   * @param weaponId - The weapon ID to upgrade
   * @returns true if upgrade successful, false otherwise
   * 
   * @example
   * ```
typescript
   * const success = weaponManager.upgradeWeapon(WeaponId.BASIC_SWORD);
   * if (success) {
   *   debugLog('Weapon upgraded to tier', weaponManager.getWeaponTier(WeaponId.BASIC_SWORD));
   * }
   * ```
   */
  upgradeWeapon(weaponId: WeaponId): boolean {
    const currentTier = this.getWeaponTier(weaponId);
    const weaponConfig = this.getWeaponConfig(weaponId);

    if (!weaponConfig) {
      debugWarn('[WeaponManager] Cannot upgrade unknown weapon:', weaponId);
      return false;
    }

    if (currentTier >= weaponConfig.tiers.length) {
      debugWarn('[WeaponManager] Weapon already at max tier:', weaponId);
      return false;
    }

    this.weaponTiers.set(weaponId, currentTier + 1);
    this.saveManager.upgradeWeapon(weaponId);
    EventBus.emit('weapon-upgraded', { weaponId, tier: currentTier + 1 });
    return true;
  }

  /**
   * Get weapon stats with current tier effects
   * Returns complete weapon information including current tier and active effects
   * 
   * @param weaponId - The weapon ID to get stats for
   * @returns Weapon stats object with id, name, tier, effects, and trail colors
   * @throws Error if weapon not found
   * 
   * @example
   * ```typescript
   * const stats = weaponManager.getWeaponStats(WeaponId.FIRE_SWORD);
   * debugLog(`${stats.name} (Tier ${stats.tier})`);
   * stats.effects.forEach(effect => debugLog(effect.type));
   * ```
   */
  getWeaponStats(weaponId: WeaponId): WeaponStats {
    const config = this.getWeaponConfig(weaponId);
    if (!config) {
      throw new Error(`Weapon not found: ${weaponId}`);
    }

    const tier = this.getWeaponTier(weaponId);
    const tierConfig = config.tiers[tier] || config.tiers[0];

    return {
      id: config.id,
      name: config.name,
      tier: tier,
      effects: tierConfig?.effects || [],
      trailColor: config.trailColor,
      trailGlow: config.trailGlow,
    };
  }

  /**
   * Get trail style for current weapon
   */
  getWeaponTrailStyle(): { color: number; glow: number; width: number } {
    const config = this.getWeaponConfig(this.equippedWeapon);
    if (!config) {
      return { color: 0xffffff, glow: 0xaaaaaa, width: 8 };
    }

    return {
      color: parseInt(config.trailColor.replace('#', ''), 16),
      glow: parseInt(config.trailGlow.replace('#', ''), 16),
      width: 8,
    };
  }

  /**
   * Apply weapon effects to a monster based on equipped weapon's tier
   * Effects include bonus damage, damage over time, slow, stun, chain damage, and more
   * 
   * @param slashEvent - The slash event containing position data
   * @param monster - The monster to apply effects to, with type, position, and effect callbacks
   * 
   * @example
   * ```typescript
   * weaponManager.applyWeaponEffects(
   *   { position: { x: 100, y: 200 } },
   *   {
   *     type: MonsterType.VAMPIRE,
   *     position: { x: 100, y: 200 },
   *     health: 100,
   *     applyDamage: (dmg) => this.takeDamage(dmg),
   *     applyBurn: (dmg, dur) => this.burn(dmg, dur),
   *   }
   * );
   * ```
   */
  applyWeaponEffects(
    slashEvent: { position: { x: number; y: number } },
    monster: { type: MonsterType; position: { x: number; y: number }; health: number; applyDamage: (damage: number) => void; applyBurn?: (damage: number, duration: number) => void; applySlow?: (multiplier: number, duration: number) => void; applyStun?: (duration: number) => void; setAlwaysVisible?: (visible: boolean) => void },
  ): void {
    const config = this.getWeaponConfig(this.equippedWeapon);
    if (!config) return;

    const tier = this.getWeaponTier(this.equippedWeapon);
    const tierConfig = config.tiers[tier] || config.tiers[0];

    if (!tierConfig) return;

    for (const effect of tierConfig.effects) {
      this.applyEffect(effect, monster, slashEvent);
    }
  }

  /**
   * Apply a single weapon effect
   */
  private applyEffect(
    effect: WeaponEffect,
    monster: { type: MonsterType; position: { x: number; y: number }; health: number; applyDamage: (damage: number) => void; applyBurn?: (damage: number, duration: number) => void; applySlow?: (multiplier: number, duration: number) => void; applyStun?: (duration: number) => void; setAlwaysVisible?: (visible: boolean) => void },
    slashEvent: { position: { x: number; y: number } },
  ): void {
    switch (effect.type) {
    case 'bonus_damage':
      if (effect.target && monster.type === effect.target) {
        const bonusDamage = monster.health * (effect.value || 0.25);
        monster.applyDamage(bonusDamage);
      }
      break;

    case 'damage_over_time':
      if (effect.target && monster.type === effect.target) {
        if (monster.applyBurn) {
          const damage = effect.damagePerTick || 1;
          const duration = (effect.ticks || 1) * (effect.tickInterval || 0.5);
          monster.applyBurn(damage, duration);
        }
      }
      break;

    case 'slow':
      if (monster.applySlow) {
        const multiplier = effect.value || 0.9;
        const duration = effect.duration || 2.0;
        monster.applySlow(multiplier, duration);
      }
      break;

    case 'stun':
      if (effect.target && monster.type === effect.target) {
        if (monster.applyStun) {
          const duration = effect.duration || 0.5;
          monster.applyStun(duration);
        }
      }
      break;

    case 'chain_damage':
      this.applyChainDamage(monster, slashEvent, effect);
      break;

    case 'chain_stun':
      if (monster.applyStun) {
        const duration = effect.stunDuration || 0.3;
        monster.applyStun(duration);
      }
      break;

    case 'ghost_visibility':
      if (monster.type === MonsterType.GHOST && monster.setAlwaysVisible) {
        monster.setAlwaysVisible(true);
      }
      break;

    case 'proximity_reveal':
      // Handled in Ghost entity update
      break;

    case 'spread_damage':
      this.applySpreadDamage(monster, slashEvent, effect);
      break;

    case 'freeze_chance':
      if (Math.random() < (effect.value || 0.15)) {
        if (monster.applyStun) {
          const duration = effect.freezeDuration || 1.5;
          monster.applyStun(duration);
        }
      }
      break;

    case 'slash_width':
      // Handled by UpgradeManager
      break;

    case 'critical_hit_chance':
      // Critical hit chance is handled in SlashSystem damage calculation
      // This effect serves as metadata for the weapon
      break;
    }
  }

  /**
   * Apply chain damage to nearby monsters
   */
  private applyChainDamage(
    sourceMonster: { type: MonsterType; position: { x: number; y: number } },
    slashEvent: { position: { x: number; y: number } },
    effect: WeaponEffect,
  ): void {
    const chainCount = effect.chainCount || 1;
    const chainRadius = effect.chainRadius || 100;
    const chainDamage = effect.chainDamage || 1;

    // Find nearby monsters (this would need access to the monster list)
    // For now, emit an event that the scene can handle
    EventBus.emit('chain-damage', {
      source: sourceMonster.position,
      radius: chainRadius,
      damage: chainDamage,
      count: chainCount,
    });
  }

  /**
   * Apply spread damage to nearby monsters
   */
  private applySpreadDamage(
    sourceMonster: { type: MonsterType; position: { x: number; y: number } },
    slashEvent: { position: { x: number; y: number } },
    effect: WeaponEffect,
  ): void {
    const radius = effect.radius || 80;
    const damage = effect.damage || 1;

    // Emit event for scene to handle
    EventBus.emit('spread-damage', {
      source: sourceMonster.position,
      radius: radius,
      damage: damage,
      targetType: effect.target,
    });
  }

  /**
   * Load weapon tiers from save data
   */
  private loadWeaponTiersFromSave(): void {
    const saveData = this.saveManager.getSaveData();
    this.weaponTiers.clear();

    for (const [weaponId, tier] of Object.entries(saveData.weaponTiers)) {
      this.weaponTiers.set(weaponId as WeaponId, tier);
    }

    // Set equipped weapon from save
    if (saveData.equippedWeapon) {
      this.equippedWeapon = saveData.equippedWeapon as WeaponId;
    }
  }

  /**
   * Check if a weapon is owned
   */
  isWeaponOwned(weaponId: WeaponId): boolean {
    const saveData = this.saveManager.getSaveData();
    return saveData.unlockedWeapons.includes(weaponId);
  }

  /**
   * Get upgrade cost for a weapon tier
   */
  getUpgradeCost(weaponId: WeaponId, currentTier: number): number {
    const config = this.getWeaponConfig(weaponId);
    if (!config || currentTier >= config.tiers.length) {
      return 0;
    }

    const tierConfig = config.tiers[currentTier];
    return tierConfig?.upgradeCost || 0;
  }

  /**
   * Get unlock cost for a weapon
   */
  getUnlockCost(weaponId: WeaponId): number {
    const config = this.getWeaponConfig(weaponId);
    return config?.unlockCost || 0;
  }

  /**
   * Reset all weapon data (for testing)
   */
  reset(): void {
    this.weapons.clear();
    this.weaponTiers.clear();
    this.equippedWeapon = WeaponId.BASIC_SWORD;
  }

  /**
   * Shutdown and cleanup
   */
  shutdown(): void {
    this.weapons.clear();
    this.weaponTiers.clear();
  }
}

// Export singleton instance
export const weaponManager = WeaponManager.getInstance();
