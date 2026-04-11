-- ---------------------------------------------------------------------------
-- 014: Board Games table — BGG-sourced game directory
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS board_games (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bgg_id        INTEGER UNIQUE NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  image_url     TEXT,
  thumbnail_url TEXT,
  year_published INTEGER,
  min_players   INTEGER,
  max_players   INTEGER,
  play_time_min INTEGER,
  play_time_max INTEGER,
  min_age       INTEGER,
  complexity    NUMERIC(3,2),     -- BGG weight 1.00–5.00
  bgg_rank      INTEGER,          -- BGG overall rank
  bgg_rating    NUMERIC(4,2),     -- BGG average rating 0.00–10.00
  designers     TEXT[] DEFAULT '{}',
  publishers    TEXT[] DEFAULT '{}',
  categories    TEXT[] DEFAULT '{}',
  mechanics     TEXT[] DEFAULT '{}',
  amazon_asin   TEXT,
  zatu_url      TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Indices for common query patterns
CREATE INDEX IF NOT EXISTS idx_board_games_bgg_rank ON board_games (bgg_rank ASC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_board_games_bgg_rating ON board_games (bgg_rating DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_board_games_title ON board_games USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_board_games_categories ON board_games USING gin (categories);
CREATE INDEX IF NOT EXISTS idx_board_games_mechanics ON board_games USING gin (mechanics);
CREATE INDEX IF NOT EXISTS idx_board_games_players ON board_games (min_players, max_players);

-- Enable trigram extension if not already present (for fuzzy title search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- RLS: public read, service-role write
ALTER TABLE board_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "board_games_public_read"
  ON board_games FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "board_games_service_write"
  ON board_games FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
