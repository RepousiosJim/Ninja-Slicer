/**
 * AssetRegistry
 *
 * Central registry of all game assets with metadata.
 * Provides query methods for filtering assets by bundle, priority, and tags.
 */

import { debugLog } from '@utils/DebugLogger';

/**
 * Asset types supported by the loading system
 */
export enum AssetType {
  IMAGE = 'image',
  SPRITESHEET = 'spritesheet',
  AUDIO = 'audio',
  JSON = 'json',
  ATLAS = 'atlas',
  BITMAP_FONT = 'bitmap_font',
}

/**
 * Asset priority levels for loading order
 */
export enum AssetPriority {
  CRITICAL = 0,    // Must load before game can start
  HIGH = 1,        // Load as soon as possible
  NORMAL = 2,      // Standard priority
  LOW = 3,         // Load when convenient
  OPTIONAL = 4,    // Load on-demand only
}

/**
 * Loading bundle names
 */
export enum AssetBundle {
  // Core bundles loaded at startup
  BOOT = 'boot',
  UI = 'ui',
  CORE_GAMEPLAY = 'core_gameplay',
  
  // Level-specific bundles
  WORLD_1 = 'world_1',
  WORLD_2 = 'world_2',
  WORLD_3 = 'world_3',
  WORLD_4 = 'world_4',
  WORLD_5 = 'world_5',
  
  // Feature-specific bundles
  AUDIO_MUSIC = 'audio_music',
  AUDIO_SFX = 'audio_sfx',
  EFFECTS = 'effects',
  PARTICLES = 'particles',
}

/**
 * Asset metadata configuration
 */
export interface AssetConfig {
  key: string;
  type: AssetType;
  path: string;
  priority: AssetPriority;
  bundle: AssetBundle;
  
  // Type-specific configs
  spritesheetConfig?: {
    frameWidth: number;
    frameHeight: number;
    startFrame?: number;
    endFrame?: number;
  };
  
  atlasConfig?: {
    atlasURL: string;
    textureURL: string;
  };
  
  // Optional metadata
  description?: string;
  tags?: string[];
  dependencies?: string[]; // Keys of assets this depends on
  preloadInScenes?: string[]; // Scenes that should preload this
  lazyLoad?: boolean; // Load on-demand
  cache?: boolean; // Keep in cache (default: true)
}

/**
 * Bundle configuration
 */
export interface BundleConfig {
  name: AssetBundle;
  assets: string[]; // Asset keys
  priority: AssetPriority;
  autoLoad?: boolean; // Load automatically with preloader
  description?: string;
}

/**
 * Asset Registry - Central registry of all game assets
 */
export class AssetRegistry {
  private static instance: AssetRegistry;
  private assets: Map<string, AssetConfig> = new Map();
  private bundles: Map<AssetBundle, BundleConfig> = new Map();

  private constructor() {
    this.registerAssets();
    this.registerBundles();
    debugLog('[AssetRegistry] Initialized with ' + this.assets.size + ' assets');
  }

  static getInstance(): AssetRegistry {
    if (!AssetRegistry.instance) {
      AssetRegistry.instance = new AssetRegistry();
    }
    return AssetRegistry.instance;
  }

