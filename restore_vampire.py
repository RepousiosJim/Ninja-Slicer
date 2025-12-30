import os

vampire_content = """import Phaser from 'phaser';
import { Monster } from './Monster';
import { VILLAGER_HITBOX_RADIUS, SCREEN_BOTTOM_Y } from '@config/constants';
import { debugWarn } from '@utils/DebugLogger';

/**
 * Vampire
 * 
 * A vampire monster that splits into two halves when hit.
 * Each half can spawn bats when destroyed.
 */
export class Vampire extends Monster {
  private halfCleanupTimer?: Phaser.Time.TimerEvent;
  private batCleanupTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'vampire', 100, 1.2);
  }

  /**
   * Handle being hit by a slash
   */
  hit(): void {
    if (this.isDead) return;

    this.health -= 1;

    if (this.health <= 0) {
      this.die();
    } else {
      // Flash red when hit
      this.setTint(0xff0000);
      this.scene.time.delayedCall(100, () => {
        this.clearTint();
      });
    }
  }

  /**
   * Handle death - split into halves
   */
  die(): void {
    if (this.isDead) return;
    this.isDead = true;

    // Create two halves
    this.createHalves();

    // Destroy original
    this.destroy();
  }

  /**
   * Create two vampire halves that fall apart
   */
  private createHalves(): void {
    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;

    // Left half
    const leftHalf = this.scene.add.sprite(
      this.x - halfWidth / 2,
      this.y,
      'vampire_left_half'
    );
    leftHalf.setVelocity(-100, -200);
    leftHalf.setAngularVelocity(-200);

    // Right half
    const rightHalf = this.scene.add.sprite(
      this.x + halfWidth / 2,
      this.y,
      'vampire_right_half'
    );
    rightHalf.setVelocity(100, -200);
    rightHalf.setAngularVelocity(200);

    // Cleanup halves after they fall off screen
    this.halfCleanupTimer = this.scene.time.delayedCall(2000, () => {
      leftHalf.destroy();
      rightHalf.destroy();
    });

    // Spawn bats from each half
    this.spawnBats(leftHalf.x, leftHalf.y);
    this.spawnBats(rightHalf.x, rightHalf.y);
  }

  /**
   * Spawn bats from a vampire half
   */
  private spawnBats(x: number, y: number): void {
    const batCount = Phaser.Math.Between(2, 4);

    for (let i = 0; i < batCount; i++) {
      const bat = this.scene.add.sprite(x, y, 'vampire_bat');
      const angle = Phaser.Math.Between(0, 360);
      const speed = Phaser.Math.Between(100, 200);

      bat.setVelocity(
        Math.cos(angle * Math.PI / 180) * speed,
        Math.sin(angle * Math.PI / 180) * speed - 100
      );

      // Cleanup bats after they fly off screen
      this.batCleanupTimer = this.scene.time.delayedCall(3000, () => {
        bat.destroy();
      });
    }
  }

  /**
   * Check if villager is within hitbox radius
   */
  checkVillagerCollision(villagerX: number, villagerY: number): boolean {
    const dx = this.x - villagerX;
    const dy = this.y - villagerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < VILLAGER_HITBOX_RADIUS;
  }

  /**
   * Check if power-up is within hitbox radius
   */
  checkPowerUpCollision(powerUpX: number, powerUpY: number): boolean {
    const dx = this.x - powerUpX;
    const dy = this.y - powerUpY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < VILLAGER_HITBOX_RADIUS;
  }

  /**
   * Clean up timers when destroyed
   */
  destroy(): void {
    if (this.halfCleanupTimer) {
      this.halfCleanupTimer.destroy();
    }
    if (this.batCleanupTimer) {
      this.batCleanupTimer.destroy();
    }
    super.destroy();
  }
}
"""

filepath = 'src/entities/Vampire.ts'
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(vampire_content)
print(f'Restored: {filepath}')
