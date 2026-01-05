# Specification: Soul Currency & Economy System

## Overview

Implement a soul-based currency system as the primary in-game economy for the monster-slicing game. Players earn souls by slicing monsters (with bonuses for combos and level completion) and spend souls on weapon purchases and upgrades. This feature directly addresses competitor pain points about pay-to-win mechanics by providing fair progression without monetization barriers. The system requires integration with the combat mechanics, HUD display, persistent storage via Supabase, and shop/upgrade confirmation flows.

## Workflow Type

**Type**: feature

**Rationale**: This is a new major game system that introduces core economy mechanics. It requires creating new data models, UI components, game logic integrations, and persistent storage mechanisms. The feature involves multiple subsystems (combat, UI, persistence, shop) and establishes foundational patterns for future economic features.

## Task Scope

### Services Involved
- **main** (primary) - Phaser-based game client implementing all currency logic, UI, and persistence

### This Task Will:
- [x] Create soul currency data model and manager
- [x] Award souls per monster based on type and combo multiplier
- [x] Display total souls in HUD during gameplay
- [x] Display total souls in menu/shop screens
- [x] Persist soul count between sessions using Supabase
- [x] Award bonus souls on level completion
- [x] Implement soul deduction with user confirmation on purchases
- [x] Integrate with existing combat system for monster kill events
- [x] Integrate with combo system for multiplier calculations

### Out of Scope:
- In-app purchase (IAP) integration for souls (intentionally excluded)
- Alternative currency types (focus on souls only)
- Detailed shop UI implementation (assuming shop exists or will be separate task)
- Monster balancing and specific soul values (can be configured later)
- Leaderboards or soul-based competitive features

## Service Context

### main

**Tech Stack:**
- Language: TypeScript
- Framework: Phaser (game engine)
- Build Tool: Vite
- Backend: Supabase (for persistence)
- State Management: Custom (Phaser-based)
- Key directories:
  - `src/` - Source code
  - `src/main.ts` - Application entry point

**Entry Point:** `src/main.ts`

**How to Run:**
```bash
npm run dev
```

**Port:** 5173 (local development server)

**Backend Integration:**
- Supabase for player data persistence
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

**Notable Dependencies:**
- `phaser` - Core game engine
- `@supabase/supabase-js` - Backend client
- `@sentry/browser` - Error tracking
- `zod` - Runtime type validation

## Files to Modify

**Note**: Context discovery phase did not identify existing files. Implementation team should explore codebase to identify actual file paths.

| File | Service | What to Change |
|------|---------|---------------|
| `src/managers/CurrencyManager.ts` (create) | main | New manager class for soul currency operations |
| `src/models/PlayerData.ts` (or similar) | main | Add souls property to player data model |
| `src/scenes/GameScene.ts` (or similar) | main | Integrate soul awards on monster kills and level completion |
| `src/ui/HUD.ts` (or similar) | main | Add soul counter display component |
| `src/ui/ShopScene.ts` (or similar) | main | Add soul display and deduction logic |
| `src/services/SaveService.ts` (or similar) | main | Add soul persistence to save/load operations |
| `src/config/monsters.ts` (or similar) | main | Add soul value configuration per monster type |

## Files to Reference

**Note**: No reference files were discovered. Implementation team should explore codebase to find:

| File | Pattern to Copy |
|------|----------------|
| Existing manager classes | Singleton pattern, service architecture |
| Existing HUD components | UI positioning, text styling, update patterns |
| Existing save/load logic | Supabase integration patterns, data serialization |
| Existing monster definitions | Configuration structure, type definitions |
| Existing confirmation dialogs | Modal/popup patterns for purchase confirmation |

## Patterns to Follow

### Phaser Scene Integration Pattern

For integrating currency awards into the game loop:

```typescript
// Expected pattern based on Phaser best practices
class GameScene extends Phaser.Scene {
  create() {
    // Listen for monster kill events
    this.events.on('monster-killed', this.handleMonsterKilled, this);
    this.events.on('level-complete', this.handleLevelComplete, this);
  }

  handleMonsterKilled(monster: Monster, comboMultiplier: number) {
    const soulValue = monster.baseSoulValue * comboMultiplier;
    CurrencyManager.getInstance().addSouls(soulValue);
  }

  handleLevelComplete(level: LevelData) {
    const bonus = level.completionBonus;
    CurrencyManager.getInstance().addSouls(bonus);
  }
}
```

