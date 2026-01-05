  
/**
 * Monster Slayer - TypeScript Type Definitions
 * Central location for all game interfaces and types
 */

// =============================================================================
// ENUMS
// =============================================================================

 
export enum MonsterType {
  ZOMBIE = 'zombie',
  VAMPIRE = 'vampire',
  GHOST = 'ghost',
}

export enum PowerUpType {
  SLOW_MOTION = 'slow_motion',
  FRENZY = 'frenzy',
  SHIELD = 'shield',
  SOUL_MAGNET = 'soul_magnet',
}

export enum WeaponId {
  BASIC_SWORD = 'basic_sword',
  SILVER_BLADE = 'silver_blade',
  SHADOW_BLADE = 'shadow_blade',
  HOLY_CROSS_BLADE = 'holy_cross_blade',
  FIRE_SWORD = 'fire_sword',
  ICE_BLADE = 'ice_blade',
  LIGHTNING_KATANA = 'lightning_katana',
}

export enum UpgradeId {
  SLASH_WIDTH = 'slash_width',
  EXTRA_LIVES = 'extra_lives',
  SCORE_MULTIPLIER = 'score_multiplier',
  SLOW_MOTION_DURATION = 'slow_motion_duration',
  CRITICAL_HIT = 'critical_hit',
}

export enum GameState {
  PLAYING = 'playing',
  PAUSED = 'paused',
  BOSS_INTRO = 'boss_intro',
  BOSS_FIGHT = 'boss_fight',
  LEVEL_COMPLETE = 'level_complete',
  GAME_OVER = 'game_over',
}

export enum SpawnPattern {
  DEFAULT = 'default',
  GHOST_REALM = 'ghost_realm',
}

export enum WeaponRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

export enum SlashPowerLevel {
  NONE = 0,
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
}

export enum SlashPatternType {
  NONE = 'none',
  CIRCLE = 'circle',
  ZIGZAG = 'zigzag',
  STRAIGHT = 'straight',
  HORIZONTAL = 'horizontal',
  VERTICAL = 'vertical',
  SLASH_DOWN = 'slash_down',
  SLASH_UP = 'slash_up',
}
 

// =============================================================================
// SAVE DATA
// =============================================================================

export interface TestWeaponResult {
  weaponId: string;
  tier: number;
  timestamp: number;
  results: {
    damageDealt: number;
    comboCount: number;
    hits: number;
    misses: number;
    accuracy: number;
    testDuration: number;
  };
}

export interface GameSave {
  version: number;
  souls: number;
  unlockedWeapons: string[];
  weaponTiers: Record<string, number>;
  equippedWeapon: string;
  upgrades: Record<string, number>;
  completedLevels: string[];
  levelStars: Record<string, number>;
  highScores: Record<string, number>;
  levelAttempts: Record<string, number>;
  settings: GameSettings;
  personalBests: ScoreEntry[];
  playerName: string | null;
  createdAt: string;
  updatedAt: string;
  lastShopVisit?: string; // ISO timestamp of last shop visit
  weaponUnlockTimes: Record<string, string>; // ISO timestamp of weapon unlock
  testResults?: TestWeaponResult[];
  // New statistics tracking fields
  totalSoulsEarned: number;
  playTimeMs: number;
  weaponUsageHistory: Record<string, number>;
  totalMonstersDefeated: number;
  maxComboEver: number;
  dailyChallenges?: Record<string, DailyChallenge>;
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  soundVolume: number;
  musicVolume: number;
  sfxVolume: number;
  sfxEnabled: boolean;
  cloudSaveEnabled: boolean;
  uiScale: 'small' | 'medium' | 'large';
  highContrastMode: boolean;
  reducedMotionMode: boolean;
  quality: 'low' | 'medium' | 'high';
}

export interface ScoreEntry {
  score: number;
  date: string;
  weapon: string;
  monstersSliced: number;
  maxCombo: number;
  timeElapsed: number;
}

// =============================================================================
// LEVEL CONFIGURATION
// =============================================================================

export interface LevelConfig {
  id: string;
  world: number;
  level: number;
  name: string;
  description: string;
  duration: number;
  minKills: number;
  spawnRate: number;
  monsterWeights: MonsterWeights;
  villagerChance: number;
  powerUpInterval: number;
  isBoss: boolean;
  bossId?: string;
  bossHealth?: number;
  monsterHealth?: MonsterHealthConfig;
  spawnPattern?: SpawnPattern;
  starThresholds: [number, number, number];
}

export interface MonsterWeights {
  zombie: number;
  vampire: number;
  ghost: number;
}

