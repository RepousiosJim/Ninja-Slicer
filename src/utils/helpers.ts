/**
 * Helper Utilities
 *
 * Common utility functions used throughout the game.
 */

import Phaser from 'phaser';

// Pattern recognition imports
import type { SlashPatternPoint, SlashPatternResult, Vector2 } from '../config/types';
import { SlashPatternType } from '../config/types';
import { SLASH_PATTERN } from '../config/constants';

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

// =============================================================================
// PATTERN RECOGNITION HELPERS
// =============================================================================

/**
 * Perpendicular distance from a point to a line segment
 * Used by Douglas-Peucker algorithm
 */
export function perpendicularDistance(
  point: { x: number; y: number },
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number }
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;

  // If the line is a point, return distance to that point
  const lineLengthSq = dx * dx + dy * dy;
  if (lineLengthSq === 0) {
    return distance(point.x, point.y, lineStart.x, lineStart.y);
  }

  // Calculate perpendicular distance
  const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lineLengthSq;
  const clampedT = clamp(t, 0, 1);

  const nearestX = lineStart.x + clampedT * dx;
  const nearestY = lineStart.y + clampedT * dy;

  return distance(point.x, point.y, nearestX, nearestY);
}

/**
 * Douglas-Peucker algorithm for path simplification
 * Reduces the number of points while preserving the general shape
 * @param points Array of points to simplify
 * @param epsilon Maximum distance threshold for point removal
 * @returns Simplified array of points
 */
export function douglasPeucker<T extends { x: number; y: number }>(
  points: T[],
  epsilon: number
): T[] {
  if (points.length < 3) {
    return points;
  }

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  if (!firstPoint || !lastPoint) {
    return points;
  }

  // Find the point with the maximum distance from the line
  let maxDistance = 0;
  let maxIndex = 0;

  for (let i = 1; i < points.length - 1; i++) {
    const point = points[i];
    if (!point) continue;

    const dist = perpendicularDistance(point, firstPoint, lastPoint);
    if (dist > maxDistance) {
      maxDistance = dist;
      maxIndex = i;
    }
  }

  // If max distance is greater than epsilon, recursively simplify
  if (maxDistance > epsilon) {
    const leftPoints = douglasPeucker(points.slice(0, maxIndex + 1), epsilon);
    const rightPoints = douglasPeucker(points.slice(maxIndex), epsilon);

    // Combine results (remove duplicate point at junction)
    return [...leftPoints.slice(0, -1), ...rightPoints];
  }

  // Return only start and end points
  return [firstPoint, lastPoint];
}

/**
 * Calculate the centroid (center) of a set of points
 */
export function calculateCentroid(points: { x: number; y: number }[]): Vector2 {
  if (points.length === 0) {
    return { x: 0, y: 0 };
  }

  let sumX = 0;
  let sumY = 0;

  for (const point of points) {
    sumX += point.x;
    sumY += point.y;
  }

  return {
    x: sumX / points.length,
    y: sumY / points.length,
  };
}

/**
 * Calculate the angle between two points in degrees
 */
export function angleBetweenPoints(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);
}

/**
 * Calculate the angle difference between two angles in degrees
 * Returns the absolute difference normalized to [0, 180]
 */
export function angleDifference(angle1: number, angle2: number): number {
  let diff = Math.abs(angle1 - angle2) % 360;
  if (diff > 180) {
    diff = 360 - diff;
  }
  return diff;
}

/**
 * Calculate total path length from an array of points
 */
export function pathLength(points: { x: number; y: number }[]): number {
  let totalLength = 0;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    if (!prev || !curr) continue;

    totalLength += distance(prev.x, prev.y, curr.x, curr.y);
  }

  return totalLength;
}

/**
 * Detect if points form a circle pattern
 * Criteria:
 * - Start and end points are close together
 * - Points are roughly equidistant from a center point
 * - Minimum radius threshold met
 */
