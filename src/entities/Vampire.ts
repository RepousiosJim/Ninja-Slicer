import Phaser from 'phaser';
import { Monster } from './Monster';
import { MonsterType } from '@config/types';
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
    super(scene, x, y, 'vampire', MonsterType.VAMPIRE);
  }

  /**
   * Override getBaseHealth to return vampire's health
   */
  protected getBaseHealth(): number {
    return 100;
  }

  /**
   * Handle being hit by a slash
   */
  hit(): void {
    if (this.isSliced) return;

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
    if (this.isSliced) return;
    this.isSliced = true;

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

    // Left half - use physics sprite
    const leftHalf = this.scene.physics.add.sprite(
      this.x - halfWidth / 2,
      this.y,
      'vampire_left_half',
    );
    leftHalf.setVelocity(-100, -200);
    leftHalf.setAngularVelocity(-200);

    // Right half - use physics sprite
    const rightHalf = this.scene.physics.add.sprite(
      this.x + halfWidth / 2,
      this.y,
      'vampire_right_half',
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
      const bat = this.scene.physics.add.sprite(x, y, 'vampire_bat');
      const batId = Math.random().toString(36).substring(7);
      const angle = Phaser.Math.Between(0, 360);
      const speed = Phaser.Math.Between(100, 200);

      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/8ea8323a-27ad-4ad1-b78f-c78ad315149e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Vampire.ts:108',message:'Creating bat and timer',data:{batId, i, batCount, currentTimer: this.batCleanupTimer ? 'exists' : 'null'},timestamp:Date.now(),sessionId:'vampire-leak-debug', hypothesisId: 'A'})}).catch(()=>{});
      // #endregion

      bat.setVelocity(
        Math.cos(angle * Math.PI / 180) * speed,
        Math.sin(angle * Math.PI / 180) * speed - 100,
      );

      // Cleanup bats after they fly off screen
      this.batCleanupTimer = this.scene.time.delayedCall(3000, () => {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/8ea8323a-27ad-4ad1-b78f-c78ad315149e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Vampire.ts:117',message:'Bat cleanup callback firing',data:{batId},timestamp:Date.now(),sessionId:'vampire-leak-debug', hypothesisId: 'B'})}).catch(()=>{});
        // #endregion
        bat.destroy();
      });
      
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/8ea8323a-27ad-4ad1-b78f-c78ad315149e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Vampire.ts:123',message:'Timer reassigned',data:{batId, newTimerId: (this.batCleanupTimer as any)?.id || 'unknown'},timestamp:Date.now(),sessionId:'vampire-leak-debug', hypothesisId: 'A'})}).catch(()=>{});
      // #endregion
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
  destroy(fromScene?: boolean): void {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/8ea8323a-27ad-4ad1-b78f-c78ad315149e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Vampire.ts:153',message:'Vampire destroy called',data:{hasHalfTimer: !!this.halfCleanupTimer, hasBatTimer: !!this.batCleanupTimer},timestamp:Date.now(),sessionId:'vampire-leak-debug', hypothesisId: 'C'})}).catch(()=>{});
    // #endregion
    if (this.halfCleanupTimer) {
      this.halfCleanupTimer.destroy();
    }
    if (this.batCleanupTimer) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/8ea8323a-27ad-4ad1-b78f-c78ad315149e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Vampire.ts:161',message:'Cleaning up batCleanupTimer',data:{timerId: (this.batCleanupTimer as any)?.id || 'unknown'},timestamp:Date.now(),sessionId:'vampire-leak-debug', hypothesisId: 'C'})}).catch(()=>{});
      // #endregion
      this.batCleanupTimer.destroy();
    }
    super.destroy(fromScene);
  }
}
