-- ── PARENT AUTHENTICATION COLUMNS MIGRATION ─────────────────────────
-- Run this in the Supabase SQL editor if these columns do not yet exist.
-- These columns are required by:
--   /api/parent-login         (reads parent_password_hash, password_reset_required)
--   /api/parent-change-password (writes parent_password_hash, password_reset_required, password_last_changed)
--   /api/reset-parent-password  (writes parent_password_hash, password_reset_required)

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS parent_password_hash  text,
  ADD COLUMN IF NOT EXISTS password_reset_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS password_last_changed  timestamp with time zone;

-- Index for fast admission_no lookups (used on every parent login)
CREATE INDEX IF NOT EXISTS idx_students_admission_no ON public.students(admission_no);
