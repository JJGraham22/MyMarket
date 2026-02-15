-- Create a public storage bucket for profile images (logo + banner)
-- and set up RLS so authenticated users can upload/manage their own files.

-- 1. Create the bucket (public = anyone can read via public URL)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-assets',
  'profile-assets',
  true,
  2097152,  -- 2 MB
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- 2. RLS policies on storage.objects for this bucket

-- Anyone can read (bucket is public, but this policy is still needed for the API)
create policy "Public read access for profile-assets"
  on storage.objects
  for select
  using (bucket_id = 'profile-assets');

-- Authenticated users can upload files into their own folder: profile-assets/{userId}/*
create policy "Users can upload their own profile assets"
  on storage.objects
  for insert
  with check (
    bucket_id = 'profile-assets'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can update (overwrite) their own files
create policy "Users can update their own profile assets"
  on storage.objects
  for update
  using (
    bucket_id = 'profile-assets'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can delete their own files
create policy "Users can delete their own profile assets"
  on storage.objects
  for delete
  using (
    bucket_id = 'profile-assets'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
