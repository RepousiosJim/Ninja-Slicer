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
import {
  MONSTER_HITBOX_RADIUS,
  MONSTER_SOULS,
  VILLAGER_PENALTY,
  SLASH_HITBOX_RADIUS,
  SLASH_POWER_DAMAGE_MULTIPLIERS,
  SLASH_POWER_SCORE_MULTIPLIERS
} from '@config/constants';
import { SlashPowerLevel } from '@config/types';
import { lineIntersectsCircle } from '../utils/helpers';
import { EventBus } from '../utils/EventBus';
import { ComboSystem } from './ComboSystem';
import { PowerUpManager } from '../managers/PowerUpManager';
import { WeaponManager } from '../managers/WeaponManager';
import { UpgradeManager } from '../managers/UpgradeManager';
import { SlashEnergyManager } from '../managers/SlashEnergyManager';

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
  private energyManager: SlashEnergyManager | null = null;

  // Energy tracking
  private lastSlashDistance: number = 0;
  private currentEnergyEffectiveness: number = 1.0;

  // Power level tracking (updated each frame from SlashTrail)
  private currentPowerLevel: SlashPowerLevel = SlashPowerLevel.NONE;

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
   * Set energy manager reference
   */
  setEnergyManager(energyManager: SlashEnergyManager): void {
    this.energyManager = energyManager;
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
    powerUps: PowerUp[]
  ): void {
    // Only check collisions if slash is active
    if (!slashTrail.isActive()) {
      // Reset slash distance when not slashing
      this.lastSlashDistance = 0;
      // Reset power level when not slashing
      this.currentPowerLevel = SlashPowerLevel.NONE;
      return;
    }

    // Get the current power level from the slash trail
    this.currentPowerLevel = slashTrail.getPowerLevel();

    const slashPoints = slashTrail.getSlashPoints();

    // Calculate slash distance and consume energy
    const currentDistance = this.calculateSlashDistance(slashPoints);
    if (currentDistance > this.lastSlashDistance && this.energyManager) {
      const distanceDelta = currentDistance - this.lastSlashDistance;
      this.currentEnergyEffectiveness = this.energyManager.consumeEnergy(distanceDelta);
    }
    this.lastSlashDistance = currentDistance;

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
   * Calculate total distance of slash trail
   * @param slashPoints - Array of points in the slash trail
   * @returns Total distance in pixels
   */
  private calculateSlashDistance(slashPoints: Phaser.Math.Vector2[]): number {
    let distance = 0;

    for (let i = 1; i < slashPoints.length; i++) {
      const prevPoint = slashPoints[i - 1];
      const currentPoint = slashPoints[i];

      if (!prevPoint || !currentPoint) continue;

      const dx = currentPoint.x - prevPoint.x;
      const dy = currentPoint.y - prevPoint.y;
      distance += Math.sqrt(dx * dx + dy * dy);
    }

    return distance;
  }

  /**
   * Get current energy effectiveness multiplier
   * @returns Effectiveness multiplier from 0.3 to 1.0
   */
  getEnergyEffectiveness(): number {
    return this.currentEnergyEffectiveness;
  }

  /**
   * Check collisions with monsters
   */
  private checkMonsterCollisions(
    prevPoint: Phaser.Math.Vector2,
    currentPoint: Phaser.Math.Vector2,
    monsters: Monster[]
  ): void {
    for (const monster of monsters) {
      if (!monster.active || monster.getIsSliced()) {
        continue;
      }
      
      // Check if monster is on screen
      if (monster.y < -50 || monster.y > 800) {
        continue;
      }
      
      // Special check for ghosts - only sliceable when visible
      if (monster instanceof Ghost && !monster.isSliceable()) {
        continue;
      }
      
      // Check line-circle intersection
      if (this.checkCollision(prevPoint, currentPoint, monster)) {
        // Monster was hit
        monster.slice();
        this.monstersSliced++;
        
        // Get power damage multiplier for this slash
        const powerDamageMultiplier = SLASH_POWER_DAMAGE_MULTIPLIERS[
          this.currentPowerLevel as keyof typeof SLASH_POWER_DAMAGE_MULTIPLIERS
        ] || 1.0;

        // Apply weapon effects with power-enhanced damage
        if (this.weaponManager) {
          this.weaponManager.applyWeaponEffects(
            { position: { x: monster.x, y: monster.y } },
            {
              type: monster.getMonsterType(),
              position: { x: monster.x, y: monster.y },
              health: monster.getHealth(),
              applyDamage: (damage: number) => monster.applyDamage(damage * powerDamageMultiplier),
              applyBurn: (damage: number, duration: number) => monster.applyBurn(damage * powerDamageMultiplier, duration),
              applySlow: (multiplier: number, duration: number) => monster.applySlow(multiplier, duration),
              applyStun: (duration: number) => monster.applyStun(duration),
              setAlwaysVisible: (visible: boolean) => {
                if (monster instanceof Ghost) {
                  monster.setAlwaysVisible(visible);
                }
              },
            }
          );
        }
        
        // Calculate score with combo multiplier
        const basePoints = monster.getPoints();
        let multiplier = 1.0;

        if (this.comboSystem) {
          multiplier = this.comboSystem.getMultiplier();
          this.comboSystem.increment();
        }

        // Apply frenzy multiplier if active
        if (this.powerUpManager && this.powerUpManager.isFrenzyActive()) {
          multiplier *= 2;
        }

        // Apply score multiplier from upgrades
        if (this.upgradeManager) {
          const stats = this.upgradeManager.getPlayerStats();
          multiplier *= stats.scoreMultiplier;
        }

        // Apply energy effectiveness multiplier
        // Low energy reduces score earned
        multiplier *= this.currentEnergyEffectiveness;

        // Apply power level score multiplier
        // Charged slashes earn more score
        const powerScoreMultiplier = SLASH_POWER_SCORE_MULTIPLIERS[
          this.currentPowerLevel as keyof typeof SLASH_POWER_SCORE_MULTIPLIERS
        ] || 1.0;
        multiplier *= powerScoreMultiplier;

        // Check for critical hit
        let isCritical = false;
        if (this.upgradeManager) {
          const stats = this.upgradeManager.getPlayerStats();
          const critChance = stats.criticalHitChance;

          if (Math.random() < critChance) {
            isCritical = true;
            multiplier *= stats.criticalHitMultiplier;
          }
        }

        const finalScore = Math.floor(basePoints * multiplier);
        this.score += finalScore;
        
        // Calculate souls
        const monsterType = monster.getMonsterType();
        const baseSouls = MONSTER_SOULS[monsterType] || 5;
        let finalSouls: number = baseSouls;
        
        // Apply soul magnet if active
        if (this.powerUpManager && this.powerUpManager.isSoulMagnetActive()) {
          finalSouls = Math.floor(baseSouls * 1.5) as number;
        }
        
        this.souls += finalSouls;
        
        // Emit monster sliced event
        EventBus.emit('monster-sliced', {
          monsterType: monsterType,
          position: { x: monster.x, y: monster.y },
          points: finalScore,
          souls: finalSouls,
          isCritical: isCritical,
          comboCount: this.comboSystem ? this.comboSystem.getCombo() : 0,
          energyEffectiveness: this.currentEnergyEffectiveness,
          powerLevel: this.currentPowerLevel,
          powerDamageMultiplier: powerDamageMultiplier,
          powerScoreMultiplier: powerScoreMultiplier,
        });
        
        // Emit score updated event
        EventBus.emit('score-updated', {
          score: this.score,
          delta: finalScore,
        });
        
        // Emit souls updated event
        EventBus.emit('souls-updated', {
          souls: this.souls,
          delta: finalSouls,
        });
        
        // Create visual feedback with power level
        this.createHitEffect(monster.x, monster.y, isCritical, this.currentPowerLevel);
      }
    }
  }

  /**
   * Check collisions with villagers
   */
  private checkVillagerCollisions(
    prevPoint: Phaser.Math.Vector2,
    currentPoint: Phaser.Math.Vector2,
    villagers: Villager[]
  ): void {
    for (const villager of villagers) {
      if (!villager.active || villager.getIsSliced()) {
        continue;
      }
      
      // Check if villager is on screen
      if (villager.y < -50 || villager.y > 800) {
        continue;
      }
      
      // Check line-circle intersection
      if (this.checkVillagerCollision(prevPoint, currentPoint, villager)) {
        // Villager was hit
        villager.slice();
        this.villagersSliced++;
        
        // Check if shield is active
        if (this.powerUpManager && this.powerUpManager.isShieldActive()) {
          // Consume shield, no penalty
          this.powerUpManager.consumeShield();
          
          // Show shield consumed feedback
          this.createShieldConsumedEffect(villager.x, villager.y);
        } else {
          // Apply penalty
          this.score -= VILLAGER_PENALTY;
          
          // Reset combo
          if (this.comboSystem) {
            this.comboSystem.reset();
          }
          
          // Emit villager sliced event
          EventBus.emit('villager-sliced', {
            position: { x: villager.x, y: villager.y },
            penalty: VILLAGER_PENALTY,
          });
          
          // Emit score updated event
          EventBus.emit('score-updated', {
            score: this.score,
            delta: -VILLAGER_PENALTY,
          });
        }
      }
    }
  }

  /**
   * Check collisions with power-ups
   */
  private checkPowerUpCollisions(
    prevPoint: Phaser.Math.Vector2,
    currentPoint: Phaser.Math.Vector2,
    powerUps: PowerUp[]
  ): void {
    for (const powerUp of powerUps) {
      if (!powerUp.active || powerUp.getIsSliced()) {
        continue;
      }
      
      // Check if power-up is on screen
      if (powerUp.y < -50 || powerUp.y > 800) {
        continue;
      }
      
      // Check line-circle intersection
      if (this.checkPowerUpCollision(prevPoint, currentPoint, powerUp)) {
        // Power-up was hit
        powerUp.slice();
        this.powerUpsCollected++;
        
        // Activate power-up in manager
        if (this.powerUpManager) {
          this.powerUpManager.activatePowerUp(powerUp.getPowerUpType());
        }
        
        // Emit power-up collected event
        EventBus.emit('powerup-collected', {
          type: powerUp.getPowerUpType(),
        });
        
        // Create visual feedback
        this.createPowerUpEffect(powerUp.x, powerUp.y);
      }
    }
  }

  /**
   * Check if a line segment intersects with a monster's hitbox
   */
  private checkCollision(
    lineStart: Phaser.Math.Vector2,
    lineEnd: Phaser.Math.Vector2,
    monster: Monster
  ): boolean {
    const monsterType = monster.getMonsterType();
    const radius = MONSTER_HITBOX_RADIUS[monsterType] || 40;
    
    return lineIntersectsCircle(
      { x: lineStart.x, y: lineStart.y },
      { x: lineEnd.x, y: lineEnd.y },
      { x: monster.x, y: monster.y },
      radius
    );
  }

  /**
   * Check if a line segment intersects with a villager's hitbox
   */
  private checkVillagerCollision(
    lineStart: Phaser.Math.Vector2,
    lineEnd: Phaser.Math.Vector2,
    villager: Villager
  ): boolean {
    return lineIntersectsCircle(
      { x: lineStart.x, y: lineStart.y },
      { x: lineEnd.x, y: lineEnd.y },
      { x: villager.x, y: villager.y },
      35 // Villager hitbox radius
    );
  }

  /**
   * Check if a line segment intersects with a power-up's hitbox
   */
  private checkPowerUpCollision(
    lineStart: Phaser.Math.Vector2,
    lineEnd: Phaser.Math.Vector2,
    powerUp: PowerUp
  ): boolean {
    return lineIntersectsCircle(
      { x: lineStart.x, y: lineStart.y },
      { x: lineEnd.x, y: lineEnd.y },
      { x: powerUp.x, y: powerUp.y },
      30 // Power-up hitbox radius
    );
  }

  /**
   * Create visual effect when monster is hit
   * @param x - X position of the hit
   * @param y - Y position of the hit
   * @param isCritical - Whether this was a critical hit
   * @param powerLevel - The power level of the slash (0-3)
   */
  private createHitEffect(
    x: number,
    y: number,
    isCritical: boolean = false,
    powerLevel: SlashPowerLevel = SlashPowerLevel.NONE
  ): void {
    // Get power-based color and size
    const powerColors = {
      [SlashPowerLevel.NONE]: 0xffffff,
      [SlashPowerLevel.LOW]: 0xffff00,
      [SlashPowerLevel.MEDIUM]: 0xff8c00,
      [SlashPowerLevel.HIGH]: 0xff0000,
    };
    const baseColor = powerColors[powerLevel] || 0xffffff;

    // Size scales with power level
    const baseRadius = 50 + powerLevel * 15;

    // Create flash effect
    this.hitFlashGraphics.clear();
    const color = isCritical ? 0xff0000 : baseColor;
    this.hitFlashGraphics.fillStyle(color, 0.5 + powerLevel * 0.1);
    this.hitFlashGraphics.fillCircle(x, y, baseRadius);

    // Add outer ring for powered slashes
    if (powerLevel > SlashPowerLevel.NONE) {
      this.hitFlashGraphics.lineStyle(4, color, 0.7);
      this.hitFlashGraphics.strokeCircle(x, y, baseRadius + 10);
    }

    // Fade out quickly
    this.scene.tweens.add({
      targets: this.hitFlashGraphics,
      alpha: 0,
      duration: 50 + powerLevel * 20,
      onComplete: () => {
        this.hitFlashGraphics.clear();
      },
    });

    // Show critical hit text
    if (isCritical) {
      const critText = this.scene.add.text(
        x,
        y - 50,
        'CRITICAL!',
        {
          fontSize: '32px',
          color: '#ff0000',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 4,
        }
      );
      critText.setOrigin(0.5);

      // Animate text floating up and fading
      this.scene.tweens.add({
        targets: critText,
        y: y - 150,
        alpha: 0,
        duration: 800,
        ease: 'Quad.easeOut',
        onComplete: () => {
          critText.destroy();
        },
      });
    }

    // Show power level text for charged slashes
    if (powerLevel >= SlashPowerLevel.MEDIUM) {
      const powerNames = {
        [SlashPowerLevel.MEDIUM]: 'POWER!',
        [SlashPowerLevel.HIGH]: 'SUPER!',
      };
      const powerText = powerNames[powerLevel as SlashPowerLevel.MEDIUM | SlashPowerLevel.HIGH];

      if (powerText) {
        const powerTextObj = this.scene.add.text(
          x,
          isCritical ? y - 80 : y - 50,
          powerText,
          {
            fontSize: powerLevel === SlashPowerLevel.HIGH ? '28px' : '24px',
            color: powerLevel === SlashPowerLevel.HIGH ? '#ff4400' : '#ff8c00',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3,
          }
        );
        powerTextObj.setOrigin(0.5);

        // Animate text floating up and fading
        this.scene.tweens.add({
          targets: powerTextObj,
          y: (isCritical ? y - 80 : y - 50) - 80,
          alpha: 0,
          scale: 1.2,
          duration: 600,
          ease: 'Quad.easeOut',
          onComplete: () => {
            powerTextObj.destroy();
          },
        });
      }
    }
  }

  /**
   * Create visual effect when shield is consumed
   */
  private createShieldConsumedEffect(x: number, y: number): void {
    const shieldText = this.scene.add.text(
      x,
      y - 50,
      'SHIELDED!',
      {
        fontSize: '32px',
        color: '#00ff00',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      }
    );
    shieldText.setOrigin(0.5);

    // Animate text floating up and fading
    this.scene.tweens.add({
      targets: shieldText,
      y: y - 150,
      alpha: 0,
      duration: 800,
      ease: 'Quad.easeOut',
      onComplete: () => {
        shieldText.destroy();
      },
    });
  }

  /**
   * Create visual effect when power-up is collected
   */
  private createPowerUpEffect(x: number, y: number): void {
    // Create burst effect
    const burst = this.scene.add.graphics();
    burst.fillStyle(0xffff00, 0.8);
    burst.fillCircle(x, y, 60);
    
    // Fade out quickly
    this.scene.tweens.add({
      targets: burst,
      alpha: 0,
      scale: 2,
      duration: 200,
      onComplete: () => {
        burst.destroy();
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

    // Reset energy tracking
    this.lastSlashDistance = 0;
    this.currentEnergyEffectiveness = 1.0;

    // Reset power level tracking
    this.currentPowerLevel = SlashPowerLevel.NONE;
  }

  /**
   * Get current power level
   * @returns Current slash power level (0-3)
   */
  getCurrentPowerLevel(): SlashPowerLevel {
    return this.currentPowerLevel;
  }

  /**
   * Destroy slash system
   */
  destroy(): void {
    this.hitFlashGraphics.destroy();
  }
}
