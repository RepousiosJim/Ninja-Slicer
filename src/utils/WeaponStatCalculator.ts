/**
 * Weapon Stat Calculator
 * 
 * Provides utility methods for calculating weapon statistics,
 * effectiveness ratings, and damage calculations based on tier data.
 */

import { WeaponConfig, MonsterType } from '../config/types';

/**
 * Stat calculation result interface
 */
export interface StatCalculationResult {
  value: number;
  label: string;
  max: number;
}

/**
 * Effectiveness calculation result
 */
export interface EffectivenessResult {
  monsterType: MonsterType;
  effectiveness: number;
}

/**
 * Tier effect analysis
 */
export interface TierEffectAnalysis {
  hasBonusDamage: boolean;
  hasDamageOverTime: boolean;
  hasChainDamage: boolean;
  hasSpreadDamage: boolean;
  hasSlashWidth: boolean;
  hasProximityReveal: boolean;
  hasGhostVisibility: boolean;
  hasStun: boolean;
  hasSlow: boolean;
  targetTypes: string[];
}

/**
 * Weapon Stat Calculator Class
 * Provides static methods for calculating weapon-related statistics
 */
export class WeaponStatCalculator {
  /**
   * Calculate damage rating from tier effects
   * @param tierData - The tier data containing effects
   * @returns Damage rating (0-100 scale)
   */
  static calculateDamageRating(tierData: any): number {
    let rating = 50; // Base rating

    if (!tierData || !tierData.effects) {
      return rating;
    }

    for (const effect of tierData.effects) {
      // Bonus damage effects
      if (effect.type === 'bonus_damage') {
        rating += (effect.value - 1.0) * 30; // +25% damage = +7.5 rating
      }

      // Damage over time effects
      if (effect.type === 'damage_over_time') {
        const totalDoTDamage = effect.ticks * effect.damagePerTick;
        rating += totalDoTDamage * 5; // DoT adds to damage rating
      }

      // Chain damage effects
      if (effect.type === 'chain_damage') {
        rating += effect.chainCount * 8; // Each chain adds to damage
      }

      // Spread damage effects
      if (effect.type === 'spread_damage') {
        rating += effect.damage * 6; // AoE damage bonus
      }

      // Slash width increases effective damage
      if (effect.type === 'slash_width') {
        rating += (effect.value - 1.0) * 15;
      }
    }

    return Math.min(100, Math.round(rating)); // Cap at 100
  }

  /**
   * Calculate speed rating from tier effects
   * @param tierData - The tier data containing effects
   * @returns Speed rating (0-100 scale)
   */
  static calculateSpeedRating(tierData: any): number {
    let rating = 60; // Base speed rating

    if (!tierData || !tierData.effects) {
      return rating;
    }

    for (const effect of tierData.effects) {
      // Chain attacks are fast
      if (effect.type === 'chain_damage') {
        rating += effect.chainCount * 10; // Chain attacks = faster
      }

      // DoT effects mean less burst speed
      if (effect.type === 'damage_over_time') {
        rating += 5; // Slight bonus for sustained damage
      }

      // Spread damage is instant
      if (effect.type === 'spread_damage') {
        rating += 8;
      }
    }

    return Math.min(100, Math.round(rating)); // Cap at 100
  }

  /**
   * Calculate range rating from tier effects
   * @param tierData - The tier data containing effects
   * @returns Range rating (0-100 scale)
   */
  static calculateRangeRating(tierData: any): number {
    let rating = 60; // Base range

    if (!tierData || !tierData.effects) {
      return rating;
    }

    for (const effect of tierData.effects) {
      // Proximity reveal increases effective range
      if (effect.type === 'proximity_reveal') {
        rating += (effect.radius / 150) * 20; // Scale by radius
      }

      // Chain damage increases range
      if (effect.type === 'chain_damage') {
        rating += (effect.chainRadius / 100) * 15;
      }

      // Spread damage increases range
      if (effect.type === 'spread_damage') {
        rating += (effect.radius / 80) * 15;
      }

      // Ghost visibility represents range
      if (effect.type === 'ghost_visibility') {
        rating += (effect.value - 1.0) * 10;
      }
    }

    return Math.min(100, Math.round(rating)); // Cap at 100
  }

