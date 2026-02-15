-- Profiles table, auto-creation trigger, and RLS policies

-- PROFILES -------------------------------------------------------------------

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        text not null default 'buyer'
              check (role in ('buyer', 'seller')),
  display_name text,
  avatar_url  text,
  bio         text,
  created_at  timestamptz not null default timezone('utc'::text, now())
);

comment on table public.profiles is
  'One row per authenticated user. Auto-created on signup via trigger.';

-- AUTO-CREATE PROFILE ON SIGNUP ----------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;   -- idempotent: don't fail if row already exists
  return new;
end;
$$;

-- Trigger fires after every new row in auth.users
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ROW LEVEL SECURITY ---------------------------------------------------------

alter table public.profiles enable row level security;

-- Anyone can read all profiles (public directory)
create policy "Profiles are viewable by everyone"
  on public.profiles
  for select
  using (true);

-- Users can insert their own profile (fallback if trigger didn't fire)
create policy "Users can insert their own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- Users can update only their own profile
create policy "Users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- INDEXES --------------------------------------------------------------------

create index if not exists idx_profiles_role
  on public.profiles (role);
