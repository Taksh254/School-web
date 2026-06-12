import type {
  Student,
  AttendanceRecord,
  FeeRecord,
  Payment,
  Announcement,
  SchoolEvent,
  TeacherNote,
  User,
} from "./types"
import { supabase, isSupabaseConfigured } from "./supabase"

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

// ── Demo Users ────────────────────────────────────────────────

export const DEMO_USERS: User[] = [
  { id: "u1", email: "admin@school.com", name: "Principal Sunita", role: "admin" },
  { id: "u2", email: "parent@school.com", name: "Priya Sharma", role: "parent", childId: "s1" },
]

// ── Seed Data ─────────────────────────────────────────────────

const SEED_STUDENTS: Student[] = [
  { id: "s1", name: "Aanya Sharma", age: 4, dateOfBirth: "2022-03-15", program: "Nursery", section: "A", parentName: "Priya Sharma", parentEmail: "priya@email.com", parentPhone: "+91 98765 43210", admissionNo: "ADM-001", teacher: "Ms. Anita Desai" },
  { id: "s2", name: "Arjun Verma", age: 3, dateOfBirth: "2023-06-22", program: "Play Group", section: "A", parentName: "Rohit Verma", parentEmail: "rohit@email.com", parentPhone: "+91 98765 43211", admissionNo: "ADM-002", teacher: "Ms. Priya Kapoor" },
  { id: "s3", name: "Riya Kapoor", age: 5, dateOfBirth: "2021-01-10", program: "Kindergarten", section: "A", parentName: "Neha Kapoor", parentEmail: "neha@email.com", parentPhone: "+91 98765 43212", admissionNo: "ADM-003", teacher: "Ms. Anita Desai" },
  { id: "s4", name: "Kabir Singh", age: 3, dateOfBirth: "2023-09-05", program: "Play Group", section: "B", parentName: "Rohit Verma", parentEmail: "rohit@email.com", parentPhone: "+91 98765 43213", admissionNo: "ADM-004", teacher: "Ms. Priya Kapoor" },
  { id: "s5", name: "Myra Gupta", age: 4, dateOfBirth: "2022-11-18", program: "Nursery", section: "B", parentName: "Ankit Gupta", parentEmail: "ankit@email.com", parentPhone: "+91 98765 43214", admissionNo: "ADM-005", teacher: "Ms. Anita Desai" },
  { id: "s6", name: "Vivaan Mehta", age: 5, dateOfBirth: "2021-07-30", program: "Kindergarten", section: "B", parentName: "Rohan Mehta", parentEmail: "rohan@email.com", parentPhone: "+91 98765 43215", admissionNo: "ADM-006", teacher: "Mr. Rohan Joshi" },
  { id: "s7", name: "Ishaan Reddy", age: 2, dateOfBirth: "2024-02-14", program: "Play Group", section: "A", parentName: "Srinivas Reddy", parentEmail: "srinivas@email.com", parentPhone: "+91 98765 43216", admissionNo: "ADM-007", teacher: "Ms. Priya Kapoor" },
  { id: "s8", name: "Anvi Patel", age: 4, dateOfBirth: "2022-05-20", program: "Nursery", section: "A", parentName: "Raj Patel", parentEmail: "raj@email.com", parentPhone: "+91 98765 43217", admissionNo: "ADM-008", teacher: "Ms. Anita Desai" },
]

function generateAttendance(): AttendanceRecord[] {
  const records: AttendanceRecord[] = []
  const year = 2026
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

function getLocalStudents() { return get<Student[]>(K.students, []) }
function getLocalAttendance(studentId?: string) {
  const records = get<AttendanceRecord[]>(K.attendance, [])
  return studentId ? records.filter((a) => a.studentId === studentId) : records
}
function getLocalFees(studentId?: string) {
  const records = get<FeeRecord[]>(K.fees, [])
  return studentId ? records.filter((f) => f.studentId === studentId) : records
}
function getLocalPayments(studentId?: string) {
  const records = get<Payment[]>(K.payments, [])
  return studentId ? records.filter((p) => p.studentId === studentId) : records
}
function getLocalAnnouncements() { return get<Announcement[]>(K.announcements, []) }
function getLocalEvents() { return get<SchoolEvent[]>(K.events, []) }
function getLocalNotes(studentId?: string) {
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

export function seedIfNeeded() {
  if (typeof window === "undefined") return
  if (localStorage.getItem(K.seeded)) return

  set(K.students, SEED_STUDENTS)
  set(K.attendance, generateAttendance())
  set(K.fees, SEED_FEES)
  set(K.payments, SEED_PAYMENTS)
  set(K.announcements, SEED_ANNOUNCEMENTS)
  set(K.events, SEED_EVENTS)
  set(K.notes, SEED_NOTES)
  localStorage.setItem(K.seeded, "1")
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

export async function addStudent(data: Omit<Student, "id">): Promise<Student> {
  if (isSupabaseConfigured()) {
    try {
      const dbRow = mapStudentToDb(data)
      const { data: inserted, error } = await supabase.from("students").insert([dbRow]).select().single()
      if (!error && inserted) return mapStudentFromDb(inserted)
      console.warn("Supabase insert failed, fallback to local storage:", error)
    } catch (err) {
      console.error("Supabase error:", err)
    }
  }
  const students = getLocalStudents()
  const student: Student = { ...data, id: uid() }
  students.push(student)
  set(K.students, students)
  return student
}

export async function updateStudent(id: string, data: Partial<Student>): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      const dbRow = mapStudentToDb(data)
      const { error } = await supabase.from("students").update(dbRow).eq("id", id)
      if (!error) return
      console.warn("Supabase update failed, fallback to local storage:", error)
    } catch (err) {
      console.error("Supabase error:", err)
    }
  }
  const students = getLocalStudents().map((s) => (s.id === id ? { ...s, ...data } : s))
  set(K.students, students)
}

