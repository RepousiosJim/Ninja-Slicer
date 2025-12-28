# Monster Slayer - Game Design Specification

## Overview

**Title:** Monster Slayer (working title)

**Genre:** Action / Arcade / Slash Game

**Platform:** Web Browser (Desktop + Mobile responsive)

**Inspiration:** Fruit Ninja with horror theme, unique mechanics, and RPG progression

**Mood:** Dark and serious pixel art aesthetic

**Core Loop:** Slice monsters → Earn souls → Upgrade equipment → Progress through campaign or compete in endless mode

---

## Core Gameplay

### Slicing Mechanic

- **Input:** Mouse movement (desktop) / Touch drag (mobile)
- **Slash Registration:** Slash only registers if cursor/finger moves fast enough (velocity threshold)
- **Visual Feedback:** Glowing slash trail follows cursor with slight delay
- **Hit Detection:** Slash line intersects with monster hitbox

### Objectives

- **Primary:** Slice monsters before they leave the screen
- **Secondary:** Avoid slicing villagers
- **Level Completion:** Hybrid system — survive the level duration AND achieve minimum kill quota

### Fail Conditions

- Lose all lives (lives lost by missing too many monsters or other conditions)
- Slicing villagers deducts points (not instant fail)

---

## Monsters

### Monster Types & Behaviors

| Monster | Speed | Health | Behavior | Death Effect | Spawn Pattern |
|---------|-------|--------|----------|--------------|---------------|
| **Zombie** | Slow | 1 HP (2+ HP in later levels) | Lumbers in arc, predictable | Splits in half, both halves fall | Launch from bottom |
| **Vampire** | Fast | 1 HP (2+ HP in later levels) | Quick, may change direction mid-flight | Bursts into bats that scatter | Launch from bottom |
| **Ghost** | Medium | 1 HP | Fades in/out, only vulnerable when visible | Dissolves into mist particles | Floats down from top (Ghost Realm), sides elsewhere |

### Monster Scaling Per World

| World | Zombie HP | Vampire HP | Ghost HP | Monster Variety |
|-------|-----------|------------|----------|-----------------|
| 1 - Graveyard | 1 | 1 | 1 | 70% Zombie, 20% Vampire, 10% Ghost |
| 2 - Haunted Village | 1 | 1 | 1 | 50% Zombie, 30% Vampire, 20% Ghost |
| 3 - Vampire Castle | 1-2 | 1-2 | 1 | 30% Zombie, 50% Vampire, 20% Ghost |
| 4 - Ghost Realm | 2 | 2 | 1-2 | 20% Zombie, 30% Vampire, 50% Ghost |
| 5 - Hell Dimension | 2 | 2 | 2 | 33% each + demon variants |

### Villagers (Civilians)

- **Appearance:** Townspeople sprites (varied: men, women, elderly)
- **Behavior:** Launch alongside monsters, move slower, distinct visual silhouette
- **Penalty:** Slicing a villager deducts points (e.g., -100 points)
- **Frequency:** Increases with difficulty (starts ~5%, scales to ~15%)

---

## Weapons System

### Weapon Tiers

Each weapon has 3 upgrade tiers that enhance its base effect.

| Weapon | Tier 1 Effect | Tier 2 Effect | Tier 3 Effect | Effective Against |
|--------|---------------|---------------|---------------|-------------------|
| **Basic Sword** | Standard slash | +10% slash width | +20% slash width | All (neutral) |
| **Silver Blade** | +25% damage to vampires | +50% damage to vampires | +75% damage + stun | Vampires |
| **Holy Cross Blade** | Ghosts visible 20% longer | Ghosts visible 40% longer | Ghosts always visible nearby | Ghosts |
| **Fire Sword** | Burn DOT (1 tick) | Burn DOT (2 ticks) | Burn spreads to nearby | Zombies |
| **Ice Blade** | Slow monsters 10% | Slow monsters 20% | Chance to freeze | All |
| **Lightning Katana** | Chain to 1 nearby | Chain to 2 nearby | Chain to 3 + stun | Groups |

### Weapon Unlock Costs (Souls)

| Weapon | Unlock Cost | Tier 2 Upgrade | Tier 3 Upgrade |
|--------|-------------|----------------|----------------|
| Basic Sword | Free (starter) | 200 | 500 |
| Silver Blade | 300 | 400 | 800 |
| Holy Cross Blade | 300 | 400 | 800 |
| Fire Sword | 500 | 600 | 1000 |
| Ice Blade | 500 | 600 | 1000 |
| Lightning Katana | 800 | 900 | 1500 |

