# Troubleshooting Guide

Common issues, their causes, and solutions for Monster Slayer.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Build Issues](#build-issues)
- [Runtime Issues](#runtime-issues)
- [Performance Issues](#performance-issues)
- [Save/Load Issues](#saveload-issues)
- [Audio Issues](#audio-issues)
- [Graphics Issues](#graphics-issues)
- [Network Issues](#network-issues)
- [Mobile-Specific Issues](#mobile-specific-issues)
- [Browser-Specific Issues](#browser-specific-issues)
- [Platform-Specific Issues](#platform-specific-issues)

---

## Installation Issues

### npm install Fails

**Error:** `EACCES: permission denied` or similar permission errors

**Causes:**
- Insufficient permissions
- npm cache issues
- npm version incompatibility

**Solutions:**

```bash
# Solution 1: Clear npm cache
npm cache clean --force

# Solution 2: Use sudo (Linux/Mac)
sudo npm install

# Solution 3: Change npm permissions (Linux/Mac)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH

# Solution 4: Update npm
npm install -g npm@latest

# Solution 5: Use nvm (recommended)
nvm install 20
nvm use 20
npm install
```

---

### Dependencies Not Found

**Error:** `Cannot find module 'phaser'` or similar

**Causes:**
- `node_modules` not installed
- Dependency conflicts
- Corrupted `node_modules`

**Solutions:**

```bash
# Solution 1: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Solution 2: Update npm and reinstall
npm install -g npm@latest
rm -rf node_modules package-lock.json
npm install

# Solution 3: Check Node.js version
node --version  # Should be 20.0.0 or higher
```

---

### Node.js Version Incompatible

**Error:** `engines.node is incompatible with this version`

**Causes:**
- Old Node.js version
- Version mismatch in package.json

**Solutions:**

```bash
# Solution 1: Install nvm (recommended)
# Mac/Linux
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Windows
# Download from https://github.com/coreybutler/nvm-windows

# Solution 2: Install required Node version
nvm install 20
nvm use 20

# Solution 3: Use n (alternative)
npm install -g n
n 20
```

---

## Build Issues

### TypeScript Compilation Errors

**Error:** Multiple TypeScript errors during `npm run typecheck`

**Causes:**
- Type mismatches
- Missing type definitions
- Incompatible library versions

**Solutions:**

```bash
# Solution 1: Update TypeScript
npm install typescript@latest --save-dev

# Solution 2: Check TypeScript version
tsc --version

# Solution 3: Clear cache and rebuild
rm -rf .tsbuildinfo node_modules/.vite
npm run typecheck

# Solution 4: Check for specific errors
npm run typecheck 2>&1 | grep "error TS"
```

---

### ESLint Errors

**Error:** ESLint found linting errors

**Causes:**
- Code style violations
- Linting rule conflicts
- Outdated lint configuration

**Solutions:**

```bash
# Solution 1: Auto-fix
npm run lint:fix

# Solution 2: Manually review errors
npm run lint

# Solution 3: Disable specific rules (temporary)
# Add to .eslintrc.js:
{
  "rules": {
    "no-console": "off"
  }
}
```

---

### Vite Build Fails

**Error:** Build fails with Vite errors

**Causes:**
- Missing files
- Invalid configuration
- Node modules issues

**Solutions:**

```bash
# Solution 1: Check configuration
cat vite.config.ts

# Solution 2: Clear Vite cache
rm -rf node_modules/.vite

# Solution 3: Update Vite
npm install vite@latest --save-dev

# Solution 4: Check for missing files
ls -la src/
ls -la public/
```

---

### Bundle Size Too Large

**Warning:** `Some chunks are larger than 500 kB`

**Causes:**
- Large dependencies
- No code splitting
- Unoptimized assets

**Solutions:**

```typescript
// Solution 1: Enable code splitting
// In vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'phaser': ['phaser'],
          'supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
});
```

```bash
# Solution 2: Analyze bundle
npm install -g rollup-plugin-visualizer

# Add to vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [visualizer()]
});
```

```bash
# Solution 3: Optimize assets
# Use WebP format
# Compress images
# Use audio compression tools
```

---

## Runtime Issues

### Game Won't Start

**Error:** Blank screen or error in console

**Causes:**
- Missing assets
- JavaScript errors
- Browser incompatibility

**Solutions:**

```bash
# Solution 1: Check browser console
# Open DevTools (F12) and look for errors

# Solution 2: Verify assets exist
ls -la dist/assets/
ls -la public/assets/

# Solution 3: Check network tab
# Ensure all files loaded successfully (status 200)
```

```javascript
// Solution 4: Add error handling
// In main.ts
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection:', event.reason);
});
```

---

### Phaser Not Defined

**Error:** `Phaser is not defined`

**Causes:**
- Phaser not imported
- Import order incorrect
- Module bundling issue

**Solutions:**

```typescript
// Solution 1: Ensure proper import
import Phaser from 'phaser';

// Solution 2: Check import path
import * as Phaser from 'phaser';

// Solution 3: Check package.json
{
  "dependencies": {
    "phaser": "^3.85.2"
  }
}
```

---

### Scene Not Starting

**Error:** Scene fails to start or transition

**Causes:**
- Scene key mismatch
- Scene not registered in GameConfig
- Preload errors

**Solutions:**

```typescript
// Solution 1: Check scene key
// Ensure scene key matches config
export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' }); // Must match config
  }
}

// Solution 2: Verify scene registration
// In main.ts
const config: Phaser.Types.Core.GameConfig = {
  scene: [
    BootScene,
    PreloaderScene,
    MainMenuScene, // Must be imported
  ],
};

// Solution 3: Check preload errors
class MyScene extends Phaser.Scene {
  preload() {
    console.log('Preloading...');
    // All assets should load here
  }
}
```

---

## Performance Issues

### Low FPS / Lag

**Symptoms:** Game stutters, low frame rate

**Causes:**
- Too many particles
- Unoptimized code
- Heavy calculations per frame
- Large textures

**Solutions:**

```typescript
// Solution 1: Reduce particle count
// In theme.ts
DASHBOARD_CARD_CONFIG: {
  // Reduce hover effects
  hoverLift: -5, // Reduce from -12
  hoverScale: 1.01, // Reduce from 1.03
}

// Solution 2: Optimize update loops
update(time: number, delta: number) {
  // Cache expensive calculations
  // Use object pools
  // Reduce nested loops
}

// Solution 3: Use object pools
class Pool<T> {
  private pool: T[] = [];
  private createFn: () => T;

  get(): T {
    return this.pool.pop() || this.createFn();
  }

  release(obj: T): void {
    this.pool.push(obj);
  }
}

// Solution 4: Reduce texture sizes
// Use WebP format
// Compress images
```

---

### Memory Leaks

**Symptoms:** Game slows down over time, browser crashes

**Causes:**
- Not destroying game objects
- Event listeners not removed
- Circular references
- Not cleaning up textures

**Solutions:**

```typescript
// Solution 1: Always destroy objects
class MyScene extends Phaser.Scene {
  shutdown() {
    // Destroy all created objects
    this.monsters.forEach(monster => monster.destroy());
    this.particles.destroy();
    this.uiContainer.destroy();

    // Call super
    super.shutdown();
  }
}

// Solution 2: Remove event listeners
setupEvents() {
  this.events.on('update', this.onUpdate, this);
}

shutdown() {
  // Remove listener
  this.events.off('update', this.onUpdate, this);
  super.shutdown();
}

// Solution 3: Clean up textures
// In PreloaderScene
preload() {
  // Load textures
  this.load.image('monster', 'assets/monster.png');
}

shutdown() {
  // Remove unused textures
  if (this.textures.exists('unused_texture')) {
    this.textures.remove('unused_texture');
  }
}

// Solution 4: Use Chrome DevTools Memory Profiler
// 1. Open DevTools
# 2. Go to Memory tab
# 3. Take heap snapshot
# 4. Look for detached DOM nodes
# 5. Look for increasing memory over time
```

---

## Save/Load Issues

### Save Not Persisting

**Symptoms:** Game progress lost after refresh

**Causes:**
- localStorage disabled
- Storage quota exceeded
- Save errors not caught

**Solutions:**

```typescript
// Solution 1: Check localStorage availability
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

// Solution 2: Check storage quota
function checkStorageQuota(): number {
  const used = JSON.stringify(localStorage).length * 2; // Bytes
  const total = 5 * 1024 * 1024; // 5MB (typical limit)
  return used / total; // Percentage
}

// Solution 3: Add error handling
class SaveManager {
  async save(data: GameSave): Promise<boolean> {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Save failed:', error);

      if (error.name === 'QuotaExceededError') {
        this.showNotification('Storage full. Please clear browser data.', 'error');
      }
      return false;
    }
  }
}

// Solution 4: Fallback to IndexedDB (larger storage)
class IndexedDBSaveManager {
  save(data: GameSave): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('MonsterSaver', 1);

      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(['saves'], 'readwrite');
        const store = tx.objectStore('saves');
        store.put(data, 'current');
        resolve(true);
      };

      request.onerror = () => reject(request.error);
    });
  }
}
```

---

### Save Data Corrupted

**Symptoms:** Game crashes when loading save

**Causes:**
- Incomplete save
- Schema mismatch
- Browser storage corruption

**Solutions:**

```typescript
// Solution 1: Add schema versioning
interface GameSave {
  version: number; // Track save format version
  souls: number;
  // ... other fields
}

// Solution 2: Handle version migration
class SaveManager {
  load(): GameSave | null {
    try {
      const data = localStorage.getItem(SAVE_KEY);
      if (!data) return null;

      const save: GameSave = JSON.parse(data);

      // Migrate old saves
      if (save.version < 2) {
        save.souls = this.migrateV1ToV2(save);
        save.version = 2;
        this.save(save);
      }

      return save;
    } catch (error) {
      console.error('Save corrupted:', error);
      this.clearSave(); // Clear corrupted save
      return null;
    }
  }

  private migrateV1ToV2(oldSave: GameSave): number {
    // Migration logic
    return oldSave.souls * 2; // Example: double souls in v2
  }
}

// Solution 3: Validate save data
function validateSave(save: GameSave): boolean {
  return (
    typeof save.souls === 'number' &&
    save.souls >= 0 &&
    Array.isArray(save.completedLevels) &&
    typeof save.version === 'number'
  );
}

// Solution 4: Backup saves
class SaveManager {
  backupSave(): void {
    const save = this.getSaveData();
    const backup = {
      ...save,
      timestamp: Date.now()
    };
    localStorage.setItem(`${SAVE_KEY}_backup_${Date.now()}`, JSON.stringify(backup));
  }
}
```

---

## Audio Issues

### Audio Not Playing

**Symptoms:** No sound or music

**Causes:**
- Audio not loaded
- Audio format incompatible
- Browser autoplay policy
- Volume muted

**Solutions:**

```typescript
// Solution 1: Check audio loading
class AudioPreloadScene extends Phaser.Scene {
  preload() {
    this.load.audio('music_menu', 'assets/music/menu.mp3');

    this.load.on('complete', () => {
      console.log('Audio loaded successfully');
    });

    this.load.on('loaderror', (file) => {
      console.error('Failed to load:', file.key);
    });
  }
}

// Solution 2: Check audio format support
function checkAudioSupport(): boolean {
  const audio = new Audio();
  return !!(audio.canPlayType('audio/mp3') || audio.canPlayType('audio/ogg'));
}

// Solution 3: Handle autoplay policy
// In MainScene
create() {
  // Audio requires user interaction to start
  this.input.once('pointerdown', () => {
    this.audioManager.playMusic('menu_music');
  });
}

// Solution 4: Check volume settings
const settings = this.saveManager.getSaveData().settings;
if (!settings.soundEnabled || settings.soundVolume === 0) {
  console.warn('Sound is disabled');
}
```

---

### Audio Distortion/Cracking

**Symptoms:** Audio quality poor or distorted

**Causes:**
- Low bitrate audio
- Browser codec issues
- Multiple audio instances

**Solutions:**

```bash
# Solution 1: Recompress audio with higher quality
# Use ffmpeg:
ffmpeg -i input.mp3 -b:a 192k output.mp3

# Solution 2: Use different audio format
# Try OGG (better compression, better quality)
ffmpeg -i input.wav -c:a libvorbis -q:a 4 output.ogg
```

```typescript
// Solution 3: Limit concurrent audio
class AudioManager {
  private activeSounds: Map<string, Phaser.Sound.BaseSound> = new Map();

  playSFX(key: string) {
    // Stop previous instance
    if (this.activeSounds.has(key)) {
      this.activeSounds.get(key)!.stop();
    }

    const sound = this.sound.play(key);
    this.activeSounds.set(key, sound);

    sound.on('complete', () => {
      this.activeSounds.delete(key);
    });
  }
}
```

---

## Graphics Issues

### Assets Not Loading

**Symptoms:** Missing textures, blank sprites

**Causes:**
- Wrong asset paths
- Assets not in build
- CORS issues
- File naming case sensitivity

**Solutions:**

```typescript
// Solution 1: Check asset paths
preload() {
  // Use relative paths from assets folder
  this.load.image('monster_zombie', 'assets/monsters/zombie.png');
  // NOT: this.load.image('monster_zombie', 'src/assets/monsters/zombie.png');
}

// Solution 2: Verify assets in build
// After npm run build, check dist/assets/
ls -la dist/assets/monsters/

// Solution 3: Use asset loader with error handling
preload() {
  this.load.on('loaderror', (file) => {
    console.error('Failed to load:', file.key, file.url);
    // Fallback to placeholder
    this.createFallbackTexture(file.key);
  });
}

// Solution 4: Check for CORS issues (if loading from different domain)
// In vite.config.ts
export default defineConfig({
  server: {
    headers: {
      'Access-Control-Allow-Origin': '*',
    }
  }
});
```

---

### Render Issues (Black Screen)

**Symptoms:** Black or white screen, graphics not rendering

**Causes:**
- WebGL not supported
- Canvas context issues
- Phaser configuration error

**Solutions:**

```typescript
// Solution 1: Check WebGL support
function checkWebGLSupport(): boolean {
  const canvas = document.createElement('canvas');
  return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
}

// Solution 2: Fallback to Canvas (slower but more compatible)
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO, // Tries WebGL first, then Canvas
  // or
  type: Phaser.CANVAS, // Force Canvas
  // ...
};

// Solution 3: Check canvas size
const canvas = this.sys.canvas;
console.log('Canvas size:', canvas.width, 'x', canvas.height);

// Solution 4: Check for WebGL errors
// In browser console
// Look for errors like "WebGL: INVALID_OPERATION"
```

---

## Network Issues

### Supabase Connection Failed

**Error:** `Failed to connect to Supabase` or `Invalid API Key`

**Causes:**
- Wrong credentials
- Network issues
- Supabase service down
- CORS configuration

**Solutions:**

```bash
# Solution 1: Verify environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Solution 2: Check .env file
cat .env
```

```typescript
// Solution 3: Add connection error handling
class SupabaseService {
  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('leaderboard')
        .select('count')
        .limit(1);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Supabase connection failed:', error);
      this.showNotification('Connection failed. Check your internet.', 'error');
      return false;
    }
  }
}

// Solution 4: Implement offline mode
class OfflineManager {
  private isOnline: boolean = navigator.onLine;

  constructor() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncOfflineData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.showNotification('You are offline', 'warning');
    });
  }

  canUseOnlineFeatures(): boolean {
    return this.isOnline;
  }
}
```

---

### Leaderboard Not Updating

**Symptoms:** Score not appearing on leaderboard

**Causes:**
- API errors
- Network timeout
- Score not submitted
- Data validation failed

**Solutions:**

```typescript
// Solution 1: Add submission logging
class LeaderboardManager {
  async submitScore(score: number, playerName: string): Promise<boolean> {
    console.log('Submitting score:', score, 'for player:', playerName);

    try {
      const result = await this.supabaseService.submitLeaderboardEntry({
        playerName,
        score,
        weaponUsed: this.saveManager.getSaveData().equippedWeapon
      });

      console.log('Submission result:', result);
      return result.success;
    } catch (error) {
      console.error('Submission failed:', error);
      return false;
    }
  }
}

// Solution 2: Add retry logic
async submitWithRetry(score: number, playerName: string, maxRetries: number = 3): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await this.submitScore(score, playerName);
      if (result.success) return true;

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
  return false;
}

// Solution 3: Validate score before submission
function validateScore(score: number): boolean {
  return (
    typeof score === 'number' &&
    score >= 0 &&
    score <= 999999999 // Reasonable maximum
  );
}
```

---

## Mobile-Specific Issues

### Touch Not Working

**Symptoms:** Game doesn't respond to touch

**Causes:**
- Touch events not configured
- Canvas not focused
- CSS preventing touch

**Solutions:**

```typescript
// Solution 1: Configure Phaser for touch
const config: Phaser.Types.Core.GameConfig = {
  // ...
  input: {
    touch: {
      target: document.body
    }
  }
};

// Solution 2: Add touch-specific handling
class GameplayScene extends Phaser.Scene {
  create() {
    this.input.addPointer(1); // Enable multi-touch

    // Touch events
    this.input.on('pointerdown', (pointer) => {
      if (pointer.isDown) {
        this.onTouchStart(pointer);
      }
    });
  }
}

// Solution 3: Prevent default touch behaviors
// In index.html
<style>
  body {
    touch-action: none; /* Disable browser gestures */
    user-select: none; /* Prevent text selection */
    -webkit-user-select: none;
  }
</style>

// Solution 4: Check touch support
function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}
```

---

### Mobile Performance Issues

**Symptoms:** Game runs slow on mobile devices

**Causes:**
- High resolution rendering
- Too many particles
- Heavy animations
- Memory limitations

**Solutions:**

```typescript
// Solution 1: Detect mobile and reduce quality
class QualityManager {
  constructor() {
    const isMobile = ResponsiveUtils.isMobile();

    if (isMobile) {
      this.setQuality('low');
    }
  }

  setQuality(level: 'low' | 'medium' | 'high') {
    const settings = {
      low: {
        maxParticles: 15,
        maxMonsters: 5,
        particleScale: 0.5
      },
      medium: {
        maxParticles: 30,
        maxMonsters: 10,
        particleScale: 0.75
      },
      high: {
        maxParticles: 50,
        maxMonsters: 15,
        particleScale: 1.0
      }
    };

    this.applyQualitySettings(settings[level]);
  }
}

// Solution 2: Use device pixel ratio
const config: Phaser.Types.Core.GameConfig = {
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

// Solution 3: Reduce texture sizes for mobile
preload() {
  const isMobile = ResponsiveUtils.isMobile();
  const size = isMobile ? 0.5 : 1.0;

  // Load smaller textures on mobile
  this.load.image('monster', `assets/monster@${size}x.png`);
}
```

---

## Browser-Specific Issues

### Safari Issues

**Problem:** Game doesn't work on Safari

**Common Issues:**
- Audio autoplay blocked
- WebGL performance issues
- IndexedDB quota limits

**Solutions:**

```typescript
// Solution 1: Detect Safari
function isSafari(): boolean {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

// Solution 2: Handle Safari audio
if (isSafari()) {
  // Safari requires user interaction for audio
  this.input.once('pointerdown', () => {
    this.audioManager.playMusic('menu');
  });
}

// Solution 3: Safari-specific polyfills
// Add to index.html
<script src="https://polyfill.io/v3/polyfill.min.js?features=Object.assign"></script>
```

---

### Firefox Issues

**Problem:** Performance or rendering issues on Firefox

**Common Issues:**
- Canvas rendering differences
- WebGL implementation differences
- Audio format support

**Solutions:**

```typescript
// Solution 1: Detect Firefox
function isFirefox(): boolean {
  return /firefox/i.test(navigator.userAgent);
}

// Solution 2: Firefox-specific configuration
if (isFirefox()) {
  // Force Canvas (more stable on Firefox)
  const config = {
    type: Phaser.CANVAS,
    // ...
  };
}

// Solution 3: Check audio format support
// Firefox prefers OGG over MP3
```

---

## Platform-Specific Issues

### Windows-Specific Issues

**Problem:** Game won't run on Windows

**Common Issues:**
- Node.js path length limits
- Firewall blocking
- Antivirus interference

**Solutions:**

```bash
# Solution 1: Shorten paths
# Install to: C:\Projects\Monster Slayer
# NOT: C:\Very\Long\Path\To\Monster Slayer

# Solution 2: Check Windows Defender
# Add project folder to exclusions

# Solution 3: Use PowerShell instead of Command Prompt
# Better path handling

# Solution 4: Enable Windows Subsystem for Linux (WSL)
# If needed
```

---

### Linux-Specific Issues

**Problem:** Build or runtime errors on Linux

**Common Issues:**
- Case-sensitive file paths
- Permission issues
- Missing system libraries

**Solutions:**

```bash
# Solution 1: Check case sensitivity
# Linux paths are case-sensitive
# Ensure: assets/Monster.png (NOT: assets/monster.png)

# Solution 2: Fix permissions
chmod +x node_modules/.bin/*
sudo npm install

# Solution 3: Install system dependencies
# Ubuntu/Debian
sudo apt-get install libxi-dev libgl1-mesa-dev

# Fedora
sudo dnf install libXi mesa-libGL-devel

# Solution 4: Use nvm (avoids permission issues)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

---

## Debugging Tools

### Browser DevTools

#### Chrome/Firefox DevTools

1. **Open DevTools:** Press `F12` or `Ctrl+Shift+I` (Cmd+Option+I on Mac)

2. **Console Tab:**
   - View JavaScript errors
   - Run console commands
   - Check `console.log` output

3. **Network Tab:**
   - Check asset loading
   - Verify API calls
   - Check response times

4. **Performance Tab:**
   - Record performance profile
   - Identify bottlenecks
   - Check frame rates

5. **Memory Tab:**
   - Take heap snapshots
   - Detect memory leaks
   - Check memory usage

### Phaser Inspector

1. **Install Phaser Inspector extension** for Chrome/Firefox

2. **Open DevTools** and click "Phaser Inspector" tab

3. **View:**
   - Game objects hierarchy
   - Scene structure
   - Textures and sprites
   - Physics bodies

### Lighthouse

```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run Lighthouse audit
lighthouse http://localhost:3000 --view
```

### Sentry Error Tracking

```typescript
import * as Sentry from '@sentry/browser';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  release: import.meta.env.PACKAGE_VERSION,

  // Capture console errors
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
});
```

---

## Getting Help

### Documentation

- [API Documentation](docs/API.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Game Spec](docs/GAME_SPEC.md)

### Community

- [GitHub Issues](https://github.com/yourusername/monster-slayer/issues)
- [GitHub Discussions](https://github.com/yourusername/monster-slayer/discussions)
- [Stack Overflow](https://stackoverflow.com/) - Tag with `phaser3`

### Reporting Bugs

When reporting bugs, include:

1. **Browser and version:** Chrome 120, Firefox 121, etc.
2. **Operating system:** Windows 11, macOS Sonoma, etc.
3. **Steps to reproduce:**
   ```
   1. Open game
   2. Click "Play"
   3. Game crashes
   ```
4. **Expected behavior:** Game should start
5. **Actual behavior:** Game crashes with error
6. **Console errors:** Copy from DevTools console
7. **Screenshots:** If visual issue

### Feature Requests

For new features, use:

1. **GitHub Discussions** - For discussions and proposals
2. **GitHub Issues** - With `enhancement` label
3. Provide:
   - Feature description
   - Use case
   - Why it's valuable
   - Possible implementation approach

---

**[⬆ Back to Top](#troubleshooting-guide)**
