import type { User, Student, FeeRecord, Payment, Announcement, SchoolEvent, TeacherNote, AttendanceRecord } from "@/lib/types"

// ── Users ──────────────────────────────────────────────────────

export const mockAdminUser: User = {
  id: "u1",
  email: "admin@school.com",
  name: "Principal Sunita",
  role: "admin",
}

export const mockParentUser: User = {
  id: "u2",
  email: "parent@school.com",
  name: "Priya Sharma",
  role: "parent",
  childId: "s1",
}

export const mockParentNoChild: User = {
  id: "u3",
  email: "nolink@parent.com",
  name: "Unlinked Parent",
  role: "parent",
  // No childId
}

// ── Students ──────────────────────────────────────────────────

export const mockStudent: Student = {
  id: "s1",
  name: "Aanya Sharma",
  age: 4,
  dateOfBirth: "2022-03-15",
  program: "Nursery",
  section: "A",
  parentName: "Priya Sharma",
  parentEmail: "priya@email.com",
  parentPhone: "+91 98765 43210",
  admissionNo: "ADM-001",
  teacher: "Ms. Anita Desai",
}

export const mockStudent2: Student = {
  id: "s2",
  name: "Arjun Verma",
  age: 3,
  dateOfBirth: "2023-06-22",
  program: "Play Group",
  section: "A",
  parentName: "Rohit Verma",
  parentEmail: "rohit@email.com",
  parentPhone: "+91 98765 43211",
  admissionNo: "ADM-002",
  teacher: "Ms. Priya Kapoor",
}

export const mockNewStudentData: Omit<Student, "id"> = {
  name: "Test Child",
  age: 4,
  dateOfBirth: "2022-01-01",
  program: "Nursery",
  section: "A",
  parentName: "Test Parent",
  parentEmail: "test@email.com",
  parentPhone: "+91 99999 88888",
  admissionNo: "ADM-TEST-001",
  teacher: "Ms. Anita Desai",
}

// ── Fees ──────────────────────────────────────────────────────

export const mockFeeRecord: FeeRecord = {
  id: "f1",
  studentId: "s1",
  studentName: "Aanya Sharma",
  term: "Q1 Apr-Jun 2026",
  amount: 25000,
  paidAmount: 25000,
  dueDate: "2026-04-15",
  status: "paid",
  createdAt: "2026-03-20",
}

export const mockFeePending: FeeRecord = {
  id: "f2",
  studentId: "s1",
  studentName: "Aanya Sharma",
  term: "Q2 Jul-Sep 2026",
  amount: 25000,
  paidAmount: 0,
  dueDate: "2026-07-15",
  status: "pending",
  createdAt: "2026-06-20",
}

export const mockFeeOverdue: FeeRecord = {
  id: "f3",
  studentId: "s2",
  studentName: "Arjun Verma",
  term: "Q1 Apr-Jun 2026",
  amount: 22000,
  paidAmount: 0,
  dueDate: "2026-04-15",
  status: "overdue",
  createdAt: "2026-03-20",
}

export const mockFeePartial: FeeRecord = {
  id: "f4",
  studentId: "s2",
  studentName: "Arjun Verma",
  term: "Q2 Jul-Sep 2026",
  amount: 22000,
  paidAmount: 11000,
  dueDate: "2026-07-15",
  status: "partial",
  createdAt: "2026-06-20",
}

export const mockPayment: Payment = {
  id: "p1",
  feeId: "f1",
  studentId: "s1",
  studentName: "Aanya Sharma",
  amount: 25000,
  date: "2026-04-10",
  method: "UPI",
  receiptNo: "HK-2026-001",
  description: "Q1 Apr-Jun 2026 Tuition Fee",
}

// ── Attendance ────────────────────────────────────────────────

export const mockAttendancePresent: AttendanceRecord = {
  id: "att1",
  studentId: "s1",
  date: "2026-05-01",
  status: "present",
}

export const mockAttendanceAbsent: AttendanceRecord = {
  id: "att2",
  studentId: "s1",
  date: "2026-05-02",
  status: "absent",
}