### Equipment Flow

1. Player visits Character/Loadout screen
2. Views inventory of unlocked weapons
3. Selects one weapon to equip
4. Enters battle with equipped weapon
5. Weapon persists until manually changed

---

## Character Upgrades

### Upgrade Categories

All upgrades have multiple tiers (1 → 2 → 3 → 4 → 5).

| Upgrade | Per-Tier Bonus | Max Bonus | Base Cost | Cost Multiplier |
|---------|----------------|-----------|-----------|-----------------|
| **Slash Width** | +8% hit area | +40% | 100 | 1.5x per tier |
| **Extra Lives** | +1 starting life | +5 lives | 150 | 2x per tier |
| **Score Multiplier** | +0.1x multiplier | +0.5x | 200 | 1.8x per tier |
| **Slow Motion Duration** | +0.5 seconds | +2.5 seconds | 120 | 1.5x per tier |
| **Critical Hit Chance** | +5% crit chance | +25% | 180 | 1.6x per tier |

### Upgrade Cost Formula

```
Cost = BaseCost × (CostMultiplier ^ CurrentTier)
```

Example - Slash Width:
- Tier 1 → 2: 100 × 1.5 = 150 souls
- Tier 2 → 3: 100 × 2.25 = 225 souls
- Tier 3 → 4: 100 × 3.375 = 338 souls

---

## Campaign Structure

### Worlds

| World | Name | Theme | Visual Style | Unique Mechanic |
|-------|------|-------|--------------|-----------------|
| 1 | Graveyard | Cemetery at night | Tombstones, dead trees, fog | Standard gameplay (tutorial) |
| 2 | Haunted Village | Abandoned town | Broken houses, street lamps | More villagers to protect |
| 3 | Vampire Castle | Gothic castle interior | Chandeliers, red curtains, stone | Vampires spawn more frequently |
| 4 | Ghost Realm | Ethereal dimension | Floating platforms, eerie glow | Ghosts float from top of screen |
| 5 | Hell Dimension | Fiery underworld | Lava, brimstone, flames | All monster types + demons |
| 6+ | Locked | "Coming Soon" | Placeholder cards | Future expansion |

### Level Structure

- **5 levels per world** (25 total levels at launch)
- **Levels 1-4:** Standard gameplay with scaling difficulty
- **Level 5:** Boss fight

### Level Selection UI

- Card-based display showing current level
- Left/Right arrow buttons to navigate
- Locked levels show lock icon + silhouette
- Completed levels show star rating (1-3 stars based on score)
- Current level highlighted

### Level Unlock Flow

1. All players start with World 1, Level 1 unlocked
2. Completing a level unlocks the next level
3. Completing Level 5 (boss) unlocks next world
4. Players can replay any completed level

---

## Boss Fights

### Boss Mechanics

- **Health Bar:** Displayed at top of screen
- **Damage:** Multiple slices required to deplete health
- **Minions:** Boss summons regular monsters during fight
- **Phases:** Boss behavior changes at 66% and 33% health

### Boss Roster

| World | Boss Name | Health | Attack Pattern | Minions |
|-------|-----------|--------|----------------|---------|
| 1 | **Grave Titan** (Giant Zombie) | 20 slices | Slow swipes, spawns zombie parts | Zombies |
| 2 | **Headless Horseman** | 25 slices | Charges across screen, throws head | Zombies + Vampires |
| 3 | **Vampire Lord** | 30 slices | Teleports, throws bat projectiles | Vampires + Ghosts |
| 4 | **Phantom King** | 35 slices | Phases in/out, creates clones | Ghosts |
| 5 | **Demon Overlord** | 50 slices | Multi-phase, all attack types | All types |

### Boss Fight Flow

1. Boss appears with health bar
2. Boss attacks in patterns (telegraphed for fairness)
3. Vulnerable windows for slicing
4. Summons minions periodically
5. Behavior intensifies at health thresholds
6. Dramatic death animation on defeat

---

## Power-Ups

### In-Game Power-Ups

Power-ups spawn randomly during gameplay. Slice to activate.

| Power-Up | Visual | Duration | Effect |
|----------|--------|----------|--------|
| **Slow Motion** | Hourglass icon | 5 seconds (base) | All monsters move at 50% speed |
| **Frenzy** | Fire icon | 8 seconds | Double points for all slices |
| **Shield** | Shield icon | Until triggered | Negates next villager slice penalty |
| **Soul Magnet** | Purple orb | 10 seconds | +50% souls earned |