export interface MonsterHealthConfig {
  zombie: number;
  vampire: number;
  ghost: number;
}

export interface WorldConfig {
  id: number;
  name: string;
  description: string;
  theme: string;
  backgroundKey: string | null;
  unlockRequirement: string | null;
  spawnPattern: SpawnPattern;
  isPlaceholder?: boolean;
}

export interface BossConfig {
  id: string;
  name: string;
  description: string;
  health: number;
  phases: BossPhase[];
  soulsReward: number;
}

export interface BossPhase {
  healthThreshold: number;
  attackPattern: string;
  minionSpawnRate: number;
  minionType?: MonsterType;
  minionTypes?: MonsterType[];
  cloneCount?: number;
}

// =============================================================================
// WEAPONS
// =============================================================================

export interface WeaponConfig {
  id: string;
  name: string;
  description: string;
  rarity: WeaponRarity;
  unlockCost: number;
  isStarter: boolean;
  trailColor: string;
  trailGlow: string;
  effectiveAgainst: MonsterType | null;
  tiers: WeaponTier[];
}

export interface WeaponTier {
  tier: number;
  upgradeCost: number;
  effects: WeaponEffect[];
  description: string;
}

export interface WeaponEffect {
  type: WeaponEffectType;
  value?: number;
  target?: MonsterType;
  duration?: number;
  description: string;
  // Type-specific properties
  ticks?: number;
  damagePerTick?: number;
  tickInterval?: number;
  radius?: number;
  damage?: number;
  chainCount?: number;
  chainRadius?: number;
  chainDamage?: number;
  stunDuration?: number;
  freezeDuration?: number;
}

export type WeaponEffectType =
  | 'slash_width'
  | 'bonus_damage'
  | 'stun'
  | 'ghost_visibility'
  | 'proximity_reveal'
  | 'damage_over_time'
  | 'spread_damage'
  | 'slow'
  | 'freeze_chance'
  | 'chain_damage'
  | 'chain_stun'
  | 'critical_hit_chance';

// =============================================================================
// UPGRADES
// =============================================================================

export interface UpgradeConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  maxTier: number;
  baseCost: number;
  costMultiplier: number;
  baseValue: number;
  valuePerTier: number;
  valueType: 'multiplier' | 'additive';
  tiers: UpgradeTier[];
  totalCost: number;
  critMultiplier?: number;
}

export interface UpgradeTier {
  tier: number;
  cost: number;
  value: number;
  description: string;
}

// =============================================================================
// GAMEPLAY
// =============================================================================

export interface SlashPoint {
  x: number;
  y: number;
  timestamp: number;
  alpha: number;
}

export interface SlashResult {
  hit: boolean;
  target?: MonsterType | 'villager' | 'powerup' | 'boss';
  position?: { x: number; y: number };
  damage?: number;
  isCritical?: boolean;
  points?: number;
  souls?: number;
}

export interface SpawnConfig {
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  monsterType: MonsterType;
  health: number;
}

export interface ComboState {
  count: number;
  multiplier: number;
  lastSliceTime: number;
  isActive: boolean;
}

export interface PowerUpState {
  type: PowerUpType;
  active: boolean;
  remainingDuration: number;
  totalDuration: number;
}

export interface GameplayState {
  score: number;
  souls: number;
  lives: number;
  combo: ComboState;
  activePowerUps: PowerUpState[];
  monstersSliced: number;
  maxCombo: number;
  timeElapsed: number;
  killsThisLevel: number;
}

// =============================================================================
// SLASH MECHANICS
// =============================================================================

export interface SlashEnergyState {
  current: number;
  max: number;
  regenRate: number;
  isRegenerating: boolean;
  lastDepletionTime: number;
}

export interface SlashPowerState {
  level: SlashPowerLevel;
  chargeStartTime: number;
  chargeProgress: number;
  isCharging: boolean;
}

export interface SlashPatternPoint {
  x: number;
  y: number;
  timestamp: number;
}

export interface SlashPatternState {
  points: SlashPatternPoint[];
  detectedPattern: SlashPatternType;
  patternStartTime: number;
  isDetecting: boolean;
}

export interface SlashPatternResult {
  pattern: SlashPatternType;
  type: SlashPatternType; // alias for compatibility
  confidence: number;
  difficulty: number; // 1-5 scale
  points: SlashPatternPoint[];
  center?: Vector2;
  radius?: number;
  directionChanges?: number;
  straightLineDeviation?: number;
}

export interface SlashMechanicsState {
  energy: SlashEnergyState;
  power: SlashPowerState;
  pattern: SlashPatternState;
}

