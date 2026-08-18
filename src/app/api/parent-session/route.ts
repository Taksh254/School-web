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

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value
    if (!token || !JWT_SECRET) {
      return NextResponse.json({ authenticated: false, user: null, student: null })
    }

    let payload: ParentSessionPayload
    try {
      payload = jwt.verify(token, JWT_SECRET) as ParentSessionPayload
    } catch {
      return NextResponse.json({ authenticated: false, user: null, student: null })
    }

    if (payload.role !== "parent" || (!payload.studentId && !payload.admissionNo)) {
      return NextResponse.json({ authenticated: false, user: null, student: null })
    }

    const admin = getAdminClient()

    // Look up student by studentId or admissionNo
    let student: any = null

    if (payload.studentId) {
      const { data, error } = await admin
        .from("students")
        .select("id, name, age, date_of_birth, program, section, parent_name, parent_email, parent_phone, admission_no, teacher, photo")
        .eq("id", payload.studentId)
        .maybeSingle()

      if (!error && data) {
        student = data
      }
    }

    if (!student && payload.admissionNo) {
      const { data, error } = await admin
        .from("students")
        .select("id, name, age, date_of_birth, program, section, parent_name, parent_email, parent_phone, admission_no, teacher, photo")
        .ilike("admission_no", payload.admissionNo.trim())
        .maybeSingle()

      if (!error && data) {
        student = data
      }
    }

    if (!student) {
      console.warn(`[parent-session] No student record matched session: admissionNo=${payload.admissionNo}`)
      return NextResponse.json({ authenticated: false, user: null, student: null })
    }

    const mappedStudent = {
      id: student.id,
      name: student.name,
      age: student.age,
      dateOfBirth: student.date_of_birth,
      program: student.program,
      section: student.section,
      parentName: student.parent_name,
      parentEmail: student.parent_email,
      parentPhone: student.parent_phone,
      admissionNo: student.admission_no,
      teacher: student.teacher,
      photo: student.photo || undefined,
    }

    const user = {
      id: student.id,
      name: student.parent_name || `${student.name}'s Parent`,
      email: student.parent_email || "",
      role: "parent" as const,
      childId: student.id,
      admissionNo: student.admission_no,
    }

    return NextResponse.json({
      authenticated: true,
      user,
      student: mappedStudent,
      mustChangePassword: payload.mustChangePassword,
    })
  } catch (err: any) {
    console.error("[parent-session] Error resolving parent session:", err?.message)
    return NextResponse.json({ authenticated: false, user: null, student: null }, { status: 500 })
  }
}
