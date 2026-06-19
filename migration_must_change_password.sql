-- Run this in your Supabase SQL Editor to add the must_change_password column
-- and allow users to update their own profile records.

alter table public.profiles 
  add column if not exists must_change_password boolean not null default false;

-- Drop policy if it exists and recreate
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);
