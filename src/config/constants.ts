/**
 * Monster Slayer - Game Constants
 * Central location for all game configuration values
 */

// Import theme for color references
import { DARK_GOTHIC_THEME } from './theme';

// =============================================================================
// GAME SETTINGS
// =============================================================================

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const GAME_TITLE = 'Monster Slayer';

// Screen boundaries
export const SCREEN_TOP_Y = -50;
export const SCREEN_BOTTOM_Y = 800;
export const SCREEN_LEFT_X = -50;
export const SCREEN_RIGHT_X = 1330;

// Entity bounds for collision checking
export const ENTITY_BOUNDS = {
  top: -50,
  bottom: 800,
} as const;

// Spawn ranges
export const SPAWN_RANGES = {
  xMin: 100,
  xMax: 1180,
  ySpawn: 750,
  targetXMin: 200,
  targetXMax: 1080,
  targetYMin: 100,
  targetYMax: 400,
} as const;

// Visual effect durations
export const EFFECT_DURATIONS = {
  flashFade: 50,
  textFloat: 800,
  burstFade: 200,
  pulse: 500,
} as const;

// Visual effect sizes
export const EFFECT_SIZES = {
  hitFlashRadius: 50,
  burstRadius: 60,
  textOffset: 50,
  textFloatDistance: 100,
} as const;

// =============================================================================
// PHYSICS
// =============================================================================

export const GRAVITY = 800;
export const MONSTER_LAUNCH_MIN_VELOCITY_Y = -600;
export const MONSTER_LAUNCH_MAX_VELOCITY_Y = -800;
export const MONSTER_LAUNCH_VELOCITY_X_RANGE = 200; // +/- from center

// =============================================================================
// SLASH SYSTEM
// =============================================================================

export const SLASH_VELOCITY_THRESHOLD = 100; // pixels per second to register slash (lowered for easier activation)
export const SLASH_TRAIL_MAX_LENGTH = 20; // max points in trail (increased for longer trail)
export const SLASH_TRAIL_FADE_RATE = 0.15; // alpha reduction per frame
export const SLASH_TRAIL_WIDTH = 12; // Thicker trail
export const SLASH_TRAIL_GLOW_WIDTH = 24; // Thicker glow
export const SLASH_HITBOX_RADIUS = 30; // base radius for hit detection

// =============================================================================
// MONSTERS
// =============================================================================

export const MONSTER_HITBOX_RADIUS = {
  zombie: 40,
  vampire: 35,
  ghost: 35,
  villager: 35,
} as const;

export const MONSTER_BASE_SPEED = {
  zombie: 1.0,
  vampire: 1.4,
  ghost: 1.2,
} as const;

export const MONSTER_BASE_POINTS = {
  zombie: 10,
  vampire: 15,
  ghost: 20,
} as const;

export const MONSTER_SOULS = {
  zombie: 5,
  vampire: 8,
  ghost: 10,
} as const;

// Villager hitbox radius
export const VILLAGER_HITBOX_RADIUS = 35;

// Power-up hitbox radius
export const POWERUP_HITBOX_RADIUS = 30;

// Ghost visibility timing
export const GHOST_VISIBLE_DURATION = 2.0; // seconds
export const GHOST_INVISIBLE_DURATION = 1.0; // seconds
export const GHOST_FADE_DURATION = 0.3; // seconds

// =============================================================================
// VILLAGERS
// =============================================================================

export const VILLAGER_PENALTY = 100; // points deducted
export const VILLAGER_SPEED_MULTIPLIER = 0.7; // slower than monsters

// =============================================================================
// LIVES & GAME OVER
// =============================================================================

export const DEFAULT_STARTING_LIVES = 3;
export const MAX_LIVES = 10;

// =============================================================================
// COMBO SYSTEM
// =============================================================================

export const COMBO_TIMEOUT = 2.0; // seconds before combo resets
export const COMBO_MULTIPLIER_RATE = 0.1; // +0.1x per combo
export const COMBO_MILESTONES = [5, 10, 15, 20, 25, 30, 40, 50, 75, 100];

