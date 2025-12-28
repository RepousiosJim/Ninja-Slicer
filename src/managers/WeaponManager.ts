/**
 * WeaponManager
 *
 * Manages weapon definitions, equipped weapon, and weapon tiers.
 * Applies weapon effects to gameplay and provides trail styles.
 */

import { WeaponId, WeaponConfig, WeaponStats, WeaponEffect, MonsterType } from '@config/types';
import { dataLoader } from '@utils/DataLoader';
import { SaveManager } from '@managers/SaveManager';
import { EventBus } from '@utils/EventBus';

export class WeaponManager {
  private static instance: WeaponManager;

  // Loaded weapon data
  private weapons: Map<WeaponId, WeaponConfig> = new Map();

  // Current state
  private equippedWeapon: WeaponId = WeaponId.BASIC_SWORD;
  private weaponTiers: Map<WeaponId, number> = new Map();

  // References
  private saveManager: SaveManager;

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
   * Load weapon definitions from data files
   */
  async loadWeapons(): Promise<void> {
    const weapons = await dataLoader.loadWeapons();
    this.weapons.clear();

    for (const weapon of weapons) {
      this.weapons.set(weapon.id as WeaponId, weapon);
    }

    console.log('[WeaponManager] Loaded', this.weapons.size, 'weapons');
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
    console.log('[WeaponManager] getAllWeapons called, weapons map size:', this.weapons.size);
    console.log('[WeaponManager] Weapons in map:', Array.from(this.weapons.keys()));
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
      console.warn('[WeaponManager] Cannot equip unknown weapon:', weaponId);
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
   * Upgrade a weapon tier
   */
  upgradeWeapon(weaponId: WeaponId): boolean {
    const currentTier = this.getWeaponTier(weaponId);
    const weaponConfig = this.getWeaponConfig(weaponId);

    if (!weaponConfig) {
      console.warn('[WeaponManager] Cannot upgrade unknown weapon:', weaponId);
      return false;
    }

    if (currentTier >= weaponConfig.tiers.length) {
      console.warn('[WeaponManager] Weapon already at max tier:', weaponId);
      return false;
    }

    this.weaponTiers.set(weaponId, currentTier + 1);
    this.saveManager.upgradeWeapon(weaponId);
    EventBus.emit('weapon-upgraded', { weaponId, tier: currentTier + 1 });
    return true;
  }

  /**
   * Get weapon stats with current tier
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
   * Apply weapon effects to a monster
   */
  applyWeaponEffects(
    slashEvent: { position: { x: number; y: number } },
    monster: { type: MonsterType; position: { x: number; y: number }; health: number; applyDamage: (damage: number) => void; applyBurn?: (damage: number, duration: number) => void; applySlow?: (multiplier: number, duration: number) => void; applyStun?: (duration: number) => void; setAlwaysVisible?: (visible: boolean) => void }
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
    slashEvent: { position: { x: number; y: number } }
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
    }
  }

  /**
   * Apply chain damage to nearby monsters
   */
  private applyChainDamage(
    sourceMonster: { type: MonsterType; position: { x: number; y: number } },
    slashEvent: { position: { x: number; y: number } },
    effect: WeaponEffect
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
    effect: WeaponEffect
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
}

// Export singleton instance
export const weaponManager = WeaponManager.getInstance();
