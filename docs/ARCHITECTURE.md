# Monster Slayer - Technical Architecture

## Overview

This document describes the technical architecture, design patterns, and implementation guidelines for the Monster Slayer game.

---

## Technology Stack

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Language | TypeScript | 5.x | Type-safe development |
| Framework | Phaser.js | 3.70+ | Game engine |
| Build Tool | Vite | 5.x | Fast builds, HMR |
| Backend | Supabase | Latest | Auth, database, realtime |
| State | Built-in | - | Phaser Registry + Managers |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         PHASER GAME                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                       SCENES                              │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐ │   │
│  │  │  Boot   │→│Preloader│→│MainMenu │→│ GameplayScene   │ │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────────────┘ │   │
│  │                              ↓               ↑↓          │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐ │   │
│  │  │Settings │ │  Shop   │ │Character│ │  LevelSelect    │ │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      MANAGERS (Singletons)                │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐  │   │
│  │  │  Save    │ │  Audio   │ │  Weapon  │ │   Upgrade   │  │   │
│  │  │ Manager  │ │ Manager  │ │ Manager  │ │   Manager   │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └─────────────┘  │   │
│  │  ┌──────────┐ ┌──────────┐                               │   │
│  │  │  Level   │ │Leaderboard│                              │   │
│  │  │ Manager  │ │ Service  │                               │   │
│  │  └──────────┘ └──────────┘                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                 GAMEPLAY SYSTEMS                          │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐  │   │
│  │  │  Slash   │ │  Spawn   │ │  Combo   │ │ Difficulty  │  │   │
│  │  │ System   │ │  System  │ │  System  │ │   System    │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └─────────────┘  │   │
│  │  ┌──────────┐ ┌──────────┐                               │   │
│  │  │  Score   │ │  PowerUp │                               │   │
│  │  │ System   │ │  System  │                               │   │
│  │  └──────────┘ └──────────┘                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      ENTITIES                             │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐  │   │
│  │  │ Monster  │ │ Villager │ │  PowerUp │ │    Boss     │  │   │
│  │  │ (base)   │ │          │ │  (base)  │ │   (base)    │  │   │
│  │  └────┬─────┘ └──────────┘ └────┬─────┘ └─────┬───────┘  │   │
│  │       │                         │             │          │   │
│  │  ┌────┴────┐              ┌─────┴─────┐ ┌─────┴───────┐  │   │
│  │  │ Zombie  │              │ SlowMo    │ │ GraveTitan  │  │   │
│  │  │ Vampire │              │ Frenzy    │ │ VampireLord │  │   │
│  │  │ Ghost   │              │ Shield    │ │ ...etc      │  │   │
│  │  └─────────┘              │ SoulMagnet│ └─────────────┘  │   │
│  │                           └───────────┘                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    UI COMPONENTS                          │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐  │   │
│  │  │  Button  │ │   HUD    │ │  Card    │ │   Panel     │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └─────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SUPABASE                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │    Auth      │  │  Leaderboard │  │    Cloud Saves       │   │
│  │   Service    │  │    Table     │  │      Table           │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Design Patterns

### 1. Singleton Managers

All managers are singletons accessed via Phaser's plugin system or registry.

```typescript
// Registration in BootScene
this.game.registry.set('saveManager', new SaveManager());
this.game.registry.set('audioManager', new AudioManager(this));

// Access from any scene
const saveManager = this.game.registry.get('saveManager') as SaveManager;
```

### 2. Entity Component Pattern

Monsters use inheritance with shared base behavior.

```typescript
abstract class Monster extends Phaser.Physics.Arcade.Sprite {
  protected health: number;
  protected speed: number;
  protected points: number;
  
  abstract onSliced(): void;
  abstract getDeathParticles(): ParticleConfig;
}

class Zombie extends Monster {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'zombie');
    this.health = 1;
    this.speed = 100;
    this.points = 10;
  }
  
  onSliced(): void {
    // Split into two halves
  }
}
```

### 3. System Pattern

Gameplay systems are modular and communicate via events.

