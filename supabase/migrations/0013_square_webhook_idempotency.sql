-- Idempotency for Square webhooks: each event_id is processed at most once.
-- Square may send the same event more than once (e.g. retries or multiple subscriptions).
create table if not exists public.square_webhook_events (
  event_id text primary key,
  created_at timestamptz not null default timezone('utc'::text, now())
);

comment on table public.square_webhook_events is 'Processed Square webhook event IDs for idempotency';
