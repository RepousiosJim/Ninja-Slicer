# Monster Slayer - Asset Requirements

## Overview

This document lists all visual and audio assets needed for the game. Use this as a shopping list when browsing asset stores or commissioning artists.

**Art Style:** Dark, serious pixel art (16-bit era aesthetic, think Castlevania meets mobile arcade)

**Color Palette Guidance:**
- Primary: Dark reds (#8b0000, #aa0000)
- Secondary: Dark purples (#4a0080, #6a0dad)
- Accent: Gold/Yellow (#ffd700)
- Backgrounds: Dark blue-grays (#1a1a2e, #2a2a4e)
- Flesh tones for villagers: Standard pixel art palette

---

## Sprite Sheets

### Monsters

| Asset | Dimensions | Frames | Animation | Notes |
|-------|------------|--------|-----------|-------|
| **Zombie** | 64x64 px | 8-12 | Idle (4), Walk (4), Death (4) | Green/gray skin, tattered clothes, slow shamble |
| **Vampire** | 64x64 px | 10-14 | Idle (4), Fly (4), Death (4+bats) | Cape, pale skin, fangs, elegant but menacing |
| **Ghost** | 64x64 px | 8-12 | Idle/Float (4), Fade (4), Death (4) | Translucent, wispy tail, glowing eyes |

**Zombie Death:** Should split into 2 halves (need left-half and right-half sprites)
**Vampire Death:** Should burst into 4-6 small bat sprites that scatter
**Ghost Death:** Should dissolve into mist particles

---

### Bosses

| Asset | Dimensions | Frames | Animations | Notes |
|-------|------------|--------|------------|-------|
| **Grave Titan** | 128x128 px | 20+ | Idle (4), Swipe (6), Slam (6), Hurt (2), Death (6) | Giant zombie, massive, rotting, imposing |
| **Headless Horseman** | 128x96 px | 20+ | Ride (6), Charge (4), Throw Head (6), Hurt (2), Death (6) | Horse + rider, flaming neck stump, thrown head projectile |
| **Vampire Lord** | 96x96 px | 24+ | Idle (4), Teleport (4), Bat Wave (6), Hurt (2), Death (6) | Regal vampire, red cape, crown, more detailed than regular vampire |
| **Phantom King** | 96x96 px | 20+ | Idle (4), Phase (4), Clone (4), Hurt (2), Death (6) | Ghostly king, crown, larger ghost with royal garments |
| **Demon Overlord** | 160x160 px | 30+ | Idle (4), Fire Breath (8), Summon (6), Rage (6), Hurt (2), Death (8) | Classic demon lord, horns, wings, fire effects |

**Boss Projectiles:**
- Horseman's head (32x32)
- Vampire bats (16x16, need 4-6 sprites)
- Ghost clones (same as Phantom King, slightly transparent)
- Fire breath effect (64x32, animated)

---

### Villagers

| Asset | Dimensions | Frames | Animation | Notes |
|-------|------------|--------|-----------|-------|
| **Villager Male** | 48x48 px | 4-6 | Idle (2), Panic (4) | Simple peasant clothes, brown/beige |
| **Villager Female** | 48x48 px | 4-6 | Idle (2), Panic (4) | Dress, bonnet or hood |
| **Villager Elder** | 48x48 px | 4-6 | Idle (2), Panic (4) | Gray hair, walking stick, hunched |

**Critical:** Villagers must be INSTANTLY distinguishable from monsters (different silhouette, brighter colors)

---

### Weapons (UI Icons)

| Asset | Dimensions | Notes |
|-------|------------|-------|
| **Basic Sword** | 64x64 px | Simple steel sword |
| **Silver Blade** | 64x64 px | Shiny silver, cross guard |
| **Holy Cross Blade** | 64x64 px | Golden, cross-shaped guard, glowing |
| **Fire Sword** | 64x64 px | Flaming blade, orange/red glow |
| **Ice Blade** | 64x64 px | Crystalline, blue glow, frost particles |
| **Lightning Katana** | 64x64 px | Purple/electric blue, lightning sparks |

---

### Power-Ups

| Asset | Dimensions | Frames | Notes |
|-------|------------|--------|-------|
| **Slow Motion (Hourglass)** | 48x48 px | 4 (glow pulse) | Blue/cyan hourglass |
| **Frenzy (Fire)** | 48x48 px | 4 (flame flicker) | Orange/red flame icon |
| **Shield** | 48x48 px | 4 (shimmer) | Golden shield |
| **Soul Magnet** | 48x48 px | 4 (purple glow) | Purple orb with swirl |

---

### UI Elements

| Asset | Dimensions | Variants | Notes |
|-------|------------|----------|-------|
| **Button** | 200x60 px | Normal, Hover, Pressed, Disabled | Dark red with gold border |
| **Button Small** | 120x50 px | Normal, Hover, Pressed, Disabled | For secondary actions |
| **Panel** | 9-slice | Various sizes | Dark purple with ornate border |
| **Card Frame** | 180x240 px | Normal, Selected, Locked | For weapons/levels |
| **Heart (Life)** | 32x32 px | Full, Empty | Red heart |
| **Star** | 32x32 px | Full, Empty | Gold star for ratings |
| **Soul Icon** | 24x24 px | - | Purple wisp/orb |
| **Lock Icon** | 48x48 px | - | For locked content |
| **Arrow Left** | 48x48 px | Normal, Hover | For navigation |
| **Arrow Right** | 48x48 px | Normal, Hover | For navigation |
| **Pause Icon** | 48x48 px | - | Two vertical bars |
| **Settings Gear** | 48x48 px | - | Cog wheel |
| **Sound On** | 32x32 px | - | Speaker with waves |
| **Sound Off** | 32x32 px | - | Speaker with X |
| **Music On** | 32x32 px | - | Musical note |
| **Music Off** | 32x32 px | - | Musical note with X |

---

### Backgrounds (1280x720 px each)

| Asset | Description | Layers |
|-------|-------------|--------|
| **Menu Background** | Dark, atmospheric, maybe silhouette of castle | 1-2 |
| **Graveyard** | Tombstones, dead trees, fog, moonlight | 2-3 (parallax) |
| **Haunted Village** | Abandoned houses, broken fences, street lamps | 2-3 (parallax) |
| **Vampire Castle** | Gothic interior, chandeliers, red curtains, stone | 2-3 (parallax) |
| **Ghost Realm** | Ethereal, floating islands, glowing mist, stars | 2-3 (parallax) |
| **Hell Dimension** | Lava rivers, brimstone, flames, dark red sky | 2-3 (parallax) |

---

### Particle Effects / VFX

| Asset | Type | Notes |
|-------|------|-------|
| **Blood Splatter** | Particle sprites (4-6) | Red, for zombie hits |
| **Bat** | Small sprite (16x16) | For vampire death scatter |
| **Mist/Smoke** | Particle sprites (4-6) | Gray/white, for ghost death |
| **Soul Pickup** | Particle sprites (4-6) | Purple wisps |
| **Fire Particles** | Particle sprites (4-6) | Orange/red, for fire sword |
| **Ice Particles** | Particle sprites (4-6) | Blue/cyan, for ice blade |
| **Lightning Arc** | Sprite strip | Purple/blue, for lightning chain |
| **Slash Trail** | Could be code-generated | Glowing line effect |
| **Screen Flash** | White overlay | For critical hits |
| **Combo Text Pop** | Could be code-generated | Numbers flying up |

---

## Audio

### Sound Effects

| Sound | File Format | Duration | Notes |
|-------|-------------|----------|-------|
| **Slash 1-5** | .wav/.ogg | 0.2-0.3s | 5 variations, whoosh + impact |
| **Zombie Death** | .wav/.ogg | 0.5s | Groan + splat |
| **Vampire Death** | .wav/.ogg | 0.5s | Hiss + bat flutter |
| **Ghost Death** | .wav/.ogg | 0.5s | Ethereal wail + fade |
| **Villager Scream** | .wav/.ogg | 0.5s | Panic scream |
| **Power-Up Collect** | .wav/.ogg | 0.3s | Magical chime |
| **Boss Hit** | .wav/.ogg | 0.3s | Heavy impact |
| **Boss Death** | .wav/.ogg | 1.0s | Epic death sound |
| **UI Click** | .wav/.ogg | 0.1s | Button press |
| **UI Hover** | .wav/.ogg | 0.1s | Subtle hover |
| **Combo Milestone** | .wav/.ogg | 0.3s | Exciting ding |
| **Level Complete** | .wav/.ogg | 1.5s | Victory fanfare |
| **Game Over** | .wav/.ogg | 1.5s | Somber/dramatic |
| **Life Lost** | .wav/.ogg | 0.5s | Negative feedback |

### Music

| Track | Duration | Style | Loop Point |
|-------|----------|-------|------------|
| **Menu Theme** | 60-90s | Orchestral/Synth, dark, atmospheric | Seamless loop |

---

## Recommended Asset Sources

### Marketplaces

1. **itch.io** - Great for pixel art packs
   - Search: "pixel art monsters", "dark fantasy sprites", "horror pixel art"
   
2. **OpenGameArt.org** - Free assets (check licenses)

3. **GameDevMarket** - Professional game assets

4. **Kenney.nl** - Free high-quality assets (may need recoloring)

5. **CraftPix.net** - Fantasy/RPG focused

### Specific Recommendations

For your dark pixel art style, search for:
- "16-bit horror sprites"
- "Castlevania style assets"
- "Dark fantasy pixel art"
- "Gothic pixel monsters"
- "Vampire pixel art"
- "Zombie sprite sheet"

### Commissioning Artists

If using commissioned art:
1. **Fiverr** - Search "pixel art game sprites"
2. **Twitter/X** - #pixelart #gamedev communities
3. **Reddit** - r/PixelArt, r/gameDevClassifieds

**Budget Estimate (Commission):**
- Character sprites: $20-50 each
- Boss sprites: $50-150 each
- UI pack: $100-300
- Backgrounds: $50-100 each
- Full game assets: $500-1500

---

## Asset Checklist

### Sprites
- [ ] Zombie (idle, walk, death, halves)
- [ ] Vampire (idle, fly, death, bats)
- [ ] Ghost (idle, fade, death, mist)
- [ ] Grave Titan boss
- [ ] Headless Horseman boss
- [ ] Vampire Lord boss
- [ ] Phantom King boss
- [ ] Demon Overlord boss
- [ ] 3 Villager variants
- [ ] 6 Weapon icons
- [ ] 4 Power-up icons

### UI
- [ ] Buttons (4 states)
- [ ] Panel 9-slice
- [ ] Card frames
- [ ] Hearts, Stars
- [ ] Icons (soul, lock, arrows, etc.)

### Backgrounds
- [ ] Menu
- [ ] Graveyard
- [ ] Haunted Village
- [ ] Vampire Castle
- [ ] Ghost Realm
- [ ] Hell Dimension

### Particles
- [ ] Blood splatter
- [ ] Bat scatter
- [ ] Ghost mist
- [ ] Soul wisps
- [ ] Element particles (fire, ice, lightning)

### Audio
- [ ] 5 Slash variations
- [ ] Monster death sounds (3)
- [ ] Villager scream
- [ ] UI sounds
- [ ] Power-up sound
- [ ] Boss sounds
- [ ] Level complete
- [ ] Game over
- [ ] Menu music

---

## File Naming Convention

```
monsters/
  zombie_idle_01.png - zombie_idle_04.png
  zombie_walk_01.png - zombie_walk_04.png
  zombie_death_01.png - zombie_death_04.png
  zombie_half_left.png
  zombie_half_right.png

bosses/
  grave_titan_idle_01.png - ...
  grave_titan_attack_01.png - ...

ui/
  button_normal.png
  button_hover.png
  button_pressed.png
  button_disabled.png
  heart_full.png
  heart_empty.png

backgrounds/
  bg_graveyard_layer1.png
  bg_graveyard_layer2.png

audio/sfx/
  slash_01.wav - slash_05.wav
  zombie_death.wav
  
audio/music/
  menu_theme.mp3
```

---

## Technical Notes

1. **Transparency:** All sprites should have transparent backgrounds (PNG format)

2. **Consistent Size:** Keep all monsters the same canvas size (64x64) even if the sprite is smaller - this makes animation easier

3. **Anchor Point:** Design sprites so the center-bottom is the logical origin point

4. **Animation:** Ensure smooth animation loops (idle should seamlessly repeat)

5. **Contrast:** Ensure sprites are visible against all 5 background types

6. **File Size:** Optimize PNGs - each sprite sheet shouldn't exceed 512x512 ideally

7. **Audio Format:** Use .ogg for web (better compression), keep .wav sources for editing
