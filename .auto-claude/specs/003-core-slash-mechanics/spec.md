# Specification: Core Slash Mechanics Enhancement

## Overview

This task enhances the core slash mechanics system for Ninja Slicer, a Phaser-based action game where players slice monsters by swiping across the screen. The existing system handles basic slash trail rendering and collision detection. This enhancement will improve slash feedback, add advanced slash patterns, implement slash power mechanics, and optimize performance for smoother gameplay.

## Workflow Type

**Type**: feature

**Rationale**: This is a feature enhancement to the core gameplay mechanics, building upon the existing SlashSystem and SlashTrail implementations. It involves adding new functionality while maintaining backward compatibility with existing game systems.

## Task Scope

### Services Involved
- **main** (primary) - Single TypeScript/Phaser game project containing all slash mechanics

### This Task Will:
- [ ] Enhance slash visual feedback with improved trail effects and sound integration
- [ ] Implement slash power/charge mechanics for stronger attacks
- [ ] Add slash pattern recognition for special moves (circles, zigzags, etc.)
- [ ] Optimize collision detection performance for high entity counts
- [ ] Add slash energy/stamina system to balance gameplay
- [ ] Implement slash combo multipliers and streak tracking
- [ ] Add haptic feedback support for mobile devices
- [ ] Create slash effectiveness indicators (hit confirmation, miss feedback)

### Out of Scope:
- Complete overhaul of entity systems (monsters, villagers, power-ups)
- New UI screens or menu systems (uses existing HUD)
- Backend/database changes
- Multiplayer or networked gameplay features

## Service Context

### main

**Tech Stack:**
- Language: TypeScript
- Framework: Phaser 3 (game framework)
- Build Tool: Vite
- Key Libraries: @supabase/supabase-js, Phaser

**Key Directories:**
- `src/` - Source code
  - `src/systems/` - Game systems (SlashSystem, ComboSystem, SpawnSystem, ParticleSystem)
  - `src/entities/` - Game entities (SlashTrail, Monster, Villager, PowerUp)
  - `src/managers/` - Game managers (WeaponManager, PowerUpManager, UpgradeManager)
  - `src/scenes/` - Phaser scenes (GameplayScene, MainMenuScene, etc.)
  - `src/utils/` - Utilities (helpers, EventBus, DebugLogger)
  - `src/config/` - Configuration (constants, types, theme)

**Entry Point:** `src/main.ts`

**How to Run:**
```bash
npm run dev
```

**Port:** 5173

**Environment Variables:**
- `VITE_SUPABASE_URL` - Supabase project URL (optional for slash mechanics)
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key (optional)

## Files to Modify

| File | Service | What to Change |
|------|---------|---------------|
| `src/systems/SlashSystem.ts` | main | Add slash power mechanics, energy system, pattern recognition |
| `src/entities/SlashTrail.ts` | main | Enhance trail effects, add charge visualization, optimize rendering |
| `src/scenes/GameplayScene.ts` | main | Integrate new slash mechanics, handle energy updates, pattern detection |
| `src/ui/HUD.ts` | main | Add energy/stamina bar display, slash power indicator |
| `src/config/constants.ts` | main | Add new constants for energy, power levels, pattern thresholds |
| `src/config/types.ts` | main | Define new types for slash patterns, power states, energy system |
| `src/utils/helpers.ts` | main | Add pattern recognition algorithms, geometry utilities |

## Files to Reference

These files show patterns to follow:

| File | Pattern to Copy |
|------|----------------|
| `src/systems/ComboSystem.ts` | Multiplier and streak tracking system |
| `src/managers/PowerUpManager.ts` | Time-limited effect management and state tracking |
| `src/managers/UpgradeManager.ts` | Stat modification and player progression |
| `src/utils/EventBus.ts` | Event-driven communication between systems |
| `src/entities/SlashTrail.ts` | Graphics rendering and visual effects |
| `src/systems/ParticleSystem.ts` | Visual effect generation |
| `src/managers/AudioManager.ts` | Sound effect triggering patterns |

## Patterns to Follow

### Pattern 1: Event-Driven System Communication

From `src/utils/EventBus.ts` and existing implementations:

```typescript
// Emit events for slash actions
EventBus.emit('slash-power-charged', {
  powerLevel: 2,
  position: { x, y },
  timestamp: Date.now(),
});

// Listen for events in other systems
EventBus.on('slash-pattern-detected', (data) => {
  this.handleSpecialMove(data.pattern);
});
```

**Key Points:**
- Use EventBus for loose coupling between systems
- Include relevant data in event payloads
- Clean up event listeners in destroy() methods

### Pattern 2: Manager Singleton Pattern

From `src/managers/PowerUpManager.ts`:

