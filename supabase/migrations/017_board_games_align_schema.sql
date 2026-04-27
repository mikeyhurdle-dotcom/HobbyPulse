-- ---------------------------------------------------------------------------
-- 017: Align board_games schema with codebase expectations
-- ---------------------------------------------------------------------------
-- The deployed table drifted from migration 014 (column names singular vs
-- plural, complexity_rating vs complexity, age_rating vs min_age, missing
-- bgg_rank / bgg_rating / thumbnail_url). The codebase in lib/bgg.ts and
-- app/api/cron/board-game-import was written against the migration-014
-- shape. This migration realigns. Safe — board_games had 0 rows when run.
-- ---------------------------------------------------------------------------

ALTER TABLE board_games RENAME COLUMN age_rating TO min_age;
ALTER TABLE board_games RENAME COLUMN complexity_rating TO complexity;
ALTER TABLE board_games RENAME COLUMN designer TO designers;
ALTER TABLE board_games RENAME COLUMN publisher TO publishers;

ALTER TABLE board_games ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE board_games ADD COLUMN IF NOT EXISTS bgg_rank INTEGER;
ALTER TABLE board_games ADD COLUMN IF NOT EXISTS bgg_rating NUMERIC(4,2);

CREATE INDEX IF NOT EXISTS idx_board_games_bgg_rank ON board_games (bgg_rank ASC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_board_games_bgg_rating ON board_games (bgg_rating DESC NULLS LAST);