export interface SlashEnergyConfig {
  maxEnergy: number;
  baseCostPerDistance: number;
  minCostPerSlash: number;
  regenRatePerSecond: number;
  regenDelay: number;
  lowEnergyThreshold: number;
  minEffectiveness: number;
}

export interface SlashPowerConfig {
  chargeTimePerLevel: number;
  maxPowerLevel: SlashPowerLevel;
  damageMultipliers: Record<SlashPowerLevel, number>;
  scoreMultipliers: Record<SlashPowerLevel, number>;
  widthMultipliers: Record<SlashPowerLevel, number>;
}

export interface SlashPatternConfig {
  minPointsForDetection: number;
  patternTimeout: number;
  circleClosureThreshold: number;
  circleMinRadius: number;
  zigzagMinDirectionChanges: number;
  zigzagAngleThreshold: number;
  straightLineMaxDeviation: number;
  straightLineMinLength: number;
}

export interface SlashMechanicsConfig {
  energy: SlashEnergyConfig;
  power: SlashPowerConfig;
  pattern: SlashPatternConfig;
}

// =============================================================================
// EVENTS
// =============================================================================

export interface MonsterSlicedEvent {
  monsterType: MonsterType;
  position: { x: number; y: number };
  points: number;
  souls: number;
  isCritical: boolean;
  comboCount: number;
}

export interface VillagerSlicedEvent {
  position: { x: number; y: number };
  penalty: number;
}

export interface BossHitEvent {
  bossId: string;
  damage: number;
  remainingHealth: number;
  maxHealth: number;
  phase: number;
}

export interface LevelCompleteEvent {
  levelId: string;
  score: number;
  souls: number;
  stars: number;
  stats: GameplayStats;
  isNewHighScore: boolean;
}

export interface GameOverEvent {
  score: number;
  souls: number;
  stats: GameplayStats;
  isEndless: boolean;
}

export interface GameplayStats {
  monstersSliced: number;
  maxCombo: number;
  timeElapsed: number;
  accuracy: number;
  zombiesSliced: number;
  vampiresSliced: number;
  ghostsSliced: number;
  villagersSliced: number;
  powerUpsCollected: number;
}

export interface SlashEnergyChangedEvent {
  current: number;
  max: number;
  percentage: number;
  isLow: boolean;
  isDepleted: boolean;
}

export interface SlashPowerChangedEvent {
  level: SlashPowerLevel;
  previousLevel: SlashPowerLevel;
  chargeProgress: number;
  isFullyCharged: boolean;
}

export interface SlashPatternDetectedEvent {
  pattern: SlashPatternType;
  confidence: number;
  position: Vector2;
  bonusScore: number;
  bonusMultiplier: number;
}

// =============================================================================
// LEADERBOARD
// =============================================================================

export interface LeaderboardEntry {
  id: string;
  rank: number;
  playerName: string;
  score: number;
  weaponUsed: string;
  createdAt: string;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  playerRank?: number;
  totalEntries: number;
}

// =============================================================================
// UI
// =============================================================================

export interface ButtonConfig {
  x: number;
  y: number;
  width?: number;
  height?: number;
  text: string;
  fontSize?: number;
  onClick: () => void;
  disabled?: boolean;
}

export interface CardConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  subtitle?: string;
  imageKey?: string;
  locked?: boolean;
  onClick?: () => void;
}

export interface HUDConfig {
  showScore: boolean;
  showLives: boolean;
  showSouls: boolean;
  showCombo: boolean;
  showTimer: boolean;
  showKillQuota: boolean;
  showBossHealth: boolean;
}

// =============================================================================
// MANAGERS
// =============================================================================

export interface PlayerStats {
  slashWidthMultiplier: number;
  startingLives: number;
  scoreMultiplier: number;
  slowMotionDuration: number;
  criticalHitChance: number;
  criticalHitMultiplier: number;
}

export interface WeaponStats {
  id: string;
  name: string;
  tier: number;
  effects: WeaponEffect[];
  trailColor: string;
  trailGlow: string;
}

// =============================================================================
// SUPABASE
// =============================================================================

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface CloudSaveData {
  userId: string;
  saveData: GameSave;
  updatedAt: string;
}

