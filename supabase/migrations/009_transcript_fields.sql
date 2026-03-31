alter table battle_reports add column if not exists has_transcript boolean default false;
alter table content_lists add column if not exists winner text;
alter table content_lists add column if not exists key_moments text;
