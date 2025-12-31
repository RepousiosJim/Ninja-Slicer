/**
 * EndlessGameplayScene
 *
 * Endless mode gameplay scene for Ninja Slicer game.
 * Extends GameplayScene logic with score-based difficulty scaling.
 * No timer, no kill quota, no boss fights.
 * Game over when lives = 0.
 */

import Phaser from 'phaser';
import { debugLog, debugWarn, debugError } from '@utils/DebugLogger';
import { SCENE_KEYS, GAME_WIDTH, GAME_HEIGHT, DEFAULT_STARTING_LIVES, ENDLESS_SCALING } from '@config/constants';
import { SlashTrail } from '../entities/SlashTrail';
import { SpawnSystem } from '../systems/SpawnSystem';
import { SlashSystem } from '../systems/SlashSystem';
import { HUD } from '../ui/HUD';
import { ComboSystem } from '../systems/ComboSystem';
import { PowerUpManager } from '../managers/PowerUpManager';
import { WeaponManager } from '../managers/WeaponManager';
import { UpgradeManager } from '../managers/UpgradeManager';
import { SaveManager } from '../managers/SaveManager';
import { AudioManager } from '../managers/AudioManager';
import { EventBus } from '../utils/EventBus';
import { SupabaseService } from '../services/SupabaseService';

export class EndlessGameplayScene extends Phaser.Scene {
  private slashTrail!: SlashTrail;
  private spawnSystem!: SpawnSystem;
  private slashSystem!: SlashSystem;
  private hud!: HUD;
  private comboSystem!: ComboSystem;
  private powerUpManager!: PowerUpManager;
  private weaponManager!: WeaponManager;
  private upgradeManager!: UpgradeManager;
  private saveManager!: SaveManager;
  private audioManager!: AudioManager;
  private supabaseService: SupabaseService;

  // Endless mode properties
  private isCampaignMode: boolean = false;
  private difficultyLevel: number = 0;
  private sessionStats: {
    monstersSliced: number;
    maxCombo: number;
    timeSurvived: number;
    accuracy: number;
  };

  private pointerX: number = 0;
  private pointerY: number = 0;
  private isPointerDown: boolean = false;
  private lastPointerTime: number = 0;

  private lives: number = DEFAULT_STARTING_LIVES;
  private isGameOver: boolean = false;
  private gameOverTimer: number = 0;
  private isPaused: boolean = false;

  constructor() {
    super({ key: SCENE_KEYS.endlessGameplay });
    this.supabaseService = new SupabaseService();
    this.sessionStats = {
      monstersSliced: 0,
      maxCombo: 0,
      timeSurvived: 0,
      accuracy: 0,
    };
  }

  create(): void {
    // Create background
    this.createBackground();

    // Initialize all managers
    this.weaponManager = WeaponManager.getInstance();
    this.upgradeManager = UpgradeManager.getInstance();
    this.saveManager = new SaveManager();

    // Load data
    this.loadProgressionData();

    // Initialize all systems
    this.slashTrail = new SlashTrail(this);
    this.spawnSystem = new SpawnSystem(this);
    this.slashSystem = new SlashSystem(this);
    this.comboSystem = new ComboSystem();
    this.powerUpManager = PowerUpManager.getInstance();
    this.powerUpManager.initialize(this);
    this.powerUpManager.setUpgradeManager(this.upgradeManager);
    this.hud = new HUD(this);

    // Initialize audio manager
    this.audioManager = new AudioManager(this);
    this.audioManager.initialize();

    // Connect systems
    this.slashSystem.setComboSystem(this.comboSystem);
    this.slashSystem.setPowerUpManager(this.powerUpManager);
    this.slashSystem.setWeaponManager(this.weaponManager);
    this.slashSystem.setUpgradeManager(this.upgradeManager);
    this.slashSystem.setAudioManager(this.audioManager);

    // Apply starting lives from upgrade
    const playerStats = this.upgradeManager.getPlayerStats();
    this.lives = Math.floor(playerStats.startingLives);

    // Update slash trail style from weapon
    this.updateSlashTrailStyle();

    // Create HUD
    this.hud.create();
    
    // Add pause button to HUD
    this.hud.addPauseButton(this.togglePause.bind(this));

    // Set up input handlers
    this.setupInput();

    // Set up keyboard for restart
    this.setupKeyboard();

    // Set up event listeners
    this.setupEventListeners();

    // Initialize session stats
    this.sessionStats = {
      monstersSliced: 0,
      maxCombo: 0,
      timeSurvived: 0,
      accuracy: 0,
    };

    debugLog('EndlessGameplayScene created - Phase 6 Online ready!');
  }

  /**
   * Load progression data (weapons, upgrades)
   */
  private async loadProgressionData(): Promise<void> {
    try {
      await this.weaponManager.loadWeapons();
      await this.upgradeManager.loadUpgrades();
      debugLog('[EndlessGameplayScene] Progression data loaded');
    } catch (error) {
      debugError('[EndlessGameplayScene] Failed to load progression data:', error);
    }
  }

