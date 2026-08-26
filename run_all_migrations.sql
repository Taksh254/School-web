-- ==============================================================================
-- 🚀 TINY MIND PLAY SCHOOL — MASTER DATABASE MIGRATION & TEACHER SETUP
-- Copy and paste this entire script into your Supabase SQL Editor and click "Run".
-- ==============================================================================

-- 1. UPDATE PROFILES ROLE CHECK CONSTRAINT
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('admin', 'parent', 'teacher', 'student', 'staff'));

-- 2. CREATE TEACHERS TABLE (IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.teachers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id text UNIQUE NOT NULL,
    full_name text NOT NULL,
    gender text,
    dob date,
    phone text,
    email text UNIQUE NOT NULL,
    address text,
    qualification text,
    designation text,
    department text,
    joining_date date DEFAULT CURRENT_DATE,
    status text DEFAULT 'Active',
    emergency_contact text,
    blood_group text,
    employment_type text DEFAULT 'Full Time',
    salary_amount numeric(10,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_teachers_email ON public.teachers(email);
CREATE INDEX IF NOT EXISTS idx_teachers_status ON public.teachers(status);

-- 3. ENABLE RLS ON TEACHERS TABLE
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full access on teachers" ON public.teachers;
CREATE POLICY "Admins full access on teachers" ON public.teachers
    FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Teachers and users can view teachers" ON public.teachers;
CREATE POLICY "Teachers and users can view teachers" ON public.teachers
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- 4. UPDATE STUDENTS TABLE WITH TEACHER_ID
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES public.teachers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_students_teacher_id ON public.students(teacher_id);

-- 5. UPDATE ATTENDANCE TABLE
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES public.teachers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'attendance_student_id_date_key' 
        AND conrelid = 'public.attendance'::regclass
    ) THEN
        ALTER TABLE public.attendance ADD CONSTRAINT attendance_student_id_date_key UNIQUE (student_id, date);
    END IF;
END;
$$;

ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_status_check;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_status_check CHECK (status IN ('present', 'absent', 'leave', 'holiday'));

CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_teacher_id ON public.attendance(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON public.attendance(student_id, date);

-- 6. SECURITY HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS boolean SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'teacher'
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_current_teacher_id()
RETURNS uuid SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email text;
  v_teacher_id uuid;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  IF v_email IS NULL THEN
    RETURN NULL;
  END IF;
  SELECT id INTO v_teacher_id FROM public.teachers WHERE LOWER(email) = LOWER(v_email) LIMIT 1;
  RETURN v_teacher_id;
END;
$$ LANGUAGE plpgsql;

-- 7. ATTENDANCE RLS POLICIES
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full access on attendance" ON public.attendance;
CREATE POLICY "Admins full access on attendance" ON public.attendance
    FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Teachers can view assigned student attendance" ON public.attendance;
CREATE POLICY "Teachers can view assigned student attendance" ON public.attendance
    FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
        AND (
            teacher_id = public.get_current_teacher_id()
            OR student_id IN (
                SELECT s.id FROM public.students s
                WHERE s.teacher_id = public.get_current_teacher_id()
                   OR LOWER(s.teacher) = LOWER((SELECT full_name FROM public.teachers WHERE id = public.get_current_teacher_id()))
            )
        )
    );

DROP POLICY IF EXISTS "Teachers can insert attendance for assigned students" ON public.attendance;
CREATE POLICY "Teachers can insert attendance for assigned students" ON public.attendance
    FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
        AND (
            student_id IN (
                SELECT s.id FROM public.students s
                WHERE s.teacher_id = public.get_current_teacher_id()
                   OR LOWER(s.teacher) = LOWER((SELECT full_name FROM public.teachers WHERE id = public.get_current_teacher_id()))
            )
        )
    );

DROP POLICY IF EXISTS "Teachers can update attendance for assigned students" ON public.attendance;
CREATE POLICY "Teachers can update attendance for assigned students" ON public.attendance
    FOR UPDATE
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
        AND (
            teacher_id = public.get_current_teacher_id()
            OR student_id IN (
                SELECT s.id FROM public.students s
                WHERE s.teacher_id = public.get_current_teacher_id()
                   OR LOWER(s.teacher) = LOWER((SELECT full_name FROM public.teachers WHERE id = public.get_current_teacher_id()))
            )
        )
    );

DROP POLICY IF EXISTS "Parents view own child attendance" ON public.attendance;
CREATE POLICY "Parents view own child attendance" ON public.attendance
    FOR SELECT
    USING (
        student_id IN (
            SELECT child_id FROM public.profiles WHERE id = auth.uid() AND child_id IS NOT NULL
        )
    );

