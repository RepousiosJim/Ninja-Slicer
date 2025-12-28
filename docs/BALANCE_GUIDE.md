# Monster Slayer - Balance Verification Guide

This document helps verify that the game economy and difficulty are balanced correctly.

---

## Economy Verification

### Soul Earning Rate (Per Level)

#### World 1 - Graveyard (Easy)

| Level | Duration | Est. Monsters | Souls from Kills | Completion Bonus | Total Est. |
|-------|----------|---------------|------------------|------------------|------------|
| 1-1 | 45s | ~25 | ~150 | 70 | **~220** |
| 1-2 | 50s | ~30 | ~180 | 70 | **~250** |
| 1-3 | 55s | ~35 | ~200 | 70 | **~270** |
| 1-4 | 60s | ~40 | ~230 | 70 | **~300** |
| 1-5 (Boss) | 90s | ~25 + Boss | ~200 | 150 | **~350** |

**World 1 Total: ~1,390 souls**

#### Cumulative Souls by World Completion

| After World | Cumulative Souls | Can Afford |
|-------------|------------------|------------|
| World 1 | ~1,400 | 1 special weapon OR ~5 upgrade tiers |
| World 2 | ~3,500 | 2 special weapons + several upgrades |
| World 3 | ~6,500 | Most weapons + half upgrades |
| World 4 | ~10,500 | All weapons Tier 2 + most upgrades |
| World 5 | ~15,000+ | Nearly everything maxed |

---

### Soul Costs Summary

| Category | Min Cost | Max Cost | Total to Max |
|----------|----------|----------|--------------|
| **Weapons** | 300 | 800 | ~5,500 |
| **Weapon Upgrades** | 200 | 1,500 | ~8,400 |
| **Character Upgrades** | 100 | 2,400 | ~14,800 |

**Total to 100% completion: ~28,700 souls**

This means:
- First playthrough (~15,000 souls) gets you to ~50% completion
- Replaying levels or endless mode fills the gap
- This encourages replayability without feeling grindy

---

## Difficulty Verification

### Expected Player Power Per World

| World | Expected Weapon | Expected Upgrade Tiers | Effective Power |
|-------|-----------------|------------------------|-----------------|
| 1 | Basic T1 | 0-2 | 1.0x baseline |
| 2 | Basic T2 or Special T1 | 3-5 | 1.1-1.2x |
| 3 | Special T1-T2 | 6-8 | 1.3-1.4x |
| 4 | Special T2 | 9-12 | 1.5-1.6x |
| 5 | Special T2-T3 | 13-16 | 1.7-2.0x |

### Difficulty Scaling Verification

Check these ratios feel correct:

| World | Spawn Rate | Monster Speed | Monster HP | Villager % |
|-------|------------|---------------|------------|------------|
| 1 | 1.0x | 1.0x | 1 HP | 0-6% |
| 2 | 1.2-1.5x | 1.05-1.1x | 1 HP | 8-11% |
| 3 | 1.4-1.7x | 1.1-1.15x | 1-2 HP | 8-10% |
| 4 | 1.5-1.8x | 1.15-1.2x | 2 HP | 8-10% |
| 5 | 1.7-2.0x | 1.2-1.25x | 2 HP | 8-10% |

**Rule of Thumb:** If player has expected gear, they should:
- Win easily with 3 stars: 1 world behind in difficulty
- Win comfortably with 2-3 stars: Appropriate gear
- Struggle to win with 1 star: 1 world ahead in difficulty

---

## Playtest Checklist

### First Playthrough Test

Play the entire campaign without replaying levels:

- [ ] World 1 feels like a tutorial (easy)
- [ ] World 2 introduces challenge but is manageable
- [ ] World 3 requires attention and some upgrades
- [ ] World 4 is challenging but fair
- [ ] World 5 feels climactic and difficult
- [ ] Never felt stuck due to lack of souls
- [ ] Never felt overpowered with too many souls
- [ ] Bosses feel like proper challenges

### Economy Test

- [ ] After World 1, can afford first special weapon
- [ ] After World 3, have meaningful choices (save or spend?)
- [ ] After World 5, still have goals to work toward
- [ ] Endless mode feels rewarding for soul farming

### Difficulty Test (Per Level)

For each level, verify:
- [ ] Kill quota is achievable within time limit
- [ ] Star thresholds feel correct (1-star = barely made it, 3-star = mastered it)
- [ ] Villager frequency doesn't feel unfair
- [ ] Power-ups appear at reasonable intervals

---

## Balance Adjustment Guide

### If Players Are Struggling

**Too hard to survive:**
- Decrease `spawnRate` in level config
- Decrease `monsterSpeed` multiplier
- Increase power-up frequency

**Too hard to hit kill quota:**
- Decrease `minKills` requirement
- Increase level `duration`

**Running out of lives:**
- Reduce missed-monster penalty
- Add more shield power-ups

### If Players Breeze Through

**Too easy:**
- Increase `spawnRate`
- Increase `villagerChance`
- Decrease power-up frequency

**Too many souls:**
- Reduce monster soul drops
- Increase upgrade costs
- Reduce completion bonuses

### If Economy Feels Off

**Can't afford anything:**
- Increase soul drops
- Reduce weapon/upgrade costs
- Add bonus soul opportunities

**Everything maxed too soon:**
- Increase costs
- Add more upgrade tiers
- Add prestige system or cosmetics

---

## Quick Formulas Reference

### Difficulty Calculation
```
baseDifficulty = (world × 1.5) + (level × 0.3) + (isBoss ? 2 : 0)
spawnRate = baseRate × (1 + difficulty × 0.15)
speedMultiplier = 1 + (difficulty × 0.04)
```

### Soul Rewards
```
zombieKill = 5 souls
vampireKill = 8 souls
ghostKill = 10 souls
levelComplete = 50 + (world × 20) souls
bossDefeat = 100 + (world × 50) souls
starBonus = baseSouls × (1.0 / 1.15 / 1.25)
```

### Upgrade Costs
```
cost = baseCost × (costMultiplier ^ currentTier)
```

### Combo Multiplier
```
scoreMultiplier = 1 + (comboCount × 0.1)
```

---

## Endless Mode Balance

### Score Thresholds (Difficulty Steps)

| Score | Difficulty | What Changes |
|-------|------------|--------------|
| 0-999 | 1 | Baseline |
| 1000-1999 | 2 | +10% spawn, +5% speed |
| 2000-2999 | 3 | +20% spawn, +10% speed |
| 3000-3999 | 4 | +30% spawn, +15% speed, 1-2 HP |
| 4000-4999 | 5 | +40% spawn, +20% speed |
| 5000+ | 6+ | Continues scaling... |

### Target Metrics

| Skill Level | Target Score | Time Survived |
|-------------|--------------|---------------|
| Beginner | 500-1500 | 1-2 minutes |
| Intermediate | 2000-5000 | 3-5 minutes |
| Advanced | 5000-10000 | 6-10 minutes |
| Expert | 10000+ | 10+ minutes |

If playtesters consistently fall outside these ranges, adjust endless scaling.

---

## Version History

| Version | Changes |
|---------|---------|
| 1.0 | Initial balance values |

*Update this document as you tune the game during development.*
