import type {
  Student,
  AttendanceRecord,
  FeeRecord,
  Payment,
  Announcement,
  SchoolEvent,
  TeacherNote,
  User,
  ParentAccountResult,
} from "./types"
import { supabase, isSupabaseConfigured } from "./supabase"

// ── Parent Account Helpers ─────────────────────────────────────

/**
 * Calls the server-side /api/create-parent-account route to provision a
 * Supabase Auth user for a parent. Safe to call multiple times for the
 * same email — duplicate accounts are skipped automatically.
 *
 * NOTE: The generated password is NOT returned. It is managed by Supabase.
 */
export async function createParentAccount(
  parentEmail: string,
  parentName: string,
  studentId?: string // Optional for backward compatibility with old routing guard
): Promise<ParentAccountResult> {
  const email = parentEmail.trim().toLowerCase()
  if (!email || !email.includes("@")) {
    return { email, created: false, skipped: true, error: "Invalid or missing email" }
  }

  try {
    const res = await fetch("/api/create-parent-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, studentId, parentName }),
    })
    const json = await res.json()

    if (!res.ok) {
      console.error("[createParentAccount] API error:", json.error)
      return { email, created: false, skipped: false, error: json.error || "API error" }
    }

    if (json.skipped) {
      return { email, created: false, skipped: true, userId: json.userId }
    }

    return { email, created: true, skipped: false, userId: json.userId }
  } catch (err: any) {
    console.error("[createParentAccount] fetch failed:", err?.message)
    return { email, created: false, skipped: false, error: err?.message || "Network error" }
  }
}

// ── Helpers ───────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 10)

function get<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function set<T>(key: string, data: T) {
  if (typeof window === "undefined") return
  localStorage.setItem(key, JSON.stringify(data))
}

// ── Keys ──────────────────────────────────────────────────────

const K = {
  students: "hk_students",
  attendance: "hk_attendance",
  fees: "hk_fees",
  payments: "hk_payments",
  announcements: "hk_announcements",
  events: "hk_events",
  notes: "hk_notes",
  seeded: "hk_seeded",
} as const

// ── Demo Users removed for production ──────────────────────────

const SEED_STUDENTS: Student[] = [
  { id: "s1", name: "Aanya Sharma", age: 4, dateOfBirth: "2022-03-15", program: "Nursery", section: "A", parentName: "Priya Sharma", parentEmail: "priya@email.com", parentPhone: "+91 98765 43210", admissionNo: "ADM-001", teacher: "Ms. Anita Desai" },
  { id: "s2", name: "Arjun Verma", age: 3, dateOfBirth: "2023-06-22", program: "Play Group", section: "A", parentName: "Rohit Verma", parentEmail: "rohit@email.com", parentPhone: "+91 98765 43211", admissionNo: "ADM-002", teacher: "Ms. Priya Kapoor" },
  { id: "s3", name: "Riya Kapoor", age: 5, dateOfBirth: "2021-01-10", program: "LKG", section: "A", parentName: "Neha Kapoor", parentEmail: "neha@email.com", parentPhone: "+91 98765 43212", admissionNo: "ADM-003", teacher: "Ms. Anita Desai" },
  { id: "s4", name: "Kabir Singh", age: 3, dateOfBirth: "2023-09-05", program: "Play Group", section: "B", parentName: "Rohit Verma", parentEmail: "rohit@email.com", parentPhone: "+91 98765 43213", admissionNo: "ADM-004", teacher: "Ms. Priya Kapoor" },
  { id: "s5", name: "Myra Gupta", age: 4, dateOfBirth: "2022-11-18", program: "Nursery", section: "B", parentName: "Ankit Gupta", parentEmail: "ankit@email.com", parentPhone: "+91 98765 43214", admissionNo: "ADM-005", teacher: "Ms. Anita Desai" },
  { id: "s6", name: "Vivaan Mehta", age: 5, dateOfBirth: "2021-07-30", program: "UKG", section: "B", parentName: "Rohan Mehta", parentEmail: "rohan@email.com", parentPhone: "+91 98765 43215", admissionNo: "ADM-006", teacher: "Mr. Rohan Joshi" },
  { id: "s7", name: "Ishaan Reddy", age: 2, dateOfBirth: "2024-02-14", program: "Play Group", section: "A", parentName: "Srinivas Reddy", parentEmail: "srinivas@email.com", parentPhone: "+91 98765 43216", admissionNo: "ADM-007", teacher: "Ms. Priya Kapoor" },
  { id: "s8", name: "Anvi Patel", age: 4, dateOfBirth: "2022-05-20", program: "Nursery", section: "A", parentName: "Raj Patel", parentEmail: "raj@email.com", parentPhone: "+91 98765 43217", admissionNo: "ADM-008", teacher: "Ms. Anita Desai" },
]

