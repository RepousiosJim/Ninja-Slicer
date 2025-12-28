/**
 * Test Weapon Scene
 *
 * Allows players to test weapons in a simplified environment
 * with dummy enemies and real-time feedback.
 */

import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, FONT_SIZES } from '../config/constants';
import { Button, ButtonStyle } from '../ui/Button';
import { SaveManager } from '../managers/SaveManager';
import { WeaponManager } from '../managers/WeaponManager';
import { AudioManager } from '../managers/AudioManager';
import { WeaponConfig } from '../config/types';

/**
 * Test results interface
 */
interface TestResults {
  damageDealt: number;
  comboCount: number;
  hits: number;
  misses: number;
  accuracy: number;
  testDuration: number;
}

/**
 * Dummy enemy for testing
 */
class DummyEnemy extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Sprite;
  private healthBar: Phaser.GameObjects.Rectangle;
  private healthBarBg: Phaser.GameObjects.Rectangle;
  private health: number = 100;
  private maxHealth: number = 100;
  private isHit: boolean = false;
  private hitFlashTimer: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    // Create enemy sprite (use ghost as dummy)
    this.sprite = scene.add.sprite(0, 0, 'ghost');
    this.sprite.setScale(0.8);
    this.add(this.sprite);

    // Create health bar background
    this.healthBarBg = scene.add.rectangle(0, -60, 80, 10, 0x333333);
    this.add(this.healthBarBg);

    // Create health bar
    this.healthBar = scene.add.rectangle(0, -60, 80, 10, 0x44ff44);
    this.add(this.healthBar);

    // Add floating animation
    scene.tweens.add({
      targets: this,
      y: y + Phaser.Math.Between(-10, 10),
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    scene.add.existing(this);
  }

  /**
   * Take damage
   */
  public takeDamage(damage: number): boolean {
    this.health = Math.max(0, this.health - damage);
    this.updateHealthBar();
    this.triggerHitEffect();

    return this.health <= 0;
  }

  /**
   * Update health bar
   */
  private updateHealthBar(): void {
    const healthPercent = this.health / this.maxHealth;
    this.healthBar.width = 80 * healthPercent;

    // Change color based on health
    if (healthPercent > 0.5) {
      this.healthBar.fillColor = 0x44ff44;
    } else if (healthPercent > 0.25) {
      this.healthBar.fillColor = 0xffff44;
    } else {
      this.healthBar.fillColor = 0xff4444;
    }
  }

  /**
   * Trigger hit effect
   */
  private triggerHitEffect(): void {
    this.isHit = true;
    this.hitFlashTimer = 10;

    // Flash red
    this.sprite.setTint(0xff0000);

    // Shake effect
    this.scene.tweens.add({
      targets: this,
      x: this.x + Phaser.Math.Between(-5, 5),
      duration: 50,
      yoyo: true,
      repeat: 3,
    });
  }

  /**
   * Update
   */
  public update(): void {
    if (this.isHit) {
      this.hitFlashTimer--;
      if (this.hitFlashTimer <= 0) {
        this.isHit = false;
        this.sprite.clearTint();
      }
    }
  }

  /**
   * Reset health
   */
  public reset(): void {
    this.health = this.maxHealth;
    this.updateHealthBar();
    this.sprite.clearTint();
    this.isHit = false;
  }

  /**
   * Get current health
   */
  public getHealth(): number {
    return this.health;
  }
}

/**
 * Test Weapon Scene
 */
export class TestWeaponScene extends Phaser.Scene {
  // UI elements
  private headerContainer: Phaser.GameObjects.Container | null = null;
  private statsContainer: Phaser.GameObjects.Container | null = null;
  private resultsContainer: Phaser.GameObjects.Container | null = null;
  private exitButton: Button | null = null;
  private resetButton: Button | null = null;

  // Test elements
  private weaponPreview: Phaser.GameObjects.Sprite | null = null;
  private dummyEnemies: DummyEnemy[] = [];

  // Test state
  private testActive: boolean = false;
  private testStartTime: number = 0;
  private testResults: TestResults = {
    damageDealt: 0,
    comboCount: 0,
    hits: 0,
    misses: 0,
    accuracy: 0,
    testDuration: 0,
  };
  private currentCombo: number = 0;
  private lastHitTime: number = 0;

  // Managers
  private saveManager: SaveManager;
  private weaponManager: WeaponManager;
  private audioManager: AudioManager;

  // Weapon data
  private testWeapon: WeaponConfig | null = null;
  private testTier: number = 1;

  constructor() {
    super({ key: 'TestWeaponScene' });
    this.saveManager = new SaveManager();
    this.weaponManager = WeaponManager.getInstance();
    this.audioManager = new AudioManager(this);
  }