// =============================================================================
// POWER-UPS
// =============================================================================

export const POWERUP_BASE_SPAWN_INTERVAL = 18; // seconds

export const POWERUP_SLOW_MOTION = {
  duration: 5.0,
  timeScale: 0.5,
} as const;

export const POWERUP_FRENZY = {
  duration: 8.0,
  scoreMultiplier: 2.0,
} as const;

export const POWERUP_SHIELD = {
  duration: 30.0, // max duration if not used
} as const;

export const POWERUP_SOUL_MAGNET = {
  duration: 10.0,
  soulMultiplier: 1.5,
} as const;

// =============================================================================
// DIFFICULTY SCALING
// =============================================================================

export const DIFFICULTY = {
  worldMultiplier: 1.5,
  levelMultiplier: 0.3,
  bossBonus: 2.0,
  spawnRateScale: 0.15,
  speedScale: 0.04,
} as const;

// Endless mode scaling
export const ENDLESS_SCALING = {
  scorePerDifficultyIncrease: 1000,
  maxSpawnRateMultiplier: 3.0,
  maxSpeedMultiplier: 2.0,
  maxVillagerChance: 0.10,
} as const;

// =============================================================================
// ECONOMY
// =============================================================================

export const LEVEL_COMPLETE_SOULS = {
  base: 50,
  perWorld: 20,
} as const;

export const BOSS_DEFEAT_SOULS = {
  base: 100,
  perWorld: 50,
} as const;

export const STAR_BONUS_MULTIPLIER = {
  1: 1.0,
  2: 1.15,
  3: 1.25,
} as const;

// =============================================================================
// BOSSES
// =============================================================================

export const BOSS_PHASE_THRESHOLDS = [1.0, 0.66, 0.33]; // health percentages
export const BOSS_INVULNERABLE_DURATION = 1.0; // seconds after phase change
export const BOSS_MINION_SPAWN_DELAY = 3.0; // seconds between minion waves

// =============================================================================
// UI
// =============================================================================

export const UI_ANIMATION_DURATION = 200; // ms
export const SCREEN_SHAKE_DURATION = 100; // ms
export const SCREEN_SHAKE_INTENSITY = 10; // pixels
export const LIFE_LOSS_ANIMATION_DURATION = 800; // ms for life loss text animation

export const COLORS = {
  // Reference theme colors for consistency
  primary: DARK_GOTHIC_THEME.colors.primary, // dark red
  secondary: DARK_GOTHIC_THEME.colors.secondary, // dark purple
  accent: DARK_GOTHIC_THEME.colors.accent, // gold
  background: DARK_GOTHIC_THEME.colors.background, // dark blue-gray
  text: DARK_GOTHIC_THEME.colors.text,
  textSecondary: DARK_GOTHIC_THEME.colors.textSecondary,
  danger: DARK_GOTHIC_THEME.colors.danger,
  success: DARK_GOTHIC_THEME.colors.success,
  warning: DARK_GOTHIC_THEME.colors.warning,
  // Extended palette
  bloodRed: DARK_GOTHIC_THEME.colors.bloodRed,
  vampirePurple: DARK_GOTHIC_THEME.colors.vampirePurple,
  ghostlyBlue: DARK_GOTHIC_THEME.colors.ghostlyBlue,
  demonGreen: DARK_GOTHIC_THEME.colors.demonGreen,
  holyWhite: DARK_GOTHIC_THEME.colors.holyWhite,
} as const;

export const FONT_SIZES = {
  small: 16,
  medium: 24,
  large: 32,
  xlarge: 48,
  title: 64,
} as const;

// =============================================================================
// AUDIO
// =============================================================================

export const AUDIO_VOLUME = {
  master: 1.0,
  sfx: 0.8,
  music: 0.5,
} as const;

// =============================================================================
// SAVE SYSTEM
// =============================================================================

