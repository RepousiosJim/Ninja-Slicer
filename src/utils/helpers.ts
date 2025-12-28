/**
 * Helper Utilities
 * 
 * Common utility functions used throughout the game.
 */

import Phaser from 'phaser';

// =============================================================================
// MATH HELPERS
// =============================================================================

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation between two values
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Get a random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get a random float between min and max
 */
export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Get a random element from an array
 */
export function randomElement<T>(array: T[]): T {
  if (array.length === 0) {
    throw new Error('Cannot select random element from empty array');
  }
  const index = Math.floor(Math.random() * array.length);
  const result = array[index];
  if (result === undefined) {
    throw new Error('Random element selection failed');
  }
  return result;
}

/**
 * Weighted random selection
 * @param weights Object with keys and their weights (higher = more likely)
 * @returns The selected key
 */
export function weightedRandom<T extends string>(weights: Record<T, number>): T {
  const entries = Object.entries(weights) as [T, number][];
  const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);
  
  let random = Math.random() * totalWeight;
  
  for (const [key, weight] of entries) {
    random -= weight;
    if (random <= 0) {
      return key;
    }
  }
  
  // Fallback (should never reach here)
  if (entries.length === 0) {
    throw new Error('Cannot select random element from empty weights');
  }
  const fallback = entries[0];
  if (!fallback) {
    throw new Error('Weighted random selection failed');
  }
  return fallback[0];
}

// =============================================================================
// GEOMETRY HELPERS
// =============================================================================

/**
 * Calculate distance between two points
 */
export function distance(
  x1: number, 
  y1: number, 
  x2: number, 
  y2: number
): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * Check if a line segment intersects a circle
 * Used for slash hit detection
 */
export function lineIntersectsCircle(
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number },
  circleCenter: { x: number; y: number },
  circleRadius: number
): boolean {
  const d = {
    x: lineEnd.x - lineStart.x,
    y: lineEnd.y - lineStart.y,
  };
  const f = {
    x: lineStart.x - circleCenter.x,
    y: lineStart.y - circleCenter.y,
  };

  const a = d.x * d.x + d.y * d.y;
  const b = 2 * (f.x * d.x + f.y * d.y);
  const c = f.x * f.x + f.y * f.y - circleRadius * circleRadius;

  let discriminant = b * b - 4 * a * c;

  if (discriminant < 0) {
    return false;
  }

  discriminant = Math.sqrt(discriminant);
  const t1 = (-b - discriminant) / (2 * a);
  const t2 = (-b + discriminant) / (2 * a);

  return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
}

/**
 * Calculate velocity needed to launch object in arc
 * Used for monster spawning
 */
export function calculateLaunchVelocity(
  startX: number,
  startY: number,
  targetX: number,
  peakY: number,
  gravity: number
): { x: number; y: number } {
  // Calculate vertical velocity to reach peak height
  const heightDiff = startY - peakY;
  const velocityY = -Math.sqrt(2 * gravity * heightDiff);

  // Time to reach peak
  const timeToPeak = -velocityY / gravity;

  // Horizontal velocity to reach target x at peak
  const velocityX = (targetX - startX) / timeToPeak;

  return { x: velocityX, y: velocityY };
}

// =============================================================================
// FORMATTING HELPERS
// =============================================================================

/**
 * Format a number with commas (e.g., 1000000 -> "1,000,000")
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Format time in seconds to MM:SS
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format a large number with abbreviation (e.g., 1500 -> "1.5K")
 */
export function formatCompact(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// =============================================================================
// ASYNC HELPERS
// =============================================================================

/**
 * Wait for a specified duration
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Phaser-compatible delay that returns a promise
 */
export function phaserDelay(
  scene: Phaser.Scene, 
  ms: number
): Promise<void> {
  return new Promise((resolve) => {
    scene.time.delayedCall(ms, resolve);
  });
}

// =============================================================================
// ASSET HELPERS
// =============================================================================

/**
 * Lazy load an image if not already in cache
 */
export async function loadImageIfNeeded(
  scene: Phaser.Scene,
  key: string,
  path: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (scene.textures.exists(key)) {
      resolve();
      return;
    }

    scene.load.image(key, path);
    
    scene.load.once('filecomplete-image-' + key, () => {
      resolve();
    });
    
    scene.load.once('loaderror', () => {
      reject(new Error(`Failed to load image: ${key}`));
    });

    scene.load.start();
  });
}

/**
 * Lazy load an audio file if not already in cache
 */
export async function loadAudioIfNeeded(
  scene: Phaser.Scene,
  key: string,
  path: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (scene.cache.audio.exists(key)) {
      resolve();
      return;
    }

    scene.load.audio(key, path);
    
    scene.load.once('filecomplete-audio-' + key, () => {
      resolve();
    });
    
    scene.load.once('loaderror', () => {
      reject(new Error(`Failed to load audio: ${key}`));
    });

    scene.load.start();
  });
}

// =============================================================================
// DEVICE HELPERS
// =============================================================================

/**
 * Check if the game is running on a mobile device
 */
export function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Check if the game is running on iOS
 */
export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * Check if touch is supported
 */
export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// =============================================================================
// COLOR HELPERS
// =============================================================================

/**
 * Convert hex color to RGB object
 */
export function hexToRgb(hex: number): { r: number; g: number; b: number } {
  return {
    r: (hex >> 16) & 255,
    g: (hex >> 8) & 255,
    b: hex & 255,
  };
}

/**
 * Convert RGB to hex color
 */
export function rgbToHex(r: number, g: number, b: number): number {
  return (r << 16) | (g << 8) | b;
}

/**
 * Interpolate between two colors
 */
export function lerpColor(color1: number, color2: number, t: number): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  return rgbToHex(
    Math.round(lerp(rgb1.r, rgb2.r, t)),
    Math.round(lerp(rgb1.g, rgb2.g, t)),
    Math.round(lerp(rgb1.b, rgb2.b, t))
  );
}

// =============================================================================
// DEBUG HELPERS
// =============================================================================

/**
 * Create an FPS counter (use DOM for performance)
 */
export function createFPSCounter(scene: Phaser.Scene): () => void {
  // Create DOM element
  const fpsElement = document.createElement('div');
  fpsElement.id = 'fps-counter';
  fpsElement.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.7);
    color: #00ff00;
    padding: 5px 10px;
    font-family: monospace;
    font-size: 14px;
    z-index: 9999;
    border-radius: 4px;
  `;
  document.body.appendChild(fpsElement);

  // Return update function to call in scene update
  return () => {
    fpsElement.textContent = `FPS: ${Math.floor(scene.game.loop.actualFps)}`;
  };
}

/**
 * Log with timestamp (useful for debugging)
 */
export function debugLog(message: string, ...args: unknown[]): void {
  if (import.meta.env.DEV) {
    const timestamp = new Date().toISOString().split('T')[1]?.slice(0, -1) || '00.000';
    console.log(`[${timestamp}] ${message}`, ...args);
  }
}
