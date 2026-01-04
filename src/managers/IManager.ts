/**
 * Manager Interface
 * Defines common interface for all game managers
 */

export interface IManager {
  /**
   * Initialize manager
   * @param scene - Optional scene reference
   */
  initialize(scene?: Phaser.Scene): void | Promise<void>;

  /**
   * Reset manager to initial state
   */
  reset(): void;

  /**
   * Cleanup and destroy manager resources
   */
  shutdown(): void;
}
