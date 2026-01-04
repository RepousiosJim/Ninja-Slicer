# Architecture Documentation - v1.0

## Overview

Ninja Slicer follows a component-based architecture with clear separation of concerns. The codebase is organized into logical layers: config, entities, managers, scenes, systems, UI components, and utilities.

## Architecture Version: 1.1 (Updated 2025)

**Latest Changes:**
- ✅ PerformanceMonitor integrated into BaseScene
- ✅ All managers implement IManager interface
- ✅ ObjectPool integrated into ParticleSystem
- ✅ GameplayScene migrated to BaseScene pattern

---

## Directory Structure

```
src/
 ├── config/          # Configuration and type definitions
 ├── entities/         # Game entities (monsters, power-ups, etc.)
 ├── managers/        # Game state and logic managers
 ├── scenes/           # Game scenes (screens)
 ├── systems/          # Game systems (slash, particles, etc.)
 ├── ui/               # UI components
 ├── utils/            # Utility functions and helpers
 └── main.ts          # Application entry point
```

---

## Core Architectural Patterns

### 1. Singleton Pattern
**Usage:** Managers that need global access

**Examples:**
```typescript
// Access from anywhere
const energyManager = SlashEnergyManager.getInstance();
const weaponManager = WeaponManager.getInstance();
const saveManager = new SaveManager();
```

**Implementation:**
```typescript
export class SlashEnergyManager implements IManager {
  private static instance: SlashEnergyManager | null = null;

  static getInstance(): SlashEnergyManager {
    if (!SlashEnergyManager.instance) {
      SlashEnergyManager.instance = new SlashEnergyManager();
    }
    return SlashEnergyManager.instance;
  }

  initialize(scene?: Phaser.Scene): void { /* ... */ }
  reset(): void { /* ... */ }
  shutdown(): void { /* ... */ }
}
```

**Locations:**
- `SlashEnergyManager` - Energy tracking
- `WeaponManager` - Weapon state
- `UpgradeManager` - Upgrade system
- `PowerUpManager` - Power-up management
- `LevelManager` - Level progression
- `SaveManager` - Local storage
- `AudioManager` - Sound and music

---

### 2. Manager Interface Pattern (IManager)
**Purpose:** Standardized lifecycle for all managers

**Interface Definition:**
```typescript
export interface IManager {
  initialize(scene?: Phaser.Scene): void;
  reset(): void;
  shutdown(): void;
}
```

**All Managers Implement IManager:**
- ✅ SlashEnergyManager
- ✅ PowerUpManager
- ✅ WeaponManager
- ✅ UpgradeManager
- ✅ AudioManager
- ✅ SaveManager
- ✅ LevelManager

**Usage:**
```typescript
// Initialize all managers with consistent API
manager.initialize(scene);

// Reset manager state
manager.reset();

// Clean up on shutdown
manager.shutdown();
```

---

### 3. Base Class Pattern
**Purpose:** Common functionality for related classes

**Base Classes Created:**
- `BaseScene` - Common scene lifecycle with performance monitoring
- `BaseEntity` - Common entity behavior (health, damage)
- `BaseComponent` - Common UI interaction (animations, interactivity)

#### BaseScene Implementation
```typescript
export abstract class BaseScene extends Phaser.Scene {
  protected audioManager: AudioManager | null = null;
  protected saveManager: SaveManager;
  protected performanceMonitor: PerformanceMonitor;
  protected debugMode: boolean = false;

  initializeAudio(): void {
    this.audioManager = new AudioManager(this);
    this.audioManager.initialize();
  }

  setupEventListeners(): void {
    this.events.on('resize', this.handleResize, this);
    this.events.on('orientationchange', this.handleOrientationChange, this);
  }

  updatePerformance(delta: number): void {
    this.performanceMonitor.updateFPS(delta);
    if (this.debugMode) {
      this.updateDebugInfo();
    }
  }

  getPerformanceStats() {
    return this.performanceMonitor.getPerformanceStats();
  }
}

// Extend from BaseScene
export class GameplayScene extends BaseScene {
  update(time: number, delta: number): void {
    if (this.isPaused) return;
    this.updatePerformance(delta);
    // Game-specific logic
  }
}
```