```typescript
class ComboSystem {
  private combo: number = 0;
  private comboTimer: Phaser.Time.TimerEvent;
  
  constructor(private scene: Phaser.Scene) {
    scene.events.on('monster-sliced', this.onMonsterSliced, this);
  }
  
  private onMonsterSliced(): void {
    this.combo++;
    this.resetTimer();
    this.scene.events.emit('combo-updated', this.combo);
  }
}
```

### 4. Observer Pattern (Events)

Scenes and systems communicate via Phaser's event emitter.

```typescript
// GameplayScene.ts
this.events.emit('monster-sliced', { monster, points, position });
this.events.emit('villager-sliced', { villager, penalty });
this.events.emit('game-over', { score, stats });
this.events.emit('level-complete', { score, stars });

// HUD.ts
scene.events.on('score-updated', this.updateScore, this);
scene.events.on('combo-updated', this.updateCombo, this);
scene.events.on('lives-changed', this.updateLives, this);
```

### 5. State Pattern (Game States)

GameplayScene uses states for different modes.

```typescript
enum GameState {
  PLAYING,
  PAUSED,
  BOSS_INTRO,
  BOSS_FIGHT,
  LEVEL_COMPLETE,
  GAME_OVER
}

class GameplayScene extends Phaser.Scene {
  private state: GameState = GameState.PLAYING;
  
  update(time: number, delta: number): void {
    switch (this.state) {
      case GameState.PLAYING:
        this.updatePlaying(delta);
        break;
      case GameState.BOSS_FIGHT:
        this.updateBossFight(delta);
        break;
      // ...
    }
  }
}
```

---

## Scene Flow

```
Boot → Preloader → MainMenu
                      │
          ┌───────────┼───────────┬────────────┬────────────┐
          ▼           ▼           ▼            ▼            ▼
      WorldSelect  Character    Shop      Leaderboard   Settings
          │           │
          ▼           ▼
     LevelSelect  Inventory
          │
          ▼
     Gameplay ←──────────────────┐
          │                      │
    ┌─────┴─────┐                │
    ▼           ▼                │
LevelComplete  GameOver          │
    │           │                │
    └───────────┴────────────────┘
```

---

## Data Flow

### Save Data Flow

```
User Action (purchase, level complete, etc.)
         │
         ▼
    Manager.update()
         │
         ▼
    SaveManager.save()
         │
    ┌────┴────┐
    ▼         ▼
LocalStorage  Supabase (if logged in)
```

### Gameplay Data Flow

```
User Input (mouse/touch)
         │
         ▼
    SlashSystem.update()
         │
         ├── Velocity threshold check
         │
         ▼
    SlashTrail.addPoint()
         │
         ▼
    CollisionCheck (line vs circles)
         │
    ┌────┴────┬────────────┐
    ▼         ▼            ▼
  Monster   Villager    PowerUp
  .slice()  .slice()    .collect()
    │         │            │
    ▼         ▼            ▼
  Events    Events      Events
  emitted   emitted     emitted
    │         │            │
    ▼         ▼            ▼
ScoreSystem ComboSystem PowerUpSystem
    │         │            │
    └────┬────┴────────────┘
         ▼
    HUD.update()
```

---

## Key Algorithms

### Slash Velocity Detection

```typescript
class SlashSystem {
  private lastPosition: Phaser.Math.Vector2;
  private velocityThreshold: number = 300; // pixels per second
  
  update(pointer: Phaser.Input.Pointer, delta: number): boolean {
    const currentPos = new Phaser.Math.Vector2(pointer.x, pointer.y);
    
    if (this.lastPosition) {
      const distance = currentPos.distance(this.lastPosition);
      const velocity = distance / (delta / 1000);
      
      this.lastPosition = currentPos;
      return velocity >= this.velocityThreshold;
    }
    
    this.lastPosition = currentPos;
    return false;
  }
}
```

### Line-Circle Intersection (Slash Hit Detection)

