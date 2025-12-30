/**
 * SlashSystem
 * 
 * Handles slash collision detection with monsters, villagers, and power-ups.
 * Uses line-circle intersection for accurate hit detection.
 */

import Phaser from 'phaser';
import { SlashTrail } from '../entities/SlashTrail';
import { Monster } from '../entities/Monster';
import { Villager } from '../entities/Villager';
import { PowerUp } from '../entities/PowerUp';
import { Ghost } from '../entities/Ghost';
import { MonsterType } from '@config/types';
import { MONSTER_HITBOX_RADIUS, MONSTER_SOULS, VILLAGER_PENALTY, SLASH_HITBOX_RADIUS, VILLAGER_HITBOX_RADIUS, POWERUP_HITBOX_RADIUS, ENTITY_BOUNDS, EFFECT_DURATIONS, EFFECT_SIZES } from '@config/constants';
import { lineIntersectsCircle } from '../utils/helpers';
import { EventBus } from '../utils/EventBus';
import { ComboSystem } from './ComboSystem';
import { PowerUpManager } from '../managers/PowerUpManager';
import { WeaponManager } from '../managers/WeaponManager';
import { UpgradeManager } from '../managers/UpgradeManager';

export class SlashSystem {
  private scene: Phaser.Scene;
  private score: number = 0;
  private souls: number = 0;
  private monstersSliced: number = 0;
  private villagersSliced: number = 0;
  private powerUpsCollected: number = 0;
  private hitFlashGraphics: Phaser.GameObjects.Graphics;
  private comboSystem: ComboSystem | null = null;
  private powerUpManager: PowerUpManager | null = null;
  private weaponManager: WeaponManager | null = null;
  private upgradeManager: UpgradeManager | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.hitFlashGraphics = scene.add.graphics();
  }

  /**
   * Set combo system reference
   */
  setComboSystem(comboSystem: ComboSystem): void {
    this.comboSystem = comboSystem;
  }

  /**
   * Set power-up manager reference
   */
  setPowerUpManager(powerUpManager: PowerUpManager): void {
    this.powerUpManager = powerUpManager;
  }

  /**
   * Set weapon manager reference
   */
  setWeaponManager(weaponManager: WeaponManager): void {
    this.weaponManager = weaponManager;
  }

  /**
   * Set upgrade manager reference
   */
  setUpgradeManager(upgradeManager: UpgradeManager): void {
    this.upgradeManager = upgradeManager;
  }

  /**
   * Get slash width with upgrade bonus
   */
  getSlashWidth(): number {
    let width = SLASH_HITBOX_RADIUS;
    
    if (this.upgradeManager) {
      const stats = this.upgradeManager.getPlayerStats();
      width *= stats.slashWidthMultiplier;
    }
    
    return width;
  }

  /**
   * Update slash system and check for collisions
   * @param slashTrail - The slash trail to check
   * @param monsters - Array of active monsters
   * @param villagers - Array of active villagers
   * @param powerUps - Array of active power-ups
   */
  update(
    slashTrail: SlashTrail,
    monsters: Monster[],
    villagers: Villager[],
    powerUps: PowerUp[],
  ): void {
    // Only check collisions if slash is active
    if (!slashTrail.isActive()) {
      return;
    }

    const slashPoints = slashTrail.getSlashPoints();
    
    // Check each line segment in slash trail
    for (let i = 1; i < slashPoints.length; i++) {
      const prevPoint = slashPoints[i - 1];
      const currentPoint = slashPoints[i];
      
      if (!prevPoint || !currentPoint) continue;
      
      // Check collision with monsters
      this.checkMonsterCollisions(prevPoint, currentPoint, monsters);
      
      // Check collision with villagers
      this.checkVillagerCollisions(prevPoint, currentPoint, villagers);
      
      // Check collision with power-ups
      this.checkPowerUpCollisions(prevPoint, currentPoint, powerUps);
    }
  }

  /**
   * Check collisions with monsters
   */
  private checkMonsterCollisions(
    prevPoint: Phaser.Math.Vector2,
    currentPoint: Phaser.Math.Vector2,
    monsters: Monster[],
  ): void {
    for (const monster of monsters) {
      if (!this.canSliceMonster(monster)) continue;
      if (!this.checkCollision(prevPoint, currentPoint, monster)) continue;
      
      this.handleMonsterHit(monster);
    }
  }

  /**
   * Check if monster can be sliced
   */
  private canSliceMonster(monster: Monster): boolean {
    if (!monster.active || monster.getIsSliced()) return false;
    if (monster.y < ENTITY_BOUNDS.top || monster.y > ENTITY_BOUNDS.bottom) return false;
    if (monster instanceof Ghost && !monster.isSliceable()) return false;
    return true;
  }

  /**
   * Handle monster being hit
   */
  private handleMonsterHit(monster: Monster): void {
    monster.slice();
    this.monstersSliced++;
    
    this.applyWeaponEffects(monster);
    const { finalScore, finalSouls, isCritical } = this.calculateMonsterScore(monster);
    
    this.score += finalScore;
    this.souls += finalSouls;
    
    this.emitMonsterEvents(monster, finalScore, finalSouls, isCritical);
    this.createHitEffect(monster.x, monster.y, isCritical);
  }

  /**
   * Apply weapon effects to monster
   */
  private applyWeaponEffects(monster: Monster): void {
    if (!this.weaponManager) return;
    
    this.weaponManager.applyWeaponEffects(
      { position: { x: monster.x, y: monster.y } },
      {
        type: monster.getMonsterType(),
        position: { x: monster.x, y: monster.y },
        health: monster.getHealth(),
        applyDamage: (damage: number) => monster.applyDamage(damage),
        applyBurn: (damage: number, duration: number) => monster.applyBurn(damage, duration),
        applySlow: (multiplier: number, duration: number) => monster.applySlow(multiplier, duration),
        applyStun: (duration: number) => monster.applyStun(duration),
        setAlwaysVisible: (visible: boolean) => {
          if (monster instanceof Ghost) {
            monster.setAlwaysVisible(visible);
          }
        },
      },
    );
  }

  /**
   * Calculate score and souls for monster
   */
  private calculateMonsterScore(monster: Monster): {
    finalScore: number;
    finalSouls: number;
    isCritical: boolean;
  } {
    const basePoints = monster.getPoints();
    let multiplier = 1.0;
    
    // Combo multiplier
    if (this.comboSystem) {
      multiplier = this.comboSystem.getMultiplier();
      this.comboSystem.increment();
    }
    
    // Frenzy multiplier
    if (this.powerUpManager && this.powerUpManager.isFrenzyActive()) {
      multiplier *= 2;
    }
    
    // Upgrade multiplier
    if (this.upgradeManager) {
      const stats = this.upgradeManager.getPlayerStats();
      multiplier *= stats.scoreMultiplier;
    }
    
    // Critical hit
    let isCritical = false;
    if (this.upgradeManager) {
      const stats = this.upgradeManager.getPlayerStats();
      if (Math.random() < stats.criticalHitChance) {
        isCritical = true;
        multiplier *= stats.criticalHitMultiplier;
      }
    }
    
    const finalScore = Math.floor(basePoints * multiplier);
    
    // Souls calculation
    const monsterType = monster.getMonsterType();
    const baseSouls = MONSTER_SOULS[monsterType] || 5;
    const finalSouls = this.powerUpManager && this.powerUpManager.isSoulMagnetActive()
      ? Math.floor(baseSouls * 1.5)
      : baseSouls;
    
    return { finalScore, finalSouls, isCritical };
  }

  /**
   * Emit monster-related events
   */
  private emitMonsterEvents(monster: Monster, finalScore: number, finalSouls: number, isCritical: boolean): void {
    const monsterType = monster.getMonsterType();
    
    EventBus.emit('monster-sliced', {
      monsterType,
      position: { x: monster.x, y: monster.y },
      points: finalScore,
      souls: finalSouls,
      isCritical,
      comboCount: this.comboSystem ? this.comboSystem.getCombo() : 0,
    });
    
    EventBus.emit('score-updated', {
      score: this.score,
      delta: finalScore,
    });
    
    EventBus.emit('souls-updated', {
      souls: this.souls,
      delta: finalSouls,
    });
  }

  /**
   * Check collisions with villagers
   */
  private checkVillagerCollisions(
    prevPoint: Phaser.Math.Vector2,
    currentPoint: Phaser.Math.Vector2,
    villagers: Villager[],
  ): void {
    for (const villager of villagers) {
      if (!this.canSliceVillager(villager)) continue;
      if (!this.checkVillagerCollision(prevPoint, currentPoint, villager)) continue;
      
      this.handleVillagerHit(villager);
    }
  }

  /**
   * Check if villager can be sliced
   */
  private canSliceVillager(villager: Villager): boolean {
    if (!villager.active || villager.getIsSliced()) return false;
    if (villager.y < ENTITY_BOUNDS.top || villager.y > ENTITY_BOUNDS.bottom) return false;
    return true;
  }

  /**
   * Handle villager being hit
   */
  private handleVillagerHit(villager: Villager): void {
    villager.slice();
    this.villagersSliced++;
    
    if (this.powerUpManager && this.powerUpManager.isShieldActive()) {
      this.powerUpManager.consumeShield();
      this.createShieldConsumedEffect(villager.x, villager.y);
    } else {
      this.applyVillagerPenalty(villager);
    }
  }

  /**
   * Apply villager penalty
   */
  private applyVillagerPenalty(villager: Villager): void {
    this.score -= VILLAGER_PENALTY;
    
    if (this.comboSystem) {
      this.comboSystem.reset();
    }
    
    EventBus.emit('villager-sliced', {
      position: { x: villager.x, y: villager.y },
      penalty: VILLAGER_PENALTY,
    });
    
    EventBus.emit('score-updated', {
      score: this.score,
      delta: -VILLAGER_PENALTY,
    });
  }

  /**
   * Check collisions with power-ups
   */
  private checkPowerUpCollisions(
    prevPoint: Phaser.Math.Vector2,
    currentPoint: Phaser.Math.Vector2,
    powerUps: PowerUp[],
  ): void {
    for (const powerUp of powerUps) {
      if (!this.canSlicePowerUp(powerUp)) continue;
      if (!this.checkPowerUpCollision(prevPoint, currentPoint, powerUp)) continue;
      
      this.handlePowerUpHit(powerUp);
    }
  }

  /**
   * Check if power-up can be sliced
   */
  private canSlicePowerUp(powerUp: PowerUp): boolean {
    if (!powerUp.active || powerUp.getIsSliced()) return false;
    if (powerUp.y < -50 || powerUp.y > 800) return false;
    return true;
  }

  /**
   * Handle power-up being hit
   */
  private handlePowerUpHit(powerUp: PowerUp): void {
    powerUp.slice();
    this.powerUpsCollected++;
    
    if (this.powerUpManager) {
      this.powerUpManager.activatePowerUp(powerUp.getPowerUpType());
    }
    
    EventBus.emit('powerup-collected', {
      type: powerUp.getPowerUpType(),
    });
    
    this.createPowerUpEffect(powerUp.x, powerUp.y);
  }

  /**
   * Check if a line segment intersects with a monster's hitbox
   */
  private checkCollision(
    lineStart: Phaser.Math.Vector2,
    lineEnd: Phaser.Math.Vector2,
    monster: Monster,
  ): boolean {
    const monsterType = monster.getMonsterType();
    const radius = MONSTER_HITBOX_RADIUS[monsterType] || 40;
    
    return lineIntersectsCircle(
      { x: lineStart.x, y: lineStart.y },
      { x: lineEnd.x, y: lineEnd.y },
      { x: monster.x, y: monster.y },
      radius,
    );
  }

  /**
   * Check if a line segment intersects with a villager's hitbox
   */
  private checkVillagerCollision(
    lineStart: Phaser.Math.Vector2,
    lineEnd: Phaser.Math.Vector2,
    villager: Villager,
  ): boolean {
    return lineIntersectsCircle(
      { x: lineStart.x, y: lineStart.y },
      { x: lineEnd.x, y: lineEnd.y },
      { x: villager.x, y: villager.y },
      VILLAGER_HITBOX_RADIUS,
    );
  }

  /**
   * Check if a line segment intersects with a power-up's hitbox
   */
  private checkPowerUpCollision(
    lineStart: Phaser.Math.Vector2,
    lineEnd: Phaser.Math.Vector2,
    powerUp: PowerUp,
  ): boolean {
    return lineIntersectsCircle(
      { x: lineStart.x, y: lineStart.y },
      { x: lineEnd.x, y: lineEnd.y },
      { x: powerUp.x, y: powerUp.y },
      POWERUP_HITBOX_RADIUS,
    );
  }

  /**
   * Create visual effect when monster is hit
   */
  private createHitEffect(x: number, y: number, isCritical: boolean = false): void {
    // Create flash effect
    this.hitFlashGraphics.clear();
    const color = isCritical ? 0xff0000 : 0xffffff;
    this.hitFlashGraphics.fillStyle(color, 0.5);
    this.hitFlashGraphics.fillCircle(x, y, EFFECT_SIZES.hitFlashRadius);
    
    // Fade out quickly
    this.scene.tweens.add({
      targets: this.hitFlashGraphics,
      alpha: 0,
      duration: EFFECT_DURATIONS.flashFade,
      onComplete: () => {
        this.hitFlashGraphics.clear();
      },
    });

    // Show critical hit text
    if (isCritical) {
      this.createFloatingText(x, y, 'CRITICAL!', '#ff0000', 32);
    }
  }

  /**
   * Create visual effect when shield is consumed
   */
  private createShieldConsumedEffect(x: number, y: number): void {
    this.createFloatingText(x, y, 'SHIELDED!', '#00ff00', 32);
  }

  /**
   * Create visual effect when power-up is collected
   */
  private createPowerUpEffect(x: number, y: number): void {
    // Create burst effect
    const burst = this.scene.add.graphics();
    burst.fillStyle(0xffff00, 0.8);
    burst.fillCircle(x, y, EFFECT_SIZES.burstRadius);
    
    // Fade out quickly
    this.scene.tweens.add({
      targets: burst,
      alpha: 0,
      scale: 2,
      duration: EFFECT_DURATIONS.burstFade,
      onComplete: () => {
        burst.destroy();
      },
    });
  }

  /**
   * Create floating text animation
   */
  private createFloatingText(
    x: number,
    y: number,
    text: string,
    color: string,
    fontSize: number = 32,
    duration: number = EFFECT_DURATIONS.textFloat,
  ): void {
    const textObj = this.scene.add.text(
      x,
      y - EFFECT_SIZES.textOffset,
      text,
      {
        fontSize: `${fontSize}px`,
        color,
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      },
    );
    textObj.setOrigin(0.5);

    // Animate text floating up and fading
    this.scene.tweens.add({
      targets: textObj,
      y: y - EFFECT_SIZES.textFloatDistance,
      alpha: 0,
      duration,
      ease: 'Quad.easeOut',
      onComplete: () => {
        textObj.destroy();
      },
    });
  }

  /**
   * Get current score
   */
  getScore(): number {
    return this.score;
  }

  /**
   * Get current souls
   */
  getSouls(): number {
    return this.souls;
  }

  /**
   * Get number of monsters sliced
   */
  getMonstersSliced(): number {
    return this.monstersSliced;
  }

  /**
   * Get number of villagers sliced
   */
  getVillagersSliced(): number {
    return this.villagersSliced;
  }

  /**
   * Get number of power-ups collected
   */
  getPowerUpsCollected(): number {
    return this.powerUpsCollected;
  }

  /**
   * Reset score and stats
   */
  resetScore(): void {
    this.score = 0;
    this.souls = 0;
    this.monstersSliced = 0;
    this.villagersSliced = 0;
    this.powerUpsCollected = 0;
  }

  /**
   * Destroy slash system
   */
  destroy(): void {
    this.hitFlashGraphics.destroy();
  }
}
