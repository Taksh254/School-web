-- ── SUPABASE DATABASE SCHEMA FOR HAPPY KIDS PRESCHOOL ──────────────────

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── 1. STUDENTS TABLE ────────────────────────────────────────────────
create table public.students (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    age integer not null check (age >= 0),
    date_of_birth date not null,
    program text not null check (program in ('Play Group', 'Nursery', 'LKG', 'UKG')),
    section text not null default 'A',
    parent_name text not null,
    parent_email text not null,
    parent_phone text,
    admission_no text not null unique,
    teacher text not null,
    photo text
);

-- ── 2. PROFILES TABLE (linked to Auth.Users) ─────────────────────────
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text not null unique,
    name text,
    role text not null check (role in ('admin', 'parent')) default 'parent',
    child_id uuid references public.students(id) on delete set null,
    must_change_password boolean not null default false
);

-- ── 3. ATTENDANCE TABLE ──────────────────────────────────────────────
create table public.attendance (
    id uuid primary key default gen_random_uuid(),
    student_id uuid references public.students(id) on delete cascade not null,
    date date not null,
    status text not null check (status in ('present', 'absent', 'holiday', 'leave')),
    unique (student_id, date)
);

-- ── 4. FEES TABLE ────────────────────────────────────────────────────
create table public.fees (
    id uuid primary key default gen_random_uuid(),
    student_id uuid references public.students(id) on delete cascade not null,
    student_name text not null,
    term text not null,
    amount numeric(10, 2) not null check (amount >= 0),
    paid_amount numeric(10, 2) not null check (paid_amount >= 0) default 0.00,
    due_date date not null,
    status text not null check (status in ('paid', 'pending', 'overdue', 'partial')) default 'pending',
    created_at date not null default current_date
);

-- ── 5. PAYMENTS TABLE ────────────────────────────────────────────────
create table public.payments (
    id uuid primary key default gen_random_uuid(),
    fee_id uuid references public.fees(id) on delete cascade not null,
    student_id uuid references public.students(id) on delete cascade not null,
    student_name text not null,
    amount numeric(10, 2) not null check (amount > 0),
    date date not null default current_date,
    method text not null check (method in ('Online', 'Cash', 'Cheque', 'UPI')),
    receipt_no text not null unique,
    description text
);

-- ── 6. ANNOUNCEMENTS TABLE ──────────────────────────────────────────
create table public.announcements (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    content text not null,
    date date not null default current_date,
    priority text not null check (priority in ('normal', 'important', 'urgent')) default 'normal',
    published boolean not null default true,
    author text not null
);

-- ── 7. EVENTS TABLE ──────────────────────────────────────────────────
create table public.events (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text,
    date date not null,
    time text not null,
    location text not null,
    type text not null check (type in ('academic', 'cultural', 'sports', 'holiday', 'meeting'))
);

-- ── 8. TEACHER NOTES TABLE ───────────────────────────────────────────
create table public.notes (
    id uuid primary key default gen_random_uuid(),
    student_id uuid references public.students(id) on delete cascade not null,
    teacher_name text not null,
    date date not null default current_date,
    message text not null,
    category text not null check (category in ('academic', 'behavior', 'health', 'general', 'achievement')) default 'general'
);

-- ── ROW LEVEL SECURITY (RLS) POLICIES ────────────────────────────────

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.attendance enable row level security;
alter table public.fees enable row level security;
alter table public.payments enable row level security;
alter table public.announcements enable row level security;
alter table public.events enable row level security;
alter table public.notes enable row level security;

-- ── FIX: Drop recursive policies on profiles, recreate with security definer helper ──

-- Drop old recursive policies first (ignore if not found)
do $$
begin
    -- Drop policies that use inline subqueries on profiles (cause recursion)
    if exists (select 1 from pg_policies where policyname = 'Admins can manage all profiles' and tablename = 'profiles') then
        drop policy "Admins can manage all profiles" on public.profiles;
    end if;
    if exists (select 1 from pg_policies where policyname = 'Admins have full access to students' and tablename = 'students') then
        drop policy "Admins have full access to students" on public.students;
    end if;
    if exists (select 1 from pg_policies where policyname = 'Admins have full access to attendance' and tablename = 'attendance') then
        drop policy "Admins have full access to attendance" on public.attendance;
    end if;
    if exists (select 1 from pg_policies where policyname = 'Admins have full access to fees' and tablename = 'fees') then
        drop policy "Admins have full access to fees" on public.fees;
    end if;
    if exists (select 1 from pg_policies where policyname = 'Admins have full access to payments' and tablename = 'payments') then
        drop policy "Admins have full access to payments" on public.payments;
    end if;
    if exists (select 1 from pg_policies where policyname = 'Admins have full access to announcements' and tablename = 'announcements') then
        drop policy "Admins have full access to announcements" on public.announcements;
    end if;
    if exists (select 1 from pg_policies where policyname = 'Admins have full access to events' and tablename = 'events') then
        drop policy "Admins have full access to events" on public.events;
    end if;
    if exists (select 1 from pg_policies where policyname = 'Admins have full access to notes' and tablename = 'notes') then
        drop policy "Admins have full access to notes" on public.notes;
    end if;