export const SAVE_KEY = 'monster_slayer_save';
export const SETTINGS_KEY = 'monster_slayer_settings';
export const SAVE_VERSION = 1;

// =============================================================================
// LEADERBOARD
// =============================================================================

export const LEADERBOARD_DISPLAY_LIMIT = 100;
export const LEADERBOARD_PERSONAL_LIMIT = 10;

// =============================================================================
// SPAWN PATTERNS
// =============================================================================

export const SPAWN_PATTERNS = {
  default: {
    spawnFromBottom: true,
    spawnFromSides: false,
    spawnFromTop: false,
  },
  ghost_realm: {
    spawnFromBottom: true,
    spawnFromSides: true,
    spawnFromTop: true, // ghosts float down from top
  },
} as const;

// =============================================================================
// ASSET KEYS
// =============================================================================

export const TEXTURE_KEYS = {
  // Monsters
  zombie: 'monster_zombie',
  vampire: 'monster_vampire',
  ghost: 'monster_ghost',
  
  // Bosses
  graveTitan: 'boss_grave_titan',
  headlessHorseman: 'boss_headless_horseman',
  vampireLord: 'boss_vampire_lord',
  phantomKing: 'boss_phantom_king',
  demonOverlord: 'boss_demon_overlord',
  
  // Villagers
  villager1: 'villager_1',
  villager2: 'villager_2',
  villager3: 'villager_3',
  
  // Power-ups
  slowMotion: 'powerup_slow_motion',
  frenzy: 'powerup_frenzy',
  shield: 'powerup_shield',
  soulMagnet: 'powerup_soul_magnet',
  
   // Weapons
   basicSword: 'weapon_basic_sword',
   silverBlade: 'weapon_silver_blade',
   shadowBlade: 'weapon_shadow_blade',
   holyCrossBlade: 'weapon_holy_cross_blade',
   fireSword: 'weapon_fire_sword',
   iceBlade: 'weapon_ice_blade',
   lightningKatana: 'weapon_lightning_katana',
  
  // UI
  buttonNormal: 'ui_button_normal',
  buttonHover: 'ui_button_hover',
  buttonPressed: 'ui_button_pressed',
  heartFull: 'ui_heart_full',
  heartEmpty: 'ui_heart_empty',
  starFull: 'ui_star_full',
  starEmpty: 'ui_star_empty',
  soulIcon: 'ui_soul_icon',
  lockIcon: 'ui_lock_icon',
  
  // Backgrounds
  bgGraveyard: 'bg_graveyard',
  bgVillage: 'bg_village',
  bgCastle: 'bg_castle',
  bgGhostRealm: 'bg_ghost_realm',
  bgHell: 'bg_hell',
  bgMenu: 'bg_menu',
} as const;

export const AUDIO_KEYS = {
  // SFX
  slash1: 'sfx_slash_1',
  slash2: 'sfx_slash_2',
  slash3: 'sfx_slash_3',
  slash4: 'sfx_slash_4',
  slash5: 'sfx_slash_5',
  zombieDeath: 'sfx_zombie_death',
  vampireDeath: 'sfx_vampire_death',
  ghostDeath: 'sfx_ghost_death',
  villagerScream: 'sfx_villager_scream',
  powerUp: 'sfx_powerup',
  bossHit: 'sfx_boss_hit',
  bossDeath: 'sfx_boss_death',
  uiClick: 'sfx_ui_click',
  uiHover: 'sfx_ui_hover',
  combo: 'sfx_combo',
  levelComplete: 'sfx_level_complete',
  gameOver: 'sfx_game_over',
  
  // Music
  menuMusic: 'music_menu',
} as const;

// =============================================================================
// SCENE KEYS
// =============================================================================

