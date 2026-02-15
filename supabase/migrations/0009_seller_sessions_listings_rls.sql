-- RLS so sellers can manage their own sessions and listings from the client (dashboard).
-- Server-side code uses service_role and is unaffected.

-- SELLER SESSIONS: seller can read/insert/update/delete their own rows
alter table public.seller_sessions enable row level security;

create policy "Sellers can read own sessions"
  on public.seller_sessions for select
  using (auth.uid() = seller_id);

create policy "Sellers can insert own sessions"
  on public.seller_sessions for insert
  with check (auth.uid() = seller_id);

create policy "Sellers can update own sessions"
  on public.seller_sessions for update
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

create policy "Sellers can delete own sessions"
  on public.seller_sessions for delete
  using (auth.uid() = seller_id);

-- LISTINGS: seller can manage listings that belong to their sessions
alter table public.listings enable row level security;

create policy "Sellers can read own listings"
  on public.listings for select
  using (
    exists (
      select 1 from public.seller_sessions ss
      where ss.id = listings.seller_session_id and ss.seller_id = auth.uid()
    )
  );

create policy "Sellers can insert listings for own sessions"
  on public.listings for insert
  with check (
    exists (
      select 1 from public.seller_sessions ss
      where ss.id = listings.seller_session_id and ss.seller_id = auth.uid()
    )
  );

create policy "Sellers can update own listings"
  on public.listings for update
  using (
    exists (
      select 1 from public.seller_sessions ss
      where ss.id = listings.seller_session_id and ss.seller_id = auth.uid()
    )
  );

create policy "Sellers can delete own listings"
  on public.listings for delete
  using (
    exists (
      select 1 from public.seller_sessions ss
      where ss.id = listings.seller_session_id and ss.seller_id = auth.uid()
    )
  );