function generateAttendance(): AttendanceRecord[] {
  const records: AttendanceRecord[] = []
  const year = new Date().getFullYear()
  const month = 4 // May (0-indexed)

  for (const student of SEED_STUDENTS) {
    for (let day = 1; day <= 30; day++) {
      const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      const dow = new Date(date).getDay()
      if (dow === 0) {
        records.push({ id: uid(), studentId: student.id, date, status: "holiday" })
      } else {
        const rand = Math.random()
        records.push({
          id: uid(),
          studentId: student.id,
          date,
          status: rand < 0.85 ? "present" : rand < 0.95 ? "absent" : "leave",
        })
      }
    }
  }
  return records
}

const SEED_FEES: FeeRecord[] = [
  { id: "f1", studentId: "s1", studentName: "Aanya Sharma", term: "Q1 Apr-Jun 2026", amount: 25000, paidAmount: 25000, dueDate: "2026-04-15", status: "paid", createdAt: "2026-03-20" },
  { id: "f2", studentId: "s1", studentName: "Aanya Sharma", term: "Q2 Jul-Sep 2026", amount: 25000, paidAmount: 0, dueDate: "2026-07-15", status: "pending", createdAt: "2026-06-20" },
  { id: "f3", studentId: "s2", studentName: "Arjun Verma", term: "Q1 Apr-Jun 2026", amount: 22000, paidAmount: 22000, dueDate: "2026-04-15", status: "paid", createdAt: "2026-03-20" },
  { id: "f4", studentId: "s3", studentName: "Riya Kapoor", term: "Q1 Apr-Jun 2026", amount: 28000, paidAmount: 28000, dueDate: "2026-04-15", status: "paid", createdAt: "2026-03-20" },
  { id: "f5", studentId: "s4", studentName: "Kabir Singh", term: "Q1 Apr-Jun 2026", amount: 22000, paidAmount: 10000, dueDate: "2026-04-15", status: "partial", createdAt: "2026-03-20" },
  { id: "f6", studentId: "s5", studentName: "Myra Gupta", term: "Q1 Apr-Jun 2026", amount: 25000, paidAmount: 0, dueDate: "2026-04-15", status: "overdue", createdAt: "2026-03-20" },
  { id: "f7", studentId: "s6", studentName: "Vivaan Mehta", term: "Q1 Apr-Jun 2026", amount: 28000, paidAmount: 28000, dueDate: "2026-04-15", status: "paid", createdAt: "2026-03-20" },
  { id: "f8", studentId: "s7", studentName: "Ishaan Reddy", term: "Q1 Apr-Jun 2026", amount: 22000, paidAmount: 22000, dueDate: "2026-04-15", status: "paid", createdAt: "2026-03-20" },
  { id: "f9", studentId: "s8", studentName: "Anvi Patel", term: "Q1 Apr-Jun 2026", amount: 25000, paidAmount: 25000, dueDate: "2026-04-15", status: "paid", createdAt: "2026-03-20" },
]

const SEED_PAYMENTS: Payment[] = [
  { id: "p1", feeId: "f1", studentId: "s1", studentName: "Aanya Sharma", amount: 25000, date: "2026-04-10", method: "UPI", receiptNo: "HK-2026-001", description: "Q1 Apr-Jun 2026 Tuition Fee" },
  { id: "p2", feeId: "f3", studentId: "s2", studentName: "Arjun Verma", amount: 22000, date: "2026-04-12", method: "Online", receiptNo: "HK-2026-002", description: "Q1 Apr-Jun 2026 Tuition Fee" },
  { id: "p3", feeId: "f4", studentId: "s3", studentName: "Riya Kapoor", amount: 28000, date: "2026-04-08", method: "Cash", receiptNo: "HK-2026-003", description: "Q1 Apr-Jun 2026 Tuition Fee" },
  { id: "p4", feeId: "f5", studentId: "s4", studentName: "Kabir Singh", amount: 10000, date: "2026-04-14", method: "UPI", receiptNo: "HK-2026-004", description: "Q1 Apr-Jun 2026 Partial Payment" },
  { id: "p5", feeId: "f7", studentId: "s6", studentName: "Vivaan Mehta", amount: 28000, date: "2026-04-05", method: "Cheque", receiptNo: "HK-2026-005", description: "Q1 Apr-Jun 2026 Tuition Fee" },
  { id: "p6", feeId: "f8", studentId: "s7", studentName: "Ishaan Reddy", amount: 22000, date: "2026-04-11", method: "Online", receiptNo: "HK-2026-006", description: "Q1 Apr-Jun 2026 Tuition Fee" },
  { id: "p7", feeId: "f9", studentId: "s8", studentName: "Anvi Patel", amount: 25000, date: "2026-04-09", method: "UPI", receiptNo: "HK-2026-007", description: "Q1 Apr-Jun 2026 Tuition Fee" },
]

