create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  vertical_slug text not null,
  is_active boolean not null default true,
  unsubscribe_token text not null default encode(gen_random_bytes(32), 'hex'),
  created_at timestamptz not null default now(),
  unique(email, vertical_slug)
);

alter table public.newsletter_subscribers enable row level security;
