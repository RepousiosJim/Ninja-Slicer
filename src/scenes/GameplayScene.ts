/**
 * GameplayScene
 *
 * Main gameplay scene for Ninja Slicer game.
 * Handles all game systems and main game loop.
 * Supports both endless mode and campaign mode.
 */

import Phaser from 'phaser';
import { SCENE_KEYS, GAME_WIDTH, GAME_HEIGHT, DEFAULT_STARTING_LIVES } from '@config/constants';
import { LevelConfig } from '@config/types';
import { SlashTrail } from '../entities/SlashTrail';
import { SpawnSystem } from '../systems/SpawnSystem';
import { SlashSystem } from '../systems/SlashSystem';
import { HUD } from '../ui/HUD';
import { ComboSystem } from '../systems/ComboSystem';
import { PowerUpManager } from '../managers/PowerUpManager';
import { WeaponManager } from '../managers/WeaponManager';
import { UpgradeManager } from '../managers/UpgradeManager';
import { SaveManager } from '../managers/SaveManager';
import { LevelManager } from '../managers/LevelManager';
import { EventBus } from '../utils/EventBus';
import { Boss } from '../entities/Boss';
import { GraveTitan } from '../entities/GraveTitan';
import { HeadlessHorseman } from '../entities/HeadlessHorseman';
import { VampireLord } from '../entities/VampireLord';
import { PhantomKing } from '../entities/PhantomKing';
import { DemonOverlord } from '../entities/DemonOverlord';

export class GameplayScene extends Phaser.Scene {
  private slashTrail!: SlashTrail;
  private spawnSystem!: SpawnSystem;
  private slashSystem!: SlashSystem;
  private hud!: HUD;
  private comboSystem!: ComboSystem;
  private powerUpManager!: PowerUpManager;
  private weaponManager!: WeaponManager;
  private upgradeManager!: UpgradeManager;
  private saveManager!: SaveManager;
  private levelManager!: LevelManager;

  // Campaign mode properties
  private isCampaignMode: boolean = false;
  private currentWorld: number = 1;
  private currentLevel: number = 1;
  private currentLevelConfig: LevelConfig | null = null;
  private levelTimer: number = 0;
  private killQuota: number = 0;
  private currentKills: number = 0;
  private boss: Boss | null = null;
  private bossSpawned: boolean = false;

  private pointerX: number = 0;
  private pointerY: number = 0;
  private isPointerDown: boolean = false;
  private lastPointerTime: number = 0;

  private lives: number = DEFAULT_STARTING_LIVES;
  private isGameOver: boolean = false;
  private gameOverTimer: number = 0;
  private isPaused: boolean = false;

  constructor() {
    super({ key: SCENE_KEYS.gameplay });
  }

  create(data: { world?: number; level?: number } = {}): void {
    // Check if campaign mode
    this.isCampaignMode = data.world !== undefined && data.level !== undefined;
    this.currentWorld = data.world || 1;
    this.currentLevel = data.level || 1;

    // Create background
    this.createBackground();

    // Initialize all managers
    this.weaponManager = WeaponManager.getInstance();
    this.upgradeManager = UpgradeManager.getInstance();
    this.saveManager = new SaveManager();
    this.levelManager = LevelManager.getInstance();

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

    // Connect systems
    this.slashSystem.setComboSystem(this.comboSystem);
    this.slashSystem.setPowerUpManager(this.powerUpManager);
    this.slashSystem.setWeaponManager(this.weaponManager);
    this.slashSystem.setUpgradeManager(this.upgradeManager);

    // Apply starting lives from upgrade
    const playerStats = this.upgradeManager.getPlayerStats();
    this.lives = Math.floor(playerStats.startingLives);

    // Update slash trail style from weapon
    this.updateSlashTrailStyle();

    // Setup campaign mode if applicable
    if (this.isCampaignMode) {
      this.setupCampaignMode();
    }

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

    console.log('GameplayScene created - Phase 4 Campaign ready!');
  }

  /**
   * Setup campaign mode
   */
  private async setupCampaignMode(): Promise<void> {
    try {
      // Load level data
      await this.levelManager.loadLevels();

      // Get level config
      const levelConfig = this.levelManager.getLevelConfig(this.currentWorld, this.currentLevel);
      this.currentLevelConfig = levelConfig || null;

      if (!this.currentLevelConfig) {
        console.error(`[GameplayScene] Level ${this.currentWorld}-${this.currentLevel} not found`);
        return;
      }

      // Set level timer and kill quota
      this.levelTimer = 0;
      this.killQuota = this.currentLevelConfig.minKills;
      this.currentKills = 0;

      // Configure spawn system with level config
      // this.spawnSystem.setLevelConfig(this.currentLevelConfig);

      // Show timer and kill quota in HUD
      // this.hud.showTimer(true);
      // this.hud.showKillQuota(true);
      // this.hud.updateTimer(0, this.currentLevelConfig.duration);
      // this.hud.updateKillQuota(0, this.killQuota);

      // Load world background
      this.loadWorldBackground();

      // Check if boss level
      if (this.currentLevelConfig.isBoss) {
        this.prepareBossSpawn();
      }

      console.log(`[GameplayScene] Campaign mode: World ${this.currentWorld}, Level ${this.currentLevel}`);
    } catch (error) {
      console.error('[GameplayScene] Failed to setup campaign mode:', error);
    }
  }