**Scenes Using BaseScene:**
- ✅ GameplayScene (migrated)

---

### 4. Object Pooling Pattern
**Purpose:** Reuse objects to avoid garbage collection

**Generic ObjectPool:**
```typescript
export class ObjectPool<T> {
  private available: T[] = [];
  private inUse: Set<T> = new Set();

  get(): T | null { /* Returns object from pool */ }
  release(obj: T): void { /* Returns object to pool */ }
  clear(): void { /* Clears all objects */ }
}
```

**Phaser-Specific Pool:**
```typescript
export class PhaserPool<T extends Phaser.GameObjects.GameObject> {
  spawn(x: number, y: number): T | null { /* Activate and position */ }
  despawn(obj: T): void { /* Deactivate and return to pool */ }
  getActive(): T[] { /* Get all active objects */ }
}
```

**Locations Using ObjectPool:**
- ✅ ParticleSystem - Pooled emitters for particle effects

---

## Directory Structure

```
src/
├── config/          # Configuration and type definitions
├── entities/         # Game entities (monsters, power-ups, etc.)
├── managers/        # Game state and logic managers
├── scenes/           # Game scenes (screens)
├── systems/          # Game systems (slash, particles, etc.)
├── ui/               # UI components
├── utils/            # Utility functions and helpers
└── main.ts          # Application entry point
```

---

## Core Architectural Patterns

### 1. Singleton Pattern
**Usage:** Managers that need global access

**Examples:**
```typescript
// Access from anywhere
const energyManager = SlashEnergyManager.getInstance();
const saveManager = new SaveManager();
```

**Implementation:**
```typescript
export class SlashEnergyManager {
  private static instance: SlashEnergyManager | null = null;

  static getInstance(): SlashEnergyManager {
    if (!SlashEnergyManager.instance) {
      SlashEnergyManager.instance = new SlashEnergyManager();
    }
    return SlashEnergyManager.instance;
  }
}
```

**Locations:**
- `SlashEnergyManager` - Energy tracking
- `SaveManager` - Local storage
- `AudioManager` - Sound and music

---

### 2. Base Class Pattern
**Purpose:** Common functionality for related classes

**Base Classes Created:**
- `BaseScene` - Common scene lifecycle
- `BaseEntity` - Common entity behavior
- `BaseComponent` - Common UI interaction

**Implementation:**
```typescript
// BaseScene provides common scene functionality
export abstract class BaseScene extends Phaser.Scene {
  protected audioManager: AudioManager | null = null;
  protected saveManager: SaveManager;
  protected debugMode: boolean = false;

  initializeAudio(): void {
    this.audioManager = new AudioManager(this);
    this.audioManager.initialize();
  }

  setupEventListeners(): void {
    this.events.on('resize', this.handleResize, this);
    this.events.on('orientationchange', this.handleOrientationChange, this);
  }

  cleanup(): void {
    this.events.off('resize', this.handleResize, this);
    this.events.off('orientationchange', this.handleOrientationChange, this);
    this.audioManager?.stopMusic();
  }
}

// Extend from BaseScene
export class GameplayScene extends BaseScene {
  create(): void {
    super.create(); // Initializes audioManager, event listeners, etc.
    // Add gameplay-specific logic
  }
}
```

---

### 3. Manager Interface Pattern
**Purpose:** Consistent initialization and cleanup

**Interface:**
```typescript
export interface IManager {
  initialize(scene?: Phaser.Scene): void | Promise<void>;
  reset(): void;
  shutdown(): void;
}
```

**Benefits:**
- Predictable API across all managers
- Easy testing with mock implementations
- Consistent lifecycle management

---

### 4. Object Pooling Pattern
**Purpose:** Reduce garbage collection pressure

**Usage:**
```typescript
// Create pool
const particlePool = new ObjectPool<Particle>(
  () => new Particle(scene, x, y),
  (particle) => particle.reset(),
  20, // Initial size
  50, // Max size
);

// Get from pool
const particle = particlePool.get();

// Return to pool
particlePool.release(particle);
```