```typescript
function lineIntersectsCircle(
  lineStart: Phaser.Math.Vector2,
  lineEnd: Phaser.Math.Vector2,
  circleCenter: Phaser.Math.Vector2,
  circleRadius: number
): boolean {
  const d = lineEnd.clone().subtract(lineStart);
  const f = lineStart.clone().subtract(circleCenter);
  
  const a = d.dot(d);
  const b = 2 * f.dot(d);
  const c = f.dot(f) - circleRadius * circleRadius;
  
  let discriminant = b * b - 4 * a * c;
  
  if (discriminant < 0) {
    return false;
  }
  
  discriminant = Math.sqrt(discriminant);
  const t1 = (-b - discriminant) / (2 * a);
  const t2 = (-b + discriminant) / (2 * a);
  
  return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
}
```

### Difficulty Scaling Formula

```typescript
class DifficultySystem {
  calculateDifficulty(world: number, level: number, isBoss: boolean): number {
    let base = (world * 1.5) + (level * 0.3);
    if (isBoss) base += 2;
    return base;
  }
  
  getSpawnRate(difficulty: number, baseRate: number): number {
    return baseRate * (1 + difficulty * 0.15);
  }
  
  getSpeedMultiplier(difficulty: number): number {
    return 1 + (difficulty * 0.04);
  }
  
  // Endless mode scaling
  getEndlessDifficulty(score: number): number {
    return Math.floor(score / 1000);
  }
}
```

### Monster Launch Trajectory

```typescript
class SpawnSystem {
  spawnMonster(type: MonsterType): Monster {
    // Random x position along bottom
    const x = Phaser.Math.Between(100, this.scene.scale.width - 100);
    const y = this.scene.scale.height + 50;
    
    // Calculate velocity to create arc
    const targetX = Phaser.Math.Between(200, this.scene.scale.width - 200);
    const peakY = Phaser.Math.Between(100, 300); // How high it goes
    
    // Physics formula for required velocity
    const gravity = 800;
    const heightDiff = y - peakY;
    const velocityY = -Math.sqrt(2 * gravity * heightDiff);
    
    // Time to reach peak
    const timeToPeak = -velocityY / gravity;
    
    // Horizontal velocity to reach target x at peak
    const velocityX = (targetX - x) / timeToPeak;
    
    const monster = this.createMonster(type, x, y);
    monster.setVelocity(velocityX, velocityY);
    monster.body.setGravityY(gravity);
    
    return monster;
  }
}
```

---

## Object Pooling

For performance, monsters and particles use object pooling.

```typescript
class MonsterPool {
  private pools: Map<MonsterType, Phaser.GameObjects.Group> = new Map();
  
  constructor(private scene: Phaser.Scene) {
    this.pools.set(MonsterType.ZOMBIE, scene.add.group({
      classType: Zombie,
      maxSize: 20,
      runChildUpdate: true
    }));
    // ... other types
  }
  
  spawn(type: MonsterType, x: number, y: number): Monster {
    const pool = this.pools.get(type);
    const monster = pool.get(x, y) as Monster;
    
    if (monster) {
      monster.setActive(true);
      monster.setVisible(true);
      monster.reset();
    }
    
    return monster;
  }
  
  despawn(monster: Monster): void {
    monster.setActive(false);
    monster.setVisible(false);
  }
}
```

---

## File Organization

