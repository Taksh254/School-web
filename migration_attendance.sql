-- ── ATTENDANCE & TEACHER ASSIGNMENT MIGRATION ────────────────────────────

-- 0. Update profiles check constraint to support 'teacher' role
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'parent', 'teacher', 'student', 'staff'));

-- 1. Ensure students table has teacher_id foreign key
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES public.teachers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_students_teacher_id ON public.students(teacher_id);

-- 2. Ensure attendance table has full structure and constraint
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES public.teachers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Ensure unique constraint on (student_id, date)
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

-- Ensure status check allows present, absent, leave, holiday
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_status_check;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_status_check CHECK (status IN ('present', 'absent', 'leave', 'holiday'));

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_teacher_id ON public.attendance(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON public.attendance(student_id, date);

-- 3. Security Helper Functions
CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS boolean SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'teacher'
    );
END;
$$ LANGUAGE plpgsql;

-- Helper to get the teacher record id associated with the logged-in user's email
CREATE OR REPLACE FUNCTION public.get_current_teacher_id()
RETURNS uuid SECURITY DEFINER SET search_path = public AS $$
DECLARE
    t_id uuid;
BEGIN
    SELECT t.id INTO t_id
    FROM public.teachers t
    JOIN public.profiles p ON LOWER(p.email) = LOWER(t.email)
    WHERE p.id = auth.uid()
    LIMIT 1;

    RETURN t_id;
END;
$$ LANGUAGE plpgsql;

-- 4. ROW LEVEL SECURITY (RLS) POLICIES ON ATTENDANCE

-- Drop existing attendance policies to recreate cleanly
DROP POLICY IF EXISTS "Admins have full access to attendance" ON public.attendance;
DROP POLICY IF EXISTS "Parents can view their own child's attendance" ON public.attendance;
DROP POLICY IF EXISTS "Teachers can view attendance for their students" ON public.attendance;
DROP POLICY IF EXISTS "Teachers can insert attendance for their students" ON public.attendance;
DROP POLICY IF EXISTS "Teachers can update attendance for their students" ON public.attendance;

-- Admin: Full access
CREATE POLICY "Admins have full access to attendance" ON public.attendance
    FOR ALL USING (public.is_admin());

-- Parent: Read-only access to their own child's attendance
CREATE POLICY "Parents can view their own child's attendance" ON public.attendance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.child_id = attendance.student_id
        )
    );

-- Teacher: Select attendance of students assigned to them (by teacher_id or teacher full name matching)
CREATE POLICY "Teachers can view attendance for their students" ON public.attendance
    FOR SELECT USING (
        public.is_teacher() AND (
            attendance.teacher_id = public.get_current_teacher_id()
            OR EXISTS (
                SELECT 1 FROM public.students s
                WHERE s.id = attendance.student_id
                AND (
                    s.teacher_id = public.get_current_teacher_id()
                    OR LOWER(s.teacher) IN (
                        SELECT LOWER(t.full_name) FROM public.teachers t
                        JOIN public.profiles p ON LOWER(p.email) = LOWER(t.email)
                        WHERE p.id = auth.uid()
                    )
                )
            )
        )
    );

-- Teacher: Insert attendance for assigned students
CREATE POLICY "Teachers can insert attendance for their students" ON public.attendance
    FOR INSERT WITH CHECK (
        public.is_teacher() AND (
            EXISTS (
                SELECT 1 FROM public.students s
                WHERE s.id = attendance.student_id
                AND (
                    s.teacher_id = public.get_current_teacher_id()
                    OR LOWER(s.teacher) IN (
                        SELECT LOWER(t.full_name) FROM public.teachers t
                        JOIN public.profiles p ON LOWER(p.email) = LOWER(t.email)
                        WHERE p.id = auth.uid()
                    )
                )
            )
        )
    );

-- Teacher: Update attendance for assigned students
CREATE POLICY "Teachers can update attendance for their students" ON public.attendance
    FOR UPDATE USING (
        public.is_teacher() AND (
            EXISTS (
                SELECT 1 FROM public.students s
                WHERE s.id = attendance.student_id
                AND (
                    s.teacher_id = public.get_current_teacher_id()
                    OR LOWER(s.teacher) IN (
                        SELECT LOWER(t.full_name) FROM public.teachers t
                        JOIN public.profiles p ON LOWER(p.email) = LOWER(t.email)
                        WHERE p.id = auth.uid()
                    )
                )
            )
        )
    );

-- 5. ROW LEVEL SECURITY (RLS) POLICIES ON STUDENTS FOR TEACHERS

DROP POLICY IF EXISTS "Teachers can view their assigned students" ON public.students;

CREATE POLICY "Teachers can view their assigned students" ON public.students
    FOR SELECT USING (
        public.is_teacher() AND (
            students.teacher_id = public.get_current_teacher_id()
            OR LOWER(students.teacher) IN (
                SELECT LOWER(t.full_name) FROM public.teachers t
                JOIN public.profiles p ON LOWER(p.email) = LOWER(t.email)
                WHERE p.id = auth.uid()
            )
        )
    );
