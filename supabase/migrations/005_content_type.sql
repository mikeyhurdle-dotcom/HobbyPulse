alter table battle_reports add column if not exists content_type text default 'other';
alter table battle_reports add column if not exists is_short boolean default false;
