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
  SLASH_PATTERN_VISUAL,
  GAME_WIDTH,
  GAME_HEIGHT
} from '@config/constants';
import { lineIntersectsCircle, detectSlashPattern, isValidPattern, calculateCentroid } from '../utils/helpers';
import { EventBus } from '../utils/EventBus';
import { ComboSystem } from './ComboSystem';
import { PowerUpManager } from '../managers/PowerUpManager';
import { WeaponManager } from '../managers/WeaponManager';
import { UpgradeManager } from '../managers/UpgradeManager';
import { SlashEnergyManager } from '../managers/SlashEnergyManager';

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
   */
  clear(): void {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        this.cells[row][col].entities = [];
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
      this.checkMonsterCollisionsSpatial(prevPoint, currentPoint);
      this.checkVillagerCollisionsSpatial(prevPoint, currentPoint);
      this.checkPowerUpCollisionsSpatial(prevPoint, currentPoint);
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
   * Applies pattern bonuses retroactively to monsters sliced during this slash
   */
  private onSlashEnd(): void {
    if (!this.isPatternBuffering || this.patternBuffer.length < SLASH_PATTERN.minPointsForDetection) {
      this.resetPatternBuffer();
      this.resetSlashSession();
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

      // Calculate total bonus score:
      // 1. Flat bonus score for completing the pattern
      const flatBonusScore = bonuses.bonusScore || 0;

      // 2. Retroactive multiplier bonus for monsters sliced during this slash
      // If scoreMultiplier is 1.5, apply an additional 0.5x of session points as bonus
      const multiplierBonus = Math.floor(
        this.slashSessionPoints * (bonuses.scoreMultiplier - 1.0)
      );

      // Total pattern bonus
      const totalPatternBonus = flatBonusScore + multiplierBonus;
      this.score += totalPatternBonus;

      // Create visual confirmation effect for the detected pattern
      this.createPatternConfirmationEffect(
        result.pattern,
        center,
        result.radius,
        result.points
      );

      // Create pattern-specific damage/effect based on damageMultiplier
      if (bonuses.damageMultiplier > 1.0 && this.slashSessionMonsters.length > 0) {
        this.applyPatternDamageEffect(result.pattern, center, bonuses.damageMultiplier);
      }

      // Emit pattern detected event with full bonus information
      EventBus.emit('slash-pattern-detected', {
        pattern: result.pattern,
        confidence: result.confidence,
        position: center,
        bonusScore: totalPatternBonus,
        bonusMultiplier: bonuses.scoreMultiplier,
        monstersAffected: this.slashSessionMonsters.length,
        sessionPoints: this.slashSessionPoints,
      });

      // Emit score updated event if bonus was applied
      if (totalPatternBonus > 0) {
        EventBus.emit('score-updated', {
          score: this.score,
          delta: totalPatternBonus,
        });

        // Show bonus score floating text at pattern center
        this.createPatternBonusText(center.x, center.y, totalPatternBonus, result.pattern);
      }
    }

    this.resetPatternBuffer();
    this.resetSlashSession();
  }

  /**
   * Reset slash session tracking
   */
  private resetSlashSession(): void {
    this.slashSessionPoints = 0;
    this.slashSessionMonsters = [];
  }

  /**
   * Apply pattern-specific damage effect
   * Each pattern type has a unique effect based on its damageMultiplier
   * @param pattern - The detected pattern type
   * @param center - Center position for the effect
   * @param damageMultiplier - Damage multiplier from pattern bonuses
   */
  private applyPatternDamageEffect(
    pattern: SlashPatternType,
    center: { x: number; y: number },
    damageMultiplier: number
  ): void {
    // Emit pattern effect event for external systems (e.g., area damage, screen effects)
    EventBus.emit('slash-pattern-effect', {
      pattern: pattern,
      position: center,
      damageMultiplier: damageMultiplier,
      monstersHit: this.slashSessionMonsters,
    });
  }

  /**
   * Create floating bonus text for pattern completion
   * @param x - X position
   * @param y - Y position
   * @param bonus - Bonus score amount
   * @param pattern - Pattern type for color styling
   */
  private createPatternBonusText(
    x: number,
    y: number,
    bonus: number,
    pattern: SlashPatternType
  ): void {
    // Color based on pattern type
    const patternColors: Record<SlashPatternType, string> = {
      [SlashPatternType.NONE]: '#ffffff',
      [SlashPatternType.CIRCLE]: '#ffd700', // Gold
      [SlashPatternType.ZIGZAG]: '#00ffff', // Cyan
      [SlashPatternType.STRAIGHT]: '#ff4444', // Red
    };
    const color = patternColors[pattern] || '#ffffff';

    const bonusText = this.scene.add.text(x, y + 40, `+${bonus}`, {
      fontSize: '28px',
      color: color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });
    bonusText.setOrigin(0.5);

    // Animate text floating up and fading
    this.scene.tweens.add({
      targets: bonusText,
      y: y - 60,
      alpha: 0,
      scale: 1.3,
      duration: 1000,
      ease: 'Quad.easeOut',
      onComplete: () => {
        bonusText.destroy();
      },
    });
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

        // Get monster type for souls and session tracking
        const monsterType = monster.getMonsterType();

        // Track session for pattern bonus calculation
        this.slashSessionPoints += finalScore;
        this.slashSessionMonsters.push({
          x: monster.x,
          y: monster.y,
          type: monsterType,
        });

        // Calculate souls
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

  // =============================================================================
  // SPATIAL COLLISION DETECTION (Optimized methods using grid partitioning)
  // =============================================================================

  /**
   * Check monster collisions using spatial partitioning
   * Only checks monsters in cells that the slash line segment passes through
   * Performance: O(entities in nearby cells) instead of O(all monsters)
   */
  private checkMonsterCollisionsSpatial(
    prevPoint: Phaser.Math.Vector2,
    currentPoint: Phaser.Math.Vector2
  ): void {
    // Query spatial grid for monsters near the line segment
    const candidates = this.monsterGrid.queryLine(
      prevPoint.x, prevPoint.y,
      currentPoint.x, currentPoint.y
    );

    for (const monster of candidates) {
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

      // Check line-circle intersection (narrowphase)
      if (this.checkCollision(prevPoint, currentPoint, monster)) {
        this.handleMonsterHit(monster);
      }
    }
  }

  /**
   * Check villager collisions using spatial partitioning
   * Only checks villagers in cells that the slash line segment passes through
   */
  private checkVillagerCollisionsSpatial(
    prevPoint: Phaser.Math.Vector2,
    currentPoint: Phaser.Math.Vector2
  ): void {
    // Query spatial grid for villagers near the line segment
    const candidates = this.villagerGrid.queryLine(
      prevPoint.x, prevPoint.y,
      currentPoint.x, currentPoint.y
    );

    for (const villager of candidates) {
      if (!villager.active || villager.getIsSliced()) {
        continue;
      }

      // Check if villager is on screen
      if (villager.y < -50 || villager.y > 800) {
        continue;
      }

      // Check line-circle intersection (narrowphase)
      if (this.checkVillagerCollision(prevPoint, currentPoint, villager)) {
        this.handleVillagerHit(villager);
      }
    }
  }

  /**
   * Check power-up collisions using spatial partitioning
   * Only checks power-ups in cells that the slash line segment passes through
   */
  private checkPowerUpCollisionsSpatial(
    prevPoint: Phaser.Math.Vector2,
    currentPoint: Phaser.Math.Vector2
  ): void {
    // Query spatial grid for power-ups near the line segment
    const candidates = this.powerUpGrid.queryLine(
      prevPoint.x, prevPoint.y,
      currentPoint.x, currentPoint.y
    );

    for (const powerUp of candidates) {
      if (!powerUp.active || powerUp.getIsSliced()) {
        continue;
      }

      // Check if power-up is on screen
      if (powerUp.y < -50 || powerUp.y > 800) {
        continue;
      }

      // Check line-circle intersection (narrowphase)
      if (this.checkPowerUpCollision(prevPoint, currentPoint, powerUp)) {
        this.handlePowerUpHit(powerUp);
      }
    }
  }

  /**
   * Handle monster hit logic (extracted for reuse)
   * Applies damage, calculates score, emits events, and creates effects
   */
  private handleMonsterHit(monster: Monster): void {
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

    // Get monster type for souls and session tracking
    const monsterType = monster.getMonsterType();

    // Track session for pattern bonus calculation
    this.slashSessionPoints += finalScore;
    this.slashSessionMonsters.push({
      x: monster.x,
      y: monster.y,
      type: monsterType,
    });

    // Calculate souls
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

  /**
   * Handle villager hit logic (extracted for reuse)
   * Applies penalty or consumes shield
   */
  private handleVillagerHit(villager: Villager): void {
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

  /**
   * Handle power-up hit logic (extracted for reuse)
   * Activates the power-up and emits event
   */
  private handlePowerUpHit(powerUp: PowerUp): void {
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
    this.resetSlashSession();
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
