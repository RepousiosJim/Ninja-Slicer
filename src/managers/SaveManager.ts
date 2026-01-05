/**
 * SaveManager
 *
 * Handles all game save/load operations using localStorage.
 * Includes versioning for save data migrations.
 *
 * Usage:
 *   const saveManager = new SaveManager();
 *   saveManager.save();
 *   const data = saveManager.load();
 */

import type { GameSave, GameSettings, DailyChallenge } from '@config/types';
import { debugLog, debugWarn, debugError } from '@utils/DebugLogger';
import { SupabaseService } from '@services/SupabaseService';

import { SAVE_KEY, SETTINGS_KEY, SAVE_VERSION } from '@config/constants';
import type { IManager } from './IManager';

// Default save data
const DEFAULT_SAVE: GameSave = {
  version: SAVE_VERSION,
  souls: 0,
  unlockedWeapons: ['basic_sword', 'shadow_blade', 'fire_sword'],
  weaponTiers: { basic_sword: 1, shadow_blade: 1, fire_sword: 1 },
  equippedWeapon: 'basic_sword',
  upgrades: {
    slash_width: 0,
    extra_lives: 0,
    score_multiplier: 0,
    slow_motion_duration: 0,
    critical_hit: 0,
  },
  completedLevels: [],
  levelStars: {},
  highScores: {},
  levelAttempts: {},
  settings: {
    soundEnabled: true,
    musicEnabled: true,
    soundVolume: 1.0,
    musicVolume: 0.7,
    sfxVolume: 1.0,
    sfxEnabled: true,
    cloudSaveEnabled: false,
    uiScale: 'medium' as 'small' | 'medium' | 'large',
    highContrastMode: false,
    reducedMotionMode: false,
    quality: 'medium' as 'low' | 'medium' | 'high',
  },
  personalBests: [],
  playerName: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  weaponUnlockTimes: {},
  // New statistics tracking fields
  totalSoulsEarned: 0,
  playTimeMs: 0,
  weaponUsageHistory: { basic_sword: 0 },
  totalMonstersDefeated: 0,
  maxComboEver: 0,
  dailyChallenges: {},
};

// Default settings
const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  musicEnabled: true,
  soundVolume: 1.0,
  musicVolume: 0.7,
  sfxVolume: 1.0,
  sfxEnabled: true,
  cloudSaveEnabled: false,
  uiScale: 'medium',
  highContrastMode: false,
  reducedMotionMode: false,
  quality: 'medium',
};

export class SaveManager implements IManager {
  private saveData: GameSave;
  private settings: GameSettings;
  private autoSaveInterval: number | null = null;
  private supabaseService: SupabaseService | null = null;

  /**
   * Initialize save manager and load existing save data and settings from localStorage
   * 
   * @example
   * ```typescript
   * const saveManager = new SaveManager();
   * const souls = saveManager.getSouls();
   * ```
   */
  constructor() {
    this.saveData = this.load();
    this.settings = this.loadSettings();
  }

  /**
   * Set the SupabaseService instance for cloud sync
   */
  setSupabaseService(service: SupabaseService): void {
    this.supabaseService = service;
  }

  // ===========================================================================
  // SAVE DATA
  // ===========================================================================

  /**
   * Load save data from localStorage
   */
  load(): GameSave {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) {
        return { ...DEFAULT_SAVE };
      }

      const data = JSON.parse(raw) as GameSave;
      
      // Handle version migrations
      if (data.version < SAVE_VERSION) {
        return this.migrateSave(data);
      }

