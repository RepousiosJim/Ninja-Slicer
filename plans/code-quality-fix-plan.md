# Ninja Slicer - Code Quality Fix Plan

## Overview
Comprehensive plan to fix all code quality issues found during code review, organized into 4 phases with clear tasks and subtasks.

---

## 📋 PHASE 1: Critical Fixes

### 1.1 Fix Missing Scene Imports and Duplicates

**File**: `src/main.ts`

**Tasks**:
- [ ] Remove unused `PreloaderScene` import (line 12)
- [ ] Remove unused `WorldSelectScene` import (line 14)  
- [ ] Remove unused `UpdatesScene` import (line 26)
- [ ] Verify all scene imports match scene list (lines 101-118)
- [ ] Add missing scenes if needed

**Subtasks**:
1.1.1 Clean up unused import statements
1.1.2 Verify scene list completeness
1.1.3 Run `npm run typecheck` to verify no TypeScript errors

---

### 1.2 Fix Memory Leak in Vampire Entity

**File**: `src/entities/Vampire.ts`

**Design Pattern**: Use Phaser's `on('destroy')` event for cleanup

**Tasks**:
- [ ] Store cleanup timer references as class properties
- [ ] Add `on('destroy')` listener to cleanup timers when entities are destroyed
- [ ] Use failsafe timers with proper cleanup

**Subtasks**:
1.2.1 Add timer references to class properties
```typescript
private halfCleanupTimer?: Phaser.Time.TimerEvent;
private batCleanupTimer?: Phaser.Time.TimerEvent;
```

1.2.2 Implement destroy listener pattern
```typescript
leftHalf.on('destroy', () => {
  this.halfCleanupTimer?.destroy();
});
```

1.2.3 Update `createHalves()` method
- Store timer in class property
- Add cleanup on scene shutdown

1.2.4 Update `createBatBurst()` method
- Store timer in class property  
- Add cleanup on scene shutdown

---

### 1.3 Replace Hardcoded Magic Numbers

**Files**: `src/ui/HUD.ts`, `src/scenes/GameplayScene.ts`, `src/systems/SpawnSystem.ts`

**Design Pattern**: Use constant definitions and configuration

**Tasks**:
1.3.1 **HUD.ts** - Replace `1280` with `GAME_WIDTH`
   - Line 115: `1280 / 2` → `GAME_WIDTH / 2`
   - Line 126: `1280 / 2` → `GAME_WIDTH / 2`, `680` → `GAME_HEIGHT - 40`
   - Line 129: `1280 / 2` → `GAME_WIDTH / 2`
   - Line 140: `1280 / 2` → `GAME_WIDTH / 2`
   - Line 151: `1280 / 2` → `GAME_WIDTH / 2`
   - Line 162: `1280 / 2` → `GAME_WIDTH / 2`
   - Line 173: `1280 / 2` → `GAME_WIDTH / 2`
   - Line 205: `1280 - 60` → `GAME_WIDTH - 60`

1.3.2 **GameplayScene.ts** - Define screen boundary constant
   - Add `SCREEN_BOTTOM_Y = 800` to constants or use `GAME_HEIGHT`

1.3.3 **SpawnSystem.ts** - Define screen boundary constant
   - Add `SCREEN_BOTTOM_Y = 800` or use `GAME_HEIGHT`

---

## 📋 PHASE 2: Type Safety & Constants

### 2.1 Fix Type Safety Violations

**File**: `src/scenes/MainMenuScene.ts`

**Tasks**:
- [ ] Import proper types for save data
- [ ] Replace `any` with `Readonly<GameSave>`

**Subtasks**:
2.1.1 Import GameSave type
```typescript
import { GameSave } from '@config/types';
import { SaveManager } from '../managers/SaveManager';
```

2.1.2 Update method signatures
```typescript
private getLastWorld(saveData: Readonly<GameSave>): number { ... }
private getLastLevel(saveData: Readonly<GameSave>): number { ... }
private getTotalStars(saveData: Readonly<GameSave>): number { ... }
private getNewItemsBadge(saveData: Readonly<GameSave>): ... { ... }
```

2.1.3 Remove unnecessary `saveData: any` parameter
- `getTotalStars()` can use `this.saveManager.getSaveData()` directly

---

### 2.2 Remove Duplicate Constants

**File**: `src/managers/SaveManager.ts`