### Power-Up Spawn Rate

- Base: 1 power-up every 15-20 seconds
- Scales slightly with difficulty (longer intervals in harder levels)

---

## Endless Mode

### Core Design

- **Objective:** Achieve highest score possible
- **Scaling:** Difficulty increases every 1000 points
- **No Level End:** Continues until player loses all lives

### Difficulty Scaling (Per 1000 Points)

| Score Threshold | Spawn Rate | Monster Speed | Monster Health | Villager Frequency |
|-----------------|------------|---------------|----------------|-------------------|
| 0 - 999 | 1.0x | 1.0x | 1 HP | 5% |
| 1000 - 1999 | 1.1x | 1.05x | 1 HP | 6% |
| 2000 - 2999 | 1.2x | 1.1x | 1 HP | 7% |
| 3000 - 3999 | 1.3x | 1.15x | 1-2 HP | 8% |
| 4000 - 4999 | 1.4x | 1.2x | 1-2 HP | 9% |
| 5000+ | +0.1x per 1k | +0.05x per 1k | 2 HP | 10% cap |

### Endless Mode Features

- All unlocked weapons and upgrades apply
- High score saved locally and to leaderboard
- Post-game stats (monsters sliced, accuracy, time survived)

---

## Leaderboards

### Online Leaderboard System

- **Scope:** Endless mode only
- **Provider:** Supabase
- **Data Stored:** Player name, score, date, weapon used

### Leaderboard Views

| View | Description |
|------|-------------|
| **Global All-Time** | Top 100 scores ever |
| **Global Weekly** | Top 100 scores this week (resets Monday) |
| **Personal Best** | Player's own top 10 scores |

### Leaderboard Entry Flow

1. Player dies in endless mode
2. If score qualifies for personal best, prompt for name (cached for future)
3. Score submitted to Supabase
4. Updated leaderboard displayed

---

## Difficulty & Progression Algorithm

### Base Difficulty Formula

```
BaseDifficulty = (WorldNumber × 1.5) + (LevelNumber × 0.3)

// Boss levels get +2 difficulty bonus
if (isBossLevel) BaseDifficulty += 2
```

### Spawn Rate Calculation

```
SpawnRate = BaseSpawnRate × (1 + BaseDifficulty × 0.15)

// BaseSpawnRate = 1 monster per 2 seconds
// World 1 Level 1: 1 × (1 + 1.8 × 0.15) = 1.27 per 2 sec
// World 5 Level 5: 1 × (1 + 11 × 0.15) = 2.65 per 2 sec
```

### Monster Speed Calculation

```
SpeedMultiplier = 1 + (BaseDifficulty × 0.04)

// World 1 Level 1: 1.072x speed
// World 5 Level 5: 1.44x speed
```

### Expected Player Power Per World

| World | Expected Weapon | Expected Upgrade Tiers | Souls Earned (Cumulative) |
|-------|-----------------|------------------------|---------------------------|
| 1 | Basic Sword T1 | 0-2 total tiers | ~500 |
| 2 | Basic T2 or Special T1 | 3-5 total tiers | ~1500 |
| 3 | Special T1-T2 | 6-8 total tiers | ~3500 |
| 4 | Special T2 | 9-12 total tiers | ~6500 |
| 5 | Special T2-T3 | 13-16 total tiers | ~10000+ |

### Level Tuning Parameters

Each level has manually adjustable parameters for fine-tuning:

```typescript
interface LevelConfig {
  world: number;
  level: number;
  duration: number;           // seconds
  minKillsRequired: number;   // quota
  baseSpawnRate: number;      // monsters per second
  monsterWeights: {           // spawn probability
    zombie: number;
    vampire: number;
    ghost: number;
  };
  villagerChance: number;     // 0-1
  powerUpInterval: number;    // seconds between power-ups
  difficultyOverride?: number; // manual override if needed
}
```

---

## Currency & Economy

### Souls

- **Earned By:** Slicing monsters, completing levels, bonus objectives
- **Spent On:** Weapons, weapon upgrades, character upgrades

### Soul Earning Rates

| Action | Souls Earned |
|--------|--------------|
| Slice Zombie | 5 |
| Slice Vampire | 8 |
| Slice Ghost | 10 |
| Combo Bonus (5+) | +2 per combo level |
| Level Completion | 50 + (World × 20) |
| Boss Defeat | 100 + (World × 50) |
| 3-Star Rating | +25% bonus |