  /**
   * Register all game assets
   */
  private registerAssets(): void {
    // =========================================================================
    // MONSTER SPRITES
    // =========================================================================
    this.registerAsset({
      key: 'monster_zombie',
      type: AssetType.IMAGE,
      path: 'enemies/zombie.png',
      priority: AssetPriority.HIGH,
      bundle: AssetBundle.CORE_GAMEPLAY,
      description: 'Zombie sprite',
      tags: ['enemy', 'monster', 'zombie'],
    });

    this.registerAsset({
      key: 'monster_vampire',
      type: AssetType.IMAGE,
      path: 'enemies/vampire.png',
      priority: AssetPriority.HIGH,
      bundle: AssetBundle.CORE_GAMEPLAY,
      description: 'Vampire sprite',
      tags: ['enemy', 'monster', 'vampire'],
    });

    this.registerAsset({
      key: 'monster_ghost',
      type: AssetType.IMAGE,
      path: 'enemies/ghost.png',
      priority: AssetPriority.HIGH,
      bundle: AssetBundle.CORE_GAMEPLAY,
      description: 'Ghost sprite',
      tags: ['enemy', 'monster', 'ghost'],
    });

    // Spritesheets
    this.registerAsset({
      key: 'monster_zombie_sheet',
      type: AssetType.SPRITESHEET,
      path: 'enemies/zombie_sheet.png',
      priority: AssetPriority.NORMAL,
      bundle: AssetBundle.CORE_GAMEPLAY,
      description: 'Zombie animation sheet',
      tags: ['enemy', 'monster', 'zombie', 'animation'],
      spritesheetConfig: { frameWidth: 64, frameHeight: 64 },
    });

    this.registerAsset({
      key: 'monster_vampire_sheet',
      type: AssetType.SPRITESHEET,
      path: 'enemies/vampire_sheet.png',
      priority: AssetPriority.NORMAL,
      bundle: AssetBundle.CORE_GAMEPLAY,
      description: 'Vampire animation sheet',
      tags: ['enemy', 'monster', 'vampire', 'animation'],
      spritesheetConfig: { frameWidth: 64, frameHeight: 64 },
    });

    this.registerAsset({
      key: 'monster_ghost_sheet',
      type: AssetType.SPRITESHEET,
      path: 'enemies/ghost_sheet.png',
      priority: AssetPriority.NORMAL,
      bundle: AssetBundle.CORE_GAMEPLAY,
      description: 'Ghost animation sheet',
      tags: ['enemy', 'monster', 'ghost', 'animation'],
      spritesheetConfig: { frameWidth: 64, frameHeight: 64 },
    });

    // =========================================================================
    // BOSS SPRITES
    // =========================================================================
    const bossAssets = [
      { key: 'boss_gravetitan', path: 'enemies/grave_titan.png', tag: 'grave_titan' },
      { key: 'boss_horseman', path: 'enemies/headless_horseman.png', tag: 'horseman' },
      { key: 'boss_vampirelord', path: 'enemies/vampire_lord.png', tag: 'vampire_lord' },
      { key: 'boss_phantomking', path: 'enemies/phantom_king.png', tag: 'phantom_king' },
      { key: 'boss_demonoverlord', path: 'enemies/demon_overlord.png', tag: 'demon_overlord' },
    ];

    bossAssets.forEach(boss => {
      this.registerAsset({
        key: boss.key,
        type: AssetType.IMAGE,
        path: boss.path,
        priority: AssetPriority.NORMAL,
        bundle: AssetBundle.CORE_GAMEPLAY,
        description: `${boss.tag} boss sprite`,
        tags: ['enemy', 'boss', boss.tag],
      });
    });

    // Boss spritesheets
    const bossSheets = [
      { key: 'boss_gravetitan_sheet', path: 'enemies/gravetitan_sheet.png', w: 128, h: 128 },
      { key: 'boss_horseman_sheet', path: 'enemies/horseman_sheet.png', w: 128, h: 96 },
      { key: 'boss_vampirelord_sheet', path: 'enemies/vampirelord_sheet.png', w: 96, h: 96 },
      { key: 'boss_phantomking_sheet', path: 'enemies/phantomking_sheet.png', w: 96, h: 96 },
      { key: 'boss_demonoverlord_sheet', path: 'enemies/demonoverlord_sheet.png', w: 160, h: 160 },
    ];

    bossSheets.forEach(sheet => {
      this.registerAsset({
        key: sheet.key,
        type: AssetType.SPRITESHEET,
        path: sheet.path,
        priority: AssetPriority.LOW,
        bundle: AssetBundle.CORE_GAMEPLAY,
        description: `${sheet.key} animation sheet`,
        tags: ['enemy', 'boss', 'animation'],
        spritesheetConfig: { frameWidth: sheet.w, frameHeight: sheet.h },
      });
    });

    // =========================================================================
    // VILLAGERS
    // =========================================================================
    this.registerAsset({
      key: 'villager_1',
      type: AssetType.IMAGE,
      path: 'enemies/villager_male.png',
      priority: AssetPriority.HIGH,
      bundle: AssetBundle.CORE_GAMEPLAY,
      description: 'Male villager',
      tags: ['villager', 'civilian'],
    });

    this.registerAsset({
      key: 'villager_female',
      type: AssetType.IMAGE,
      path: 'enemies/villager_female.png',
      priority: AssetPriority.HIGH,
      bundle: AssetBundle.CORE_GAMEPLAY,
      description: 'Female villager',
      tags: ['villager', 'civilian'],
    });

    this.registerAsset({
      key: 'villager_elder',
      type: AssetType.IMAGE,
      path: 'enemies/elder_villager.png',
      priority: AssetPriority.HIGH,
      bundle: AssetBundle.CORE_GAMEPLAY,
      description: 'Elder villager',
      tags: ['villager', 'civilian'],
    });

    // Villager spritesheets
    this.registerAsset({
      key: 'villager_male_sheet',
      type: AssetType.SPRITESHEET,
      path: 'enemies/villager_male_sheet.png',
      priority: AssetPriority.LOW,
      bundle: AssetBundle.CORE_GAMEPLAY,
      description: 'Male villager animation',
      tags: ['villager', 'civilian', 'animation'],
      spritesheetConfig: { frameWidth: 48, frameHeight: 48 },
    });

    this.registerAsset({
      key: 'villager_female_sheet',
      type: AssetType.SPRITESHEET,
      path: 'enemies/villager_female_sheet.png',
      priority: AssetPriority.LOW,
      bundle: AssetBundle.CORE_GAMEPLAY,
      description: 'Female villager animation',
      tags: ['villager', 'civilian', 'animation'],
      spritesheetConfig: { frameWidth: 48, frameHeight: 48 },
    });

    this.registerAsset({
      key: 'villager_elder_sheet',
      type: AssetType.SPRITESHEET,
      path: 'enemies/villager_elder_sheet.png',
      priority: AssetPriority.LOW,
      bundle: AssetBundle.CORE_GAMEPLAY,
      description: 'Elder villager animation',
      tags: ['villager', 'civilian', 'animation'],
      spritesheetConfig: { frameWidth: 48, frameHeight: 48 },
    });

    // =========================================================================
    // WEAPONS
    // =========================================================================
    const weapons = [
      'basic_sword', 'silver_blade', 'shadow_blade', 'holy_cross_blade',
      'fire_sword', 'ice_blade', 'lightning_katana',
    ];

    weapons.forEach(weapon => {
      this.registerAsset({
        key: weapon,
        type: AssetType.IMAGE,
        path: `weapons/${weapon}.png`,
        priority: AssetPriority.HIGH,
        bundle: AssetBundle.CORE_GAMEPLAY,
        description: `${weapon} weapon sprite`,
        tags: ['weapon', weapon],
      });
    });

    // =========================================================================
    // SLICING EFFECTS
    // =========================================================================
    this.registerAsset({
      key: 'zombie_left_half',
      type: AssetType.IMAGE,
      path: 'enemies/zombie_left_half.png',
      priority: AssetPriority.NORMAL,
      bundle: AssetBundle.EFFECTS,
      description: 'Zombie left half sprite',
      tags: ['effect', 'slicing', 'zombie'],
    });

    this.registerAsset({
      key: 'zombie_right_half',
      type: AssetType.IMAGE,
      path: 'enemies/zombie_right_half.png',
      priority: AssetPriority.NORMAL,
      bundle: AssetBundle.EFFECTS,
      description: 'Zombie right half sprite',
      tags: ['effect', 'slicing', 'zombie'],
    });

    this.registerAsset({
      key: 'vampire_left_half',
      type: AssetType.IMAGE,
      path: 'enemies/vampire_left_half.png',
      priority: AssetPriority.NORMAL,
      bundle: AssetBundle.EFFECTS,
      description: 'Vampire left half sprite',
      tags: ['effect', 'slicing', 'vampire'],
    });

    this.registerAsset({
      key: 'vampire_right_half',
      type: AssetType.IMAGE,
      path: 'enemies/vampire_right_half.png',
      priority: AssetPriority.NORMAL,
      bundle: AssetBundle.EFFECTS,
      description: 'Vampire right half sprite',
      tags: ['effect', 'slicing', 'vampire'],
    });

    this.registerAsset({
      key: 'vampire_bat',
      type: AssetType.IMAGE,
      path: 'enemies/vampire_bat.png',
      priority: AssetPriority.NORMAL,
      bundle: AssetBundle.EFFECTS,
      description: 'Vampire bat sprite',
      tags: ['effect', 'vampire'],
    });

    this.registerAsset({
      key: 'horseman_head',
      type: AssetType.IMAGE,
      path: 'enemies/horseman_head.png',
      priority: AssetPriority.NORMAL,
      bundle: AssetBundle.EFFECTS,
      description: 'Horseman head sprite',
      tags: ['effect', 'horseman'],
    });

    // =========================================================================
    // UI ELEMENTS
    // =========================================================================
    const uiAssets = [
      { key: 'ui_heart_full', path: 'ui/heart.png', desc: 'Full heart' },
      { key: 'ui_heart_empty', path: 'ui/heart_empty.png', desc: 'Empty heart' },
      { key: 'ui_star_full', path: 'ui/star.png', desc: 'Full star' },
      { key: 'ui_star_empty', path: 'ui/star_empty.png', desc: 'Empty star' },
      { key: 'ui_soul_icon', path: 'ui/soul.png', desc: 'Soul icon' },
      { key: 'ui_pause', path: 'ui/pause.png', desc: 'Pause icon' },
      { key: 'ui_lock', path: 'ui/lock.png', desc: 'Lock icon' },
      { key: 'ui_settings_gear', path: 'ui/settings_gear.png', desc: 'Settings gear' },
      { key: 'ui_panel', path: 'ui/panel.png', desc: 'UI panel' },
      { key: 'ui_card_frame', path: 'ui/card_frame.png', desc: 'Card frame' },
      { key: 'ui_arrow_left', path: 'ui/arrow_left.png', desc: 'Left arrow' },
      { key: 'ui_arrow_right', path: 'ui/arrow_right.png', desc: 'Right arrow' },
    ];

    uiAssets.forEach(ui => {
      this.registerAsset({
        key: ui.key,
        type: AssetType.IMAGE,
        path: ui.path,
        priority: AssetPriority.HIGH,
        bundle: AssetBundle.UI,
        description: ui.desc,
        tags: ['ui'],
      });
    });

    // UI Buttons
    const buttonStates = ['large', 'small'];
    const buttonVariants = ['', '_hover', '_pressed', '_disabled'];

    buttonStates.forEach(state => {
      buttonVariants.forEach(variant => {
        const key = `ui_button_${state}${variant}`;
        this.registerAsset({
          key,
          type: AssetType.IMAGE,
          path: `ui/button_${state}${variant}.png`,
          priority: AssetPriority.CRITICAL,
          bundle: AssetBundle.UI,
          description: `${state} button${variant}`,
          tags: ['ui', 'button', state],
        });
      });
    });

    // Sound icons
    const soundIcons = [
      { key: 'ui_sound_on', path: 'ui/sound_on.png' },
      { key: 'ui_sound_off', path: 'ui/sound_off.png' },
      { key: 'ui_music_on', path: 'ui/music_on.png' },
      { key: 'ui_music_off', path: 'ui/music_off.png' },
    ];

    soundIcons.forEach(icon => {
      this.registerAsset({
        key: icon.key,
        type: AssetType.IMAGE,
        path: icon.path,
        priority: AssetPriority.HIGH,
        bundle: AssetBundle.UI,
        description: icon.key,
        tags: ['ui', 'audio'],
      });
    });

    // =========================================================================
    // BACKGROUNDS
    // =========================================================================
    const backgrounds = [
      { key: 'bg_menu', path: 'backgrounds/menu.png' },
      { key: 'bg_graveyard', path: 'backgrounds/graveyard.png', bundle: AssetBundle.WORLD_1 },
      { key: 'bg_graveyard_fg', path: 'backgrounds/graveyard_fg.png', bundle: AssetBundle.WORLD_1 },
      { key: 'bg_haunted_village', path: 'backgrounds/haunted_village.png', bundle: AssetBundle.WORLD_2 },
      { key: 'bg_haunted_village_fg', path: 'backgrounds/haunted_village_fg.png', bundle: AssetBundle.WORLD_2 },
      { key: 'bg_vampire_castle', path: 'backgrounds/vampire_castle.png', bundle: AssetBundle.WORLD_3 },
      { key: 'bg_vampire_castle_fg', path: 'backgrounds/vampire_castle_fg.png', bundle: AssetBundle.WORLD_3 },
      { key: 'bg_ghost_realm', path: 'backgrounds/ghost_realm.png', bundle: AssetBundle.WORLD_4 },
      { key: 'bg_hell_dimension', path: 'backgrounds/hell_dimension.png', bundle: AssetBundle.WORLD_5 },
    ];

    backgrounds.forEach(bg => {
      this.registerAsset({
        key: bg.key,
        type: AssetType.IMAGE,
        path: bg.path,
        priority: AssetPriority.NORMAL,
        bundle: bg.bundle || AssetBundle.CORE_GAMEPLAY,
        description: `${bg.key} background`,
        tags: ['background'],
      });
    });

    // =========================================================================
    // EFFECTS
    // =========================================================================
    const effects = [
      { key: 'effect_blood', path: 'effects/blood_splatter.png' },
      { key: 'effect_bat', path: 'effects/bat_scatter.png' },
      { key: 'effect_soul', path: 'effects/soul_wisp.png' },
      { key: 'effect_fire_breath', path: 'effects/fire_breath.png' },
      { key: 'effect_ghost_mist', path: 'effects/ghost_mist.png' },
      { key: 'effect_fire_spark', path: 'effects/fire_spark.png' },
      { key: 'effect_ice_crystal', path: 'effects/ice_crystal.png' },
      { key: 'effect_lightning_arc', path: 'effects/lightning_arc.png' },
    ];

    effects.forEach(effect => {
      this.registerAsset({
        key: effect.key,
        type: AssetType.IMAGE,
        path: effect.path,
        priority: AssetPriority.NORMAL,
        bundle: AssetBundle.EFFECTS,
        description: `${effect.key} effect`,
        tags: ['effect'],
      });
    });

    // =========================================================================
    // AUDIO - MUSIC (Lazy loaded)
    // =========================================================================
    const musicTracks = [
      { key: 'music_menu', path: 'audio/music/menu_theme.mp3' },
      { key: 'music_gameplay', path: 'audio/music/gameplay_theme.mp3' },
      { key: 'music_graveyard', path: 'audio/music/graveyard_theme.mp3' },
      { key: 'music_village', path: 'audio/music/village_theme.mp3' },
      { key: 'music_castle', path: 'audio/music/castle_theme.mp3' },
      { key: 'music_ghost_realm', path: 'audio/music/ghost_realm_theme.mp3' },
      { key: 'music_hell', path: 'audio/music/hell_theme.mp3' },
      { key: 'music_boss', path: 'audio/music/boss_theme.mp3' },
      { key: 'music_victory', path: 'audio/music/victory_theme.mp3' },
      { key: 'music_gameover', path: 'audio/music/gameover_theme.mp3' },
    ];

    musicTracks.forEach(track => {
      this.registerAsset({
        key: track.key,
        type: AssetType.AUDIO,
        path: track.path,
        priority: AssetPriority.LOW,
        bundle: AssetBundle.AUDIO_MUSIC,
        description: `${track.key} music`,
        tags: ['music', 'audio'],
        lazyLoad: true,
      });
    });

    // =========================================================================
    // AUDIO - SFX (Lazy loaded)
    // =========================================================================
    const sfxCategories = {
      slash: ['slash_01', 'slash_02', 'slash_03'],
      hit: ['hit_body_01', 'hit_body_02', 'hit_body_03'],
      monster: ['zombie_moan_01', 'zombie_moan_02', 'vampire_hiss', 'ghost_wail'],
      ui: ['button_click', 'button_hover', 'pause_open', 'pause_close', 'menu_open'],
      powerup: ['powerup_collect', 'powerup_activate'],
      boss: ['boss_roar', 'boss_hit'],
      death: ['death_scream', 'death_gurgle'],
    };

    Object.entries(sfxCategories).forEach(([category, sounds]) => {
      sounds.forEach(sound => {
        this.registerAsset({
          key: sound,
          type: AssetType.AUDIO,
          path: `audio/sfx/${category}/${sound}.mp3`,
          priority: AssetPriority.LOW,
          bundle: AssetBundle.AUDIO_SFX,
          description: `${sound} sound effect`,
          tags: ['sfx', 'audio', category],
          lazyLoad: true,
        });
      });
    });

    // =========================================================================
    // JSON DATA
    // =========================================================================
    const jsonFiles = [
      { key: 'data_weapons', path: '/src/data/weapons.json', priority: AssetPriority.CRITICAL },
      { key: 'data_upgrades', path: '/src/data/upgrades.json', priority: AssetPriority.NORMAL },
      { key: 'data_levels', path: '/src/data/levels.json', priority: AssetPriority.CRITICAL },
    ];

    jsonFiles.forEach(json => {
      this.registerAsset({
        key: json.key,
        type: AssetType.JSON,
        path: json.path,
        priority: json.priority,
        bundle: AssetBundle.BOOT,
        description: `${json.key} data`,
        tags: ['data'],
      });
    });
  }

