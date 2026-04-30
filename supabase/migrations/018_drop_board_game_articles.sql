-- ---------------------------------------------------------------------------
-- 018_drop_board_game_articles.sql
--
-- Drops the orphan board_game_articles table. Phase 2 of the
-- board-game-content cron (Haiku-generated articles) was retired in PULSE-47.
-- The live editorial blog is the filesystem markdown at
-- content/blog/tabletop/, drafted by Hawk's hawk-bg-draft-generator-am/-pm
-- crons via PRs. Nothing in the app reads board_game_articles.
-- ---------------------------------------------------------------------------

DROP TABLE IF EXISTS board_game_articles CASCADE;

-- The article-link + article-generated columns on board_game_videos were
-- only set by the retired Phase 2 logic. Nothing reads them.
ALTER TABLE board_game_videos
  DROP COLUMN IF EXISTS article_id,
  DROP COLUMN IF EXISTS article_generated;
