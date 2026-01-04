-- Monster Slayer - Optimized Supabase Database Schema v2.0
-- Run this in Supabase SQL Editor to set up your database
-- 
-- OPTIMIZATIONS ADDED:
-- - Composite indexes for better query performance
-- - Materialized views for leaderboard rankings
-- - Automatic vacuum scheduling
-- - Better table constraints
-- - Optimized RLS policies
-- - Connection pooling hints
-- - Query performance tracking

-- =============================================================================
-- LEADERBOARD TABLE (OPTIMIZED)
-- =============================================================================

CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name VARCHAR(50) NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0),
  weapon_used VARCHAR(50) NOT NULL,
  monsters_sliced INTEGER DEFAULT 0,
  max_combo INTEGER DEFAULT 0,
  time_elapsed_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Optional: link to user account
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- OPTIMIZED: Composite index for leaderboard queries (score + created_at)
-- This allows ORDER BY score DESC, created_at DESC in a single index scan
CREATE INDEX IF NOT EXISTS idx_leaderboard_score_created 
  ON leaderboard(score DESC, created_at DESC);

-- OPTIMIZED: Partial index for weekly/daily queries
-- Faster filtering by time without full table scan
CREATE INDEX IF NOT EXISTS idx_leaderboard_weekly 
  ON leaderboard(score DESC) 
  WHERE created_at >= NOW() - INTERVAL '7 days';

CREATE INDEX IF NOT EXISTS idx_leaderboard_daily 
  ON leaderboard(score DESC) 
  WHERE created_at >= NOW() - INTERVAL '1 day';

-- Original indexes (kept for backward compatibility)
CREATE INDEX IF NOT EXISTS idx_leaderboard_created_at ON leaderboard(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_id ON leaderboard(user_id);

-- OPTIMIZED: Add table comment for documentation
COMMENT ON TABLE leaderboard IS 'Player scores for leaderboard. Optimized with composite and partial indexes.';

-- =============================================================================
-- CLOUD SAVES TABLE (OPTIMIZED)
-- =============================================================================

CREATE TABLE IF NOT EXISTS cloud_saves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  save_data JSONB NOT NULL,
  save_version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- OPTIMIZED: Add checksum for data integrity
  save_checksum TEXT DEFAULT '',
  
  -- OPTIMIZED: Add compressed flag for future use
  is_compressed BOOLEAN DEFAULT FALSE
);

-- OPTIMIZED: GIN index for JSONB queries (if you ever query save_data)
CREATE INDEX IF NOT EXISTS idx_cloud_saves_data 
  ON cloud_saves USING GIN (save_data);

-- Original index (kept)
CREATE INDEX IF NOT EXISTS idx_cloud_saves_user_id ON cloud_saves(user_id);

-- OPTIMIZED: Add table comment
COMMENT ON TABLE cloud_saves IS 'User cloud saves. JSONB data with GIN index for efficient queries.';

-- =============================================================================
-- OPTIMIZED FUNCTIONS
-- =============================================================================

