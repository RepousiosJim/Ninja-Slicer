# Monster Slayer - MVP-First Development Plan

## Philosophy

This plan follows an **MVP-first iterative approach**:
1. Build the smallest playable version that validates the core loop
2. Playtest and confirm the slashing feels satisfying
3. Layer features incrementally, each building on proven foundations
4. Every phase ends with a playable build

---

## Phase Overview

| Phase | Name | Goal | Deliverable |
|-------|------|------|-------------|
| 0 | Project Setup | Development environment ready | Empty running Phaser game |
| 1 | MVP Core | Validate slashing mechanic | Playable slash prototype |
| 2 | Core Loop | Complete basic gameplay | Full game loop (no progression) |
| 3 | Progression | RPG systems working | Weapons, upgrades, saves |
| 4 | Campaign | Level-based content | 25 levels + 5 bosses playable |
| 5 | Menus & UI | Full navigation | All screens functional |
| 6 | Endless & Online | Competitive mode | Leaderboards working |
| 7 | Polish & Launch | Production ready | Shippable game |

---

## Phase 0: Project Setup

**Goal:** Development environment configured and empty Phaser game running

**Duration:** 1-2 days

### Tasks

#### 0.1 Initialize Project
- [ ] 0.1.1 Create project directory structure
- [ ] 0.1.2 Initialize npm project (`npm init`)
- [ ] 0.1.3 Install dependencies:
  - [ ] `phaser` (game framework)
  - [ ] `typescript` (language)
  - [ ] `vite` (build tool)
  - [ ] `@types/node` (type definitions)
- [ ] 0.1.4 Configure TypeScript (`tsconfig.json`)
- [ ] 0.1.5 Configure Vite (`vite.config.ts`)
- [ ] 0.1.6 Create index.html with game container
- [ ] 0.1.7 Create main.ts entry point

#### 0.2 Phaser Configuration
- [ ] 0.2.1 Create game config with:
  - [ ] Canvas renderer with WebGL fallback
  - [ ] Base resolution 1280x720
  - [ ] Scale mode FIT with center alignment
  - [ ] Physics: Arcade (for simple movement)
  - [ ] Transparent background initially
- [ ] 0.2.2 Create BootScene (minimal, loads nothing)
- [ ] 0.2.3 Verify game canvas renders

#### 0.3 Project Structure
- [ ] 0.3.1 Create folder structure:
  ```
  src/
    scenes/
    entities/
    systems/
    managers/
    ui/
    config/
    utils/
    data/
  public/
    assets/
      sprites/
      audio/
      backgrounds/
  ```
- [ ] 0.3.2 Create placeholder files for core modules
- [ ] 0.3.3 Set up path aliases in tsconfig

#### 0.4 Development Workflow
- [ ] 0.4.1 Configure hot reload with Vite
- [ ] 0.4.2 Add npm scripts:
  - [ ] `dev` - development server
  - [ ] `build` - production build
  - [ ] `preview` - preview production build
- [ ] 0.4.3 Test build process works
- [ ] 0.4.4 (Optional) Set up Git repository

**✓ Phase 0 Complete When:** Browser shows empty Phaser game canvas, hot reload works

---

## Phase 1: MVP Core

**Goal:** Validate that slashing monsters feels satisfying

**Duration:** 3-5 days

**Scope:** Single scene, one monster type, slash mechanic, score display. NO menus, NO progression, NO saves.

### Tasks

#### 1.1 Slash Trail System
- [ ] 1.1.1 Create SlashTrail entity class
- [ ] 1.1.2 Track mouse/touch position each frame
- [ ] 1.1.3 Calculate velocity between frames
- [ ] 1.1.4 Define velocity threshold for "active slash"
- [ ] 1.1.5 Store slash points when velocity exceeds threshold
- [ ] 1.1.6 Render slash trail as line/graphics:
  - [ ] Glowing effect (outer glow + inner bright line)
  - [ ] Trail fades over time (reduce alpha of older points)
  - [ ] Trail has maximum length (remove oldest points)
- [ ] 1.1.7 Clear trail when velocity drops below threshold
- [ ] 1.1.8 Test on both mouse and touch input

#### 1.2 Monster Base Class
- [ ] 1.2.1 Create Monster base class extending Phaser.Sprite
- [ ] 1.2.2 Properties:
  - [ ] health (number)
  - [ ] speed (number)
  - [ ] points (number)
  - [ ] isSliced (boolean)
- [ ] 1.2.3 Methods:
  - [ ] spawn(x, y, velocityX, velocityY)
  - [ ] update() - apply gravity, check bounds
  - [ ] slice() - trigger death
  - [ ] onSliced() - override in subclasses
