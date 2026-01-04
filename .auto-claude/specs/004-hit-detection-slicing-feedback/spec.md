# Specification: Hit Detection & Slicing Feedback

## Overview

Enhance the existing slash-to-monster collision detection system with polished visual and audio feedback to achieve Fruit Ninja-level game feel. While the core collision detection already exists via `lineIntersectsCircle()`, the current implementation lacks the visceral satisfaction of successful hits. This task will amplify particle effects, increase screen shake intensity, and integrate per-monster-type audio feedback to create a rewarding slicing experience.

## Workflow Type

**Type**: feature

**Rationale**: This is an enhancement to existing gameplay systems to add polish and game feel. While the foundational collision detection exists, this task adds new visual/audio layers and tunes existing parameters to transform basic functionality into satisfying gameplay. It fits the "feature" workflow because it adds measurable player-facing value (particle intensity, audio feedback, enhanced shake) rather than refactoring or investigating existing code.

## Task Scope

### Services Involved
- **main** (primary) - Single-service Phaser 3.80.1 TypeScript game

### This Task Will:
- [x] Enhance particle effect intensity at slash impact points (increase count/velocity in `ParticleSystem`)
- [x] Increase screen shake intensity from 0.003 to 0.005-0.01 for visceral feedback
- [x] Integrate per-monster-type audio playback on successful slashes
- [x] Verify existing `lineIntersectsCircle()` collision accuracy
- [x] Tune monster hitbox radius if needed for better feel

### Out of Scope:
- Implementing collision detection from scratch (already exists)
- Creating new particle system architecture (pooling already implemented)
- Mobile-specific touch handling (AudioManager already handles unlock)
- Monster split animations (acceptance criteria allows "split OR explode" - particles sufficient)
- New asset creation (will use existing audio/particle assets)

## Service Context

### Main Game Service

**Tech Stack:**
- Language: TypeScript
- Framework: Phaser 3.80.1
- Build Tool: Vite
- Package Manager: npm
- Key directories: `src/` (source code)

**Entry Point:** `src/main.ts`

**How to Run:**
```bash
npm run dev
```

**Port:** 5173

**Access URL:** http://localhost:5173

## Files to Modify

| File | Service | What to Change |
|------|---------|---------------|
| `src/systems/ParticleSystem.ts` | main | Enhance `createHitEffect()` - increase particle count, velocity, and spread for dramatic Fruit Ninja-style blood splatter |
| `src/entities/Monster.ts` | main | Increase screen shake intensity in `onSliced()` method (line ~319) from `0.003` to `0.005-0.01` |
| `src/systems/SlashSystem.ts` | main | Add `AudioManager.playSFX()` calls in `handleMonsterHit()` with monster-type-specific sound keys |
| `src/config/constants.ts` | main | (Optional) Tune `MONSTER_HITBOX_RADIUS` if collision feel needs adjustment after testing |

## Files to Reference

These files show patterns to follow:

| File | Pattern to Copy |
|------|----------------|
| `src/utils/helpers.ts` | `lineIntersectsCircle()` algorithm - quadratic formula-based line-to-circle collision (already in use) |
| `src/managers/AudioManager.ts` | `playSFX(key, config)` and `playSFXWithVariation()` methods for triggering sounds |
| `src/systems/SlashSystem.ts` | Event emission pattern: `this.events.emit('monster-sliced', data)` |
| `src/systems/ParticleSystem.ts` | Object pooling pattern for particles (`BLOOD_SPLATTER` type) |

## Patterns to Follow

### 1. Line-Circle Collision Detection

From `src/utils/helpers.ts`:

```typescript
export function lineIntersectsCircle(
  lineStart: Vector2,
  lineEnd: Vector2,
  circleCenter: Vector2,
  radius: number
): boolean {
  // Quadratic formula-based detection
  // Returns true if line segment intersects circle
}
```

**Key Points:**
- Already integrated in `SlashSystem.update()` for hit detection
- Uses t-value clamping [0-1] to ensure line segment (not infinite line) is tested
- Circular hitboxes only - no rectangular collision
- **Action**: Verify accuracy, potentially tune `radius` parameter via constants