  /**
   * Create scene
   */
  public create(): void {
    // Load test weapon data
    this.loadTestWeaponData();

    // Create background
    this.createBackground();

    // Create header
    this.createHeader();

    // Create test area
    this.createTestArea();

    // Create stats display
    this.createStatsDisplay();

    // Create action buttons
    this.createActionButtons();

    // Setup input handling
    this.setupInputHandling();

    // Start test
    this.startTest();
  }

  /**
   * Load test weapon data
   */
  private loadTestWeaponData(): void {
    const saveData = this.saveManager.getSaveData();
    const equippedWeaponId = saveData.equippedWeapon as any;
    this.testWeapon = this.weaponManager.getWeaponConfig(equippedWeaponId) || null;
    this.testTier = saveData.weaponTiers[equippedWeaponId] || 1;
  }

  /**
   * Create background
   */
  private createBackground(): void {
    const background = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width,
      this.cameras.main.height,
      0x1a1a2e
    );

    // Add grid pattern
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x2a2a4a, 0.3);

    for (let x = 0; x < this.cameras.main.width; x += 50) {
      graphics.moveTo(x, 0);
      graphics.lineTo(x, this.cameras.main.height);
    }

    for (let y = 0; y < this.cameras.main.height; y += 50) {
      graphics.moveTo(0, y);
      graphics.lineTo(this.cameras.main.width, y);
    }

    graphics.strokePath();
  }

  /**
   * Create header
   */
  private createHeader(): void {
    this.headerContainer = this.add.container(this.cameras.main.width / 2, 50);

    // Title
    const title = this.add.text(0, 0, 'WEAPON TEST MODE', {
      fontSize: `${FONT_SIZES.title}px`,
      color: '#FFFFFF',
      fontStyle: 'bold',
      stroke: '#8b0000',
      strokeThickness: 6,
    });
    title.setOrigin(0.5);
    this.headerContainer.add(title);

    // Weapon name
    if (this.testWeapon) {
      const weaponName = this.add.text(0, 40, `${this.testWeapon.name} (Tier ${this.testTier})`, {
        fontSize: `${FONT_SIZES.medium}px`,
        color: '#ffd700',
        fontStyle: 'bold',
      });
      weaponName.setOrigin(0.5);
      this.headerContainer.add(weaponName);
    }

    // Instructions
    const instructions = this.add.text(0, 80, 'Click or tap to slash enemies', {
      fontSize: '16px',
      color: '#CCCCCC',
    });
    instructions.setOrigin(0.5);
    this.headerContainer.add(instructions);

    this.add.existing(this.headerContainer);
  }

  /**
   * Create test area
   */
  private createTestArea(): void {
    // Create weapon preview
    if (this.testWeapon) {
      this.weaponPreview = this.add.sprite(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2 - 50,
        this.testWeapon.id
      );
      this.weaponPreview.setScale(1.5);
      this.weaponPreview.setAlpha(0.3);

      // Add floating animation
      this.tweens.add({
        targets: this.weaponPreview,
        y: this.weaponPreview.y + 10,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Create dummy enemies
    const enemyPositions = [
      { x: this.cameras.main.width / 2 - 200, y: this.cameras.main.height / 2 + 100 },
      { x: this.cameras.main.width / 2, y: this.cameras.main.height / 2 + 100 },
      { x: this.cameras.main.width / 2 + 200, y: this.cameras.main.height / 2 + 100 },
    ];

    enemyPositions.forEach(pos => {
      const enemy = new DummyEnemy(this, pos.x, pos.y);
      this.dummyEnemies.push(enemy);
    });
  }

  /**
   * Create stats display
   */
  private createStatsDisplay(): void {
    this.statsContainer = this.add.container(100, this.cameras.main.height / 2);

    const stats = [
      { label: 'Damage', value: '0', key: 'damageDealt' },
      { label: 'Combo', value: '0', key: 'comboCount' },
      { label: 'Hits', value: '0', key: 'hits' },
      { label: 'Misses', value: '0', key: 'misses' },
      { label: 'Accuracy', value: '0%', key: 'accuracy' },
    ];

    stats.forEach((stat, index) => {
      const y = index * 40;

      // Label
      const label = this.add.text(-50, y, stat.label, {
        fontSize: '14px',
        color: '#CCCCCC',
      });
      label.setOrigin(0, 0.5);
      if (this.statsContainer) {
        this.statsContainer.add(label);
      }

      // Value
      const value = this.add.text(50, y, stat.value, {
        fontSize: '16px',
        color: '#FFFFFF',
        fontStyle: 'bold',
      });
      value.setOrigin(1, 0.5);
      if (this.statsContainer) {
        this.statsContainer.add(value);
      }

      // Store reference for updates
      (this.statsContainer as any)[stat.key] = value;
    });

    this.add.existing(this.statsContainer);
  }

  /**
   * Create action buttons
   */
  private createActionButtons(): void {
    // Reset button
    this.resetButton = new Button(
      this,
      this.cameras.main.width / 2 - 100,
      this.cameras.main.height - 60,
      150,
      40,
      'RESET',
      {
        style: ButtonStyle.SECONDARY,
        fontSize: FONT_SIZES.small,
        onClick: this.onReset.bind(this),
      }
    );
    this.add.existing(this.resetButton);

    // Exit button
    this.exitButton = new Button(
      this,
      this.cameras.main.width / 2 + 100,
      this.cameras.main.height - 60,
      150,
      40,
      'EXIT TEST',
      {
        style: ButtonStyle.PRIMARY,
        fontSize: FONT_SIZES.small,
        onClick: this.onExit.bind(this),
      }
    );
    this.add.existing(this.exitButton);
  }

  /**
   * Setup input handling
   */
  private setupInputHandling(): void {
    this.input.on('pointerdown', this.onPointerDown.bind(this));
  }

  /**
   * Start test
   */
  private startTest(): void {
    this.testActive = true;
    this.testStartTime = Date.now();
    this.resetTestResults();
  }

  /**
   * Reset test results
   */
  private resetTestResults(): void {
    this.testResults = {
      damageDealt: 0,
      comboCount: 0,
      hits: 0,
      misses: 0,
      accuracy: 0,
      testDuration: 0,
    };
    this.currentCombo = 0;
    this.lastHitTime = 0;

    // Reset enemies
    this.dummyEnemies.forEach(enemy => enemy.reset());

    // Update display
    this.updateStatsDisplay();
  }

  /**
   * Handle pointer down (slash)
   */
  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (!this.testActive) return;

    // Create slash effect
    this.createSlashEffect(pointer);

    // Check for hits
    let hit = false;
    this.dummyEnemies.forEach(enemy => {
      const distance = Phaser.Math.Distance.Between(
        pointer.x,
        pointer.y,
        enemy.x,
        enemy.y
      );

      if (distance < 80) {
        // Hit!
        hit = true;
        this.handleHit(enemy);
      }
    });

    if (!hit) {
      this.handleMiss();
    }

    // Update combo
    this.updateCombo();
  }

  /**
   * Create slash effect
   */
  private createSlashEffect(pointer: Phaser.Input.Pointer): void {
    if (!this.testWeapon) return;

    // Create simple slash line
    const graphics = this.add.graphics();
    graphics.lineStyle(4, this.getWeaponColor(), 1);
    graphics.beginPath();
    graphics.moveTo(pointer.x - 30, pointer.y - 30);
    graphics.lineTo(pointer.x + 30, pointer.y + 30);
    graphics.strokePath();

    // Fade out
    this.tweens.add({
      targets: graphics,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        graphics.destroy();
      },
    });

    // Play slash sound
    this.audioManager.playSFX('uiClick');
  }

  /**
   * Get weapon color for effects
   */
  private getWeaponColor(): number {
    if (!this.testWeapon) return 0xffffff;

    if (this.testWeapon.id.includes('fire')) return 0xff4400;
    if (this.testWeapon.id.includes('ice')) return 0x44aaff;
    if (this.testWeapon.id.includes('lightning')) return 0xffff00;
    if (this.testWeapon.id.includes('holy')) return 0xffd700;

    return 0xffffff;
  }

  /**
   * Handle hit
   */
  private handleHit(enemy: DummyEnemy): void {
    // Calculate damage
    const tierData = this.testWeapon?.tiers[this.testTier - 1];
    const damage = tierData?.effects[0]?.value || 10;

    // Apply damage
    const killed = enemy.takeDamage(damage);

    // Update stats
    this.testResults.damageDealt += damage;
    this.testResults.hits++;
    this.currentCombo++;
    this.lastHitTime = Date.now();

    // Update combo count
    if (this.currentCombo > this.testResults.comboCount) {
      this.testResults.comboCount = this.currentCombo;
    }

    // Create hit effect
    this.createHitEffect(enemy.x, enemy.y);

    // Update display
    this.updateStatsDisplay();

    // Respawn enemy if killed
    if (killed) {
      this.time.delayedCall(1000, () => {
        enemy.reset();
      });
    }
  }

  /**
   * Handle miss
   */
  private handleMiss(): void {
    this.testResults.misses++;
    this.currentCombo = 0;

    // Update display
    this.updateStatsDisplay();
  }

  /**
   * Update combo
   */
  private updateCombo(): void {
    // Reset combo if too much time has passed
    const now = Date.now();
    if (now - this.lastHitTime > 2000) {
      this.currentCombo = 0;
    }
  }

  /**
   * Create hit effect
   */
  private createHitEffect(x: number, y: number): void {
    // Create particle burst
    const particles = this.add.particles(x, y, 'ui_soul_icon', {
      speed: { min: 50, max: 150 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 500,
      quantity: 10,
      blendMode: 'ADD',
      tint: this.getWeaponColor(),
    });

    // Auto-destroy after particles are done
    this.time.delayedCall(600, () => {
      particles.destroy();
    });
  }

  /**
   * Update stats display
   */
  private updateStatsDisplay(): void {
    if (!this.statsContainer) return;

    const totalAttempts = this.testResults.hits + this.testResults.misses;
    const accuracy = totalAttempts > 0 ? Math.round((this.testResults.hits / totalAttempts) * 100) : 0;

    (this.statsContainer as any).damageDealt.setText(this.testResults.damageDealt.toString());
    (this.statsContainer as any).comboCount.setText(this.testResults.comboCount.toString());
    (this.statsContainer as any).hits.setText(this.testResults.hits.toString());
    (this.statsContainer as any).misses.setText(this.testResults.misses.toString());
    (this.statsContainer as any).accuracy.setText(`${accuracy}%`);
  }

  /**
   * Handle reset button click
   */
  private onReset(): void {
    this.audioManager.playSFX('uiClick');
    this.resetTestResults();
  }

  /**
   * Handle exit button click
   */
  private onExit(): void {
    this.audioManager.playSFX('uiClick');

    // Calculate final test duration
    this.testResults.testDuration = Math.round((Date.now() - this.testStartTime) / 1000);

    // Show results
    this.showResults();

    // Return to character scene after delay
    this.time.delayedCall(3000, () => {
      this.scene.start(SCENE_KEYS.character);
    });
  }

  /**
   * Show results
   */
  private showResults(): void {
    this.resultsContainer = this.add.container(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2
    );

    // Background
    const bg = this.add.rectangle(0, 0, 400, 300, 0x2a2a4a);
    bg.setStrokeStyle(2, COLORS.accent);
    this.resultsContainer.add(bg);

    // Title
    const title = this.add.text(0, -120, 'TEST RESULTS', {
      fontSize: `${FONT_SIZES.large}px`,
      color: '#FFFFFF',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    this.resultsContainer.add(title);

    // Results
    const results = [
      `Damage Dealt: ${this.testResults.damageDealt}`,
      `Max Combo: ${this.testResults.comboCount}`,
      `Hits: ${this.testResults.hits}`,
      `Misses: ${this.testResults.misses}`,
      `Accuracy: ${Math.round((this.testResults.hits / (this.testResults.hits + this.testResults.misses || 1)) * 100)}%`,
      `Duration: ${this.testResults.testDuration}s`,
    ];

    results.forEach((result, index) => {
      const text = this.add.text(0, -60 + index * 30, result, {
        fontSize: '16px',
        color: '#CCCCCC',
      });
      text.setOrigin(0.5);
      if (this.resultsContainer) {
        this.resultsContainer.add(text);
      }
    });

    // Animate in
    this.resultsContainer.setScale(0);
    this.tweens.add({
      targets: this.resultsContainer,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut',
    });

    this.add.existing(this.resultsContainer);
  }

  /**
   * Update
   */
  public update(): void {
    // Update enemies
    this.dummyEnemies.forEach(enemy => enemy.update());

    // Update combo timer
    const now = Date.now();
    if (now - this.lastHitTime > 2000 && this.currentCombo > 0) {
      this.currentCombo = 0;
      this.updateStatsDisplay();
    }
  }

  /**
   * Clean up scene resources
   */
  public destroy(): void {
    // Clean up enemies
    this.dummyEnemies.forEach(enemy => enemy.destroy());
    this.dummyEnemies = [];

    // Clean up containers
    if (this.headerContainer) {
      this.headerContainer.destroy();
    }
    if (this.statsContainer) {
      this.statsContainer.destroy();
    }
    if (this.resultsContainer) {
      this.resultsContainer.destroy();
    }

    // Clean up buttons
    if (this.exitButton) {
      this.exitButton.destroy();
    }
    if (this.resetButton) {
      this.resetButton.destroy();
    }

    // Clean up weapon preview
    if (this.weaponPreview) {
      this.weaponPreview.destroy();
    }
  }
}
