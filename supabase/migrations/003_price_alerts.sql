-- ---------------------------------------------------------------------------
-- 003: Price Alerts
-- ---------------------------------------------------------------------------
-- Stores user price alerts. When a product's best listing drops to or below
-- the target price, a notification email is sent via the daily cron job.
-- ---------------------------------------------------------------------------

create table if not exists public.price_alerts (
  id               uuid primary key default gen_random_uuid(),
  email            text not null,
  product_id       uuid not null references public.products(id) on delete cascade,
  target_price_pence integer not null,
  is_active        boolean not null default true,
  last_notified_at timestamptz,
  created_at       timestamptz not null default now()
);

-- Index for the cron job query (active alerts not recently notified)
create index if not exists idx_price_alerts_active
  on public.price_alerts (is_active)
  where is_active = true;

-- Index for lookups by product
create index if not exists idx_price_alerts_product
  on public.price_alerts (product_id);

-- RLS: enable but allow service-role full access (cron + API use admin client)
alter table public.price_alerts enable row level security;

create policy "Service role full access"
  on public.price_alerts
  for all
  using (true)
  with check (true);