export const SCENE_KEYS = {
  boot: 'BootScene',
  preloader: 'PreloaderScene',
  mainMenu: 'MainMenuScene',
  worldSelect: 'WorldSelectScene',
  levelSelect: 'LevelSelectScene',
  gameplay: 'GameplayScene',
  endlessGameplay: 'EndlessGameplayScene',
  character: 'CharacterScene',
  inventory: 'InventoryScene',
  shop: 'ShopScene',
  leaderboard: 'LeaderboardScene',
  settings: 'SettingsScene',
  pause: 'PauseScene',
  levelComplete: 'LevelCompleteScene',
  gameOver: 'GameOverScene',
  testWeapon: 'TestWeaponScene',
  updates: 'UpdatesScene',
  campaignComplete: 'CampaignCompleteScene',
  error: 'ErrorScene',
} as const;

// =============================================================================
// SLASH ENERGY SYSTEM
// =============================================================================

export const SLASH_ENERGY = {
  maxEnergy: 100, // maximum energy capacity
  baseCostPerDistance: 0.1, // energy cost per pixel of slash distance
  minCostPerSlash: 5, // minimum energy cost per slash
  regenRatePerSecond: 10, // energy regeneration rate per second
  regenDelay: 0.5, // seconds to wait before regeneration starts
  lowEnergyThreshold: 25, // percentage below which energy is considered low
  minEffectiveness: 0.3, // minimum damage/score multiplier at zero energy
} as const;

// =============================================================================
// SLASH POWER/CHARGE SYSTEM
// =============================================================================

export const SLASH_POWER = {
  chargeTimePerLevel: 0.5, // seconds to charge each power level
  maxPowerLevel: 3, // maximum power level (HIGH)
} as const;

export const SLASH_POWER_DAMAGE_MULTIPLIERS = {
  0: 1.0, // NONE - normal damage
  1: 1.25, // LOW - 25% bonus
  2: 1.5, // MEDIUM - 50% bonus
  3: 2.0, // HIGH - 100% bonus
} as const;

export const SLASH_POWER_SCORE_MULTIPLIERS = {
  0: 1.0, // NONE - normal score
  1: 1.15, // LOW - 15% bonus
  2: 1.35, // MEDIUM - 35% bonus
  3: 1.75, // HIGH - 75% bonus
} as const;

export const SLASH_POWER_WIDTH_MULTIPLIERS = {
  0: 1.0, // NONE - normal width
  1: 1.15, // LOW - 15% wider
  2: 1.35, // MEDIUM - 35% wider
  3: 1.6, // HIGH - 60% wider
} as const;

// Power level visual colors (for trail effects)
export const SLASH_POWER_COLORS = {
  0: { color: 0xffffff, glow: 0xffffff }, // NONE - white/default
  1: { color: 0xffff00, glow: 0xffffaa }, // LOW - yellow
  2: { color: 0xff8c00, glow: 0xffcc00 }, // MEDIUM - orange
  3: { color: 0xff0000, glow: 0xff4400 }, // HIGH - red
} as const;

// =============================================================================
// SLASH PATTERN RECOGNITION
// =============================================================================

export const SLASH_PATTERN = {
  minPointsForDetection: 8, // minimum trail points to attempt pattern detection
  minPointsRequired: 8, // alias for compatibility
  patternTimeout: 1.5, // seconds before pattern detection resets
  patternTimeoutMs: 1500, // timeout in milliseconds
  minPointDistance: 10, // minimum distance between points for pattern detection
  simplificationEpsilon: 2.0, // Douglas-Peucker simplification tolerance
  // Circle detection
  circleClosureThreshold: 50, // max distance between start and end points for circle
  circleMinRadius: 40, // minimum radius for valid circle
  circleMaxRadiusVariance: 0.35, // max variance from mean radius (35%)
  circleVarianceThreshold: 0.35, // alias for compatibility
  // Zigzag detection
  zigzagMinDirectionChanges: 3, // minimum direction changes for zigzag
  zigzagAngleThreshold: 60, // degrees - minimum angle change for direction switch
  zigzagMinSegmentLength: 30, // minimum length per zigzag segment
  // Straight line detection
  straightLineMaxDeviation: 15, // max perpendicular distance from ideal line
  straightLineMinLength: 150, // minimum length for straight line recognition
  // Horizontal line detection
  horizontalAngleTolerance: 30, // degrees from horizontal
  horizontalMinLength: 150, // minimum length
  horizontalVarianceThreshold: 15, // max deviation from line
  // Vertical line detection
  verticalAngleTolerance: 30, // degrees from vertical
  verticalMinLength: 150, // minimum length
  verticalVarianceThreshold: 15, // max deviation from line
  // Slash patterns
  slashAngleTolerance: 25, // degrees from diagonal
  slashMinLength: 100, // minimum length for slash pattern
} as const;

