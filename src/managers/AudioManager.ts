/**
 * AudioManager
 * 
 * Handles all game audio with proper Web Audio best practices.
 * Includes separate volume controls for music and SFX.
 * Handles mobile audio unlock requirements.
 * 
 * Usage:
 *   const audioManager = new AudioManager(scene);
 *   audioManager.playMusic('menu_theme');
 *   audioManager.playSFX('slash_01');
 */

import Phaser from 'phaser';
import { debugLog, debugWarn, debugError } from '@utils/DebugLogger';
import { ErrorHandler, ErrorCategory, ErrorSeverity } from '@utils/ErrorHandler';
import { LoadingManager } from './LoadingManager';
import { AssetBundle } from './AssetRegistry';


import type { GameSettings } from '@config/types';
import type { IManager } from './IManager';

export class AudioManager implements IManager {
  private scene: Phaser.Scene;
  private currentMusic: Phaser.Sound.BaseSound | null = null;
  private currentMusicKey: string | null = null;

  // Volume settings (0-1)
  private musicVolume: number = 0.7;
  private sfxVolume: number = 1.0;
  private musicEnabled: boolean = true;
  private sfxEnabled: boolean = true;

  // Audio state
  private pendingMusic: string | null = null;
  private audioInitialized: boolean = false;
  private audioDisabled: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  /**
   * Initialize the audio manager (call after scene is fully created)
   */
  public initialize(): void {
    try {
      this.setupUnlockListener();
      this.audioInitialized = true;
      debugLog('[AudioManager] Audio initialized successfully');
    } catch (error) {
      const err = error as Error;
      debugError('[AudioManager] Failed to initialize audio:', err);
      
      ErrorHandler.handle(err, {
        scene: this.scene.scene.key,
        component: 'AudioManager',
        action: 'initialize'
      });
      
      this.audioDisabled = true;
    }
  }

  /**
   * Apply settings from SaveManager
   */
  applySettings(settings: GameSettings): void {
    this.musicVolume = settings.musicVolume;
    this.sfxVolume = settings.sfxVolume;
    this.musicEnabled = settings.musicEnabled;
    this.sfxEnabled = settings.sfxEnabled;

    // Update current music volume if playing
    if (this.currentMusic) {
      (this.currentMusic as Phaser.Sound.WebAudioSound).setVolume(
        this.musicEnabled ? this.musicVolume : 0,
      );
    }
  }

  /**
   * Set up listener to unlock audio on first user interaction
   * Required for mobile browsers
   */
  private setupUnlockListener(): void {
    if (this.scene.sound && this.scene.sound.locked) {
      this.scene.sound.once(Phaser.Sound.Events.UNLOCKED, () => {
        debugLog('[AudioManager] Audio unlocked');
        
        // Play pending music if any
        if (this.pendingMusic) {
          this.playMusic(this.pendingMusic);
          this.pendingMusic = null;
        }
      });
    }
  }

  // ===========================================================================
  // MUSIC
  // ===========================================================================

  /**
   * Play background music (loops by default)
   */
  playMusic(key: string, config?: Phaser.Types.Sound.SoundConfig): void {
    if (this.audioDisabled) {
      return;
    }

    // If audio is locked, queue it for later
    if (this.scene.sound.locked) {
      this.pendingMusic = key;
      return;
    }

    // Don't restart if same music is already playing
    if (this.currentMusicKey === key && this.currentMusic?.isPlaying) {
      return;
    }

    // Stop current music
    this.stopMusic();

    // Check if sound exists
    if (!this.scene.cache.audio.exists(key)) {
      debugWarn(`[AudioManager] Music not found: ${key}`);
      return;
    }

    try {
      // Create and play new music
      const defaultConfig: Phaser.Types.Sound.SoundConfig = {
        loop: true,
        volume: this.musicEnabled ? this.musicVolume : 0,
      };

      this.currentMusic = this.scene.sound.add(key, { ...defaultConfig, ...config });
      this.currentMusic.play();
      this.currentMusicKey = key;
    } catch (error) {
      debugError('[AudioManager] Failed to play music:', error as Error);
      ErrorHandler.handle(error as Error, {
        scene: this.scene.scene.key,
        component: 'AudioManager',
        action: 'play_music'
      });
    }
  }

