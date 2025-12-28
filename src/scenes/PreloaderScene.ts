/**
 * PreloaderScene
 * 
 * Loads all game assets and displays a progress bar.
 * Uses lazy loading strategy - only loads essential assets here,
 * additional assets can be loaded on-demand in other scenes.
 */

import Phaser from 'phaser';
import { SCENE_KEYS, COLORS, GAME_WIDTH, GAME_HEIGHT } from '@config/constants';

export class PreloaderScene extends Phaser.Scene {
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBox!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;
  private percentText!: Phaser.GameObjects.Text;
  private assetText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: SCENE_KEYS.preloader });
  }

  preload(): void {
    this.createLoadingUI();
    this.setupLoadEvents();
    this.loadAssets();
  }

  create(): void {
    // Small delay before transitioning to let the player see 100%
    this.time.delayedCall(500, () => {
      this.scene.start(SCENE_KEYS.mainMenu);
    });
  }

  /**
   * Create the loading bar UI
   */
  private createLoadingUI(): void {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    // Progress box (background)
    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x2a2a4e, 0.8);
    this.progressBox.fillRoundedRect(centerX - 160, centerY - 25, 320, 50, 10);

    // Progress bar (fill)
    this.progressBar = this.add.graphics();

    // Loading text
    this.loadingText = this.add.text(centerX, centerY - 60, 'Loading...', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Percentage text
    this.percentText = this.add.text(centerX, centerY, '0%', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Asset being loaded text
    this.assetText = this.add.text(centerX, centerY + 60, '', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#888888',
    }).setOrigin(0.5);
  }

  /**
   * Set up loading event listeners
   */
  private setupLoadEvents(): void {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    this.load.on('progress', (value: number) => {
      this.progressBar.clear();
      this.progressBar.fillStyle(0x8b0000, 1);
      this.progressBar.fillRoundedRect(
        centerX - 150, 
        centerY - 15, 
        300 * value, 
        30, 
        5
      );
      this.percentText.setText(`${Math.floor(value * 100)}%`);
    });

    this.load.on('fileprogress', (file: Phaser.Loader.File) => {
      this.assetText.setText(`Loading: ${file.key}`);
    });

    this.load.on('complete', () => {
      this.progressBar.destroy();
      this.progressBox.destroy();
      this.loadingText.setText('Complete!');
      this.percentText.destroy();
      this.assetText.destroy();
    });
  }

  /**
   * Load all game assets
   * 
   * Organization:
   * - Essential assets loaded here
   * - Large/optional assets loaded lazily in their respective scenes
   */
  private loadAssets(): void {
    // Set the base path for assets
    this.load.setPath('assets/');

    // =========================================================================
    // SPRITES - Monsters & Bosses
    // =========================================================================
    // Static sprites
    this.load.image('monster_zombie', 'enemies/zombie.png');
    this.load.image('monster_vampire', 'enemies/vampire.png');
    this.load.image('monster_ghost', 'enemies/ghost.png');
    
    // Animation sheets
    this.load.spritesheet('monster_zombie_sheet', 'enemies/zombie_sheet.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('monster_vampire_sheet', 'enemies/vampire_sheet.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('monster_ghost_sheet', 'enemies/ghost_sheet.png', { frameWidth: 64, frameHeight: 64 });
    
    // Boss sprites & sheets
    this.load.image('boss_gravetitan', 'enemies/grave_titan.png');
    this.load.image('boss_horseman', 'enemies/headless_horseman.png');
    this.load.image('boss_vampirelord', 'enemies/vampire_lord.png');
    this.load.image('boss_phantomking', 'enemies/phantom_king.png');
    this.load.image('boss_demonoverlord', 'enemies/demon_overlord.png');
    
    this.load.spritesheet('boss_gravetitan_sheet', 'enemies/gravetitan_sheet.png', { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet('boss_horseman_sheet', 'enemies/horseman_sheet.png', { frameWidth: 128, frameHeight: 96 });
    this.load.spritesheet('boss_vampirelord_sheet', 'enemies/vampirelord_sheet.png', { frameWidth: 96, frameHeight: 96 });
    this.load.spritesheet('boss_phantomking_sheet', 'enemies/phantomking_sheet.png', { frameWidth: 96, frameHeight: 96 });
    this.load.spritesheet('boss_demonoverlord_sheet', 'enemies/demonoverlord_sheet.png', { frameWidth: 160, frameHeight: 160 });
    
    // Slicing effects & projectiles
    this.load.image('zombie_left_half', 'enemies/zombie_left_half.png');
    this.load.image('zombie_right_half', 'enemies/zombie_right_half.png');
    this.load.image('vampire_left_half', 'enemies/vampire_left_half.png');
    this.load.image('vampire_right_half', 'enemies/vampire_right_half.png');
    this.load.image('vampire_bat', 'enemies/vampire_bat.png');
    this.load.image('horseman_head', 'enemies/horseman_head.png');

    // =========================================================================
    // SPRITES - Villagers
    // =========================================================================
    this.load.image('villager_1', 'enemies/villager_male.png');
    this.load.image('villager_female', 'enemies/villager_female.png');
    this.load.image('villager_elder', 'enemies/elder_villager.png');
    
    this.load.spritesheet('villager_male_sheet', 'enemies/villager_male_sheet.png', { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('villager_female_sheet', 'enemies/villager_female_sheet.png', { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('villager_elder_sheet', 'enemies/villager_elder_sheet.png', { frameWidth: 48, frameHeight: 48 });

    // =========================================================================
    // UI Elements
    // =========================================================================
    this.load.image('ui_heart_full', 'ui/heart.png');
    this.load.image('ui_heart_empty', 'ui/heart_empty.png');
    this.load.image('ui_star_full', 'ui/star.png');
    this.load.image('ui_star_empty', 'ui/star_empty.png');
    this.load.image('ui_soul_icon', 'ui/soul.png');
    this.load.image('ui_pause', 'ui/pause.png');
    this.load.image('ui_lock', 'ui/lock.png');
    this.load.image('ui_settings_gear', 'ui/settings_gear.png');
    
    // Buttons
    this.load.image('ui_button_large', 'ui/button_large.png');
    this.load.image('ui_button_large_hover', 'ui/button_large_hover.png');
    this.load.image('ui_button_large_pressed', 'ui/button_large_pressed.png');
    this.load.image('ui_button_large_disabled', 'ui/button_large_disabled.png');
    this.load.image('ui_button_small', 'ui/button_small.png');
    this.load.image('ui_button_small_hover', 'ui/button_small_hover.png');
    this.load.image('ui_button_small_pressed', 'ui/button_small_pressed.png');
    this.load.image('ui_button_small_disabled', 'ui/button_small_disabled.png');
    
    this.load.image('ui_panel', 'ui/panel.png');
    this.load.image('ui_card_frame', 'ui/card_frame.png');
    this.load.image('ui_arrow_left', 'ui/arrow_left.png');
    this.load.image('ui_arrow_right', 'ui/arrow_right.png');
    this.load.image('ui_sound_on', 'ui/sound_on.png');
    this.load.image('ui_sound_off', 'ui/sound_off.png');
    this.load.image('ui_music_on', 'ui/music_on.png');
    this.load.image('ui_music_off', 'ui/music_off.png');

    // =========================================================================
    // Backgrounds & Parallax
    // =========================================================================
    this.load.image('bg_menu', 'backgrounds/menu.png');
    this.load.image('bg_graveyard', 'backgrounds/graveyard.png');
    this.load.image('bg_graveyard_fg', 'backgrounds/graveyard_fg.png');
    this.load.image('bg_haunted_village', 'backgrounds/haunted_village.png');
    this.load.image('bg_haunted_village_fg', 'backgrounds/haunted_village_fg.png');
    this.load.image('bg_vampire_castle', 'backgrounds/vampire_castle.png');
    this.load.image('bg_vampire_castle_fg', 'backgrounds/vampire_castle_fg.png');
    this.load.image('bg_ghost_realm', 'backgrounds/ghost_realm.png');
    this.load.image('bg_hell_dimension', 'backgrounds/hell_dimension.png');

    // =========================================================================
    // Effects
    // =========================================================================
    this.load.image('effect_blood', 'effects/blood_splatter.png');
    this.load.image('effect_bat', 'effects/bat_scatter.png');
    this.load.image('effect_soul', 'effects/soul_wisp.png');
    this.load.image('effect_fire_breath', 'effects/fire_breath.png');
    this.load.image('effect_ghost_mist', 'effects/ghost_mist.png');
    this.load.image('effect_fire_spark', 'effects/fire_spark.png');
    this.load.image('effect_ice_crystal', 'effects/ice_crystal.png');
    this.load.image('effect_lightning_arc', 'effects/lightning_arc.png');
  }
}