**Key Points:**
- Use Phaser event system for decoupled communication
- Manager pattern for centralized currency logic
- Multiply base values by combo multiplier for dynamic rewards

### Supabase Persistence Pattern

Expected pattern for saving/loading souls:

```typescript
// Persistence integration
class SaveService {
  async savePlayerData(playerData: PlayerData) {
    const { data, error } = await supabase
      .from('player_profiles')
      .upsert({
        user_id: playerData.userId,
        souls: playerData.souls,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
    return data;
  }

  async loadPlayerData(userId: string): Promise<PlayerData> {
    const { data, error } = await supabase
      .from('player_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }
}
```

**Key Points:**
- Use upsert for save operations (handles new and existing players)
- Validate data with Zod schemas before sending to Supabase
- Handle errors gracefully with user-friendly messages

### Currency Manager Singleton Pattern

```typescript
class CurrencyManager {
  private static instance: CurrencyManager;
  private souls: number = 0;
  private listeners: Array<(souls: number) => void> = [];

  static getInstance(): CurrencyManager {
    if (!CurrencyManager.instance) {
      CurrencyManager.instance = new CurrencyManager();
    }
    return CurrencyManager.instance;
  }

  addSouls(amount: number): void {
    this.souls += amount;
    this.notifyListeners();
  }

  deductSouls(amount: number): boolean {
    if (this.souls >= amount) {
      this.souls -= amount;
      this.notifyListeners();
      return true;
    }
    return false;
  }

  subscribe(listener: (souls: number) => void): void {
    this.listeners.push(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.souls));
  }
}
```

**Key Points:**
- Singleton ensures single source of truth
- Observer pattern for UI updates
- Return boolean from deduct to indicate success/failure

## Requirements

### Functional Requirements

1. **Soul Earning from Monsters**
   - Description: Award souls when monsters are killed, with amount varying by monster type and combo multiplier
   - Acceptance:
     - Each monster type has a base soul value
     - Final soul award = baseSoulValue × comboMultiplier
     - Souls are added to player total immediately on kill
     - UI shows "+X souls" feedback animation

2. **Soul Earning from Level Completion**
   - Description: Award bonus souls when a level is successfully completed
   - Acceptance:
     - Each level has a defined completion bonus
     - Bonus is awarded on level complete event
     - Bonus is displayed in level complete screen

3. **Soul Display in HUD**
   - Description: Show current total souls during active gameplay
   - Acceptance:
     - Soul counter visible in HUD (top-left or top-right recommended)
     - Updates in real-time as souls are earned
     - Uses icon + number format (e.g., "👻 1,234")
     - Animates when value changes

4. **Soul Display in Menus**
   - Description: Show current total souls in shop and upgrade screens
   - Acceptance:
     - Soul count prominently displayed
     - Consistent formatting with HUD display
     - Updates after purchases

5. **Soul Persistence**
   - Description: Save and load soul count between game sessions
   - Acceptance:
     - Souls saved to Supabase on session end or periodic auto-save
     - Souls loaded on game start
     - No soul loss on app restart
     - Handle offline scenarios gracefully

6. **Soul Spending with Confirmation**
   - Description: Deduct souls on purchases with user confirmation to prevent accidental spending
   - Acceptance:
     - Before deducting, show confirmation modal with item cost
     - Modal displays: item name, cost, current balance, balance after purchase
     - "Confirm" and "Cancel" buttons
     - Only deduct if user confirms AND has sufficient souls
     - Show error if insufficient souls

### Edge Cases

1. **Insufficient Souls** - Disable purchase buttons if player cannot afford item. Show red highlight or grayed-out state. Display helpful message: "Need X more souls"

2. **Negative Soul Values** - Validate that soul additions are always positive. Log error if negative value attempted. Prevent deduction below zero.

3. **Very Large Numbers** - Format numbers with commas (1,234,567). Consider abbreviations for millions (1.2M). Ensure UI layout doesn't break with 6-7 digit numbers.

4. **Network Failures During Save** - Queue save operations if offline. Retry with exponential backoff. Show warning icon if save fails. Don't lose progress locally.

5. **Concurrent Save Operations** - Use debouncing to prevent multiple simultaneous saves. Queue operations if needed. Timestamp-based conflict resolution.