**Benefits:**
- Improved performance (fewer GC pauses)
- Memory stability
- Reusable object lifecycle

---

### 5. Event-Driven Architecture
**Event System:** `src/utils/EventBus.ts`

**Key Events:**
```typescript
'monster-sliced'     - Monster hit by slash
'villager-sliced'   - Villager hit (penalty)
'boss-hit'         - Boss damaged
'boss-defeated'      - Boss killed
'level-complete'    - Level finished
'score-updated'     - Score increased
'combo-updated'      - Combo increased
'game-over'         - Game lost
'settings-changed'  - Settings modified
'slash-energy-changed' - Energy updated
'slash-power-changed' - Power level changed
'slash-pattern-detected' - Pattern recognized
```

**Usage:**
```typescript
// Emit event
EventBus.emit('monster-sliced', { type: 'zombie', points: 10 });

// Listen to event
EventBus.on('monster-sliced', this.handleMonsterSliced, this);
```

**Benefits:**
- Loose coupling between systems
- Easy to add new event listeners
- Testable in isolation

---

## Scene Flow

### Main Menu Flow
```
MainMenuScene
    ↓
    ├─→ WorldSelectScene
    │     └─→ LevelSelectScene
    │         └─→ GameplayScene
    │             └─→ LevelCompleteScene
    │             └─→ GameOverScene
    │
    ├─→ EndlessGameplayScene
    │     └─→ GameOverScene
    │
    ├─→ CharacterScene
    ├─→ ShopScene
    ├─→ SettingsScene
    └─→ UpdatesScene
```

### Game Flow
```
GameplayScene
    ↓
    ├─→ SlashSystem (input → pattern → collision)
    ├─→ SpawnSystem (monster spawning)
    ├─→ ComboSystem (combo tracking)
    ├─→ PowerUpManager (power-up spawning)
    ├─→ DifficultySystem (difficulty scaling)
    ├─→ Monster entities (update and collision)
    ├─→ HUD (UI display)
    └─→ PauseScene (on pause)
```

### Save/Load Flow
```
Start
  ↓
SaveManager.load()
  ↓
    managers initialized with loaded data
  ↓
    Gameplay starts
  ↓
    SaveManager.save() (periodic or on level complete)
  ↓
    SaveManager.uploadToCloud() (if enabled)
```

---

## Data Flow

### Input Processing
```
User Input (Mouse/Touch)
    ↓
SlashSystem.update(pointer, delta)
    ↓
└─→ Pattern Detection
    └─→ Collision Detection
     └→ EventBus.emit('monster-sliced')
```

### Game State Updates
```
Monster killed
    ↓
SlashEnergyManager.consumeEnergy(distance)
    ↓
ScoreSystem.updateScore(points)
    ↓
ComboSystem.incrementCombo()
    ↓
HUD.updateScore(), updateCombo()
```

### Manager Communication
```
EventBus.emit('monster-sliced', data)
    ↓
ScoreSystem.onMonsterSliced(data)
    ↓
SaveManager.addSouls(data.souls)
    ↓
HUD.updateScoreDisplay()
```

---

## Component Dependencies

### Scene Dependencies
```
MainMenuScene
  ├── SaveManager (load data, settings)
  ├── AudioManager (play music)
  └── AtmosphericBackground (visuals)

GameplayScene
  ├── SaveManager (load data)
  ├── AudioManager (play/stop music, sfx)
  ├── SlashSystem (slash detection)
  ├── SpawnSystem (monster spawning)
  ├── ComboSystem (combo tracking)
  ├── PowerUpManager (power-up spawning)
  ├── DifficultySystem (difficulty scaling)
  ├── HUD (UI display)
  ├── Monster entities (zombie, vampire, ghost, etc.)
  ├── Boss entities (5 boss types)
  └── PauseScene (on pause)
```