```typescript
export class SlashEnergyManager {
  private static instance: SlashEnergyManager;

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): SlashEnergyManager {
    if (!SlashEnergyManager.instance) {
      SlashEnergyManager.instance = new SlashEnergyManager();
    }
    return SlashEnergyManager.instance;
  }
}
```

**Key Points:**
- Use singleton pattern for managers that need global state
- Private constructor prevents direct instantiation
- Lazy initialization in getInstance()

### Pattern 3: Phaser Graphics Rendering

From `src/entities/SlashTrail.ts`:

```typescript
private render(): void {
  this.graphics.clear();

  // Multi-layered effect for depth
  this.graphics.lineStyle(width * 2, glowColor, 0.2); // Outer glow
  this.graphics.strokePath();

  this.graphics.lineStyle(width, mainColor, 1.0); // Main trail
  this.graphics.strokePath();
}
```

**Key Points:**
- Clear graphics each frame before redrawing
- Use multiple layers for glow effects (outer → inner)
- Set depth values to control rendering order

### Pattern 4: Collision Detection

From `src/systems/SlashSystem.ts`:

```typescript
private checkCollision(
  lineStart: Phaser.Math.Vector2,
  lineEnd: Phaser.Math.Vector2,
  entity: Monster,
): boolean {
  return lineIntersectsCircle(
    { x: lineStart.x, y: lineStart.y },
    { x: lineEnd.x, y: lineEnd.y },
    { x: entity.x, y: entity.y },
    radius,
  );
}
```

**Key Points:**
- Use line-circle intersection for slash collision
- Check each segment of slash trail independently
- Validate entity state before checking collision

### Pattern 5: Time-Based System Updates

From `src/systems/SlashSystem.ts` and `src/managers/PowerUpManager.ts`:

```typescript
update(deltaTime: number): void {
  // Update timers
  this.energyRegenTimer += deltaTime;

  // Check if enough time has passed
  if (this.energyRegenTimer >= ENERGY_REGEN_INTERVAL) {
    this.regenerateEnergy();
    this.energyRegenTimer = 0;
  }
}
```

**Key Points:**
- Accept deltaTime parameter for frame-independent updates
- Use accumulator pattern for timed events
- Reset timers after triggering

## Requirements

### Functional Requirements

#### 1. Slash Energy System
**Description:** Implement an energy/stamina system that depletes with slashing and regenerates over time.

**Acceptance Criteria:**
- [ ] Energy bar displays current energy level (0-100%)
- [ ] Each slash consumes energy based on distance swiped
- [ ] Energy regenerates at configurable rate when not slashing
- [ ] Visual feedback shows low energy state (red/warning color)
- [ ] Energy affects slash damage/effectiveness
- [ ] Energy state persists across slashes until regenerated

#### 2. Slash Power/Charge Mechanics
**Description:** Allow players to charge slashes by holding before swiping for more powerful attacks.

**Acceptance Criteria:**
- [ ] Holding pointer/touch builds charge over time
- [ ] Visual indicator shows charge level (0-3 power levels)
- [ ] Charged slashes deal more damage/score multiplier
- [ ] Charged slashes have enhanced visual effects (wider, brighter trail)
- [ ] Release triggers slash with accumulated power
- [ ] Power level affects hitbox width and damage multiplier

#### 3. Slash Pattern Recognition
**Description:** Detect special slash patterns (circle, zigzag, straight line) for bonus effects.

**Acceptance Criteria:**
- [ ] Circle pattern detection (closed loop within tolerance)
- [ ] Zigzag pattern detection (alternating direction changes)
- [ ] Straight slash detection (minimal deviation from line)
- [ ] Pattern completion triggers special effects/bonuses
- [ ] Visual confirmation when pattern is recognized
- [ ] Each pattern has unique gameplay benefit

#### 4. Enhanced Visual Feedback
**Description:** Improve slash trail visuals and add hit confirmation effects.

**Acceptance Criteria:**
- [ ] Trail color changes based on slash power level
- [ ] Trail width scales with power and energy level
- [ ] Hit flash effects are more pronounced and varied
- [ ] Miss feedback shows when slash hits nothing
- [ ] Critical hits have distinct visual signature
- [ ] Trail fades smoothly when slash ends

#### 5. Performance Optimization
**Description:** Optimize collision detection and rendering for 60fps with 50+ entities.

**Acceptance Criteria:**
- [ ] Collision checks use spatial partitioning or quadtree
- [ ] Trail rendering batches draw calls efficiently
- [ ] Entity checks skip out-of-bounds objects early
- [ ] Graphics reuse/pooling for temporary effects
- [ ] Maintains 60fps with 50+ monsters on screen
- [ ] No frame drops during intensive slash sequences

### Edge Cases