```
src/
├── main.ts                 # Entry point, game config
├── config/
│   ├── gameConfig.ts       # Phaser game configuration
│   ├── constants.ts        # Game constants
│   └── types.ts            # TypeScript interfaces
│
├── scenes/
│   ├── BootScene.ts        # Initial loading, manager setup
│   ├── PreloaderScene.ts   # Asset loading with progress
│   ├── MainMenuScene.ts    # Main menu
│   ├── WorldSelectScene.ts # World selection
│   ├── LevelSelectScene.ts # Level selection within world
│   ├── GameplayScene.ts    # Main gameplay
│   ├── CharacterScene.ts   # Loadout screen
│   ├── InventoryScene.ts   # Weapon inventory
│   ├── ShopScene.ts        # Shop for weapons/upgrades
│   ├── LeaderboardScene.ts # Online leaderboards
│   └── SettingsScene.ts    # Settings
│
├── entities/
│   ├── Monster.ts          # Base monster class
│   ├── Zombie.ts           # Zombie implementation
│   ├── Vampire.ts          # Vampire implementation
│   ├── Ghost.ts            # Ghost implementation
│   ├── Villager.ts         # Villager (avoid slicing)
│   ├── Boss.ts             # Base boss class
│   ├── bosses/             # Individual boss implementations
│   │   ├── GraveTitan.ts
│   │   ├── HeadlessHorseman.ts
│   │   ├── VampireLord.ts
│   │   ├── PhantomKing.ts
│   │   └── DemonOverlord.ts
│   ├── PowerUp.ts          # Base power-up class
│   ├── powerups/           # Individual power-up implementations
│   │   ├── SlowMotionPowerUp.ts
│   │   ├── FrenzyPowerUp.ts
│   │   ├── ShieldPowerUp.ts
│   │   └── SoulMagnetPowerUp.ts
│   └── SlashTrail.ts       # Visual slash trail
│
├── systems/
│   ├── SlashSystem.ts      # Slash detection and collision
│   ├── SpawnSystem.ts      # Monster spawning logic
│   ├── ComboSystem.ts      # Combo tracking
│   ├── ScoreSystem.ts      # Score calculation
│   ├── DifficultySystem.ts # Difficulty scaling
│   ├── PowerUpSystem.ts    # Power-up management
│   └── ProgressionSystem.ts# Level/world progression
│
├── managers/
│   ├── SaveManager.ts      # Local storage save/load
│   ├── AudioManager.ts     # Sound and music
│   ├── WeaponManager.ts    # Weapon data and effects
│   ├── UpgradeManager.ts   # Character upgrades
│   └── LevelManager.ts     # Level configuration
│
├── services/
│   ├── SupabaseService.ts  # Supabase client wrapper
│   └── LeaderboardService.ts # Leaderboard API calls
│
├── ui/
│   ├── Button.ts           # Reusable button component
│   ├── Panel.ts            # Background panel
│   ├── Card.ts             # Card component (weapons, levels)
│   ├── HUD.ts              # In-game HUD
│   ├── BossHealthBar.ts    # Boss health display
│   └── ComboDisplay.ts     # Combo counter display
│
├── utils/
│   ├── helpers.ts          # Utility functions
│   └── math.ts             # Math helpers (collision, etc.)
│
└── data/
    ├── levels.json         # Level configurations
    ├── weapons.json        # Weapon definitions
    └── upgrades.json       # Upgrade definitions
```

---

## Performance Considerations

### Optimization Checklist

1. **Object Pooling**
   - [ ] Monster pool (max 30 active)
   - [ ] Particle pool (max 100 active)
   - [ ] Projectile pool for bosses

2. **Texture Atlases**
   - [ ] Combine all monster sprites into single atlas
   - [ ] Combine all UI elements into single atlas
   - [ ] Use Texture Packer or similar tool

3. **Update Loop Efficiency**
   - [ ] Only update active/visible objects
   - [ ] Use spatial partitioning if needed (unlikely for this game)
   - [ ] Batch collision checks

4. **Memory Management**
   - [ ] Destroy unused objects
   - [ ] Clear event listeners on scene shutdown
   - [ ] Avoid creating objects in update loops

5. **Mobile-Specific**
   - [ ] Reduce particle counts on mobile
   - [ ] Use lower resolution textures if needed
   - [ ] Test on low-end devices

---

## Testing Strategy

### Unit Tests
- Difficulty formulas
- Score calculations
- Save data serialization
- Line-circle intersection math

### Integration Tests
- Save/load cycle
- Leaderboard submission
- Weapon effect application

### Manual Testing Checklist
- [ ] All 25 levels completable
- [ ] All 5 bosses beatable
- [ ] All weapons functional
- [ ] All upgrades apply correctly
- [ ] Save persists after refresh
- [ ] Leaderboard updates correctly
- [ ] Works on Chrome, Firefox, Safari
- [ ] Works on iOS Safari
- [ ] Works on Android Chrome

---

## Deployment