  /**
   * Stop current music
   */
  stopMusic(fadeOut: boolean = false): void {
    if (!this.currentMusic) return;

    if (fadeOut) {
      this.scene.tweens.add({
        targets: this.currentMusic,
        volume: 0,
        duration: 500,
        onComplete: () => {
          this.currentMusic?.stop();
          this.currentMusic?.destroy();
          this.currentMusic = null;
          this.currentMusicKey = null;
        },
      });
    } else {
      this.currentMusic.stop();
      this.currentMusic.destroy();
      this.currentMusic = null;
      this.currentMusicKey = null;
    }
  }

  /**
   * Pause current music
   */
  pauseMusic(): void {
    if (this.currentMusic?.isPlaying) {
      this.currentMusic.pause();
    }
  }

  /**
   * Resume paused music
   */
  resumeMusic(): void {
    if (this.currentMusic?.isPaused) {
      this.currentMusic.resume();
    }
  }

  /**
   * Crossfade to new music track
   */
  crossfadeMusic(newKey: string, duration: number = 1000): void {
    if (!this.scene.cache.audio.exists(newKey)) {
      debugWarn(`[AudioManager] Music not found: ${newKey}`);
      return;
    }

    // Create new music at 0 volume
    const newMusic = this.scene.sound.add(newKey, {
      loop: true,
      volume: 0,
    });
    newMusic.play();

    // Fade out old, fade in new
    if (this.currentMusic) {
      this.scene.tweens.add({
        targets: this.currentMusic,
        volume: 0,
        duration: duration,
        onComplete: () => {
          this.currentMusic?.stop();
          this.currentMusic?.destroy();
        },
      });
    }

    this.scene.tweens.add({
      targets: newMusic,
      volume: this.musicEnabled ? this.musicVolume : 0,
      duration: duration,
    });

    this.currentMusic = newMusic;
    this.currentMusicKey = newKey;
  }

  // ===========================================================================
  // SOUND EFFECTS
  // ===========================================================================

  /**
   * Play a sound effect
   */
  playSFX(key: string, config?: Phaser.Types.Sound.SoundConfig): Phaser.Sound.BaseSound | null {
    if (!this.sfxEnabled) return null;
    if (this.audioDisabled) return null;

    // Check if sound exists
    if (!this.scene.cache.audio.exists(key)) {
      debugWarn(`[AudioManager] SFX not found: ${key}`);
      return null;
    }

    try {
      const defaultConfig: Phaser.Types.Sound.SoundConfig = {
        volume: this.sfxVolume,
      };

      // Use play() for one-shot sounds (auto-destroys when done)
      return this.scene.sound.play(key, { ...defaultConfig, ...config }) as unknown as Phaser.Sound.BaseSound;
    } catch (error) {
      debugError('[AudioManager] Failed to play SFX:', error as Error);
      ErrorHandler.handle(error as Error, {
        scene: this.scene.scene.key,
        component: 'AudioManager',
        action: 'play_sfx'
      });
      return null;
    }
  }

  /**
   * Play a random sound from an array of keys
   * Useful for variations (e.g., ['slash_01', 'slash_02', 'slash_03'])
   */
  playRandomSFX(keys: string[], config?: Phaser.Types.Sound.SoundConfig): Phaser.Sound.BaseSound | null {
    if (keys.length === 0) return null;
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    if (!randomKey) return null;
    return this.playSFX(randomKey, config);
  }

  /**
   * Play sound with pitch variation for variety
   */
  playSFXWithVariation(
    key: string, 
    pitchRange: number = 0.1,
  ): Phaser.Sound.BaseSound | null {
    const detune = Phaser.Math.Between(-pitchRange * 1200, pitchRange * 1200);
    return this.playSFX(key, { detune });
  }

  // ===========================================================================
  // VOLUME CONTROLS
  // ===========================================================================

  /**
   * Set music volume (0-1)
   */
  setMusicVolume(volume: number): void {
    this.musicVolume = Phaser.Math.Clamp(volume, 0, 1);
    if (this.currentMusic && this.musicEnabled) {
      (this.currentMusic as Phaser.Sound.WebAudioSound).setVolume(this.musicVolume);
    }
  }

