-- Payment provider fields for profiles and orders
-- Supports: platform (default), stripe (Stripe Connect), square (Square OAuth)

-- ── PROFILES: payment provider settings ─────────────────────────────────────

alter table public.profiles
  add column if not exists payment_provider text not null default 'platform'
    check (payment_provider in ('platform', 'stripe', 'square'));

alter table public.profiles
  add column if not exists stripe_connected_account_id text;

alter table public.profiles
  add column if not exists square_merchant_id text;

alter table public.profiles
  add column if not exists square_access_token text;

alter table public.profiles
  add column if not exists square_refresh_token text;

alter table public.profiles
  add column if not exists square_token_expires_at timestamptz;

alter table public.profiles
  add column if not exists square_location_id text;

-- Square Terminal device ID (for Terminal API in-person payments)
alter table public.profiles
  add column if not exists square_device_id text;

-- ── ORDERS: generic + Square payment tracking fields ────────────────────────

alter table public.orders
  add column if not exists payment_provider text;

alter table public.orders
  add column if not exists payment_session_id text;

alter table public.orders
  add column if not exists payment_intent_id text;

alter table public.orders
  add column if not exists square_payment_id text;

alter table public.orders
  add column if not exists square_order_id text;

-- ── Update orders status constraint to include COMPLETED ────────────────────

alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (status in ('PENDING_PAYMENT', 'PAID', 'EXPIRED', 'CANCELLED', 'COMPLETED'));

-- ── Indexes for Square payment lookups ──────────────────────────────────────

create index if not exists idx_orders_square_payment_id
  on public.orders (square_payment_id);

create index if not exists idx_orders_payment_session_id
  on public.orders (payment_session_id);
