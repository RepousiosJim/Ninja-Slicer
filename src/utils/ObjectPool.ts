import Phaser from 'phaser';
import { debugWarn } from './DebugLogger';

/**
 * Interface for game objects with visibility control
 */
interface VisibleGameObject {
  setVisible(visible: boolean): void;
}

/**
 * Interface for game objects with position control
 */
interface PositionableObject {
  setPosition(x: number, y: number): void;
}

/**
 * Type guard for visible game objects
 */
function isVisibleGameObject(obj: unknown): obj is VisibleGameObject {
  return typeof obj === 'object' && obj !== null && 'setVisible' in obj;
}

/**
 * Type guard for positionable objects
 */
function isPositionableObject(obj: unknown): obj is PositionableObject {
  return typeof obj === 'object' && obj !== null && 'setPosition' in obj;
}

/**
 * ObjectPool
 *
 * Generic object pooling utility to avoid garbage collection pauses.
 * Reuses objects instead of creating/destroying them repeatedly.
 *
 * Usage:
 *   const pool = new ObjectPool(
 *     () => new Bullet(scene, 0, 0),  // Factory function
 *     (bullet) => bullet.reset(),      // Reset function
 *     20                                // Initial pool size
 *   );
 *
 *   const bullet = pool.get();
 *   // ... use bullet ...
 *   pool.release(bullet);
 */

export class ObjectPool<T> {
  private available: T[] = [];
  private inUse: Set<T> = new Set();
  private factory: () => T;
  private reset: (obj: T) => void;
  private maxSize: number;

  /**
   * Create a new object pool
   * @param factory Function that creates a new object
   * @param reset Function that resets an object for reuse
   * @param initialSize Number of objects to pre-create
   * @param maxSize Maximum pool size (0 = unlimited)
   */
  constructor(
    factory: () => T,
    reset: (obj: T) => void,
    initialSize: number = 10,
    maxSize: number = 0,
  ) {
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;

    // Pre-populate the pool
    for (let i = 0; i < initialSize; i++) {
      this.available.push(this.factory());
    }
  }

  /**
   * Get an object from the pool
   * Creates a new one if pool is empty (unless at max size)
   */
  get(): T | null {
    let obj: T;

    if (this.available.length > 0) {
      obj = this.available.pop()!;
    } else if (this.maxSize === 0 || this.totalSize < this.maxSize) {
      obj = this.factory();
    } else {
      // Pool is at max capacity
      debugWarn('[ObjectPool] Pool exhausted, max size reached');
      return null;
    }

    this.inUse.add(obj);
    return obj;
  }

  /**
   * Return an object to the pool for reuse
   */
  release(obj: T): void {
    if (!this.inUse.has(obj)) {
      debugWarn('[ObjectPool] Attempting to release object not from this pool');
      return;
    }

    this.inUse.delete(obj);
    this.reset(obj);
    this.available.push(obj);
  }

  /**
   * Release all objects back to the pool
   */
  releaseAll(): void {
    this.inUse.forEach((obj) => {
      this.reset(obj);
      this.available.push(obj);
    });
    this.inUse.clear();
  }

  /**
   * Get number of available objects
   */
  get availableCount(): number {
    return this.available.length;
  }

  /**
   * Get number of objects currently in use
   */
  get inUseCount(): number {
    return this.inUse.size;
  }

  /**
   * Get total pool size
   */
  get totalSize(): number {
    return this.available.length + this.inUse.size;
  }

  /**
   * Pre-warm the pool with additional objects
   */
  warmup(count: number): void {
    for (let i = 0; i < count; i++) {
      if (this.maxSize > 0 && this.totalSize >= this.maxSize) {
        break;
      }
      this.available.push(this.factory());
    }
  }

  /**
   * Shrink the pool by removing unused objects
   */
  shrink(targetSize: number): void {
    while (this.available.length > targetSize) {
      this.available.pop();
    }
  }

  /**
   * Execute a function on all objects in use
   */
  forEach(callback: (obj: T) => void): void {
    this.inUse.forEach(callback);
  }

  /**
   * Get all objects currently in use as an array
   */
  getInUse(): T[] {
    return Array.from(this.inUse);
  }

  /**
   * Clear the entire pool
   */
  clear(): void {
    this.available = [];
    this.inUse.clear();
  }
}

/**
 * PhaserPool
 * 
 * A Phaser-specific object pool that works with game objects.
 * Automatically handles setActive/setVisible.
 */
export class PhaserPool<T extends Phaser.GameObjects.GameObject> {
  private pool: ObjectPool<T>;
  
  constructor(
    factory: () => T,
    initialSize: number = 10,
    maxSize: number = 0,
  ) {
    this.pool = new ObjectPool(
      factory,
      (obj) => this.resetObject(obj),
      initialSize,
      maxSize,
    );
  }

  private resetObject(obj: T): void {
    obj.setActive(false);
    
    // Handle visibility if the object supports it
    if ('setVisible' in obj && typeof (obj as any).setVisible === 'function') {
      (obj as any).setVisible(false);
    }
    
    // Reset position if it's a game object with position
    if ('setPosition' in obj && typeof (obj as any).setPosition === 'function') {
      (obj as any).setPosition(-1000, -1000);
    }
  }

  /**
   * Spawn an object at a position
   */
  spawn(x: number, y: number): T | null {
    const obj = this.pool.get();
    if (!obj) return null;

    obj.setActive(true);
    
    if (isVisibleGameObject(obj)) {
      obj.setVisible(true);
    }
    
    if (isPositionableObject(obj)) {
      obj.setPosition(x, y);
    }

    return obj;
  }

  /**
   * Despawn an object (return to pool)
   */
  despawn(obj: T): void {
    this.pool.release(obj);
  }

  /**
   * Get all active objects
   */
  getActive(): T[] {
    return this.pool.getInUse();
  }

  /**
   * Get count of active objects
   */
  get activeCount(): number {
    return this.pool.inUseCount;
  }

  /**
   * Execute callback on all active objects
   */
  forEachActive(callback: (obj: T) => void): void {
    this.pool.forEach(callback);
  }

  /**
   * Despawn all objects
   */
  despawnAll(): void {
    this.pool.releaseAll();
  }

  /**
   * Clear the pool
   */
  clear(): void {
    this.pool.clear();
  }

  /**
   * Pre-warm the pool
   */
  warmup(count: number): void {
    this.pool.warmup(count);
  }
}
