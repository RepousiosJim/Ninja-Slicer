/**
 * MonsterFactory
 * 
 * Factory pattern for creating monsters based on type.
 * Follows the Open/Closed principle - easy to extend with new monster types.
 */

import { Monster } from './Monster';
import { Zombie } from './Zombie';
import { Vampire } from './Vampire';
import { Ghost } from './Ghost';
import { MonsterType } from '@config/types';

/**
 * Monster Factory
 * Creates monsters using a factory pattern for easy extensibility
 */
export class MonsterFactory {
  private static readonly monsterTypes = new Map<MonsterType, new (scene: Phaser.Scene, x: number, y: number) => Monster>([
    [MonsterType.ZOMBIE, Zombie],
    [MonsterType.VAMPIRE, Vampire],
    [MonsterType.GHOST, Ghost],
  ]);

  /**
   * Create a monster of the specified type
   * @param type - The type of monster to create
   * @param scene - The scene to add the monster to
   * @param x - X position
   * @param y - Y position
   * @returns The created monster instance
   */
  static create(
    type: MonsterType,
    scene: Phaser.Scene,
    x: number,
    y: number,
  ): Monster {
    const MonsterClass = this.monsterTypes.get(type) || Zombie;
    return new MonsterClass(scene, x, y);
  }

  /**
   * Check if a monster type is registered
   * @param type - The type to check
   * @returns true if the type is registered
   */
  static isRegistered(type: MonsterType): boolean {
    return this.monsterTypes.has(type);
  }

  /**
   * Get all registered monster types
   * @returns Array of registered monster types
   */
  static getRegisteredTypes(): MonsterType[] {
    return Array.from(this.monsterTypes.keys());
  }
}
