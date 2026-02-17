-- Saved markets and saved sellers for buyers (follow/save)

-- SAVED MARKETS --------------------------------------------------------------

create table if not exists public.saved_markets (
  user_id   uuid not null references auth.users (id) on delete cascade,
  market_id uuid not null references public.markets (id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  primary key (user_id, market_id)
);

comment on table public.saved_markets is
  'Buyer saves/follows of markets. One row per user per market.';

alter table public.saved_markets enable row level security;

create policy "Users can view own saved markets"
  on public.saved_markets for select
  using (auth.uid() = user_id);

create policy "Users can insert own saved markets"
  on public.saved_markets for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own saved markets"
  on public.saved_markets for delete
  using (auth.uid() = user_id);

create index if not exists idx_saved_markets_user_id
  on public.saved_markets (user_id);

-- SAVED SELLERS --------------------------------------------------------------

create table if not exists public.saved_sellers (
  user_id   uuid not null references auth.users (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  primary key (user_id, seller_id)
);

comment on table public.saved_sellers is
  'Buyer saves/follows of sellers. One row per user per seller.';

alter table public.saved_sellers enable row level security;

create policy "Users can view own saved sellers"
  on public.saved_sellers for select
  using (auth.uid() = user_id);

create policy "Users can insert own saved sellers"
  on public.saved_sellers for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own saved sellers"
  on public.saved_sellers for delete
  using (auth.uid() = user_id);

create index if not exists idx_saved_sellers_user_id
  on public.saved_sellers (user_id);
