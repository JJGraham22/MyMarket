-- Create public.markets and add FK from market_days.market_id

-- MARKETS --------------------------------------------------------------------

create table if not exists public.markets (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  city       text,
  suburb     text,
  address    text,
  lat        double precision,
  lng        double precision,
  created_at timestamptz not null default timezone('utc'::text, now())
);

comment on table public.markets is
  'Physical market locations where market days take place.';

-- INDEX: look up markets by city
create index if not exists idx_markets_city on public.markets (city);

-- Wire up market_days.market_id → markets.id
-- The column already exists (uuid, nullable) from migration 0001.
-- We just need to add the foreign key constraint.
alter table public.market_days
  add constraint market_days_market_id_fkey
  foreign key (market_id) references public.markets (id)
  on delete set null;

-- RLS (markets are public-readable) -----------------------------------------

alter table public.markets enable row level security;

create policy "Markets are viewable by everyone"
  on public.markets
  for select
  using (true);