6. **Session Hijacking / Tampering** - Validate soul values server-side on critical operations. Use Supabase RLS policies. Don't trust client-side values blindly.

## Implementation Notes

### DO
- Use the existing Supabase client instance (already configured in environment)
- Follow Phaser best practices for scene lifecycle and event management
- Implement TypeScript interfaces for all data models (PlayerData, MonsterConfig, etc.)
- Use Zod schemas to validate data before Supabase operations
- Add Sentry error tracking for failed save operations
- Implement visual feedback (particles, animations) when souls are earned
- Test with various combo multipliers (1x, 2x, 5x, 10x)
- Add debug commands for testing (add/remove souls in dev mode)
- Document soul value balancing assumptions for game designers

### DON'T
- Hard-code soul values in scene files - use configuration files
- Bypass confirmation on any soul deduction
- Store souls only in localStorage - must use Supabase for cloud sync
- Implement IAP or monetization hooks (explicitly out of scope)
- Create multiple currency manager instances
- Skip error handling on network operations
- Forget to unsubscribe from events in scene shutdown

## Development Environment

### Start Services

```bash
# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

### Service URLs
- Game Client: http://localhost:5173
- Supabase Dashboard: https://your-project-id.supabase.co (see `.env` for URL)

### Required Environment Variables

Ensure these are set in `.env`:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

Optional (for development integrations):
```bash
VITE_SENTRY_DSN=<sentry-project-dsn>
```

### Supabase Table Setup

Create or modify the `player_profiles` table:

```sql
CREATE TABLE IF NOT EXISTS player_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  souls INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON player_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON player_profiles FOR UPDATE
  USING (auth.uid() = user_id);
```

## Success Criteria

The task is complete when:

1. [x] Souls are awarded per monster kill with correct base values and combo multipliers
2. [x] Souls are awarded on level completion with configured bonus amount
3. [x] Soul count displays in HUD during gameplay and updates in real-time
4. [x] Soul count displays in shop/menu screens
5. [x] Souls persist between game sessions (close and reopen game, souls remain)
6. [x] Purchase confirmation modal shows before soul deduction
7. [x] Souls deduct correctly only after user confirmation
8. [x] Error handling prevents negative balances or invalid operations
9. [x] No console errors during soul earning, display, or spending flows
10. [x] Existing tests still pass (if any exist)
11. [x] Manual browser testing confirms all flows work end-to-end

## QA Acceptance Criteria

**CRITICAL**: These criteria must be verified by the QA Agent before sign-off.

### Unit Tests

| Test | File | What to Verify |
|------|------|----------------|
| CurrencyManager.addSouls() | `src/managers/CurrencyManager.test.ts` | Adds correct amount, notifies listeners, handles edge cases |
| CurrencyManager.deductSouls() | `src/managers/CurrencyManager.test.ts` | Returns true if sufficient balance, false otherwise, updates balance correctly |
| CurrencyManager singleton | `src/managers/CurrencyManager.test.ts` | Multiple getInstance() calls return same instance |
| SaveService.savePlayerData() | `src/services/SaveService.test.ts` | Correctly formats data, calls Supabase upsert, handles errors |
| SaveService.loadPlayerData() | `src/services/SaveService.test.ts` | Fetches correct user data, parses souls value, handles missing data |

### Integration Tests

| Test | Services | What to Verify |
|------|----------|----------------|
| Monster kill awards souls | Game scene ↔ Currency Manager | Monster kill event triggers soul award with correct base value |
| Combo multiplier applied | Combat system ↔ Currency Manager | Combo multiplier correctly scales soul awards (test 1x, 2x, 5x) |
| Level completion bonus | Game scene ↔ Currency Manager | Level complete event awards configured bonus amount |
| Soul persistence | Currency Manager ↔ Supabase | Souls saved correctly, load returns same value |
| Purchase flow | Shop scene ↔ Currency Manager | Confirmation shown, souls deducted only on confirm, balance updates |

### End-to-End Tests

| Flow | Steps | Expected Outcome |
|------|-------|------------------|
| Earn and Persist Souls | 1. Start game 2. Kill 5 monsters 3. Note soul count 4. Close game 5. Reopen game | Soul count persists exactly, no loss |
| Purchase with Confirmation | 1. Open shop 2. Select item 3. Click purchase 4. Review confirmation modal 5. Click confirm | Confirmation shows correct cost, souls deducted, balance updates |
| Purchase Cancellation | 1. Open shop 2. Select item 3. Click purchase 4. Click cancel in modal | No souls deducted, balance unchanged |
| Insufficient Funds | 1. Spend all souls 2. Try to purchase item | Purchase button disabled OR error message shown, no deduction attempted |
| Combo Multiplier Flow | 1. Build combo to 3x 2. Kill monster 3. Check soul award | Soul award = baseSoulValue × 3 |

### Browser Verification

| Page/Component | URL | Checks |
|----------------|-----|--------|
| Game HUD | `http://localhost:5173` (in-game) | Soul counter visible, updates on kills, animates nicely |
| Shop/Menu Screen | `http://localhost:5173/shop` (or modal) | Soul balance displayed, updates after purchases |
| Level Complete Screen | End of level | Bonus souls displayed, added to total |
| Purchase Confirmation Modal | Triggered on shop purchase | Shows item name, cost, current balance, confirm/cancel buttons |