**Tasks**:
- [ ] Remove local `SAVE_VERSION` constant (line 17)
- [ ] Import `SAVE_VERSION` from constants
- [ ] Verify no other duplicates

**Subtasks**:
2.2.1 Update imports
```typescript
import { SAVE_VERSION, SAVE_KEY, SETTINGS_KEY } from '@config/constants';
```

2.2.2 Remove local constant definitions (lines 15-17)
2.2.3 Update all references to use imported constants

---

### 2.3 Add Proper Error Handling

**Files**: `src/managers/LevelManager.ts`, `src/managers/AudioManager.ts`

**Tasks**:
2.3.1 **LevelManager.ts** - Add try-catch for fetch operations
   - Wrap `fetch('/src/data/levels.json')` in try-catch
   - Add proper error logging
   - Consider using async/await with error boundaries

2.3.2 **AudioManager.ts** - Add null check for sound manager
   - Line 68: Check `this.scene.sound` exists before accessing `locked`
   - Add proper TypeScript type guards

**Subtasks**:
2.3.3 Create error handling utility function
```typescript
async function safeFetch<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error);
    return null;
  }
}
```

2.3.4 Update AudioManager to use type guard
```typescript
private setupUnlockListener(): void {
  if (!this.scene.sound || this.scene.sound.locked) {
    this.scene.sound?.once(Phaser.Sound.Events.UNLOCKED, ...);
  }
}
```

---

### 2.4 Fix Potential Division by Zero

**File**: `src/utils/helpers.ts`

**Tasks**:
- [ ] Add guard clause for zero height difference

**Subtasks**:
2.4.1 Update `calculateLaunchVelocity()` function
```typescript
export function calculateLaunchVelocity(
  startX: number,
  startY: number,
  targetX: number,
  peakY: number,
  gravity: number
): { x: number; y: number } {
  const heightDiff = startY - peakY;
  
  // Guard against division by zero
  if (heightDiff <= 0) {
    return { x: 0, y: -Math.sqrt(gravity * 100) }; // Minimum velocity
  }
  
  const velocityY = -Math.sqrt(2 * gravity * heightDiff);
  const timeToPeak = -velocityY / gravity;
  const velocityX = (targetX - startX) / timeToPeak;
  
  return { x: velocityX, y: velocityY };
}
```

---

## 📋 PHASE 3: Code Quality Improvements

### 3.1 Optimize Array Operations

**File**: `src/systems/SpawnSystem.ts`

**Tasks**:
- [ ] Replace splice-in-loop with filter pattern
- [ ] Consider using Set for faster lookups

**Subtasks**:
3.1.1 Replace splice loop with filter
```typescript
// Before (O(n²))
for (let i = this.monsters.length - 1; i >= 0; i--) {
  if (!monster || !monster.active) {
    this.monsters.splice(i, 1);
  }
}

// After (O(n))
this.monsters = this.monsters.filter(monster => 
  monster && monster.active
);
```

3.1.2 Update all three methods:
   - `updateMonsters()`
   - `updateVillagers()`
   - `updatePowerUps()`

---

### 3.2 Remove Console Debug Statements

**Files**: Multiple (GameplayScene, WeaponManager, LevelManager, etc.)

**Design Pattern**: Use debug flag or logger utility

**Tasks**:
3.2.1 Create debug utility
```typescript
// src/utils/DebugLogger.ts
const DEBUG = import.meta.env.DEV;

export function debugLog(message: string, ...args: unknown[]): void {
  if (DEBUG) {
    console.log(`[DEBUG] ${message}`, ...args);
  }
}
```

3.2.2 Replace console.log calls with debugLog
3.2.3 Files to update:
   - `src/scenes/GameplayScene.ts` (line 128)
   - `src/managers/WeaponManager.ts` (lines 66-67)
   - `src/managers/LevelManager.ts` (line 70)
   - Any other files with production console.log

---

### 3.3 Clean Up Unused Imports

**File**: `src/main.ts`

**Tasks**:
- [ ] Remove all unused import statements
- [ ] Run ESLint to find all unused imports
- [ ] Apply auto-fix

**Subtasks**:
3.3.1 Run `npm run lint` to identify unused imports
3.3.2 Apply `npm run lint:fix` to auto-remove
3.3.3 Manually verify and fix remaining issues

---

### 3.4 Add Missing Null Checks

**Files**: `src/entities/Monster.ts`, `src/ui/HUD.ts`