- [ ] 1.2.4 Gravity simulation (parabolic arc motion)
- [ ] 1.2.5 Destroy when falling below screen

#### 1.3 Zombie Implementation
- [ ] 1.3.1 Create Zombie class extending Monster
- [ ] 1.3.2 Use placeholder sprite (colored rectangle for now)
- [ ] 1.3.3 Set zombie-specific stats:
  - [ ] health: 1
  - [ ] speed: slow
  - [ ] points: 10
- [ ] 1.3.4 Implement onSliced():
  - [ ] Split into two halves
  - [ ] Each half falls with physics
  - [ ] Destroy halves when off-screen

#### 1.4 Spawn System (Basic)
- [ ] 1.4.1 Create SpawnSystem class
- [ ] 1.4.2 Spawn timer (configurable interval)
- [ ] 1.4.3 Random spawn position along bottom edge
- [ ] 1.4.4 Calculate launch velocity:
  - [ ] Upward velocity (randomized within range)
  - [ ] Horizontal velocity toward center (slight randomization)
- [ ] 1.4.5 Spawn monster with calculated trajectory
- [ ] 1.4.6 Track active monsters in array

#### 1.5 Slash Detection
- [ ] 1.5.1 Create SlashSystem class
- [ ] 1.5.2 Each frame when slash is active:
  - [ ] Get slash line segment (current point to previous point)
  - [ ] For each active monster:
    - [ ] Check line-circle intersection (monster hitbox)
    - [ ] If intersecting and monster not already sliced:
      - [ ] Call monster.slice()
      - [ ] Increment score
- [ ] 1.5.3 Implement line-circle intersection math
- [ ] 1.5.4 Visual feedback on hit (screen flash or particle)

#### 1.6 Basic Score Display
- [ ] 1.6.1 Create score variable in GameplayScene
- [ ] 1.6.2 Create Phaser.Text for score display
- [ ] 1.6.3 Position in top-left corner
- [ ] 1.6.4 Update text when score changes
- [ ] 1.6.5 Style: large, readable pixel font (or system font for now)

#### 1.7 MVP Game Scene
- [ ] 1.7.1 Create GameplayScene
- [ ] 1.7.2 Initialize systems:
  - [ ] SlashTrail
  - [ ] SpawnSystem
  - [ ] SlashSystem
- [ ] 1.7.3 Game loop:
  - [ ] Spawn monsters on timer
  - [ ] Update all monsters (physics)
  - [ ] Track slash input
  - [ ] Check slash collisions
  - [ ] Update score
- [ ] 1.7.4 Temporary: restart scene on key press

#### 1.8 MVP Polish & Validation
- [ ] 1.8.1 Tune slash velocity threshold (feels responsive but not too sensitive)
- [ ] 1.8.2 Tune spawn rate (not overwhelming, not boring)
- [ ] 1.8.3 Tune monster launch velocities (satisfying arcs)
- [ ] 1.8.4 Tune slash trail visuals (length, fade, glow)
- [ ] 1.8.5 **VALIDATION:** Play for 5+ minutes. Is it fun? Does slicing feel good?

**✓ Phase 1 Complete When:** Slicing zombies feels satisfying and the core mechanic is validated

---

## Phase 2: Core Loop

**Goal:** Complete gameplay loop with all monsters, villagers, lives, combos, power-ups

**Duration:** 5-7 days

### Tasks

#### 2.1 Additional Monsters

##### 2.1.1 Vampire
- [ ] Create Vampire class extending Monster
- [ ] Fast movement speed
- [ ] Implement direction change mid-flight (random chance)
- [ ] onSliced(): burst into bat particles that scatter
- [ ] Placeholder sprite (different color rectangle)

##### 2.1.2 Ghost
- [ ] Create Ghost class extending Monster
- [ ] Medium speed
- [ ] Visibility system:
  - [ ] visibilityTimer cycles between visible/invisible
  - [ ] visible for 2 seconds, invisible for 1 second
  - [ ] alpha fades during transitions
- [ ] Can only be sliced when visible (alpha > 0.5)
- [ ] onSliced(): dissolve into mist particles
- [ ] Placeholder sprite (different color rectangle)

#### 2.2 Villager System
- [ ] 2.2.1 Create Villager class (similar to Monster but different behavior)
- [ ] 2.2.2 Distinct visual silhouette (must be recognizable instantly)
- [ ] 2.2.3 Slower movement than monsters
- [ ] 2.2.4 onSliced():
  - [ ] Trigger penalty (score deduction)
  - [ ] Distinct sound/visual feedback (negative)
  - [ ] Does NOT count as "missed"
