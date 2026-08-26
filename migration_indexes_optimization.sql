-- ══════════════════════════════════════════════════════════════════════════════
-- BLOOMDESK — PERFORMANCE OPTIMIZATION DATABASE INDEXES
-- Run this in Supabase SQL Editor to speed up database queries
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. STUDENTS TABLE INDEXES
-- Benefited queries: Parent student resolution, admission number search, class program filter
CREATE INDEX IF NOT EXISTS idx_students_parent_id ON public.students(parent_id);
CREATE INDEX IF NOT EXISTS idx_students_parent_email ON public.students(parent_email);
CREATE INDEX IF NOT EXISTS idx_students_admission_no ON public.students(admission_no);
CREATE INDEX IF NOT EXISTS idx_students_program ON public.students(program);
CREATE INDEX IF NOT EXISTS idx_students_teacher_id ON public.students(teacher_id);

-- 2. ATTENDANCE TABLE INDEXES
-- Benefited queries: Student attendance history, class date attendance checks
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON public.attendance(student_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_teacher_id ON public.attendance(teacher_id);

-- 3. FEES & PAYMENTS INDEXES
-- Benefited queries: Parent fees lookup, due date sorting, payment receipt resolution
CREATE INDEX IF NOT EXISTS idx_fees_student_id ON public.fees(student_id);
CREATE INDEX IF NOT EXISTS idx_fees_status ON public.fees(status);
CREATE INDEX IF NOT EXISTS idx_fees_due_date ON public.fees(due_date ASC);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON public.payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_fee_id ON public.payments(fee_id);

-- 4. TEACHER NOTES INDEXES
-- Benefited queries: Student notes lookup and date sorting
CREATE INDEX IF NOT EXISTS idx_notes_student_id ON public.notes(student_id);
CREATE INDEX IF NOT EXISTS idx_notes_date ON public.notes(date DESC);

-- 5. ANNOUNCEMENTS & EVENTS INDEXES
-- Benefited queries: Published announcements feed, chronological event listings
CREATE INDEX IF NOT EXISTS idx_announcements_pub_date ON public.announcements(published, date DESC);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date ASC);

-- 6. CHAT & MESSAGING INDEXES
-- Benefited queries: Parent ↔ Principal chat lookup, message chronologies, unread badge calculation
CREATE INDEX IF NOT EXISTS idx_conversations_student_id ON public.conversations(student_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON public.conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON public.messages(conversation_id, created_at ASC);