**Tasks**:
3.4.1 **Monster.ts** - Fix bgSprite reference in event listener
   - Add null check or use WeakMap for background sprites
   - Consider using Phaser's built-in container

3.4.2 **HUD.ts** - Add null-safe property access
   - Lines 94, 126, 140, 151, 162, 173, 205: Check GAME_WIDTH/GAME_HEIGHT exist

**Subtasks**:
3.4.3 Refactor Monster visibility enhancement
```typescript
// Use container instead of separate sprite with event listener
private bgSprite: Phaser.GameObjects.Sprite | null = null;

private enhanceVisibility(): void {
  // Create container for monster + background
  const container = this.scene.add.container(this.x, this.y);
  container.add([background, this]);
  
  // Track container reference
  this.bgSprite = container as any; // Container is sprite-like
}
```

---

## 📋 PHASE 4: Polish & Testing

### 4.1 Implement Object Pooling (Optional Enhancement)

**File**: `src/systems/SpawnSystem.ts` or new `src/systems/ObjectPool.ts`

**Design Pattern**: Object Pool pattern for frequent spawn/destroy

**Tasks**:
4.1.1 Create ObjectPool utility class
4.1.2 Implement pool for monsters
4.1.3 Implement pool for particles

**Subtasks**:
4.1.4 Create base ObjectPool class
```typescript
export class ObjectPool<T extends Phaser.GameObjects.GameObject> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn?: (obj: T) => void;
  
  constructor(createFn: () => T, resetFn?: (obj: T) => void) {
    this.createFn = createFn;
    this.resetFn = resetFn;
  }
  
  get(): T {
    return this.pool.pop() ?? this.createFn();
  }
  
  release(obj: T): void {
    this.resetFn?.(obj);
    this.pool.push(obj);
  }
}
```

4.1.5 Integrate with SpawnSystem
4.1.6 Test performance improvement

---

### 4.2 Clean Up TODO Items

**Files**: `src/scenes/MainMenuScene.ts`

**Tasks**:
4.2.1 Implement leaderboard rank feature
   - Connect to leaderboard API
   - Display actual rank instead of `#--`

4.2.2 Implement new items badge
   - Track last shop visit timestamp
   - Compare with new items' unlock dates
   - Show badge if new items available

---

### 4.3 Verify All Fixes Work

**Tasks**:
4.3.1 Run TypeScript type check
```bash
npm run typecheck
```

4.3.2 Run ESLint
```bash
npm run lint
```

4.3.3 Run build
```bash
npm run build
```

4.3.4 Manual testing in dev mode
```bash
npm run dev
```

**Verification Checklist**:
- [ ] Game launches without errors
- [ ] All scenes load correctly
- [ ] Memory usage stable (no leaks)
- [ ] No console warnings
- [ ] TypeScript strict mode passes

---

### 4.4 Run Full Test Suite

**Tasks**:
4.4.1 Configure Jest or Vitest for unit tests
4.4.2 Write tests for utility functions
4.4.3 Write tests for manager classes
4.4.4 Add integration tests for core gameplay

**Test Coverage Goals**:
- Utility functions: 100%
- Managers: 80%+
- Core gameplay: 70%+

---

## 📊 Implementation Order

```
Phase 1 (Critical)
├── 1.1 Fix Scene Imports
├── 1.2 Fix Memory Leak
└── 1.3 Fix Magic Numbers

Phase 2 (Type Safety)
├── 2.1 Fix Type Violations
├── 2.2 Remove Duplicates
├── 2.3 Error Handling
└── 2.4 Division by Zero

Phase 3 (Quality)
├── 3.1 Optimize Arrays
├── 3.2 Debug Statements
├── 3.3 Unused Imports
└── 3.4 Null Checks

Phase 4 (Polish)
├── 4.1 Object Pooling (Optional)
├── 4.2 TODO Items
├── 4.3 Verify Fixes
└── 4.4 Test Suite
```

---

## 🎯 Success Criteria

1. ✅ `npm run typecheck` passes with 0 errors
2. ✅ `npm run lint` passes with 0 warnings
3. ✅ `npm run build` produces valid output
4. ✅ Memory leak test shows stable usage over 10 minutes
5. ✅ All hardcoded values replaced with constants
6. ✅ Type safety improved (no `any` types in main code)

---

## 📝 Notes

- **Breaking Changes**: None expected
- **Dependencies**: No new dependencies required
- **Backward Compatible**: All changes are internal refactoring
- **Estimated Effort**: 4-6 hours for full implementation