  /**
   * Register asset bundles
   */
  private registerBundles(): void {
    // Boot bundle - minimal assets for loading screen
    this.registerBundle({
      name: AssetBundle.BOOT,
      assets: [
        'ui_button_large',
        'ui_button_large_hover',
        'ui_button_large_pressed',
        'ui_button_large_disabled',
      ],
      priority: AssetPriority.CRITICAL,
      autoLoad: true,
      description: 'Essential assets for loading screen',
    });

    // UI bundle - all UI elements
    this.registerBundle({
      name: AssetBundle.UI,
      assets: [
        'ui_heart_full', 'ui_heart_empty',
        'ui_star_full', 'ui_star_empty',
        'ui_soul_icon', 'ui_pause', 'ui_lock',
        'ui_settings_gear', 'ui_panel', 'ui_card_frame',
        'ui_arrow_left', 'ui_arrow_right',
        'ui_sound_on', 'ui_sound_off',
        'ui_music_on', 'ui_music_off',
        'ui_button_large', 'ui_button_large_hover',
        'ui_button_large_pressed', 'ui_button_large_disabled',
        'ui_button_small', 'ui_button_small_hover',
        'ui_button_small_pressed', 'ui_button_small_disabled',
      ],
      priority: AssetPriority.HIGH,
      autoLoad: true,
      description: 'UI interface elements',
    });

    // Core gameplay - enemies and weapons
    this.registerBundle({
      name: AssetBundle.CORE_GAMEPLAY,
      assets: [
        'monster_zombie', 'monster_vampire', 'monster_ghost',
        'villager_1', 'villager_female', 'villager_elder',
        'basic_sword', 'silver_blade', 'shadow_blade',
        'holy_cross_blade', 'fire_sword', 'ice_blade', 'lightning_katana',
        'monster_zombie_sheet', 'monster_vampire_sheet', 'monster_ghost_sheet',
        'boss_gravetitan', 'boss_horseman', 'boss_vampirelord',
        'boss_phantomking', 'boss_demonoverlord',
      ],
      priority: AssetPriority.HIGH,
      autoLoad: true,
      description: 'Core gameplay sprites',
    });

    // Effects
    this.registerBundle({
      name: AssetBundle.EFFECTS,
      assets: [
        'zombie_left_half', 'zombie_right_half',
        'vampire_left_half', 'vampire_right_half',
        'vampire_bat', 'horseman_head',
        'effect_blood', 'effect_bat', 'effect_soul',
        'effect_fire_breath', 'effect_ghost_mist',
        'effect_fire_spark', 'effect_ice_crystal', 'effect_lightning_arc',
      ],
      priority: AssetPriority.NORMAL,
      autoLoad: true,
      description: 'Visual effects',
    });

    // Music bundle (lazy loaded)
    this.registerBundle({
      name: AssetBundle.AUDIO_MUSIC,
      assets: [
        'music_menu', 'music_gameplay',
        'music_graveyard', 'music_village',
        'music_castle', 'music_ghost_realm',
        'music_hell', 'music_boss',
        'music_victory', 'music_gameover',
      ],
      priority: AssetPriority.LOW,
      autoLoad: false,
      description: 'Background music',
    });

    // SFX bundle (lazy loaded)
    this.registerBundle({
      name: AssetBundle.AUDIO_SFX,
      assets: [], // Populated automatically from registry
      priority: AssetPriority.LOW,
      autoLoad: false,
      description: 'Sound effects',
    });

    // World bundles
    this.registerBundle({
      name: AssetBundle.WORLD_1,
      assets: ['bg_graveyard', 'bg_graveyard_fg'],
      priority: AssetPriority.NORMAL,
      autoLoad: true,
      description: 'Graveyard world assets',
    });

    this.registerBundle({
      name: AssetBundle.WORLD_2,
      assets: ['bg_haunted_village', 'bg_haunted_village_fg'],
      priority: AssetPriority.LOW,
      autoLoad: false,
      description: 'Haunted village world assets',
    });

    this.registerBundle({
      name: AssetBundle.WORLD_3,
      assets: ['bg_vampire_castle', 'bg_vampire_castle_fg'],
      priority: AssetPriority.LOW,
      autoLoad: false,
      description: 'Vampire castle world assets',
    });

    this.registerBundle({
      name: AssetBundle.WORLD_4,
      assets: ['bg_ghost_realm'],
      priority: AssetPriority.LOW,
      autoLoad: false,
      description: 'Ghost realm world assets',
    });

    this.registerBundle({
      name: AssetBundle.WORLD_5,
      assets: ['bg_hell_dimension'],
      priority: AssetPriority.LOW,
      autoLoad: false,
      description: 'Hell dimension world assets',
    });

    // Populate SFX bundle
    const sfxAssets = Array.from(this.assets.values())
      .filter(a => a.bundle === AssetBundle.AUDIO_SFX)
      .map(a => a.key);
    
    this.bundles.get(AssetBundle.AUDIO_SFX)!.assets = sfxAssets;
  }