const SEED_ANNOUNCEMENTS: Announcement[] = [
  { id: "a1", title: "Annual Day Celebration 2026", content: "We are thrilled to announce our Annual Day on June 15th! All children will participate in performances. Rehearsals begin June 10th. Parents are warmly invited to attend.", date: "2026-05-25", priority: "important", published: true, author: "Principal Sunita" },
  { id: "a2", title: "Summer Camp Registration Open", content: "Our exciting summer camp runs from June 20 to July 10. Activities include art, music, nature walks, and swimming. Limited seats available — register early!", date: "2026-05-20", priority: "normal", published: true, author: "Ms. Priya Kapoor" },
  { id: "a3", title: "Parent-Teacher Meeting", content: "PTM scheduled for June 20th (Saturday) from 10 AM to 1 PM. Individual slots will be shared via email. Please confirm your attendance.", date: "2026-05-18", priority: "important", published: true, author: "Principal Sunita" },
  { id: "a4", title: "School Closed — Republic Day", content: "The school will remain closed on January 26th for Republic Day celebrations. Happy Republic Day!", date: "2026-01-24", priority: "normal", published: true, author: "Admin Office" },
  { id: "a5", title: "New Library Books Added", content: "We have added 50+ new picture books and interactive learning materials to our library. Children can explore them during reading time.", date: "2026-05-15", priority: "normal", published: true, author: "Ms. Anita Desai" },
]

const SEED_EVENTS: SchoolEvent[] = [
  { id: "e1", title: "Annual Day Celebration", description: "A grand celebration featuring performances by all classes. Each child will showcase their talents in dance, drama, and music.", date: "2026-06-15", time: "10:00 AM", location: "School Auditorium", type: "cultural" },
  { id: "e2", title: "Parent-Teacher Meeting", description: "One-on-one sessions with class teachers to discuss your child's progress, strengths, and growth areas.", date: "2026-06-20", time: "10:00 AM", location: "Respective Classrooms", type: "meeting" },
  { id: "e3", title: "Summer Camp Begins", description: "Three weeks of exciting activities including art, music, swimming, nature walks, and creative workshops.", date: "2026-06-22", time: "9:00 AM", location: "School Campus", type: "academic" },
  { id: "e4", title: "Sports Day", description: "A fun-filled day of races, relay events, and team activities for all age groups. Parents welcome to cheer!", date: "2026-07-10", time: "8:30 AM", location: "School Ground", type: "sports" },
  { id: "e5", title: "Independence Day Celebration", description: "Flag hoisting ceremony followed by patriotic performances and activities.", date: "2026-08-15", time: "9:00 AM", location: "School Ground", type: "cultural" },
]

const SEED_NOTES: TeacherNote[] = [
  { id: "n1", studentId: "s1", teacherName: "Ms. Anita Desai", date: "2026-05-28", message: "Aanya did wonderfully in art class today! She created a beautiful painting of a garden with butterflies. Her creativity is blossoming!", category: "achievement" },
  { id: "n2", studentId: "s1", teacherName: "Ms. Anita Desai", date: "2026-05-26", message: "Please send a sun hat for outdoor play this week. We'll be spending more time in the garden.", category: "general" },
  { id: "n3", studentId: "s1", teacherName: "Ms. Anita Desai", date: "2026-05-22", message: "Aanya has been very helpful to her classmates during group activities. She's developing wonderful leadership qualities.", category: "behavior" },
  { id: "n4", studentId: "s1", teacherName: "Ms. Priya Kapoor", date: "2026-05-20", message: "Aanya participated enthusiastically in the music session. She has a great sense of rhythm!", category: "achievement" },
  { id: "n5", studentId: "s2", teacherName: "Ms. Priya Kapoor", date: "2026-05-27", message: "Arjun is settling in well. He made two new friends this week and is more confident during circle time.", category: "behavior" },
  { id: "n6", studentId: "s3", teacherName: "Ms. Anita Desai", date: "2026-05-28", message: "Riya has completed her phonics workbook ahead of schedule. She's ready for the next level!", category: "academic" },
]

// ── LocalStorage Getters/Setters ───────────────────────────────

function conditionallySeed() {
  // Demo seeding is disabled in production MVP
}

function getLocalStudents() {
  conditionallySeed()
  return get<Student[]>(K.students, [])
}
function getLocalAttendance(studentId?: string) {
  conditionallySeed()
  const records = get<AttendanceRecord[]>(K.attendance, [])
  return studentId ? records.filter((a) => a.studentId === studentId) : records
}
function getLocalFees(studentId?: string) {
  conditionallySeed()
  const records = get<FeeRecord[]>(K.fees, [])
  return studentId ? records.filter((f) => f.studentId === studentId) : records
}
function getLocalPayments(studentId?: string) {
  conditionallySeed()
  const records = get<Payment[]>(K.payments, [])
  return studentId ? records.filter((p) => p.studentId === studentId) : records
}
function getLocalAnnouncements() {
  conditionallySeed()
  return get<Announcement[]>(K.announcements, [])
}
function getLocalEvents() {
  conditionallySeed()
  return get<SchoolEvent[]>(K.events, [])
}
function getLocalNotes(studentId?: string) {
  conditionallySeed()
  const records = get<TeacherNote[]>(K.notes, [])
  return studentId ? records.filter((n) => n.studentId === studentId) : records
}

// ── Database Case Mappers ──────────────────────────────────────

