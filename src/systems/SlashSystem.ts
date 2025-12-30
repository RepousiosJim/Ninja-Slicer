/**
 * SlashSystem
 *
 * Handles slash collision detection with monsters, villagers, and power-ups.
 * Uses line-circle intersection for accurate hit detection.
 * Includes pattern buffer and timeout logic for slash pattern recognition.
 */

import Phaser from 'phaser';
import { SlashTrail } from '../entities/SlashTrail';
import { Monster } from '../entities/Monster';
import { Villager } from '../entities/Villager';
import { PowerUp } from '../entities/PowerUp';
import { Ghost } from '../entities/Ghost';
import { MonsterType, SlashPowerLevel, SlashPatternType, SlashPatternPoint, SlashPatternResult } from '@config/types';
import {
  MONSTER_HITBOX_RADIUS,
  MONSTER_SOULS,
  VILLAGER_PENALTY,
  SLASH_HITBOX_RADIUS,
  SLASH_POWER_DAMAGE_MULTIPLIERS,
  SLASH_POWER_SCORE_MULTIPLIERS,
  SLASH_PATTERN,
  SLASH_PATTERN_BONUSES,
  SLASH_PATTERN_VISUAL
} from '@config/constants';
import { lineIntersectsCircle, detectSlashPattern, isValidPattern, calculateCentroid } from '../utils/helpers';
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

  // Pattern recognition tracking (similar to ComboSystem timer pattern)
  private patternBuffer: SlashPatternPoint[] = [];
  private patternTimer: number = 0;
  private isPatternBuffering: boolean = false;
  private lastDetectedPattern: SlashPatternResult | null = null;
  private wasSlashActive: boolean = false;

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
   * @param delta - Time since last update (ms), used for pattern timeout
   */
  update(
    slashTrail: SlashTrail,
    monsters: Monster[],
    villagers: Villager[],
    powerUps: PowerUp[],
    delta: number = 16.67 // Default to ~60fps if not provided
  ): void {
    const isSlashActive = slashTrail.isActive();

    // Handle pattern detection when slash ends (transition from active to inactive)
    if (this.wasSlashActive && !isSlashActive) {
      this.onSlashEnd();
    }
    this.wasSlashActive = isSlashActive;

    // Update pattern timer for timeout (similar to ComboSystem.update)
    if (this.isPatternBuffering) {
      this.patternTimer -= delta;

      // Reset partial patterns if timeout expires
      if (this.patternTimer <= 0) {
        this.resetPatternBuffer();
        EventBus.emit('slash-pattern-failed', {
          reason: 'timeout',
        });
      }
    }

    // Only check collisions if slash is active
    if (!isSlashActive) {
      // Reset slash distance when not slashing
      this.lastSlashDistance = 0;
      // Reset power level when not slashing
      this.currentPowerLevel = SlashPowerLevel.NONE;
      return;
    }

    // Get the current power level from the slash trail
    this.currentPowerLevel = slashTrail.getPowerLevel();

    const slashPoints = slashTrail.getSlashPoints();

    // Buffer points for pattern recognition
    this.bufferSlashPoints(slashPoints);

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

  // =============================================================================
  // PATTERN RECOGNITION
  // =============================================================================

  /**
   * Buffer slash points for pattern recognition
   * Converts Phaser.Math.Vector2 points to SlashPatternPoint format
   * @param slashPoints - Array of slash trail points
   */
  private bufferSlashPoints(slashPoints: Phaser.Math.Vector2[]): void {
    const currentTime = Date.now();

    // Start pattern buffering if not already active
    if (!this.isPatternBuffering && slashPoints.length > 0) {
      this.isPatternBuffering = true;
      this.patternTimer = SLASH_PATTERN.patternTimeout * 1000; // Convert to ms
      this.patternBuffer = [];

      // Emit pattern started event
      EventBus.emit('slash-pattern-started', {
        timestamp: currentTime,
      });
    }

    // Reset timer on each new point (similar to ComboSystem.increment)
    if (slashPoints.length > this.patternBuffer.length) {
      this.patternTimer = SLASH_PATTERN.patternTimeout * 1000;
    }

    // Update pattern buffer with current points
    this.patternBuffer = slashPoints.map((point) => ({
      x: point.x,
      y: point.y,
      timestamp: currentTime,
    }));
  }

  /**
   * Called when slash ends - attempts to detect patterns
   * Similar to how ComboSystem handles state transitions
   */
  private onSlashEnd(): void {
    if (!this.isPatternBuffering || this.patternBuffer.length < SLASH_PATTERN.minPointsForDetection) {
      this.resetPatternBuffer();
      return;
    }

    // Attempt pattern detection
    const result = detectSlashPattern(this.patternBuffer);

    if (isValidPattern(result, 0.5)) {
      this.lastDetectedPattern = result;

      // Get pattern center for visual effects
      const center = result.center || calculateCentroid(this.patternBuffer);

      // Get pattern bonuses
      const bonuses = SLASH_PATTERN_BONUSES[result.pattern] || SLASH_PATTERN_BONUSES.none;

      // Apply pattern bonus to score
      const bonusScore = bonuses.bonusScore || 0;
      this.score += bonusScore;

      // Create visual confirmation effect for the detected pattern
      this.createPatternConfirmationEffect(
        result.pattern,
        center,
        result.radius,
        result.points
      );

      // Emit pattern detected event
      EventBus.emit('slash-pattern-detected', {
        pattern: result.pattern,
        confidence: result.confidence,
        position: center,
        bonusScore: bonusScore,
        bonusMultiplier: bonuses.scoreMultiplier,
      });

      // Emit score updated event if bonus was applied
      if (bonusScore > 0) {
        EventBus.emit('score-updated', {
          score: this.score,
          delta: bonusScore,
        });
      }
    }

    this.resetPatternBuffer();
  }

  /**
   * Reset pattern buffer and timer
   * Similar to ComboSystem.reset()
   */
  private resetPatternBuffer(): void {
    this.patternBuffer = [];
    this.patternTimer = 0;
    this.isPatternBuffering = false;
    this.lastDetectedPattern = null;
  }

  /**
   * Get the last detected pattern result
   * @returns The last detected pattern or null if none
   */
  getLastDetectedPattern(): SlashPatternResult | null {
    return this.lastDetectedPattern;
  }

  /**
   * Check if pattern buffering is active
   * @returns True if currently buffering slash points for pattern detection
   */
  isPatternDetectionActive(): boolean {
    return this.isPatternBuffering;
  }

  /**
   * Get remaining pattern detection time in seconds
   * Similar to ComboSystem.getRemainingTime()
   */
  getPatternRemainingTime(): number {
    return Math.max(0, this.patternTimer / 1000);
  }

  /**
   * Get current pattern buffer point count
   */
  getPatternBufferSize(): number {
    return this.patternBuffer.length;
  }

  /**
   * Check if pattern buffer has enough points for detection
   */
  hasEnoughPointsForPattern(): boolean {
    return this.patternBuffer.length >= SLASH_PATTERN.minPointsForDetection;
  }

  // =============================================================================
  // COLLISION DETECTION
  // =============================================================================

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

  // =============================================================================
  // PATTERN VISUAL EFFECTS
  // =============================================================================

  /**
   * Create visual confirmation effect for detected patterns
   * Dispatches to pattern-specific effect methods
   * @param pattern - The detected pattern type
   * @param center - Center position for the effect
   * @param radius - Optional radius for circle patterns
   * @param points - Pattern points for line-based effects
   */
  private createPatternConfirmationEffect(
    pattern: SlashPatternType,
    center: { x: number; y: number },
    radius?: number,
    points?: SlashPatternPoint[]
  ): void {
    switch (pattern) {
      case SlashPatternType.CIRCLE:
        this.createCirclePatternEffect(center, radius || 80);
        break;
      case SlashPatternType.ZIGZAG:
        this.createZigzagPatternEffect(center, points || []);
        break;
      case SlashPatternType.STRAIGHT:
        this.createStraightPatternEffect(center, points || []);
        break;
    }
  }

  /**
   * Create visual effect for circle pattern detection
   * Shows expanding rings with golden glow effect
   * @param center - Center position of the circle
   * @param radius - Radius of the detected circle
   */
  private createCirclePatternEffect(
    center: { x: number; y: number },
    radius: number
  ): void {
    const graphics = this.scene.add.graphics();
    const duration = SLASH_PATTERN_VISUAL.confirmationDuration * 1000;

    // Create golden circle flash effect
    const circleColor = 0xffd700; // Gold
    const flashCount = SLASH_PATTERN_VISUAL.flashCount;
    const flashInterval = SLASH_PATTERN_VISUAL.flashInterval * 1000;

    // Initial circle fill
    graphics.fillStyle(circleColor, 0.3);
    graphics.fillCircle(center.x, center.y, radius);
    graphics.lineStyle(4, circleColor, 1);
    graphics.strokeCircle(center.x, center.y, radius);

    // Create flash effect
    let flashesRemaining = flashCount;
    const flashTimer = this.scene.time.addEvent({
      delay: flashInterval,
      repeat: flashCount - 1,
      callback: () => {
        flashesRemaining--;
        const flashAlpha = 0.3 + (flashesRemaining / flashCount) * 0.4;
        graphics.clear();
        graphics.fillStyle(circleColor, flashAlpha);
        graphics.fillCircle(center.x, center.y, radius);
        graphics.lineStyle(4, circleColor, 1);
        graphics.strokeCircle(center.x, center.y, radius);
      },
    });

    // Create expanding ring effect
    const ringGraphics = this.scene.add.graphics();
    ringGraphics.lineStyle(3, circleColor, 0.8);
    ringGraphics.strokeCircle(center.x, center.y, radius);

    // Animate ring expanding outward
    this.scene.tweens.add({
      targets: { scale: 1 },
      scale: 1.8,
      duration: duration,
      ease: 'Quad.easeOut',
      onUpdate: (tween) => {
        const scale = tween.getValue();
        const alpha = 1 - (scale - 1) / 0.8;
        ringGraphics.clear();
        ringGraphics.lineStyle(3, circleColor, Math.max(0, alpha * 0.8));
        ringGraphics.strokeCircle(center.x, center.y, radius * scale);
      },
      onComplete: () => {
        ringGraphics.destroy();
      },
    });

    // Create pattern label
    this.createPatternLabel(center.x, center.y - radius - 30, 'CIRCLE!', circleColor);

    // Fade out main graphics
    this.scene.tweens.add({
      targets: graphics,
      alpha: 0,
      duration: duration,
      onComplete: () => {
        flashTimer.destroy();
        graphics.destroy();
      },
    });
  }

  /**
   * Create visual effect for zigzag pattern detection
   * Shows lightning bolt style sparks along the path
   * @param center - Center position of the zigzag
   * @param points - Points that make up the zigzag pattern
   */
  private createZigzagPatternEffect(
    center: { x: number; y: number },
    points: SlashPatternPoint[]
  ): void {
    const graphics = this.scene.add.graphics();
    const duration = SLASH_PATTERN_VISUAL.confirmationDuration * 1000;

    // Lightning yellow/electric blue color
    const zigzagColor = 0x00ffff; // Cyan/electric
    const accentColor = 0xffff00; // Yellow spark

    // Draw the zigzag path with electric effect
    if (points.length >= 2) {
      // Main zigzag path
      graphics.lineStyle(5, zigzagColor, 0.9);
      graphics.beginPath();
      graphics.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        graphics.lineTo(points[i].x, points[i].y);
      }
      graphics.strokePath();

      // Accent glow
      graphics.lineStyle(8, accentColor, 0.4);
      graphics.beginPath();
      graphics.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        graphics.lineTo(points[i].x, points[i].y);
      }
      graphics.strokePath();

      // Add spark points at direction changes
      graphics.fillStyle(0xffffff, 1);
      for (let i = 1; i < points.length - 1; i++) {
        graphics.fillCircle(points[i].x, points[i].y, 6);
      }
    }

    // Create flash effect
    const flashCount = SLASH_PATTERN_VISUAL.flashCount;
    const flashInterval = SLASH_PATTERN_VISUAL.flashInterval * 1000;

    let flashesRemaining = flashCount;
    const flashTimer = this.scene.time.addEvent({
      delay: flashInterval,
      repeat: flashCount - 1,
      callback: () => {
        flashesRemaining--;
        const flashAlpha = 0.4 + (flashesRemaining / flashCount) * 0.5;
        graphics.alpha = flashAlpha + 0.5;
      },
    });

    // Create spark particles at points
    for (const point of points) {
      if (Math.random() > 0.5) {
        this.createSparkEffect(point.x, point.y, accentColor);
      }
    }

    // Create pattern label
    this.createPatternLabel(center.x, center.y - 50, 'ZIGZAG!', zigzagColor);

    // Fade out with electric flicker
    this.scene.tweens.add({
      targets: graphics,
      alpha: 0,
      duration: duration,
      ease: 'Stepped',
      onComplete: () => {
        flashTimer.destroy();
        graphics.destroy();
      },
    });
  }

  /**
   * Create visual effect for straight line pattern detection
   * Shows a powerful piercing beam effect
   * @param center - Center position of the line
   * @param points - Points that make up the straight line
   */
  private createStraightPatternEffect(
    center: { x: number; y: number },
    points: SlashPatternPoint[]
  ): void {
    const graphics = this.scene.add.graphics();
    const duration = SLASH_PATTERN_VISUAL.confirmationDuration * 1000;

    // Red/crimson for piercing strike
    const lineColor = 0xff4444; // Crimson red
    const glowColor = 0xff8888; // Light red glow

    if (points.length >= 2) {
      const startPoint = points[0];
      const endPoint = points[points.length - 1];

      // Calculate line extension for dramatic effect
      const dx = endPoint.x - startPoint.x;
      const dy = endPoint.y - startPoint.y;
      const extendFactor = 1.3;

      const extendedEndX = startPoint.x + dx * extendFactor;
      const extendedEndY = startPoint.y + dy * extendFactor;
      const extendedStartX = startPoint.x - dx * 0.3;
      const extendedStartY = startPoint.y - dy * 0.3;

      // Outer glow
      graphics.lineStyle(12, glowColor, 0.3);
      graphics.lineBetween(extendedStartX, extendedStartY, extendedEndX, extendedEndY);

      // Main line
      graphics.lineStyle(6, lineColor, 0.9);
      graphics.lineBetween(extendedStartX, extendedStartY, extendedEndX, extendedEndY);

      // Core bright line
      graphics.lineStyle(2, 0xffffff, 1);
      graphics.lineBetween(startPoint.x, startPoint.y, endPoint.x, endPoint.y);

      // Arrow head effect at end
      const arrowSize = 15;
      const angle = Math.atan2(dy, dx);
      const arrowAngle = Math.PI / 6;

      graphics.fillStyle(lineColor, 1);
      graphics.beginPath();
      graphics.moveTo(extendedEndX, extendedEndY);
      graphics.lineTo(
        extendedEndX - arrowSize * Math.cos(angle - arrowAngle),
        extendedEndY - arrowSize * Math.sin(angle - arrowAngle)
      );
      graphics.lineTo(
        extendedEndX - arrowSize * Math.cos(angle + arrowAngle),
        extendedEndY - arrowSize * Math.sin(angle + arrowAngle)
      );
      graphics.closePath();
      graphics.fillPath();
    }

    // Create flash effect
    const flashCount = SLASH_PATTERN_VISUAL.flashCount;
    const flashInterval = SLASH_PATTERN_VISUAL.flashInterval * 1000;

    let flashesRemaining = flashCount;
    const flashTimer = this.scene.time.addEvent({
      delay: flashInterval,
      repeat: flashCount - 1,
      callback: () => {
        flashesRemaining--;
        graphics.alpha = 0.5 + (flashesRemaining / flashCount) * 0.5;
      },
    });

    // Create pattern label
    this.createPatternLabel(center.x, center.y - 40, 'PIERCING!', lineColor);

    // Fade out
    this.scene.tweens.add({
      targets: graphics,
      alpha: 0,
      duration: duration,
      ease: 'Quad.easeIn',
      onComplete: () => {
        flashTimer.destroy();
        graphics.destroy();
      },
    });
  }

  /**
   * Create a pattern label text that floats up and fades
   * @param x - X position
   * @param y - Y position
   * @param text - Label text
   * @param color - Text color as hex number
   */
  private createPatternLabel(x: number, y: number, text: string, color: number): void {
    const colorString = '#' + color.toString(16).padStart(6, '0');

    const label = this.scene.add.text(x, y, text, {
      fontSize: '36px',
      color: colorString,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });
    label.setOrigin(0.5);

    // Scale up entrance
    label.setScale(0.5);
    this.scene.tweens.add({
      targets: label,
      scale: 1,
      duration: 150,
      ease: 'Back.easeOut',
    });

    // Float up and fade out
    this.scene.tweens.add({
      targets: label,
      y: y - 80,
      alpha: 0,
      duration: SLASH_PATTERN_VISUAL.confirmationDuration * 1000,
      delay: 150,
      ease: 'Quad.easeOut',
      onComplete: () => {
        label.destroy();
      },
    });
  }

  /**
   * Create a small spark effect at a position
   * @param x - X position
   * @param y - Y position
   * @param color - Spark color
   */
  private createSparkEffect(x: number, y: number, color: number): void {
    const spark = this.scene.add.graphics();

    // Draw small starburst
    spark.fillStyle(color, 1);
    spark.fillCircle(x, y, 4);

    // Draw rays
    spark.lineStyle(2, 0xffffff, 0.8);
    const rayCount = 4;
    const rayLength = 10;
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;
      spark.lineBetween(
        x + Math.cos(angle) * 4,
        y + Math.sin(angle) * 4,
        x + Math.cos(angle) * rayLength,
        y + Math.sin(angle) * rayLength
      );
    }

    // Animate out
    this.scene.tweens.add({
      targets: spark,
      alpha: 0,
      scale: 1.5,
      duration: 300,
      ease: 'Quad.easeOut',
      onComplete: () => {
        spark.destroy();
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

    // Reset pattern recognition tracking
    this.resetPatternBuffer();
    this.wasSlashActive = false;
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