  /**
   * Calculate overall effectiveness rating
   * @param weapon - The weapon configuration
   * @param tier - Current tier level (1-indexed)
   * @returns Effectiveness rating (0-100 scale)
   */
  static calculateEffectivenessRating(weapon: WeaponConfig, tier: number): number {
    if (!weapon || !weapon.tiers) {
      return 50;
    }

    const tierData = weapon.tiers[tier - 1];
    if (!tierData) {
      return 50;
    }

    let effectiveCount = 0;
    let totalBonus = 0;

    // Count how many monster types this weapon is effective against
    for (const effect of tierData.effects) {
      if (effect.type === 'bonus_damage' && effect.target) {
        effectiveCount++;
        totalBonus += ((effect.value ?? 1.0) - 1.0) * 100;
      }

      if (effect.type === 'damage_over_time' && effect.target) {
        effectiveCount++;
        totalBonus += (effect.ticks ?? 0) * (effect.damagePerTick ?? 0) * 10;
      }

      if (effect.type === 'ghost_visibility') {
        effectiveCount++;
        totalBonus += ((effect.value ?? 1.0) - 1.0) * 20;
      }
    }

    // Base effectiveness
    let rating = 50;

    // Add bonus based on specialization
    if (effectiveCount > 0) {
      rating = 50 + (totalBonus / effectiveCount);
    }

    return Math.min(100, Math.round(rating)); // Cap at 100
  }

  /**
   * Get effectiveness value for a specific monster type
   * @param weapon - The weapon configuration
   * @param tier - Current tier level (1-indexed)
   * @param monsterType - The monster type to check effectiveness against
   * @returns Effectiveness value (0-100 scale)
   */
  static getEffectivenessValue(
    weapon: WeaponConfig,
    tier: number,
    monsterType: MonsterType,
  ): number {
    if (!weapon || !weapon.tiers) {
      return 50;
    }

    const tierData = weapon.tiers[tier - 1];
    if (!tierData) {
      return 50;
    }

    let effectiveness = 50; // Base 50% = 1.0x damage
    const monsterTypeStr = monsterType.toLowerCase();

    // Calculate from actual effects
    for (const effect of tierData.effects) {
      // Bonus damage effects
      if (effect.type === 'bonus_damage' && effect.target === monsterTypeStr) {
        // Convert multiplier to percentage (1.25 = 75%, 1.5 = 100%, 1.75 = 125%)
        effectiveness = 50 + ((effect.value ?? 1.0) - 1.0) * 100;
      }

      // Damage over time effects
      if (effect.type === 'damage_over_time' && effect.target === monsterTypeStr) {
        const totalDoTDamage = (effect.ticks ?? 0) * (effect.damagePerTick ?? 0);
        effectiveness += totalDoTDamage * 10; // Add DoT contribution
      }

      // Ghost visibility effects (makes ghosts easier to hit = more effective)
      if (effect.type === 'ghost_visibility' && monsterTypeStr === 'ghost') {
        effectiveness = 50 + ((effect.value ?? 1.0) - 1.0) * 25;
      }

      // Stun effects
      if (effect.type === 'stun' && effect.target === monsterTypeStr) {
        effectiveness += 15; // Stun adds effectiveness
      }

      // Slow effects (universal)
      if (effect.type === 'slow') {
        effectiveness += (1.0 - (effect.value ?? 1.0)) * 20; // 10% slow = +2% effectiveness
      }
    }

    return Math.min(100, Math.round(effectiveness)); // Cap at 100
  }

  /**
   * Get all stat values for a weapon at a given tier
   * @param weapon - The weapon configuration
   * @param tier - Current tier level (1-indexed)
   * @returns Array of stat calculations
   */
  static getAllStats(weapon: WeaponConfig, tier: number): StatCalculationResult[] {
    const tierData = weapon.tiers[tier - 1];

    return [
      {
        label: 'Damage',
        value: this.calculateDamageRating(tierData),
        max: 100,
      },
      {
        label: 'Speed',
        value: this.calculateSpeedRating(tierData),
        max: 100,
      },
      {
        label: 'Range',
        value: this.calculateRangeRating(tierData),
        max: 100,
      },
      {
        label: 'Effectiveness',
        value: this.calculateEffectivenessRating(weapon, tier),
        max: 100,
      },
    ];
  }

