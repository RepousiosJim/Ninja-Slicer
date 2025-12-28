# Monster Slayer - Developer Quick Reference

## Key Values (Copy-Paste Ready)

### Slash Detection
```typescript
const VELOCITY_THRESHOLD = 300;  // px/sec to register slash
const HITBOX_RADIUS = 30;        // base slash hit radius
```

### Monster Stats
```
| Type    | Speed | Points | Souls | Hitbox |
|---------|-------|--------|-------|--------|
| Zombie  | 1.0x  | 10     | 5     | 40px   |
| Vampire | 1.4x  | 15     | 8     | 35px   |
| Ghost   | 1.2x  | 20     | 10    | 35px   |
```

### Ghost Visibility
```typescript
const VISIBLE_TIME = 2.0;    // seconds
const INVISIBLE_TIME = 1.0;  // seconds
const FADE_TIME = 0.3;       // seconds
```

### Combo System
```typescript
const COMBO_TIMEOUT = 2.0;              // seconds
const COMBO_MULTIPLIER = 1 + (combo * 0.1);  // +10% per combo
```

### Power-Up Durations
```
| Power-Up    | Duration |
|-------------|----------|
| Slow Motion | 5.0s     |
| Frenzy      | 8.0s     |
| Shield      | 30.0s    |
| Soul Magnet | 10.0s    |
```

### Difficulty Formula
```typescript
baseDifficulty = (world * 1.5) + (level * 0.3) + (isBoss ? 2 : 0);
spawnRate = baseRate * (1 + difficulty * 0.15);
speedMultiplier = 1 + (difficulty * 0.04);
```

### Endless Scaling
```typescript
difficultyLevel = Math.floor(score / 1000);
```

### Level Completion
```
Survive duration + Meet kill quota = Win
Lose all lives = Game Over
```

### Star Rating
```
score >= threshold[2] → 3 stars
score >= threshold[1] → 2 stars
score >= threshold[0] → 1 star
```

---

## File Locations

```
Data Files:
  /data/levels.json     - All 25 levels + 5 worlds + 5 bosses
  /data/weapons.json    - 6 weapons with 3 tiers each
  /data/upgrades.json   - 5 upgrades with 5 tiers each

Source Files:
  /src/config/constants.ts  - All game constants
  /src/config/types.ts      - All TypeScript interfaces
```

---

## Event Names

```typescript
// Gameplay
'monster-sliced'      // { monsterType, position, points, souls, isCritical, comboCount }
'villager-sliced'     // { position, penalty }
'monster-missed'      // { monsterType }
'powerup-collected'   // { type }
'boss-hit'            // { bossId, damage, remainingHealth, phase }
'boss-defeated'       // { bossId, souls }

// State
'score-updated'       // { score, delta }
'souls-updated'       // { souls, delta }
'combo-updated'       // { count, multiplier }
'lives-changed'       // { lives, delta }
'level-complete'      // { levelId, score, stars, stats }
'game-over'           // { score, souls, stats }
```

---

## Scene Keys

```typescript
'BootScene'           // Initial setup
'PreloaderScene'      // Asset loading
'MainMenuScene'       // Main menu
'WorldSelectScene'    // World selection
'LevelSelectScene'    // Level selection
'GameplayScene'       // Main gameplay
'CharacterScene'      // Loadout
'InventoryScene'      // Weapon selection
'ShopScene'           // Purchases
'LeaderboardScene'    // High scores
'SettingsScene'       // Settings
```

---

## Common Calculations

### Soul Rewards
```typescript
// Monster kills
souls = MONSTER_SOULS[type];  // 5, 8, or 10

// Level completion
levelSouls = 50 + (world * 20);

// Boss defeat
bossSouls = 100 + (world * 50);

// Star bonus
finalSouls = baseSouls * STAR_BONUS[stars];  // 1.0, 1.15, or 1.25
```

### Upgrade Costs
```typescript
cost = baseCost * (costMultiplier ^ currentTier);
```

### Player Stats (from upgrades)
```typescript
slashWidth = 1.0 + (tier * 0.08);      // max 1.40
startingLives = 3 + tier;               // max 8
scoreMultiplier = 1.0 + (tier * 0.1);   // max 1.50
slowMoDuration = 5.0 + (tier * 0.5);    // max 7.5s
critChance = tier * 0.05;               // max 25%
```

---

## Monster Spawn Trajectory

```typescript
// Random X along bottom
const x = Phaser.Math.Between(100, width - 100);
const y = height + 50;

// Target peak height
const peakY = Phaser.Math.Between(100, 300);

// Calculate velocity for arc
const gravity = 800;
const velocityY = -Math.sqrt(2 * gravity * (y - peakY));
const timeToPeak = -velocityY / gravity;
const velocityX = (targetX - x) / timeToPeak;
```

---

## Line-Circle Collision (Slash Detection)

```typescript
function lineIntersectsCircle(
  p1: Vector2,  // line start
  p2: Vector2,  // line end
  c: Vector2,   // circle center
  r: number     // circle radius
): boolean {
  const d = { x: p2.x - p1.x, y: p2.y - p1.y };
  const f = { x: p1.x - c.x, y: p1.y - c.y };
  
  const a = d.x * d.x + d.y * d.y;
  const b = 2 * (f.x * d.x + f.y * d.y);
  const c = f.x * f.x + f.y * f.y - r * r;
  
  const disc = b * b - 4 * a * c;
  if (disc < 0) return false;
  
  const sqrtDisc = Math.sqrt(disc);
  const t1 = (-b - sqrtDisc) / (2 * a);
  const t2 = (-b + sqrtDisc) / (2 * a);
  
  return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
}
```

---

## Colors (Hex)

```
Primary:    #8b0000 (dark red)
Secondary:  #4a0080 (dark purple)
Accent:     #ffd700 (gold)
Background: #1a1a2e (dark blue-gray)
Danger:     #ff4444
Success:    #44ff44
```

## Weapon Trail Colors

```
Basic Sword:      #ffffff / #aaaaaa
Silver Blade:     #c0c0c0 / #e8e8e8
Holy Cross Blade: #ffd700 / #ffec8b
Fire Sword:       #ff4500 / #ff6347
Ice Blade:        #00bfff / #87ceeb
Lightning Katana: #9932cc / #da70d6
```

---

## Checklist: Starting a New Feature

- [ ] Check `types.ts` for relevant interfaces
- [ ] Check `constants.ts` for magic numbers
- [ ] Check relevant JSON data file
- [ ] Use event emitter for cross-system communication
- [ ] Add to save data if persistent
- [ ] Test on both mouse and touch
