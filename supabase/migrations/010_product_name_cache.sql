-- Product name normalisation cache
-- Stores raw_title → canonical_name mappings to avoid repeated Haiku calls.
-- After the first cron run seeds the cache, subsequent runs resolve 95%+ of
-- products via instant DB lookup instead of LLM.

create table product_name_cache (
  id uuid primary key default gen_random_uuid(),
  vertical_id uuid references verticals(id) on delete cascade,
  raw_title text not null,
  canonical_name text not null,
  source text not null,
  resolved_by text not null default 'haiku',  -- 'cache', 'fuzzy', 'haiku'
  confidence numeric default 1.0,
  created_at timestamptz default now(),
  unique(vertical_id, raw_title, source)
);

create index idx_pnc_lookup on product_name_cache(vertical_id, raw_title, source);
