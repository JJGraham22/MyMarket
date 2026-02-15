-- Add Stripe tracking fields to public.orders
-- Safe to run on an existing table: uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS

-- Stripe Checkout Session ID (returned by Stripe when creating a checkout session)
alter table public.orders
  add column if not exists stripe_checkout_session_id text;

-- Stripe PaymentIntent ID (populated after payment succeeds, via webhook or session lookup)
alter table public.orders
  add column if not exists stripe_payment_intent_id text;

-- Index on stripe_checkout_session_id for fast lookups (e.g. webhook → order)
create index if not exists idx_orders_stripe_checkout_session_id
  on public.orders (stripe_checkout_session_id);
