-- ── FIX: Recreate students program check constraint ────────────────────────
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New query)
--
-- This drops and recreates the program constraint with the correct values,
-- and also fixes any existing rows that might have invalid program values.

-- Step 1: Fix any existing rows with invalid program values before adding constraint
UPDATE public.students
SET program = 'Nursery'
WHERE program NOT IN ('Play group', 'Nursery', 'LKG', 'UKG');

-- Step 2: Drop the old constraint (regardless of what it was)
ALTER TABLE public.students
  DROP CONSTRAINT IF EXISTS students_program_check;

-- Step 3: Re-add with the correct allowed values
ALTER TABLE public.students
  ADD CONSTRAINT students_program_check
  CHECK (program IN ('Play group', 'Nursery', 'LKG', 'UKG'));