  /**
   * Get effectiveness against all monster types
   * @param weapon - The weapon configuration
   * @param tier - Current tier level (1-indexed)
   * @returns Array of effectiveness results
   */
  static getAllEffectiveness(
    weapon: WeaponConfig,
    tier: number,
  ): EffectivenessResult[] {
    return [
      {
        monsterType: MonsterType.ZOMBIE,
        effectiveness: this.getEffectivenessValue(weapon, tier, MonsterType.ZOMBIE),
      },
      {
        monsterType: MonsterType.VAMPIRE,
        effectiveness: this.getEffectivenessValue(weapon, tier, MonsterType.VAMPIRE),
      },
      {
        monsterType: MonsterType.GHOST,
        effectiveness: this.getEffectivenessValue(weapon, tier, MonsterType.GHOST),
      },
    ];
  }

  /**
   * Analyze tier effects and return summary
   * @param tierData - The tier data containing effects
   * @returns Analysis of tier effects
   */
  static analyzeTierEffects(tierData: any): TierEffectAnalysis {
    const analysis: TierEffectAnalysis = {
      hasBonusDamage: false,
      hasDamageOverTime: false,
      hasChainDamage: false,
      hasSpreadDamage: false,
      hasSlashWidth: false,
      hasProximityReveal: false,
      hasGhostVisibility: false,
      hasStun: false,
      hasSlow: false,
      targetTypes: [],
    };

    if (!tierData || !tierData.effects) {
      return analysis;
    }

    for (const effect of tierData.effects) {
      switch (effect.type) {
        case 'bonus_damage':
          analysis.hasBonusDamage = true;
          if (effect.target && !analysis.targetTypes.includes(effect.target)) {
            analysis.targetTypes.push(effect.target);
          }
          break;
        case 'damage_over_time':
          analysis.hasDamageOverTime = true;
          if (effect.target && !analysis.targetTypes.includes(effect.target)) {
            analysis.targetTypes.push(effect.target);
          }
          break;
        case 'chain_damage':
          analysis.hasChainDamage = true;
          break;
        case 'spread_damage':
          analysis.hasSpreadDamage = true;
          break;
        case 'slash_width':
          analysis.hasSlashWidth = true;
          break;
        case 'proximity_reveal':
          analysis.hasProximityReveal = true;
          break;
        case 'ghost_visibility':
          analysis.hasGhostVisibility = true;
          break;
        case 'stun':
          analysis.hasStun = true;
          if (effect.target && !analysis.targetTypes.includes(effect.target)) {
            analysis.targetTypes.push(effect.target);
          }
          break;
        case 'slow':
          analysis.hasSlow = true;
          break;
      }
    }

    return analysis;
  }

  /**
   * Check if weapon is effective against a specific monster type
   * @param weapon - The weapon configuration
   * @param tier - Current tier level (1-indexed)
   * @param monsterType - The monster type to check
   * @returns True if weapon has bonus against this monster type
   */
  static isEffectiveAgainst(
    weapon: WeaponConfig,
    tier: number,
    monsterType: MonsterType,
  ): boolean {
    const tierData = weapon.tiers[tier - 1];
    if (!tierData || !tierData.effects) {
      return false;
    }

    const monsterTypeStr = monsterType.toLowerCase();

    for (const effect of tierData.effects) {
      if (effect.type === 'bonus_damage' && effect.target === monsterTypeStr) {
        return true;
      }
      if (effect.type === 'damage_over_time' && effect.target === monsterTypeStr) {
        return true;
      }
      if (effect.type === 'stun' && effect.target === monsterTypeStr) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate upgrade cost for next tier
   * @param weapon - The weapon configuration
   * @param currentTier - Current tier level (1-indexed)
   * @returns Upgrade cost or 0 if max tier
   */
  static getUpgradeCost(weapon: WeaponConfig, currentTier: number): number {
    if (currentTier >= weapon.tiers.length) {
      return 0;
    }

    const nextTierData = weapon.tiers[currentTier];
    return nextTierData?.upgradeCost || 0;
  }

  /**
   * Check if weapon is at max tier
   * @param weapon - The weapon configuration
   * @param currentTier - Current tier level (1-indexed)
   * @returns True if at max tier
   */
  static isMaxTier(weapon: WeaponConfig, currentTier: number): boolean {
    return currentTier >= weapon.tiers.length;
  }
}