function mapStudentFromDb(row: any): Student {
  return {
    id: row.id,
    name: row.name,
    age: row.age,
    dateOfBirth: row.date_of_birth,
    program: row.program,
    section: row.section,
    parentName: row.parent_name,
    parentEmail: row.parent_email,
    parentId: row.parent_id,
    parentPhone: row.parent_phone,
    admissionNo: row.admission_no,
    teacher: row.teacher,
    photo: row.photo || undefined,
  }
}

function mapStudentToDb(s: Omit<Student, "id"> | Partial<Student>): any {
  const row: any = {}
  if (s.name !== undefined) row.name = s.name
  if (s.age !== undefined) row.age = s.age
  if (s.dateOfBirth !== undefined) row.date_of_birth = s.dateOfBirth
  if (s.program !== undefined) row.program = s.program
  if (s.section !== undefined) row.section = s.section
  if (s.parentName !== undefined) row.parent_name = s.parentName
  if (s.parentEmail !== undefined) row.parent_email = s.parentEmail
  if (s.parentId !== undefined) row.parent_id = s.parentId
  if (s.parentPhone !== undefined) row.parent_phone = s.parentPhone
  if (s.admissionNo !== undefined) row.admission_no = s.admissionNo
  if (s.teacher !== undefined) row.teacher = s.teacher
  if (s.photo !== undefined) row.photo = s.photo
  return row
}

function mapAttendanceFromDb(row: any): AttendanceRecord {
  return {
    id: row.id,
    studentId: row.student_id,
    date: row.date,
    status: row.status,
  }
}

function mapFeeFromDb(row: any): FeeRecord {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name,
    term: row.term,
    amount: Number(row.amount),
    paidAmount: Number(row.paid_amount),
    dueDate: row.due_date,
    status: row.status,
    createdAt: row.created_at,
  }
}

function mapFeeToDb(f: Omit<FeeRecord, "id" | "createdAt"> | Partial<FeeRecord>): any {
  const row: any = {}
  if (f.studentId !== undefined) row.student_id = f.studentId
  if (f.studentName !== undefined) row.student_name = f.studentName
  if (f.term !== undefined) row.term = f.term
  if (f.amount !== undefined) row.amount = f.amount
  if (f.paidAmount !== undefined) row.paid_amount = f.paidAmount
  if (f.dueDate !== undefined) row.due_date = f.dueDate
  if (f.status !== undefined) row.status = f.status
  return row
}

function mapPaymentFromDb(row: any): Payment {
  return {
    id: row.id,
    feeId: row.fee_id,
    studentId: row.student_id,
    studentName: row.student_name,
    amount: Number(row.amount),
    date: row.date,
    method: row.method,
    receiptNo: row.receipt_no,
    description: row.description || "",
  }
}

function mapAnnouncementFromDb(row: any): Announcement {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    date: row.date,
    priority: row.priority,
    published: row.published,
    author: row.author,
  }
}

function mapAnnouncementToDb(a: Omit<Announcement, "id"> | Partial<Announcement>): any {
  const row: any = {}
  if (a.title !== undefined) row.title = a.title
  if (a.content !== undefined) row.content = a.content
  if (a.date !== undefined) row.date = a.date
  if (a.priority !== undefined) row.priority = a.priority
  if (a.published !== undefined) row.published = a.published
  if (a.author !== undefined) row.author = a.author
  return row
}

function mapEventFromDb(row: any): SchoolEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description || "",
    date: row.date,
    time: row.time,
    location: row.location,
    type: row.type,
  }
}

function mapNoteFromDb(row: any): TeacherNote {
  return {
    id: row.id,
    studentId: row.student_id,
    teacherName: row.teacher_name,
    date: row.date,
    message: row.message,
    category: row.category,
  }
}

// ── Principal Profile ──────────────────────────────────────────

export interface PrincipalProfile {
  name: string
  role: string
  bio: string
  photoUrl: string
  initial: string
}

export const DEFAULT_PRINCIPAL: PrincipalProfile = {
  name: "Ms. Sunita Mehta",
  role: "Founder & Principal",
  bio: "With over 20 years of experience in early childhood education, Ms. Sunita Mehta founded Tiny Mind Play School with a vision to create a warm, nurturing environment where every child feels safe, valued, and inspired to learn. She believes that the early years are the most formative and is dedicated to providing a Montessori-inspired curriculum that fosters curiosity, creativity, and confidence.",
  photoUrl: "",
  initial: "S",
}

export function getPrincipalProfile(): PrincipalProfile {
  if (typeof window === "undefined") return DEFAULT_PRINCIPAL
  try {
    const raw = localStorage.getItem("hk_principal")
    return raw ? JSON.parse(raw) : DEFAULT_PRINCIPAL
  } catch {
    return DEFAULT_PRINCIPAL
  }
}

export function updatePrincipalProfile(profile: PrincipalProfile): void {
  if (typeof window === "undefined") return
  localStorage.setItem("hk_principal", JSON.stringify(profile))
}



// ── Student CRUD ──────────────────────────────────────────────

