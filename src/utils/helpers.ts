 
/**
 * Helper Utilities
 *
 * Common utility functions used throughout the game.
 */

import type Phaser from 'phaser';

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
  y2: number,
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
  circleRadius: number,
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
  gravity: number,
): { x: number; y: number } {
  // Calculate vertical velocity to reach peak height
  const heightDiff = startY - peakY;

  // Guard against division by zero
  if (heightDiff <= 0) {
    return { x: 0, y: -Math.sqrt(gravity * 100) }; // Minimum velocity
  }

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
  ms: number,
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
  path: string,
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
  path: string,
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
    navigator.userAgent,
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
    Math.round(lerp(rgb1.b, rgb2.b, t)),
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
  lineEnd: { x: number; y: number },
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
  epsilon: number,
): T[] {
  if (points.length <3) {
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
  p2: { x: number; y: number },
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
  points: SlashPatternPoint[],
): SlashPatternResult {
  const result: SlashPatternResult = {
    pattern: SlashPatternType.NONE,
    type: SlashPatternType.NONE,
    confidence: 0,
    difficulty: 0,
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
    firstPoint.x,
    firstPoint.y,
    lastPoint.x,
    lastPoint.y,
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
    varianceSum += (dist - meanRadius) ** 2;
  }
  const variance = varianceSum / distances.length;

  // Calculate confidence (lower variance = higher confidence)
  const radiusDeviation = Math.sqrt(variance);
  const radiusDevPercent = radiusDeviation / meanRadius;

  if (radiusDevPercent < SLASH_PATTERN.circleVarianceThreshold) {
    result.pattern = SlashPatternType.CIRCLE;
    result.type = SlashPatternType.CIRCLE;
    result.difficulty = 3;
    result.confidence = Math.max(0, 1 - radiusDevPercent / SLASH_PATTERN.circleVarianceThreshold);
  }

  return result;
}

/**
 * Detect if points form a horizontal line pattern
 * Criteria:
 * - Points form a generally horizontal line
 * - Minimum length threshold met
 */
export function detectHorizontalLinePattern(
  points: SlashPatternPoint[],
): SlashPatternResult {
  const result: SlashPatternResult = {
    pattern: SlashPatternType.NONE,
    type: SlashPatternType.NONE,
    confidence: 0,
    difficulty: 0,
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

  // Calculate line angle
  const angle = angleBetweenPoints(firstPoint, lastPoint);
  const normalizedAngle = angle < 0 ? angle + 360 : angle;

  // Check if roughly horizontal (0-30 degrees or 150-210 degrees)
  const isHorizontal =
    (normalizedAngle < SLASH_PATTERN.horizontalAngleTolerance) ||
    (normalizedAngle > 180 - SLASH_PATTERN.horizontalAngleTolerance &&
      normalizedAngle < 180 + SLASH_PATTERN.horizontalAngleTolerance) ||
    (normalizedAngle > 360 - SLASH_PATTERN.horizontalAngleTolerance);

  if (!isHorizontal) {
    return result;
  }

  // Calculate path length
  const length = pathLength(points);

  if (length < SLASH_PATTERN.horizontalMinLength) {
    return result;
  }

  // Calculate deviation from the best-fit horizontal line
  let deviationSum = 0;
  const avgY = (firstPoint.y + lastPoint.y) / 2;

  for (const point of points) {
    deviationSum += Math.abs(point.y - avgY);
  }

  const avgDeviation = deviationSum / points.length;
  const maxDeviation = Math.max(
    Math.abs(firstPoint.y - avgY),
    Math.abs(lastPoint.y - avgY),
  );

  // Confidence based on deviation (lower = better)
  const deviationThreshold = SLASH_PATTERN.horizontalVarianceThreshold * length;
  if (maxDeviation <= deviationThreshold) {
    result.pattern = SlashPatternType.HORIZONTAL;
    result.type = SlashPatternType.HORIZONTAL;
    result.difficulty = 1;
    result.confidence = Math.max(
      0,
      1 - (avgDeviation / deviationThreshold) * 0.5,
    );
  }

  return result;
}

/**
 * Detect if points form a vertical line pattern
 * Criteria:
 * - Points form a generally vertical line
 * - Minimum length threshold met
 */
export function detectVerticalLinePattern(
  points: SlashPatternPoint[],
): SlashPatternResult {
  const result: SlashPatternResult = {
    pattern: SlashPatternType.NONE,
    type: SlashPatternType.NONE,
    confidence: 0,
    difficulty: 0,
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

  // Calculate line angle
  const angle = angleBetweenPoints(firstPoint, lastPoint);
  const normalizedAngle = angle < 0 ? angle + 360 : angle;

  // Check if roughly vertical (60-120 degrees or 240-300 degrees)
  const isVertical =
    (normalizedAngle > 90 - SLASH_PATTERN.verticalAngleTolerance &&
      normalizedAngle < 90 + SLASH_PATTERN.verticalAngleTolerance) ||
    (normalizedAngle > 270 - SLASH_PATTERN.verticalAngleTolerance &&
      normalizedAngle < 270 + SLASH_PATTERN.verticalAngleTolerance);

  if (!isVertical) {
    return result;
  }

  // Calculate path length
  const length = pathLength(points);

  if (length < SLASH_PATTERN.verticalMinLength) {
    return result;
  }

  // Calculate deviation from the best-fit vertical line
  let deviationSum = 0;
  const avgX = (firstPoint.x + lastPoint.x) / 2;

  for (const point of points) {
    deviationSum += Math.abs(point.x - avgX);
  }

  const avgDeviation = deviationSum / points.length;
  const maxDeviation = Math.max(
    Math.abs(firstPoint.x - avgX),
    Math.abs(lastPoint.x - avgX),
  );

  // Confidence based on deviation (lower = better)
  const deviationThreshold = SLASH_PATTERN.verticalVarianceThreshold * length;
  if (maxDeviation <= deviationThreshold) {
    result.pattern = SlashPatternType.VERTICAL;
    result.type = SlashPatternType.VERTICAL;
    result.difficulty = 1;
    result.confidence = Math.max(
      0,
      1 - (avgDeviation / deviationThreshold) * 0.5,
    );
  }

  return result;
}

/**
 * Detect if points form a diagonal slash pattern (top-left to bottom-right)
 */
export function detectSlashDownPattern(
  points: SlashPatternPoint[],
): SlashPatternResult {
  const result: SlashPatternResult = {
    pattern: SlashPatternType.NONE,
    type: SlashPatternType.NONE,
    confidence: 0,
    difficulty: 0,
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

  // Calculate line angle
  const angle = angleBetweenPoints(firstPoint, lastPoint);
  const normalizedAngle = angle < 0 ? angle + 360 : angle;

  // Check if roughly diagonal (315-45 degrees or similar range)
  const isDiagonal =
    (normalizedAngle > 360 - SLASH_PATTERN.slashAngleTolerance) ||
    (normalizedAngle < SLASH_PATTERN.slashAngleTolerance) ||
    (normalizedAngle > 180 - SLASH_PATTERN.slashAngleTolerance &&
      normalizedAngle < 180 + SLASH_PATTERN.slashAngleTolerance);

  if (!isDiagonal) {
    return result;
  }

  // Must go from top-left to bottom-right or vice versa
  const dx = lastPoint.x - firstPoint.x;
  const dy = lastPoint.y - firstPoint.y;

  if ((dx > 0 && dy > 0) || (dx < 0 && dy < 0)) {
    // This is a valid slash-down pattern
    const length = pathLength(points);

    if (length >= SLASH_PATTERN.slashMinLength) {
      result.pattern = SlashPatternType.SLASH_DOWN;
      result.type = SlashPatternType.SLASH_DOWN;
      result.difficulty = 2;
      result.confidence = 0.8;
    }
  }

  return result;
}

/**
 * Detect if points form a diagonal slash pattern (top-right to bottom-left)
 */
export function detectSlashUpPattern(
  points: SlashPatternPoint[],
): SlashPatternResult {
  const result: SlashPatternResult = {
    pattern: SlashPatternType.NONE,
    type: SlashPatternType.NONE,
    confidence: 0,
    difficulty: 0,
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

  // Calculate line angle
  const angle = angleBetweenPoints(firstPoint, lastPoint);
  const normalizedAngle = angle < 0 ? angle + 360 : angle;

  // Check if roughly diagonal (135-225 degrees range)
  const isDiagonal =
    normalizedAngle > 135 - SLASH_PATTERN.slashAngleTolerance &&
    normalizedAngle < 225 + SLASH_PATTERN.slashAngleTolerance;

  if (!isDiagonal) {
    return result;
  }

  // Must go from top-right to bottom-left or vice versa
  const dx = lastPoint.x - firstPoint.x;
  const dy = lastPoint.y - firstPoint.y;

  if ((dx < 0 && dy > 0) || (dx > 0 && dy < 0)) {
    // This is a valid slash-up pattern
    const length = pathLength(points);

    if (length >= SLASH_PATTERN.slashMinLength) {
      result.pattern = SlashPatternType.SLASH_UP;
      result.type = SlashPatternType.SLASH_UP;
      result.difficulty = 2;
      result.confidence = 0.8;
    }
  }

  return result;
}

/**
 * Recognize a pattern from an array of points
 * Tests against all known patterns and returns the best match
 */
export function recognizeSlashPattern(
  points: SlashPatternPoint[],
): SlashPatternResult {
  // Simplify the path first
  const simplifiedPoints = douglasPeucker(points, SLASH_PATTERN.simplificationEpsilon);

  if (simplifiedPoints.length < SLASH_PATTERN.minPointsForDetection) {
    return {
      pattern: SlashPatternType.NONE,
      type: SlashPatternType.NONE,
      confidence: 0,
      difficulty: 0,
      points: points,
    };
  }

  // Test all patterns
  const patterns: SlashPatternResult[] = [
    detectCirclePattern(simplifiedPoints),
    detectHorizontalLinePattern(simplifiedPoints),
    detectVerticalLinePattern(simplifiedPoints),
    detectSlashDownPattern(simplifiedPoints),
    detectSlashUpPattern(simplifiedPoints),
  ];

  // Return the pattern with highest confidence
  let bestPattern = patterns[0];
  if (!bestPattern) {
    return {
      pattern: SlashPatternType.NONE,
      type: SlashPatternType.NONE,
      confidence: 0,
      difficulty: 0,
      points: points,
    };
  }

  for (const pattern of patterns) {
    if (pattern.confidence > bestPattern.confidence) {
      bestPattern = pattern;
    }
  }

  return bestPattern;
}

/**
 * Detect slash pattern (wrapper for recognizeSlashPattern)
 * Used by SlashSystem
 */
export function detectSlashPattern(
  points: SlashPatternPoint[],
): SlashPatternResult {
  return recognizeSlashPattern(points);
}

/**
 * Check if a pattern type is valid (not NONE)
 */
export function isValidPattern(pattern: SlashPatternType): boolean {
  return pattern !== SlashPatternType.NONE;
}