// Pattern bonus values
export const SLASH_PATTERN_BONUSES = {
  none: {
    scoreMultiplier: 1.0,
    bonusScore: 0,
    damageMultiplier: 1.0,
  },
  circle: {
    scoreMultiplier: 2.0, // double score for circle
    bonusScore: 100, // flat bonus
    damageMultiplier: 1.5, // 50% more damage
    effectDescription: 'Area damage burst',
  },
  zigzag: {
    scoreMultiplier: 1.75, // 75% more score
    bonusScore: 75, // flat bonus
    damageMultiplier: 1.3, // 30% more damage
    effectDescription: 'Multi-hit combo',
  },
  straight: {
    scoreMultiplier: 1.5, // 50% more score
    bonusScore: 50, // flat bonus
    damageMultiplier: 2.0, // double damage (precision strike)
    effectDescription: 'Piercing strike',
  },
  horizontal: {
    scoreMultiplier: 1.3, // 30% more score
    bonusScore: 30, // flat bonus
    damageMultiplier: 1.2, // 20% more damage
    effectDescription: 'Horizontal sweep',
  },
  vertical: {
    scoreMultiplier: 1.3, // 30% more score
    bonusScore: 30, // flat bonus
    damageMultiplier: 1.2, // 20% more damage
    effectDescription: 'Vertical strike',
  },
  slash_down: {
    scoreMultiplier: 1.4, // 40% more score
    bonusScore: 40, // flat bonus
    damageMultiplier: 1.3, // 30% more damage
    effectDescription: 'Downward slash',
  },
  slash_up: {
    scoreMultiplier: 1.4, // 40% more score
    bonusScore: 40, // flat bonus
    damageMultiplier: 1.3, // 30% more damage
    effectDescription: 'Upward slash',
  },
} as const;

// Pattern visual feedback timing
export const SLASH_PATTERN_VISUAL = {
  confirmationDuration: 0.8, // seconds to show pattern confirmation
  flashCount: 3, // number of flashes for pattern confirmation
  flashInterval: 0.1, // seconds between flashes
} as const;

// =============================================================================
// EVENTS
// =============================================================================

export const EVENTS = {
  // Gameplay events
  monsterSliced: 'monster-sliced',
  villagerSliced: 'villager-sliced',
  monsterMissed: 'monster-missed',
  powerUpCollected: 'powerup-collected',
  powerUpActivated: 'powerup-activated',
  powerUpEnded: 'powerup-ended',
  bossHit: 'boss-hit',
  bossPhaseChange: 'boss-phase-change',
  bossDefeated: 'boss-defeated',
  
  // State events
  scoreUpdated: 'score-updated',
  soulsUpdated: 'souls-updated',
  comboUpdated: 'combo-updated',
  livesChanged: 'lives-changed',
  levelComplete: 'level-complete',
  gameOver: 'game-over',
  slashEnergyChanged: 'slash-energy-changed',
  slashEnergyDepleted: 'slash-energy-depleted',
  slashEnergyLow: 'slash-energy-low',
  slashPowerChanged: 'slash-power-changed',
  slashPatternDetected: 'slash-pattern-detected',
  
  // System events
  saveCompleted: 'save-completed',
  settingsChanged: 'settings-changed',
} as const;