export function detectCirclePattern(
  points: SlashPatternPoint[]
): SlashPatternResult {
  const result: SlashPatternResult = {
    pattern: SlashPatternType.NONE,
    confidence: 0,
    points: points,
  };

  if (points.length < SLASH_PATTERN.minPointsForDetection) {
    return result;
  }

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  if (!firstPoint || !lastPoint) {
    return result;
  }

  // Check if start and end points are close (closed loop)
  const closureDistance = distance(
    firstPoint.x, firstPoint.y,
    lastPoint.x, lastPoint.y
  );

  if (closureDistance > SLASH_PATTERN.circleClosureThreshold) {
    return result;
  }

  // Calculate centroid
  const center = calculateCentroid(points);
  result.center = center;

  // Calculate distances from center for all points
  const distances: number[] = [];
  for (const point of points) {
    distances.push(distance(point.x, point.y, center.x, center.y));
  }

  // Calculate mean radius
  const meanRadius = distances.reduce((sum, d) => sum + d, 0) / distances.length;
  result.radius = meanRadius;

  // Check minimum radius
  if (meanRadius < SLASH_PATTERN.circleMinRadius) {
    return result;
  }

  // Calculate variance from mean radius
  let varianceSum = 0;
  for (const dist of distances) {
    const deviation = Math.abs(dist - meanRadius) / meanRadius;
    varianceSum += deviation;
  }
  const averageVariance = varianceSum / distances.length;

  // Check if variance is within acceptable threshold
  if (averageVariance > SLASH_PATTERN.circleMaxRadiusVariance) {
    return result;
  }

  // Calculate confidence based on closure distance and radius variance
  const closureConfidence = 1 - (closureDistance / SLASH_PATTERN.circleClosureThreshold);
  const varianceConfidence = 1 - (averageVariance / SLASH_PATTERN.circleMaxRadiusVariance);

  result.pattern = SlashPatternType.CIRCLE;
  result.confidence = (closureConfidence + varianceConfidence) / 2;

  return result;
}

/**
 * Detect if points form a zigzag pattern
 * Criteria:
 * - Multiple significant direction changes
 * - Each segment has minimum length
 * - Alternating direction changes
 */
export function detectZigzagPattern(
  points: SlashPatternPoint[]
): SlashPatternResult {
  const result: SlashPatternResult = {
    pattern: SlashPatternType.NONE,
    confidence: 0,
    points: points,
    directionChanges: 0,
  };

  if (points.length < SLASH_PATTERN.minPointsForDetection) {
    return result;
  }

  // Simplify the path first to get key direction changes
  const simplified = douglasPeucker(points, SLASH_PATTERN.zigzagMinSegmentLength / 2);

  if (simplified.length < 4) {
    return result;
  }

  // Calculate angles between consecutive segments
  const angles: number[] = [];
  for (let i = 0; i < simplified.length - 1; i++) {
    const curr = simplified[i];
    const next = simplified[i + 1];
    if (!curr || !next) continue;

    angles.push(angleBetweenPoints(curr, next));
  }

  // Count significant direction changes
  let directionChanges = 0;
  let lastChangeDirection: 'left' | 'right' | null = null;

  for (let i = 1; i < angles.length; i++) {
    const prevAngle = angles[i - 1];
    const currAngle = angles[i];

    if (prevAngle === undefined || currAngle === undefined) continue;

    const angleDiff = angleDifference(prevAngle, currAngle);

    if (angleDiff >= SLASH_PATTERN.zigzagAngleThreshold) {
      // Determine direction of change
      const normalizedDiff = ((currAngle - prevAngle) + 360) % 360;
      const currentDirection = normalizedDiff > 180 ? 'left' : 'right';

      // For zigzag, direction should alternate
      if (lastChangeDirection === null || currentDirection !== lastChangeDirection) {
        directionChanges++;
        lastChangeDirection = currentDirection;
      }
    }
  }

  result.directionChanges = directionChanges;

  // Check minimum direction changes
  if (directionChanges < SLASH_PATTERN.zigzagMinDirectionChanges) {
    return result;
  }

  // Calculate confidence based on number of direction changes
  const minChanges = SLASH_PATTERN.zigzagMinDirectionChanges;
  const maxChanges = minChanges * 2; // Higher confidence for more zigzags
  const changeConfidence = clamp((directionChanges - minChanges) / (maxChanges - minChanges), 0, 1);

  // Also consider path length - zigzag should cover reasonable distance
  const totalLength = pathLength(points);
  const lengthConfidence = clamp(totalLength / (SLASH_PATTERN.zigzagMinSegmentLength * 4), 0, 1);

  result.pattern = SlashPatternType.ZIGZAG;
  result.confidence = (changeConfidence * 0.7) + (lengthConfidence * 0.3);

  return result;
}

