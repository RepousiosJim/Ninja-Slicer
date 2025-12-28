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
import { MONSTER_HITBOX_RADIUS, MONSTER_SOULS, VILLAGER_PENALTY, SLASH_HITBOX_RADIUS } from '@config/constants';
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
    powerUps: PowerUp[]
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
        
        // Apply weapon effects
        if (this.weaponManager) {
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
        
        // Create visual feedback
        this.createHitEffect(monster.x, monster.y, isCritical);
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
   */
  private createHitEffect(x: number, y: number, isCritical: boolean = false): void {
    // Create flash effect
    this.hitFlashGraphics.clear();
    const color = isCritical ? 0xff0000 : 0xffffff;
    this.hitFlashGraphics.fillStyle(color, 0.5);
    this.hitFlashGraphics.fillCircle(x, y, 50);
    
    // Fade out quickly
    this.scene.tweens.add({
      targets: this.hitFlashGraphics,
      alpha: 0,
      duration: 50,
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
  }

  /**
   * Destroy slash system
   */
  destroy(): void {
    this.hitFlashGraphics.destroy();
  }
}
