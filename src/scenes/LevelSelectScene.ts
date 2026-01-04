/**
 * LevelSelectScene
 *
 * Displays levels for a selected world.
 * Shows star ratings and allows navigation between levels.
 * Now includes weapon selection before starting a level.
 */

import Phaser from 'phaser';
import { SCENE_KEYS, TEXTURE_KEYS, COLORS, FONT_SIZES } from '@config/constants';
import { levelManager } from '../managers/LevelManager';
import { WeaponManager } from '../managers/WeaponManager';
import { SaveManager } from '../managers/SaveManager';
import { AudioManager } from '../managers/AudioManager';
import type { WeaponId, WeaponConfig } from '@config/types';
import { ParticleSystem, ParticleType } from '../systems/ParticleSystem';
import { EventBus } from '../utils/EventBus';
import { debugLog } from '../utils/DebugLogger';

export class LevelSelectScene extends Phaser.Scene {
  private currentWorld: number = 1;
  private currentLevel: number = 1;
  private levelCard: Phaser.GameObjects.Container | null = null;
  private weaponSelectorContainer: Phaser.GameObjects.Container | null = null;
  private weaponCards: Map<string, Phaser.GameObjects.Container> = new Map();
  private recentImprovements: Set<string> = new Set();

  private weaponManager: WeaponManager;
  private saveManager: SaveManager;
  private audioManager: AudioManager;

  /**
   * Initialize level select scene
   * Sets up scene key, weapon manager, save manager, and audio
   * 
   * @example
   * ```typescript
   * // Navigate to level select with world parameter
   * this.scene.start('levelSelect', { world: 1 });
   * ```
   */
  constructor() {
    super({ key: SCENE_KEYS.levelSelect });
    this.weaponManager = WeaponManager.getInstance();
    this.saveManager = new SaveManager();
    this.audioManager = new AudioManager(this);
  }

  /**
   * Create level selection UI for a specific world
   * Displays levels with star ratings and includes weapon selector
   * 
   * @param data - Data object containing world number to display
   * 
   * @example
   * ```typescript
   * // Navigates to level select for world 1
   * this.scene.start('levelSelect', { world: 1 });
   * ```
   */
  create(data: { world: number }): void {
    this.currentWorld = data.world || 1;
    this.currentLevel = 1;

    // Create background
    this.createBackground();

    // Create title
    this.createTitle();

    // Create level card (moved up to make room for weapon selector)
    this.createLevelCard();

    // Create weapon selector (NEW)
    this.createWeaponSelector();

    // Create navigation buttons
    this.createNavigationButtons();

    // Create play button (moved down)
    this.createPlayButton();

    // Create back button (moved down)
    this.createBackButton();
  }