### 2. Particle Effect Creation

From `src/systems/ParticleSystem.ts`:

```typescript
createHitEffect(x: number, y: number, weaponType: string): void {
  // Current implementation uses BLOOD_SPLATTER type
  // Object-pooled particles
}

emit(config: ParticleEmitConfig): void {
  // Spawns particles with velocity, lifespan, etc.
}
```

**Key Points:**
- Increase particle count (e.g., 15-30 particles per hit vs. current amount)
- Boost initial velocity for dramatic spray effect
- Enhance spread angle for wider splatter pattern
- Maintain object pooling for performance

### 3. Screen Shake Integration

From `src/entities/Monster.ts` (line ~319):

```typescript
this.scene.cameras.main.shake(100, 0.003);
```

**Key Points:**
- First param: duration in ms (100ms is good)
- Second param: intensity (currently 0.003 - too subtle)
- **Target intensity**: 0.005-0.01 for noticeable impact
- **Max safe intensity**: 0.02 (beyond = nauseating)
- Phaser's built-in camera shake - no new system needed

### 4. Audio Playback with Type Variation

From `src/managers/AudioManager.ts`:

```typescript
playSFX(key: string, config?: PlayConfig): void {
  // Plays sound effect with optional volume/rate config
}

playSFXWithVariation(key: string): void {
  // Adds pitch/rate variation for organic feel
}
```

**Key Points:**
- Sound keys should follow pattern: `slash_[monsterType]` (e.g., `slash_goblin`, `slash_demon`)
- Use `monster.getMonsterType()` to get type enum
- Call in `SlashSystem.handleMonsterHit()` after collision confirmation
- Mobile audio unlock already handled by AudioManager

## Requirements

### Functional Requirements

1. **Accurate Slash Detection**
   - Description: Slash lines must precisely detect intersection with circular monster hitboxes using existing `lineIntersectsCircle()` algorithm
   - Acceptance: Player can consistently hit monsters by dragging finger/mouse across them; no false negatives (missed hits when visually slashing through monster)

2. **Dramatic Particle Effects**
   - Description: Blood/soul particles spawn at exact impact point with high count and velocity for Fruit Ninja-style splatter
   - Acceptance: 15-30 particles spawn per hit with visible spray pattern; particles have appropriate lifespan and fade

3. **Noticeable Screen Shake**
   - Description: Camera shake occurs on every successful kill with intensity between 0.005-0.01
   - Acceptance: Screen shake is clearly visible but not nauseating; occurs immediately on hit; duration ~100ms

4. **Per-Monster Audio Feedback**
   - Description: Unique sound effect plays for each monster type on successful slash
   - Acceptance: Audio plays within 16ms of hit; different monster types produce different sounds; works on mobile after user interaction

5. **Impact Point Accuracy**
   - Description: Particle spawn position matches exact collision point between slash line and monster hitbox
   - Acceptance: Particles emanate from visually correct location (not monster center or random offset)

### Edge Cases

1. **Rapid Multi-Kill Slashes** - Handle overlapping audio (use audio pooling if available, or let sounds overlap naturally without cutting each other off)
2. **Off-Screen Monster Hits** - Particles and shake should still trigger even if monster is partially/fully off-screen
3. **Monster Death Mid-Slash** - If monster dies from previous slash, ignore subsequent collision checks for that frame
4. **Zero-Length Slash Lines** - Ignore slash detection if line start/end are identical (no valid line segment)
5. **Mobile Audio Context** - AudioManager already handles iOS/Android audio unlock requirements

## Implementation Notes

### DO
- Follow the object pooling pattern in `ParticleSystem` for performance
- Reuse existing `lineIntersectsCircle()` utility - don't recreate collision logic
- Use `monster.getMonsterType()` to differentiate audio per type
- Emit particles at the exact intersection point (not monster center)
- Test shake intensity incrementally (start at 0.005, increase if too subtle)
- Leverage existing `monster-sliced` event system for triggering effects
- Use `AudioManager.playSFXWithVariation()` for organic sound feel