  /**
   * Load world background
   */
  private loadWorldBackground(): void {
    const worldConfig = this.levelManager.getWorldConfig(this.currentWorld);
    const backgroundKey = worldConfig?.backgroundKey;

    if (backgroundKey && this.textures.exists(backgroundKey)) {
      // Use world background texture
      const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, backgroundKey);
      bg.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
      bg.setDepth(0);

      // Add foreground parallax layer if it exists
      const fgKey = `${backgroundKey}_fg`;
      if (this.textures.exists(fgKey)) {
        const fg = this.add.tileSprite(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, fgKey);
        fg.setDepth(100); // Above monsters but below HUD
        fg.setScrollFactor(0);
        fg.setAlpha(0.8);
        
        // Simple parallax movement simulation
        this.events.on('update', () => {
          fg.tilePositionX += 0.5;
        });
      }
    } else {
      // Use default background
      this.createBackground();
    }
  }

  /**
   * Prepare boss spawn
   */
  private prepareBossSpawn(): void {
    const bossId = this.currentLevelConfig?.bossId;
    if (!bossId) return;

    console.log(`[GameplayScene] Preparing boss: ${bossId}`);
  }

  /**
   * Spawn boss for level 5
   */
  private spawnBoss(): void {
    if (this.bossSpawned || !this.currentLevelConfig) return;

    const bossId = this.currentLevelConfig?.bossId;
    if (!bossId) return;

    // Create boss based on ID
    switch (bossId) {
      case 'grave_titan':
        this.boss = new GraveTitan(this);
        break;
      case 'headless_horseman':
        this.boss = new HeadlessHorseman(this);
        break;
      case 'vampire_lord':
        this.boss = new VampireLord(this);
        break;
      case 'phantom_king':
        this.boss = new PhantomKing(this);
        break;
      case 'demon_overlord':
        this.boss = new DemonOverlord(this);
        break;
      default:
        console.error(`[GameplayScene] Unknown boss ID: ${bossId}`);
        return;
    }

    // Get boss config
    const bossConfig = this.levelManager.getBossConfig(bossId);
    if (!bossConfig) return;

    // Spawn boss at top center
    this.boss.spawn(GAME_WIDTH / 2, 150, bossConfig);

    // Show boss health bar
    // this.hud.showBossHealthBar(true);

    // Set up boss damage listener
    EventBus.on('boss-hit', this.handleBossHit.bind(this));
    EventBus.on('boss-defeated', this.handleBossDefeated.bind(this));

    this.bossSpawned = true;
    console.log(`[GameplayScene] Boss spawned: ${bossConfig.name}`);
  }

  /**
   * Handle boss hit
   */
  private handleBossHit(data: any): void {
    if (!this.boss) return;

    // Update boss health bar
    // this.hud.updateBossHealth(data.remainingHealth, data.maxHealth);
  }

  /**
   * Handle boss defeated
   */
  private handleBossDefeated(data: any): void {
    if (!this.boss) return;

    console.log(`[GameplayScene] Boss defeated!`);

    // Hide boss health bar
    // this.hud.showBossHealthBar(false);

    // Award boss souls
    const soulsReward = data.soulsReward || 0;
    // this.slashSystem.addSouls(soulsReward);

    // Complete level
    this.onLevelComplete();
  }

  /**
   * Load progression data (weapons, upgrades)
   */
  private async loadProgressionData(): Promise<void> {
    try {
      await this.weaponManager.loadWeapons();
      await this.upgradeManager.loadUpgrades();
      console.log('[GameplayScene] Progression data loaded');
    } catch (error) {
      console.error('[GameplayScene] Failed to load progression data:', error);
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
    // Much darker background for better contrast
    graphics.fillStyle(0x000000, 1); // Pure black
    graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Add very subtle decorative elements
    graphics.fillStyle(0x0a0a0a, 0.3);
    graphics.fillCircle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 200);
    graphics.fillCircle(200, 150, 100);
    graphics.fillCircle(GAME_WIDTH - 200, 500, 150);

    // Set this to lowest depth
    graphics.setDepth(0);
  }

  /**
   * Set up input handlers
   */
  private setupInput(): void {
    // Hide system cursor - we draw our own
    this.input.setDefaultCursor('none');

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

    // Listen for monster sliced events (for kill tracking in campaign)
    EventBus.on('monster-sliced', () => {
      if (this.isCampaignMode) {
        this.currentKills++;
        this.hud.updateKillQuota(this.currentKills, this.killQuota);
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

    // Update level timer in campaign mode
    if (this.isCampaignMode && this.currentLevelConfig) {
      this.levelTimer += delta / 1000;
      // this.hud.updateTimer(this.levelTimer, this.currentLevelConfig.duration);

      // Check for boss spawn (at 80% of level duration)
      const bossSpawnTime = this.currentLevelConfig?.duration * 0.8 || 0;
      if (this.currentLevelConfig.isBoss && !this.bossSpawned && this.levelTimer >= bossSpawnTime) {
        this.spawnBoss();
      }

      // Update boss if active
      if (this.boss && !this.boss.isBossDead()) {
        this.boss.update(time, delta);
      }

      // Check win condition
      this.checkWinCondition();
    }

    // Handle input
    this.handleInput(delta);

    // Update spawn system
    this.spawnSystem.update(time, delta);

    // Update combo system
    this.comboSystem.update(time, delta);

    // Update HUD (for combo timer bar animation)
    this.hud.update(delta, this.comboSystem);

    // Update power-up manager
    this.powerUpManager.update(time, delta);

    // Update slash system (check collisions)
    const activeMonsters = this.spawnSystem.getActiveMonsters();
    const activeVillagers = this.spawnSystem.getActiveVillagers();
    const activePowerUps = this.spawnSystem.getActivePowerUps();
    this.slashSystem.update(this.slashTrail, activeMonsters, activeVillagers, activePowerUps);

    // Check for monsters that fell off screen
    this.checkMissedMonsters(activeMonsters);
  }

  /**
   * Check win condition
   */
  private checkWinCondition(): void {
    if (!this.currentLevelConfig) return;

    const timeElapsed = this.levelTimer;
    const duration = this.currentLevelConfig.duration;
    const killsMet = this.currentKills >= this.killQuota;

    // Normal levels: Timer reaches duration AND kill quota met
    // Boss levels: Boss defeated (handled in handleBossDefeated)
    if (!this.currentLevelConfig.isBoss && timeElapsed >= duration && killsMet) {
      this.onLevelComplete();
    }
  }

  /**
   * Handle level completion
   */
  private onLevelComplete(): void {
    if (!this.currentLevelConfig) return;

    console.log(`[GameplayScene] Level ${this.currentWorld}-${this.currentLevel} complete!`);

    // Calculate final stats
    const finalStats = {
      score: this.slashSystem.getScore(),
      souls: this.slashSystem.getSouls(),
      monstersSliced: this.slashSystem.getMonstersSliced(),
      villagersSliced: this.slashSystem.getVillagersSliced(),
      powerUpsCollected: this.slashSystem.getPowerUpsCollected(),
      maxCombo: this.comboSystem.getMaxCombo(),
      timeElapsed: this.spawnSystem.getElapsedTime(),
    };

    // Complete level and calculate stars
    const stars = this.levelManager.completeLevel(this.currentWorld, this.currentLevel, finalStats.score);

    // Emit level complete event
    EventBus.emit('level-complete', {
      levelId: `${this.currentWorld}-${this.currentLevel}`,
      score: finalStats.score,
      souls: finalStats.souls,
      stars,
      stats: finalStats,
      isNewHighScore: false,
    });

    // Save game state
    this.saveManager.save();

    // Transition to level complete scene
    this.scene.start(SCENE_KEYS.levelComplete, {
      world: this.currentWorld,
      level: this.currentLevel,
      score: finalStats.score,
      stars,
      souls: finalStats.souls,
      stats: finalStats,
    });
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
      this.showGameOver();
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
   * Show game over screen
   */
  private showGameOver(): void {
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

    // Transition to game over scene
    this.scene.start('GameOverScene', finalStats);
  }

  /**
   * Restart game
   */
  private restart(): void {
    console.log('Restarting game...');

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

    // Reset campaign mode state
    if (this.isCampaignMode) {
      this.levelTimer = 0;
      this.currentKills = 0;
      this.bossSpawned = false;
      if (this.boss) {
        this.boss.destroy();
        this.boss = null;
      }
      // this.hud.showTimer(true);
      // this.hud.showKillQuota(true);
      // this.hud.showBossHealthBar(false);
      if (this.currentLevelConfig) {
        // this.hud.updateTimer(0, this.currentLevelConfig.duration);
        // this.hud.updateKillQuota(0, this.killQuota);
      }
    }

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
        levelId: this.isCampaignMode ? `${this.currentWorld}-${this.currentLevel}` : null,
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
    EventBus.off('boss-hit');
    EventBus.off('boss-defeated');

    // Destroy all systems
    this.slashTrail.destroy();
    this.spawnSystem.destroy();
    this.slashSystem.destroy();
    this.hud.destroy();

    // Destroy boss if exists
    if (this.boss) {
      this.boss.destroy();
      this.boss = null;
    }
  }
}