### Database Verification

| Check | Query/Command | Expected |
|-------|---------------|----------|
| Player souls saved | `SELECT souls FROM player_profiles WHERE user_id = '<test-user-id>'` | Correct soul count matches game state |
| No negative souls | `SELECT COUNT(*) FROM player_profiles WHERE souls < 0` | Returns 0 (no negative balances) |
| Timestamp updates | `SELECT updated_at FROM player_profiles WHERE user_id = '<test-user-id>'` | Updated timestamp reflects recent save |

### Manual Testing Checklist

- [ ] Open game, verify souls load from previous session (or default to 0 for new player)
- [ ] Kill 10 monsters, verify souls increase each time
- [ ] Build a combo, verify multiplier affects soul awards
- [ ] Complete a level, verify bonus souls awarded
- [ ] Open shop, verify current balance displayed
- [ ] Attempt purchase with sufficient souls, confirm modal appears
- [ ] Cancel purchase, verify no deduction
- [ ] Confirm purchase, verify souls deducted and balance updates
- [ ] Attempt purchase with insufficient souls, verify error/disabled state
- [ ] Close and reopen game, verify souls persist
- [ ] Check browser console for errors (should be none)
- [ ] Check Supabase dashboard for correct data

### QA Sign-off Requirements

- [ ] All unit tests pass (or written and passing if tests didn't exist)
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Browser verification complete (all flows working)
- [ ] Database state verified (no corrupt or negative values)
- [ ] No regressions in existing game functionality (monsters still spawn, combos still work, etc.)
- [ ] Code follows established TypeScript and Phaser patterns
- [ ] No security vulnerabilities (RLS policies active, no client-side exploits)
- [ ] Error handling tested (network failures, invalid states)
- [ ] Performance acceptable (no lag when earning souls rapidly)

---

## Implementation Strategy Recommendations

### Phase 1: Core Data & Persistence (Foundation)
1. Create `CurrencyManager` singleton
2. Add souls column to Supabase `player_profiles` table
3. Implement save/load operations in `SaveService`
4. Write unit tests for currency manager

### Phase 2: Game Integration (Earning)
1. Identify monster kill event system
2. Hook soul awards into monster kills
3. Implement combo multiplier integration
4. Add level completion bonus logic
5. Write integration tests for earning flows

### Phase 3: UI Display (Visibility)
1. Add soul counter to HUD
2. Add soul display to shop/menu screens
3. Implement update animations
4. Test UI responsiveness

### Phase 4: Spending & Confirmation (Safety)
1. Create confirmation modal component
2. Integrate with purchase flow
3. Implement soul deduction logic
4. Add insufficient funds handling
5. Write E2E tests for spending flows

### Phase 5: Polish & QA (Quality)
1. Add visual feedback (particles, sounds)
2. Implement error handling and edge cases
3. Performance testing with rapid soul earning
4. Full manual QA pass
5. Security review (Supabase policies, validation)

---

**Total Estimated Scope**: Medium-Large feature (3-5 days for full implementation + testing)

**Dependencies to Discover**:
- Existing monster/enemy system architecture
- Current combat event system
- Existing HUD implementation
- Shop/purchase UI (if exists)
- Combo tracking system
- Current save/load implementation

**Risk Mitigation**:
- Start with Phase 1 to establish foundation before tackling integrations
- Implement extensive logging for debugging save/load issues
- Create debug commands for manual testing without gameplay
- Version the Supabase schema changes for rollback capability