### Build Process

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production
npm run preview
```

---

## Asset Loading System

The asset loading system provides centralized, efficient management of all game assets.

### Components

#### 1. AssetRegistry
Central registry of all game assets with metadata:
- Asset configurations (type, path, priority, bundle)
- Bundle definitions (groupings of related assets)
- Query methods for filtering by bundle, priority, tags

Location: `src/managers/AssetRegistry.ts`

**Key Features:**
- Type-safe asset configuration
- Priority-based loading order
- Tag-based filtering
- Automatic bundle population

#### 2. LoadingManager
Coordinates all asset loading operations:
- Loads bundles with priority ordering
- Tracks progress with fine-grained details
- Implements retry logic with exponential backoff
- Manages loaded/failed asset state
- Handles memory cleanup

Location: `src/managers/LoadingManager.ts`

**Key Features:**
- Bundle-based loading
- Individual asset loading
- Progress tracking with callbacks
- Error handling with retry logic
- Asset unloading for memory management

#### 3. ProgressTracker
Fine-grained progress tracking:
- Tracks total, loaded, failed assets
- Calculates percentage and ETA
- Error tracking with asset keys
- Real-time progress callbacks

Location: `src/managers/ProgressTracker.ts`

**Key Features:**
- Real-time progress updates
- Error collection
- Speed calculation (assets/sec)
- Estimated time remaining

#### 4. LazyLoader
Utility for convenient on-demand loading:
- Preloads scene-specific assets
- Loads world-specific bundles
- Automatically unloads unused bundles
- Memory statistics tracking

Location: `src/managers/LazyLoader.ts`

**Key Features:**
- Scene-based preloading
- World-specific asset loading
- Automatic memory management
- Memory usage statistics

### Asset Bundles

```
┌─────────────────────────────────────────────────────────┐
│                   Asset Bundles                    │
├─────────────────────────────────────────────────────────┤
│ BOOT → UI → CORE → EFFECTS → WORLD → AUDIO    │
│ (Critical) (High) (Normal) (Low) (Optional)  │
└─────────────────────────────────────────────────────────┘
```

**Bundle Loading Strategy:**

1. **BOOT Bundle** (Critical - Immediate)
   - Button textures for loading screen
   - Loads in BootScene

2. **UI Bundle** (High - Immediate)
   - All HUD elements, icons, panels
   - Loads in PreloaderScene

3. **CORE_GAMEPLAY Bundle** (High - Immediate)
   - Enemies, villagers, weapons
   - Loads in PreloaderScene

4. **EFFECTS Bundle** (Normal - Immediate)
   - Particle effects, slicing effects
   - Loads in PreloaderScene

5. **WORLD Bundles** (Normal - Lazy)
   - World 1: Loads immediately
   - World 2-5: Load on-demand per world
   - Unload when leaving world

6. **AUDIO Bundles** (Low - Lazy)
   - Music: Load first track, lazy load rest
   - SFX: Load first sounds, lazy load rest
   - Unload unused audio when possible

### Loading Flow

```mermaid
flowchart TD
    subgraph "Loading Flow"
        BootScene["BootScene<br/>Initialize System"]
        Preloader["PreloaderScene<br/>Load Critical Bundles"]
        Gameplay["GameplayScene<br/>Lazy Load World Assets"]
        MainMenu["MainMenu<br/>Unload Unused"]
    end
    
    BootScene -->|"Initialize"| LoadingMgr["LoadingManager"]
    LoadingMgr -->|"Load: BOOT, UI, CORE, EFFECTS, WORLD_1"| Preloader
    Preloader -->|"Display Progress"| Progress["ProgressTracker"]
    Progress -->|"Update: %, current asset"| Preloader
    
    Preloader -->|"Transition"| MainMenu
    
    MainMenu -->|"Load: WORLD_2"| Gameplay
    Gameplay -->|"Lazy Load"| LoadingMgr
    LoadingMgr -->|"Unload: WORLD_3, 4, 5"| MainMenu
