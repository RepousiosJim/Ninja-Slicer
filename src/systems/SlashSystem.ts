/**
 * SlashSystem
 *
 * Handles slash collision detection with monsters, villagers, and power-ups.
 * Uses line-circle intersection for accurate hit detection.
 * Includes pattern buffer and timeout logic for slash pattern recognition.
 *
 * Performance optimization: Uses spatial partitioning (grid) for collision detection.
 * This reduces O(n*m) collision checks to O(cells * entities_per_cell).
 */

import Phaser from 'phaser';
import type { SlashTrail } from '../entities/SlashTrail';
import type { Monster } from '../entities/Monster';
import type { Villager } from '../entities/Villager';
import type { PowerUp } from '../entities/PowerUp';
import { Ghost } from '../entities/Ghost';
import type { MonsterType, SlashPatternPoint, SlashPatternResult } from '@config/types';
import { SlashPowerLevel, SlashPatternType } from '@config/types';
import {
  MONSTER_HITBOX_RADIUS,
  MONSTER_SOULS,
  VILLAGER_PENALTY,
  SLASH_HITBOX_RADIUS,
  VILLAGER_HITBOX_RADIUS,
  POWERUP_HITBOX_RADIUS,
  ENTITY_BOUNDS,
  EFFECT_DURATIONS,
  EFFECT_SIZES,
  SLASH_POWER_DAMAGE_MULTIPLIERS,
  SLASH_POWER_SCORE_MULTIPLIERS,
  SLASH_PATTERN,
  SLASH_PATTERN_BONUSES,
  SLASH_PATTERN_VISUAL,
  GAME_WIDTH,
  GAME_HEIGHT,
} from '@config/constants';
import { lineIntersectsCircle, detectSlashPattern, isValidPattern, calculateCentroid } from '../utils/helpers';
import { EventBus } from '../utils/EventBus';
import type { ComboSystem } from './ComboSystem';
import type { PowerUpManager } from '../managers/PowerUpManager';
import type { WeaponManager } from '../managers/WeaponManager';
import type { UpgradeManager } from '../managers/UpgradeManager';
import type { SlashEnergyManager } from '../managers/SlashEnergyManager';
import type { AudioManager } from '../managers/AudioManager';

// =============================================================================
// SPATIAL PARTITIONING - Grid-based collision optimization
// =============================================================================

/**
 * Configuration for spatial grid partitioning
 * Cell size of 100px provides good balance between grid overhead and collision reduction
 */
const SPATIAL_GRID_CONFIG = {
  cellSize: 100, // Size of each cell in pixels
  cols: Math.ceil(GAME_WIDTH / 100),
  rows: Math.ceil((GAME_HEIGHT + 100) / 100), // Extra row for entities spawning above screen
};

/**
 * Screen bounds configuration for early entity filtering
 * Entities outside these bounds are skipped entirely to avoid unnecessary processing
 * Margins account for entity hitbox radius and spawn positions
 */
const SCREEN_BOUNDS = {
  minX: -100,                    // Left margin for entities partially off-screen
  maxX: GAME_WIDTH + 100,        // Right margin for entities partially off-screen
  minY: -150,                    // Top margin for spawning entities
  maxY: GAME_HEIGHT + 100,       // Bottom margin for falling entities
};

/**
 * Entity types that can be stored in the spatial grid
 */
type SpatialEntity = Monster | Villager | PowerUp;

/**
 * Spatial grid cell containing references to entities
 */
interface SpatialCell<T> {
  entities: T[];
}

/**
 * Lightweight spatial grid for broadphase collision detection
 * Divides the game area into cells and only checks collisions
 * with entities in cells that the slash line segment intersects
 */
class SpatialGrid<T extends SpatialEntity> {
  private cells: SpatialCell<T>[][];
  private readonly cellSize: number;
  private readonly cols: number;
  private readonly rows: number;