export async function getStudents(): Promise<Student[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from("students").select("*").order("name")
      if (!error && data) return data.map(mapStudentFromDb)
      console.warn("Supabase fetch failed, fallback to local storage:", error)
    } catch (err) {
      console.error("Supabase error:", err)
    }
  }
  return getLocalStudents()
}

export async function getStudentsByParent(parentId: string, parentEmail: string): Promise<Student[]> {
  if (isSupabaseConfigured()) {
    try {
      const conditions: string[] = []
      if (parentId) conditions.push(`parent_id.eq.${parentId}`)
      const normalizedEmail = parentEmail?.trim().toLowerCase()
      if (normalizedEmail) conditions.push(`parent_email.eq.${normalizedEmail}`)
      
      if (conditions.length === 0) return []

      const { data, error } = await supabase
        .from("students")
        .select("*")
        .or(conditions.join(","))
        .order("name")
      
      if (!error && data) return data.map(mapStudentFromDb)
      console.warn("Supabase fetch failed, fallback to local storage:", error)
    } catch (err) {
      console.error("Supabase error:", err)
    }
  }
  const normalizedEmail = parentEmail?.trim().toLowerCase() || ""
  return getLocalStudents().filter(s => 
    (s.parentId && s.parentId === parentId) || 
    (s.parentEmail && s.parentEmail.trim().toLowerCase() === normalizedEmail)
  )
}

export async function getStudent(id: string): Promise<Student | undefined> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from("students").select("*").eq("id", id).maybeSingle()
      if (!error && data) return mapStudentFromDb(data)
      console.warn("Supabase fetch failed, fallback to local storage:", error)
    } catch (err) {
      console.error("Supabase error:", err)
    }
  }
  return getLocalStudents().find((s) => s.id === id)
}

export async function addStudent(
  data: Omit<Student, "id">
): Promise<{ student: Student; parentAccount: ParentAccountResult | null }> {
  let parentAccount: ParentAccountResult | null = null
  let student: Student

  // Step 1: Insert the student (with parent_email but no parent_id yet)
  if (isSupabaseConfigured()) {
    try {
      const dbRow = mapStudentToDb(data)
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", data: dbRow }),
      })
      const json = await res.json()
      if (res.ok && json.student) {
        student = mapStudentFromDb(json.student)
      } else {
        throw new Error(json.error || "Failed to add student")
      }
    } catch (err: any) {
      console.error("[addStudent] API error:", err?.message)
      throw err
    }

    // Step 2: Auto-provision parent account AFTER we have the real student.id
    if (data.parentEmail?.trim()) {
      parentAccount = await createParentAccount(
        data.parentEmail,
        data.parentName,
        student.id
      )

      // Step 3: Backlink parent_id into the student row
      if (parentAccount.userId) {
        try {
          await fetch("/api/students", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "update",
              id: student.id,
              data: { parent_id: parentAccount.userId },
            }),
          })
          student = { ...student, parentId: parentAccount.userId }
        } catch (err: any) {
          console.warn("[addStudent] parent_id backlink failed:", err?.message)
        }
      }
    }
  } else {
    // LocalStorage fallback
    const localStudents = getLocalStudents()
    student = { ...data, id: uid() }
    localStudents.push(student)
    set(K.students, localStudents)

    if (data.parentEmail?.trim()) {
      parentAccount = { email: data.parentEmail, created: false, skipped: true }
    }
  }

  return { student, parentAccount }
}

export async function updateStudent(id: string, data: Partial<Student>): Promise<void> {
  if (isSupabaseConfigured()) {
    const dbRow = mapStudentToDb(data)
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", id, data: dbRow }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || "Failed to update student")
    return
  }
  const students = getLocalStudents().map((s) => (s.id === id ? { ...s, ...data } : s))
  set(K.students, students)
}

export async function deleteStudent(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || "Failed to delete student")
    return
  }
  set(K.students, getLocalStudents().filter((s) => s.id !== id))
  set(K.attendance, getLocalAttendance().filter((a) => a.studentId !== id))
  set(K.fees, getLocalFees().filter((f) => f.studentId !== id))
  set(K.payments, getLocalPayments().filter((p) => p.studentId !== id))
  set(K.notes, getLocalNotes().filter((n) => n.studentId !== id))
}

// ── Attendance ────────────────────────────────────────────────

export async function getAttendance(studentId?: string): Promise<AttendanceRecord[]> {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from("attendance").select("*")
      if (studentId) {
        query = query.eq("student_id", studentId)
      }
      const { data, error } = await query.order("date")
      if (!error && data) return data.map(mapAttendanceFromDb)
      console.warn("Supabase fetch failed, fallback to local storage:", error)
    } catch (err) {
      console.error("Supabase error:", err)
    }
  }
  return getLocalAttendance(studentId)
}

export async function deleteAttendance(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.from("attendance").delete().eq("id", id)
    if (error) {
      console.error("Supabase delete attendance failed:", error)
      throw new Error(error.message)
    }
    return
  }
  const attendance = get<AttendanceRecord[]>(K.attendance, [])
  set(K.attendance, attendance.filter((a) => a.id !== id))
}

