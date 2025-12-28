-- Monster Slayer - Supabase Database Schema
-- Run this in the Supabase SQL Editor to set up your database

-- =============================================================================
-- LEADERBOARD TABLE
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
  
  -- Optional: link to user account
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index for fast leaderboard queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_created_at ON leaderboard(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_id ON leaderboard(user_id);

-- =============================================================================
-- CLOUD SAVES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS cloud_saves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  save_data JSONB NOT NULL,
  save_version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_cloud_saves_user_id ON cloud_saves(user_id);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE cloud_saves ENABLE ROW LEVEL SECURITY;

-- Leaderboard Policies

-- Anyone can read the leaderboard
CREATE POLICY "Leaderboard is viewable by everyone"
  ON leaderboard FOR SELECT
  USING (true);

-- Anyone can insert scores (for anonymous play)
CREATE POLICY "Anyone can submit scores"
  ON leaderboard FOR INSERT
  WITH CHECK (true);

-- Users can only update their own scores (if linked)
CREATE POLICY "Users can update own scores"
  ON leaderboard FOR UPDATE
  USING (auth.uid() = user_id);

-- Cloud Saves Policies

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
-- FUNCTIONS
-- =============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for cloud_saves updated_at
CREATE TRIGGER update_cloud_saves_updated_at
  BEFORE UPDATE ON cloud_saves
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to get leaderboard with rank
CREATE OR REPLACE FUNCTION get_leaderboard_with_rank(
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0,
  p_time_filter VARCHAR DEFAULT 'all' -- 'all', 'weekly', 'daily'
)
RETURNS TABLE (
  rank BIGINT,
  id UUID,
  player_name VARCHAR,
  score INTEGER,
  weapon_used VARCHAR,
  monsters_sliced INTEGER,
  max_combo INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY l.score DESC) as rank,
    l.id,
    l.player_name,
    l.score,
    l.weapon_used,
    l.monsters_sliced,
    l.max_combo,
    l.created_at
  FROM leaderboard l
  WHERE
    CASE p_time_filter
      WHEN 'weekly' THEN l.created_at >= NOW() - INTERVAL '7 days'
      WHEN 'daily' THEN l.created_at >= NOW() - INTERVAL '1 day'
      ELSE true
    END
  ORDER BY l.score DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Function to get a player's rank
CREATE OR REPLACE FUNCTION get_player_rank(p_score INTEGER)
RETURNS BIGINT AS $$
DECLARE
  v_rank BIGINT;
BEGIN
  SELECT COUNT(*) + 1 INTO v_rank
  FROM leaderboard
  WHERE score > p_score;
  
  RETURN v_rank;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- SAMPLE QUERIES (for reference)
-- =============================================================================

/*
-- Get top 100 scores
SELECT * FROM get_leaderboard_with_rank(100, 0, 'all');

-- Get weekly leaderboard
SELECT * FROM get_leaderboard_with_rank(100, 0, 'weekly');

-- Get player's rank for a score
SELECT get_player_rank(5000);

-- Insert a new score
INSERT INTO leaderboard (player_name, score, weapon_used, monsters_sliced, max_combo, time_elapsed_seconds)
VALUES ('PlayerName', 5000, 'fire_sword', 150, 25, 180);

-- Get user's cloud save
SELECT save_data FROM cloud_saves WHERE user_id = auth.uid();

-- Upsert cloud save (insert or update)
INSERT INTO cloud_saves (user_id, save_data, save_version)
VALUES (auth.uid(), '{"souls": 1000, ...}'::jsonb, 1)
ON CONFLICT (user_id)
DO UPDATE SET
  save_data = EXCLUDED.save_data,
  save_version = EXCLUDED.save_version,
  updated_at = NOW();
*/

-- =============================================================================
-- CLEANUP (if you need to reset)
-- =============================================================================

/*
-- WARNING: This will delete all data!
DROP TABLE IF EXISTS cloud_saves;
DROP TABLE IF EXISTS leaderboard;
DROP FUNCTION IF EXISTS update_updated_at_column;
DROP FUNCTION IF EXISTS get_leaderboard_with_rank;
DROP FUNCTION IF EXISTS get_player_rank;
*/