  /**
   * Update slash trail style from current weapon
   */
  private updateSlashTrailStyle(): void {
    const trailStyle = this.weaponManager.getWeaponTrailStyle();
    this.slashTrail.setTrailStyle(trailStyle);
  }

  /**
   * Create simple background
   */
  private createBackground(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x1a1a2e, 1);
    graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Add some decorative elements
    graphics.fillStyle(0x2a2a4e, 0.5);
    graphics.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 200);
    graphics.fillCircle(200, 150, 100);
    graphics.fillCircle(GAME_WIDTH - 200, 500, 150);
  }

  /**
   * Set up input handlers
   */
  private setupInput(): void {
    // Pointer down
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isPointerDown = true;
      this.pointerX = pointer.x;
      this.pointerY = pointer.y;
      this.lastPointerTime = this.time.now;
    });

    // Pointer move
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isPointerDown) {
        this.pointerX = pointer.x;
        this.pointerY = pointer.y;
      }
    });

    // Pointer up
    this.input.on('pointerup', () => {
      this.isPointerDown = false;
      this.slashTrail.clear();
    });
  }

  /**
   * Set up keyboard controls
   */
  private setupKeyboard(): void {
    // R key to restart
    this.input.keyboard?.on('keydown-R', () => {
      if (this.isGameOver) {
        this.restart();
      }
    });
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Listen for monster missed events
    EventBus.on('monster-missed', () => {
      this.loseLife();
    });

    // Listen for monster sliced events
    EventBus.on('monster-sliced', () => {
      this.sessionStats.monstersSliced++;
    });

    // Listen for combo updates
    EventBus.on('combo-updated', (data: { count: number }) => {
      if (data.count > this.sessionStats.maxCombo) {
        this.sessionStats.maxCombo = data.count;
      }
    });
  }

  /**
   * Main game loop
   * @param time - Current time
   * @param delta - Time since last update
   */
  update(time: number, delta: number): void {
    if (this.isPaused) {
      return;
    }
    
    if (this.isGameOver) {
      this.handleGameOverUpdate(delta);
      return;
    }

    // Update time survived
    this.sessionStats.timeSurvived += delta / 1000;

    // Update difficulty based on score
    this.updateDifficulty();

    // Handle input
    this.handleInput(delta);

    // Update spawn system
    this.spawnSystem.update(time, delta);

    // Update combo system
    this.comboSystem.update(time, delta);

    // Update power-up manager
    this.powerUpManager.update(time, delta);

    // Update slash system (check collisions)
    const activeMonsters = this.spawnSystem.getActiveMonsters();
    const activeVillagers = this.spawnSystem.getActiveVillagers();
    const activePowerUps = this.spawnSystem.getActivePowerUps();
    this.slashSystem.update(this.slashTrail, activeMonsters, activeVillagers, activePowerUps);

    // Check for monsters that fell off screen
    this.checkMissedMonsters(activeMonsters);

    // Update accuracy
    this.updateAccuracy();
  }

  /**
   * Update difficulty based on score
   */
  private updateDifficulty(): void {
    const score = this.slashSystem.getScore();
    this.difficultyLevel = Math.floor(score / ENDLESS_SCALING.scorePerDifficultyIncrease);

    // Calculate multipliers
    const spawnRateMultiplier = Math.min(
      1 + (this.difficultyLevel * 0.1),
      ENDLESS_SCALING.maxSpawnRateMultiplier,
    );
    const speedMultiplier = Math.min(
      1 + (this.difficultyLevel * 0.05),
      ENDLESS_SCALING.maxSpeedMultiplier,
    );
    const villagerChance = Math.min(
      0.05 + (this.difficultyLevel * 0.01),
      ENDLESS_SCALING.maxVillagerChance,
    );

    // Update spawn system with difficulty values
    this.spawnSystem.setDifficultyModifiers({
      spawnRateMultiplier,
      speedMultiplier,
      villagerChance,
    });
  }

  /**
   * Update accuracy
   */
  private updateAccuracy(): void {
    const totalAttempts = this.sessionStats.monstersSliced + this.slashSystem.getVillagersSliced();
    if (totalAttempts > 0) {
      this.sessionStats.accuracy = this.sessionStats.monstersSliced / totalAttempts;
    }
  }

  /**
   * Handle pointer input
   * @param delta - Time since last update
   */
  private handleInput(delta: number): void {
    if (this.isPointerDown) {
      // Calculate delta time in seconds
      const deltaTime = delta / 1000;

      // Update slash trail
      this.slashTrail.update(this.pointerX, this.pointerY, deltaTime);
    }
  }

  /**
   * Check for monsters that fell off screen
   */
  private checkMissedMonsters(monsters: any[]): void {
    for (const monster of monsters) {
      if (monster.y > 800 && !monster.getIsSliced()) {
        // Monster was missed
        EventBus.emit('monster-missed', {
          monsterType: monster.getMonsterType(),
        });
      }
    }
  }

  /**
   * Lose a life
   */
  private loseLife(): void {
    this.lives--;

    // Emit lives changed event
    EventBus.emit('lives-changed', {
      lives: this.lives,
      delta: -1,
    });

    // Check for game over
    if (this.lives <= 0) {
      this.triggerGameOver();
    }
  }

  /**
   * Trigger game over
   */
  private triggerGameOver(): void {
    this.isGameOver = true;
    this.gameOverTimer = 0;

    // Stop spawning
    this.spawnSystem.stopSpawning();

    // Dramatic pause before showing game over
    this.time.delayedCall(1000, () => {
      this.onGameOver();
    });
  }

  /**
   * Handle game over update
   */
  private handleGameOverUpdate(delta: number): void {
    this.gameOverTimer += delta;

    // Let remaining monsters fall
    const activeMonsters = this.spawnSystem.getActiveMonsters();
    const activeVillagers = this.spawnSystem.getActiveVillagers();
    const activePowerUps = this.spawnSystem.getActivePowerUps();

    this.spawnSystem.update(this.time.now, delta);

    // Update slash system (no new slashes)
    this.slashSystem.update(this.slashTrail, activeMonsters, activeVillagers, activePowerUps);
  }

  /**
   * Handle game over
   */
  private async onGameOver(): Promise<void> {
    // Prepare final stats
    const finalStats = {
      score: this.slashSystem.getScore(),
      souls: this.slashSystem.getSouls(),
      monstersSliced: this.slashSystem.getMonstersSliced(),
      villagersSliced: this.slashSystem.getVillagersSliced(),
      powerUpsCollected: this.slashSystem.getPowerUpsCollected(),
      maxCombo: this.comboSystem.getMaxCombo(),
      timeElapsed: this.spawnSystem.getElapsedTime(),
    };

    // Emit game over event
    EventBus.emit('game-over', finalStats);

    // Save game state
    this.saveManager.save();

    // Submit score to Supabase
    await this.submitScore();

    // Transition to game over scene
    this.scene.start('GameOverScene', {
      ...finalStats,
      isEndlessMode: true,
    });
  }

  /**
   * Submit score to Supabase
   */
  private async submitScore(): Promise<void> {
    if (!this.supabaseService.isAvailable()) {
      debugWarn('[EndlessGameplayScene] Supabase not available, skipping score submission');
      return;
    }

    // Get player name from save
    const saveData = this.saveManager.load();
    const playerName = saveData.playerName || 'Anonymous';

    // Get current weapon
    const weaponId = this.weaponManager.getEquippedWeapon();
    const weaponConfig = this.weaponManager.getWeaponConfig(weaponId);
    const weaponName = weaponConfig?.name || 'Unknown';

    // Submit score
    const result = await this.supabaseService.submitScore({
      playerName,
      score: this.slashSystem.getScore(),
      weaponUsed: weaponName,
      monstersSliced: this.sessionStats.monstersSliced,
      maxCombo: this.sessionStats.maxCombo,
      timeElapsedSeconds: this.sessionStats.timeSurvived,
    });

    if (result) {
      debugLog('[EndlessGameplayScene] Score submitted successfully:', result);
    } else {
      debugWarn('[EndlessGameplayScene] Failed to submit score');
    }
  }

  /**
   * Restart game
   */
  private restart(): void {
    debugLog('Restarting endless game...');

    // Reset all systems
    this.slashTrail.clear();
    this.spawnSystem.reset();
    this.slashSystem.resetScore();
    this.comboSystem.reset();
    this.comboSystem.resetMaxCombo();
    this.powerUpManager.reset();
    this.hud.updateScore(0);

    // Reset game state
    this.lives = DEFAULT_STARTING_LIVES;
    this.isGameOver = false;
    this.gameOverTimer = 0;
    this.difficultyLevel = 0;

    // Reset session stats
    this.sessionStats = {
      monstersSliced: 0,
      maxCombo: 0,
      timeSurvived: 0,
      accuracy: 0,
    };

    // Emit lives changed event
    EventBus.emit('lives-changed', {
      lives: this.lives,
      delta: 0,
    });

    // Reset input state
    this.isPointerDown = false;

    // Resume spawning
    this.spawnSystem.resumeSpawning();
  }
  
  /**
   * Toggle pause state
   */
  private togglePause(): void {
    if (this.isGameOver) return;
    
    this.isPaused = !this.isPaused;
    
    if (this.isPaused) {
      // Pause physics
      this.physics.pause();
      
      // Open pause scene
      this.scene.pause();
      this.scene.launch(SCENE_KEYS.pause, {
        levelId: null,
      });
    } else {
      // Resume physics
      this.physics.resume();
    }
  }
  
  /**
   * Resume from pause
   */
  public resume(): void {
    this.isPaused = false;
    this.physics.resume();
  }

  /**
   * Clean up when scene is destroyed
   */
  shutdown(): void {
    // Remove event listeners
    EventBus.off('monster-missed');
    EventBus.off('monster-sliced');
    EventBus.off('combo-updated');

    // Destroy all systems
    this.slashTrail.destroy();
    this.spawnSystem.destroy();
    this.slashSystem.destroy();
    this.hud.destroy();
  }
}