export const mockAttendanceHoliday: AttendanceRecord = {
  id: "att3",
  studentId: "s1",
  date: "2026-05-04", // Sunday
  status: "holiday",
}

// ── Announcements ─────────────────────────────────────────────

export const mockAnnouncement: Announcement = {
  id: "a1",
  title: "Annual Day Celebration 2026",
  content: "We are thrilled to announce our Annual Day on June 15th!",
  date: "2026-05-25",
  priority: "important",
  published: true,
  author: "Principal Sunita",
}

export const mockAnnouncementUnpublished: Announcement = {
  id: "a2",
  title: "Draft Notice",
  content: "This is an unpublished draft.",
  date: "2026-05-26",
  priority: "normal",
  published: false,
  author: "Admin",
}

export const mockAnnouncementUrgent: Announcement = {
  id: "a3",
  title: "School Closure",
  content: "School will be closed tomorrow.",
  date: "2026-06-01",
  priority: "urgent",
  published: true,
  author: "Principal Sunita",
}

// ── Events ────────────────────────────────────────────────────

export const mockEvent: SchoolEvent = {
  id: "e1",
  title: "Annual Day Celebration",
  description: "Grand celebration featuring all classes.",
  date: "2026-06-15",
  time: "10:00 AM",
  location: "School Auditorium",
  type: "cultural",
}

// ── Teacher Notes ─────────────────────────────────────────────

export const mockNote: TeacherNote = {
  id: "n1",
  studentId: "s1",
  teacherName: "Ms. Anita Desai",
  date: "2026-05-28",
  message: "Aanya did wonderfully in art class today!",
  category: "achievement",
}

// ── Excel Import Rows ─────────────────────────────────────────

export const validImportRow: Record<string, unknown> = {
  "Student Name": "New Test Student",
  "Parents Name": "New Test Parent",
  "Date of Birth": "2022-01-15",
  "Email": "newparent@test.com",
  "Phone No.": "+91 99999 00000",
  "Admission No.": "ADM-NEW-001",
  "Class": "Nursery",
}

export const invalidImportRowMissingName: Record<string, unknown> = {
  "Student Name": "",
  "Parents Name": "Some Parent",
  "Email": "parent@test.com",
  "Admission No.": "ADM-NEW-002",
  "Class": "Nursery",
}

export const invalidImportRowBadProgram: Record<string, unknown> = {
  "Student Name": "Bad Program Kid",
  "Parents Name": "Some Parent",
  "Email": "parent@test.com",
  "Admission No.": "ADM-NEW-003",
  "Class": "Invalid Grade",
}

export const invalidImportRowBadEmail: Record<string, unknown> = {
  "Student Name": "Bad Email Kid",
  "Parents Name": "Some Parent",
  "Email": "not-an-email",
  "Admission No.": "ADM-NEW-004",
  "Class": "Nursery",
}

// ── Pre-seeded localStorage state ────────────────────────────
export function seedLocalStorage() {
  const students: Student[] = [mockStudent, mockStudent2]
  const fees: FeeRecord[] = [mockFeeRecord, mockFeePending, mockFeeOverdue, mockFeePartial]
  const payments: Payment[] = [mockPayment]
  const attendance: AttendanceRecord[] = [
    mockAttendancePresent,
    mockAttendanceAbsent,
    mockAttendanceHoliday,
  ]
  const announcements: Announcement[] = [
    mockAnnouncement,
    mockAnnouncementUnpublished,
    mockAnnouncementUrgent,
  ]

  localStorage.setItem("hk_students", JSON.stringify(students))
  localStorage.setItem("hk_fees", JSON.stringify(fees))
  localStorage.setItem("hk_payments", JSON.stringify(payments))
  localStorage.setItem("hk_attendance", JSON.stringify(attendance))
  localStorage.setItem("hk_announcements", JSON.stringify(announcements))
  localStorage.setItem("hk_events", JSON.stringify([mockEvent]))
  localStorage.setItem("hk_notes", JSON.stringify([mockNote]))
  localStorage.setItem("hk_seeded", "1")
}
