-- Run this in Supabase SQL editor to migrate admission_date -> admission_no
alter table public.students 
  alter column admission_date type text,
  alter column admission_date set not null,
  alter column admission_date drop default,
  rename column admission_date to admission_no;