  /**
   * Create background
   */
  private createBackground(): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
    bg.fillRect(0, 0, this.scale.width, this.scale.height);
    bg.setDepth(0);
  }

  /**
   * Create title
   */
  private createTitle(): void {
    const worldConfig = levelManager.getWorldConfig(this.currentWorld);
    const worldName = worldConfig?.name || `World ${this.currentWorld}`;

    const title = this.add.text(this.scale.width / 2, 40, worldName, {
      fontSize: '36px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });
    title.setOrigin(0.5);
    title.setDepth(10);
  }

  /**
   * Create level card
   */
  private createLevelCard(): void {
    const cardWidth = 300;
    const cardHeight = 400;
    const centerX = this.scale.width / 2;
    const centerY = 220;

    const levelConfig = levelManager.getLevelConfig(this.currentWorld, this.currentLevel);
    const isUnlocked = levelManager.isLevelUnlocked(this.currentWorld, this.currentLevel);
    const stars = levelManager.getLevelStars(this.currentWorld, this.currentLevel);

    debugLog(`[LevelSelectScene] Level ${this.currentWorld}-${this.currentLevel}: unlocked=${isUnlocked}, stars=${stars}`);

    const bg = this.add.rectangle(0, 0, cardWidth, cardHeight, isUnlocked ? 0x2d2d44 : 0x1a1a1a);
    bg.setStrokeStyle(3, isUnlocked ? 0x8b0000 : 0x444444);

    const levelNum = this.add.text(0, -cardHeight / 2 + 40, `LEVEL ${this.currentLevel}`, {
      fontSize: '28px',
      color: isUnlocked ? '#ffffff' : '#666666',
      fontStyle: 'bold',
    });
    levelNum.setOrigin(0.5);

    const levelName = this.add.text(0, -cardHeight / 2 + 90, levelConfig?.name || 'Unknown', {
      fontSize: '22px',
      color: isUnlocked ? '#cccccc' : '#555555',
      wordWrap: { width: cardWidth - 30 },
    });
    levelName.setOrigin(0.5);

    const levelDesc = this.add.text(0, -cardHeight / 2 + 140, levelConfig?.description || '', {
      fontSize: '16px',
      color: isUnlocked ? '#888888' : '#444444',
      wordWrap: { width: cardWidth - 30 },
    });
    levelDesc.setOrigin(0.5);

    const starContainer = this.add.container(0, -cardHeight / 2 + 200);
    for (let i = 0; i < 3; i++) {
      const star = this.add.image((i - 1) * 50, 0, i < stars ? 'ui_star_full' : 'ui_star_empty');
      star.setScale(1.2);
      starContainer.add(star);
    }

    const starText = this.add.text(0, -cardHeight / 2 + 240, `${stars} / 3 Stars`, {
      fontSize: '18px',
      color: '#ffd700',
      fontStyle: 'bold',
    });
    starText.setOrigin(0.5);

    const difficulty = this.getDifficultyIndicator(levelConfig || { minKills: 1, duration: 1 });
    const diffText = this.add.text(0, -cardHeight / 2 + 270, difficulty.text, {
      fontSize: '16px',
      color: difficulty.color,
      fontStyle: 'bold',
    });
    diffText.setOrigin(0.5);

    let lockIcon: Phaser.GameObjects.Image | null = null;
    if (!isUnlocked) {
      lockIcon = this.add.image(0, 0, 'ui_lock');
      lockIcon.setScale(1.5);
    }

    this.levelCard = this.add.container(centerX, centerY, [
      bg,
      levelNum,
      levelName,
      levelDesc,
      starContainer,
      starText,
      diffText,
    ]);

    if (lockIcon) {
      this.levelCard.add(lockIcon);
    }
  }

  /**
   * Create weapon selector UI
   */
  private createWeaponSelector(): void {
    const centerX = this.scale.width / 2;
    const selectorY = 460;
    const cardWidth = 140;
    const cardHeight = 160;
    const cardSpacing = 15;

    this.weaponSelectorContainer = this.add.container(centerX, selectorY);

    const saveData = this.saveManager.getSaveData();
    const unlockedWeapons = saveData.unlockedWeapons;
    const equippedWeaponId = saveData.equippedWeapon as WeaponId;

    const allWeapons = this.weaponManager.getAllWeapons();

    let x = -((unlockedWeapons.length - 1) * (cardWidth + cardSpacing)) / 2;

    unlockedWeapons.forEach((weaponId) => {
      const weapon = allWeapons.find(w => w.id === weaponId);
      if (!weapon) return;

      const weaponTier = saveData.weaponTiers[weaponId] || 1;
      const isEquipped = weaponId === equippedWeaponId;

      const card = this.createWeaponCard(
        weapon,
        x,
        0,
        cardWidth,
        cardHeight,
        isEquipped,
        weaponTier,
      );

      this.weaponSelectorContainer.add(card);
      this.weaponCards.set(weaponId, card);

      x += cardWidth + cardSpacing;
    });

    if (unlockedWeapons.length === 0) {
      const noWeaponsText = this.add.text(0, 0, 'No weapons unlocked!', {
        fontSize: '20px',
        color: '#888888',
        fontStyle: 'italic',
      });
      noWeaponsText.setOrigin(0.5);
      this.weaponSelectorContainer.add(noWeaponsText);
    }
  }

  /**
   * Create a single weapon card for selector
   */
  private createWeaponCard(
    weapon: WeaponConfig,
    x: number,
    y: number,
    width: number,
    height: number,
    isEquipped: boolean,
    tier: number,
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, width, height, 0x2a2a4a);
    bg.setStrokeStyle(3, isEquipped ? 0xffd700 : 0x4a0080);
    bg.setAlpha(0.9);
    container.add(bg);

    const iconKey = this.getWeaponIconKey(weapon.id);
    const icon = this.add.image(0, -height / 2 + 50, iconKey);
    icon.setScale(0.4);
    container.add(icon);

    const name = this.add.text(0, 10, weapon.name, {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    name.setOrigin(0.5);
    name.setWordWrapWidth(width - 10);
    container.add(name);

    const tierText = this.add.text(0, 40, `T${tier}`, {
      fontSize: '16px',
      color: '#ffd700',
      fontStyle: 'bold',
    });
    tierText.setOrigin(0.5);
    container.add(tierText);

    if (isEquipped) {
      const equippedText = this.add.text(0, height / 2 - 20, 'EQUIPPED', {
        fontSize: '12px',
        color: '#44ff44',
        fontStyle: 'bold',
      });
      equippedText.setOrigin(0.5);
      container.add(equippedText);
    }

    const hitArea = new Phaser.Geom.Rectangle(0, 0, width, height);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
      this.tweens.add({
        targets: container,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
      });
    });

    container.on('pointerout', () => {
      this.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
      });
    });

    container.on('pointerdown', () => {
      this.onWeaponSelect(weapon.id as WeaponId);
    });

    return container;
  }

  /**
   * Handle weapon selection
   */
  private onWeaponSelect(weaponId: WeaponId): void {
    this.audioManager.playSFX('uiClick');

    this.weaponManager.equipWeapon(weaponId);
    this.updateWeaponSelector();

    const particleSystem = new ParticleSystem(this);
    particleSystem.emit({
      type: ParticleType.SPARKLE,
      x: this.scale.width / 2,
      y: 460,
      count: 20,
    });
  }

  /**
   * Update weapon selector visuals after selection change
   */
  private updateWeaponSelector(): void {
    if (this.weaponSelectorContainer) {
      this.weaponSelectorContainer.destroy();
      this.weaponCards.clear();
      this.createWeaponSelector();
    }
  }

  /**
   * Get weapon icon texture key
   */
  private getWeaponIconKey(weaponId: string): string {
    const iconMap: Record<string, string> = {
      basic_sword: 'weapon_basic_sword',
      silver_blade: 'weapon_silver_blade',
      shadow_blade: 'weapon_silver_blade',
      holy_cross_blade: 'weapon_holy_cross_blade',
      fire_sword: 'weapon_fire_sword',
      ice_blade: 'weapon_ice_blade',
      lightning_katana: 'weapon_lightning_katana',
    };
    return iconMap[weaponId] || 'weapon_basic_sword';
  }

  /**
   * Create navigation buttons
   */
  private createNavigationButtons(): void {
    const buttonSize = 60;
    const y = 220;

    const prevButton = this.createArrowButton(100, y, 'left', () => {
      this.onPreviousLevel();
    });

    const nextButton = this.createArrowButton(this.scale.width - 100, y, 'right', () => {
      this.onNextLevel();
    });
  }

  /**
   * Create an arrow button
   */
  private createArrowButton(
    x: number,
    y: number,
    direction: 'left' | 'right',
    onClick: () => void,
  ): Phaser.GameObjects.Container {
    const bg = this.add.image(0, 0, direction === 'left' ? 'ui_arrow_left' : 'ui_arrow_right');
    bg.setScale(1.2);

    const container = this.add.container(x, y, [bg]);

    bg.setInteractive({ useHandCursor: true });

    bg.on('pointerover', () => {
      this.tweens.add({
        targets: container,
        scaleX: 1.15,
        scaleY: 1.15,
        duration: 100,
      });
    });

    bg.on('pointerout', () => {
      this.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
      });
    });

    bg.on('pointerdown', () => {
      this.tweens.add({
        targets: container,
        scaleX: 0.9,
        scaleY: 0.9,
        duration: 50,
        yoyo: true,
        onComplete: () => {
          onClick();
        },
      });
    });

    return container;
  }

  /**
   * Create play button
   */
  private createPlayButton(): void {
    const buttonWidth = 200;
    const buttonHeight = 60;
    const x = this.scale.width / 2;
    const y = 620;

    const bg = this.add.rectangle(0, 0, buttonWidth, buttonHeight, 0x44ff44);
    bg.setStrokeStyle(3, 0xffffff);

    const text = this.add.text(0, 0, 'PLAY LEVEL', {
      fontSize: '28px',
      color: '#000000',
      fontStyle: 'bold',
    });
    text.setOrigin(0.5);

    const container = this.add.container(x, y, [bg, text]);

    bg.setInteractive({ useHandCursor: true });

    bg.on('pointerover', () => {
      bg.setFillStyle(0x66ff66);
      this.tweens.add({
        targets: container,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
      });
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(0x44ff44);
      this.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
      });
    });

    bg.on('pointerdown', () => {
      bg.setFillStyle(0x33cc33);
      this.tweens.add({
        targets: container,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 50,
        yoyo: true,
        onComplete: () => {
          this.onPlay();
        },
      });
    });
  }

  /**
   * Create back button
   */
  private createBackButton(): void {
    const buttonWidth = 150;
    const buttonHeight = 50;
    const x = this.scale.width / 2;
    const y = 700;

    const bg = this.add.rectangle(0, 0, buttonWidth, buttonHeight, 0x8b0000);
    bg.setStrokeStyle(3, 0xffffff);

    const text = this.add.text(0, 0, 'BACK', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    text.setOrigin(0.5);

    const container = this.add.container(x, y, [bg, text]);

    bg.setInteractive({ useHandCursor: true });

    bg.on('pointerover', () => {
      bg.setFillStyle(0xaa0000);
      this.tweens.add({
        targets: container,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
      });
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(0x8b0000);
      this.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
      });
    });

    bg.on('pointerdown', () => {
      bg.setFillStyle(0x550000);
      this.tweens.add({
        targets: container,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 50,
        yoyo: true,
        onComplete: () => {
          this.onBack();
        },
      });
    });
  }

  /**
   * Update level card for current level
   */
  private updateLevelCard(): void {
    if (this.levelCard) {
      this.levelCard.destroy();
    }
    this.createLevelCard();
  }

  /**
   * Navigate to previous level
   */
  private onPreviousLevel(): void {
    if (this.currentLevel > 1) {
      this.currentLevel--;
      this.updateLevelCard();
    } else if (this.currentWorld > 1) {
      this.currentWorld--;
      this.currentLevel = 5;
      this.createTitle();
      this.updateLevelCard();
    }
  }

  /**
   * Navigate to next level
   */
  private onNextLevel(): void {
    const wasUnlocked = levelManager.isLevelUnlocked(this.currentWorld, this.currentLevel);

    if (this.currentLevel < 5) {
      this.currentLevel++;
      this.updateLevelCard();

      if (!wasUnlocked && levelManager.isLevelUnlocked(this.currentWorld, this.currentLevel)) {
        this.playUnlockAnimation(this.levelCard!);
      }
    } else if (this.currentWorld < 5) {
      this.currentWorld++;
      this.currentLevel = 1;
      this.createTitle();
      this.updateLevelCard();

      if (!wasUnlocked && levelManager.isLevelUnlocked(this.currentWorld, this.currentLevel)) {
        this.playUnlockAnimation(this.levelCard!);
      }
    }
  }

  /**
   * Start level
   */
  private onPlay(): void {
    const isUnlocked = levelManager.isLevelUnlocked(this.currentWorld, this.currentLevel);
    if (isUnlocked) {
      this.scene.start(SCENE_KEYS.gameplay, {
        world: this.currentWorld,
        level: this.currentLevel,
      });
    }
  }

  /**
   * Go back to world select
   */
  private onBack(): void {
    this.scene.start(SCENE_KEYS.worldSelect);
  }

  private getDifficultyIndicator(levelConfig: any): { text: string; color: string } {
    const killRate = levelConfig.minKills / levelConfig.duration;

    if (killRate < 0.3) {
      return { text: 'EASY', color: '#44ff44' };
    } else if (killRate < 0.5) {
      return { text: 'MEDIUM', color: '#ffff44' };
    } else {
      return { text: 'HARD', color: '#ff4444' };
    }
  }

  private playUnlockAnimation(container: Phaser.GameObjects.Container): void {
    const bg = container.getAt(0) as Phaser.GameObjects.Rectangle;
    this.tweens.add({
      targets: bg,
      fillStyle: { r: 0x44, g: 0x44, b: 0x66 },
      duration: 300,
    });

    const particleSystem = new ParticleSystem(this);
    particleSystem.emit({
      type: ParticleType.SPARKLE,
      x: container.x,
      y: container.y,
      count: 30,
    });

    this.audioManager.playSFX('uiClick');
  }
}
