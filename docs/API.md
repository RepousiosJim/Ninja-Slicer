# API Documentation

Complete API reference for Monster Slayer game systems, managers, and components.

## Table of Contents

- [Managers](#managers)
  - [AudioManager](#audiomanager)
  - [SaveManager](#savemanager)
  - [ShopManager](#shopmanager)
  - [LevelManager](#levelmanager)
  - [ThemeManager](#thememanager)
  - [WeaponManager](#weaponmanager)
  - [UpgradeManager](#upgrademanager)
  - [SlashEnergyManager](#slashenergymanager)
  - [PowerUpManager](#powerupmanager)
- [Systems](#systems)
  - [SlashSystem](#slashsystem)
  - [SpawnSystem](#spawnsystem)
  - [ComboSystem](#combosystem)
  - [ParticleSystem](#particlesystem)
- [Entities](#entities)
  - [BaseEntity](#baseentity)
  - [Monster](#monster)
  - [Boss](#boss)
- [UI Components](#ui-components)
  - [DashboardCard](#dashboardcard)
  - [Button](#button)
  - [HUD](#hud)
- [Services](#services)
  - [SupabaseService](#supabaseservice)
- [Utilities](#utilities)
  - [ResponsiveUtils](#responsiveutils)
  - [TextureGenerator](#texturegenerator)
  - [ResponsiveCardScaler](#responsivecardscaler)

---

## Managers

### AudioManager

Manages all audio playback including music and sound effects.

#### Methods

```typescript
/**
 * Initialize audio manager
 */
initialize(): void

/**
 * Play music track
 * @param key - Music key from AUDIO_KEYS
 */
playMusic(key: string): void

/**
 * Stop current music
 */
stopMusic(): void

/**
 * Play sound effect
 * @param key - SFX key from AUDIO_KEYS
 */
playSFX(key: string): void

/**
 * Stop all sound effects
 */
stopSFX(): void

/**
 * Stop all audio
 */
stopAll(): void

/**
 * Set master volume
 * @param volume - Volume level (0-1)
 */
setMasterVolume(volume: number): void

/**
 * Set music volume
 * @param volume - Volume level (0-1)
 */
setMusicVolume(volume: number): void

/**
 * Set SFX volume
 * @param volume - Volume level (0-1)
 */
setSFXVolume(volume: number): void

/**
 * Mute/unmute all audio
 * @param muted - Mute state
 */
setMuted(muted: boolean): void

/**
 * Cleanup and stop all audio
 */
shutdown(): void
```

#### Audio Keys

```typescript
// Sound Effects
AUDIO_KEYS.slash1          // 'sfx_slash_1'
AUDIO_KEYS.slash2          // 'sfx_slash_2'
AUDIO_KEYS.slash3          // 'sfx_slash_3'
AUDIO_KEYS.slash4          // 'sfx_slash_4'
AUDIO_KEYS.slash5          // 'sfx_slash_5'
AUDIO_KEYS.zombieDeath     // 'sfx_zombie_death'
AUDIO_KEYS.vampireDeath    // 'sfx_vampire_death'
AUDIO_KEYS.ghostDeath      // 'sfx_ghost_death'
AUDIO_KEYS.villagerScream  // 'sfx_villager_scream'
AUDIO_KEYS.powerUp         // 'sfx_powerup'
AUDIO_KEYS.bossHit         // 'sfx_boss_hit'
AUDIO_KEYS.bossDeath       // 'sfx_boss_death'
AUDIO_KEYS.uiClick         // 'sfx_ui_click'
AUDIO_KEYS.uiHover         // 'sfx_ui_hover'
AUDIO_KEYS.combo           // 'sfx_combo'
AUDIO_KEYS.levelComplete    // 'sfx_level_complete'
AUDIO_KEYS.gameOver        // 'sfx_game_over'

// Music
AUDIO_KEYS.menuMusic       // 'music_menu'
```

#### Usage Example

```typescript
import { AudioManager } from './managers/AudioManager';

// In scene create()
this.audioManager = new AudioManager(this);
this.audioManager.initialize();
this.audioManager.playMusic('music_menu');

// Play sound effect
this.audioManager.playSFX('sfx_slash_1');

// Adjust volume
this.audioManager.setSFXVolume(0.7);

// Cleanup
this.audioManager.shutdown();
```

---

### SaveManager

Manages game save data persistence to localStorage and Supabase.

#### Methods

```typescript
/**
 * Initialize save manager
 */
initialize(): void

/**
 * Save game data
 * @param data - Game save data to persist
 * @param cloudSave - Whether to sync to Supabase
 */
save(data: GameSave, cloudSave?: boolean): Promise<boolean>

/**
 * Load game data from storage
 */
load(): GameSave | null

/**
 * Get current save data
 */
getSaveData(): GameSave

/**
 * Update specific save data fields
 * @param updates - Partial update to save data
 */
updateSaveData(updates: Partial<GameSave>): Promise<boolean>

/**
 * Clear all save data
 */
clearSave(): void

/**
 * Save is available
 */
hasSave(): boolean

/**
 * Export save data as JSON string
 */
exportSave(): string

/**
 * Import save data from JSON string
 */
importSave(jsonString: string): boolean

/**
 * Cleanup
 */
shutdown(): void
```

#### GameSave Interface

```typescript
interface GameSave {
  version: number;
  souls: number;
  unlockedWeapons: string[];
  weaponTiers: Record<string, number>;
  equippedWeapon: string;
  upgrades: Record<string, number>;
  completedLevels: string[];
  levelStars: Record<string, number>;
  highScores: Record<string, number>;
  settings: GameSettings;
  personalBests: ScoreEntry[];
  playerName: string | null;
  createdAt: string;
  updatedAt: string;
}
```

#### Usage Example

```typescript
import { SaveManager } from './managers/SaveManager';

// Initialize
this.saveManager = new SaveManager();
this.saveManager.initialize();

// Get save data
const saveData = this.saveManager.getSaveData();
console.log('Player souls:', saveData.souls);

// Update and save
await this.saveManager.updateSaveData({ souls: saveData.souls + 100 });

// Complete level and save
await this.saveManager.updateSaveData({
  completedLevels: [...saveData.completedLevels, '1-1']
});

// Clear save (dev only)
// this.saveManager.clearSave();
```

---

### ShopManager

Manages shop transactions, weapon purchases, and upgrades.

#### Methods

```typescript
/**
 * Initialize shop manager
 */
initialize(): void

/**
 * Get weapon by ID
 */
getWeapon(weaponId: string): WeaponConfig | null

/**
 * Get all weapons
 */
getAllWeapons(): WeaponConfig[]

/**
 * Get unlocked weapons
 */
getUnlockedWeapons(unlockedIds: string[]): WeaponConfig[]

/**
 * Get weapon upgrade cost
 */
getUpgradeCost(weaponId: string, currentTier: number): number

/**
 * Get upgrade total cost (from tier 1 to max)
 */
getUpgradeTotalCost(weaponId: string): number

/**
 * Check if player can afford
 */
canAfford(cost: number, souls: number): boolean

/**
 * Purchase weapon
 */
purchaseWeapon(weaponId: string, souls: number): { success: boolean, newSouls: number }

/**
 * Upgrade weapon
 */
upgradeWeapon(weaponId: string, currentTier: number, souls: number): { success: boolean, newTier: number, newSouls: number }

/**
 * Equip weapon
 */
equipWeapon(weaponId: string): void

/**
 * Get weapon effectiveness against monster type
 */
getEffectivenessMultiplier(weaponId: string, monsterType: MonsterType): number

/**
 * Cleanup
 */
shutdown(): void
```

#### WeaponConfig Interface

```typescript
interface WeaponConfig {
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
```

#### Usage Example

```typescript
import { ShopManager } from './managers/ShopManager';

// Initialize
this.shopManager = new ShopManager();
this.shopManager.initialize();

// Check if can afford
const saveData = this.saveManager.getSaveData();
const weapon = this.shopManager.getWeapon('silver_blade');
if (this.shopManager.canAfford(weapon.unlockCost, saveData.souls)) {
  // Purchase weapon
  const result = this.shopManager.purchaseWeapon('silver_blade', saveData.souls);
  if (result.success) {
    await this.saveManager.updateSaveData({
      souls: result.newSouls,
      unlockedWeapons: [...saveData.unlockedWeapons, 'silver_blade']
    });
  }
}

// Upgrade weapon
const currentTier = saveData.weaponTiers['silver_blade'] || 1;
const upgradeCost = this.shopManager.getUpgradeCost('silver_blade', currentTier);
if (this.shopManager.canAfford(upgradeCost, saveData.souls)) {
  const result = this.shopManager.upgradeWeapon('silver_blade', currentTier, saveData.souls);
  if (result.success) {
    await this.saveManager.updateSaveData({
      souls: result.newSouls,
      weaponTiers: { ...saveData.weaponTiers, 'silver_blade': result.newTier }
    });
  }
}
```

---

### LevelManager

Manages level loading, progression, and completion.

#### Methods

```typescript
/**
 * Initialize level manager
 */
initialize(): void

/**
 * Get level by ID
 */
getLevel(world: number, level: number): LevelConfig | null

/**
 * Get all levels for world
 */
getWorldLevels(world: number): LevelConfig[]

/**
 * Get all worlds
 */
getAllWorlds(): WorldConfig[]

/**
 * Get world by ID
 */
getWorld(worldId: number): WorldConfig | null

/**
 * Check if world is unlocked
 */
isWorldUnlocked(worldId: number, saveData: GameSave): boolean

/**
 * Check if level is unlocked
 */
isLevelUnlocked(world: number, level: number, saveData: GameSave): boolean

/**
 * Calculate level rewards
 */
calculateLevelRewards(level: LevelConfig, stats: GameplayStats): LevelRewards

/**
 * Get next level
 */
getNextLevel(world: number, level: number): { world: number, level: number } | null

/**
 * Get boss for world
 */
getWorldBoss(worldId: number): BossConfig | null

/**
 * Cleanup
 */
shutdown(): void
```

#### LevelConfig Interface

```typescript
interface LevelConfig {
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
```

#### Usage Example

```typescript
import { LevelManager } from './managers/LevelManager';

// Initialize
this.levelManager = new LevelManager();
this.levelManager.initialize();

// Get level
const level = this.levelManager.getLevel(1, 1);
if (level) {
  console.log(`Level: ${level.name}`);
  console.log(`Duration: ${level.duration}s`);
  console.log(`Star thresholds: ${level.starThresholds.join(', ')}`);
}

// Check if unlocked
const saveData = this.saveManager.getSaveData();
if (this.levelManager.isLevelUnlocked(1, 2, saveData)) {
  console.log('Level 1-2 is unlocked');
}

// Complete level and calculate rewards
const stats = this.getGameplayStats();
const rewards = this.levelManager.calculateLevelRewards(level, stats);
console.log(`Earned ${rewards.souls} souls and ${rewards.stars} stars`);
```

---

### ThemeManager

Manages theme application and accessibility settings.

#### Methods

```typescript
/**
 * Initialize theme manager
 */
initialize(): void

/**
 * Get current theme
 */
getCurrentTheme(): ThemeConfig

/**
 * Set theme (not implemented in v1.0)
 */
setTheme(themeName: string): void

/**
 * Apply accessibility settings
 */
applyAccessibilitySettings(settings: GameSettings): void

/**
 * Get color by key
 */
getColor(colorKey: keyof ThemeColors): number

/**
 * Get font by key
 */
getFont(fontKey: keyof ThemeTypography): string

/**
 * Get spacing value
 */
getSpacing(spacingKey: keyof ThemeSpacing): number

/**
 * Toggle high contrast mode
 */
toggleHighContrast(enabled: boolean): void

/**
 * Toggle reduced motion
 */
toggleReducedMotion(enabled: boolean): void

/**
 * Cleanup
 */
shutdown(): void
```

#### Usage Example

```typescript
import { ThemeManager } from './managers/ThemeManager';

// Initialize
this.themeManager = new ThemeManager();
this.themeManager.initialize();

// Get colors
const primaryColor = this.themeManager.getColor('primary');
const accentColor = this.themeManager.getColor('accent');

// Apply accessibility
const saveData = this.saveManager.getSaveData();
this.themeManager.applyAccessibilitySettings(saveData.settings);

// Toggle high contrast
this.themeManager.toggleHighContrast(true);
```

---

### WeaponManager

Manages weapon effects, damage calculations, and trail rendering.

#### Methods

```typescript
/**
 * Initialize weapon manager
 */
initialize(): void

/**
 * Get weapon config
 */
getWeapon(weaponId: string): WeaponConfig | null

/**
 * Get weapon tier effects
 */
getWeaponEffects(weaponId: string, tier: number): WeaponEffect[]

/**
 * Calculate damage
 */
calculateDamage(weaponId: string, tier: number, baseDamage: number): number

/**
 * Get trail color
 */
getTrailColor(weaponId: string): string

/**
 * Get trail glow color
 */
getTrailGlow(weaponId: string): string

/**
 * Apply weapon effects to monster
 */
applyWeaponEffects(weaponId: string, tier: number, monster: Monster): void

/**
 * Cleanup
 */
shutdown(): void
```

#### Usage Example

```typescript
import { WeaponManager } from './managers/WeaponManager';

// Initialize
this.weaponManager = new WeaponManager();
this.weaponManager.initialize();

// Get weapon
const weapon = this.weaponManager.getWeapon('fire_sword');
if (weapon) {
  // Get effects at tier 2
  const effects = this.weaponManager.getWeaponEffects('fire_sword', 2);

  // Calculate damage
  const damage = this.weaponManager.calculateDamage('fire_sword', 2, 100);

  // Apply to monster
  this.weaponManager.applyWeaponEffects('fire_sword', 2, monster);
}
```

---

### UpgradeManager

Manages character upgrades and their costs.

#### Methods

```typescript
/**
 * Initialize upgrade manager
 */
initialize(): void

/**
 * Get upgrade by ID
 */
getUpgrade(upgradeId: string): UpgradeConfig | null

/**
 * Get all upgrades
 */
getAllUpgrades(): UpgradeConfig[]

/**
 * Get upgrade current value
 */
getUpgradeValue(upgradeId: string, currentLevel: number): number

/**
 * Get upgrade cost
 */
getUpgradeCost(upgradeId: string, currentLevel: number): number

/**
 * Get upgrade max tier
 */
getUpgradeMaxTier(upgradeId: string): number

/**
 * Purchase upgrade
 */
purchaseUpgrade(upgradeId: string, currentLevel: number, souls: number): { success: boolean, newLevel: number, newSouls: number }

/**
 * Calculate upgrade effect
 */
calculateUpgradeEffect(upgradeId: string, currentLevel: number): number

/**
 * Cleanup
 */
shutdown(): void
```

#### Usage Example

```typescript
import { UpgradeManager } from './managers/UpgradeManager';

// Initialize
this.upgradeManager = new UpgradeManager();
this.upgradeManager.initialize();

// Get upgrade
const upgrade = this.upgradeManager.getUpgrade('slash_width');
if (upgrade) {
  // Get current value at level 2
  const value = this.upgradeManager.getUpgradeValue('slash_width', 2);

  // Get cost for next upgrade
  const cost = this.upgradeManager.getUpgradeCost('slash_width', 2);

  // Purchase upgrade
  const saveData = this.saveManager.getSaveData();
  if (this.upgradeManager.canAfford(cost, saveData.souls)) {
    const result = this.upgradeManager.purchaseUpgrade('slash_width', 2, saveData.souls);
    if (result.success) {
      await this.saveManager.updateSaveData({
        souls: result.newSouls,
        upgrades: { ...saveData.upgrades, 'slash_width': result.newLevel }
      });
    }
  }
}
```

---

### SlashEnergyManager

Manages slash energy system for limiting slash spam.

#### Methods

```typescript
/**
 * Initialize slash energy manager
 */
initialize(): void

/**
 * Get current energy
 */
getCurrentEnergy(): number

/**
 * Get max energy
 */
getMaxEnergy(): number

/**
 * Get energy percentage
 */
getEnergyPercentage(): number

/**
 * Check if energy is low
 */
isLowEnergy(): boolean

/**
 * Check if energy is depleted
 */
isDepleted(): boolean

/**
 * Consume energy
 */
consumeEnergy(cost: number): void

/**
 * Start regeneration
 */
startRegeneration(): void

/**
 * Stop regeneration
 */
stopRegeneration(): void

/**
 * Get current effectiveness multiplier
 */
getEffectivenessMultiplier(): number

/**
 * Reset energy
 */
resetEnergy(): void

/**
 * Cleanup
 */
shutdown(): void
```

#### Usage Example

```typescript
import { SlashEnergyManager } from './managers/SlashEnergyManager';

// Initialize
this.slashEnergyManager = new SlashEnergyManager(this.scene);
this.slashEnergyManager.initialize();

// On slash
if (this.slashEnergyManager.isDepleted()) {
  console.log('No energy!');
  return;
}

// Consume energy
const cost = this.slashEnergyManager.calculateSlashCost(distance);
this.slashEnergyManager.consumeEnergy(cost);

// Check effectiveness
const effectiveness = this.slashEnergyManager.getEffectivenessMultiplier();
const damage = baseDamage * effectiveness;

// Start regen after delay
this.time.delayedCall(500, () => {
  this.slashEnergyManager.startRegeneration();
});
```

---

### PowerUpManager

Manages power-up spawning, activation, and effects.

#### Methods

```typescript
/**
 * Initialize power-up manager
 */
initialize(): void

/**
 * Spawn power-up
 */
spawnPowerUp(type: PowerUpType, x: number, y: number): PowerUp | null

/**
 * Activate power-up
 */
activatePowerUp(powerUp: PowerUp): void

/**
 * Deactivate power-up
 */
deactivatePowerUp(powerUpType: PowerUpType): void

/**
 * Get active power-ups
 */
getActivePowerUps(): PowerUpState[]

/**
 * Check if power-up is active
 */
isActive(type: PowerUpType): boolean

/**
 * Get power-up remaining duration
 */
getRemainingDuration(type: PowerUpType): number | null

/**
 * Clear all power-ups
 */
clearAllPowerUps(): void

/**
 * Cleanup
 */
shutdown(): void
```

#### PowerUp Types

```typescript
enum PowerUpType {
  SLOW_MOTION = 'slow_motion',
  FRENZY = 'frenzy',
  SHIELD = 'shield',
  SOUL_MAGNET = 'soul_magnet',
}
```

#### Usage Example

```typescript
import { PowerUpManager } from './managers/PowerUpManager';

// Initialize
this.powerUpManager = new PowerUpManager(this.scene);
this.powerUpManager.initialize();

// Spawn random power-up
const type = Phaser.Utils.Array.GetRandom(Object.values(PowerUpType));
this.powerUpManager.spawnPowerUp(type, x, y);

// On collection
onPowerUpCollected(powerUp) {
  this.powerUpManager.activatePowerUp(powerUp);
}

// Check if active
if (this.powerUpManager.isActive(PowerUpType.FRENZY)) {
  // Apply frenzy multiplier
  score *= 2;
}
```

---

## Systems

### SlashSystem

Handles slash detection, trail rendering, and pattern recognition.

#### Methods

```typescript
/**
 * Initialize slash system
 */
initialize(): void

/**
 * Start tracking slash
 */
startSlash(): void

/**
 * Update slash trail
 */
updateSlash(x: number, y: number): void

/**
 * End slash
 */
endSlash(): SlashResult[]

/**
 * Detect slash pattern
 */
detectPattern(points: SlashPoint[]): SlashPatternResult | null

/**
 * Render slash trail
 */
renderTrail(): void

/**
 * Get current power level
 */
getPowerLevel(): SlashPowerLevel

/**
 * Get charge progress
 */
getChargeProgress(): number

/**
 * Reset slash system
 */
reset(): void

/**
 * Cleanup
 */
shutdown(): void
```

#### Usage Example

```typescript
import { SlashSystem } from './systems/SlashSystem';

// Initialize
this.slashSystem = new SlashSystem(this.scene);
this.slashSystem.initialize();

// On pointer down
this.input.on('pointerdown', () => {
  this.slashSystem.startSlash();
});

// On pointer move
this.input.on('pointermove', (pointer) => {
  this.slashSystem.updateSlash(pointer.x, pointer.y);
});

// On pointer up
this.input.on('pointerup', () => {
  const results = this.slashSystem.endSlash();
  results.forEach(result => {
    if (result.hit) {
      this.onMonsterHit(result);
    }
  });
});
```

---

### SpawnSystem

Manages monster spawning with configurable rates and patterns.

#### Methods

```typescript
/**
 * Initialize spawn system
 */
initialize(): void

/**
 * Start spawning
 */
startSpawning(): void

/**
 * Stop spawning
 */
stopSpawning(): void

/**
 * Spawn monster
 */
spawnMonster(type?: MonsterType): Monster | null

/**
 * Spawn minion for boss
 */
spawnMinion(minionType: MonsterType, count: number): Monster[]

/**
 * Set spawn rate
 */
setSpawnRate(rate: number): void

/**
 * Set monster weights
 */
setMonsterWeights(weights: MonsterWeights): void

/**
 * Clear all monsters
 */
clearMonsters(): void

/**
 * Get active monster count
 */
getMonsterCount(): number

/**
 * Cleanup
 */
shutdown(): void
```

#### Usage Example

```typescript
import { SpawnSystem } from './systems/SpawnSystem';

// Initialize
this.spawnSystem = new SpawnSystem(this.scene);
this.spawnSystem.initialize();

// Start spawning
this.spawnSystem.startSpawning();

// Configure for level
const level = this.levelManager.getLevel(1, 1);
this.spawnSystem.setSpawnRate(level.spawnRate);
this.spawnSystem.setMonsterWeights(level.monsterWeights);

// Stop spawning
this.spawnSystem.stopSpawning();
```

---

### ComboSystem

Tracks and manages combo multipliers for consecutive hits.

#### Methods

```typescript
/**
 * Initialize combo system
 */
initialize(): void

/**
 * Register hit
 */
registerHit(points: number): ComboResult

/**
 * Register miss
 */
registerMiss(): void

/**
 * Reset combo
 */
resetCombo(): void

/**
 * Get current combo count
 */
getComboCount(): number

/**
 * Get current multiplier
 */
getMultiplier(): number

/**
 * Get time until combo reset
 */
getTimeUntilReset(): number

/**
 * Check if combo is active
 */
isActive(): boolean

/**
 * Cleanup
 */
shutdown(): void
```

#### Usage Example

```typescript
import { ComboSystem } from './systems/ComboSystem';

// Initialize
this.comboSystem = new ComboSystem();
this.comboSystem.initialize();

// On monster hit
onMonsterHit(points: number) {
  const result = this.comboSystem.registerHit(points);
  this.updateComboDisplay(result);
}

// On miss
onMiss() {
  this.comboSystem.registerMiss();
}
```

---

## UI Components

### DashboardCard

Main menu card component with hover effects and animations.

#### Methods

```typescript
constructor(
  scene: Phaser.Scene,
  x: number,
  y: number,
  config: DashboardCardConfig,
  scaledConfig?: ScaledCardConfig
)

/**
 * Update card position
 */
updatePosition(x: number, y: number): void

/**
 * Update card configuration
 */
updateCard(updates: Partial<DashboardCardConfig>): void

/**
 * Enable debug hit box visualization
 */
enableDebugHitBox(): void

/**
 * Disable debug hit box visualization
 */
disableDebugHitBox(): void
```

#### DashboardCardConfig Interface

```typescript
interface DashboardCardConfig {
  id: string;
  title: string;
  description: string;
  icon: string;
  badge?: DashboardCardBadge;
  stats?: DashboardCardStats[];
  locked?: boolean;
  unlockCost?: number;
  onClick: () => void;
  glow?: {
    color: number;
    intensity: number;
  };
}
```

#### Usage Example

```typescript
import { DashboardCard } from './ui/DashboardCard';

const card = new DashboardCard(this, x, y, {
  id: 'play',
  title: 'PLAY',
  icon: '⚔️',
  description: 'Start your adventure',
  stats: [
    { label: 'Progress', value: 'World 1-1' },
    { label: 'Stars', value: '5 ⭐' }
  ],
  onClick: () => this.scene.start('GameplayScene')
});
this.add.existing(card);
```

---

### Button

Reusable button component with multiple states.

#### Methods

```typescript
constructor(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  text: string,
  config?: Partial<ButtonConfig>
)

/**
 * Set button text
 */
setText(text: string): void

/**
 * Set click callback
 */
setCallback(callback: () => void): void

/**
 * Enable or disable button
 */
setEnabled(enabled: boolean): void

/**
 * Set button style
 */
setStyle(style: ButtonStyle): void

/**
 * Get enabled state
 */
getEnabled(): boolean

/**
 * Get style
 */
getStyle(): ButtonStyle
```

#### Usage Example

```typescript
import { Button } from './ui/Button';

const button = new Button(this, x, y, 200, 50, 'Start Game', {
  onClick: () => this.scene.start('GameplayScene')
});
this.add.existing(button);

// Disable button
button.setEnabled(false);
```

---

## Services

### SupabaseService

Handles Supabase API calls for leaderboards and cloud saves.

#### Methods

```typescript
/**
 * Initialize Supabase client
 */
initialize(): void

/**
 * Submit leaderboard entry
 */
submitLeaderboardEntry(entry: LeaderboardSubmission): Promise<LeaderboardResponse>

/**
 * Get leaderboard entries
 */
getLeaderboardEntries(limit?: number): Promise<LeaderboardEntry[]>

/**
 * Get player rank
 */
getPlayerRank(score: number): Promise<number | null>

/**
 * Save game data to Supabase
 */
saveGameData(userId: string, saveData: GameSave): Promise<boolean>

/**
 * Load game data from Supabase
 */
loadGameData(userId: string): Promise<CloudSaveData | null>

/**
 * Get player profile
 */
getPlayerProfile(userId: string): Promise<PlayerProfile | null>

/**
 * Update player profile
 */
updatePlayerProfile(userId: string, updates: Partial<PlayerProfile>): Promise<boolean>

/**
 * Cleanup
 */
shutdown(): void
```

#### Usage Example

```typescript
import { SupabaseService } from './services/SupabaseService';

// Initialize
this.supabaseService = new SupabaseService();
this.supabaseService.initialize();

// Submit score
await this.supabaseService.submitLeaderboardEntry({
  playerName: 'Player1',
  score: 10000,
  weaponUsed: 'fire_sword'
});

// Get leaderboard
const leaderboard = await this.supabaseService.getLeaderboardEntries(10);
```

---

## Utilities

### ResponsiveUtils

Helper utilities for responsive UI positioning and sizing.

#### Methods

```typescript
/**
 * Get UI scale multiplier
 */
static getUIScaleMultiplier(): number

/**
 * Get screen size category
 */
static getScreenSize(): 'mobile' | 'tablet' | 'desktop' | 'large-desktop'

/**
 * Get current orientation
 */
static getOrientation(): 'portrait' | 'landscape'

/**
 * Check if screen is small
 */
static isSmallScreen(): boolean

/**
 * Get responsive position based on percentage
 */
static getX(percent: number): number
static getY(percent: number): number

/**
 * Get responsive padding
 */
static getPadding(size: 'small' | 'medium' | 'large'): number

/**
 * Get responsive font size
 */
static getFontSize(size: 'small' | 'medium' | 'large' | 'xlarge' | 'title'): number

/**
 * Get minimum touch target size
 */
static getMinTouchSize(): number

/**
 * Check if device is mobile
 */
static isMobile(): boolean

/**
 * Convert design coordinates to responsive coordinates
 */
static toResponsive(x: number, y: number): { x: number, y: number }

/**
 * Get responsive button size
 */
static getButtonSize(size?: 'small' | 'medium' | 'large'): { width: number; height: number }
```

#### Usage Example

```typescript
import { ResponsiveUtils } from './utils/ResponsiveUtils';

// Get responsive values
const padding = ResponsiveUtils.getPadding('large');
const fontSize = ResponsiveUtils.getFontSize('title');
const buttonSize = ResponsiveUtils.getButtonSize('medium');

// Check device
if (ResponsiveUtils.isMobile()) {
  // Mobile-specific logic
}

// Position element
const x = ResponsiveUtils.getX(50); // 50% of screen width
const y = ResponsiveUtils.getY(30); // 30% of screen height
```

---

### TextureGenerator

Programmatically generates textures for buttons, particles, and effects.

#### Methods

```typescript
/**
 * Create gradient button texture
 */
static createGradientButton(
  scene: Phaser.Scene,
  width: number,
  height: number,
  startColor: number,
  endColor: number,
  borderColor: number,
  state: 'normal' | 'hover' | 'pressed' | 'disabled'
): Phaser.Textures.CanvasTexture

/**
 * Create particle texture
 */
static createParticleTexture(
  scene: Phaser.Scene,
  type: 'wisp' | 'ember' | 'mist',
  size: number
): Phaser.Textures.CanvasTexture

/**
 * Create noise texture
 */
static createNoiseTexture(
  scene: Phaser.Scene,
  width: number,
  height: number,
  intensity?: number
): Phaser.Textures.CanvasTexture

/**
 * Create glow texture
 */
static createGlowTexture(
  scene: Phaser.Scene,
  size: number,
  color: number,
  intensity?: number
): Phaser.Textures.CanvasTexture

/**
 * Create vignette texture
 */
static createVignetteTexture(
  scene: Phaser.Scene,
  width: number,
  height: number,
  color?: number,
  intensity?: number,
  radius?: number
): Phaser.Textures.CanvasTexture

/**
 * Batch create all particle textures
 */
static createAllParticleTextures(scene: Phaser.Scene, size?: number): void

/**
 * Clear cached textures
 */
static clearCachedTextures(scene: Phaser.Scene, prefix: string): void
```

#### Usage Example

```typescript
import { TextureGenerator } from './utils/TextureGenerator';

// Create button texture
const buttonTexture = TextureGenerator.createGradientButton(
  this,
  200,
  50,
  0x8b0000,
  0x5a0000,
  0xffd700,
  'normal'
);

// Create particle texture
const particleTexture = TextureGenerator.createParticleTexture(
  this,
  'wisp',
  32
);

// Create all particles at once
TextureGenerator.createAllParticleTextures(this, 32);
```

---

### ResponsiveCardScaler

Dynamically calculates optimal card dimensions and grid layout.

#### Methods

```typescript
/**
 * Calculate optimal card configuration for viewport
 */
static getOptimalCardConfig(input: ScalerInput): ScaledCardConfig

/**
 * Calculate adaptive logo height
 */
static getAdaptiveLogoHeight(screenHeight: number, basePadding: number): number

/**
 * Calculate safe logo floating animation range
 */
static getAdaptiveFloatRange(screenHeight: number): number
```

#### Usage Example

```typescript
import { ResponsiveCardScaler } from './utils/ResponsiveCardScaler';

// Calculate card layout
const scaledConfig = ResponsiveCardScaler.getOptimalCardConfig({
  viewportWidth: 1280,
  viewportHeight: 720,
  logoHeight: 100,
  soulsHeight: 50,
  baseConfig: DASHBOARD_CARD_CONFIG
});

console.log(`Card width: ${scaledConfig.width}`);
console.log(`Card height: ${scaledConfig.height}`);
console.log(`Grid: ${scaledConfig.columns}x${scaledConfig.rows}`);
```

---

## Type Definitions

### Common Types

```typescript
// Vector2D
type Vector2 = { x: number; y: number };

// Bounds
type Bounds = { x: number; y: number; width: number; height: number };

// Score Entry
interface ScoreEntry {
  score: number;
  date: string;
  weapon: string;
  monstersSliced: number;
  maxCombo: number;
  timeElapsed: number;
}

// Combo State
interface ComboState {
  count: number;
  multiplier: number;
  lastSliceTime: number;
  isActive: boolean;
}
```

---

## Events

### Game Events

```typescript
EVENTS.monsterSliced        // Monster hit by slash
EVENTS.villagerSliced       // Villager hit (penalty)
EVENTS.monsterMissed        // Monster escaped
EVENTS.powerUpCollected     // Power-up collected
EVENTS.powerUpActivated     // Power-up effect started
EVENTS.powerUpEnded         // Power-up effect ended
EVENTS.bossHit             // Boss hit
EVENTS.bossPhaseChange     // Boss phase changed
EVENTS.bossDefeated        // Boss defeated
EVENTS.scoreUpdated         // Score changed
EVENTS.soulsUpdated        // Souls changed
EVENTS.comboUpdated        // Combo changed
EVENTS.livesChanged        // Lives changed
EVENTS.levelComplete        // Level completed
EVENTS.gameOver            // Game over
```

### System Events

```typescript
EVENTS.slashEnergyChanged     // Slash energy changed
EVENTS.slashEnergyDepleted    // Slash energy empty
EVENTS.slashEnergyLow        // Slash energy below threshold
EVENTS.slashPowerChanged     // Slash power level changed
EVENTS.slashPatternDetected  // Slash pattern recognized
EVENTS.saveCompleted         // Save completed
EVENTS.settingsChanged       // Settings changed
```

---

## Error Handling

### Common Errors

```typescript
// Asset not found
Error: 'Asset not found: monster_zombie'

// Save corrupted
Error: 'Save data corrupted, clearing...'

// Network error
Error: 'Failed to connect to Supabase'

// Invalid level
Error: 'Level 6-1 does not exist'
```

### Error Handling Pattern

```typescript
try {
  await this.saveManager.save(saveData);
} catch (error) {
  console.error('Failed to save:', error);
  this.showNotification('Save failed', 'error');
  // Fallback to localStorage only
  this.saveManager.save(saveData, false);
}
```

---

## Best Practices

### Performance

- **Reuse objects** - Use object pools for frequently spawned entities
- **Limit particles** - Use quality settings to reduce particle count
- **Optimize textures** - Use texture atlases when possible
- **Clean up** - Always destroy unused objects

### Memory Management

```typescript
// Good: Destroy objects when done
this.monster.destroy();
this.particleSystem.destroy();

// Good: Remove event listeners
this.events.off('update', this.onUpdate, this);

// Good: Clear timeouts/intervals
this.time.removeAllEvents();
```

### Error Handling

```typescript
// Always handle async errors
try {
  await this.supabaseService.saveGameData(userId, saveData);
} catch (error) {
  console.error('Save failed:', error);
  this.showNotification('Failed to save to cloud', 'error');
}
```

---

## Changelog

### Version 0.1.0

- Initial API documentation
- All managers documented
- All systems documented
- All UI components documented
- All services documented
- All utilities documented

---

**[⬆ Back to Top](#api-documentation)**
