-- ---------------------------------------------------------------------------
-- Discovery tables — videos from non-monitored channels + channel candidates
-- ---------------------------------------------------------------------------

-- Discovered videos from non-monitored channels
create table discovered_videos (
  id uuid primary key default gen_random_uuid(),
  vertical_id uuid references verticals(id) on delete cascade not null,
  youtube_video_id text unique not null,
  youtube_channel_id text not null,
  channel_name text not null,
  title text not null,
  description text,
  thumbnail_url text,
  published_at timestamptz,
  duration_seconds int,
  view_count int,
  content_type text default 'other',
  is_short boolean default false,
  ingested_to_reports boolean default false,
  discovered_at timestamptz default now()
);

-- Channel candidates discovered from search results
create table channel_candidates (
  id uuid primary key default gen_random_uuid(),
  vertical_id uuid references verticals(id) on delete cascade not null,
  youtube_channel_id text unique not null,
  channel_name text not null,
  thumbnail_url text,
  subscriber_count int,
  video_count int default 0,
  battle_report_count int default 0,
  status text default 'pending' check (status in ('pending', 'approved', 'dismissed')),
  first_seen_at timestamptz default now(),
  last_seen_at timestamptz default now(),
  reviewed_at timestamptz
);

create index idx_discovered_videos_channel on discovered_videos(youtube_channel_id);
create index idx_discovered_videos_vertical on discovered_videos(vertical_id);
create index idx_channel_candidates_status on channel_candidates(status);
create index idx_channel_candidates_vertical on channel_candidates(vertical_id);

alter table discovered_videos enable row level security;
alter table channel_candidates enable row level security;
create policy "Public read" on discovered_videos for select using (true);
create policy "Public read" on channel_candidates for select using (true);
