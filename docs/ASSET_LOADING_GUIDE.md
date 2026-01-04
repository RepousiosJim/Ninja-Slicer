# Asset Loading Guide

This guide explains how to work with the asset loading system in Ninja Slicer.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Asset Bundles](#asset-bundles)
- [Adding New Assets](#adding-new-assets)
- [Lazy Loading](#lazy-loading)
- [Memory Management](#memory-management)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

The asset loading system consists of three main components:

### 1. AssetRegistry
Central registry of all game assets with metadata. Contains:
- Asset configurations (type, path, priority, bundle)
- Bundle definitions (groupings of related assets)
- Query methods for filtering assets

### 2. LoadingManager
Coordinates all asset loading operations:
- Loads bundles with priority ordering
- Tracks progress with fine-grained details
- Implements retry logic with exponential backoff
- Manages loaded/failed asset state
- Handles memory cleanup

### 3. LazyLoader
Utility for convenient on-demand loading:
- Preloads scene-specific assets
- Loads world-specific bundles
- Automatically unloads unused bundles
- Memory statistics tracking

### Data Flow

```
┌─────────────┐
│ BootScene   │ Initialize system
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Preloader   │ Load auto-load bundles
│   Scene     │ (UI, Core, Effects)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ MainMenu    │ Game running
│   Scene     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Gameplay    │ Lazy load world assets
│   Scene     │ Unload when done
└─────────────┘
```

---

## Asset Bundles

Bundles are logical groupings of related assets. They determine:
- When assets are loaded (auto-load vs lazy)
- When assets are unloaded (scene transitions)
- Asset priority for loading order

### Bundle Definitions

#### BOOT Bundle
**Purpose:** Essential assets for loading screen
**Auto-load:** Yes
**Priority:** CRITICAL
**Assets:**
- Button textures (normal, hover, pressed, disabled)
- Loading screen elements

#### UI Bundle
**Purpose:** All user interface elements
**Auto-load:** Yes
**Priority:** HIGH
**Assets:**
- HUD elements (hearts, stars, souls)
- Icons (pause, lock, settings)
- Panels and frames
- Sound/music toggles

#### CORE_GAMEPLAY Bundle
**Purpose:** Essential gameplay sprites
**Auto-load:** Yes
**Priority:** HIGH
**Assets:**
- Enemy sprites (zombie, vampire, ghost)
- Villager sprites
- Weapon sprites
- Boss sprites (static only)

#### EFFECTS Bundle
**Purpose:** Visual effects and particle systems
**Auto-load:** Yes
**Priority:** NORMAL
**Assets:**
- Slicing effects (halves, bat scatter)
- Particle effects (blood, soul, fire, ice, lightning)
- Boss projectiles

#### WORLD_1 through WORLD_5 Bundles
**Purpose:** World-specific backgrounds and music
**Auto-load:** World 1 only, others lazy
**Priority:** NORMAL (1) to LOW (5)
**Assets:**
- Background images
- Foreground parallax layers
- World-specific music

#### AUDIO_MUSIC Bundle
**Purpose:** Background music tracks
**Auto-load:** No (lazy load)
**Priority:** LOW
**Assets:**
- Menu, gameplay, world themes
- Boss battle music
- Victory/gameover music

#### AUDIO_SFX Bundle
**Purpose:** Sound effects
**Auto-load:** No (lazy load)
**Priority:** LOW
**Assets:**
- Slash, hit, death sounds
- Monster vocalizations
- UI sounds
- Boss sounds

---

## Adding New Assets

### Step 1: Register in AssetRegistry

Open `src/managers/AssetRegistry.ts` and add your asset to the `registerAssets()` method:

```typescript
this.registerAsset({
  key: 'my_new_asset',
  type: AssetType.IMAGE, // or SPRITESHEET, AUDIO, etc.
  path: 'path/to/asset.png',
  priority: AssetPriority.NORMAL, // CRITICAL, HIGH, NORMAL, LOW, OPTIONAL
  bundle: AssetBundle.CORE_GAMEPLAY, // Or appropriate bundle
  description: 'Description of asset',
  tags: ['enemy', 'zombie'], // For querying
});
```

### Step 2: Add to Bundle

Add the asset key to a bundle in `registerBundles()`:

```typescript
this.registerBundle({
  name: AssetBundle.CORE_GAMEPLAY,
  assets: [
    // ... existing assets ...
    'my_new_asset', // Add your asset here
  ],
  priority: AssetPriority.HIGH,
  autoLoad: true,
  description: 'Core gameplay sprites',
});
```

### Step 3: Add Physical Files

Place the asset file in the appropriate directory:
- Images: `public/assets/[category]/`
- Spritesheets: `public/assets/[category]/`
- Audio: `public/assets/audio/music/` or `public/assets/audio/sfx/`

### Asset Types

#### IMAGE
Standard single-frame images.
```typescript
{
  type: AssetType.IMAGE,
  path: 'enemies/zombie.png'
}
```

#### SPRITESHEET
Multi-frame animations.
```typescript
{
  type: AssetType.SPRITESHEET,
  path: 'enemies/zombie_sheet.png',
  spritesheetConfig: {
    frameWidth: 64,
    frameHeight: 64,
    startFrame: 0, // Optional
    endFrame: 15,  // Optional
  }
}
```

#### AUDIO
Sound files (MP3, OGG, WAV).
```typescript
{
  type: AssetType.AUDIO,
  path: 'audio/music/menu_theme.mp3',
  lazyLoad: true, // Recommended for audio
}
```

---

## Lazy Loading

Lazy loading loads assets on-demand instead of at startup, reducing initial load time.

### When to Use Lazy Loading

**Use lazy loading for:**
- Large assets (> 500KB)
- Assets not needed immediately
- World-specific content
- Audio/music files
- Boss-specific assets

**Preload at startup:**
- UI elements
- Core gameplay sprites
- Essential effects

### Using LazyLoader in Scenes

```typescript
import { lazyLoader } from '@managers/LazyLoader';

export class GameplayScene extends Phaser.Scene {
  create(): void {
    // Preload world-specific assets
    lazyLoader.preloadWorldAssets(this.worldId);
    
    // Set up cleanup on scene shutdown
    this.events.once('shutdown', () => {
      lazyLoader.unloadUnusedBundles([
        AssetBundle.UI,
        AssetBundle.CORE_GAMEPLAY,
      ]);
    });
  }
}
```

### Lazy Loading Methods

#### `preloadSceneAssets(sceneKey: string)`
Loads all assets tagged with a scene name.

```typescript
lazyLoader.preloadSceneAssets('GameplayScene');
```

#### `preloadWorldAssets(worldId: number)`
Loads world-specific bundles.

```typescript
lazyLoader.preloadWorldAssets(1); // World 1 (Graveyard)
```

#### `preloadBossAssets(bossId: string)`
Loads boss-specific assets.

```typescript
lazyLoader.preloadBossAssets('grave_titan');
```

#### `preloadMenuAssets()`
Loads menu-specific assets.

```typescript
lazyLoader.preloadMenuAssets();
```

#### `preloadGameplayAudio()`
Loads gameplay music and SFX.

```typescript
lazyLoader.preloadGameplayAudio();
```

### Unloading Unused Assets

```typescript
// Option 1: Keep only specific bundles
lazyLoader.unloadUnusedBundles([
  AssetBundle.UI,
  AssetBundle.CORE_GAMEPLAY,
]);

// Option 2: Keep only critical bundles
lazyLoader.unloadAllNonCritical();
```

---

## Memory Management

### Automatic Unloading

LazyLoader automatically unloads assets when:
- Scene transitions occur
- `unloadUnusedBundles()` is called
- `unloadAllNonCritical()` is called

### Manual Unloading

Use LoadingManager directly for manual control:

```typescript
import { loadingManager } from '@managers/LoadingManager';

// Unload specific asset
loadingManager.unloadAsset('boss_gravetitan');

// Unload entire bundle
loadingManager.unloadBundle(AssetBundle.WORLD_2);

// Unload multiple bundles
loadingManager.unloadUnusedBundles([
  AssetBundle.WORLD_2,
  AssetBundle.WORLD_3,
]);
```

### Memory Statistics

Check memory usage with LazyLoader:

```typescript
const stats = lazyLoader.getMemoryStats();
console.log(`Loaded ${stats.loadedBundles}/${stats.totalBundles} bundles`);
console.log(`Estimated memory: ${stats.estimatedMemory}`);
```

---

## Best Practices

### 1. Asset Organization

**DO:**
- Group related assets in bundles
- Use descriptive asset keys
- Add tags for filtering
- Set appropriate priorities

**DON'T:**
- Mix unrelated assets in same bundle
- Use cryptic asset names
- Set all assets to CRITICAL priority

### 2. Loading Strategy

**Initial Load (Critical):**
- UI bundle
- Core gameplay bundle
- World 1 background
- Essential effects

**Lazy Load (On-Demand):**
- Other world backgrounds
- All audio/music
- Boss-specific assets
- Non-essential effects

### 3. Performance Optimization

**Reduce Initial Load:**
- Lazy load audio
- Lazy load world 2-5
- Lazy load boss assets
- Lazy load optional effects

**Improve Runtime:**
- Unload unused bundles between scenes
- Preload assets before they're needed
- Use sprite sheets instead of individual images
- Compress audio files

### 4. Error Handling

**Graceful Degradation:**
- Failed UI assets → Use procedural generation
- Failed gameplay assets → Show placeholder
- Failed audio → Continue without sound
- Failed world assets → Use fallback background

**User Feedback:**
- Show loading progress
- Alert user to failed assets
- Provide retry button
- Allow game to continue with reduced features

### 5. Testing

**Load Time Testing:**
- Measure initial load time (target: < 3 seconds)
- Test slow connections
- Test with cache cleared
- Monitor memory usage

**Lazy Load Testing:**
- Verify assets load before use
- Check memory usage increases
- Test rapid scene transitions
- Verify bundles unload correctly

---

## Troubleshooting

### Assets Not Loading

**Problem:** Asset never loads, progress stuck

**Solutions:**
1. Check asset path in AssetRegistry matches file location
2. Verify file exists in `public/assets/`
3. Check browser console for 404 errors
4. Verify asset type matches file type (IMAGE vs SPRITESHEET)

**Example:**
```typescript
// WRONG
path: 'assets/zombie.png' // Double "assets/"

// CORRECT
path: 'enemies/zombie.png' // Base path already set in LoadingManager
```

### Progress Not Updating

**Problem:** Progress bar stuck at 0%

**Solutions:**
1. Verify LoadingManager is initialized: `loadingManager.initialize(this)`
2. Check `onProgress` callback is set up
3. Ensure assets are being added to loader
4. Check for JavaScript errors in console

### Assets Unloading Too Early

**Problem:** Assets disappear mid-scene

**Solutions:**
1. Don't call `unloadUnusedBundles()` too early
2. Verify keep list includes necessary bundles
3. Add delay before unloading if assets still in use
4. Use `isLoading()` to check before unloading

### Memory Growing

**Problem:** Memory usage keeps increasing

**Solutions:**
1. Call `unloadUnusedBundles()` on scene shutdown
2. Verify bundles are being unloaded
3. Check for asset leaks (assets loaded but not used)
4. Reduce number of auto-load bundles

### Audio Not Playing

**Problem:** Sounds don't play

**Solutions:**
1. Verify audio is lazy loaded: `lazyLoader.preloadGameplayAudio()`
2. Check if audio exists: `scene.cache.audio.exists(key)`
3. Verify audio path is correct
4. Check audio volume settings
5. Test with different browsers

---

## Examples

### Example 1: Adding a New Weapon

```typescript
// In AssetRegistry.ts
this.registerAsset({
  key: 'frost_sword',
  type: AssetType.IMAGE,
  path: 'weapons/frost_sword.png',
  priority: AssetPriority.HIGH,
  bundle: AssetBundle.CORE_GAMEPLAY,
  description: 'Frost Sword weapon',
  tags: ['weapon', 'ice'],
});

// Add to CORE_GAMEPLAY bundle
this.registerBundle({
  name: AssetBundle.CORE_GAMEPLAY,
  assets: [
    // ... existing assets
    'frost_sword',
  ],
  priority: AssetPriority.HIGH,
  autoLoad: true,
  description: 'Core gameplay sprites',
});
```

### Example 2: Lazy Loading World Assets

```typescript
// In GameplayScene.ts
import { lazyLoader } from '@managers/LazyLoader';

export class GameplayScene extends Phaser.Scene {
  private worldId: number = 1;

  async create(): Promise<void> {
    // Lazy load world-specific assets
    await lazyLoader.preloadWorldAssets(this.worldId);
    
    // Show world background
    this.add.image(0, 0, `bg_world_${this.worldId}`);
    
    // Clean up when scene ends
    this.events.once('shutdown', () => {
      lazyLoader.unloadUnusedBundles([
        AssetBundle.UI,
        AssetBundle.CORE_GAMEPLAY,
        // Don't unload current world bundle yet
      ]);
    });
  }

  changeWorld(newWorldId: number): void {
    // Unload previous world
    const oldBundle = `world_${this.worldId}`;
    // ... unload logic

    this.worldId = newWorldId;
    lazyLoader.preloadWorldAssets(newWorldId);
  }
}
```

### Example 3: Checking Loading Progress

```typescript
// In PreloaderScene.ts
import { loadingManager, LoadProgress } from '@managers/LoadingManager';

preload(): void {
  this.loadingManager = LoadingManager.getInstance();
  this.loadingManager.initialize(this);

  this.loadingManager.onProgress((progress: LoadProgress) => {
    console.log(`Loading: ${progress.percentage}%`);
    console.log(`Current: ${progress.currentAsset}`);
    console.log(`Failed: ${progress.failed}`);
    console.log(`ETA: ${progress.estimatedRemaining}s`);
    
    this.updateProgressUI(progress);
  });

  const autoLoadBundles = this.loadingManager.getRegistry()
    .getAutoLoadBundles()
    .map(b => b.name);

  await this.loadingManager.loadBundles(autoLoadBundles);
}
```

---

## API Reference

### LoadingManager

```typescript
class LoadingManager {
  // Initialization
  initialize(scene: Phaser.Scene): void
  
  // Loading
  loadBundles(bundles: AssetBundle[]): Promise<void>
  loadAssets(assets: AssetConfig[]): Promise<void>
  lazyLoadAsset(key: string): Promise<void>
  lazyLoadBundle(bundleName: AssetBundle): Promise<void>
  
  // Queries
  isAssetLoaded(key: string): boolean
  isBundleLoaded(bundleName: AssetBundle): boolean
  getProgress(): LoadProgress
  getLoadedAssets(): string[]
  getFailedAssets(): string[]
  getRegistry(): AssetRegistry
  
  // Memory management
  unloadAsset(key: string): void
  unloadBundle(bundleName: AssetBundle): void
  unloadUnusedBundles(keepBundles: AssetBundle[]): void
  reset(): void
}
```

### LazyLoader

```typescript
class LazyLoader {
  // Scene loading
  preloadSceneAssets(sceneKey: string): Promise<void>
  preloadWorldAssets(worldId: number): Promise<void>
  preloadBossAssets(bossId: string): Promise<void>
  preloadMenuAssets(): Promise<void>
  preloadGameplayAudio(): Promise<void>
  
  // Memory management
  unloadUnusedBundles(keepBundles?: AssetBundle[]): void
  unloadAllNonCritical(): void
  
  // Queries
  isBundleLoaded(bundle: AssetBundle): boolean
  isAssetLoaded(key: string): boolean
  getLoadedBundles(): AssetBundle[]
  getMemoryStats(): MemoryStats
  
  // Utilities
  reset(): void
}
```

### ProgressTracker

```typescript
interface LoadProgress {
  total: number;
  loaded: number;
  failed: number;
  percentage: number;
  currentAsset?: string;
  category?: string;
  errors: Array<{ key: string; error: string }>;
  startTime: number;
  elapsed: number;
  estimatedRemaining: number;
}
```

---

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Initial load time | < 3s | TBD |
| Memory usage | < 200MB | TBD |
| Lazy load time | < 1s | TBD |
| Scene transition time | < 500ms | TBD |

---

## Related Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - Overall system architecture
- [PERFORMANCE_GUIDE.md](PERFORMANCE_GUIDE.md) - Performance optimization
- [ASSET_REQUIREMENTS.md](ASSET_REQUIREMENTS.md) - Asset specifications

---

## Version History

- **v2.0** - Complete rewrite with lazy loading and bundle system
- **v1.0** - Initial asset loading system