  /**
   * Get current music volume
   */
  getMusicVolume(): number {
    return this.musicVolume;
  }

  /**
   * Set SFX volume (0-1)
   */
  setSFXVolume(volume: number): void {
    this.sfxVolume = Phaser.Math.Clamp(volume, 0, 1);
  }

  /**
   * Get current SFX volume
   */
  getSFXVolume(): number {
    return this.sfxVolume;
  }

  /**
   * Toggle music on/off
   */
  toggleMusic(enabled?: boolean): boolean {
    this.musicEnabled = enabled ?? !this.musicEnabled;
    
    if (this.currentMusic) {
      (this.currentMusic as Phaser.Sound.WebAudioSound).setVolume(
        this.musicEnabled ? this.musicVolume : 0,
      );
    }
    
    return this.musicEnabled;
  }

  /**
   * Toggle SFX on/off
   */
  toggleSFX(enabled?: boolean): boolean {
    this.sfxEnabled = enabled ?? !this.sfxEnabled;
    return this.sfxEnabled;
  }

  /**
   * Check if music is enabled
   */
  isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  /**
   * Check if SFX is enabled
   */
  isSFXEnabled(): boolean {
    return this.sfxEnabled;
  }

  /**
   * Mute all audio
   */
  muteAll(): void {
    this.scene.sound.mute = true;
  }

  /**
   * Unmute all audio
   */
  unmuteAll(): void {
    this.scene.sound.mute = false;
  }

  // ===========================================================================
  // LAZY LOADING
  // ===========================================================================

  /**
   * Load and play audio if not already in cache
   */
  async loadAndPlaySFX(key: string, path: string): Promise<void> {
    if (!this.scene.cache.audio.exists(key)) {
      await this.loadAudioAsset(key);
    }
    this.playSFX(key);
  }

  /**
   * Load audio asset via LoadingManager
   */
  private async loadAudioAsset(key: string): Promise<void> {
    try {
      const loadingManager = LoadingManager.getInstance();
      await loadingManager.lazyLoadAsset(key);
      debugLog(`[AudioManager] Loaded audio: ${key}`);
    } catch (error) {
      const err = error as Error;
      debugError(`[AudioManager] Failed to load audio ${key}:`, err);
      
      // Audio is non-critical, continue gracefully
      debugWarn(`[AudioManager] Audio ${key} failed to load, continuing without it`);
    }
  }

  /**
   * Load music bundle on-demand
   */
  async loadMusicBundle(): Promise<void> {
    try {
      const loadingManager = LoadingManager.getInstance();
      debugLog('[AudioManager] Loading music bundle...');
      await loadingManager.lazyLoadBundle(AssetBundle.AUDIO_MUSIC);
    } catch (error) {
      const err = error as Error;
      debugError('[AudioManager] Failed to load music bundle:', err);
    }
  }

  /**
   * Load SFX bundle on-demand
   */
  async loadSFXBundle(): Promise<void> {
    try {
      const loadingManager = LoadingManager.getInstance();
      debugLog('[AudioManager] Loading SFX bundle...');
      await loadingManager.lazyLoadBundle(AssetBundle.AUDIO_SFX);
    } catch (error) {
      const err = error as Error;
      debugError('[AudioManager] Failed to load SFX bundle:', err);
    }
  }

  // ===========================================================================
  // CLEANUP
  // ===========================================================================

  /**
   * Stop all audio and clean up
   */
  destroy(): void {
    this.stopMusic();
    // Note: Phaser's sound manager handles cleanup of one-shot sounds
  }

  /**
   * Reset audio manager (for restarting game)
   */
  reset(): void {
    this.stopMusic();
  }

  /**
   * Shutdown and cleanup
   */
  shutdown(): void {
    this.stopMusic();
  }

  /**
   * Pause all audio (for when game loses focus)
   */
  pauseAll(): void {
    this.scene.sound.pauseAll();
  }

  /**
   * Resume all audio
   */
  resumeAll(): void {
    this.scene.sound.resumeAll();
  }
}