### DON'T
- Create new collision detection algorithms when `lineIntersectsCircle()` works
- Exceed 0.02 screen shake intensity (motion sickness risk)
- Spawn particles at monster center - calculate actual impact point
- Block audio on mobile without user interaction (AudioManager handles unlock)
- Create new particle pooling system - enhance existing one
- Use rectangular hitboxes - all monsters use circular physics bodies

## Development Environment

### Start Services

```bash
# Install dependencies (if first time)
npm install

# Start development server with hot reload
npm run dev
```

### Service URLs
- Main Game: http://localhost:5173

### Required Environment Variables
None required for core game functionality. Optional Supabase/Notion integrations exist but are not needed for this feature.

**Key Dependencies:**
- `phaser` (already installed) - Phaser 3.80.1 game framework
- No additional packages needed

## Success Criteria

The task is complete when:

1. [x] Slash lines accurately detect intersection with monster hitboxes (verify existing `lineIntersectsCircle()` works correctly)
2. [x] Particles spawn at impact point with 15-30 particles per hit and visible spray velocity
3. [x] Screen shake intensity increased to 0.005-0.01 and triggers on every kill
4. [x] Audio plays on successful slash with unique sounds per monster type
5. [x] No console errors during gameplay
6. [x] Existing functionality unaffected (slashing still works, monsters still die)
7. [x] Performance remains smooth at 60fps with enhanced particles
8. [x] Game feel matches Fruit Ninja's satisfying impact (subjective but critical)

## QA Acceptance Criteria

**CRITICAL**: These criteria must be verified by the QA Agent before sign-off.

### Unit Tests

| Test | File | What to Verify |
|------|------|----------------|
| Collision accuracy | `src/utils/helpers.ts` | `lineIntersectsCircle()` returns correct boolean for edge cases (tangent lines, line segments vs infinite lines, zero-radius circles) |
| Particle emission | `src/systems/ParticleSystem.ts` | `createHitEffect()` spawns correct particle count with proper config; object pool doesn't leak |
| Audio playback | `src/managers/AudioManager.ts` | `playSFX()` triggers correct sound keys; handles missing audio files gracefully |

### Integration Tests

| Test | Services | What to Verify |
|------|----------|----------------|
| Slash-to-Monster Pipeline | SlashSystem ↔ Monster ↔ ParticleSystem | When slash intersects monster: (1) collision detected, (2) monster triggers death, (3) particles spawn, (4) audio plays |
| Multi-Monster Slash | SlashSystem ↔ Multiple Monsters | Single slash can hit multiple monsters; each triggers individual particle/audio/shake effects |
| Event Propagation | SlashSystem → Scene Listeners | `monster-sliced` event emits correct data (position, monster type, impact point) |

### End-to-End Tests

| Flow | Steps | Expected Outcome |
|------|-------|------------------|
| Single Monster Kill | 1. Start game 2. Spawn monster 3. Perform slash through monster body | Monster dies, 15-30 particles spray from impact point, screen shakes for ~100ms, audio plays matching monster type |
| Rapid Multi-Kill | 1. Spawn 3 monsters close together 2. Single slash through all 3 | All 3 monsters die, 3 separate particle effects spawn, 3 audio sounds play (may overlap), screen shake intensity may stack (acceptable) |
| Near-Miss Slash | 1. Spawn monster 2. Slash near but not touching hitbox | No particle/audio/shake effects trigger; monster continues moving |
| Off-Screen Kill | 1. Let monster move partially off-screen 2. Slash through visible portion | Effects still trigger even if impact point is off-screen |

### Browser Verification (Frontend)

| Page/Component | URL | Checks |
|----------------|-----|--------|
| Main Game Scene | `http://localhost:5173/` | (1) Slash trail renders, (2) Monsters spawn, (3) Successful slash produces visible particle spray, (4) Screen shake is noticeable but not excessive, (5) Audio plays on hit |
| Performance Check | `http://localhost:5173/` (dev tools open) | (1) FPS remains 60 during multi-kill, (2) No memory leaks from particle pool, (3) Audio doesn't stutter |

