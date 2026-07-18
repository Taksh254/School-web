-- ── TEACHER MANAGEMENT MODULE MIGRATION ───────────────────────────────

-- 1. TEACHERS TABLE
create table if not exists public.teachers (
    id uuid primary key default gen_random_uuid(),
    teacher_id text not null unique,
    full_name text not null,
    gender text not null check (gender in ('Male', 'Female', 'Other')),
    dob date not null,
    phone text not null,
    email text not null unique,
    address text not null,
    qualification text not null,
    experience text,
    designation text not null,
    department text not null,
    specialization text,
    joining_date date not null default current_date,
    employment_type text not null check (employment_type in ('Full Time', 'Part Time', 'Contract')),
    status text not null check (status in ('Active', 'On Leave', 'Resigned')) default 'Active',
    emergency_contact text not null,
    blood_group text,
    aadhaar_number text,
    pan_number text,
    bank_name text,
    account_number text,
    ifsc_code text,
    upi_id text,
    photo text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 2. TEACHER SALARY TABLE
create table if not exists public.teacher_salary (
    id uuid primary key default gen_random_uuid(),
    teacher_id uuid references public.teachers(id) on delete cascade not null,
    month_year text not null, -- format: 'YYYY-MM'
    basic_salary numeric(10, 2) not null default 0.00,
    allowances numeric(10, 2) not null default 0.00,
    bonus numeric(10, 2) not null default 0.00,
    deductions numeric(10, 2) not null default 0.00,
    pf numeric(10, 2) not null default 0.00,
    esi numeric(10, 2) not null default 0.00,
    net_salary numeric(10, 2) not null default 0.00,
    status text not null check (status in ('Pending', 'Paid')) default 'Pending',
    payment_date date,
    payment_mode text check (payment_mode in ('Cash', 'Bank Transfer', 'Cheque', 'UPI')),
    created_at timestamp with time zone default now(),
    unique(teacher_id, month_year)
);

-- 3. TEACHER ATTENDANCE TABLE
create table if not exists public.teacher_attendance (
    id uuid primary key default gen_random_uuid(),
    teacher_id uuid references public.teachers(id) on delete cascade not null,
    date date not null,
    status text not null check (status in ('Present', 'Absent', 'Half Day', 'Late Entry')),
    notes text,
    unique(teacher_id, date)
);

-- 4. TEACHER LEAVE TABLE
create table if not exists public.teacher_leave (
    id uuid primary key default gen_random_uuid(),
    teacher_id uuid references public.teachers(id) on delete cascade not null,
    start_date date not null,
    end_date date not null,
    type text not null check (type in ('Casual Leave', 'Medical Leave', 'Paid Leave', 'Unpaid Leave')),
    reason text not null,
    status text not null check (status in ('Pending', 'Approved', 'Rejected')) default 'Pending',
    applied_on date not null default current_date
);

-- 5. TEACHER DOCUMENTS TABLE
create table if not exists public.teacher_documents (
    id uuid primary key default gen_random_uuid(),
    teacher_id uuid references public.teachers(id) on delete cascade not null,
    title text not null,
    type text not null check (type in ('Resume', 'Qualification Certificates', 'ID Proof', 'Joining Letter', 'Experience Certificate', 'Other')),
    file_url text not null,
    uploaded_at timestamp with time zone default now()
);

-- 6. TEACHER NOTES TABLE
create table if not exists public.teacher_notes (
    id uuid primary key default gen_random_uuid(),
    teacher_id uuid references public.teachers(id) on delete cascade not null,
    note text not null,
    author text not null,
    date date not null default current_date
);

-- ── ROW LEVEL SECURITY (RLS) POLICIES ────────────────────────────────

alter table public.teachers enable row level security;
alter table public.teacher_salary enable row level security;
alter table public.teacher_attendance enable row level security;
alter table public.teacher_leave enable row level security;
alter table public.teacher_documents enable row level security;
alter table public.teacher_notes enable row level security;

-- Admins have full access to all teacher tables
create policy "Admins have full access to teachers" on public.teachers for all using (public.is_admin());
create policy "Admins have full access to teacher_salary" on public.teacher_salary for all using (public.is_admin());
create policy "Admins have full access to teacher_attendance" on public.teacher_attendance for all using (public.is_admin());
create policy "Admins have full access to teacher_leave" on public.teacher_leave for all using (public.is_admin());
create policy "Admins have full access to teacher_documents" on public.teacher_documents for all using (public.is_admin());
create policy "Admins have full access to teacher_notes" on public.teacher_notes for all using (public.is_admin());

-- ── INDEXES FOR PERFORMANCE ──────────────────────────────────────

create index if not exists idx_teachers_status on public.teachers(status);
create index if not exists idx_teachers_email on public.teachers(email);
create index if not exists idx_tsalary_teacher on public.teacher_salary(teacher_id);
create index if not exists idx_tsalary_month on public.teacher_salary(month_year);
create index if not exists idx_tattendance_teacher on public.teacher_attendance(teacher_id);
create index if not exists idx_tattendance_date on public.teacher_attendance(date);
create index if not exists idx_tleave_teacher on public.teacher_leave(teacher_id);
create index if not exists idx_tdocuments_teacher on public.teacher_documents(teacher_id);
create index if not exists idx_tnotes_teacher on public.teacher_notes(teacher_id);
