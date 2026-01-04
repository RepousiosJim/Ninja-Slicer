/**
 * SupabaseService (OPTIMIZED v2.0)
 * 
 * Handles all Supabase interactions with performance optimizations:
 * - Request caching to reduce API calls
 * - Debounced save operations
 * - Better error handling with retry logic
 * - Checksum validation for data integrity
 * 
 * Requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
 */

import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { debugLog, debugWarn, debugError } from '@utils/DebugLogger';

import type { GameSave } from '@config/types';

// Types for database tables
export interface LeaderboardEntry {
  id: string;
  player_name: string;
  score: number;
  weapon_used: string;
  monsters_sliced: number;
  max_combo: number;
  time_elapsed_seconds: number;
  created_at: string;
  user_id?: string;
  rank?: number;
}

export interface CloudSaveData {
  user_id: string;
  save_data: GameSave;
  save_version: number;
  save_checksum: string;
  is_compressed: boolean;
  updated_at: string;
}

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

export class SupabaseService {
  private client: SupabaseClient | null = null;
  private user: User | null = null;
  private initialized: boolean = false;

  // OPTIMIZED: In-memory caching
  private leaderboardCache: Map<string, CacheEntry> = new Map();
  private personalBestsCache: CacheEntry | null = null;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly PERSONAL_BESTS_TTL = 10 * 60 * 1000; // 10 minutes

  // OPTIMIZED: Debouncing for saves
  private saveDebounceTimer: number | null = null;
  private readonly SAVE_DEBOUNCE_MS = 500;

  // OPTIMIZED: Retry configuration
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000;

  constructor() {
    this.initialize();
  }

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  private initialize(): void {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      debugWarn('[SupabaseService] Missing Supabase credentials. Online features disabled.');
      return;
    }

