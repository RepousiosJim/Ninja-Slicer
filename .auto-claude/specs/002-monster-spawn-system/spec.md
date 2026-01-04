# Specification: Monster Spawn System

## Overview

Implement a physics-based monster spawning system for the Ninja Slicer game that launches three types of monsters (Zombie, Vampire, Ghost) from screen edges with realistic arc trajectories. The system will progressively increase difficulty by scaling spawn rates within each level, creating dynamic gameplay similar to Fruit Ninja's fruit-launching mechanics. Monsters will follow parabolic arcs with gravity, rising from edge spawn points to a peak before falling back down, providing players with anticipatable slash opportunities.

## Workflow Type

**Type**: feature

**Rationale**: This is a new feature implementation for the game. The context phase found no existing spawn system, indicating this is greenfield development within the existing Phaser game architecture. The task requires creating new components for spawn management, trajectory calculation, and difficulty progression from scratch.

## Task Scope

### Services Involved
- **main** (primary) - TypeScript/Phaser game service that will host all spawn system logic

### This Task Will:
- [x] Create a MonsterSpawner class to manage spawn timing and monster instantiation
- [x] Implement arc trajectory system with gravity physics using Phaser's physics engine
- [x] Add spawn rate progression algorithm that increases difficulty within levels
- [x] Support three monster types (Zombie, Vampire, Ghost) with weighted spawn frequencies
- [x] Define spawn edge positions (bottom and sides of screen) with randomized selection
- [x] Implement trajectory calculation for varied launch angles and velocities
- [x] Integrate spawn system with existing game loop and scene management

### Out of Scope:
- Monster rendering/sprite assets (assume these exist)
- Monster slashing/interaction mechanics (different feature)
- Level transitions and overall difficulty scaling between levels
- Monster AI behavior after spawning (this focuses on spawn mechanics only)
- Sound effects or visual effects for spawning

## Service Context

### main

**Tech Stack:**
- Language: TypeScript
- Framework: Phaser (game engine)
- Build Tool: Vite
- Package Manager: npm

**Entry Point:** `src/main.ts`

**How to Run:**
```bash
npm run dev
```

**Port:** 5173 (Vite dev server)

**Key Dependencies:**
- `phaser` - Game engine with built-in physics
- `@supabase/supabase-js` - Backend integration (may be used for level config)

**Key Directories:**
- `src/` - Source code directory
  - Expected subdirectories (to be created if needed):
    - `src/entities/` - Monster classes
    - `src/systems/` - Spawn system logic
    - `src/scenes/` - Phaser game scenes
    - `src/config/` - Spawn configuration constants

## Files to Modify

| File | Service | What to Change |
|------|---------|---------------|
| `src/systems/MonsterSpawner.ts` | main | **Create new file** - Implement spawn manager with timing logic, monster type selection, and spawn rate progression |
| `src/config/SpawnConfig.ts` | main | **Create new file** - Define spawn parameters (rates, monster type weights, trajectory constraints) |
| `src/entities/Monster.ts` | main | **Modify or create** - Add physics properties for trajectory (velocity, gravity scale, launch angle) |
| `src/scenes/GameScene.ts` | main | **Modify existing** - Integrate MonsterSpawner into game loop, call update() each frame |

## Files to Reference

**Note:** The context phase did not identify existing reference files. This indicates a greenfield implementation. Developers should:

| Pattern Source | Pattern to Copy |
|----------------|----------------|
| Phaser Documentation | [Arcade Physics](https://photonstorm.github.io/phaser3-docs/Phaser.Physics.Arcade.html) - Use for gravity and velocity |
| Phaser Examples | [Launch Projectile](https://phaser.io/examples/v3/view/physics/arcade/launch-projectile) - Reference for trajectory calculation |
| Existing `src/scenes/` files | Scene lifecycle patterns (create, update, shutdown) |
| Existing entity classes | Class structure and Phaser GameObject integration |

## Patterns to Follow

### Phaser Scene Integration Pattern

```typescript
// In GameScene.ts
export class GameScene extends Phaser.Scene {
  private spawner: MonsterSpawner;

  create() {
    this.spawner = new MonsterSpawner(this, spawnConfig);
  }

  update(time: number, delta: number) {
    this.spawner.update(time, delta);
  }
}
```

**Key Points:**
- Spawner managed by scene lifecycle
- Update called every frame with time/delta
- Configuration injected at creation

### Phaser Arcade Physics Trajectory Pattern

```typescript
// Launch with arc trajectory
const monster = this.physics.add.sprite(x, y, 'monster');
monster.setGravityY(800); // Gravity pulls down
monster.setVelocity(velocityX, velocityY); // Initial launch velocity

// velocityY should be negative (upward) for arc
// velocityX determines horizontal movement
// Gravity naturally creates parabolic arc
```

**Key Points:**
- Negative velocityY launches upward
- Positive gravityY pulls object down
- Natural parabolic arc from physics engine
- No manual trajectory calculation needed

### Weighted Random Selection Pattern

```typescript
// Select monster type with weighted probabilities
const monsterTypes = [
  { type: 'zombie', weight: 50 },   // 50% chance
  { type: 'vampire', weight: 30 },  // 30% chance
  { type: 'ghost', weight: 20 }     // 20% chance
];

function selectMonsterType(types: typeof monsterTypes): string {
  const totalWeight = types.reduce((sum, t) => sum + t.weight, 0);
  let random = Math.random() * totalWeight;

  for (const type of types) {
    if (random < type.weight) return type.type;
    random -= type.weight;
  }
  return types[0].type; // Fallback
}
```

**Key Points:**
- Weights define relative probabilities
- Total weight calculated dynamically
- Supports easy balancing adjustments

## Requirements

### Functional Requirements

1. **Edge-Based Spawn Positions**
   - Description: Monsters spawn from randomized positions along screen edges (bottom, left side, right side)
   - Acceptance:
     - Spawn X position is randomized within screen bounds
     - Spawn Y position is at screen edge (bottom) or screen sides
     - No spawns occur within center 50% of screen

2. **Arc Trajectory Physics**
   - Description: Monsters follow parabolic arcs with gravity, rising to peak then falling
   - Acceptance:
     - Monsters have negative initial Y velocity (launch upward)
     - Gravity constant applied (800-1000 px/s²)
     - Peak height reached within 1-2 seconds
     - Visual arc is smooth and natural

3. **Monster Type Variation**
   - Description: Three monster types spawn with different frequencies
   - Acceptance:
     - Zombie: ~50% spawn rate
     - Vampire: ~30% spawn rate
     - Ghost: ~20% spawn rate
     - Type selection uses weighted randomization

4. **Progressive Spawn Rate**
   - Description: Spawn rate increases gradually during level duration
   - Acceptance:
     - Initial spawn interval: 2-3 seconds
     - Final spawn interval: 0.8-1.2 seconds
     - Smooth interpolation over level duration (e.g., 60-90 seconds)
     - No sudden jumps in difficulty

5. **Configurable Parameters**
   - Description: Spawn behavior controlled by configuration file
   - Acceptance:
     - All spawn rates, velocities, gravity in config
     - Monster type weights externalized
     - Easy tuning without code changes

### Edge Cases

1. **Off-Screen Cleanup** - Monsters that fall below screen should be destroyed to prevent memory leaks
2. **Spawn Collisions** - Prevent spawning multiple monsters at exact same position (randomize X within edge bounds)
3. **Pause/Resume** - Spawn timer should pause when game pauses, resume when unpaused
4. **Scene Transitions** - Clear all spawned monsters when leaving game scene
5. **Zero Delta Time** - Handle first frame where delta may be 0 to prevent divide-by-zero errors

## Implementation Notes

### DO
- Use Phaser's Arcade Physics for trajectory (built-in gravity system)
- Create object pools for monsters to avoid frequent instantiation
- Store spawn config in separate `SpawnConfig.ts` for easy tuning
- Use `Phaser.Time.addEvent()` for spawn timing with dynamic intervals
- Clamp spawn positions to screen bounds using `Phaser.Cameras.main.width/height`
- Emit events when monsters spawn for potential sound/particle effects integration
- Use `Math.random()` with weighted algorithm for monster type selection
- Clean up monsters when they exit screen bounds (use `checkWorldBounds`)

### DON'T
- Hardcode spawn rates or velocities in the spawner class
- Spawn monsters in the center of the screen (breaks edge-spawning requirement)
- Use fixed time intervals (prevents difficulty progression)
- Create new monster instances every spawn (use pooling)
- Forget to remove physics bodies when destroying monsters
- Use linear velocity without gravity (breaks arc requirement)

## Development Environment

### Start Services

```bash
# Install dependencies (if not already installed)
npm install

# Start development server
npm run dev
```

### Service URLs
- Game Client: http://localhost:5173

### Required Environment Variables
- `VITE_SUPABASE_URL`: Supabase project URL (optional for spawn system, may be needed for level config)
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key (optional)

**Note:** Spawn system can function entirely client-side. Environment variables only needed if level configuration is fetched from Supabase.

## Success Criteria

The task is complete when:

1. [x] Monsters spawn from screen edges (bottom and sides) with randomized positions
2. [x] All three monster types (Zombie, Vampire, Ghost) spawn with correct frequency distribution
3. [x] Monsters follow visible arc trajectories with gravity (rise then fall)
4. [x] Spawn rate progressively increases from start to end of level (2s → 1s interval)
5. [x] No console errors or warnings during gameplay
6. [x] Monsters are properly cleaned up when falling off-screen or on scene exit
7. [x] Spawn behavior is configurable via `SpawnConfig.ts` without code changes
8. [x] Visual verification: Arcs look natural and gameplay feels similar to Fruit Ninja
9. [x] Performance: Smooth 60 FPS with 10+ monsters on screen simultaneously

## QA Acceptance Criteria

**CRITICAL**: These criteria must be verified by the QA Agent before sign-off.

### Unit Tests
| Test | File | What to Verify |
|------|------|----------------|
| MonsterSpawner initialization | `src/systems/MonsterSpawner.test.ts` | Spawner initializes with config, starts with correct spawn interval |
| Weighted type selection | `src/systems/MonsterSpawner.test.ts` | 1000 iterations produce ~50% Zombie, ~30% Vampire, ~20% Ghost (±5% margin) |
| Spawn rate progression | `src/systems/MonsterSpawner.test.ts` | Spawn interval decreases linearly over simulated time |
| Edge position calculation | `src/systems/MonsterSpawner.test.ts` | Spawn X/Y positions are within screen bounds and on edges |

### Integration Tests
| Test | Services | What to Verify |
|------|----------|----------------|
| Spawner + GameScene lifecycle | main | Spawner created in scene.create(), updated in scene.update(), cleaned in scene.shutdown() |
| Monster physics integration | main | Spawned monsters have active physics bodies with correct gravity/velocity |
| Config loading | main | SpawnConfig values correctly applied to spawner behavior |

### End-to-End Tests
| Flow | Steps | Expected Outcome |
|------|-------|------------------|
| Normal gameplay spawn | 1. Start game 2. Observe for 30 seconds 3. Count spawns | 15-20 monsters spawn with increasing frequency |
| Monster arc trajectory | 1. Spawn monster 2. Track position over time | Monster rises to peak (screen 30-50% height) then falls off-screen |
| Type distribution | 1. Play for 60 seconds 2. Log all spawned types | Type distribution matches weighted config (~50/30/20) |
| Pause behavior | 1. Play 10 seconds 2. Pause 5 seconds 3. Resume | Spawn timer pauses and resumes, no spawn burst on resume |

### Browser Verification (Frontend)
| Page/Component | URL | Checks |
|----------------|-----|--------|
| Game Scene | `http://localhost:5173` | - Monsters spawn from edges only<br>- Visible arc trajectories<br>- Increasing spawn frequency over time<br>- No visual glitches or stutter<br>- All 3 monster types appear |

### Performance Verification
| Check | Measurement | Expected |
|-------|-------------|----------|
| Frame rate during spawns | Browser DevTools Performance tab | Consistent 60 FPS with 15+ monsters |
| Memory leaks | Chrome Task Manager over 5 minutes | Memory usage stable (no continuous growth) |
| Monster cleanup | Phaser debug mode object count | Off-screen monsters destroyed, count decreases |

### Configuration Verification
| Check | Action | Expected |
|-------|--------|----------|
| Spawn rate tuning | Edit `SpawnConfig.ts` initial interval to 5s, reload | Monsters spawn every 5 seconds initially |
| Monster type weights | Set Ghost weight to 100, others to 0, reload | Only Ghost monsters spawn |
| Gravity adjustment | Set gravity to 1500, reload | Faster arc (quicker rise/fall) |

### QA Sign-off Requirements
- [x] All unit tests pass (spawner logic, weighted selection, progression)
- [x] Integration tests confirm spawner integrates with GameScene lifecycle
- [x] E2E tests verify spawn behavior, trajectories, and type distribution in actual gameplay
- [x] Browser verification confirms visual quality and natural arc motion
- [x] Performance metrics meet 60 FPS target with multiple simultaneous spawns
- [x] Configuration changes take effect without code modifications
- [x] No regressions in existing game functionality (other scenes still work)
- [x] Code follows TypeScript/Phaser patterns established in project
- [x] No memory leaks detected during extended play sessions
- [x] Spawn patterns feel balanced and not overwhelming (playability test)

---

## Implementation Approach

### Phase 1: Core Spawner Infrastructure
1. Create `src/config/SpawnConfig.ts` with all tunable parameters
2. Create `src/systems/MonsterSpawner.ts` class skeleton
3. Implement spawn timing using `Phaser.Time.addEvent()` with dynamic intervals
4. Integrate spawner into `GameScene` lifecycle

### Phase 2: Trajectory Physics
1. Define spawn edge positions (bottom, left side, right side)
2. Calculate random spawn positions along edges
3. Implement launch velocity calculation for arc trajectories
4. Apply gravity to monsters using Phaser Arcade Physics
5. Test visual arc quality

### Phase 3: Monster Type System
1. Implement weighted random type selection algorithm
2. Map monster types to sprite keys/configurations
3. Verify type distribution over time

### Phase 4: Difficulty Progression
1. Implement spawn interval reduction algorithm (linear interpolation)
2. Tie progression to level duration or elapsed time
3. Test progression curve feels natural

### Phase 5: Cleanup & Optimization
1. Implement off-screen monster destruction
2. Add object pooling for performance
3. Handle edge cases (pause, scene transitions, bounds checking)
4. Performance profiling and optimization

### Phase 6: Testing & QA
1. Write unit tests for spawner logic
2. Write integration tests for scene integration
3. Manual browser testing for visual quality
4. Performance testing with stress scenarios
5. Configuration tuning for game feel

---

## Technical Architecture

### Class Structure

```
MonsterSpawner
├── constructor(scene: Phaser.Scene, config: SpawnConfig)
├── update(time: number, delta: number): void
├── spawnMonster(): void
├── selectMonsterType(): MonsterType
├── calculateSpawnPosition(): { x: number, y: number }
├── calculateLaunchVelocity(): { x: number, y: number }
├── getCurrentSpawnInterval(): number
└── cleanup(): void
```

### Data Flow

1. **GameScene.create()** → Instantiate MonsterSpawner with SpawnConfig
2. **GameScene.update()** → Call spawner.update(time, delta)
3. **MonsterSpawner.update()** → Check timer, spawn if interval elapsed
4. **MonsterSpawner.spawnMonster()** →
   - Select type (weighted random)
   - Calculate position (edge-based)
   - Calculate velocity (arc trajectory)
   - Create/pool monster GameObject
   - Apply physics properties
5. **Monster GameObject** → Physics engine handles motion with gravity
6. **Bounds checking** → Destroy monster when off-screen

---

## Configuration Schema

```typescript
// src/config/SpawnConfig.ts
export interface SpawnConfig {
  // Spawn timing
  initialSpawnInterval: number;  // ms between spawns at start
  finalSpawnInterval: number;    // ms between spawns at end
  progressionDuration: number;   // ms over which to interpolate intervals

  // Monster types
  monsterTypes: Array<{
    type: 'zombie' | 'vampire' | 'ghost';
    weight: number;
    spriteKey: string;
    velocityRange: { min: number; max: number };  // px/s
  }>;

  // Physics
  gravity: number;  // px/s²
  launchAngleRange: { min: number; max: number };  // degrees

  // Spawn positions
  edges: Array<'bottom' | 'left' | 'right'>;
  edgeMargin: number;  // px from screen edge

  // Cleanup
  offScreenBuffer: number;  // px beyond screen before destroy
}
```