// ── Fees CRUD ─────────────────────────────────────────────────

export async function getFees(studentId?: string): Promise<FeeRecord[]> {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from("fees").select("*")
      if (studentId) {
        query = query.eq("student_id", studentId)
      }
      const { data, error } = await query.order("due_date")
      if (!error && data) return data.map(mapFeeFromDb)
      console.warn("Supabase fetch failed, fallback to local storage:", error)
    } catch (err) {
      console.error("Supabase error:", err)
    }
  }
  return getLocalFees(studentId)
}

export async function addFee(data: Omit<FeeRecord, "id" | "createdAt">): Promise<FeeRecord> {
  if (isSupabaseConfigured()) {
    try {
      const dbRow = mapFeeToDb(data)
      const { data: inserted, error } = await supabase.from("fees").insert([dbRow]).select().single()
      if (!error && inserted) return mapFeeFromDb(inserted)
      console.warn("Supabase insert failed, fallback to local storage:", error)
    } catch (err) {
      console.error("Supabase error:", err)
    }
  }
  const fees = getLocalFees()
  const fee: FeeRecord = { ...data, id: uid(), createdAt: new Date().toISOString().slice(0, 10) }
  fees.push(fee)
  set(K.fees, fees)
  return fee
}

/** Generates a collision-resistant receipt number using timestamp + random hex. */
function generateReceiptNo(): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `HK-${ts}-${rand}`
}

export async function markFeePaid(feeId: string, method: Payment["method"] = "Cash"): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      const { data: fee, error: fetchErr } = await supabase.from("fees").select("*").eq("id", feeId).single()
      if (!fetchErr && fee) {
        const remaining = Number(fee.amount) - Number(fee.paid_amount)
        const { error: updateErr } = await supabase.from("fees").update({ paid_amount: fee.amount, status: "paid" }).eq("id", feeId)

        if (!updateErr) {
          // Use collision-resistant receipt number — no row-count query needed
          const receiptNo = generateReceiptNo()

          await supabase.from("payments").insert([{
            fee_id: feeId,
            student_id: fee.student_id,
            student_name: fee.student_name,
            amount: remaining,
            method,
            receipt_no: receiptNo,
            description: `${fee.term} Tuition Fee`
          }])
          return
        }
      }
      console.warn("Supabase mark paid failed, fallback to local storage:", fetchErr)
    } catch (err) {
      console.error("Supabase error:", err)
    }
  }

  const fees = getLocalFees()
  const fee = fees.find((f) => f.id === feeId)
  if (!fee) return

  const remaining = fee.amount - fee.paidAmount
  fee.paidAmount = fee.amount
  fee.status = "paid"
  set(K.fees, fees)

  // Create payment record with collision-resistant receipt number
  const payment: Payment = {
    id: uid(),
    feeId,
    studentId: fee.studentId,
    studentName: fee.studentName,
    amount: remaining,
    date: new Date().toISOString().slice(0, 10),
    method,
    receiptNo: generateReceiptNo(),
    description: `${fee.term} Tuition Fee`,
  }
  const payments = getLocalPayments()
  payments.push(payment)
  set(K.payments, payments)
}

export async function deleteFee(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.from("fees").delete().eq("id", id)
    if (error) {
      console.error("Supabase delete fee failed:", error)
      throw new Error(error.message)
    }
    return
  }
  set(K.fees, getLocalFees().filter((f) => f.id !== id))
}

export async function updateFee(id: string, data: Partial<Pick<FeeRecord, "term" | "amount" | "dueDate">>): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      const dbRow: Record<string, unknown> = {}
      if (data.term !== undefined) dbRow.term = data.term
      if (data.amount !== undefined) dbRow.amount = data.amount
      if (data.dueDate !== undefined) dbRow.due_date = data.dueDate
      const { error } = await supabase.from("fees").update(dbRow).eq("id", id)
      if (!error) return
      console.warn("Supabase update failed, fallback to local storage:", error)
    } catch (err) {
      console.error("Supabase error:", err)
    }
  }
  const fees = getLocalFees().map((f) =>
    f.id === id
      ? {
          ...f,
          ...(data.term !== undefined ? { term: data.term } : {}),
          ...(data.amount !== undefined ? { amount: data.amount } : {}),
          ...(data.dueDate !== undefined ? { dueDate: data.dueDate } : {}),
        }
      : f
  )
  set(K.fees, fees)
}

// ── Payments ──────────────────────────────────────────────────

export async function getPayments(studentId?: string): Promise<Payment[]> {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from("payments").select("*")
      if (studentId) {
        query = query.eq("student_id", studentId)
      }
      const { data, error } = await query.order("date", { ascending: false })
      if (!error && data) return data.map(mapPaymentFromDb)
      console.warn("Supabase fetch failed, fallback to local storage:", error)
    } catch (err) {
      console.error("Supabase error:", err)
    }
  }
  return getLocalPayments(studentId)
}

// ── Announcements CRUD ────────────────────────────────────────

