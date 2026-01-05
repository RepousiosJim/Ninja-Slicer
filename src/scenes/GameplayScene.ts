/**
 * GameplayScene
 *
 * Main gameplay scene for Ninja Slicer game.
 * Handles all game systems and main game loop.
 * Supports both endless mode and campaign mode.
 */

import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { debugLog, debugWarn, debugError } from '@utils/DebugLogger';
import { ErrorHandler, ErrorCategory, ErrorSeverity } from '@utils/ErrorHandler';
import { SCENE_KEYS, GAME_WIDTH, GAME_HEIGHT, DEFAULT_STARTING_LIVES, LIFE_LOSS_ANIMATION_DURATION } from '@config/constants';
import type { LevelConfig } from '@config/types';
import { SlashTrail } from '../entities/SlashTrail';
import { SpawnSystem } from '../systems/SpawnSystem';
import { SlashSystem } from '../systems/SlashSystem';
import { HUD } from '../ui/HUD';
import { ComboSystem } from '../systems/ComboSystem';
import { PowerUpManager } from '../managers/PowerUpManager';
import { WeaponManager } from '../managers/WeaponManager';
import { UpgradeManager } from '../managers/UpgradeManager';
import { LevelManager } from '../managers/LevelManager';
import { AudioManager } from '../managers/AudioManager';
import { EventBus } from '../utils/EventBus';
import type { Boss } from '../entities/Boss';
import { GraveTitan } from '../entities/GraveTitan';
import { HeadlessHorseman } from '../entities/HeadlessHorseman';
import { VampireLord } from '../entities/VampireLord';
import { PhantomKing } from '../entities/PhantomKing';
import { DemonOverlord } from '../entities/DemonOverlord';
import { ParticleSystem } from '../systems/ParticleSystem';
import { ComboEffectsManager } from '../managers/ComboEffectsManager';

export class GameplayScene extends BaseScene {
  private slashTrail!: SlashTrail;
  private spawnSystem!: SpawnSystem;
  private slashSystem!: SlashSystem;
  private hud!: HUD;
  private comboSystem!: ComboSystem;
  private powerUpManager!: PowerUpManager;
  private weaponManager!: WeaponManager;
  private upgradeManager!: UpgradeManager;
  private levelManager!: LevelManager;
  private particleSystem!: ParticleSystem;
  private comboEffectsManager!: ComboEffectsManager;

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
  private quotaMet: boolean = false;

  private pointerX: number = 0;
  private pointerY: number = 0;
  private previousPointerX: number = 0;
  private previousPointerY: number = 0;
  private isPointerDown: boolean = false;
  private lastPointerTime: number = 0;

  private lives: number = DEFAULT_STARTING_LIVES;
  private isGameOver: boolean = false;
  private gameOverTimer: number = 0;
  private isPaused: boolean = false;

  /**
   * Initialize gameplay scene
   * Sets up scene key for game mode
   * 
   * @example
   * ```typescript
   * // Start campaign level
   * this.scene.start('gameplay', { world: 1, level: 1 });
   * 
   * // Start endless mode
   * this.scene.start('gameplay');
   * ```
   */
  constructor() {
    super(SCENE_KEYS.gameplay);
  }

  /**
   * Create gameplay scene and initialize all game systems
   * Supports both campaign mode (with world/level data) and endless mode
   * 
   * @param data - Optional data containing world and level numbers for campaign mode
   * 
   * @example
   * ```typescript
   * // Campaign mode
   * create({ world: 1, level: 1 });
   * 
   * // Endless mode
   * create({});
   * ```
   */
  create(data: { world?: number; level?: number } = {}): void {
    try {
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
    this.slashEnergyManager = SlashEnergyManager.getInstance();
    this.slashEnergyManager.initialize(this);
    this.slashEnergyManager.setUpgradeManager(this.upgradeManager);

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
    this.particleSystem = new ParticleSystem(this);
    this.comboEffectsManager = new ComboEffectsManager(this);
    this.comboEffectsManager.setParticleSystem(this.particleSystem);
    this.hud = new HUD(this);

    // Connect systems
    this.slashSystem.setComboSystem(this.comboSystem);
    this.slashSystem.setPowerUpManager(this.powerUpManager);
    this.slashSystem.setWeaponManager(this.weaponManager);
    this.slashSystem.setUpgradeManager(this.upgradeManager);
    this.slashSystem.setParticleSystem(this.particleSystem);

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

      // Set up base event listeners (resize, orientation)
      super.setupEventListeners();

      // Set up game-specific event listeners
      this.setupGameEventListeners();

      debugLog('GameplayScene created - Phase 4 Campaign ready!');
    } catch (error) {
      const err = error as Error;
      debugError('[GameplayScene] Failed to create scene:', err);
      
      ErrorHandler.handle(err, {
        scene: this.scene.key,
        component: 'GameplayScene',
        action: 'create'
      });
      
      this.scene.start(SCENE_KEYS.error);
    }
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
        debugError(`[GameplayScene] Level ${this.currentWorld}-${this.currentLevel} not found`);
        return;
      }

