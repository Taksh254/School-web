-- ── SEED TEACHERS & ASSIGNMENTS ────────────────────────────────────────────

-- 1. Ensure profiles role constraint permits 'teacher'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'parent', 'teacher', 'student', 'staff'));

-- 2. Insert or update default teachers in teachers table
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

-- 3. Link students to their respective teachers
UPDATE public.students s
SET teacher_id = t.id
FROM public.teachers t
WHERE LOWER(s.teacher) LIKE '%' || LOWER(SPLIT_PART(t.full_name, ' ', 2)) || '%'
   OR LOWER(s.teacher) = LOWER(t.full_name);