export async function deleteStudent(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from("students").delete().eq("id", id)
      if (!error) return
      console.warn("Supabase delete failed, fallback to local storage:", error)
    } catch (err) {
      console.error("Supabase error:", err)
    }
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

export async function markFeePaid(feeId: string, method: Payment["method"] = "Cash"): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      const { data: fee, error: fetchErr } = await supabase.from("fees").select("*").eq("id", feeId).single()
      if (!fetchErr && fee) {
        const remaining = Number(fee.amount) - Number(fee.paid_amount)
        const { error: updateErr } = await supabase.from("fees").update({ paid_amount: fee.amount, status: "paid" }).eq("id", feeId)
        
        if (!updateErr) {
          // Add payment row
          const { data: paymentsList } = await supabase.from("payments").select("id")
          const count = paymentsList ? paymentsList.length : 0
          const receiptNo = `HK-2026-${String(count + 1).padStart(3, "0")}-${Math.floor(1000 + Math.random() * 9000)}`
          
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

  // Create payment record
  const payment: Payment = {
    id: uid(),
    feeId,
    studentId: fee.studentId,
    studentName: fee.studentName,
    amount: remaining,
    date: new Date().toISOString().slice(0, 10),
    method,
    receiptNo: `HK-2026-${String(getLocalPayments().length + 1).padStart(3, "0")}-${Math.floor(1000 + Math.random() * 9000)}`,
    description: `${fee.term} Tuition Fee`,
  }
  const payments = getLocalPayments()
  payments.push(payment)
  set(K.payments, payments)
}

export async function deleteFee(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from("fees").delete().eq("id", id)
      if (!error) return
      console.warn("Supabase delete failed, fallback to local storage:", error)
    } catch (err) {
      console.error("Supabase error:", err)
    }
  }
  set(K.fees, getLocalFees().filter((f) => f.id !== id))
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

export async function getAnnouncements(): Promise<Announcement[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from("announcements").select("*").order("date", { ascending: false })
      if (!error && data) return data.map(mapAnnouncementFromDb)
      console.warn("Supabase fetch failed, fallback to local storage:", error)
    } catch (err) {
      console.error("Supabase error:", err)
    }
  }
  return getLocalAnnouncements()
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
    try {
      const { error } = await supabase.from("announcements").delete().eq("id", id)
      if (!error) return
      console.warn("Supabase delete failed, fallback to local storage:", error)
    } catch (err) {
      console.error("Supabase error:", err)
    }
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

export async function bulkAddStudents(dataList: Omit<Student, "id">[]): Promise<Student[]> {
  if (dataList.length === 0) return []

  if (isSupabaseConfigured()) {
    try {
      const dbRows = dataList.map(mapStudentToDb)
      const { data: inserted, error } = await supabase.from("students").insert(dbRows).select()
      if (!error && inserted) {
        return inserted.map(mapStudentFromDb)
      }
      console.warn("Supabase bulk insert failed, fallback to local storage:", error)
    } catch (err) {
      console.error("Supabase bulk error:", err)
    }
  }

  const students = getLocalStudents()
  const insertedStudents: Student[] = dataList.map((data) => ({
    ...data,
    id: uid(),
  }))
  students.push(...insertedStudents)
  set(K.students, students)
  return insertedStudents
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

  // Fallback to local storage (demo mode)
  const matchedDemo = DEMO_USERS.find(u => u.email === email)
  if (matchedDemo) {
    matchedDemo.childId = studentId
    if (typeof window !== "undefined") {
      const rawUser = localStorage.getItem("hk_user")
      if (rawUser) {
        const currentUser = JSON.parse(rawUser)
        if (currentUser.email === email) {
          currentUser.childId = studentId
          localStorage.setItem("hk_user", JSON.stringify(currentUser))
        }
      }
    }
    return true
  }

  if (typeof window !== "undefined") {
    const existing = localStorage.getItem("hk_registered_users")
    if (existing) {
      const users: User[] = JSON.parse(existing)
      const userIdx = users.findIndex(u => u.email === email)
      if (userIdx > -1) {
        users[userIdx].childId = studentId
        localStorage.setItem("hk_registered_users", JSON.stringify(users))
        const rawUser = localStorage.getItem("hk_user")
        if (rawUser) {
          const currentUser = JSON.parse(rawUser)
          if (currentUser.email === email) {
            currentUser.childId = studentId
            localStorage.setItem("hk_user", JSON.stringify(currentUser))
          }
        }
        return true
      }
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

