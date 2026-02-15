-- Add customization columns to profiles for seller storefronts

alter table public.profiles add column if not exists logo_url    text;
alter table public.profiles add column if not exists banner_url  text;
alter table public.profiles add column if not exists tagline     text;
alter table public.profiles add column if not exists theme_color text;

comment on column public.profiles.logo_url    is 'Seller shop logo — public URL from Supabase Storage';
comment on column public.profiles.banner_url  is 'Hero/banner background image — public URL from Supabase Storage';
comment on column public.profiles.tagline     is 'Short one-liner, e.g. "Fresh organic veggies from the Blue Mountains"';
comment on column public.profiles.theme_color is 'Optional hex accent color, e.g. #16a34a';