-- 8. SEED DEFAULT TEACHERS
INSERT INTO public.teachers (
    teacher_id, full_name, gender, dob, phone, email, address, qualification, designation, department, status, emergency_contact, employment_type
) VALUES 
(
    'TCH-001', 'Ms. Anita Desai', 'Female', '1990-03-12', '+91 98765 11001', 'anita@tinymind.com',
    'Tiny Mind Campus, New Delhi', 'B.Ed, Early Childhood Care', 'Senior Lead Teacher', 'Nursery & LKG', 'Active', '+91 98765 11002', 'Full Time'
),
(
    'TCH-002', 'Ms. Priya Kapoor', 'Female', '1992-07-20', '+91 98765 11003', 'priya@tinymind.com',
    'Tiny Mind Campus, New Delhi', 'M.A. Education, Montessori Certified', 'Play Group Teacher', 'Play Group', 'Active', '+91 98765 11004', 'Full Time'
),
(
    'TCH-003', 'Mrs. Neha Sharma', 'Female', '1988-11-05', '+91 98765 11005', 'neha@tinymind.com',
    'Tiny Mind Campus, New Delhi', 'B.Ed, Child Psychology', 'Class Teacher', 'Nursery A', 'Active', '+91 98765 11006', 'Full Time'
),
(
    'TCH-004', 'Mr. Rohan Joshi', 'Male', '1991-01-18', '+91 98765 11007', 'rohan@tinymind.com',
    'Tiny Mind Campus, New Delhi', 'B.Ed, Physical & Activity Lead', 'UKG Lead Teacher', 'UKG', 'Active', '+91 98765 11008', 'Full Time'
)
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    designation = EXCLUDED.designation,
    department = EXCLUDED.department,
    status = EXCLUDED.status;

-- 9. UPDATE TEACHER PROFILES TO 'teacher' ROLE
UPDATE public.profiles 
SET role = 'teacher'
WHERE email IN ('anita@tinymind.com', 'priya@tinymind.com', 'neha@tinymind.com', 'rohan@tinymind.com');

-- 10. LINK STUDENTS TO TEACHERS
UPDATE public.students s
SET teacher_id = t.id
FROM public.teachers t
WHERE LOWER(s.teacher) LIKE '%' || LOWER(SPLIT_PART(t.full_name, ' ', 2)) || '%'
   OR LOWER(s.teacher) = LOWER(t.full_name);

-- 11. STUDENT DEVELOPMENT OBSERVATIONS TABLE
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

-- 12. CLASS ACTIVITIES TABLE
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

-- 13. HOME ACTIVITIES TABLE
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

-- 14. TEACHER ↔ PRINCIPAL CONVERSATIONS & MESSAGES
CREATE TABLE IF NOT EXISTS public.teacher_conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id uuid REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL UNIQUE,
    teacher_name text NOT NULL,
    teacher_email text NOT NULL,
    status text NOT NULL CHECK (status IN ('open', 'closed')) DEFAULT 'open',
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

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

-- 15. ENABLE RLS & POLICIES FOR NEW TABLES
ALTER TABLE public.student_development ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_messages ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "Admins full access on class_activities" ON public.class_activities;
CREATE POLICY "Admins full access on class_activities" ON public.class_activities
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Teachers view and manage class activities" ON public.class_activities;
CREATE POLICY "Teachers view and manage class activities" ON public.class_activities
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher'));

DROP POLICY IF EXISTS "Admins full access on home_activities" ON public.home_activities;
CREATE POLICY "Admins full access on home_activities" ON public.home_activities
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Teachers view and manage home activities" ON public.home_activities;
CREATE POLICY "Teachers view and manage home activities" ON public.home_activities
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher'));

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

-- 16. PERFORMANCE OPTIMIZATION INDEXES
CREATE INDEX IF NOT EXISTS idx_students_parent_id ON public.students(parent_id);
CREATE INDEX IF NOT EXISTS idx_students_parent_email ON public.students(parent_email);
CREATE INDEX IF NOT EXISTS idx_students_admission_no ON public.students(admission_no);
CREATE INDEX IF NOT EXISTS idx_students_program ON public.students(program);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON public.attendance(student_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date DESC);
CREATE INDEX IF NOT EXISTS idx_fees_student_id ON public.fees(student_id);
CREATE INDEX IF NOT EXISTS idx_fees_status ON public.fees(status);
CREATE INDEX IF NOT EXISTS idx_fees_due_date ON public.fees(due_date ASC);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON public.payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_fee_id ON public.payments(fee_id);
CREATE INDEX IF NOT EXISTS idx_notes_student_id ON public.notes(student_id);
CREATE INDEX IF NOT EXISTS idx_notes_date ON public.notes(date DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_pub_date ON public.announcements(published, date DESC);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date ASC);
CREATE INDEX IF NOT EXISTS idx_conversations_student_id ON public.conversations(student_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON public.conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON public.messages(conversation_id, created_at ASC);


