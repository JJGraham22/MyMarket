-- Seed data: sample markets and one market day for today
-- Run this in the Supabase SQL Editor after all migrations are applied.

-- 1. Insert sample markets
insert into public.markets (id, name, city, suburb, address, lat, lng) values
  ('a1000000-0000-0000-0000-000000000001', 'Bondi Farmers Market',       'Sydney',    'Bondi Junction', 'Bondi Junction Public School, Bronte Rd', -33.8932, 151.2477),
  ('a1000000-0000-0000-0000-000000000002', 'Carriageworks Farmers Market','Sydney',    'Eveleigh',       '245 Wilson St, Eveleigh NSW 2015',         -33.8930, 151.1940),
  ('a1000000-0000-0000-0000-000000000003', 'Orange Region Farmers Market','Orange',    'Orange',         'Orange Showground, Leeds Parade',          -33.2840, 149.1000),
  ('a1000000-0000-0000-0000-000000000004', 'Salamanca Market',           'Hobart',    'Battery Point',  'Salamanca Place, Hobart TAS 7004',         -42.8880, 147.3310),
  ('a1000000-0000-0000-0000-000000000005', 'Jan Powers Farmers Market',  'Brisbane',  'Brisbane City',  'Brisbane Powerhouse, 119 Lamington St',    -27.4450, 153.0500)
on conflict (id) do nothing;

-- 2. Insert a market day for TODAY at the first market (Bondi)
insert into public.market_days (id, market_id, date, status) values
  ('b1000000-0000-0000-0000-000000000001',
   'a1000000-0000-0000-0000-000000000001',
   current_date,
   'OPEN')
on conflict (id) do nothing;

-- 3. (Optional) If you want a seller session for the dev seller on today's market day,
--    uncomment the following and make sure NEXT_PUBLIC_DEV_SELLER_ID matches your user id.
--
-- insert into public.seller_sessions (id, seller_id, market_day_id, stall_number) values
--   ('c1000000-0000-0000-0000-000000000001',
--    '6587796c-61b4-4274-b6bf-e36108fb320a',  -- DEV_SELLER_ID from .env.local
--    'b1000000-0000-0000-0000-000000000001',
--    'Stall A1')
-- on conflict (id) do nothing;
