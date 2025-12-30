# Specification: Score & Combo System

## Overview

Implement a multiplier-based scoring system that tracks player performance and rewards consecutive monster kills through a combo mechanic. The system assigns base scores per monster type, applies a combo multiplier for rapid successive kills, awards bonuses for multi-kill slashes, and provides visual feedback through a combo timer and milestone effects at 5x, 10x, and 15x multipliers. This feature adds skill-based depth that differentiates this game from simpler web clones by creating emergent gameplay through combo mechanics.

## Workflow Type

**Type**: feature

**Rationale**: This is a new gameplay feature introducing a scoring and combo system to an existing monster-slicing game. It requires new game state tracking, UI components, and visual feedback systems while integrating with existing monster and player mechanics.

## Task Scope

### Services Involved
- **main** (primary) - TypeScript/Phaser game implementation

### This Task Will:
- [ ] Track score with base values per monster type
- [ ] Implement combo multiplier that increases with rapid successive kills
- [ ] Create visible combo timer that resets after timeout period
- [ ] Add multi-kill bonuses for slicing multiple monsters in one swipe
- [ ] Trigger special visual effects at combo milestones (5x, 10x, 15x)
- [ ] Display current score and combo multiplier to player
- [ ] Track kill timing to determine "rapid successive" threshold

### Out of Scope:
- Score persistence/leaderboards (Supabase integration exists but not required for this task)
- Sound effects for combo milestones (focus on visual feedback)
- Difficulty scaling based on combo level
- Combo-based powerups or special abilities

## Service Context

### main

**Tech Stack:**
- Language: TypeScript
- Framework: Phaser (game engine)
- Build Tool: Vite
- Package Manager: npm
- Key directories: src/

**Entry Point:** `src/main.ts`

**How to Run:**
```bash
npm run dev
```

**Port:** http://localhost:5173

**Key Dependencies:**
- phaser - Game engine
- @supabase/supabase-js - Database (available but not required for this feature)

## Files to Modify

**⚠️ DISCOVERY REQUIRED**: The context gathering phase did not identify specific files. The implementation agent must first explore the codebase to locate:

| File Pattern | Service | What to Change |
|-------------|---------|---------------|
| `src/scenes/*GameScene*.ts` | main | Add score tracking and combo logic to main game scene |
| `src/entities/Monster*.ts` or `src/sprites/Monster*.ts` | main | Add monster type classification for variable scoring |
| `src/ui/*HUD*.ts` or `src/scenes/*UI*.ts` | main | Add combo timer display and score UI elements |
| `src/managers/*Score*.ts` (if exists) | main | Extend or create score manager for combo system |
| `src/managers/*Game*.ts` or `src/systems/*` | main | Integrate combo tracking into game state management |

**Discovery Steps Required:**
1. Search for existing monster/entity implementations: `grep -r "class.*Monster" src/`
2. Locate main game scene: `find src/scenes -name "*Game*.ts"`
3. Find UI/HUD implementation: `find src -name "*HUD*.ts" -o -name "*UI*.ts"`
4. Check for existing managers: `ls src/managers/ 2>/dev/null || echo "No managers dir"`
5. Review main.ts to understand scene structure and initialization

## Files to Reference

**⚠️ DISCOVERY REQUIRED**: These patterns should be identified during implementation:

| File Pattern | Pattern to Copy |
|-------------|-----------------|
| Existing Phaser scene files | Scene lifecycle (create, update), event handling |
| Existing UI components | Text display, timer animations, HUD positioning |
| Monster/entity definitions | Type system, kill event dispatching |
| Existing particle/effect systems | Visual effects for milestone celebrations |

## Patterns to Follow

### Phaser 3 Scene Pattern

**Expected Pattern** (typical Phaser structure):

```typescript
export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // Initialize game objects
    this.setupScoreSystem();
  }

  update(time: number, delta: number) {
    // Game loop - update combo timer
    this.comboSystem.update(delta);
  }
}
```

**Key Points:**
- Scenes use `create()` for initialization and `update()` for game loop
- Use Phaser's event system for monster kill notifications
- Leverage Phaser's time events for combo timer

### Score Manager Pattern

**Recommended Structure**:

```typescript
class ComboScoreManager {
  private score: number = 0;
  private comboMultiplier: number = 1;
  private comboCount: number = 0;
  private lastKillTime: number = 0;
  private readonly COMBO_TIMEOUT: number = 2000; // ms

  onMonsterKilled(monsterType: string, killTime: number): void {
    const timeSinceLastKill = killTime - this.lastKillTime;

    if (timeSinceLastKill < this.COMBO_TIMEOUT) {
      this.incrementCombo();
    } else {
      this.resetCombo();
    }

    this.addScore(monsterType);
    this.lastKillTime = killTime;
  }

  private incrementCombo(): void {
    this.comboCount++;
    this.comboMultiplier = Math.floor(this.comboCount / 5) + 1;
    this.checkMilestones();
  }

  private checkMilestones(): void {
    if ([5, 10, 15].includes(this.comboCount)) {
      this.triggerMilestoneEffect(this.comboCount);
    }
  }
}
```

**Key Points:**
- Track time between kills to maintain combo state
- Use configurable timeout constant
- Separate combo logic from score calculation
- Emit events for UI updates

### Phaser UI Text Pattern

**Expected Pattern**:

```typescript
// In create()
this.comboText = this.add.text(16, 16, 'Combo: 0x', {
  fontSize: '32px',
  color: '#ffffff'
}).setScrollFactor(0); // Fix to camera

this.comboTimerBar = this.add.graphics();

// In update()
updateComboUI(comboMultiplier: number, timeRemaining: number): void {
  this.comboText.setText(`Combo: ${comboMultiplier}x`);

  // Draw timer bar
  const barWidth = (timeRemaining / COMBO_TIMEOUT) * 200;
  this.comboTimerBar.clear();
  this.comboTimerBar.fillStyle(0xff6600);
  this.comboTimerBar.fillRect(16, 50, barWidth, 10);
}
```

**Key Points:**
- Use `.setScrollFactor(0)` to fix UI to camera
- Graphics objects for dynamic shapes like timer bars
- Update text in game loop, not on every kill (performance)

## Requirements

### Functional Requirements

1. **Variable Monster Scoring**
   - Description: Each monster type has a base score value that contributes to total score
   - Acceptance: Score increases when monster killed, amount varies by monster type
   - **Implementation Note**: Requires monster type taxonomy - discover existing type system or create enum (e.g., `MonsterType.BASIC = 10, MonsterType.FAST = 20`)

2. **Combo Multiplier System**
   - Description: Rapid successive kills increase a multiplier applied to score
   - Acceptance: Combo multiplier increments when kills occur within timeout window
   - **Parameters to Define**:
     - Combo timeout: 2000ms (suggested default)
     - Multiplier calculation: `multiplier = floor(comboCount / 5) + 1`

3. **Visible Combo Timer**
   - Description: HUD displays time remaining until combo resets
   - Acceptance: Timer bar or countdown visible, depletes when no kills, resets on kill
   - **UI Placement**: Top-left or top-right corner, should not obscure gameplay

4. **Multi-Kill Bonuses**
   - Description: Slicing multiple monsters in single swipe awards bonus points
   - Acceptance: If 2+ monsters killed in same frame/swipe, apply bonus multiplier
   - **Implementation Note**: Requires swipe/slash detection system - discover how player attacks are registered

5. **Combo Milestone Effects**
   - Description: Reaching 5x, 10x, 15x combo triggers special visual feedback
   - Acceptance: Observable effect (particle burst, screen flash, text animation) at milestones
   - **Effect Suggestions**:
     - 5x: Small particle burst at player position
     - 10x: Screen edge flash + larger particles
     - 15x: Full screen flash + "LEGENDARY" text + particle explosion

### Edge Cases