export async function getAnnouncements(limit?: number): Promise<Announcement[]> {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from("announcements").select("*").order("date", { ascending: false })
      if (limit) {
        query = query.limit(limit)
      }
      const { data, error } = await query
      if (!error && data) return data.map(mapAnnouncementFromDb)
      console.warn("Supabase fetch failed, fallback to local storage:", error)
    } catch (err) {
      console.error("Supabase error:", err)
    }
  }
  const local = getLocalAnnouncements()
  return limit ? local.slice(0, limit) : local
}

export async function getStudentsBrief(): Promise<{ id: string; program: string }[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from("students").select("id, program")
      if (!error && data) return data as { id: string; program: string }[]
      console.warn("Supabase brief fetch failed, fallback to local storage:", error)
    } catch (err) {
      console.error("Supabase error:", err)
    }
  }
  return getLocalStudents().map((s) => ({ id: s.id, program: s.program }))
}

export async function getFeesBrief(): Promise<{ amount: number; paidAmount: number }[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from("fees").select("amount, paid_amount")
      if (!error && data) {
        return data.map((f) => ({
          amount: Number(f.amount),
          paidAmount: Number(f.paid_amount),
        }))
      }
      console.warn("Supabase brief fetch failed, fallback to local storage:", error)
    } catch (err) {
      console.error("Supabase error:", err)
    }
  }
  return getLocalFees().map((f) => ({ amount: f.amount, paidAmount: f.paidAmount }))
}

export async function addAnnouncement(data: Omit<Announcement, "id">): Promise<Announcement> {
  if (isSupabaseConfigured()) {
    try {
      const dbRow = mapAnnouncementToDb(data)
      const { data: inserted, error } = await supabase.from("announcements").insert([dbRow]).select().single()
      if (!error && inserted) return mapAnnouncementFromDb(inserted)
      console.warn("Supabase insert failed, fallback to local storage:", error)
    } catch (err) {
      console.error("Supabase error:", err)
    }
  }
  const items = getLocalAnnouncements()
  const item: Announcement = { ...data, id: uid() }
  items.unshift(item)
  set(K.announcements, items)
  return item
}

export async function updateAnnouncement(id: string, data: Partial<Announcement>): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      const dbRow = mapAnnouncementToDb(data)
      const { error } = await supabase.from("announcements").update(dbRow).eq("id", id)
      if (!error) return
      console.warn("Supabase update failed, fallback to local storage:", error)
    } catch (err) {
      console.error("Supabase error:", err)
    }
  }
  const items = getLocalAnnouncements().map((a) => (a.id === id ? { ...a, ...data } : a))
  set(K.announcements, items)
}

export async function deleteAnnouncement(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.from("announcements").delete().eq("id", id)
    if (error) {
      console.error("Supabase delete announcement failed:", error)
      throw new Error(error.message)
    }
    return
  }
  set(K.announcements, getLocalAnnouncements().filter((a) => a.id !== id))
}

// ── Events ────────────────────────────────────────────────────

export async function getEvents(): Promise<SchoolEvent[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from("events").select("*").order("date")
      if (!error && data) return data.map(mapEventFromDb)
      console.warn("Supabase fetch failed, fallback to local storage:", error)
    } catch (err) {
      console.error("Supabase error:", err)
    }
  }
  return getLocalEvents()
}

// ── Teacher Notes ─────────────────────────────────────────────

export async function getNotes(studentId?: string): Promise<TeacherNote[]> {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from("notes").select("*")
      if (studentId) {
        query = query.eq("student_id", studentId)
      }
      const { data, error } = await query.order("date", { ascending: false })
      if (!error && data) return data.map(mapNoteFromDb)
      console.warn("Supabase fetch failed, fallback to local storage:", error)
    } catch (err) {
      console.error("Supabase error:", err)
    }
  }
  return getLocalNotes(studentId)
}

// ── Bulk Importers ─────────────────────────────────────────────