/**
 * Detect if points form a straight line pattern
 * Criteria:
 * - Minimal deviation from ideal line between start and end
 * - Minimum length threshold met
 */
export function detectStraightPattern(
  points: SlashPatternPoint[]
): SlashPatternResult {
  const result: SlashPatternResult = {
    pattern: SlashPatternType.NONE,
    confidence: 0,
    points: points,
    straightLineDeviation: 0,
  };

  if (points.length < 3) {
    return result;
  }

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  if (!firstPoint || !lastPoint) {
    return result;
  }

  // Calculate line length
  const lineLength = distance(
    firstPoint.x, firstPoint.y,
    lastPoint.x, lastPoint.y
  );

  // Check minimum length
  if (lineLength < SLASH_PATTERN.straightLineMinLength) {
    return result;
  }

  // Calculate average perpendicular distance from the ideal line
  let totalDeviation = 0;
  let maxDeviation = 0;

  for (let i = 1; i < points.length - 1; i++) {
    const point = points[i];
    if (!point) continue;

    const deviation = perpendicularDistance(point, firstPoint, lastPoint);
    totalDeviation += deviation;
    maxDeviation = Math.max(maxDeviation, deviation);
  }

  const averageDeviation = totalDeviation / (points.length - 2);
  result.straightLineDeviation = averageDeviation;

  // Check if deviation is within threshold
  if (maxDeviation > SLASH_PATTERN.straightLineMaxDeviation * 2) {
    // Max deviation too high
    return result;
  }

  if (averageDeviation > SLASH_PATTERN.straightLineMaxDeviation) {
    return result;
  }

  // Calculate confidence based on deviation and length
  const deviationConfidence = 1 - (averageDeviation / SLASH_PATTERN.straightLineMaxDeviation);
  const lengthConfidence = clamp(
    (lineLength - SLASH_PATTERN.straightLineMinLength) / SLASH_PATTERN.straightLineMinLength,
    0,
    1
  );

  result.pattern = SlashPatternType.STRAIGHT;
  result.confidence = (deviationConfidence * 0.7) + (lengthConfidence * 0.3);

  // Calculate center point of the line
  result.center = {
    x: (firstPoint.x + lastPoint.x) / 2,
    y: (firstPoint.y + lastPoint.y) / 2,
  };

  return result;
}

/**
 * Main pattern detection function
 * Attempts to detect all patterns and returns the best match
 * Priority: Circle > Zigzag > Straight (based on complexity)
 */
export function detectSlashPattern(
  points: SlashPatternPoint[]
): SlashPatternResult {
  if (points.length < SLASH_PATTERN.minPointsForDetection) {
    return {
      pattern: SlashPatternType.NONE,
      confidence: 0,
      points: points,
    };
  }

  // Try to detect each pattern
  const circleResult = detectCirclePattern(points);
  const zigzagResult = detectZigzagPattern(points);
  const straightResult = detectStraightPattern(points);

  // Find the pattern with highest confidence
  const results = [circleResult, zigzagResult, straightResult];
  let bestResult: SlashPatternResult = {
    pattern: SlashPatternType.NONE,
    confidence: 0,
    points: points,
  };

  for (const result of results) {
    if (result.pattern !== SlashPatternType.NONE && result.confidence > bestResult.confidence) {
      bestResult = result;
    }
  }

  return bestResult;
}

/**
 * Check if a pattern detection result is valid
 * Used to filter out low-confidence detections
 */
export function isValidPattern(result: SlashPatternResult, minConfidence: number = 0.5): boolean {
  return result.pattern !== SlashPatternType.NONE && result.confidence >= minConfidence;
}