### Manager Dependencies
```
AudioManager
  ├── SupabaseService (cloud saves)
  ├── SaveManager (volume settings)

SaveManager
  ├── localStorage (local persistence)
  ├── SupabaseService (cloud backup)

WeaponManager
  ├── SaveManager (load/save unlocked weapons)
  ├── SaveManager (load/save tiers)
```

---

## Type System

### Type Hierarchy
```
types.ts
├── Enums
│   ├── MonsterType, PowerUpType, WeaponId
│   ├── GameState, SlashPatternType, SlashPowerLevel
│   └── WeaponRarity
├── Interfaces
│   ├── GameSave, GameSettings
│   ├── SlashPoint, SlashPatternResult
│   ├── WeaponConfig, WeaponEffect, WeaponTier
│   ├── LevelConfig, WorldConfig, BossConfig
│   └── ... more...
└── Utility Types
│       ├── Vector2, Bounds, DeepPartial
│       └── Theme types
```

### Type Safety
- ✅ Zero TypeScript compilation errors
- ✅ Explicit return types on public methods
- ✅ Minimal `any` types (only where unavoidable)
- ✅ Comprehensive interfaces for all data structures
- ✅ Strict type checking enabled in tsconfig.json

---

## Performance Architecture

### Object Pooling System
**Components:**
- `ObjectPool<T>` - Generic pool
- `PhaserPool<T>` - Phaser game object pool

**PerformanceMonitor:**
- FPS tracking with 60-frame history
- Frame time measurement
- Performance grading (A-F)
- Automatic quality recommendation
- Low performance detection

**Optimizations:**
- Object pooling for frequently created objects
- Texture caching via TextureGenerator
- Lazy loading consideration (not yet implemented)
- Optimized update loops (only update changed entities)

---

## Testing Strategy

### Unit Testing (Not Implemented)
**Recommended Framework:** Vitest

**Test Coverage Goals:**
- Utilities: 90%+
- Managers: 80%+
- Systems: 70%+
- Scenes: 60%+
- Components: 50%+

### Manual Testing Checklist
- [ ] Main menu navigation flow
- [ ] Game flow (start → play → complete → game over)
- [ ] Save/load functionality
- [ ] All manager initialization
- [ ] Settings persistence
- [ ] Performance under various loads

---

## Debug System

### Debug Mode
**Activation:** Press **D** in any scene

**Features:**
- Visual hit box overlays for interactive elements
- Performance stats overlay (Press **F1**)
- FPS counter display
- Memory usage tracking

**Implementation:**
```typescript
protected toggleDebugMode(): void {
  this.debugMode = !this.debugMode;

  // Visual hit boxes
  this.dashboardCards.forEach((card) => {
    if (this.debugMode) {
      card.enableDebugHitBox();
    } else {
      card.disableDebugHitBox();
    }
  });

  console.log(`Debug mode: ${this.debugMode ? 'ON' : 'OFF'}`);
}
```

---

## Build & Deployment

### Build System
**File:** `vite.config.ts`

**Build Commands:**
```bash
# Development
npm run dev

# Type checking
npm run typecheck

# Production build
npm run build

# Preview build
npm run preview
```

### Build Performance
- **Initial Load:** <3 seconds
- **Scene Transitions:** <500ms
- **Time to Interactive:** <1 second
- **Production Build Time:** ~18 seconds

### Bundle Sizes (Current)
- **Total JS:** 546.58 kB (gzipped: 147.94 kB)
- **Main Bundle:** ~400 kB
- **Phaser Bundle:** ~1.4 MB
- **Supabase Bundle:** ~168 kB (gzipped: 42 kB)

### Compilation Status
- ✅ TypeScript: 0 compilation errors
- ⚠️ Warnings: 32 unused variable warnings (non-blocking)
- ✅ Production builds successfully

---

## Migration Guide

### Migrating to BaseScene
**Before:**
```typescript
export class GameplayScene extends Phaser.Scene {
  private audioManager: AudioManager | null = null;
  private saveManager: SaveManager;
  
  constructor() {
    super({ key: 'GameplayScene' });
    this.audioManager = new AudioManager(this);
    this.saveManager = new SaveManager();
  }
}
```