1. **Rapid Successive Slashes** - Handle energy depletion preventing endless slashing; show "out of energy" feedback
2. **Incomplete Patterns** - Pattern recognition timeout if not completed within time limit; partial progress resets
3. **Multi-Touch Conflicts** - Prevent multiple simultaneous slash trails; prioritize first active pointer
4. **Zero Energy State** - Allow minimal slashing even at zero energy (reduced effectiveness); prevent total lockout
5. **Boundary Detection** - Slashes near screen edges don't trigger; prevent accidental UI interactions
6. **Performance Degradation** - Reduce effect quality gracefully if frame rate drops; prioritize gameplay over visuals

## Implementation Notes

### DO
- Follow the existing SlashSystem architecture for new features
- Use EventBus for communicating slash events to other systems
- Reuse existing helpers like `lineIntersectsCircle` from `utils/helpers.ts`
- Apply constants from `config/constants.ts` for all tunable values
- Use Graphics pooling pattern from existing particle systems
- Integrate with existing UpgradeManager for stat modifications
- Test on both desktop (mouse) and mobile (touch) input modes
- Add debug visualizations (toggleable via debug flag) for pattern recognition

### DON'T
- Create new collision detection algorithms when existing ones work
- Hardcode magic numbers - add all values to constants.ts
- Break existing combo and power-up systems integration
- Modify Monster/Villager entities unless necessary
- Add dependencies on external libraries without discussion
- Ignore performance metrics - monitor fps during testing

### Technical Considerations

**Pattern Recognition Algorithm:**
- Use Douglas-Peucker algorithm for simplifying slash paths
- Calculate angle changes between segments for zigzag detection
- Check start/end point proximity for circle detection
- Buffer pattern points separately from visual trail

**Energy System Design:**
- Energy cost = base cost + (slash distance * distance multiplier)
- Regeneration = linear rate per second (e.g., 10% per second)
- Integrate with UpgradeManager for energy-related upgrades

**Performance Strategy:**
- Spatial hashing for collision detection (divide screen into grid)
- Skip collision checks for entities outside visible bounds
- Limit trail point history to prevent memory bloat
- Use object pooling for temporary visual effects

## Development Environment

### Start Services

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run in separate terminal for testing
npm run build  # Production build test
```

### Service URLs
- Main Application: http://localhost:5173

### Required Environment Variables
(All optional for core slash mechanics development)
- `VITE_SUPABASE_URL` - Supabase URL (only needed for save/load features)
- `VITE_SUPABASE_ANON_KEY` - Supabase key (only needed for save/load features)

### Development Tools
- Browser DevTools - Performance profiling
- Phaser Debug Mode - Physics and hitbox visualization (enabled in dev)
- TypeScript Compiler - Type checking and IntelliSense

## Success Criteria

The task is complete when:

1. [ ] Energy system is implemented with visual bar in HUD
2. [ ] Slash power charging works with 3 distinct power levels
3. [ ] At least 3 slash patterns (circle, zigzag, straight) are detected reliably
4. [ ] Visual effects clearly communicate power level, energy state, and hit feedback
5. [ ] Performance maintains 60fps with 50+ entities during active slashing
6. [ ] Mobile touch input works identically to desktop mouse input
7. [ ] No console errors or warnings during gameplay
8. [ ] Existing tests still pass (if any)
9. [ ] New functionality verified via browser testing in both endless and campaign modes
10. [ ] Integration with existing systems (combo, power-ups, weapons) remains intact

## QA Acceptance Criteria

**CRITICAL**: These criteria must be verified by the QA Agent before sign-off.

### Unit Tests
| Test | File | What to Verify |
|------|------|----------------|
| Energy depletion calculation | `src/systems/SlashSystem.test.ts` | Energy reduces correctly based on slash distance |
| Energy regeneration | `src/systems/SlashSystem.test.ts` | Energy regenerates at correct rate per second |
| Power level calculation | `src/entities/SlashTrail.test.ts` | Charge time correctly maps to power levels 0-3 |
| Pattern detection - Circle | `src/utils/helpers.test.ts` | Closed loop patterns detected within tolerance |
| Pattern detection - Zigzag | `src/utils/helpers.test.ts` | Alternating direction changes detected correctly |
| Pattern detection - Straight | `src/utils/helpers.test.ts` | Minimal deviation from straight line detected |

### Integration Tests
| Test | Services | What to Verify |
|------|----------|----------------|
| Slash + Energy + HUD | main | Energy bar updates reflect slash energy consumption |
| Slash + Combo System | main | Energy slashes still trigger combo increments |
| Slash + Power-Up Manager | main | Frenzy mode doesn't break energy system |
| Slash + Weapon Manager | main | Weapon effects apply correctly with powered slashes |
| Pattern + Score System | main | Pattern bonuses add to score correctly |

### End-to-End Tests
| Flow | Steps | Expected Outcome |
|------|-------|------------------|
| Basic Slash | 1. Start game 2. Swipe across monster 3. Check energy | Monster sliced, energy depleted, visual trail shown |
| Charged Slash | 1. Hold pointer 2. Wait for charge 3. Swipe 4. Release | Power level 2-3 achieved, enhanced visual effect, bonus damage |
| Circle Pattern | 1. Draw circular slash 2. Complete loop | Pattern detected, special effect triggered, bonus awarded |
| Energy Depletion | 1. Slash repeatedly 2. Deplete all energy 3. Try slash at 0% | Energy bar red/empty, weak slash still works, warning shown |
| Energy Regeneration | 1. Deplete energy 2. Wait 5 seconds 3. Check bar | Energy regenerates to ~50%, can slash normally again |

### Browser Verification (Frontend)
| Page/Component | URL | Checks |
|----------------|-----|--------|
| GameplayScene | `http://localhost:5173` → Start Game | Energy bar visible in HUD, updates on slash |
| Slash Trail | In-game slashing | Trail color/width changes with power level |
| Pattern Effects | In-game special moves | Visual confirmation on pattern detection |
| HUD Energy Display | In-game HUD | Energy bar renders correctly, updates smoothly |
| Mobile Compatibility | Mobile browser or DevTools mobile mode | Touch slashing works, no input lag |

