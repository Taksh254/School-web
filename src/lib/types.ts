export type Role = "admin" | "parent"

/**
 * SECURITY: Admin email list is NOT kept client-side.
 * Role is resolved exclusively from `profiles.role` in the database.
 * This function is kept as a stub so existing server-side call-sites compile.
 * On the client, it always returns "parent" — the server/middleware owns role resolution.
 *
 * Server-side callers (middleware, API routes) should use the DB profile directly.
 */
export function inferRoleFromEmail(_email: string): Role {
  // This function must NOT contain a hardcoded email allowlist.
  // Role assignment is performed server-side by reading profiles.role from Supabase.
  return "parent"
}


export interface User {
  id: string
  email: string
  name: string
  role: Role
  avatar?: string
  /** Only relevant for parent role */
  childId?: string
}

// ── Students ──────────────────────────────────────────────────

export type ProgramType = "Play Group" | "Nursery" | "LKG" | "UKG"

export interface Student {
  id: string
  name: string
  age: number
  dateOfBirth: string
  program: ProgramType
  section: string
  parentName: string
  parentEmail: string
  parentId?: string
  parentPhone: string
  admissionNo: string
  teacher: string
  photo?: string
}

// ── Attendance ────────────────────────────────────────────────

export type AttendanceStatus = "present" | "absent" | "holiday" | "leave"

export interface AttendanceRecord {
  id: string
  studentId: string
  date: string // YYYY-MM-DD
  status: AttendanceStatus
}

// ── Fees & Payments ───────────────────────────────────────────

export type FeeStatus = "paid" | "pending" | "overdue" | "partial"
export type PaymentMethod = "Online" | "Cash" | "Cheque" | "UPI"

export interface FeeRecord {
  id: string
  studentId: string
  studentName: string
  term: string
  amount: number
  paidAmount: number
  dueDate: string
  status: FeeStatus
  createdAt: string
}

export interface Payment {
  id: string
  feeId: string
  studentId: string
  studentName: string
  amount: number
  date: string
  method: PaymentMethod
  receiptNo: string
  description: string
}

// ── Announcements ─────────────────────────────────────────────

export type AnnouncementPriority = "normal" | "important" | "urgent"

export interface Announcement {
  id: string
  title: string
  content: string
  date: string
  priority: AnnouncementPriority
  published: boolean
  author: string
}

// ── Events ────────────────────────────────────────────────────

export interface SchoolEvent {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  type: "academic" | "cultural" | "sports" | "holiday" | "meeting"
}

// ── Parent Account Provisioning ───────────────────────────────

/**
 * Returned by createParentAccount() and bulkAddStudents() to describe
 * the outcome for each parent email processed.
 *
 * - created: new Supabase Auth user was made
 * - skipped: email already had an auth account (idempotent)
 * - error:   something went wrong (message included)
 */
export interface ParentAccountResult {
  email: string
  /** DDMMYYYY — only present when created=true; must NOT be stored in the DB */
  defaultPassword?: string
  created: boolean
  skipped: boolean
  error?: string
  userId?: string
}

// ── Teacher Notes ─────────────────────────────────────────────

export interface TeacherNote {
  id: string
  studentId: string
  teacherName: string
  date: string
  message: string
  category: "academic" | "behavior" | "health" | "general" | "achievement"
}

// ── Teachers ──────────────────────────────────────────────────

export type EmploymentType = "Full Time" | "Part Time" | "Contract"
export type TeacherStatus = "Active" | "On Leave" | "Resigned"
export type LeaveType = "Casual Leave" | "Medical Leave" | "Paid Leave" | "Unpaid Leave"
export type LeaveStatus = "Pending" | "Approved" | "Rejected"
export type TeacherAttendanceStatus = "Present" | "Absent" | "Half Day" | "Late Entry"
export type DocumentType = "Resume" | "Qualification Certificates" | "ID Proof" | "Joining Letter" | "Experience Certificate" | "Other"

export interface Teacher {
  id: string
  full_name: string
  gender: "Male" | "Female" | "Other"
  dob: string
  phone: string
  email: string
  address: string
  specialization?: string
  employment_type: EmploymentType
  status: TeacherStatus
  emergency_contact: string
  blood_group?: string
  aadhaar_number?: string
  pan_number?: string
  bank_name?: string
  account_number?: string
  ifsc_code?: string
  upi_id?: string
  photo?: string
  created_at?: string
  updated_at?: string
}

export interface TeacherSalary {
  id: string
  teacher_id: string
  month_year: string
  basic_salary: number
  allowances: number
  bonus: number
  deductions: number
  pf: number
  esi: number
  net_salary: number
  status: "Pending" | "Paid"
  payment_date?: string
  payment_mode?: "Cash" | "Bank Transfer" | "Cheque" | "UPI"
  created_at?: string
}

export interface TeacherAttendance {
  id: string
  teacher_id: string
  date: string
  status: TeacherAttendanceStatus
  notes?: string
}

export interface TeacherLeave {
  id: string
  teacher_id: string
  start_date: string
  end_date: string
  type: LeaveType
  reason: string
  status: LeaveStatus
  applied_on: string
}

export interface TeacherDocument {
  id: string
  teacher_id: string
  title: string
  type: DocumentType
  file_url: string
  uploaded_at?: string
}
