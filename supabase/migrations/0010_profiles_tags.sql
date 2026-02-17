-- Seller product/category tags for profile (e.g. Vegetables, Eggs, Honey)

alter table public.profiles
  add column if not exists tags text[] not null default '{}';

comment on column public.profiles.tags is 'Seller-only: product/category tags shown on profile, e.g. Vegetables, Eggs, Honey';