end
```

### Lazy Loading Strategy

**When to Lazy Load:**
- Large assets (> 500KB)
- World-specific content
- Boss-specific assets
- Audio/music files
- Non-essential effects

**Preload at Startup:**
- UI elements
- Core gameplay sprites
- Essential effects
- World 1 assets

**Memory Management:**
```typescript
// In GameplayScene
create(): void {
  // Load world assets
  lazyLoader.preloadWorldAssets(this.worldId);
  
  // Clean up on scene shutdown
  this.events.once('shutdown', () => {
    lazyLoader.unloadUnusedBundles([
      AssetBundle.UI,
      AssetBundle.CORE_GAMEPLAY,
      // Keep critical bundles
    ]);
  });
}
```

### Progress Tracking

**Progress Information:**
```typescript
interface LoadProgress {
  total: number;        // Total assets to load
  loaded: number;       // Successfully loaded
  failed: number;       // Failed to load
  percentage: number;   // 0-100 completion
  currentAsset: string; // Currently loading
  category: string;     // Current bundle category
  errors: Array<{ key: string; error: string }>;
  startTime: number;    // Load start timestamp
  elapsed: number;       // Time elapsed in seconds
  estimatedRemaining: number; // Estimated seconds remaining
}
```

**Usage:**
```typescript
loadingManager.onProgress((progress: LoadProgress) => {
  console.log(`Loading: ${progress.percentage}%`);
  console.log(`Current: ${progress.currentAsset}`);
  console.log(`Failed: ${progress.failed}`);
  console.log(`ETA: ${progress.estimatedRemaining}s`);
});
```

### Error Handling

**Retry Logic:**
- Max 3 retries per asset
- Exponential backoff: 1s, 2s, 4s
- Graceful degradation on final failure
- User notification for non-critical assets

**Error Recovery:**
```typescript
// Critical assets (UI, Core): Show error, continue with fallbacks
// Non-critical (Audio, Worlds): Log warning, continue without
// Data (JSON): Use default values if load fails
```

### Memory Management

**Automatic Unloading:**
```typescript
// LazyLoader automatically unloads when:
lazyLoader.unloadUnusedBundles([
  AssetBundle.UI,      // Keep UI in menus
  AssetBundle.CORE_GAMEPLAY, // Keep core in gameplay
]);
```

**Manual Unloading:**
```typescript
loadingManager.unloadAsset('boss_gravetitan');
loadingManager.unloadBundle(AssetBundle.WORLD_2);
```

### Performance Targets

| Metric | Target | Notes |
|---------|--------|-------|
| Initial load time | < 3s | Critical bundles only |
| Lazy load time | < 1s | Single bundle |
| Memory usage | < 200MB | With lazy loading |
| Failed asset rate | < 1% | With retry logic |

### Integration with Existing Systems

**AudioManager:**
```typescript
// Lazy load audio on-demand
playMusic(key: string, config?: SoundConfig): void {
  if (!this.scene.cache.audio.exists(key)) {
    LoadingManager.getInstance().lazyLoadAsset(key);
  }
  // ... play music
}
```

**DataLoader:**
```typescript
// Check LoadingManager for cached data
async loadWeapons(): Promise<WeaponConfig[]> {
  const loadingManager = LoadingManager.getInstance();
  if (loadingManager.isAssetLoaded('data_weapons')) {
    // Retrieve from registry
    return this.scene.registry.get('weapons');
  }
  // ... load via fetch
}
```

### Best Practices

1. **Add New Assets:**
   - Register in AssetRegistry with correct type
   - Add to appropriate bundle
   - Set appropriate priority (CRITICAL for UI)
   - Add descriptive tags for filtering

2. **Lazy Load Appropriately:**
   - Preload assets before they're needed
   - Unload unused bundles when possible
   - Keep critical bundles in memory
   - Use scene transitions for cleanup

3. **Monitor Performance:**
   - Track initial load time
   - Monitor memory usage
   - Test on slow connections
   - Check for memory leaks

4. **Handle Errors Gracefully:**
   - Non-critical assets → Continue without
   - Critical assets → Use procedural fallbacks
   - Show user notifications for failures
   - Log errors for debugging

### Related Documentation

- [ASSET_LOADING_GUIDE.md](ASSET_LOADING_GUIDE.md) - Detailed asset loading guide
- [PERFORMANCE_GUIDE.md](PERFORMANCE_GUIDE.md) - Performance optimization

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Hosting Options

1. **Vercel** (Recommended)
   - Free tier sufficient
   - Automatic deployments from Git
   - Edge network

2. **Netlify**
   - Similar to Vercel
   - Free tier available

3. **GitHub Pages**
   - Free
   - Static only (perfect for this)

4. **itch.io**
   - Game-focused platform
   - Built-in community
