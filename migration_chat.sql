-- ══════════════════════════════════════════════════════════════════════════════
-- BLOOMDESK — REAL-TIME CHAT MIGRATION
-- Parent ↔ Principal messaging system
-- Run this in Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. CONVERSATIONS TABLE ─────────────────────────────────────────────────
-- One conversation per student (UNIQUE on student_id prevents duplicates)
CREATE TABLE IF NOT EXISTS public.conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    parent_name text NOT NULL,
    admission_no text NOT NULL,
    status text NOT NULL CHECK (status IN ('open', 'closed')) DEFAULT 'open',
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(student_id)
);

-- ── 2. MESSAGES TABLE ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    sender_role text NOT NULL CHECK (sender_role IN ('parent', 'principal')),
    sender_name text NOT NULL,
    message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    read_at timestamp with time zone DEFAULT NULL
);

-- ── 3. ROW LEVEL SECURITY ──────────────────────────────────────────────────
-- Note: Parents use cookie-auth (no auth.uid()), so all parent access goes
-- through server API routes using the service-role key (bypasses RLS).
-- RLS policies here protect Supabase-auth (admin) direct client access.

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running migration
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins have full access to conversations' AND tablename = 'conversations') THEN
        DROP POLICY "Admins have full access to conversations" ON public.conversations;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins have full access to messages' AND tablename = 'messages') THEN
        DROP POLICY "Admins have full access to messages" ON public.messages;
    END IF;
END;
$$;

-- Admins can do everything via Supabase Auth session
CREATE POLICY "Admins have full access to conversations"
    ON public.conversations FOR ALL USING (public.is_admin());

CREATE POLICY "Admins have full access to messages"
    ON public.messages FOR ALL USING (public.is_admin());

-- ── 4. INDEXES ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_conversations_student_id ON public.conversations(student_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON public.messages(read_at);

-- ── 5. AUTO-UPDATE updated_at TRIGGER ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    UPDATE public.conversations
    SET updated_at = now()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_message_insert ON public.messages;
CREATE TRIGGER on_message_insert
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE PROCEDURE public.update_conversation_timestamp();

-- ══════════════════════════════════════════════════════════════════════════════
-- IMPORTANT: After running this migration, go to your Supabase Dashboard:
--   Table Editor → messages → Enable Realtime
--   Table Editor → conversations → Enable Realtime
-- This is required for live message delivery to work.
-- ══════════════════════════════════════════════════════════════════════════════
