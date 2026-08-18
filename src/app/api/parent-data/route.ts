import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const COOKIE_NAME = "parent_session"

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase service role not configured")
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

interface ParentSessionPayload {
  studentId: string
  admissionNo: string
  parentName: string
  role: "parent"
  mustChangePassword: boolean
}

function mapStudentFromDb(row: any) {
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

function mapAttendanceFromDb(row: any) {
  return {
    id: row.id,
    studentId: row.student_id,
    date: row.date,
    status: row.status,
  }
}

function mapFeeFromDb(row: any) {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name,
    term: row.term,
    amount: Number(row.amount),
    paidAmount: Number(row.paid_amount),
    dueDate: row.due_date,
    status: row.status,
    createdAt: row.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
  }
}

function mapPaymentFromDb(row: any) {
  return {
    id: row.id,
    feeId: row.fee_id,
    studentId: row.student_id,
    studentName: row.student_name,
    amount: Number(row.amount),
    date: row.date,
    method: row.method,
    receiptNo: row.receipt_no,
    description: row.description,
  }
}

function mapNoteFromDb(row: any) {
  return {
    id: row.id,
    studentId: row.student_id,
    teacherName: row.teacher_name,
    date: row.date,
    message: row.message,
    category: row.category,
  }
}

function mapAnnouncementFromDb(row: any) {
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

function mapEventFromDb(row: any) {
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

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value
    if (!token || !JWT_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let session: ParentSessionPayload
    try {
      session = jwt.verify(token, JWT_SECRET) as ParentSessionPayload
    } catch {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    if (session.role !== "parent" || (!session.studentId && !session.admissionNo)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const admin = getAdminClient()

    // Resolve student record exclusively from the server-verified session
    let student: any = null
    if (session.studentId) {
      const { data, error } = await admin
        .from("students")
        .select("*")
        .eq("id", session.studentId)
        .maybeSingle()
      if (!error && data) student = data
    }

    if (!student && session.admissionNo) {
      const { data, error } = await admin
        .from("students")
        .select("*")
        .ilike("admission_no", session.admissionNo.trim())
        .maybeSingle()
      if (!error && data) student = data
    }

    if (!student) {
      return NextResponse.json({ error: "Student record not found" }, { status: 404 })
    }

    const studentId = student.id
    const type = request.nextUrl.searchParams.get("type") || "dashboard"

    // Safe diagnostic log (never exposes secrets/passwords)
    console.log(`[parent-data] Serving data type="${type}" for studentId="${studentId}" admissionNo="${student.admission_no}"`)

    const mappedStudent = mapStudentFromDb(student)

    if (type === "student") {
      return NextResponse.json({ student: mappedStudent })
    }

    if (type === "attendance") {
      const { data: attendanceData, error: attError } = await admin
        .from("attendance")
        .select("*")
        .eq("student_id", studentId)
        .order("date", { ascending: false })

      return NextResponse.json({
        student: mappedStudent,
        attendance: (attendanceData || []).map(mapAttendanceFromDb),
      })
    }

    if (type === "fees") {
      const [{ data: feesData }, { data: paymentsData }] = await Promise.all([
        admin.from("fees").select("*").eq("student_id", studentId).order("due_date", { ascending: true }),
        admin.from("payments").select("*").eq("student_id", studentId).order("date", { ascending: false }),
      ])

      return NextResponse.json({
        student: mappedStudent,
        fees: (feesData || []).map(mapFeeFromDb),
        payments: (paymentsData || []).map(mapPaymentFromDb),
      })
    }

    if (type === "notes") {
      const { data: notesData } = await admin
        .from("notes")
        .select("*")
        .eq("student_id", studentId)
        .order("date", { ascending: false })

      return NextResponse.json({
        student: mappedStudent,
        notes: (notesData || []).map(mapNoteFromDb),
      })
    }

    if (type === "announcements") {
      const { data } = await admin
        .from("announcements")
        .select("*")
        .eq("published", true)
        .order("date", { ascending: false })

      return NextResponse.json({
        announcements: (data || []).map(mapAnnouncementFromDb),
      })
    }

    if (type === "events") {
      const { data } = await admin
        .from("events")
        .select("*")
        .order("date", { ascending: true })

      return NextResponse.json({
        events: (data || []).map(mapEventFromDb),
      })
    }

    // Default: Dashboard full bundle
    const [
      { data: attendanceData },
      { data: feesData },
      { data: notesData },
      { data: announcementsData },
      { data: eventsData },
    ] = await Promise.all([
      admin.from("attendance").select("*").eq("student_id", studentId).order("date", { ascending: false }),
      admin.from("fees").select("*").eq("student_id", studentId).order("due_date", { ascending: true }),
      admin.from("notes").select("*").eq("student_id", studentId).order("date", { ascending: false }),
      admin.from("announcements").select("*").eq("published", true).order("date", { ascending: false }),
      admin.from("events").select("*").order("date", { ascending: true }),
    ])

    return NextResponse.json({
      student: mappedStudent,
      attendance: (attendanceData || []).map(mapAttendanceFromDb),
      fees: (feesData || []).map(mapFeeFromDb),
      notes: (notesData || []).map(mapNoteFromDb),
      announcements: (announcementsData || []).map(mapAnnouncementFromDb),
      events: (eventsData || []).map(mapEventFromDb),
    })
  } catch (err: any) {
    console.error("[parent-data] Error fetching parent data:", err?.message)
    return NextResponse.json({ error: "Failed to load parent data" }, { status: 500 })
  }
}