end;
$$;

-- Helper function to check if the current user is an admin
-- SECURITY DEFINER bypasses RLS on the profiles table to prevent infinite recursion
create or replace function public.is_admin()
returns boolean security definer set search_path = public as $$
begin
    return coalesce(
        lower(auth.jwt() ->> 'email') in ('admin@school.com', 'sehrawatsonia27@gmail.com', 'admin01@gmail.com'),
        false
    );
end;
$$ language plpgsql;

-- ── PROFILES POLICIES ────────────────────────────────────────────────
create policy "Users can read own profile" on public.profiles
    for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
    for update using (auth.uid() = id);

create policy "Admins can manage all profiles" on public.profiles
    for all using (public.is_admin());

-- ── STUDENTS POLICIES ────────────────────────────────────────────────
create policy "Parents can view their own child's profile" on public.students
    for select using (
        exists (
            select 1 from public.profiles 
            where profiles.id = auth.uid() and profiles.child_id = students.id
        )
    );

create policy "Admins have full access to students" on public.students
    for all using (public.is_admin());

-- ── ATTENDANCE POLICIES ──────────────────────────────────────────────
create policy "Parents can view their own child's attendance" on public.attendance
    for select using (
        exists (
            select 1 from public.profiles 
            where profiles.id = auth.uid() and profiles.child_id = attendance.student_id
        )
    );

create policy "Admins have full access to attendance" on public.attendance
    for all using (public.is_admin());

-- ── FEES POLICIES ────────────────────────────────────────────────────
create policy "Parents can view their own child's fees" on public.fees
    for select using (
        exists (
            select 1 from public.profiles 
            where profiles.id = auth.uid() and profiles.child_id = fees.student_id
        )
    );

create policy "Admins have full access to fees" on public.fees
    for all using (public.is_admin());

-- ── PAYMENTS POLICIES ────────────────────────────────────────────────
create policy "Parents can view their own child's payments" on public.payments
    for select using (
        exists (
            select 1 from public.profiles 
            where profiles.id = auth.uid() and profiles.child_id = payments.student_id
        )
    );

create policy "Admins have full access to payments" on public.payments
    for all using (public.is_admin());

-- ── ANNOUNCEMENTS POLICIES ───────────────────────────────────────────
create policy "All authenticated users can view announcements" on public.announcements
    for select using (auth.uid() is not null);

create policy "Admins have full access to announcements" on public.announcements
    for all using (public.is_admin());

-- ── EVENTS POLICIES ──────────────────────────────────────────────────
create policy "All authenticated users can view events" on public.events
    for select using (auth.uid() is not null);

create policy "Admins have full access to events" on public.events
    for all using (public.is_admin());

-- ── TEACHER NOTES POLICIES ───────────────────────────────────────────
create policy "Parents can view notes for their child" on public.notes
    for select using (
        exists (
            select 1 from public.profiles 
            where profiles.id = auth.uid() and profiles.child_id = notes.student_id
        )
    );

create policy "Admins have full access to notes" on public.notes
    for all using (public.is_admin());

-- ── 9. AUTH TRIGGER FOR NEW SIGNUPS ──────────────────────────────────
create or replace function public.handle_new_user()
returns trigger set search_path = public as $$
begin
    insert into public.profiles (id, email, name, role, child_id)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'name', 'New Parent'),
        case 
            when lower(new.email) in ('admin@school.com', 'sehrawatsonia27@gmail.com', 'admin01@gmail.com') then 'admin'
            else 'parent'
        end,
        case 
            when new.raw_user_meta_data->>'child_id' is not null 
            then (new.raw_user_meta_data->>'child_id')::uuid 
            else null 
        end
    );
    return new;
end;
$$ language plpgsql security definer;

-- Create trigger only if not exists
do $$
begin
    if not exists (select 1 from pg_trigger where tgname = 'on_auth_user_created') then
        create trigger on_auth_user_created
            after insert on auth.users
            for each row execute procedure public.handle_new_user();
    end if;
end;
$$;

-- ── 10. INDEXES FOR PERFORMANCE ──────────────────────────────────────
create index if not exists idx_profiles_child_id on public.profiles(child_id);
create index if not exists idx_attendance_student_id on public.attendance(student_id);
create index if not exists idx_attendance_date on public.attendance(date);
create index if not exists idx_fees_student_id on public.fees(student_id);
create index if not exists idx_fees_due_date on public.fees(due_date);
create index if not exists idx_payments_fee_id on public.payments(fee_id);
create index if not exists idx_payments_student_id on public.payments(student_id);
create index if not exists idx_notes_student_id on public.notes(student_id);