      // Merge with defaults to ensure all fields exist
      return { ...DEFAULT_SAVE, ...data };
    } catch (error) {
      debugError('[SaveManager] Failed to load save:', error);
      return { ...DEFAULT_SAVE };
    }
  }

  /**
   * Save current data to localStorage
   */
  save(): boolean {
    try {
      this.saveData.updatedAt = new Date().toISOString();
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.saveData));
      return true;
    } catch (error) {
      debugError('[SaveManager] Failed to save:', error);
      return false;
    }
  }

  /**
   * Get current save data (readonly reference)
   */
  getSaveData(): Readonly<GameSave> {
    return this.saveData;
  }

  /**
   * Reset save data to defaults
   */
  resetSave(): void {
    this.saveData = { ...DEFAULT_SAVE };
    this.save();
  }

  /**
   * Export save data as JSON string (for backup/sharing)
   */
  exportSave(): string {
    return JSON.stringify(this.saveData, null, 2);
  }

  /**
   * Import save data from JSON string
   */
  importSave(jsonString: string): boolean {
    try {
      // First parse to get raw data
      const rawData = JSON.parse(jsonString);
      
      // Validate the data structure before using it
      if (!this.validateSaveData(rawData)) {
        debugWarn('[SaveManager] Invalid save data structure');
        return false;
      }
      
      // Type-safe data after validation
      const data = rawData as GameSave;
      
      // Validate version
      if (typeof data.version !== 'number' || data.version < 0) {
        debugWarn('[SaveManager] Invalid save version');
        return false;
      }
      
      // Validate souls is non-negative
      if (data.souls < 0) {
        debugWarn('[SaveManager] Negative souls value detected');
        return false;
      }
      
      // Sanitize: only allow whitelisted fields to prevent prototype pollution
      const sanitizedData = this.sanitizeSaveData(data);
      
      this.saveData = { ...DEFAULT_SAVE, ...sanitizedData };
      this.save();
      return true;
    } catch (error) {
      debugError('[SaveManager] Failed to import save:', error);
      return false;
    }
  }

  /**
   * Validate save data structure using whitelist approach
   */
  private validateSaveData(data: any): data is Partial<GameSave> {
    if (data === null || data === undefined || typeof data !== 'object') {
      return false;
    }

    // Validate required top-level fields
    if (typeof data.version !== 'undefined' && typeof data.version !== 'number') {
      return false;
    }
    
    if (typeof data.souls !== 'undefined' && typeof data.souls !== 'number') {
      return false;
    }
    
    if (typeof data.unlockedWeapons !== 'undefined' && !Array.isArray(data.unlockedWeapons)) {
      return false;
    }
    
    if (typeof data.equippedWeapon !== 'undefined' && typeof data.equippedWeapon !== 'string') {
      return false;
    }
    
    if (typeof data.weaponTiers !== 'undefined' && (typeof data.weaponTiers !== 'object' || data.weaponTiers === null)) {
      return false;
    }
    
    if (typeof data.upgrades !== 'undefined' && (typeof data.upgrades !== 'object' || data.upgrades === null)) {
      return false;
    }
    
    if (typeof data.completedLevels !== 'undefined' && !Array.isArray(data.completedLevels)) {
      return false;
    }
    
    if (typeof data.levelStars !== 'undefined' && (typeof data.levelStars !== 'object' || data.levelStars === null)) {
      return false;
    }
    
    if (typeof data.highScores !== 'undefined' && (typeof data.highScores !== 'object' || data.highScores === null)) {
      return false;
    }
    
    if (typeof data.personalBests !== 'undefined' && !Array.isArray(data.personalBests)) {
      return false;
    }
    
    if (typeof data.playerName !== 'undefined' && 
        data.playerName !== null && 
        typeof data.playerName !== 'string') {
      return false;
    }
    
    if (typeof data.createdAt !== 'undefined' && typeof data.createdAt !== 'string') {
      return false;
    }
    
    if (typeof data.updatedAt !== 'undefined' && typeof data.updatedAt !== 'string') {
      return false;
    }
    
    // Validate settings if present
    if (typeof data.settings !== 'undefined') {
      if (typeof data.settings !== 'object' || data.settings === null) {
        return false;
      }
      
      const settings = data.settings;
      if (typeof settings.soundEnabled !== 'undefined' && typeof settings.soundEnabled !== 'boolean') {
        return false;
      }
      if (typeof settings.musicEnabled !== 'undefined' && typeof settings.musicEnabled !== 'boolean') {
        return false;
      }
      if (typeof settings.soundVolume !== 'undefined' && typeof settings.soundVolume !== 'number') {
        return false;
      }
      if (typeof settings.musicVolume !== 'undefined' && typeof settings.musicVolume !== 'number') {
        return false;
      }
      if (typeof settings.sfxVolume !== 'undefined' && typeof settings.sfxVolume !== 'number') {
        return false;
      }
      if (typeof settings.sfxEnabled !== 'undefined' && typeof settings.sfxEnabled !== 'boolean') {
        return false;
      }
      if (typeof settings.cloudSaveEnabled !== 'undefined' && typeof settings.cloudSaveEnabled !== 'boolean') {
        return false;
      }
      if (typeof settings.uiScale !== 'undefined' && 
          settings.uiScale !== 'small' && 
          settings.uiScale !== 'medium' && 
          settings.uiScale !== 'large') {
        return false;
      }
    }

    // Check for any unknown properties (prototype pollution prevention)
    const knownProperties = new Set([
      'version', 'souls', 'unlockedWeapons', 'weaponTiers', 'equippedWeapon',
      'upgrades', 'completedLevels', 'levelStars', 'highScores', 'settings',
      'personalBests', 'playerName', 'createdAt', 'updatedAt', 'testResults'
    ]);
    
    for (const key of Object.keys(data)) {
      if (!knownProperties.has(key)) {
        debugWarn(`[SaveManager] Unknown property in save data: ${key}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Sanitize save data by only allowing whitelisted fields
   * Prevents prototype pollution and other injection attacks
   */
  private sanitizeSaveData(data: GameSave): Partial<GameSave> {
    const sanitized: Partial<GameSave> = {};
    
    // Whitelist of allowed properties
    const allowedFields: (keyof GameSave)[] = [
      'version', 'souls', 'unlockedWeapons', 'weaponTiers', 'equippedWeapon',
      'upgrades', 'completedLevels', 'levelStars', 'highScores', 'settings',
      'personalBests', 'playerName', 'createdAt', 'updatedAt', 'testResults'
    ];
    
    for (const field of allowedFields) {
      if (field in data && data[field] !== undefined) {
         
        (sanitized as any)[field] = data[field as keyof GameSave];
      }
    }
    
    return sanitized;
  }

  // ===========================================================================
  // SETTINGS
  // ===========================================================================

  /**
   * Load game settings from localStorage
   * Merges with defaults if settings are incomplete
   * 
   * @returns Current game settings
   * 
   * @example
   * ```typescript
   * const settings = saveManager.loadSettings();
   * console.log('Music volume:', settings.musicVolume);
   * ```
   */
  loadSettings(): GameSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) {
        return { ...DEFAULT_SETTINGS };
      }
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch (error) {
      debugError('[SaveManager] Failed to load settings:', error);
      return { ...DEFAULT_SETTINGS };
    }
  }

  /**
   * Save current game settings to localStorage
   * 
   * @returns true if save successful, false otherwise
   * 
   * @example
   * ```typescript
   * const success = saveManager.saveSettings();
   * if (success) {
   *   console.log('Settings saved successfully');
   * }
   * ```
   */
  saveSettings(): boolean {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
      return true;
    } catch (error) {
      debugError('[SaveManager] Failed to save settings:', error);
      return false;
    }
  }

  /**
   * Get current settings
   */
  getSettings(): Readonly<GameSettings> {
    return this.settings;
  }

  /**
   * Update a single setting
   */
  setSetting<K extends keyof GameSettings>(key: K, value: GameSettings[K]): void {
    this.settings[key] = value;
    this.saveSettings();
  }

  /**
   * Reset settings to defaults
   */
  resetSettings(): void {
    this.settings = { ...DEFAULT_SETTINGS };
    this.saveSettings();
  }

  /**
   * Get UI scale setting
   */
  getUIScale(): 'small' | 'medium' | 'large' {
    return this.settings.uiScale || 'medium';
  }

  /**
   * Set UI scale setting
   */
  setUIScale(scale: 'small' | 'medium' | 'large'): void {
    this.setSetting('uiScale', scale);
  }

  // ===========================================================================
  // GAME STATE HELPERS
  // ===========================================================================

  /**
   * Add souls to the player's total
   */
  addSouls(amount: number): number {
    if (amount < 0) {
      throw new Error('Cannot add negative souls');
    }
    this.saveData.souls += amount;
    this.saveData.updatedAt = new Date().toISOString();
    this.save();
    return this.saveData.souls;
  }

  /**
   * Spend souls (returns false if not enough)
   */
  spendSouls(amount: number): boolean {
    if (amount < 0) {
      throw new Error('Cannot spend negative souls');
    }
    if (this.saveData.souls < amount) {
      return false;
    }
    this.saveData.souls -= amount;
    this.saveData.updatedAt = new Date().toISOString();
    this.save();
    return true;
  }

  /**
   * Get current souls
   */
  getSouls(): number {
    return this.saveData.souls;
  }

  /**
   * Update high score if new score is higher
   */
  updateHighScore(score: number): boolean {
    const levelId = 'endless'; // For endless mode
    const currentHigh = this.saveData.highScores[levelId] || 0;
    if (score > currentHigh) {
      this.saveData.highScores[levelId] = score;
      this.save();
      return true;
    }
    return false;
  }

  /**
   * Mark a level as completed with star rating
   */
  completeLevel(levelId: string, stars: number): void {
    const existing = this.saveData.levelStars[levelId] || 0;
    if (stars > existing) {
      this.saveData.levelStars[levelId] = stars;
      
      // Add to completed levels if not already there
      if (!this.saveData.completedLevels.includes(levelId)) {
        this.saveData.completedLevels.push(levelId);
      }
      
      this.save();
    }
  }

  /**
   * Check if a level is unlocked
   */
  isLevelUnlocked(levelId: string): boolean {
    // First level is always unlocked
    if (levelId === '1-1') return true;
    
    // Parse level ID (format: "world-level")
    const parts = levelId.split('-');
    if (parts.length !== 2) return false;
    
    const world = parseInt(parts[0] || '0');
    const level = parseInt(parts[1] || '0');
    
    if (isNaN(world) || isNaN(level)) return false;
    
    // Previous level in same world
    if (level > 1) {
      const prevLevel = `${world}-${level - 1}`;
      return (this.saveData.levelStars[prevLevel] || 0) > 0;
    }
    
    // First level of new world - need to beat boss of previous world
    if (world > 1) {
      const bossLevel = `${world - 1}-5`;
      return (this.saveData.levelStars[bossLevel] || 0) > 0;
    }
    
    return false;
  }

  /**
   * Get star count for a level
   */
  getLevelStars(levelId: string): number {
    return this.saveData.levelStars[levelId] || 0;
  }

  /**
   * Purchase a weapon
   */
  purchaseWeapon(weaponId: string): boolean {
    if (!this.saveData.unlockedWeapons.includes(weaponId)) {
      this.saveData.unlockedWeapons.push(weaponId);
      this.saveData.weaponTiers[weaponId] = 1;
      // Track weapon unlock time for new items badge
      this.saveData.weaponUnlockTimes[weaponId] = new Date().toISOString();
      this.save();
      return true;
    }
    return false;
  }

  /**
   * Upgrade a weapon tier
   */
  upgradeWeapon(weaponId: string): boolean {
    const currentTier = this.saveData.weaponTiers[weaponId] || 0;
    if (currentTier < 3) {
      this.saveData.weaponTiers[weaponId] = currentTier + 1;
      this.save();
      return true;
    }
    return false;
  }

  /**
   * Equip a weapon
   */
  equipWeapon(weaponId: string): void {
    if (this.saveData.unlockedWeapons.includes(weaponId)) {
      this.saveData.equippedWeapon = weaponId;
      this.save();
    }
  }

  /**
   * Purchase an upgrade level
   */
  purchaseUpgrade(upgradeId: keyof GameSave['upgrades']): boolean {
    const currentLevel = this.saveData.upgrades[upgradeId];
    if (currentLevel !== undefined && currentLevel < 5) {
      this.saveData.upgrades[upgradeId] = currentLevel + 1;
      this.save();
      return true;
    }
    return false;
  }

  /**
   * Update game statistics
   */
  updateStatistics(stats: Partial<GameSave['personalBests']>): void {
    // For now, just save the data
    this.save();
  }

  // ===========================================================================
  // AUTO-SAVE
  // ===========================================================================

  /**
   * Start auto-save interval
   * When cloud save is enabled and SupabaseService is available,
   * also syncs souls to the cloud on each auto-save interval
   */
  startAutoSave(intervalMs: number = 30000): void {
    this.stopAutoSave();
    this.autoSaveInterval = window.setInterval(() => {
      this.save();
      this.syncSoulsToCloud();
    }, intervalMs);
  }

  /**
   * Sync souls to cloud if cloud save is enabled
   */
  private async syncSoulsToCloud(): Promise<void> {
    // Check if cloud save is enabled in settings
    if (!this.settings.cloudSaveEnabled) {
      return;
    }

    // Check if SupabaseService is available
    if (!this.supabaseService || !this.supabaseService.isAvailable()) {
      return;
    }

    try {
      const success = await this.supabaseService.updatePlayerSouls(this.saveData.souls);
      if (success) {
        debugLog('[SaveManager] Souls synced to cloud:', this.saveData.souls);
      }
    } catch (error) {
      debugError('[SaveManager] Failed to sync souls to cloud:', error);
    }
  }

  /**
   * Stop auto-save interval
   */
  stopAutoSave(): void {
    if (this.autoSaveInterval !== null) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  /**
   * Update last shop visit timestamp
   * Call this when user visits the shop
   */
  updateLastShopVisit(): void {
    this.saveData.lastShopVisit = new Date().toISOString();
    this.save();
  }

  // ===========================================================================
  // MIGRATION
  // ===========================================================================

  /**
   * Migrate old save data to current version
   */
  private migrateSave(oldData: GameSave): GameSave {
    const data = { ...oldData };

    // Example migration from version 0 to 1
    // if (data.version < 1) {
    //   data.newField = defaultValue;
    //   data.version = 1;
    // }

    data.version = SAVE_VERSION;
    return { ...DEFAULT_SAVE, ...data };
  }

  // ===========================================================================
  // UTILITY
  // ===========================================================================

  /**
   * Check if localStorage is available
   */
  static isAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get approximate storage usage
   */
  getStorageUsage(): { used: number; available: number } {
    let used = 0;
    for (const key of Object.keys(localStorage)) {
      used += localStorage.getItem(key)?.length || 0;
    }
    // localStorage typically has 5MB limit
    return {
      used: used * 2, // UTF-16 encoding = 2 bytes per character
      available: 5 * 1024 * 1024,
    };
  }

  /**
   * Record level attempt
   */
  recordAttempt(levelId: string): void {
    this.saveData.levelAttempts[levelId] = (this.saveData.levelAttempts[levelId] || 0) + 1;
    this.save();
  }

  /**
   * Get attempt count for level
   */
  getLevelAttempts(levelId: string): number {
    const save = this.load();
    return save.levelAttempts[levelId] || 0;
  }

  /**
   * Get total attempts across all levels
   */
  getTotalAttempts(): number {
    const save = this.load();
    return Object.values(save.levelAttempts).reduce((sum, count) => sum + count, 0);
  }

  /**
   * Reset save data and settings
   */
  reset(): void {
    this.resetSave();
    this.resetSettings();
  }

  // ===========================================================================
  // STATISTICS TRACKING (NEW)
  // ===========================================================================

  /**
   * Get total souls earned (lifetime)
   */
  getTotalSoulsEarned(): number {
    return this.saveData.totalSoulsEarned || 0;
  }

  /**
   * Add souls to lifetime total
   */
  addTotalSoulsEarned(amount: number): void {
    this.saveData.totalSoulsEarned = (this.saveData.totalSoulsEarned || 0) + amount;
    this.save();
  }

  /**
   * Get total play time in milliseconds
   */
  getTimePlayedMs(): number {
    return this.saveData.playTimeMs || 0;
  }

  /**
   * Get play time formatted as readable string
   */
  getTimePlayed(): string {
    const ms = this.getTimePlayedMs();
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Add play time session
   */
  addPlayTime(ms: number): void {
    this.saveData.playTimeMs = (this.saveData.playTimeMs || 0) + ms;
    this.save();
  }

  /**
   * Get favorite weapon (most used)
   */
  getFavoriteWeapon(): string | null {
    const history = this.saveData.weaponUsageHistory;
    if (!history || Object.keys(history).length === 0) {
      return this.saveData.equippedWeapon || null;
    }

    let maxUses = 0;
    let favorite = null;

    for (const [weaponId, uses] of Object.entries(history)) {
      if (uses > maxUses) {
        maxUses = uses;
        favorite = weaponId;
      }
    }

    return favorite;
  }

  /**
   * Record weapon usage
   */
  recordWeaponUsage(weaponId: string): void {
    if (!this.saveData.weaponUsageHistory) {
      this.saveData.weaponUsageHistory = {};
    }
    this.saveData.weaponUsageHistory[weaponId] = (this.saveData.weaponUsageHistory[weaponId] || 0) + 1;
    this.save();
  }

  /**
   * Get completion percentage
   */
  getCompletionPercentage(): number {
    const totalLevels = 25; // 5 worlds * 5 levels each
    const completedCount = Object.keys(this.saveData.levelStars).filter(
      (levelId) => (this.saveData.levelStars[levelId] || 0) > 0
    ).length;
    return Math.floor((completedCount / totalLevels) * 100);
  }

  /**
   * Get total monsters defeated
   */
  getTotalMonstersDefeated(): number {
    return this.saveData.totalMonstersDefeated || 0;
  }

  /**
   * Add to monsters defeated count
   */
  addMonstersDefeated(count: number): void {
    this.saveData.totalMonstersDefeated = (this.saveData.totalMonstersDefeated || 0) + count;
    this.save();
  }

  /**
   * Get max combo ever achieved
   */
  getMaxComboEver(): number {
    return this.saveData.maxComboEver || 0;
  }

  /**
   * Update max combo if current is higher
   */
  updateMaxCombo(combo: number): boolean {
    const currentMax = this.saveData.maxComboEver || 0;
    if (combo > currentMax) {
      this.saveData.maxComboEver = combo;
      this.save();
      return true;
    }
    return false;
  }

  /**
   * Get last played level
   */
  getLastPlayedLevel(): string | null {
    const completedLevels = this.saveData.completedLevels || [];
    if (completedLevels.length === 0) {
      return '1-1'; // First level default
    }
    return completedLevels[completedLevels.length - 1];
  }

  /**
   * Get today's daily challenge
   */
  getDailyChallenge(): DailyChallenge | null {
    const today = new Date().toISOString().split('T')[0];
    return this.saveData.dailyChallenges?.[today] || null;
  }

  /**
   * Generate daily challenge for today
   */
  generateDailyChallenge(): DailyChallenge {
    const today = new Date().toISOString().split('T')[0];
    const challengeTypes = ['endless_survival', 'level_speedrun', 'combo_challenge'];
    const randomType = challengeTypes[Math.floor(Math.random() * challengeTypes.length)];
    
    const challenge: DailyChallenge = {
      date: today,
      challengeId: randomType,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      rewardMultiplier: 2,
      completed: false,
    };

    if (!this.saveData.dailyChallenges) {
      this.saveData.dailyChallenges = {};
    }
    this.saveData.dailyChallenges[today] = challenge;
    this.save();
    
    return challenge;
  }

  /**
   * Mark daily challenge as completed
   */
  setDailyChallengeCompleted(): boolean {
    const challenge = this.getDailyChallenge();
    if (challenge && !challenge.completed) {
      challenge.completed = true;
      this.save();
      return true;
    }
    return false;
  }

  /**
   * Shutdown and cleanup
   */
  shutdown(): void {
    this.stopAutoSave();
  }
}