### Economy Balance Goals

- World 1 completion: ~500 souls (enough for 1 special weapon OR several upgrades)
- Full game completion: ~10,000+ souls
- Full upgrade unlock: ~15,000 souls (encourages replayability)

---

## UI Screens

### Screen Map

```
Main Menu
├── Play (Campaign)
│   ├── World Select
│   │   └── Level Select
│   │       └── Gameplay
│   │           ├── Pause Menu
│   │           ├── Level Complete
│   │           └── Game Over
├── Endless Mode
│   └── Gameplay
│       ├── Pause Menu
│       └── Game Over (+ Leaderboard Submit)
├── Character/Loadout
│   └── Inventory
├── Shop
│   ├── Weapons Tab
│   └── Upgrades Tab
├── Leaderboards
│   ├── Global All-Time
│   ├── Global Weekly
│   └── Personal Best
└── Settings
    ├── Sound Toggle
    ├── Music Toggle
    ├── Account (Cloud Save)
    └── Credits
```

### Screen Details

#### Main Menu
- Game logo (animated)
- Play button (campaign)
- Endless button
- Character button
- Shop button
- Leaderboards button
- Settings button
- Current souls displayed

#### Character/Loadout
- Large character display
- Equipped weapon slot
- Weapon stats display
- "Change Weapon" button → opens Inventory
- Player stats summary (upgrades applied)

#### Inventory
- Grid of weapon cards
- Locked weapons shown as silhouettes
- Equipped weapon highlighted
- Tap to select → confirm equip

#### Shop
- Two tabs: Weapons / Upgrades
- Weapons: Cards with cost, "Buy" or "Upgrade" button
- Upgrades: List with tier progress bars, costs
- Current souls always visible

#### World Select
- 5 world cards displayed (horizontal scroll or grid)
- Completed worlds show completion percentage
- Locked worlds show lock icon
- Future worlds show "Coming Soon"

#### Level Select
- Single card showing current level
- Left/Right arrows for navigation
- Stars for completed levels (1-3)
- Lock icon for locked levels
- "Play" button for unlocked levels

#### Gameplay HUD
- **Top Left:** Score (with combo multiplier)
- **Top Right:** Lives (heart icons)
- **Top Center:** Timer/Progress bar (campaign) or Wave indicator
- **Top Center (Boss):** Boss health bar
- **Bottom:** Souls collected this run

#### Pause Menu
- Resume button
- Restart Level button
- Settings (quick access)
- Quit to Menu button

#### Level Complete
- "Level Complete" header
- Score breakdown
- Souls earned
- Star rating (1-3)
- "Next Level" button
- "Replay" button
- "Menu" button

#### Game Over
- "Game Over" header
- Final score
- Stats (monsters sliced, accuracy, time)
- "Retry" button
- "Menu" button
- (Endless) Leaderboard position

#### Leaderboards
- Tab navigation (All-Time / Weekly / Personal)
- Scrollable list
- Rank, Name, Score, Date columns
- Player's rank highlighted

#### Settings
- Sound effects toggle
- Music toggle
- Cloud save section (login/logout)
- Clear local data button (with confirmation)
- Credits button

---

## Technical Specification

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Language** | TypeScript |
| **Framework** | Phaser.js 3 |
| **Build Tool** | Vite |
| **Backend** | Supabase (auth, database, leaderboards) |
| **Local Storage** | Browser LocalStorage |
| **Audio** | Phaser Audio (Web Audio API) |

### Project Structure

