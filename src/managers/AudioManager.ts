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
import { GameSettings } from '@config/types';

export class AudioManager {
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
    this.setupUnlockListener();
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
        this.musicEnabled ? this.musicVolume : 0
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
        console.log('[AudioManager] Audio unlocked');
        
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
      console.warn(`[AudioManager] Music not found: ${key}`);
      return;
    }

    // Create and play new music
    const defaultConfig: Phaser.Types.Sound.SoundConfig = {
      loop: true,
      volume: this.musicEnabled ? this.musicVolume : 0,
    };

    this.currentMusic = this.scene.sound.add(key, { ...defaultConfig, ...config });
    this.currentMusic.play();
    this.currentMusicKey = key;
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
      console.warn(`[AudioManager] Music not found: ${newKey}`);
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

    // Check if sound exists
    if (!this.scene.cache.audio.exists(key)) {
      console.warn(`[AudioManager] SFX not found: ${key}`);
      return null;
    }

    const defaultConfig: Phaser.Types.Sound.SoundConfig = {
      volume: this.sfxVolume,
    };

    // Use play() for one-shot sounds (auto-destroys when done)
    return this.scene.sound.play(key, { ...defaultConfig, ...config }) as unknown as Phaser.Sound.BaseSound;
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
    pitchRange: number = 0.1
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
        this.musicEnabled ? this.musicVolume : 0
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
      await this.loadAudio(key, path);
    }
    this.playSFX(key);
  }

  /**
   * Load audio file dynamically
   */
  private loadAudio(key: string, path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.scene.cache.audio.exists(key)) {
        resolve();
        return;
      }

      this.scene.load.audio(key, path);
      
      this.scene.load.once(`filecomplete-audio-${key}`, () => {
        resolve();
      });
      
      this.scene.load.once('loaderror', () => {
        reject(new Error(`Failed to load audio: ${key}`));
      });

      this.scene.load.start();
    });
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