**After:**
```typescript
export class GameplayScene extends BaseScene {
  constructor() {
    super({ key: 'GameplayScene' }); // audioManager and saveManager auto-created
  }

  create(): void {
    super.create(); // Initializes audioManager, event listeners
    // Add gameplay-specific logic
  }
}
```

### Migrating to BaseEntity
**Before:**
```typescript
export class Zombie extends Phaser.GameObjects.Sprite {
  private health: number = 100;
  private isDead: boolean = false;
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'zombie');
    this.health = 100;
  }

  takeDamage(damage: number): void {
    this.health -= damage;
    if (this.health <= 0) {
      this.die();
    }
  }
}
```

**After:**
```typescript
export class Zombie extends BaseEntity {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, {
      health: 100,
      maxHealth: 100,
    }); // Health auto-set
  } // Constructor params handle initialization
  // takeDamage, die, etc. are inherited
}
```

### Migrating to BaseComponent
**Before:**
```typescript
export class DashboardCard extends Phaser.GameObjects.Container {
  private isHovered: boolean = false;
  private isPressed: boolean = false;
  
  constructor(scene: Phaser.Scene, x: number, y: number, config: any) {
    super(scene, x, y);
    this.setupInteractivity();
  }
  
  setupInteractivity(): void {
    this.setInteractive({ useHandCursor: true });
    this.on('pointerover', this.onHoverStart, this);
    this.on('pointerout', this.onHoverEnd, this);
    this.on('pointerdown', this.onPointerDown, this);
    this.on('pointerup', this.onPointerUp, this);
  }
}
```

**After:**
```typescript
export class DashboardCard extends BaseComponent {
  protected createContent(): void {
    // Add button/card content
  }

  protected onHoverStart(): void {
    super.onHoverStart(); // Handles hover state
    // Add custom hover behavior
  }
}
```

---

## Event System Reference

### Event Bus Location
`src/utils/EventBus.ts`

### Available Events
```typescript
// Gameplay Events
'monster-sliced'      // Monster hit by slash
'villager-sliced'    // Villager hit (penalty)
'powerup-collected'   // Power-up picked up
'boss-hit'           // Boss damaged
'boss-defeated'        // Boss killed
'level-complete'      // Level finished
'game-over'          // Game lost

// State Events
'score-updated'       // Score increased
'combo-updated'       // Combo increased
'lives-changed'      // Lives changed
'settings-changed'    // Settings modified

// Slash System Events
'slash-energy-changed' // Energy updated
'slash-power-changed'  // Power level changed
'slash-pattern-detected' // Pattern recognized
```

### Event Data Structures
```typescript
// Monster Sliced
interface MonsterSlicedEvent {
  monsterType: MonsterType;
  position: { x: number; y: number };
  points: number;
  souls: number;
  isCritical: boolean;
  comboCount: number;
}

// Score Updated
interface ScoreUpdatedEvent {
  score: number;
  stars?: number;
  isNewHighScore?: boolean;
}

// Boss Hit
interface BossHitEvent {
  bossId: string;
  damage: number;
  remainingHealth: number;
  maxHealth: number;
  phase: number;
}
```

---

## Common Patterns

### Asset Loading
**PreloaderScene** - All assets loaded before gameplay

### Save/Load System
**SaveManager** - LocalStorage + Cloud backup

### Configuration
**Constants (constants.ts)** - Game configuration
**Theme (theme.ts)** - Visual styling
**Types (types.ts)** - TypeScript interfaces

---

## Future Improvements

### Short-Term
1. ✅ Complete Phase 3 migrations (entities to BaseEntity, components to BaseComponent) - DONE
2. ✅ Integrate PerformanceMonitor into BaseScene - DONE
3. Add unit test framework
4. Clean up remaining unused variables

### Medium-Term
1. Migrate remaining scenes to BaseScene pattern
2. Migrate remaining entities to BaseEntity pattern
3. Migrate UI components to BaseComponent pattern
4. Optimize texture atlases