  constructor(cellSize: number = SPATIAL_GRID_CONFIG.cellSize) {
    this.cellSize = cellSize;
    this.cols = SPATIAL_GRID_CONFIG.cols;
    this.rows = SPATIAL_GRID_CONFIG.rows;
    this.cells = this.createEmptyGrid();
  }

  /**
   * Create an empty grid structure
   */
  private createEmptyGrid(): SpatialCell<T>[][] {
    const grid: SpatialCell<T>[][] = [];
    for (let row = 0; row < this.rows; row++) {
      grid[row] = [];
      for (let col = 0; col < this.cols; col++) {
        grid[row][col] = { entities: [] };
      }
    }
    return grid;
  }

  /**
   * Clear all entities from the grid
   * Called at the start of each frame before repopulating
   * Uses array.length = 0 to reuse arrays and avoid GC pressure
   */
  clear(): void {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        this.cells[row][col].entities.length = 0; // Reuse array instead of creating new one
      }
    }
  }

  /**
   * Convert world coordinates to grid cell indices
   * Accounts for entities above the screen (negative y)
   */
  private worldToCell(x: number, y: number): { col: number; row: number } {
    // Offset y to handle entities above screen (spawning at y < 0)
    const adjustedY = y + 100;
    return {
      col: Math.floor(Math.max(0, Math.min(x, GAME_WIDTH - 1)) / this.cellSize),
      row: Math.floor(Math.max(0, Math.min(adjustedY, (this.rows * this.cellSize) - 1)) / this.cellSize),
    };
  }

  /**
   * Insert an entity into the grid based on its position
   * Entities are placed in a single cell based on their center point
   */
  insert(entity: T): void {
    const { col, row } = this.worldToCell(entity.x, entity.y);
    if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
      this.cells[row][col].entities.push(entity);
    }
  }

  /**
   * Check if an entity is within screen bounds (early rejection)
   * This is faster than checking cell bounds after coordinate conversion
   * Entities way off-screen are skipped entirely to avoid grid operations
   * @param entity - Entity to check
   * @returns true if entity is within processable bounds
   */
  private isEntityInBounds(entity: T): boolean {
    return (
      entity.x >= SCREEN_BOUNDS.minX &&
      entity.x <= SCREEN_BOUNDS.maxX &&
      entity.y >= SCREEN_BOUNDS.minY &&
      entity.y <= SCREEN_BOUNDS.maxY
    );
  }

  /**
   * Populate grid from an array of entities
   * Includes early bounds checking to skip off-screen entities entirely
   * Performance: O(n) where n is active entities, but skips grid operations for off-screen entities
   */
  populate(entities: T[]): void {
    for (const entity of entities) {
      // Early rejection: skip inactive entities
      if (!entity.active) {
        continue;
      }

      // Early bounds check: skip entities way off-screen
      // This prevents unnecessary cell coordinate calculations and grid insertions
      if (!this.isEntityInBounds(entity)) {
        continue;
      }

      this.insert(entity);
    }
  }

  /**
   * Get all cells that a line segment passes through using Bresenham-style traversal
   * Returns unique cell coordinates that the line intersects
   */
  getCellsAlongLine(
    x1: number, y1: number,
    x2: number, y2: number
  ): Array<{ col: number; row: number }> {
    const cells: Array<{ col: number; row: number }> = [];
    const visited = new Set<string>();

    const start = this.worldToCell(x1, y1);
    const end = this.worldToCell(x2, y2);

    // Use DDA (Digital Differential Analyzer) algorithm for line traversal
    const dx = Math.abs(end.col - start.col);
    const dy = Math.abs(end.row - start.row);
    const sx = start.col < end.col ? 1 : -1;
    const sy = start.row < end.row ? 1 : -1;

    let col = start.col;
    let row = start.row;
    let err = dx - dy;

    while (true) {
      // Add current cell if valid and not visited
      const key = `${col},${row}`;
      if (!visited.has(key) && row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
        visited.add(key);
        cells.push({ col, row });
      }

      // Check if we've reached the end
      if (col === end.col && row === end.row) break;

      const e2 = 2 * err;

      if (e2 > -dy) {
        err -= dy;
        col += sx;
      }

      if (e2 < dx) {
        err += dx;
        row += sy;
      }
    }

    return cells;
  }

  /**
   * Query entities that could potentially collide with a line segment
   * Uses spatial partitioning to return only entities in intersecting cells
   */
  queryLine(x1: number, y1: number, x2: number, y2: number): T[] {
    const cells = this.getCellsAlongLine(x1, y1, x2, y2);
    const result: T[] = [];
    const added = new Set<T>();

    for (const { col, row } of cells) {
      const cell = this.cells[row][col];
      for (const entity of cell.entities) {
        if (!added.has(entity)) {
          added.add(entity);
          result.push(entity);
        }
      }
    }

    return result;
  }

  /**
   * Get entities in neighboring cells (3x3 area around a point)
   * Useful for entities that might straddle cell boundaries
   */
  queryNeighbors(x: number, y: number): T[] {
    const { col, row } = this.worldToCell(x, y);
    const result: T[] = [];
    const added = new Set<T>();

    for (let r = row - 1; r <= row + 1; r++) {
      for (let c = col - 1; c <= col + 1; c++) {
        if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
          for (const entity of this.cells[r][c].entities) {
            if (!added.has(entity)) {
              added.add(entity);
              result.push(entity);
            }
          }
        }
      }
    }

    return result;
  }
}

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
  private audioManager: AudioManager | null = null;

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

  // Slash session tracking for pattern bonuses
  // Tracks points and monsters during a single slash to apply pattern multipliers retroactively
  private slashSessionPoints: number = 0;
  private slashSessionMonsters: { x: number; y: number; type: MonsterType }[] = [];

  // Spatial grids for optimized collision detection
  // Separate grids for each entity type for better cache locality
  private monsterGrid: SpatialGrid<Monster>;
  private villagerGrid: SpatialGrid<Villager>;
  private powerUpGrid: SpatialGrid<PowerUp>;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.hitFlashGraphics = scene.add.graphics();

    // Initialize spatial grids for collision optimization
    this.monsterGrid = new SpatialGrid<Monster>();
    this.villagerGrid = new SpatialGrid<Villager>();
    this.powerUpGrid = new SpatialGrid<PowerUp>();
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
   * Set audio manager reference
   */
  setAudioManager(audioManager: AudioManager): void {
    this.audioManager = audioManager;
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
    delta: number = 16.67,
  ): void {
    const isSlashActive = slashTrail.isActive();

    // Handle slash session tracking (transition from inactive to active)
    if (!this.wasSlashActive && isSlashActive) {
      // New slash started - reset session tracking
      this.slashSessionPoints = 0;
      this.slashSessionMonsters = [];
    }

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

    // Populate spatial grids with active entities
    // Clear grids and rebuild each frame (entities move)
    this.monsterGrid.clear();
    this.villagerGrid.clear();
    this.powerUpGrid.clear();
    this.monsterGrid.populate(monsters);
    this.villagerGrid.populate(villagers);
    this.powerUpGrid.populate(powerUps);

    // Check each line segment in slash trail using spatial partitioning
    for (let i = 1; i < slashPoints.length; i++) {
      const prevPoint = slashPoints[i - 1];
      const currentPoint = slashPoints[i];

      if (!prevPoint || !currentPoint) continue;

      // Query spatial grids for nearby entities and check collisions
      // This reduces collision checks from O(all entities) to O(entities in nearby cells)
      this.checkMonsterCollisions(prevPoint, currentPoint);
      this.checkVillagerCollisions(prevPoint, currentPoint);
      this.checkPowerUpCollisions(prevPoint, currentPoint);
    }
  }

  /**
   * Buffer slash points for pattern recognition
   */
  private bufferSlashPoints(slashPoints: Phaser.Math.Vector2[]): void {
    if (slashPoints.length === 0) return;

    // Sample points based on distance to avoid buffering too many similar points
    const lastPoint = slashPoints[slashPoints.length - 1];
    
    if (this.patternBuffer.length === 0) {
      this.patternBuffer.push({
        x: lastPoint.x,
        y: lastPoint.y,
        timestamp: this.scene.time.now,
      });
      this.isPatternBuffering = true;
      this.patternTimer = SLASH_PATTERN.patternTimeoutMs;
    } else {
      const lastBuffered = this.patternBuffer[this.patternBuffer.length - 1];
      const distance = Phaser.Math.Distance.Between(lastBuffered.x, lastBuffered.y, lastPoint.x, lastPoint.y);
      
      // Only add point if minimum distance threshold is met
      if (distance >= SLASH_PATTERN.minPointDistance) {
        this.patternBuffer.push({
          x: lastPoint.x,
          y: lastPoint.y,
          timestamp: this.scene.time.now,
        });
      }
    }
  }

  /**
   * Calculate total distance traveled by slash
   */
  private calculateSlashDistance(slashPoints: Phaser.Math.Vector2[]): number {
    let distance = 0;
    
    for (let i = 1; i < slashPoints.length; i++) {
      const prev = slashPoints[i - 1];
      const current = slashPoints[i];
      distance += Phaser.Math.Distance.Between(prev.x, prev.y, current.x, current.y);
    }
    
    return distance;
  }

  /**
   * Handle slash ending - detect patterns and apply bonuses
   */
  private onSlashEnd(): void {
    if (this.patternBuffer.length >= SLASH_PATTERN.minPointsRequired) {
      const patternResult = detectSlashPattern(this.patternBuffer);
      
      if (patternResult && isValidPattern(patternResult.type)) {
        this.lastDetectedPattern = patternResult;

        // Apply pattern bonus to session points retroactively
        const patternBonus = SLASH_PATTERN_BONUSES[patternResult.type as keyof typeof SLASH_PATTERN_BONUSES];
        if (patternBonus && patternBonus.scoreMultiplier) {
          const bonusPoints = Math.floor(this.slashSessionPoints * (patternBonus.scoreMultiplier - 1));
          this.score += bonusPoints;

          EventBus.emit('score-updated', {
            score: this.score,
            delta: bonusPoints,
          });
        }
        
        EventBus.emit('slash-pattern-detected', {
          type: patternResult.type,
          difficulty: patternResult.difficulty,
          bonus: patternBonus,
          sessionMonsters: this.slashSessionMonsters,
        });
      }
    }
    
    this.resetPatternBuffer();
  }

  /**
   * Reset pattern buffer and timer
   */
  private resetPatternBuffer(): void {
    this.patternBuffer = [];
    this.isPatternBuffering = false;
    this.patternTimer = 0;
  }

  /**
   * Check collisions with monsters
   */
  private checkMonsterCollisions(
    prevPoint: Phaser.Math.Vector2,
    currentPoint: Phaser.Math.Vector2,
  ): void {
    const candidates = this.monsterGrid.queryLine(prevPoint.x, prevPoint.y, currentPoint.x, currentPoint.y);
    
    for (const monster of candidates) {
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
    
    // Track session points and monsters for pattern bonuses
    this.slashSessionPoints += finalScore;
    this.slashSessionMonsters.push({
      x: monster.x,
      y: monster.y,
      type: monster.getMonsterType(),
    });
    
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
  ): void {
    const candidates = this.villagerGrid.queryLine(prevPoint.x, prevPoint.y, currentPoint.x, currentPoint.y);
    
    for (const villager of candidates) {
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
  ): void {
    const candidates = this.powerUpGrid.queryLine(prevPoint.x, prevPoint.y, currentPoint.x, currentPoint.y);
    
    for (const powerUp of candidates) {
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
    if (powerUp.y < ENTITY_BOUNDS.top || powerUp.y > ENTITY_BOUNDS.bottom) return false;
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