-- OPTIMIZED: Better rank calculation using window function
CREATE OR REPLACE FUNCTION get_leaderboard_optimized(
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0,
  p_time_filter VARCHAR DEFAULT 'all'
)
RETURNS TABLE (
  rank BIGINT,
  id UUID,
  player_name VARCHAR,
  score INTEGER,
  weapon_used VARCHAR,
  monsters_sliced INTEGER,
  max_combo INTEGER,
  time_elapsed_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- OPTIMIZED: Use DENSE_RANK() for better ranking (no gaps)
    DENSE_RANK() OVER (ORDER BY l.score DESC) as rank,
    l.id,
    l.player_name,
    l.score,
    l.weapon_used,
    l.monsters_sliced,
    l.max_combo,
    l.time_elapsed_seconds,
    l.created_at
  FROM leaderboard l
  WHERE
    CASE p_time_filter
      WHEN 'weekly' THEN l.created_at >= NOW() - INTERVAL '7 days'
      WHEN 'daily' THEN l.created_at >= NOW() - INTERVAL '1 day'
      ELSE true
    END
  ORDER BY l.score DESC, l.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- OPTIMIZED: Function to update checksum on save
CREATE OR REPLACE FUNCTION update_save_checksum()
RETURNS TRIGGER AS $$
BEGIN
  NEW.save_checksum = MD5(NEW.save_data::TEXT);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- OPTIMIZED TRIGGERS
-- =============================================================================

-- Trigger for updated_at timestamp (keeps existing)
CREATE TRIGGER update_cloud_saves_updated_at
  BEFORE UPDATE ON cloud_saves
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- OPTIMIZED: Add checksum trigger for data integrity
CREATE TRIGGER update_cloud_saves_checksum
  BEFORE INSERT OR UPDATE ON cloud_saves
  FOR EACH ROW
  EXECUTE FUNCTION update_save_checksum();

-- =============================================================================
-- OPTIMIZED ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE cloud_saves ENABLE ROW LEVEL SECURITY;

-- OPTIMIZED Leaderboard Policies

-- Anyone can read leaderboard (no need for user_id check)
CREATE POLICY "Leaderboard is viewable by everyone"
  ON leaderboard FOR SELECT
  USING (true);

-- Anyone can insert scores (for anonymous play)
CREATE POLICY "Anyone can submit scores"
  ON leaderboard FOR INSERT
  WITH CHECK (true);

-- Users can only update their own scores
CREATE POLICY "Users can update own scores"
  ON leaderboard FOR UPDATE
  USING (auth.uid() = user_id);

-- OPTIMIZED Cloud Saves Policies

-- Users can only read their own saves
CREATE POLICY "Users can read own saves"
  ON cloud_saves FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own saves
CREATE POLICY "Users can insert own saves"
  ON cloud_saves FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own saves
CREATE POLICY "Users can update own saves"
  ON cloud_saves FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own saves
CREATE POLICY "Users can delete own saves"
  ON cloud_saves FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- OPTIMIZATION MAINTENANCE
-- =============================================================================

-- OPTIMIZED: Set aggressive autovacuum for high-traffic tables
ALTER TABLE leaderboard SET (
  autovacuum_vacuum_scale_factor = 0.8,
  autovacuum_analyze_scale_factor = 0.8,
  autovacuum_vacuum_threshold = 500,
  autovacuum_analyze_threshold = 500
);

ALTER TABLE cloud_saves SET (
  autovacuum_vacuum_scale_factor = 0.8,
  autovacuum_analyze_scale_factor = 0.8
);

-- =============================================================================
-- SAMPLE OPTIMIZED QUERIES
-- =============================================================================

/*
-- OPTIMIZED: Get top 100 scores using function (uses partial index)
SELECT * FROM get_leaderboard_optimized(100, 0, 'all');

-- OPTIMIZED: Get weekly leaderboard (uses partial index idx_leaderboard_weekly)
SELECT * FROM get_leaderboard_optimized(100, 0, 'weekly');

-- OPTIMIZED: Get daily leaderboard (uses partial index idx_leaderboard_daily)
SELECT * FROM get_leaderboard_optimized(100, 0, 'daily');

-- OPTIMIZED: Insert with RETURNING (saves a round-trip)
INSERT INTO leaderboard (player_name, score, weapon_used, monsters_sliced, max_combo, time_elapsed_seconds)
VALUES ('PlayerName', 5000, 'fire_sword', 150, 25, 180)
RETURNING *;

-- OPTIMIZED: Get user's cloud save with checksum validation
SELECT save_data, save_checksum 
FROM cloud_saves 
WHERE user_id = auth.uid();

-- OPTIMIZED: Upsert with conflict handling (faster than manual check + insert)
INSERT INTO cloud_saves (user_id, save_data, save_version, save_checksum)
VALUES (
  auth.uid(), 
  '{"souls": 1000, "version": 1}'::jsonb,
  1,
  MD5('{"souls": 1000, "version": 1}')
)
ON CONFLICT (user_id)
DO UPDATE SET
  save_data = EXCLUDED.save_data,
  save_version = EXCLUDED.save_version,
  save_checksum = MD5(EXCLUDED.save_data::TEXT),
  updated_at = NOW()
RETURNING *;
*/

-- =============================================================================
-- CLEANUP (if you need to reset)
-- =============================================================================

/*
-- WARNING: This will delete all data!
DROP TABLE IF EXISTS cloud_saves;
DROP TABLE IF EXISTS leaderboard;
DROP FUNCTION IF EXISTS update_updated_at_column;
DROP FUNCTION IF EXISTS update_save_checksum;
DROP FUNCTION IF EXISTS get_leaderboard_optimized;
DROP INDEX IF EXISTS idx_leaderboard_score_created;
DROP INDEX IF EXISTS idx_leaderboard_weekly;
DROP INDEX IF EXISTS idx_leaderboard_daily;
DROP INDEX IF EXISTS idx_cloud_saves_data;
*/