    try {
      this.client = createClient(supabaseUrl, supabaseKey, {
        auth: {
          storage: window.localStorage,
          autoRefreshToken: true,
        },
        global: {
          headers: {
            'X-Client-Info': 'monster-slicer-game',
          },
        },
      });
      this.initialized = true;
      debugLog('[SupabaseService] Initialized with optimizations');
    } catch (error) {
      debugError('[SupabaseService] Failed to initialize:', error);
    }
  }

  isAvailable(): boolean {
    return this.initialized && this.client !== null;
  }

  // ===========================================================================
  // CACHING HELPERS
  // ===========================================================================

  private getFromCache(key: string): any | null {
    const entry = this.leaderboardCache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.leaderboardCache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.leaderboardCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  private clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.leaderboardCache) {
      if (now - entry.timestamp > entry.ttl) {
        this.leaderboardCache.delete(key);
      }
    }

    if (this.personalBestsCache && now - this.personalBestsCache.timestamp > this.personalBestsCache.ttl) {
      this.personalBestsCache = null;
    }
  }

  // ===========================================================================
  // AUTHENTICATION
  // ===========================================================================

  async signInAnonymously(): Promise<User | null> {
    if (!this.client) return null;

    try {
      const { data, error } = await this.client.auth.signInAnonymously();
      
      if (error) throw error;
      
      this.user = data.user;
      return this.user;
    } catch (error) {
      debugError('[SupabaseService] Anonymous sign-in failed:', error);
      return null;
    }
  }

  async getUser(): Promise<User | null> {
    if (!this.client) return null;

    try {
      const { data: { user } } = await this.client.auth.getUser();
      this.user = user;
      return user;
    } catch (error) {
      debugError('[SupabaseService] Failed to get user:', error);
      return null;
    }
  }

  async signOut(): Promise<void> {
    if (!this.client) return;

    try {
      await this.client.auth.signOut();
      this.user = null;
      this.clearCache();
      debugLog('[SupabaseService] Signed out');
    } catch (error) {
      debugError('[SupabaseService] Sign out failed:', error);
    }
  }

  // ===========================================================================
  // LEADERBOARD (OPTIMIZED)
  // ===========================================================================

  async submitScore(entry: {
    playerName: string;
    score: number;
    weaponUsed: string;
    monstersSliced: number;
    maxCombo: number;
    timeElapsedSeconds: number;
  }): Promise<LeaderboardEntry | null> {
    if (!this.client) {
      debugWarn('[SupabaseService] Cannot submit score: not initialized');
      return null;
    }

    return this.retryWithBackoff(async () => {
      const { data, error } = await this.client
        .from('leaderboard')
        .insert({
          player_name: entry.playerName,
          score: entry.score,
          weapon_used: entry.weaponUsed,
          monsters_sliced: entry.monstersSliced,
          max_combo: entry.maxCombo,
          time_elapsed_seconds: entry.timeElapsedSeconds,
          user_id: this.user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Invalidate cache on new score
      this.leaderboardCache.clear();

      return data as LeaderboardEntry;
    });
  }

  async getLeaderboard(
    limit: number = 100,
    timeFilter: 'all' | 'weekly' | 'daily' = 'all',
  ): Promise<LeaderboardEntry[]> {
    if (!this.client) return [];

    const cacheKey = `leaderboard_${limit}_${timeFilter}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      debugLog('[SupabaseService] Leaderboard from cache');
      return cached;
    }

    try {
      let query = this.client
        .from('leaderboard')
        .select('*')
        .order('score', { ascending: false })
        .limit(limit);

      if (timeFilter === 'weekly') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte('created_at', weekAgo.toISOString());
      } else if (timeFilter === 'daily') {
        const dayAgo = new Date();
        dayAgo.setDate(dayAgo.getDate() - 1);
        query = query.gte('created_at', dayAgo.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      const result = (data || []).map((entry, index) => ({
        ...entry,
        rank: index + 1,
      })) as LeaderboardEntry[];

      this.setCache(cacheKey, result, this.CACHE_TTL);
      return result;
    } catch (error) {
      debugError('[SupabaseService] Failed to get leaderboard:', error);
      return [];
    }
  }

  async getRankForScore(score: number): Promise<number> {
    if (!this.client) return -1;

    try {
      const { count, error } = await this.client
        .from('leaderboard')
        .select('*', { count: 'exact', head: true })
        .gt('score', score);

      if (error) throw error;

      return (count || 0) + 1;
    } catch (error) {
      debugError('[SupabaseService] Failed to get rank:', error);
      return -1;
    }
  }

  async getPersonalBests(limit: number = 10): Promise<LeaderboardEntry[]> {
    if (!this.client || !this.user) return [];

    if (this.personalBestsCache && Date.now() - this.personalBestsCache.timestamp < this.personalBestsCache.ttl) {
      debugLog('[SupabaseService] Personal bests from cache');
      return this.personalBestsCache.data;
    }

    try {
      const { data, error } = await this.client
        .from('leaderboard')
        .select('*')
        .eq('user_id', this.user.id)
        .order('score', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const result = (data || []) as LeaderboardEntry[];

      this.personalBestsCache = {
        data: result,
        timestamp: Date.now(),
        ttl: this.PERSONAL_BESTS_TTL,
      };

      return result;
    } catch (error) {
      debugError('[SupabaseService] Failed to get personal bests:', error);
      return [];
    }
  }

  // ===========================================================================
  // CLOUD SAVES (OPTIMIZED)
  // ===========================================================================

  async saveToCloud(saveData: GameSave): Promise<boolean> {
    if (!this.client || !this.user) {
      debugWarn('[SupabaseService] Cannot save to cloud: not authenticated');
      return false;
    }

    return new Promise((resolve) => {
      if (this.saveDebounceTimer !== null) {
        clearTimeout(this.saveDebounceTimer);
      }

      this.saveDebounceTimer = window.setTimeout(async () => {
        const result = await this.performSave(saveData);
        resolve(result);
        this.saveDebounceTimer = null;
      }, this.SAVE_DEBOUNCE_MS);
    });
  }

  private async performSave(saveData: GameSave): Promise<boolean> {
    return this.retryWithBackoff(async () => {
      const saveDataJson = JSON.stringify(saveData);
      const checksum = this.calculateChecksum(saveDataJson);

      const { error } = await this.client
        .from('cloud_saves')
        .upsert({
          user_id: this.user!.id,
          save_data: saveData,
          save_version: saveData.version,
          save_checksum: checksum,
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      debugLog('[SupabaseService] Cloud save successful');
      return true;
    });
  }

  async loadFromCloud(): Promise<GameSave | null> {
    if (!this.client || !this.user) {
      debugWarn('[SupabaseService] Cannot load from cloud: not authenticated');
      return null;
    }

    try {
      const { data, error } = await this.client
        .from('cloud_saves')
        .select('save_data, save_checksum')
        .eq('user_id', this.user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      if (!data) return null;

      const saveData = data.save_data as GameSave;
      const expectedChecksum = data.save_checksum;
      const actualChecksum = this.calculateChecksum(JSON.stringify(saveData));

      if (expectedChecksum && actualChecksum !== expectedChecksum) {
        debugError('[SupabaseService] Cloud save checksum mismatch!');
      }

      return saveData;
    } catch (error) {
      debugError('[SupabaseService] Cloud load failed:', error);
      return null;
    }
  }

  async deleteCloudSave(): Promise<boolean> {
    if (!this.client || !this.user) return false;

    try {
      const { error } = await this.client
        .from('cloud_saves')
        .delete()
        .eq('user_id', this.user.id);

      if (error) throw error;

      debugLog('[SupabaseService] Cloud save deleted');
      return true;
    } catch (error) {
      debugError('[SupabaseService] Failed to delete cloud save:', error);
      return false;
    }
  }

  async syncSave(localSave: GameSave): Promise<GameSave> {
    const cloudSave = await this.loadFromCloud();
    
    if (!cloudSave) {
      await this.saveToCloud(localSave);
      return localSave;
    }

    const mergedSave: GameSave = {
      ...localSave,
      souls: Math.max(localSave.souls, cloudSave.souls),
      unlockedWeapons: [...new Set([
        ...localSave.unlockedWeapons,
        ...cloudSave.unlockedWeapons,
      ])],
      weaponTiers: this.mergeObjects(
        localSave.weaponTiers,
        cloudSave.weaponTiers,
        Math.max,
      ),
      upgrades: this.mergeObjects(
        localSave.upgrades,
        cloudSave.upgrades,
        Math.max,
      ) as GameSave['upgrades'],
      completedLevels: [...new Set([
        ...localSave.completedLevels,
        ...cloudSave.completedLevels,
      ])],
      levelStars: this.mergeObjects(
        localSave.levelStars,
        cloudSave.levelStars,
        Math.max,
      ),
      highScores: this.mergeObjects(
        localSave.highScores,
        cloudSave.highScores,
        Math.max,
      ),
      personalBests: [...new Set([
        ...localSave.personalBests,
        ...cloudSave.personalBests,
      ])],
      updatedAt: new Date().toISOString(),
    };

    await this.saveToCloud(mergedSave);
    return mergedSave;
  }

  // ===========================================================================
  // UTILITY FUNCTIONS
  // ===========================================================================

  private calculateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  private mergeObjects<T extends Record<string, number>>(
    obj1: T,
    obj2: T,
    mergeFn: (a: number, b: number) => number,
  ): T {
    const result = { ...obj1 } as T;
    for (const key of Object.keys(obj2)) {
      if (key in result) {
        const val1 = (result as Record<string, number>)[key];
        const val2 = (obj2 as Record<string, number>)[key];
        if (val1 !== undefined && val2 !== undefined) {
          (result as Record<string, number>)[key] = mergeFn(val1, val2);
        } else if (val2 !== undefined) {
          (result as Record<string, number>)[key] = val2;
        }
      } else {
        const val2 = (obj2 as Record<string, number>)[key];
        if (val2 !== undefined) {
          (result as Record<string, number>)[key] = val2;
        }
      }
    }
    return result;
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    retries: number = this.MAX_RETRIES,
    delay: number = this.RETRY_DELAY_MS,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retries <= 0) {
        throw error;
      }

      debugWarn(`[SupabaseService] Retry ${this.MAX_RETRIES - retries + 1}/${this.MAX_RETRIES} after ${delay}ms`);

      await new Promise(resolve => setTimeout(resolve, delay));
      return this.retryWithBackoff(operation, retries - 1, delay * 2);
    }
  }

  clearCache(): void {
    this.leaderboardCache.clear();
    this.personalBestsCache = null;
    debugLog('[SupabaseService] Cache cleared');
  }

  getCacheStats(): {
    leaderboardEntries: number;
    personalBestsCached: boolean;
    totalCacheSize: number;
  } {
    return {
      leaderboardEntries: this.leaderboardCache.size,
      personalBestsCached: this.personalBestsCache !== null,
      totalCacheSize: this.leaderboardCache.size + (this.personalBestsCache ? 1 : 0),
    };
  }
}
