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
