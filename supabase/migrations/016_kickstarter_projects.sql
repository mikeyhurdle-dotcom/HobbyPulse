-- ---------------------------------------------------------------------------
-- 016: Kickstarter projects — board game crowdfunding tracker
-- ---------------------------------------------------------------------------
-- Source for the new TabletopWatch killer feature: live + ending-soon +
-- recently-funded board game Kickstarters with affiliate-wrapped CTAs and
-- BackerKit late-pledge links.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS kickstarter_projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     TEXT UNIQUE NOT NULL,        -- Kicktraq slug or Kickstarter project id
  slug            TEXT UNIQUE NOT NULL,        -- url slug used on /kickstarter/[projectSlug]
  title           TEXT NOT NULL,
  url             TEXT NOT NULL,               -- canonical Kickstarter project URL
  image_url       TEXT,
  creator         TEXT,
  category        TEXT NOT NULL DEFAULT 'tabletop_games',
  blurb           TEXT,                        -- one-line description from the source
  funded_amount   INTEGER,                     -- in pence to keep parity with listings.price_pence
  goal_amount     INTEGER,
  currency        TEXT DEFAULT 'USD',
  funded_percent  NUMERIC(7,2),                -- denormalised so we don't divide on every read
  backers         INTEGER,
  starts_at       TIMESTAMPTZ,
  ends_at         TIMESTAMPTZ,
  late_pledge_url TEXT,
  late_pledge_open BOOLEAN DEFAULT false,
  status          TEXT NOT NULL DEFAULT 'live',-- live | ending_soon | recently_funded | late_pledge | ended
  last_synced_at  TIMESTAMPTZ DEFAULT now(),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kickstarter_projects_status ON kickstarter_projects (status);
CREATE INDEX IF NOT EXISTS idx_kickstarter_projects_ends_at ON kickstarter_projects (ends_at ASC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_kickstarter_projects_funded_percent ON kickstarter_projects (funded_percent DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_kickstarter_projects_category ON kickstarter_projects (category);

ALTER TABLE kickstarter_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kickstarter_projects_public_read"
  ON kickstarter_projects FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "kickstarter_projects_service_write"
  ON kickstarter_projects FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
