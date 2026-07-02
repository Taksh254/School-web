-- Run this in your Supabase SQL Editor to create performance indexes
-- and sync schema.sql changes to your live database.

-- 1. Profiles Updates
alter table public.profiles 
  add column if not exists must_change_password boolean not null default false;

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- 2. Performance Indexes
create index if not exists idx_profiles_child_id on public.profiles(child_id);
create index if not exists idx_attendance_student_id on public.attendance(student_id);
create index if not exists idx_attendance_date on public.attendance(date);
create index if not exists idx_fees_student_id on public.fees(student_id);
create index if not exists idx_fees_due_date on public.fees(due_date);
create index if not exists idx_payments_fee_id on public.payments(fee_id);
create index if not exists idx_payments_student_id on public.payments(student_id);
create index if not exists idx_notes_student_id on public.notes(student_id);