### Long-Term
1. Implement advanced caching strategies
2. Add hot-reload in development
3. Create performance analysis dashboard
4. Implement progressive loading

---

## Getting Started

### For Developers
1. Read this architecture document
2. Review existing base classes (BaseScene, BaseEntity, BaseComponent)
3. Follow migration guide when updating existing classes
4. Use established patterns for new components
5. Test performance changes before committing

### For New Features
1. Check base classes before creating new components
2. Extend appropriate base class (Scene → BaseScene, Entity → BaseEntity)
3. Implement IManager for managers
4. Use EventBus for system communication
5. Consider object pooling for frequently created objects

---

## Contact & Support

### Architecture Questions
1. **Pattern Selection:** Unsure which pattern to use? Check relevant examples above
2. **Migration Issues:** Having trouble with base class? See migration guide
3. **Event System:** Need custom event type? Check EventBus patterns
4. **Performance:** Objects creating/destroying often? Consider object pooling
5. **Type Errors:** TypeScript not cooperating? Check interface definitions

### Issue Reporting
- Create detailed bug reports with reproduction steps
- Include code snippets showing the issue
- Describe expected vs actual behavior
- Attach screenshots/videos if relevant

---

## Version History

### v1.1 - Architecture Refactoring Complete (2025)
**Phase 1 Complete: Main Menu Modernization**
- ✅ AtmosphericBackground component with 5 theme variants
- ✅ Modernized MainMenuScene with logo particle effects
- ✅ DashboardCard with glassmorphism styling
- ✅ Enhanced interactions (magnetic effect, spotlight, ripples)
- ✅ Navigation breadcrumbs and keyboard controls
- ✅ Accessibility features (high contrast, reduced motion, quality toggle)
- ✅ Notification popups for settings changes

**Phase 2 Complete: Performance Optimization**
- ✅ PerformanceMonitor utility with FPS tracking
- ✅ PerformanceMonitor integrated into BaseScene
- ✅ ObjectPool integrated into ParticleSystem
- ✅ Automatic quality adjustment based on performance

**Phase 3 Complete: Architecture Standardization**
- ✅ All 7 managers implement IManager interface
- ✅ GameplayScene migrated to BaseScene
- ✅ PerformanceMonitor in all BaseScene instances
- ✅ ObjectPool pattern applied to ParticleSystem
- ✅ Zero TypeScript compilation errors
- ✅ Production builds successfully

**Managers with IManager Interface:**
- SlashEnergyManager
- PowerUpManager
- WeaponManager
- UpgradeManager
- AudioManager
- SaveManager
- LevelManager

### v1.0 - Initial Architecture
- Documented core architectural patterns
- Base classes created (BaseScene, BaseEntity, BaseComponent)
- Manager interface standardized
- Object pooling system documented
- Event system documented
- Performance monitoring documented
- Migration guides provided

---

## Appendix

### Type Definitions Summary
**Key Interfaces:**
- `GameSave` - Player progress data
- `GameSettings` - User preferences
- `SlashEnergyState` - Energy tracking
- `SlashPowerState` - Power level
- `SlashPatternResult` - Pattern detection
- `MonsterSlicedEvent` - Event data
- `ScoreUpdatedEvent` - Event data

**Key Enums:**
- `MonsterType` - Zombie, Vampire, Ghost, etc.
- `PowerUpType` - Power-up types
- `WeaponId` - Weapon identifiers
- `GameState` - Game states
- `SlashPatternType` - Slash patterns
- `SlashPowerLevel` - Power levels (0-3)
- `WeaponRarity` - Rarity tiers

**Key Constants:**
- `SLASH_ENERGY` - Energy system config
- `SLASH_POWER` - Power system config
- `SLASH_PATTERN` - Pattern detection config
- `DASHBOARD_CARD_CONFIG` - UI card config

**Component Configs:**
- `ThemeColors` - Color palette
- `ThemeAnimations` - Animation presets
- `ParticleSystemConfig` - Particle configs
- `ObjectPoolConfig` - Pool settings

---

**End of Architecture Documentation**