### Manual Verification Checklist

| Check | Command/Action | Expected |
|-------|----------------|----------|
| Particle count | Slash monster; observe particles | 15-30 particles spawn with visible outward velocity |
| Screen shake intensity | Slash monster; observe camera | Shake is clearly visible but comfortable (not nauseating) |
| Audio per type | Slash different monster types | Each type produces unique sound (goblin ≠ demon ≠ etc.) |
| Impact point accuracy | Slash monster at edge of hitbox | Particles spawn from edge impact point, not monster center |
| Mobile audio | Test on iOS/Android after first tap | Audio plays after user interaction unlock |

### Performance Verification

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Frame Rate | 60 FPS | Chrome DevTools Performance Monitor during multi-kill combos |
| Particle Pool | No leaks | Monitor `ParticleSystem` pool size over 5 minutes of gameplay |
| Audio Latency | < 16ms | Measure time between hit detection and audio playback |

### QA Sign-off Requirements
- [ ] All collision detection edge cases pass (tangent lines, zero-length slashes, off-screen hits)
- [ ] Particle effects are visually dramatic (15-30 particles minimum) and spawn at correct impact point
- [ ] Screen shake intensity is between 0.005-0.01 and not nauseating
- [ ] Per-monster-type audio plays correctly and handles rapid multi-kills
- [ ] Performance remains at 60 FPS with enhanced effects
- [ ] No regressions in existing slash/monster systems
- [ ] Mobile audio works after user interaction
- [ ] Code follows existing Phaser/TypeScript patterns
- [ ] No console errors or warnings during gameplay
- [ ] Game feel subjectively matches Fruit Ninja satisfaction level (QA tester discretion)

---

## Implementation Priority Order

1. **Phase 1: Visual Feedback Enhancement** (Core game feel)
   - Enhance `ParticleSystem.createHitEffect()` - boost particle count to 15-30, increase velocity
   - Increase screen shake intensity in `Monster.onSliced()` from 0.003 → 0.005-0.01
   - Verify particles spawn at correct impact point (not monster center)

2. **Phase 2: Audio Integration** (Polish layer)
   - Add `AudioManager.playSFX()` calls in `SlashSystem.handleMonsterHit()`
   - Use `monster.getMonsterType()` to select sound keys
   - Test with `playSFXWithVariation()` for organic feel

3. **Phase 3: Fine-Tuning** (Optional polish)
   - Adjust `MONSTER_HITBOX_RADIUS` in `constants.ts` if collision feel is off
   - Tune particle lifespan/fade if visual timing feels wrong
   - Test shake intensity increments (0.005 → 0.0075 → 0.01) to find sweet spot

---

## Technical Architecture Notes

**Existing Systems Leveraged:**
- **Collision**: `lineIntersectsCircle()` in `src/utils/helpers.ts`
- **Particles**: Object-pooled `ParticleSystem` with `BLOOD_SPLATTER` type
- **Camera**: Phaser's `cameras.main.shake()` API
- **Audio**: `AudioManager` with mobile unlock handling
- **Events**: `monster-sliced` event emission pattern

**Data Flow:**
```
SlashTrail.getSlashPoints() → SlashSystem.update()
  ↓ (for each trail point pair)
  lineIntersectsCircle(line, monster.body.circle) → collision boolean
  ↓ (if collision)
  SlashSystem.handleMonsterHit(monster, impactPoint)
    ↓
    ├─> AudioManager.playSFX(monster.type)
    ├─> ParticleSystem.createHitEffect(impactPoint.x, impactPoint.y)
    └─> Monster.onSliced() → cameras.main.shake()
```

**Key Constraints:**
- Circular hitboxes only (Phaser Arcade Physics)
- Browser-based (no native code)
- Mobile-compatible (touch + audio unlock)
- Real-time performance critical (60 FPS target)