1. **Simultaneous Kills** - When multiple monsters die in same frame, all should count toward combo and trigger multi-kill bonus
2. **Combo Timeout at Milestone** - If combo times out at exactly 5/10/15, milestone effect should still trigger before reset
3. **Scene Transitions** - Combo should reset when leaving game scene (don't persist between levels)
4. **Pause State** - Combo timer should pause when game is paused
5. **Death/Game Over** - Combo resets but final score persists for display

## Implementation Notes

### DO
- **Discover existing patterns first**: Read through src/ to find monster, scene, and UI patterns before writing new code
- **Use Phaser's event system**: Emit 'monsterKilled' events from monster entities, listen in score manager
- **Separate concerns**: Keep score logic (manager), UI (scene/HUD), and monster definitions separate
- **Make values configurable**: Use constants for timeout, base scores, multiplier formula
- **Test combo edge cases**: Verify behavior at exactly timeout threshold, at milestones, during multi-kills

### DON'T
- Start coding without discovering existing codebase structure
- Hardcode score values - use configuration object or enum
- Put all logic in one file - follow existing project organization
- Forget to update UI every frame - combo timer must be smooth
- Create new patterns when existing Phaser patterns exist

### Key Implementation Questions to Answer During Discovery

1. **How are monsters currently implemented?**
   - Class-based? Sprite-based?
   - How is monster death detected?
   - Where can we add type classification?

2. **How is player input/slashing handled?**
   - Pointer events? Custom input manager?
   - How to detect multi-kills in single swipe?

3. **Where is game state managed?**
   - Scene-level? Separate manager?
   - Where should score manager integrate?

4. **How is UI currently structured?**
   - Separate UI scene? HUD in game scene?
   - Existing text styling patterns?

5. **Do particle effects exist?**
   - Phaser particle system used?
   - Existing effect patterns to follow for milestones?

## Development Environment

### Start Services

```bash
# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

### Service URLs
- Game: http://localhost:5173

### Required Environment Variables
None required for this feature. Supabase variables exist but are optional.

### Testing Approach

**Manual Testing in Browser:**
1. Open http://localhost:5173
2. Play game and kill monsters
3. Verify score increases
4. Kill monsters rapidly to build combo
5. Observe combo timer countdown
6. Let combo timeout and verify reset
7. Reach 5x, 10x, 15x to see milestone effects
8. Slice multiple monsters in one swipe to verify multi-kill bonus

**Browser Console Testing:**
```javascript
// Access score manager instance (adjust based on actual implementation)
const scoreManager = game.scene.getScene('GameScene').scoreManager;

// Simulate kills
scoreManager.onMonsterKilled('basic', Date.now());
scoreManager.onMonsterKilled('basic', Date.now() + 500);

// Check state
console.log(scoreManager.getScore());
console.log(scoreManager.getComboMultiplier());
```

## Success Criteria

The task is complete when:

1. [ ] Score increases per monster killed with different values per monster type
2. [ ] Combo multiplier increments when kills occur within timeout window (e.g., 2000ms)
3. [ ] Combo multiplier resets when timeout expires without kills
4. [ ] Combo timer is visible in HUD and shows time remaining until reset
5. [ ] Multi-kill bonus applies when 2+ monsters killed in single swipe
6. [ ] Visual effects trigger at 5x, 10x, and 15x combo milestones
7. [ ] Score and combo multiplier displayed prominently in HUD
8. [ ] No console errors during gameplay
9. [ ] Existing game functionality (monster spawning, slicing, etc.) still works
10. [ ] Combo resets appropriately on scene transitions or game over

## QA Acceptance Criteria

**CRITICAL**: These criteria must be verified by the QA Agent before sign-off.

### Unit Tests

**⚠️ Note**: Phaser games typically use manual testing rather than unit tests. If a testing framework exists in the project, add tests. Otherwise, rely on integration/manual testing.

| Test | File | What to Verify |
|------|------|----------------|
| Score calculation | `src/managers/ComboScoreManager.test.ts` | Base score + multiplier = correct total |
| Combo increment logic | `src/managers/ComboScoreManager.test.ts` | Combo increments within timeout, resets after |
| Milestone detection | `src/managers/ComboScoreManager.test.ts` | Milestones trigger at 5, 10, 15 exactly |
| Multi-kill bonus | `src/managers/ComboScoreManager.test.ts` | Bonus calculation for 2+ simultaneous kills |

### Integration Tests

| Test | Services | What to Verify |
|------|----------|----------------|
| Monster kill → Score update | main (game scene ↔ score manager) | Kill event increments score correctly |
| Combo timer → UI update | main (score manager ↔ HUD) | Timer display reflects actual time remaining |
| Milestone → Visual effect | main (score manager ↔ effects system) | Milestone triggers particle/screen effect |

### End-to-End Tests

| Flow | Steps | Expected Outcome |
|------|-------|------------------|
| Basic Scoring | 1. Start game 2. Kill 1 monster | Score increases by base value, combo = 1x |
| Combo Building | 1. Kill monster 2. Kill another within 2s 3. Repeat | Combo multiplier increases (1x → 2x → ...) |
| Combo Timeout | 1. Build combo to 5x 2. Wait >2s 3. Kill monster | Combo resets to 1x, timer resets |
| 5x Milestone | 1. Kill 5 monsters rapidly | Visual effect triggers, combo shows 5x |
| Multi-Kill | 1. Swipe through 3 monsters at once | Score includes multi-kill bonus, combo +1 |
| Game Over | 1. Build combo to 10x 2. Trigger game over | Final score displayed, combo resets |

### Browser Verification (if frontend)

| Page/Component | URL | Checks |
|----------------|-----|--------|
| Game Scene | `http://localhost:5173` | Score visible in HUD |
| Game Scene | `http://localhost:5173` | Combo multiplier displays as "Xx" format |
| Game Scene | `http://localhost:5173` | Combo timer bar visible and animates smoothly |
| Game Scene | `http://localhost:5173` | Milestone effects visible at 5x, 10x, 15x |
| Game Scene | `http://localhost:5173` | No UI elements overlap or obscure gameplay |
| Browser Console | `http://localhost:5173` | No errors logged during combo gameplay |

### Manual QA Checklist

**Gameplay Verification:**
- [ ] Score starts at 0 when game begins
- [ ] Each monster kill increases score
- [ ] Different monster types award different scores
- [ ] Combo multiplier shows as "1x" initially
- [ ] Combo increments with rapid kills (within ~2 seconds)
- [ ] Combo timer bar depletes smoothly when no kills
- [ ] Timer bar refills to full on each kill
- [ ] Combo resets to 1x when timer expires
- [ ] Multi-kill (3+ monsters at once) awards visible bonus
- [ ] 5x combo triggers visual effect
- [ ] 10x combo triggers enhanced effect
- [ ] 15x combo triggers maximum effect
- [ ] Combo resets on game over
- [ ] Combo resets between levels/scenes

**UI Verification:**
- [ ] Score text is readable (contrast, size)
- [ ] Combo text is readable
- [ ] Timer bar is clearly visible
- [ ] UI doesn't cover important gameplay areas
- [ ] Text updates immediately on kill
- [ ] Timer animation is smooth (60 FPS)
- [ ] Milestone effects don't obscure gameplay critically

**Edge Case Verification:**
- [ ] Killing 2 monsters in same frame counts both
- [ ] Reaching exactly 5/10/15 triggers effect before potential timeout
- [ ] Pausing game freezes combo timer
- [ ] Resuming game continues timer correctly
- [ ] Multiple milestones in quick succession all trigger effects
- [ ] Very high combos (20x+) don't break UI or overflow

### Performance Verification

- [ ] No frame drops during combo gameplay
- [ ] Particle effects at milestones don't cause lag
- [ ] UI updates don't impact game performance
- [ ] Memory usage stable during extended combo sessions

### QA Sign-off Requirements

- [ ] All E2E test flows pass
- [ ] All browser verification checks complete
- [ ] All manual QA checklist items verified
- [ ] No console errors or warnings during gameplay
- [ ] No regressions in existing monster slicing mechanics
- [ ] UI follows existing game style and patterns
- [ ] Code follows TypeScript/Phaser best practices found in codebase
- [ ] No performance degradation (60 FPS maintained)
- [ ] Feature works consistently across multiple play sessions

---

## Implementation Plan Outline

**Phase 1: Discovery** (required due to missing context)
- Explore src/ to find game scene, monster entities, UI structure
- Document existing patterns for events, state management, effects
- Identify monster type system or create classification

**Phase 2: Core Score System**
- Create ComboScoreManager class
- Implement base scoring per monster type
- Add kill event listening

**Phase 3: Combo Mechanics**
- Implement combo timeout logic
- Add combo multiplier calculation
- Create milestone detection

**Phase 4: UI Components**
- Add score display text
- Add combo multiplier text
- Create combo timer bar graphic
- Position and style HUD elements

**Phase 5: Visual Effects**
- Implement 5x milestone effect
- Implement 10x milestone effect
- Implement 15x milestone effect
- Add multi-kill visual feedback

**Phase 6: Integration**
- Connect monster kill events to score manager
- Wire score updates to UI
- Test all edge cases
- Polish and tune values

**Phase 7: QA & Polish**
- Manual testing of all flows
- Performance verification
- UI/UX polish
- Documentation