      // Set level timer and kill quota
      this.levelTimer = 0;
      this.killQuota = this.currentLevelConfig.minKills;
      this.currentKills = 0;

      // Configure spawn system with level config
      this.spawnSystem.setLevelConfig(this.currentLevelConfig);

      // Show timer and kill quota in HUD
      this.hud.showTimer(true);
      this.hud.showKillQuota(true);
      this.hud.updateTimer(0, this.currentLevelConfig.duration);
      this.hud.updateKillQuota(0, this.killQuota);

      // Load world background
      this.loadWorldBackground();

      // Check if boss level
      if (this.currentLevelConfig.isBoss) {
        this.prepareBossSpawn();
      }

      debugLog(`[GameplayScene] Campaign mode: World ${this.currentWorld}, Level ${this.currentLevel}`);
    } catch (error) {
      debugError('[GameplayScene] Failed to setup campaign mode:', error);
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

    debugLog(`[GameplayScene] Preparing boss: ${bossId}`);
  }

  /**
   * Spawn boss for level 5
   */
  private spawnBoss(): void {
    if (this.bossSpawned || !this.currentLevelConfig) return;

    const bossId = this.currentLevelConfig?.bossId;
    if (!bossId) return;

    // Show boss announcement
    this.showBossAnnouncement();

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
        debugError(`[GameplayScene] Unknown boss ID: ${bossId}`);
        return;
    }

    // Get boss config
    const bossConfig = this.levelManager.getBossConfig(bossId);
    if (!bossConfig) return;

    // Spawn boss at top center (delayed after announcement)
    this.time.delayedCall(2000, () => {
      this.boss.spawn(GAME_WIDTH / 2, 150, bossConfig);
      this.hud.showBossHealthBar(true);

      // Set up boss damage listener
      EventBus.on('boss-hit', this.handleBossHit.bind(this));
      EventBus.on('boss-defeated', this.handleBossDefeated.bind(this));

      this.bossSpawned = true;
      debugLog(`[GameplayScene] Boss spawned: ${bossConfig.name}`);
    });
  }

  /**
   * Show boss announcement
   */
  private showBossAnnouncement(): void {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    // Darken background
    const overlay = this.add.rectangle(centerX, centerY, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7);
    overlay.setDepth(500);

    // Announcement text
    const text = this.add.text(centerX, centerY, 'BOSS INCOMING!', {
      fontSize: '72px',
      color: '#ff0000',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8,
    });
    text.setOrigin(0.5);
    text.setDepth(501);

    // Screen shake
    this.cameras.main.shake(500, 0.02);

    // Play sound
    const audioManager = (this as any).audioManager;
    if (audioManager) {
      audioManager.playSFX('uiClick');
    }

    // Fade out after 2 seconds
    this.tweens.add({
      targets: [overlay, text],
      alpha: 0,
      duration: 500,
      delay: 1500,
      onComplete: () => {
        overlay.destroy();
        text.destroy();
      },
    });
  }

  /**
   * Handle boss hit
   */
  private handleBossHit(data: any): void {
    if (!this.boss) return;

    // Update boss health bar
    this.hud.updateBossHealth(data.remainingHealth, data.maxHealth);
  }

  /**
   * Handle boss defeated
   */
  private handleBossDefeated(data: any): void {
    if (!this.boss) return;

    debugLog('[GameplayScene] Boss defeated!');

    // Hide boss health bar
    this.hud.showBossHealthBar(false);

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
      debugLog('[GameplayScene] Progression data loaded');
    } catch (error) {
      debugError('[GameplayScene] Failed to load progression data:', error);
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
   * Set up game-specific event listeners
   */
  private setupGameEventListeners(): void {
    // Listen for monster missed events
    EventBus.on('monster-missed', () => {
      this.loseLife();
    });

    // Listen for monster sliced events (award souls and track kills)
    EventBus.on('monster-sliced', (data: { souls: number; position: { x: number; y: number } }) => {
      // Award souls for the monster kill
      if (data.souls > 0) {
        const newTotal = this.saveManager.addSouls(data.souls);
        EventBus.emit('souls-updated', { souls: newTotal, delta: data.souls });

        // Show floating +souls text at monster death position
        this.createFloatingSoulsText(data.position.x, data.position.y, data.souls);
      }

      // Track kill quota in campaign mode
      if (this.isCampaignMode) {
        this.currentKills++;
        this.hud.updateKillQuota(this.currentKills, this.killQuota);
      }
    });
  }

  /**
   * Create floating +souls text animation at the specified position
   * @param x - X position of the text
   * @param y - Y position of the text
   * @param souls - Number of souls to display
   */
  private createFloatingSoulsText(x: number, y: number, souls: number): void {
    const textObj = this.add.text(
      x,
      y - 20,
      `+${souls} souls`,
      {
        fontSize: '24px',
        color: '#ffd700',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      },
    );
    textObj.setOrigin(0.5);
    textObj.setDepth(1000);

    // Animate text floating up and fading
    this.tweens.add({
      targets: textObj,
      y: y - 80,
      alpha: 0,
      duration: 1000,
      ease: 'Quad.easeOut',
      onComplete: () => {
        textObj.destroy();
      },
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

    this.updatePerformance(delta);

    // Update level timer in campaign mode
    if (this.isCampaignMode && this.currentLevelConfig) {
      this.levelTimer += delta / 1000;
      this.hud.updateTimer(this.levelTimer, this.currentLevelConfig.duration);

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

    // Update slash energy manager (handles regeneration)
    this.slashEnergyManager.update(time, delta);

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

    // Check if quota just met (one-time trigger)
    if (killsMet && !this.quotaMet && !this.currentLevelConfig.isBoss) {
      this.quotaMet = true;
      this.onKillQuotaMet();
    }

    // Normal levels: Timer reaches duration AND kill quota met
    // Boss levels: Boss defeated (handled in handleBossDefeated)
    if (!this.currentLevelConfig.isBoss && timeElapsed >= duration && killsMet) {
      this.onLevelComplete();
    }
  }

  /**
   * Handle kill quota met
   */
  private onKillQuotaMet(): void {
    // Flash kill quota text green
    if ((this.hud as any)['killQuotaText']) {
      this.tweens.add({
        targets: (this.hud as any)['killQuotaText'],
        tint: 0x44ff44,
        duration: 200,
        yoyo: true,
        repeat: 2,
      });
    }

    // Play sound
    const audioManager = (this as any).audioManager;
    if (audioManager) {
      audioManager.playSFX('uiClick');
    }
  }

  /**
   * Handle level completion
   */
  private onLevelComplete(): void {
    if (!this.currentLevelConfig) return;

    debugLog(`[GameplayScene] Level ${this.currentWorld}-${this.currentLevel} complete!`);

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

    // Get previous stars for improvement tracking (before completing level)
    const levelId = `${this.currentWorld}-${this.currentLevel}`;
    const previousStars = this.levelManager.getLevelStars(this.currentWorld, this.currentLevel);

    // Complete level and calculate stars
    const stars = this.levelManager.completeLevel(this.currentWorld, this.currentLevel, finalStats.score);

    // Emit level complete event
    EventBus.emit('level-complete', {
      levelId: levelId,
      score: finalStats.score,
      souls: finalStats.souls,
      stars,
      stats: finalStats,
    });

    // Save game state
    this.saveManager.save();

    // Reset combo and clear milestones before transitioning
    // (max combo is already captured in finalStats)
    this.comboSystem.reset();
    this.comboSystem.resetMilestones();

    // Transition to level complete scene
    this.scene.start(SCENE_KEYS.levelComplete, {
      world: this.currentWorld,
      level: this.currentLevel,
      score: finalStats.score,
      souls: finalStats.souls,
      stars,
      previousStars,
      stats: finalStats,
    });
  }

  /**
   * Handle input
   * @param delta - Time since last update
   */
  private handleInput(delta: number): void {
    if (!this.isPointerDown) {
      return;
    }

    // Perform slashing only if we have enough energy
    if (!this.slashEnergyManager.canSlash()) {
      return;
    }

    // Update slash trail
    this.slashTrail.update(this.pointerX, this.pointerY, delta);

    // Calculate distance moved
    const distance = Phaser.Math.Distance.Between(
      this.previousPointerX,
      this.previousPointerY,
      this.pointerX,
      this.pointerY
    );

    // Update previous position
    this.previousPointerX = this.pointerX;
    this.previousPointerY = this.pointerY;

    // Consume energy for the slash
    this.slashEnergyManager.consumeEnergy(distance);
  }

  /**
   * Check for missed monsters
   */
  private checkMissedMonsters(activeMonsters: any[]): void {
    for (const monster of activeMonsters) {
      if (monster.y > GAME_HEIGHT) {
        // Monster fell off screen
        monster.destroy();
        EventBus.emit('monster-missed');
      }
    }
  }

  /**
   * Lose a life
   */
  private loseLife(): void {
    this.lives--;
    this.hud.updateLives(this.lives);

    // Enhanced visual feedback
    this.createLifeLossFeedback();

    if (this.lives <= 0) {
      this.gameOver();
    }
  }

  /**
   * Create visual feedback for life loss
   */
  private createLifeLossFeedback(): void {
    // Red screen flash
    const flash = this.add.graphics();
    flash.fillStyle(0xff0000, 0.5);
    flash.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    flash.setDepth(2000);

    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        flash.destroy();
      },
    });

    // Reset combo and clear milestones (preserve max combo for stats display)
    this.comboSystem.reset();
    this.comboSystem.resetMilestones();

    // Dramatic pause before showing game over
    this.time.delayedCall(1000, () => {
      this.showGameOver();
    });
  }

  /**
   * Game over
   */
  private gameOver(): void {
    this.isGameOver = true;
    this.isPaused = false;

    const playerStats = this.upgradeManager.getPlayerStats();
    const startingLives = Math.floor(playerStats.startingLives);

    const finalStats = {
      score: this.slashSystem.getScore(),
      souls: this.slashSystem.getSouls(),
      monstersSliced: this.slashSystem.getMonstersSliced(),
      villagersSliced: this.slashSystem.getVillagersSliced(),
      powerUpsCollected: this.slashSystem.getPowerUpsCollected(),
      maxCombo: this.comboSystem.getMaxCombo(),
      timeElapsed: this.spawnSystem.getElapsedTime(),
      startingLives,
      lives: this.lives,
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
    // Full combo reset: clears combo, max combo, and milestone tracking
    this.comboSystem.fullReset();
    this.powerUpManager.reset();
    this.slashEnergyManager.reset();
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

    // Show game over screen after brief delay
    this.gameOverTimer = 0;
  }

  /**
   * Handle game over update
   */
  private togglePause(): void {
    if (this.isGameOver) return;

    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      // Pause combo timer
      this.comboSystem.setPaused(true);

      // Pause physics
      this.physics.pause();

      // Open pause scene
      this.scene.pause();
      this.scene.launch(SCENE_KEYS.pause, {
        levelId: this.isCampaignMode ? `${this.currentWorld}-${this.currentLevel}` : null,
      });
    } else {
      // Resume combo timer
      this.comboSystem.setPaused(false);

      // Resume physics
      this.physics.resume();
    }
  }

  /**
   * Restart the game
   */
  public resume(): void {
    this.isPaused = false;

    // Resume combo timer
    this.comboSystem.setPaused(false);

    // Resume physics
    this.physics.resume();
  }

  /**
   * Toggle pause
   */
  private togglePause(): void {
    this.isPaused = !this.isPaused;
    this.hud.updatePauseState(this.isPaused);

    if (this.isPaused) {
      EventBus.emit('game-paused');
    } else {
      EventBus.emit('game-resumed');
    }
  }

  /**
   * Shutdown the scene
   */
  shutdown(): void {
    // Clean up event listeners
    EventBus.off('monster-missed');
    EventBus.off('monster-sliced');
    EventBus.off('boss-hit');
    EventBus.off('boss-defeated');

    // Full reset combo system (clears combo, max combo, and milestones)
    // This ensures clean state when returning to this scene
    this.comboSystem.fullReset();

    // Destroy all systems
    this.slashTrail.destroy();
    this.spawnSystem.destroy();
    this.slashSystem.destroy();
    this.hud.destroy();
    this.particleSystem.destroy();
    this.comboEffectsManager.destroy();

    // Destroy boss if exists
    if (this.boss) {
      this.boss.destroy();
      this.boss = null;
    }
  }
}