- [ ] 2.2.5 Add villager spawn chance to SpawnSystem
- [ ] 2.2.6 Villagers that exit screen safely = no penalty

#### 2.3 Lives System
- [ ] 2.3.1 Add lives variable (start with 3)
- [ ] 2.3.2 Create lives display (heart icons or number)
- [ ] 2.3.3 Lose life conditions:
  - [ ] Monster exits bottom of screen without being sliced
  - [ ] (NOT villager slicing - that's just points)
- [ ] 2.3.4 Track "missed" monsters
- [ ] 2.3.5 Game over when lives reach 0
- [ ] 2.3.6 Visual feedback when losing life (screen shake, heart breaks)

#### 2.4 Combo System
- [ ] 2.4.1 Create ComboSystem class
- [ ] 2.4.2 Track current combo count
- [ ] 2.4.3 Combo timer (resets combo if no slice within X seconds)
- [ ] 2.4.4 Increment combo on each slice
- [ ] 2.4.5 Combo multiplier formula:
  ```
  multiplier = 1 + (combo / 10)  // +0.1x per combo
  ```
- [ ] 2.4.6 Apply multiplier to score earned
- [ ] 2.4.7 Combo display:
  - [ ] Show current combo count
  - [ ] Grows larger at milestones (5, 10, 15...)
  - [ ] Shakes/pulses on increment
- [ ] 2.4.8 Visual feedback on combo break

#### 2.5 Power-Up System

##### 2.5.1 Power-Up Base
- [ ] Create PowerUp base class
- [ ] Spawns like monsters (launches from bottom)
- [ ] Distinct visual (glowing, floating)
- [ ] When sliced: activate effect, don't award points
- [ ] Power-up spawn timer (every 15-20 seconds)

##### 2.5.2 Slow Motion Power-Up
- [ ] Create SlowMotionPowerUp class
- [ ] On activate:
  - [ ] Set game time scale to 0.5
  - [ ] Duration: 5 seconds
  - [ ] Visual filter (blue tint or motion blur)
  - [ ] Revert after duration

##### 2.5.3 Frenzy Power-Up
- [ ] Create FrenzyPowerUp class
- [ ] On activate:
  - [ ] Double all points earned
  - [ ] Duration: 8 seconds
  - [ ] Visual feedback (screen border glow, "2X" indicator)

##### 2.5.4 Shield Power-Up
- [ ] Create ShieldPowerUp class
- [ ] On activate:
  - [ ] Set shield active flag
  - [ ] Next villager slice has no penalty
  - [ ] Consumed on use OR after 30 seconds
  - [ ] Shield icon indicator while active

##### 2.5.5 Soul Magnet Power-Up
- [ ] Create SoulMagnetPowerUp class
- [ ] On activate:
  - [ ] +50% souls earned
  - [ ] Duration: 10 seconds
  - [ ] Purple glow effect on soul pickups

#### 2.6 Souls Currency
- [ ] 2.6.1 Add souls variable (separate from score)
- [ ] 2.6.2 Monsters drop souls on death:
  - [ ] Zombie: 5 souls
  - [ ] Vampire: 8 souls
  - [ ] Ghost: 10 souls
- [ ] 2.6.3 Souls display in HUD (top-right)
- [ ] 2.6.4 (Later: souls persist between sessions via save)

#### 2.7 Game Over Flow
- [ ] 2.7.1 Detect lives = 0
- [ ] 2.7.2 Stop spawning, let remaining monsters fall
- [ ] 2.7.3 Dramatic pause
- [ ] 2.7.4 Show game over overlay:
  - [ ] "Game Over" text
  - [ ] Final score
  - [ ] Souls earned
  - [ ] Retry button (restarts scene)
- [ ] 2.7.5 Retry resets all state

#### 2.8 Spawn Balancing
- [ ] 2.8.1 Implement monster variety weights
- [ ] 2.8.2 Time-based difficulty increase:
  - [ ] Spawn rate increases over time
  - [ ] Monster variety shifts (more vampires/ghosts later)
- [ ] 2.8.3 Villager frequency scaling
- [ ] 2.8.4 Tuning: play and adjust values

**✓ Phase 2 Complete When:** Full game loop works - can play indefinitely, game ends properly, all monster types and power-ups functional

---

## Phase 3: Progression Systems

**Goal:** Weapons, upgrades, save system, character loadout

**Duration:** 5-7 days

### Tasks

#### 3.1 Data Architecture
- [ ] 3.1.1 Create weapons.json with all weapon data
- [ ] 3.1.2 Create upgrades.json with all upgrade data
- [ ] 3.1.3 Create TypeScript interfaces for all data types
- [ ] 3.1.4 Create data loader utility

#### 3.2 Weapon System

##### 3.2.1 Weapon Manager
- [ ] Create WeaponManager class
- [ ] Load weapon definitions from JSON
- [ ] Track unlocked weapons
- [ ] Track weapon upgrade tiers
- [ ] Get currently equipped weapon
- [ ] Method: applyWeaponEffects(slashEvent)

##### 3.2.2 Weapon Effects Implementation
- [ ] Basic Sword: no special effect
- [ ] Silver Blade: bonus damage to vampires
  - [ ] Check monster type on hit
  - [ ] Apply damage multiplier
- [ ] Holy Cross Blade: ghosts visible longer
  - [ ] Modify ghost visibility timer when equipped
- [ ] Fire Sword: burn damage over time
  - [ ] Apply DOT on hit
  - [ ] Visual: monster burns
- [ ] Ice Blade: slow effect
  - [ ] Reduce monster speed on hit
  - [ ] Visual: frost effect
- [ ] Lightning Katana: chain damage
  - [ ] On hit, find nearby monsters
  - [ ] Apply damage to chained targets
  - [ ] Visual: lightning arc

##### 3.2.3 Slash Trail Per Weapon
- [ ] Each weapon has unique trail color/style
- [ ] Update SlashTrail to use equipped weapon's style

#### 3.3 Upgrade System

##### 3.3.1 Upgrade Manager
- [ ] Create UpgradeManager class
- [ ] Load upgrade definitions from JSON
- [ ] Track upgrade tiers for each upgrade
- [ ] Calculate current bonuses
- [ ] Method: getUpgradeValue(upgradeId)

##### 3.3.2 Apply Upgrades to Gameplay
- [ ] Slash Width:
  - [ ] Modify slash hitbox radius
- [ ] Extra Lives:
  - [ ] Modify starting lives
- [ ] Score Multiplier:
  - [ ] Apply to all score gains
- [ ] Slow Motion Duration:
  - [ ] Modify power-up duration
- [ ] Critical Hit Chance:
  - [ ] Roll on each hit
  - [ ] Crits deal bonus damage + bonus points

#### 3.4 Save System

##### 3.4.1 Save Manager
- [ ] Create SaveManager class
- [ ] Define save data structure (GameSave interface)
- [ ] Methods:
  - [ ] save(): serialize to JSON, store in localStorage
  - [ ] load(): read from localStorage, deserialize
  - [ ] reset(): clear save data
  - [ ] exists(): check if save exists

##### 3.4.2 Save Data Contents
- [ ] souls (number)
- [ ] unlockedWeapons (string[])
- [ ] weaponTiers (Record<string, number>)
- [ ] equippedWeapon (string)
- [ ] upgrades (Record<string, number>)
- [ ] completedLevels (string[])
- [ ] settings (GameSettings)
- [ ] personalBests (ScoreEntry[])
- [ ] version (number) - for migrations

##### 3.4.3 Auto-Save Triggers
- [ ] After level complete
- [ ] After purchase
- [ ] After equip change
- [ ] On game close (beforeunload event)

##### 3.4.4 Save Validation
- [ ] Validate loaded data against schema
- [ ] Handle corrupted saves gracefully
- [ ] Migration system for version changes

#### 3.5 Shop System (Logic Only)
- [ ] 3.5.1 Create ShopManager class
- [ ] 3.5.2 Method: canAfford(itemId, type)
- [ ] 3.5.3 Method: purchase(itemId, type)
  - [ ] Deduct souls
  - [ ] Unlock weapon or increment upgrade tier
  - [ ] Trigger save
- [ ] 3.5.4 Method: getPrice(itemId, type, currentTier)
- [ ] 3.5.5 Weapon tier upgrade cost calculation
- [ ] 3.5.6 Upgrade tier cost calculation (exponential formula)

#### 3.6 Character Loadout (Logic Only)
- [ ] 3.6.1 Method: equipWeapon(weaponId)
  - [ ] Validate weapon is unlocked
  - [ ] Update equipped weapon
  - [ ] Trigger save
- [ ] 3.6.2 Method: getEquippedWeapon()
- [ ] 3.6.3 Method: getPlayerStats() - computed from upgrades

**✓ Phase 3 Complete When:** Can unlock weapons, buy upgrades, equip weapons, and progress persists after browser refresh

---

## Phase 4: Campaign Structure

**Goal:** 25 levels across 5 worlds with boss fights

**Duration:** 7-10 days

### Tasks

#### 4.1 Level Configuration System
- [ ] 4.1.1 Create levels.json with all 25 level configs
- [ ] 4.1.2 LevelConfig interface:
  - [ ] id, world, level
  - [ ] duration
  - [ ] minKills
  - [ ] spawnRate
  - [ ] monsterWeights
  - [ ] villagerChance
  - [ ] powerUpInterval
  - [ ] isBoss
  - [ ] bossId (if applicable)
- [ ] 4.1.3 Create LevelManager class
- [ ] 4.1.4 Method: getLevelConfig(worldNum, levelNum)
- [ ] 4.1.5 Method: isLevelUnlocked(worldNum, levelNum)
- [ ] 4.1.6 Method: completeLevel(worldNum, levelNum, score, stars)

#### 4.2 Level Gameplay Modifications
- [ ] 4.2.1 Load level config on scene start
- [ ] 4.2.2 Apply spawn rate from config
- [ ] 4.2.3 Apply monster weights from config
- [ ] 4.2.4 Add level timer (countdown)
- [ ] 4.2.5 Track kills toward quota
- [ ] 4.2.6 Win condition: survive duration AND meet kill quota
- [ ] 4.2.7 Fail condition: lose all lives (regardless of timer)

#### 4.3 Star Rating System
- [ ] 4.3.1 Calculate stars based on score thresholds
- [ ] 4.3.2 Each level defines 1-star, 2-star, 3-star thresholds
- [ ] 4.3.3 Store best star rating per level in save
- [ ] 4.3.4 Display stars on level complete

#### 4.4 World Backgrounds
- [ ] 4.4.1 Create/source 5 background images:
  - [ ] Graveyard (tombstones, dead trees, fog)
  - [ ] Haunted Village (broken houses, lamps)
  - [ ] Vampire Castle (gothic interior)
  - [ ] Ghost Realm (ethereal, floating)
  - [ ] Hell Dimension (fire, brimstone)
- [ ] 4.4.2 Load appropriate background per world
- [ ] 4.4.3 (Optional) Parallax scrolling layers

#### 4.5 World-Specific Spawn Patterns
- [ ] 4.5.1 Default: launch from bottom
- [ ] 4.5.2 Ghost Realm: ghosts float from top
- [ ] 4.5.3 Vampire Castle: vampires can enter from sides
- [ ] 4.5.4 SpawnSystem reads current world and adjusts

#### 4.6 Boss System

##### 4.6.1 Boss Base Class
- [ ] Create Boss class
- [ ] Large health pool
- [ ] Health bar display
- [ ] Phase transitions at health thresholds
- [ ] Minion spawning logic
- [ ] Attack patterns (telegraphed)
- [ ] Vulnerable windows

##### 4.6.2 Grave Titan (World 1 Boss)
- [ ] Large zombie appearance
- [ ] Attack: slow swipe across screen
- [ ] Spawns zombie minions
- [ ] Phases: faster attacks at lower health

##### 4.6.3 Headless Horseman (World 2 Boss)
- [ ] Rides across screen
- [ ] Attack: throws head (must slice to deflect)
- [ ] Spawns zombies and vampires
- [ ] Phases: charges more frequently

##### 4.6.4 Vampire Lord (World 3 Boss)
- [ ] Teleports around screen
- [ ] Attack: bat projectile waves
- [ ] Spawns vampires and ghosts
- [ ] Phases: more teleports, faster bats

##### 4.6.5 Phantom King (World 4 Boss)
- [ ] Phases in and out of visibility
- [ ] Creates clone decoys (slice wrong one = damage?)
- [ ] Spawns ghosts
- [ ] Phases: more clones, shorter visibility

##### 4.6.6 Demon Overlord (World 5 Boss)
- [ ] Multi-phase final boss
- [ ] Combines attack patterns from previous bosses
- [ ] Spawns all monster types
- [ ] Epic finale

#### 4.7 Level Complete Flow
- [ ] 4.7.1 Stop spawning when timer ends
- [ ] 4.7.2 Clear remaining monsters
- [ ] 4.7.3 Calculate final score and stars
- [ ] 4.7.4 Award souls (base + bonus for stars)
- [ ] 4.7.5 Unlock next level
- [ ] 4.7.6 Save progress
- [ ] 4.7.7 Display level complete screen

**✓ Phase 4 Complete When:** Can play through all 25 levels and 5 bosses, progress saves correctly

---

## Phase 5: Menus & UI

**Goal:** Full menu navigation and polished UI

**Duration:** 5-7 days

### Tasks

#### 5.1 UI Framework
- [ ] 5.1.1 Create Button class:
  - [ ] Normal, hover, pressed states
  - [ ] Click callback
  - [ ] Touch support
  - [ ] Sound on click
- [ ] 5.1.2 Create Panel class (background frames)
- [ ] 5.1.3 Create Card class (for weapons, levels)
- [ ] 5.1.4 Define consistent color palette
- [ ] 5.1.5 Define consistent typography

#### 5.2 Main Menu Scene
- [ ] 5.2.1 Game logo (animated entrance)
- [ ] 5.2.2 Play button → World Select
- [ ] 5.2.3 Endless button → Endless Gameplay
- [ ] 5.2.4 Character button → Character Scene
- [ ] 5.2.5 Shop button → Shop Scene
- [ ] 5.2.6 Leaderboard button → Leaderboard Scene
- [ ] 5.2.7 Settings button → Settings Scene
- [ ] 5.2.8 Souls display (current balance)
- [ ] 5.2.9 Background ambiance

#### 5.3 World Select Scene
- [ ] 5.3.1 5 world cards displayed
- [ ] 5.3.2 Locked worlds show lock + "Coming Soon" for 6+
- [ ] 5.3.3 Completion percentage per world
- [ ] 5.3.4 Tap world → Level Select
- [ ] 5.3.5 Back button → Main Menu

#### 5.4 Level Select Scene
- [ ] 5.4.1 Single card showing current level
- [ ] 5.4.2 Left/Right navigation arrows
- [ ] 5.4.3 Level number display
- [ ] 5.4.4 Star rating for completed levels
- [ ] 5.4.5 Lock icon for locked levels
- [ ] 5.4.6 "Boss" indicator for level 5s
- [ ] 5.4.7 Play button → Gameplay Scene
- [ ] 5.4.8 Back button → World Select

#### 5.5 Character/Loadout Scene
- [ ] 5.5.1 Character display area
- [ ] 5.5.2 Equipped weapon display (large)
- [ ] 5.5.3 Weapon stats display
- [ ] 5.5.4 "Change Weapon" button → Inventory popup/scene
- [ ] 5.5.5 Player stats summary (from upgrades)
- [ ] 5.5.6 Back button → Main Menu

#### 5.6 Inventory Scene/Popup
- [ ] 5.6.1 Grid of weapon cards
- [ ] 5.6.2 Unlocked weapons show full art
- [ ] 5.6.3 Locked weapons show silhouette
- [ ] 5.6.4 Currently equipped highlighted
- [ ] 5.6.5 Tap to select → confirm equip
- [ ] 5.6.6 Close/back button

#### 5.7 Shop Scene
- [ ] 5.7.1 Tab navigation: Weapons / Upgrades
- [ ] 5.7.2 Current souls display (prominent)

##### 5.7.3 Weapons Tab
- [ ] List of weapon cards
- [ ] Each shows: name, current tier, effect preview
- [ ] Buy button (if not owned)
- [ ] Upgrade button (if owned, not max tier)
- [ ] Price display
- [ ] Grayed out if can't afford

##### 5.7.4 Upgrades Tab
- [ ] List of upgrade rows
- [ ] Each shows: name, current tier, effect
- [ ] Progress bar (current tier / max tier)
- [ ] Upgrade button with price
- [ ] Grayed out if can't afford or maxed

- [ ] 5.7.5 Purchase confirmation popup
- [ ] 5.7.6 Purchase success feedback
- [ ] 5.7.7 Back button → Main Menu

#### 5.8 Settings Scene
- [ ] 5.8.1 Sound toggle (on/off)
- [ ] 5.8.2 Music toggle (on/off)
- [ ] 5.8.3 Cloud save section:
  - [ ] Login button (if not logged in)
  - [ ] Account info + Logout (if logged in)
  - [ ] Sync status
- [ ] 5.8.4 Clear data button (with confirmation)
- [ ] 5.8.5 Credits button/section
- [ ] 5.8.6 Back button → Main Menu

#### 5.9 Pause Menu (Overlay)
- [ ] 5.9.1 Pause button in gameplay HUD
- [ ] 5.9.2 Pause overlay:
  - [ ] "Paused" title
  - [ ] Resume button
  - [ ] Restart button
  - [ ] Settings button
  - [ ] Quit to Menu button
- [ ] 5.9.3 Game frozen while paused
- [ ] 5.9.4 Dim background

#### 5.10 Level Complete Screen
- [ ] 5.10.1 "Level Complete" or "Victory" header
- [ ] 5.10.2 Score display with breakdown
- [ ] 5.10.3 Star rating (animated reveal)
- [ ] 5.10.4 Souls earned
- [ ] 5.10.5 Next Level button
- [ ] 5.10.6 Replay button
- [ ] 5.10.7 Menu button

#### 5.11 Game Over Screen
- [ ] 5.11.1 "Game Over" header
- [ ] 5.11.2 Final score
- [ ] 5.11.3 Stats: monsters sliced, max combo, time
- [ ] 5.11.4 Souls earned (still awarded)
- [ ] 5.11.5 Retry button
- [ ] 5.11.6 Menu button

#### 5.12 Gameplay HUD
- [ ] 5.12.1 Score display (top-left)
- [ ] 5.12.2 Combo counter (center, animated)
- [ ] 5.12.3 Lives display (top-right, hearts)
- [ ] 5.12.4 Souls collected (top-right, below lives)
- [ ] 5.12.5 Timer/Progress (top-center, campaign only)
- [ ] 5.12.6 Kill quota progress (campaign only)
- [ ] 5.12.7 Pause button (top-right corner)
- [ ] 5.12.8 Boss health bar (boss fights only)
- [ ] 5.12.9 Power-up active indicators

**✓ Phase 5 Complete When:** Can navigate all menus, UI is responsive and intuitive

---

## Phase 6: Endless Mode & Online

**Goal:** Competitive endless mode with online leaderboards

**Duration:** 4-6 days

### Tasks

#### 6.1 Endless Mode Gameplay
- [ ] 6.1.1 No timer, no kill quota
- [ ] 6.1.2 Continuous spawning until death
- [ ] 6.1.3 Score-based difficulty scaling:
  - [ ] Every 1000 points, increase difficulty
  - [ ] Spawn rate multiplier increases
  - [ ] Monster speed multiplier increases
  - [ ] Monster health increases at thresholds
  - [ ] Villager frequency increases (caps at 10%)
- [ ] 6.1.4 All player upgrades and weapons apply
- [ ] 6.1.5 Track session stats:
  - [ ] Total monsters sliced
  - [ ] Max combo achieved
  - [ ] Time survived
  - [ ] Accuracy (hits / slashes)

#### 6.2 Supabase Integration

##### 6.2.1 Setup
- [ ] Create Supabase project
- [ ] Define database schema:
  - [ ] `leaderboard` table: id, player_name, score, weapon_used, created_at
  - [ ] `users` table (for cloud saves): id, email, save_data, updated_at
- [ ] Install Supabase JS client
- [ ] Create SupabaseService class
- [ ] Configure environment variables (API keys)

##### 6.2.2 Leaderboard Service
- [ ] Create LeaderboardService class
- [ ] Method: submitScore(name, score, weapon)
- [ ] Method: getGlobalAllTime(limit)
- [ ] Method: getGlobalWeekly(limit)
- [ ] Method: getPersonalBests(userId, limit)
- [ ] Handle offline gracefully (queue and retry)

#### 6.3 Leaderboard Scene
- [ ] 6.3.1 Tab navigation: All-Time / Weekly / Personal
- [ ] 6.3.2 Loading indicator while fetching
- [ ] 6.3.3 Scrollable list of entries
- [ ] 6.3.4 Each entry: rank, name, score, date
- [ ] 6.3.5 Highlight player's own entries
- [ ] 6.3.6 Refresh button
- [ ] 6.3.7 Back button → Main Menu

#### 6.4 Score Submission Flow
- [ ] 6.4.1 On endless game over, check if personal best
- [ ] 6.4.2 Prompt for name (first time only, cache it)
- [ ] 6.4.3 Submit score to Supabase
- [ ] 6.4.4 Show resulting rank
- [ ] 6.4.5 Handle submission errors gracefully

#### 6.5 Cloud Save (Optional Feature)

##### 6.5.1 Authentication
- [ ] Email/password signup
- [ ] Email/password login
- [ ] Logout
- [ ] Anonymous play (no account required)

##### 6.5.2 Save Sync
- [ ] Pull cloud save on login
- [ ] Push save to cloud on significant changes
- [ ] Conflict resolution: prefer higher progress
- [ ] Sync status indicator

##### 6.5.3 UI for Cloud Save
- [ ] Login/Signup form in Settings
- [ ] Account info display when logged in
- [ ] Sync now button
- [ ] Last synced timestamp

**✓ Phase 6 Complete When:** Endless mode playable, scores submit to leaderboard, leaderboard displays correctly

---

## Phase 7: Polish & Launch

**Goal:** Production-ready game with audio, optimization, and final polish

**Duration:** 5-7 days

### Tasks

#### 7.1 Audio Implementation

##### 7.1.1 Audio Manager
- [ ] Create AudioManager class
- [ ] Method: playSFX(soundId)
- [ ] Method: playMusic(trackId)
- [ ] Method: stopMusic()
- [ ] Volume controls
- [ ] Mute toggles (respect settings)

##### 7.1.2 Sound Effects
- [ ] Source or create sounds:
  - [ ] 5 slash variations
  - [ ] Zombie death
  - [ ] Vampire death
  - [ ] Ghost death
  - [ ] Villager scream
  - [ ] Power-up collect
  - [ ] Boss hit
  - [ ] Boss death
  - [ ] UI click
  - [ ] UI hover
  - [ ] Combo milestone
  - [ ] Level complete
  - [ ] Game over
- [ ] Integrate sounds at all trigger points

##### 7.1.3 Music
- [ ] Source or create menu music track
- [ ] Implement looping
- [ ] Fade transitions between scenes

#### 7.2 Visual Polish

##### 7.2.1 Sprite Assets
- [ ] Source or commission pixel art:
  - [ ] 3 monster types (with animations)
  - [ ] 5 bosses (with animations)
  - [ ] Villager variants
  - [ ] 6 weapon icons
  - [ ] 4 power-up icons
  - [ ] UI elements
  - [ ] 5 backgrounds
- [ ] Implement all sprite animations

##### 7.2.2 Particle Effects
- [ ] Monster death particles (per type)
- [ ] Slash impact particles
- [ ] Soul pickup particles
- [ ] Power-up activation effects
- [ ] Boss phase transition effects

##### 7.2.3 Screen Effects
- [ ] Screen shake on big hits
- [ ] Flash on critical hit
- [ ] Slow-mo effect visuals
- [ ] Frenzy mode border glow

#### 7.3 Mobile Optimization
- [ ] 7.3.1 Test on various mobile browsers
- [ ] 7.3.2 Ensure touch input works perfectly
- [ ] 7.3.3 UI elements sized for touch (44px minimum)
- [ ] 7.3.4 Responsive layout adjustments for portrait
- [ ] 7.3.5 Performance testing on lower-end devices
- [ ] 7.3.6 Add "Add to Home Screen" prompt (PWA)
- [ ] 7.3.7 Viewport and meta tags for mobile

#### 7.4 Performance Optimization
- [ ] 7.4.1 Object pooling for monsters
- [ ] 7.4.2 Object pooling for particles
- [ ] 7.4.3 Texture atlases for sprites
- [ ] 7.4.4 Limit max particles on screen
- [ ] 7.4.5 Profile and fix any frame drops
- [ ] 7.4.6 Optimize asset sizes (compress images)
- [ ] 7.4.7 Lazy load non-essential assets

#### 7.5 Bug Fixing
- [ ] 7.5.1 Playtest all 25 levels
- [ ] 7.5.2 Playtest all 5 bosses
- [ ] 7.5.3 Test all weapons and effects
- [ ] 7.5.4 Test all upgrades apply correctly
- [ ] 7.5.5 Test save/load integrity
- [ ] 7.5.6 Test leaderboard edge cases
- [ ] 7.5.7 Fix all identified bugs

#### 7.6 Final Balancing
- [ ] 7.6.1 Playtest full campaign progression
- [ ] 7.6.2 Verify difficulty curve feels fair
- [ ] 7.6.3 Verify economy (souls earning vs. spending)
- [ ] 7.6.4 Adjust any outlier values
- [ ] 7.6.5 Get external playtest feedback if possible

#### 7.7 Launch Preparation
- [ ] 7.7.1 Production build and test
- [ ] 7.7.2 Deploy to hosting (Vercel, Netlify, etc.)
- [ ] 7.7.3 Custom domain (optional)
- [ ] 7.7.4 Favicon and meta tags
- [ ] 7.7.5 Open Graph images for sharing
- [ ] 7.7.6 Final README documentation
- [ ] 7.7.7 Launch! 🎉

**✓ Phase 7 Complete When:** Game is live, polished, and playable by the public

---

## Quick Reference: Estimated Timeline

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 0: Setup | 1-2 days | 2 days |
| Phase 1: MVP | 3-5 days | 1 week |
| Phase 2: Core Loop | 5-7 days | 2 weeks |
| Phase 3: Progression | 5-7 days | 3 weeks |
| Phase 4: Campaign | 7-10 days | 4-5 weeks |
| Phase 5: UI | 5-7 days | 5-6 weeks |
| Phase 6: Online | 4-6 days | 6-7 weeks |
| Phase 7: Polish | 5-7 days | 7-8 weeks |

**Total: ~8 weeks** (assuming focused development)

---

## Notes for Success

1. **Validate Early:** Don't proceed past Phase 1 until slashing feels good
2. **Playtest Often:** Play your own game frequently during development
3. **Cut Scope if Needed:** Better to launch with fewer polished features
4. **Asset Packs:** Look for pixel art packs early to ensure consistency
5. **Commit Often:** Version control saves lives
6. **Take Breaks:** Sustainable pace beats burnout