### Performance Verification
| Check | Tool/Command | Expected |
|-------|--------------|----------|
| FPS with 50+ entities | Browser DevTools Performance tab | Consistent 60fps during active slashing |
| Memory usage | DevTools Memory profiler | No memory leaks after 5 minutes of gameplay |
| Trail rendering cost | DevTools Performance → Rendering | Render time < 2ms per frame |
| Collision detection cost | Console timing logs | < 1ms per frame with 50 entities |

### Database Verification
Not applicable - slash mechanics are client-side only. Save data integration is handled by existing SaveManager.

### QA Sign-off Requirements
- [ ] All unit tests pass (when created)
- [ ] All integration tests pass
- [ ] All E2E test flows complete successfully
- [ ] Browser verification complete (desktop + mobile)
- [ ] Performance targets met (60fps with 50+ entities)
- [ ] No regressions in existing functionality (existing slash, combo, scoring works)
- [ ] Code follows established patterns (EventBus, managers, graphics rendering)
- [ ] No console errors or warnings during 10-minute test session
- [ ] No security vulnerabilities introduced (client-side only, no network code)
- [ ] Mobile touch input tested and working correctly
- [ ] Energy system balance feels fair and engaging (playtest feedback)

---

## Additional Context

### Existing Architecture Summary

**SlashSystem (`src/systems/SlashSystem.ts`):**
- Handles collision detection between slash trail and entities
- Manages score, souls, and kill statistics
- Integrates with ComboSystem, PowerUpManager, WeaponManager, UpgradeManager
- Uses line-circle intersection algorithm for hit detection
- Emits events via EventBus for system communication

**SlashTrail (`src/entities/SlashTrail.ts`):**
- Tracks pointer movement and renders visual trail
- Velocity-based activation (only appears when moving fast enough)
- Multi-layered glow rendering for visual impact
- Cursor indicator for precise aiming
- Configurable trail style (color, glow, width)

**GameplayScene (`src/scenes/GameplayScene.ts`):**
- Main game loop that updates all systems
- Handles pointer input (mouse/touch)
- Manages scene lifecycle (create, update, destroy)
- Coordinates between all game systems

### Upgrade Path

This feature integrates with the existing UpgradeManager to allow players to unlock:
- Increased maximum energy capacity
- Faster energy regeneration rate
- Reduced energy cost per slash
- Higher maximum charge level
- Pattern detection sensitivity improvements
- Enhanced pattern bonuses

These upgrade paths should be considered in the design but implemented separately.

### Testing Strategy

**Manual Testing Checklist:**
1. Desktop mouse input - all features work smoothly
2. Mobile touch input - no lag, accurate detection
3. Energy depletes and regenerates as expected
4. Charge mechanic builds power over time
5. All 3 patterns are detectable with reasonable accuracy
6. Performance is smooth with many entities on screen
7. Visual feedback is clear and informative
8. No conflicts with existing systems (combo, power-ups, weapons)

**Automated Testing Focus:**
- Pattern recognition algorithms (unit tests)
- Energy calculation logic (unit tests)
- Integration with existing managers (integration tests)
- Performance regression tests (benchmark tests)

---

**Document Version:** 1.0
**Created:** 2025-12-30
**Task ID:** 003-core-slash-mechanics
**Workflow Type:** feature
**Estimated Complexity:** Medium-High
