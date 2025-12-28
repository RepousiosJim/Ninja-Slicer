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
  
  // System events
  saveCompleted: 'save-completed',
  settingsChanged: 'settings-changed',
} as const;
