-- Market days, seller sessions, listings, orders, and order_items schema

-- Enable gen_random_uuid if not already available
create extension if not exists "pgcrypto";

-- MARKET DAYS -----------------------------------------------------------------

create table if not exists public.market_days (
  id uuid primary key default gen_random_uuid(),
  market_id uuid, -- optional, link to a markets table if you have one
  date date not null,
  status text, -- e.g. PLANNED, OPEN, CLOSED
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- SELLER SESSIONS -------------------------------------------------------------

create table if not exists public.seller_sessions (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users (id),
  market_day_id uuid not null references public.market_days (id) on delete cascade,
  stall_number text,
  notes text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_seller_sessions_seller_market_day
  on public.seller_sessions (seller_id, market_day_id);

-- LISTINGS (inventory per seller per market day) ------------------------------

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_session_id uuid not null references public.seller_sessions (id) on delete cascade,
  name text not null,
  description text,
  unit text,
  price_cents integer not null check (price_cents >= 0),
  qty_available integer not null default 0 check (qty_available >= 0),
  qty_reserved integer not null default 0 check (qty_reserved >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_listings_seller_session_name
  on public.listings (seller_session_id, name);

-- ORDERS ----------------------------------------------------------------------

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  seller_session_id uuid not null references public.seller_sessions (id),
  customer_id uuid, -- optional, link to a customers table if you have one
  status text not null,
  total_cents integer not null default 0 check (total_cents >= 0),
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  paid_at timestamptz
);

alter table public.orders
  add constraint orders_status_check
  check (status in ('PENDING_PAYMENT', 'PAID', 'EXPIRED', 'CANCELLED'));

create index if not exists idx_orders_seller_session_status
  on public.orders (seller_session_id, status);

-- ORDER ITEMS -----------------------------------------------------------------

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  listing_id uuid not null references public.listings (id),
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  line_total_cents integer not null check (line_total_cents >= 0)
);

create index if not exists idx_order_items_order_id
  on public.order_items (order_id);

-- TRANSACTIONAL ORDER CREATION + INVENTORY RESERVATION -----------------------

create or replace function public.create_order_with_reservation(
  p_seller_session_id uuid,
  p_items jsonb,
  p_customer_id uuid default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_expires_at timestamptz := timezone('utc'::text, now()) + interval '10 minutes';
  v_total_cents integer := 0;
  v_item record;
  v_listing record;
  v_line_total integer;
begin
  -- Basic validation ----------------------------------------------------------
  if p_seller_session_id is null then
    raise exception 'p_seller_session_id is required';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'p_items must be a non-empty JSON array';
  end if;

  -- Ensure seller_session exists
  perform 1
  from public.seller_sessions ss
  where ss.id = p_seller_session_id;

  if not found then
    raise exception 'Seller session % not found', p_seller_session_id;
  end if;

  -- Create the order row first (total_cents will be updated after items loop)
  insert into public.orders (seller_session_id, customer_id, status, total_cents, expires_at)
  values (p_seller_session_id, p_customer_id, 'PENDING_PAYMENT', 0, v_expires_at)
  returning id into v_order_id;

  -- Loop through items: lock listings, validate inventory, insert order_items,
  -- and update inventory (qty_available -> qty_reserved)
  for v_item in
    select
      (item->>'listing_id')::uuid as listing_id,
      (item->>'quantity')::integer as quantity
    from jsonb_array_elements(p_items) as item
  loop
    if v_item.listing_id is null then
      raise exception 'Each item must include listing_id';
    end if;

    if v_item.quantity is null or v_item.quantity <= 0 then
      raise exception 'Quantity for listing % must be a positive integer', v_item.listing_id;
    end if;

    -- Lock the listing row for this seller_session
    select *
    into v_listing
    from public.listings l
    where l.id = v_item.listing_id
      and l.seller_session_id = p_seller_session_id
      and l.is_active = true
    for update;

    if not found then
      raise exception 'Listing % not found for this seller_session or not active', v_item.listing_id;
    end if;

    if v_listing.qty_available < v_item.quantity then
      raise exception 'INSUFFICIENT_INVENTORY: listing % requested %, available %',
        v_item.listing_id, v_item.quantity, v_listing.qty_available;
    end if;

    v_line_total := v_item.quantity * v_listing.price_cents;
    v_total_cents := v_total_cents + v_line_total;

    -- Insert order item snapshot
    insert into public.order_items (
      order_id,
      listing_id,
      quantity,
      unit_price_cents,
      line_total_cents
    )
    values (
      v_order_id,
      v_item.listing_id,
      v_item.quantity,
      v_listing.price_cents,
      v_line_total
    );

    -- Reserve inventory: move qty_available -> qty_reserved
    update public.listings
    set
      qty_available = qty_available - v_item.quantity,
      qty_reserved = qty_reserved + v_item.quantity
    where id = v_item.listing_id;
  end loop;

  -- Update the order total
  update public.orders
  set total_cents = v_total_cents
  where id = v_order_id;

  -- Return order info (including computed total and expires_at)
  return jsonb_build_object(
    'order_id', v_order_id,
    'total_cents', v_total_cents,
    'expires_at', v_expires_at
  );
end;
$$;