```
monster-slayer/
├── public/
│   ├── assets/
│   │   ├── sprites/
│   │   │   ├── monsters/
│   │   │   │   ├── zombie.png
│   │   │   │   ├── vampire.png
│   │   │   │   └── ghost.png
│   │   │   ├── bosses/
│   │   │   ├── villagers/
│   │   │   ├── weapons/
│   │   │   ├── powerups/
│   │   │   └── ui/
│   │   ├── audio/
│   │   │   ├── sfx/
│   │   │   └── music/
│   │   └── backgrounds/
│   └── index.html
├── src/
│   ├── main.ts
│   ├── config/
│   │   ├── gameConfig.ts
│   │   ├── levelConfig.ts
│   │   ├── weaponConfig.ts
│   │   └── upgradeConfig.ts
│   ├── scenes/
│   │   ├── BootScene.ts
│   │   ├── PreloaderScene.ts
│   │   ├── MainMenuScene.ts
│   │   ├── WorldSelectScene.ts
│   │   ├── LevelSelectScene.ts
│   │   ├── GameplayScene.ts
│   │   ├── PauseScene.ts
│   │   ├── GameOverScene.ts
│   │   ├── LevelCompleteScene.ts
│   │   ├── CharacterScene.ts
│   │   ├── InventoryScene.ts
│   │   ├── ShopScene.ts
│   │   ├── LeaderboardScene.ts
│   │   └── SettingsScene.ts
│   ├── entities/
│   │   ├── Monster.ts
│   │   ├── Zombie.ts
│   │   ├── Vampire.ts
│   │   ├── Ghost.ts
│   │   ├── Boss.ts
│   │   ├── Villager.ts
│   │   ├── PowerUp.ts
│   │   └── SlashTrail.ts
│   ├── systems/
│   │   ├── SpawnSystem.ts
│   │   ├── SlashSystem.ts
│   │   ├── ComboSystem.ts
│   │   ├── ScoreSystem.ts
│   │   ├── DifficultySystem.ts
│   │   └── ProgressionSystem.ts
│   ├── managers/
│   │   ├── AudioManager.ts
│   │   ├── SaveManager.ts
│   │   ├── UpgradeManager.ts
│   │   └── WeaponManager.ts
│   ├── services/
│   │   ├── SupabaseService.ts
│   │   └── LeaderboardService.ts
│   ├── ui/
│   │   ├── Button.ts
│   │   ├── HUD.ts
│   │   ├── WeaponCard.ts
│   │   ├── LevelCard.ts
│   │   └── UpgradeBar.ts
│   ├── utils/
│   │   ├── constants.ts
│   │   ├── helpers.ts
│   │   └── types.ts
│   └── data/
│       ├── levels.json
│       ├── weapons.json
│       └── upgrades.json
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### Key TypeScript Interfaces

```typescript
// types.ts

interface GameSave {
  souls: number;
  unlockedWeapons: string[];
  weaponTiers: Record<string, number>;
  upgrades: Record<string, number>;
  completedLevels: string[]; // "1-1", "1-2", etc.
  equippedWeapon: string;
  settings: GameSettings;
  personalBests: ScoreEntry[];
}

interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  cloudSaveEnabled: boolean;
}

interface ScoreEntry {
  score: number;
  date: string;
  weapon: string;
}

interface LevelConfig {
  id: string;
  world: number;
  level: number;
  duration: number;
  minKills: number;
  spawnRate: number;
  monsterWeights: MonsterWeights;
  villagerChance: number;
  powerUpInterval: number;
  isBoss: boolean;
  bossId?: string;
}

interface MonsterWeights {
  zombie: number;
  vampire: number;
  ghost: number;
}

interface WeaponConfig {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  tierCosts: number[];
  effects: WeaponEffect[];
}

interface WeaponEffect {
  tier: number;
  type: string;
  value: number;
  description: string;
}