export interface LeaderboardSubmission {
  playerName: string;
  score: number;
  weaponUsed: string;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Vector2 = {
  x: number;
  y: number;
};

export type Bounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

// =============================================================================
// THEME
// =============================================================================

export interface GradientConfig {
  start: number;
  end: number;
  angle: number;
}

export interface GradientWithAlpha {
  start: { color: number; alpha: number };
  end: { color: number; alpha: number };
}

export interface GradientPalette {
  primaryGradient: GradientConfig;
  secondaryGradient: GradientConfig;
  cardGradient: GradientConfig;
  backgroundGradient: GradientConfig;
  glowGradient: GradientWithAlpha;
}

export interface ShadowConfig {
  deep: number;
  medium: number;
  light: number;
}

export interface ParticleTypeConfig {
  color: number;
  count: number;
  speed: { min: number; max: number };
  lifespan: number;
  scale: { start: number; end: number };
  alpha: { start: number; end: number };
  frequency: number;
}

export interface ParticleSystemConfig {
  soulWisp: ParticleTypeConfig;
  ember: ParticleTypeConfig;
  mist: ParticleTypeConfig;
}

export interface GlowEffectConfig {
  intensity: number;
  color: number;
  innerAlpha: number;
  outerAlpha: number;
}

export interface ShadowEffectConfig {
  offsetX: number;
  offsetY: number;
  blur: number;
  color: string;
  spread: number;
}

export interface ThemeEffects {
  glow: GlowEffectConfig;
  shadow: ShadowEffectConfig;
  particles: ParticleSystemConfig;
}

export interface AnimationPreset {
  duration: number;
  easing: string;
  from?: Record<string, number>;
  to?: Record<string, number>;
  yoyo?: boolean;
  repeat?: number;
  scale?: number;
  y?: number;
  alpha?: { from: number; to: number };
  shadow?: { blur: number };
  brightness?: number;
}

export interface AnimationPresets {
  cardEntrance: AnimationPreset;
  cardHover: AnimationPreset;
  buttonPress: AnimationPreset;
  glowPulse: AnimationPreset;
  staggerDelay: number;
}

export interface ThemeColors {
  primary: number;
  secondary: number;
  accent: number;
  background: number;
  text: number;
  textSecondary: number;
  disabled: number;
  danger: number;
  success: number;
  warning: number;
  bloodRed: number;
  vampirePurple: number;
  ghostlyBlue: number;
  demonGreen: number;
  holyWhite: number;
  gradients: GradientPalette;
  shadows: ShadowConfig;
}

export interface ThemeTypography {
  primary: string;
  secondary: string;
  monospace: string;
}

export interface ThemeSpacing {
  unit: number;
  small: number;
  medium: number;
  large: number;
  xlarge: number;
}

export interface ThemeAnimations {
  duration: number;
  easing: string;
  hoverScale: number;
  pressScale: number;
  presets: AnimationPresets;
}

export interface ThemeConfig {
  colors: ThemeColors;
  fonts: ThemeTypography;
  spacing: ThemeSpacing;
  animations: ThemeAnimations;
  effects: ThemeEffects;
}

export interface DashboardCardConfig {
  width: number;
  height: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  columns: number;
  rows: number;
  gap: number;
  minGap?: number;
  maxGap?: number;
  adaptiveLayout?: boolean;
  borderRadius: number;
  borderWidth: number;
  innerPadding: number;
  hoverLift: number;
  hoverScale: number;
  hoverGlowIntensity: number;
  iconSize: number;
  titleFontSize: number;
  descriptionFontSize: number;
  statFontSize: number;
}

export interface BackgroundLayerConfig {
  type: string;
  colors?: number[];
  angle?: number;
  enabled?: boolean;
  types?: string[];
  color?: number;
  alpha?: number;
  radius?: number;
  texture?: string;
  blend?: string;
}

// =============================================================================
// UI/UX ENHANCEMENTS
// =============================================================================

export interface DailyChallenge {
  date: string; // ISO date
  challengeId: string;
  expiresAt: string;
  rewardMultiplier: number;
  completed: boolean;
}

export interface QuickActionConfig {
  showContinue: boolean;
  showDailyChallenge: boolean;
  showQuickSettings: boolean;
}

export interface ToastConfig {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  icon?: string;
  duration?: number;
  dismissible?: boolean;
}

export interface NumberAnimationConfig {
  start: number;
  end: number;
  duration: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  easing?: string;
}

export interface MagneticHoverConfig {
  strength: number;
  smoothness: number;
  maxOffset: number;
}

export interface WeatherConfig {
  type: 'clear' | 'lightning' | 'fog' | 'embers' | 'bloodMoon';
  intensity: number; // 0-1
  transitionDuration: number;
}

export interface MoonPhaseConfig {
  phase: number; // 0-7 (8 phases)
  cycleDuration: number; // ms for full cycle
  bloodMoonActive: boolean;
}