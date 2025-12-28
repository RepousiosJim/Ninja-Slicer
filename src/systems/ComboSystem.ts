/**
 * ComboSystem
 * 
 * Tracks combo count and multiplier for consecutive monster slices.
 * Combo resets after a timeout or when a villager is sliced.
 */

import { COMBO_TIMEOUT, COMBO_MULTIPLIER_RATE } from '@config/constants';
import { EventBus } from '@utils/EventBus';

export class ComboSystem {
  private combo: number = 0;
  private comboTimer: number = 0;
  private multiplier: number = 1.0;
  private maxCombo: number = 0;

  /**
   * Increment combo count and reset timer
   */
  increment(): void {
    this.combo++;
    this.comboTimer = COMBO_TIMEOUT * 1000; // Convert to ms
    this.updateMultiplier();
    
    // Track max combo
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }
    
    // Emit combo updated event
    EventBus.emit('combo-updated', {
      count: this.combo,
      multiplier: this.multiplier,
    });
  }

  /**
   * Reset combo to 0
   */
  reset(): void {
    this.combo = 0;
    this.comboTimer = 0;
    this.multiplier = 1.0;
    
    // Emit combo updated event
    EventBus.emit('combo-updated', {
      count: this.combo,
      multiplier: this.multiplier,
    });
  }

  /**
   * Update combo timer and reset if expired
   * @param time - Current time
   * @param delta - Time since last update (ms)
   */
  update(time: number, delta: number): void {
    if (this.combo > 0) {
      this.comboTimer -= delta;
      
      if (this.comboTimer <= 0) {
        this.reset();
      }
    }
  }

  /**
   * Update multiplier based on current combo
   */
  private updateMultiplier(): void {
    this.multiplier = 1 + (this.combo * COMBO_MULTIPLIER_RATE);
  }

  /**
   * Get current combo count
   */
  getCombo(): number {
    return this.combo;
  }

  /**
   * Get current multiplier
   */
  getMultiplier(): number {
    return this.multiplier;
  }

  /**
   * Get remaining combo time in seconds
   */
  getRemainingTime(): number {
    return Math.max(0, this.comboTimer / 1000);
  }

  /**
   * Check if combo is active
   */
  isActive(): boolean {
    return this.combo > 0;
  }

  /**
   * Get max combo achieved
   */
  getMaxCombo(): number {
    return this.maxCombo;
  }

  /**
   * Reset max combo (call when starting new game)
   */
  resetMaxCombo(): void {
    this.maxCombo = 0;
  }
}
