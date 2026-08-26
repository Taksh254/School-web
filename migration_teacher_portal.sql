-- ══════════════════════════════════════════════════════════════════════════════
-- BLOOMDESK — COMPLETE TEACHER PORTAL DATABASE MIGRATION
-- Run this in Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. PROFILES ROLE CHECK
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('admin', 'parent', 'teacher', 'student', 'staff'));

-- 2. STUDENT DEVELOPMENT OBSERVATIONS TABLE
CREATE TABLE IF NOT EXISTS public.student_development (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    teacher_id uuid REFERENCES public.teachers(id) ON DELETE SET NULL,
    teacher_name text,
    date date NOT NULL DEFAULT current_date,
    communication text NOT NULL CHECK (communication IN ('Needs Support', 'Developing', 'Good', 'Very Good', 'Excellent')),
    cognitive_development text NOT NULL CHECK (cognitive_development IN ('Needs Support', 'Developing', 'Good', 'Very Good', 'Excellent')),
    motor_skills text NOT NULL CHECK (motor_skills IN ('Needs Support', 'Developing', 'Good', 'Very Good', 'Excellent')),
    social_development text NOT NULL CHECK (social_development IN ('Needs Support', 'Developing', 'Good', 'Very Good', 'Excellent')),
    creativity text NOT NULL CHECK (creativity IN ('Needs Support', 'Developing', 'Good', 'Very Good', 'Excellent')),
    participation text NOT NULL CHECK (participation IN ('Needs Support', 'Developing', 'Good', 'Very Good', 'Excellent')),
    observation text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_student_dev_student ON public.student_development(student_id);
CREATE INDEX IF NOT EXISTS idx_student_dev_teacher ON public.student_development(teacher_id);
CREATE INDEX IF NOT EXISTS idx_student_dev_date ON public.student_development(date DESC);

-- 3. CLASS ACTIVITIES TABLE
CREATE TABLE IF NOT EXISTS public.class_activities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text NOT NULL,
    activity_type text NOT NULL CHECK (activity_type IN ('Drawing', 'Storytelling', 'Music', 'Outdoor Play', 'Numbers', 'Alphabet', 'Puzzle', 'Craft', 'General')),
    date date NOT NULL DEFAULT current_date,
    program text NOT NULL CHECK (program IN ('Play Group', 'Nursery', 'LKG', 'UKG')),
    section text NOT NULL DEFAULT 'A',
    teacher_id uuid REFERENCES public.teachers(id) ON DELETE SET NULL,
    teacher_name text,
    student_participation text,
    observations text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_class_activities_date ON public.class_activities(date DESC);
CREATE INDEX IF NOT EXISTS idx_class_activities_prog_sec ON public.class_activities(program, section);
CREATE INDEX IF NOT EXISTS idx_class_activities_teacher ON public.class_activities(teacher_id);

-- 4. HOME ACTIVITIES TABLE
CREATE TABLE IF NOT EXISTS public.home_activities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    instructions text NOT NULL,
    program text NOT NULL CHECK (program IN ('Play Group', 'Nursery', 'LKG', 'UKG')),
    section text NOT NULL DEFAULT 'A',
    date date NOT NULL DEFAULT current_date,
    due_date date,
    teacher_id uuid REFERENCES public.teachers(id) ON DELETE SET NULL,
    teacher_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_home_activities_prog_sec ON public.home_activities(program, section);
CREATE INDEX IF NOT EXISTS idx_home_activities_date ON public.home_activities(date DESC);

-- 5. TEACHER ↔ PRINCIPAL CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.teacher_conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id uuid REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL UNIQUE,
    teacher_name text NOT NULL,
    teacher_email text NOT NULL,
    status text NOT NULL CHECK (status IN ('open', 'closed')) DEFAULT 'open',
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 6. TEACHER ↔ PRINCIPAL MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.teacher_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid REFERENCES public.teacher_conversations(id) ON DELETE CASCADE NOT NULL,
    sender_role text NOT NULL CHECK (sender_role IN ('teacher', 'principal')),
    sender_name text NOT NULL,
    message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    read_at timestamp with time zone DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_teacher_messages_conv ON public.teacher_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_teacher_messages_created ON public.teacher_messages(created_at ASC);

-- 7. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.student_development ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_messages ENABLE ROW LEVEL SECURITY;

-- 8. POLICIES
-- Student Development
DROP POLICY IF EXISTS "Admins full access on student_development" ON public.student_development;
CREATE POLICY "Admins full access on student_development" ON public.student_development
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Teachers view and manage own assigned student development" ON public.student_development;
CREATE POLICY "Teachers view and manage own assigned student development" ON public.student_development
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
        AND (
            student_id IN (
                SELECT s.id FROM public.students s
                WHERE s.teacher_id = public.get_current_teacher_id()
                   OR LOWER(s.teacher) = LOWER((SELECT full_name FROM public.teachers WHERE id = public.get_current_teacher_id()))
            )
        )
    );

-- Class Activities
DROP POLICY IF EXISTS "Admins full access on class_activities" ON public.class_activities;
CREATE POLICY "Admins full access on class_activities" ON public.class_activities
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Teachers view and manage class activities" ON public.class_activities;
CREATE POLICY "Teachers view and manage class activities" ON public.class_activities
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher'));

-- Home Activities
DROP POLICY IF EXISTS "Admins full access on home_activities" ON public.home_activities;
CREATE POLICY "Admins full access on home_activities" ON public.home_activities
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Teachers view and manage home activities" ON public.home_activities;
CREATE POLICY "Teachers view and manage home activities" ON public.home_activities
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher'));

-- Teacher Conversations & Messages
DROP POLICY IF EXISTS "Admins full access on teacher_conversations" ON public.teacher_conversations;
CREATE POLICY "Admins full access on teacher_conversations" ON public.teacher_conversations
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Teachers access own conversation" ON public.teacher_conversations;
CREATE POLICY "Teachers access own conversation" ON public.teacher_conversations
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
        AND teacher_id = public.get_current_teacher_id()
    );

DROP POLICY IF EXISTS "Admins full access on teacher_messages" ON public.teacher_messages;
CREATE POLICY "Admins full access on teacher_messages" ON public.teacher_messages
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Teachers access messages in own conversation" ON public.teacher_messages;
CREATE POLICY "Teachers access messages in own conversation" ON public.teacher_messages
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
        AND conversation_id IN (
            SELECT id FROM public.teacher_conversations WHERE teacher_id = public.get_current_teacher_id()
        )
    );