export async function bulkAddStudents(
  dataList: Omit<Student, "id">[]
): Promise<{ students: Student[]; parentAccounts: ParentAccountResult[] }> {
  if (dataList.length === 0) return { students: [], parentAccounts: [] }

  let insertedStudents: Student[] = []
  const parentAccounts: ParentAccountResult[] = []

  if (isSupabaseConfigured()) {
    // Step 1: Insert all students first (with parent_email, but without parent_id)
    try {
      const dbRows = dataList.map(mapStudentToDb)
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bulk", data: dbRows }),
      })
      const json = await res.json()
      if (res.ok && json.students) {
        insertedStudents = json.students.map(mapStudentFromDb)
      } else {
        throw new Error(json.error || "Bulk insert failed")
      }
    } catch (err: any) {
      console.error("[bulkAddStudents] API error:", err?.message)
      throw err
    }

    // Step 2: Provision parent accounts now that we have real student IDs
    // Deduplicate by email — multiple siblings share one parent account
    const seenEmails = new Map<string, string>() // email → parentUserId

    for (const student of insertedStudents) {
      const email = student.parentEmail?.trim().toLowerCase()
      if (!email || !email.includes("@")) continue

      if (!seenEmails.has(email)) {
        const result = await createParentAccount(student.parentEmail, student.parentName || "", student.id)
        parentAccounts.push(result)
        if (result.userId) seenEmails.set(email, result.userId)
      }

      // Step 3: Backlink parent_id into the student row
      const parentUserId = seenEmails.get(email)
      if (parentUserId) {
        try {
          await fetch("/api/students", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "update",
              id: student.id,
              data: { parent_id: parentUserId },
            }),
          })
        } catch (err: any) {
          console.warn(`[bulkAddStudents] parent_id backlink failed for ${student.id}:`, err?.message)
        }
      }
    }

    // Refresh the inserted students list to include the newly set parent_ids
    insertedStudents = insertedStudents.map((s) => {
      const email = s.parentEmail?.trim().toLowerCase()
      const parentUserId = email ? seenEmails.get(email) : undefined
      return parentUserId ? { ...s, parentId: parentUserId } : s
    })
  } else {
    // LocalStorage fallback
    const localStudents = getLocalStudents()
    insertedStudents = dataList.map((data) => ({ ...data, id: uid() }))
    localStudents.push(...insertedStudents)
    set(K.students, localStudents)
  }

  return { students: insertedStudents, parentAccounts }
}

export async function bulkAddFees(dataList: Omit<FeeRecord, "id" | "createdAt">[]): Promise<FeeRecord[]> {
  if (dataList.length === 0) return []

  if (isSupabaseConfigured()) {
    try {
      const dbRows = dataList.map(mapFeeToDb)
      const { data: inserted, error } = await supabase.from("fees").insert(dbRows).select()
      if (!error && inserted) {
        return inserted.map(mapFeeFromDb)
      }
      console.warn("Supabase bulk insert failed, fallback to local storage:", error)
    } catch (err) {
      console.error("Supabase bulk error:", err)
    }
  }

  const fees = getLocalFees()
  const createdAt = new Date().toISOString().slice(0, 10)
  const insertedFees: FeeRecord[] = dataList.map((data) => ({
    ...data,
    id: uid(),
    createdAt,
  }))
  fees.push(...insertedFees)
  set(K.fees, fees)
  return insertedFees
}

export async function bulkAddAttendance(dataList: Omit<AttendanceRecord, "id">[]): Promise<AttendanceRecord[]> {
  if (dataList.length === 0) return []

  if (isSupabaseConfigured()) {
    try {
      const dbRows = dataList.map((a) => ({
        student_id: a.studentId,
        date: a.date,
        status: a.status,
      }))
      const { data: inserted, error } = await supabase.from("attendance").insert(dbRows).select()
      if (!error && inserted) {
        return inserted.map(mapAttendanceFromDb)
      }
      console.warn("Supabase bulk insert failed, fallback to local storage:", error)
    } catch (err) {
      console.error("Supabase bulk error:", err)
    }
  }

  const list = get<AttendanceRecord[]>(K.attendance, [])
  const keysToAdd = new Set(dataList.map((a) => `${a.studentId}_${a.date}`))
  const filteredList = list.filter((item) => !keysToAdd.has(`${item.studentId}_${item.date}`))
  const newRecords: AttendanceRecord[] = dataList.map((a) => ({
    ...a,
    id: uid(),
  }))
  const updated = [...filteredList, ...newRecords]
  set(K.attendance, updated)
  return newRecords
}

export async function linkParentToStudent(studentId: string, parentEmail: string): Promise<boolean> {
  const email = parentEmail.trim().toLowerCase()
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ child_id: studentId })
        .eq("email", email)
      if (!error) return true
      console.warn("Supabase parent link failed, fallback to local storage:", error)
    } catch (err) {
      console.error("Supabase error:", err)
    }
  }


  return false
}

export async function addNote(data: Omit<TeacherNote, "id" | "date">): Promise<TeacherNote> {
  const date = new Date().toISOString().slice(0, 10)
  if (isSupabaseConfigured()) {
    try {
      const dbRow = {
        student_id: data.studentId,
        teacher_name: data.teacherName,
        date,
        message: data.message,
        category: data.category,
      }
      const { data: inserted, error } = await supabase.from("notes").insert([dbRow]).select().single()
      if (!error && inserted) return mapNoteFromDb(inserted)
      console.warn("Supabase insert note failed, fallback to local storage:", error)
    } catch (err) {
      console.error("Supabase error:", err)
    }
  }
  const notes = get<TeacherNote[]>(K.notes, [])
  const note: TeacherNote = { ...data, id: uid(), date }
  notes.unshift(note)
  set(K.notes, notes)
  return note
}

export async function deleteNote(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from("notes").delete().eq("id", id)
      if (!error) return
      console.warn("Supabase delete note failed, fallback to local storage:", error)
    } catch (err) {
      console.error("Supabase error:", err)
    }
  }
  const notes = get<TeacherNote[]>(K.notes, [])
  set(K.notes, notes.filter((n) => n.id !== id))
}

