# Monster Slayer - Performance Optimization Guide

This guide contains performance optimization techniques specific to Phaser 3 and mobile web games. Apply these during Phase 7 (Polish) or earlier if you notice performance issues.

---

## Quick Performance Checklist

- [ ] Use object pooling for frequently created/destroyed objects
- [ ] Cache references (don't use `getElementById` in loops)
- [ ] Only update active/visible objects
- [ ] Compress all images (use Squoosh)
- [ ] Compress audio files (use ffmpeg)
- [ ] Lazy load non-essential assets
- [ ] Use texture atlases (TexturePacker)
- [ ] Consider Canvas renderer for mobile
- [ ] Test on low-end devices

---

## 1. Add FPS Counter for Testing

Always add an FPS counter during development to measure impact of changes:

```typescript
// Using DOM element (more performant than Phaser text)
class GameScene extends Phaser.Scene {
  private fpsElement!: HTMLElement;
  
  create() {
    this.fpsElement = document.getElementById('fps')!;
  }
  
  update() {
    this.fpsElement.innerHTML = Math.floor(this.game.loop.actualFps).toString();
  }
}
```

Or use the helper function from `utils/helpers.ts`:

```typescript
import { createFPSCounter } from '@utils/helpers';

create() {
  this.updateFPS = createFPSCounter(this);
}

update() {
  this.updateFPS();
}
```

---

## 2. Object Pooling

**Problem:** Creating/destroying objects causes garbage collection pauses.

**Solution:** Reuse objects instead of creating new ones.

```typescript
// Create pool in scene
this.monsterPool = this.add.group({
  classType: Monster,
  maxSize: 30,
  runChildUpdate: true,
});

// Spawn from pool
spawn(x: number, y: number) {
  const monster = this.monsterPool.get(x, y);
  if (monster) {
    monster.setActive(true);
    monster.setVisible(true);
    monster.spawn(x, y);
  }
}

// Return to pool (don't destroy!)
kill(monster: Monster) {
  monster.setActive(false);
  monster.setVisible(false);
}
```

Use pooling for:
- Monsters
- Villagers
- Particles
- Projectiles
- Damage numbers
- Any frequently spawned object

---

## 3. Only Update What's Needed

**Problem:** Updating inactive objects wastes CPU.

**Solution:** Check active state before processing.

```typescript
// Bad
update() {
  this.monsters.forEach(monster => {
    monster.updateAI(); // Runs for ALL monsters
  });
}

// Good
update() {
  const activeMonsters = this.monsterPool.getMatching('active', true);
  activeMonsters.forEach(monster => {
    monster.updateAI(); // Only active monsters
  });
}
```

Also set objects invisible when off-screen:

```typescript
if (this.y > this.scene.scale.height + 100) {
  this.setActive(false);
  this.setVisible(false);
}
```

---

## 4. Cache References

**Problem:** Looking up references repeatedly is slow.

**Solution:** Cache references once and reuse.

```typescript
// Bad - looks up element every frame
update() {
  document.getElementById('score').innerHTML = this.score.toString();
}

// Good - cache the reference
create() {
  this.scoreElement = document.getElementById('score')!;
}

update() {
  this.scoreElement.innerHTML = this.score.toString();
}
```

Same applies to array lookups:

```typescript
// Bad
getTexture(key: string) {
  return this.textures.find(t => t.key === key); // Searches every time
}

// Good
private textureCache: Map<string, Texture> = new Map();

getTexture(key: string) {
  if (!this.textureCache.has(key)) {
    this.textureCache.set(key, this.textures.find(t => t.key === key));
  }
  return this.textureCache.get(key);
}
```

---

## 5. Compress Assets

### Images
Use [Squoosh](https://squoosh.app/) to compress images:
- Use WebP format when possible (smaller than PNG)
- Reduce quality to 80-90% (often imperceptible)
- Resize to actual needed dimensions

### Audio
Use ffmpeg to compress audio:

```bash
# Compress to 128kbps (good for most game audio)
ffmpeg -i original.mp3 -b:a 128k compressed.mp3

# Compress to OGG (better for web)
ffmpeg -i original.mp3 -c:a libvorbis -q:a 4 compressed.ogg
```

---

## 6. Lazy Load Assets

**Problem:** Loading all assets upfront delays game start.

**Solution:** Load essential assets first, load others on-demand.

```typescript
// Essential assets in PreloaderScene
preload() {
  this.load.image('ui_button', 'assets/ui/button.png');
  // Menu music, basic UI only
}

// Lazy load in gameplay scene
async startLevel(levelId: string) {
  // Load background for this specific world
  await this.loadBackgroundForWorld(this.currentWorld);
  
  // Now start the level
  this.beginLevel();
}

async loadBackgroundForWorld(worldId: number) {
  const key = `bg_world_${worldId}`;
  if (!this.textures.exists(key)) {
    await new Promise(resolve => {
      this.load.image(key, `assets/backgrounds/world_${worldId}.png`);
      this.load.once('complete', resolve);
      this.load.start();
    });
  }
}
```

---

## 7. Use Texture Atlases

**Problem:** Many separate image files = many HTTP requests + more draw calls.

**Solution:** Combine sprites into atlases using [TexturePacker](https://www.codeandweb.com/texturepacker).

Benefits:
- Single HTTP request for many sprites
- Reduced file size (~20-30% smaller)
- Fewer draw calls = better performance

```typescript
// Load atlas instead of individual images
preload() {
  this.load.atlas(
    'monsters',
    'assets/sprites/monsters.png',
    'assets/sprites/monsters.json'
  );
}

// Use frames from atlas
create() {
  this.add.sprite(100, 100, 'monsters', 'zombie_idle_01');
}
```

---

## 8. Canvas vs WebGL

**Surprising Finding:** Canvas can be faster than WebGL for simple games!

WebGL has overhead for GPU communication. For games with:
- Few sprites on screen
- Simple graphics
- No WebGL-specific effects (shaders, glow)

Canvas might perform better, especially on mobile.

```typescript
const config: Phaser.Types.Core.GameConfig = {
  // Try Canvas if experiencing lag
  type: Phaser.CANVAS, // instead of Phaser.AUTO
  
  // Or let Phaser decide (usually WebGL)
  type: Phaser.AUTO,
};
```

**Test on your target devices!** The optimal choice depends on your specific game.

---

## 9. Reduce Canvas Size

**Problem:** Larger canvas = more pixels to render.

**Solution:** Use a smaller base resolution and scale up.

```typescript
const config: Phaser.Types.Core.GameConfig = {
  width: 960,  // Instead of 1920
  height: 540, // Instead of 1080
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    pixelArt: true, // Keeps pixels crisp when scaled
  },
};
```

For pixel art games, this works well because scaling doesn't blur the art.

---

## 10. Minimize Update Loop Work

**Problem:** Heavy operations in `update()` run 60 times per second.

**Solution:** Move heavy operations out of update loop.

```typescript
// Bad - collision check runs every frame
update() {
  this.checkAllCollisions(); // Expensive!
}

// Better - only check when weapon is active
update() {
  if (this.weapon.isActive && this.weapon.isFiring) {
    this.checkCollisions();
  }
}

// Even better - use Phaser's physics colliders
create() {
  this.physics.add.overlap(
    this.weapon.hitbox,
    this.monsterGroup,
    this.onWeaponHit,
    null,
    this
  );
}
```

---

## 11. Stop Unused Timers and Tweens

**Problem:** Timers and tweens continue running after objects are destroyed.

**Solution:** Always stop them when done.

```typescript
class Monster extends Phaser.Physics.Arcade.Sprite {
  private moveTween?: Phaser.Tweens.Tween;
  private spawnTimer?: Phaser.Time.TimerEvent;
  
  spawn() {
    this.moveTween = this.scene.tweens.add({ /* ... */ });
  }
  
  kill() {
    // IMPORTANT: Stop tweens and timers!
    this.moveTween?.stop();
    this.spawnTimer?.remove();
    
    this.setActive(false);
    this.setVisible(false);
  }
}
```

---

## 12. Use DOM for UI When Appropriate

Phaser's text rendering can be expensive. For frequently updating text (score, FPS), consider using DOM elements:

```html
<div id="game-ui">
  <span id="score">0</span>
  <span id="combo">x1</span>
</div>

<div id="game-container"></div>
```

```typescript
// Cache references once
create() {
  this.scoreElement = document.getElementById('score')!;
  this.comboElement = document.getElementById('combo')!;
}

// Update DOM directly
updateScore(score: number) {
  this.scoreElement.textContent = score.toString();
}
```

---

## Debug Strategy

When hunting performance issues:

1. **Disable everything** - Comment out all update logic
2. **Check baseline FPS** - What's the FPS with nothing running?
3. **Enable one thing at a time** - Find what causes the drop
4. **Test without audio** - Audio can sometimes cause lag
5. **Test on low-end device** - Your dev machine is probably fast
6. **Profile with browser DevTools** - Use Performance tab

```typescript
update() {
  // Uncomment one at a time to find bottleneck
  return; // Skip all update logic
  
  // this.updateMonsters();
  // this.checkCollisions();
  // this.updateParticles();
  // this.updateUI();
}
```

---

## Mobile-Specific Tips

1. **Touch input smoothing** - Reduce jitter
   ```typescript
   const config = {
     input: {
       smoothFactor: 0.2, // Smooth touch movement
     },
   };
   ```

2. **Reduce particle counts** - Mobile GPUs are weaker
   ```typescript
   const particleCount = isMobile() ? 20 : 50;
   ```

3. **Lower resolution on mobile**
   ```typescript
   const scale = isMobile() ? 0.75 : 1;
   const config = {
     width: 1280 * scale,
     height: 720 * scale,
   };
   ```

4. **Test on real devices** - Emulators don't show real performance

---

## Recommended Tools

- [Squoosh](https://squoosh.app/) - Image compression
- [TexturePacker](https://www.codeandweb.com/texturepacker) - Sprite atlas creation
- [ffmpeg](https://ffmpeg.org/) - Audio compression
- Chrome DevTools Performance tab - Profiling
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Web performance audit

---

## Performance Targets

| Device | Target FPS | Acceptable |
|--------|------------|------------|
| Desktop | 60 | 55+ |
| High-end Mobile | 60 | 50+ |
| Mid-range Mobile | 60 | 45+ |
| Low-end Mobile | 30 | 30+ |

If you can't hit these targets, prioritize gameplay smoothness over visual effects.
