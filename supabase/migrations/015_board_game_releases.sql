-- ---------------------------------------------------------------------------
-- 015: Board Game Releases table — upcoming game releases calendar
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS board_game_releases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id         UUID REFERENCES board_games(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  release_date    DATE,
  release_type    TEXT NOT NULL DEFAULT 'retail'
                  CHECK (release_type IN ('retail', 'kickstarter', 'expansion')),
  status          TEXT NOT NULL DEFAULT 'upcoming'
                  CHECK (status IN ('upcoming', 'live', 'shipped')),
  pre_order_url   TEXT,
  retailer        TEXT,
  rrp_pence       INTEGER,
  image_url       TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_board_game_releases_date ON board_game_releases (release_date ASC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_board_game_releases_status ON board_game_releases (status);

-- RLS: public read, service-role write
ALTER TABLE board_game_releases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "board_game_releases_public_read"
  ON board_game_releases FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "board_game_releases_service_write"
  ON board_game_releases FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