interface UpgradeConfig {
  id: string;
  name: string;
  description: string;
  maxTier: number;
  baseCost: number;
  costMultiplier: number;
  effectPerTier: number;
}
```

### Responsive Design

- **Base Resolution:** 1280 × 720 (16:9)
- **Scaling Mode:** Phaser Scale.FIT with centering
- **Mobile:** Touch input supported, UI elements sized for touch (min 44px tap targets)
- **Orientation:** Landscape preferred, portrait supported with adjusted layout

---

## Audio Design

### Sound Effects

| Sound | File | Variations | Trigger |
|-------|------|------------|---------|
| Slash | slash_01.wav - slash_05.wav | 5 | Slash velocity threshold met |
| Zombie Death | zombie_death.wav | 1 | Zombie sliced |
| Vampire Death | vampire_death.wav | 1 | Vampire sliced (+ bat scatter) |
| Ghost Death | ghost_death.wav | 1 | Ghost sliced |
| Villager Hit | villager_scream.wav | 1 | Villager sliced |
| Power-Up Collect | powerup.wav | 1 | Any power-up activated |
| Boss Hit | boss_hit.wav | 1 | Boss damaged |
| Boss Death | boss_death.wav | 1 | Boss defeated |
| UI Click | ui_click.wav | 1 | Button pressed |
| UI Hover | ui_hover.wav | 1 | Button hovered |
| Level Complete | level_complete.wav | 1 | Level completed |
| Game Over | game_over.wav | 1 | All lives lost |
| Combo | combo.wav | 1 | Combo milestone (5, 10, etc.) |

### Music

| Track | File | Usage |
|-------|------|-------|
| Main Menu | menu_theme.mp3 | Main menu, world select, shop |
| Gameplay (optional) | None initially | Can add later if desired |

---

## Save System

### Local Storage (Default)

- **Key:** `monster_slayer_save`
- **Format:** JSON string of GameSave interface
- **Auto-Save Triggers:**
  - Level complete
  - Purchase made
  - Weapon equipped
  - Settings changed

### Cloud Save (Optional)

- **Provider:** Supabase
- **Auth:** Email/password or anonymous with upgrade option
- **Sync Strategy:**
  - Pull from cloud on login
  - Push to cloud on significant changes
  - Conflict resolution: highest progress wins

### Data Migration

- Version number stored in save
- Migration functions for save format changes

---

## Development Roadmap

### Phase 1: Core Foundation (Week 1-2)

- [ ] Project setup (Vite + TypeScript + Phaser)
- [ ] Basic game scene with slash mechanic
- [ ] Slash trail visual effect
- [ ] Single monster type (zombie) spawning
- [ ] Basic collision detection
- [ ] Score counter

### Phase 2: Monsters & Gameplay (Week 3-4)

- [ ] All 3 monster types with unique behaviors
- [ ] Villagers with penalty system
- [ ] Combo system
- [ ] Power-ups (all 4 types)
- [ ] Lives system
- [ ] Game over flow

### Phase 3: Progression Systems (Week 5-6)

- [ ] Souls currency
- [ ] Weapon system (all 6 weapons)
- [ ] Weapon tiers and upgrades
- [ ] Character upgrades (all 5 types)
- [ ] Save system (local storage)

### Phase 4: Campaign (Week 7-8)

- [ ] All 5 worlds with backgrounds
- [ ] 25 levels with configurations
- [ ] Level select UI
- [ ] World select UI
- [ ] Difficulty scaling algorithm
- [ ] Star rating system

### Phase 5: Bosses (Week 9-10)

- [ ] Boss base class
- [ ] All 5 boss implementations
- [ ] Boss health bar UI
- [ ] Boss minion spawning
- [ ] Phase transitions

### Phase 6: UI Polish (Week 11-12)

- [ ] Main menu
- [ ] Character/loadout screen
- [ ] Inventory screen
- [ ] Shop screen
- [ ] Settings screen
- [ ] Pause menu
- [ ] Level complete screen
- [ ] Game over screen

### Phase 7: Endless Mode & Leaderboards (Week 13-14)

- [ ] Endless mode gameplay
- [ ] Score-based difficulty scaling
- [ ] Supabase integration
- [ ] Leaderboard UI
- [ ] Cloud save (optional feature)

### Phase 8: Polish & Launch (Week 15-16)

- [ ] All sound effects
- [ ] Menu music
- [ ] Mobile optimization
- [ ] Bug fixes
- [ ] Performance optimization
- [ ] Beta testing
- [ ] Launch!

---

## Asset Requirements

### Sprites Needed

**Monsters (each needs: idle, move, death animation frames)**
- Zombie: 8-12 frames
- Vampire: 8-12 frames
- Ghost: 8-12 frames (+ fade effect)

**Bosses (each needs: idle, attack, hurt, death, special animations)**
- Grave Titan: 20+ frames
- Headless Horseman: 20+ frames
- Vampire Lord: 20+ frames
- Phantom King: 20+ frames
- Demon Overlord: 30+ frames

**Villagers**
- 3-4 variants, 4-6 frames each

**Weapons**
- 6 weapon icons (for UI)
- 6 slash trail colors/styles

**Power-Ups**
- 4 icons

**UI Elements**
- Buttons (normal, hover, pressed)
- Cards (weapon, level, world)
- Hearts (full, empty)
- Stars (full, empty)
- Progress bars
- Panels/frames
- Icons (souls, settings, sound, etc.)

**Backgrounds**
- 5 world backgrounds (parallax layers preferred)
- Menu background

### Audio Needed

- 5 slash variations
- 3 monster death sounds
- 1 villager scream
- 5 UI sounds
- 1 boss hit, 1 boss death
- 1 menu music track (loopable)
- Combo milestone sound
- Level complete jingle
- Game over sound

---

## Future Expansion Ideas

- World 6+: New environments and monster types
- Daily challenges with special rewards
- Achievements system
- More weapon types
- Cosmetic unlocks (slash effects, backgrounds)
- Multiplayer mode (competitive or co-op)
- Seasonal events (Halloween special, etc.)

---

*Document Version: 1.0*
*Last Updated: December 2024*