  private registerAsset(config: AssetConfig): void {
    this.assets.set(config.key, config);
  }

  private registerBundle(config: BundleConfig): void {
    this.bundles.set(config.name, config);
  }

  /**
   * Get asset config by key
   */
  getAsset(key: string): AssetConfig | undefined {
    return this.assets.get(key);
  }

  /**
   * Get all assets
   */
  getAllAssets(): AssetConfig[] {
    return Array.from(this.assets.values());
  }

  /**
   * Get assets by bundle
   */
  getAssetsByBundle(bundle: AssetBundle): AssetConfig[] {
    return Array.from(this.assets.values()).filter(a => a.bundle === bundle);
  }

  /**
   * Get assets by priority
   */
  getAssetsByPriority(priority: AssetPriority): AssetConfig[] {
    return Array.from(this.assets.values()).filter(a => a.priority === priority);
  }

  /**
   * Get bundle config
   */
  getBundle(name: AssetBundle): BundleConfig | undefined {
    return this.bundles.get(name);
  }

  /**
   * Get all bundles
   */
  getAllBundles(): BundleConfig[] {
    return Array.from(this.bundles.values());
  }

  /**
   * Get bundles with autoLoad = true
   */
  getAutoLoadBundles(): BundleConfig[] {
    return Array.from(this.bundles.values()).filter(b => b.autoLoad);
  }

  /**
   * Get assets by tags
   */
  getAssetsByTag(tag: string): AssetConfig[] {
    return Array.from(this.assets.values()).filter(a => 
      a.tags?.includes(tag)
    );
  }

  /**
   * Check if asset exists
   */
  hasAsset(key: string): boolean {
    return this.assets.has(key);
  }
}
