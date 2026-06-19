// ── Roles & Auth ──────────────────────────────────────────────

export type Role = "admin" | "parent"

// Admin email list.
export const ADMIN_EMAILS = ["admin@school.com", "sehrawatsonia27@gmail.com", "admin01@gmail.com"]

export function inferRoleFromEmail(email: string): Role {
  const lower = email.toLowerCase()
  if (ADMIN_EMAILS.includes(lower)) return "admin"
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

export type ProgramType = "Play group" | "Nursery" | "LKG" | "UKG"

export interface Student {
  id: string
  name: string
  age: number
  dateOfBirth: string
  program: ProgramType
  section: string
  parentName: string
  parentEmail: string
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

// ── Teacher Notes ─────────────────────────────────────────────

export interface TeacherNote {
  id: string
  studentId: string
  teacherName: string
  date: string
  message: string
  category: "academic" | "behavior" | "health" | "general" | "achievement"
}
