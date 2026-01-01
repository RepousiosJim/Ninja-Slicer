/**
 * SupabaseService
 * 
 * Handles all Supabase interactions:
 * - Anonymous authentication
 * - Cloud save backup
 * - Leaderboard submission and retrieval
 * 
 * Requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
 */

import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { debugLog, debugWarn, debugError } from '@utils/DebugLogger';


import { GameSave } from '@config/types';

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
  updated_at: string;
}

export interface PlayerProfile {
  user_id: string;
  souls: number;
  created_at: string;
  updated_at: string;
}

export class SupabaseService {
  private client: SupabaseClient | null = null;
  private user: User | null = null;
  private initialized: boolean = false;

  constructor() {
    this.initialize();
  }

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  /**
   * Initialize Supabase client
   */
  private initialize(): void {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      debugWarn('[SupabaseService] Missing Supabase credentials. Online features disabled.');
      return;
    }

    try {
      this.client = createClient(supabaseUrl, supabaseKey);
      this.initialized = true;
      debugLog('[SupabaseService] Initialized');
    } catch (error) {
      console.error('[SupabaseService] Failed to initialize:', error);
    }
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return this.initialized && this.client !== null;
  }

  // ===========================================================================
  // AUTHENTICATION
  // ===========================================================================

  /**
   * Sign in anonymously (for cloud saves without account)
   */
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

  /**
   * Get current user session
   */
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

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    if (!this.client) return;

    try {
      await this.client.auth.signOut();
      this.user = null;
    } catch (error) {
      debugError('[SupabaseService] Sign out failed:', error);
    }
  }

  // ===========================================================================
  // LEADERBOARD
  // ===========================================================================

  /**
   * Submit a score to the leaderboard
   */
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

    try {
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

      return data as LeaderboardEntry;
    } catch (error) {
      debugError('[SupabaseService] Failed to submit score:', error);
      return null;
    }
  }

  /**
   * Get top scores from leaderboard
   */
  async getLeaderboard(
    limit: number = 100,
    timeFilter: 'all' | 'weekly' | 'daily' = 'all',
  ): Promise<LeaderboardEntry[]> {
    if (!this.client) return [];

    try {
      let query = this.client
        .from('leaderboard')
        .select('*')
        .order('score', { ascending: false })
        .limit(limit);

      // Apply time filter
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

      // Add rank to each entry
      return (data || []).map((entry, index) => ({
        ...entry,
        rank: index + 1,
      })) as LeaderboardEntry[];
    } catch (error) {
      debugError('[SupabaseService] Failed to get leaderboard:', error);
      return [];
    }
  }

  /**
   * Get rank for a specific score
   */
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

  /**
   * Get player's personal best scores
   */
  async getPersonalBests(limit: number = 10): Promise<LeaderboardEntry[]> {
    if (!this.client || !this.user) return [];

    try {
      const { data, error } = await this.client
        .from('leaderboard')
        .select('*')
        .eq('user_id', this.user.id)
        .order('score', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []) as LeaderboardEntry[];
    } catch (error) {
      debugError('[SupabaseService] Failed to get personal bests:', error);
      return [];
    }
  }

  // ===========================================================================
  // CLOUD SAVES
  // ===========================================================================

  /**
   * Save game data to cloud
   */
  async saveToCloud(saveData: GameSave): Promise<boolean> {
    if (!this.client || !this.user) {
      debugWarn('[SupabaseService] Cannot save to cloud: not authenticated');
      return false;
    }

    try {
      const { error } = await this.client
        .from('cloud_saves')
        .upsert({
          user_id: this.user.id,
          save_data: saveData,
          save_version: saveData.version,
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      debugLog('[SupabaseService] Cloud save successful');
      return true;
    } catch (error) {
      debugError('[SupabaseService] Cloud save failed:', error);
      return false;
    }
  }

  /**
   * Load game data from cloud
   */
  async loadFromCloud(): Promise<GameSave | null> {
    if (!this.client || !this.user) {
      debugWarn('[SupabaseService] Cannot load from cloud: not authenticated');
      return null;
    }

    try {
      const { data, error } = await this.client
        .from('cloud_saves')
        .select('save_data')
        .eq('user_id', this.user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No save found - this is normal for new users
          return null;
        }
        throw error;
      }

      return data?.save_data as GameSave || null;
    } catch (error) {
      debugError('[SupabaseService] Cloud load failed:', error);
      return null;
    }
  }

  /**
   * Delete cloud save data
   */
  async deleteCloudSave(): Promise<boolean> {
    if (!this.client || !this.user) return false;

    try {
      const { error } = await this.client
        .from('cloud_saves')
        .delete()
        .eq('user_id', this.user.id);

      if (error) throw error;

      return true;
    } catch (error) {
      debugError('[SupabaseService] Failed to delete cloud save:', error);
      return false;
    }
  }

  /**
   * Sync local save with cloud (merges data, keeping best values)
   */
  async syncSave(localSave: GameSave): Promise<GameSave> {
    const cloudSave = await this.loadFromCloud();
    
    if (!cloudSave) {
      // No cloud save - upload local
      await this.saveToCloud(localSave);
      return localSave;
    }

    // Merge saves - keep highest values
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

    // Save merged data to cloud
    await this.saveToCloud(mergedSave);
    
    return mergedSave;
  }

  /**
   * Helper to merge two objects, applying a merge function to conflicting keys
   */
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

  // ===========================================================================
  // PLAYER PROFILES (SOULS PERSISTENCE)
  // ===========================================================================

  /**
   * Get player profile with souls from Supabase
   */
  async getPlayerProfile(): Promise<PlayerProfile | null> {
    if (!this.client || !this.user) {
      debugWarn('[SupabaseService] Cannot get player profile: not authenticated');
      return null;
    }

    try {
      const { data, error } = await this.client
        .from('player_profiles')
        .select('*')
        .eq('user_id', this.user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found - this is normal for new users
          return null;
        }
        throw error;
      }

      return data as PlayerProfile;
    } catch (error) {
      debugError('[SupabaseService] Failed to get player profile:', error);
      return null;
    }
  }

  /**
   * Update souls in player profile
   */
  async updatePlayerSouls(souls: number): Promise<boolean> {
    if (!this.client || !this.user) {
      debugWarn('[SupabaseService] Cannot update souls: not authenticated');
      return false;
    }

    // Validate souls is non-negative
    if (souls < 0) {
      debugError('[SupabaseService] Invalid souls value: cannot be negative');
      return false;
    }

    try {
      const { error } = await this.client
        .from('player_profiles')
        .upsert({
          user_id: this.user.id,
          souls: souls,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      debugLog('[SupabaseService] Souls updated successfully:', souls);
      return true;
    } catch (error) {
      debugError('[SupabaseService] Failed to update souls:', error);
      return false;
    }
  }

  /**
   * Sync souls between local and cloud storage
   * Returns the merged (highest) soul count
   */
  async syncPlayerSouls(localSouls: number): Promise<number> {
    const profile = await this.getPlayerProfile();

    if (!profile) {
      // No cloud profile - create one with local souls
      await this.updatePlayerSouls(localSouls);
      return localSouls;
    }

    // Take the higher value to prevent soul loss
    const mergedSouls = Math.max(localSouls, profile.souls);

    // Update cloud if local is higher
    if (localSouls > profile.souls) {
      await this.updatePlayerSouls(mergedSouls);
    }

    return mergedSouls;
  }
}
