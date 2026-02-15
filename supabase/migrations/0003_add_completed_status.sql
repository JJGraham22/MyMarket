-- Allow COMPLETED as a valid order status.
-- Drop the old constraint and recreate with the extra value.

alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (status in ('PENDING_PAYMENT', 'PAID', 'EXPIRED', 'CANCELLED', 'COMPLETED'));
