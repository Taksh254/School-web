import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase service role not configured")
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/**
 * Resolves current user and role from request cookies
 */
async function getAuthContext(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return { user: null, role: null, teacherRecord: null }
  }

  try {
    const supabaseResponse = NextResponse.next({ request })
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    })

    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return { user: null, role: null, teacherRecord: null }

    const admin = getAdminClient()
    const { data: profile } = await admin
      .from("profiles")
      .select("id, email, name, role")
      .eq("id", user.id)
      .maybeSingle()

    let role = profile?.role || "parent"
    const email = user.email?.trim().toLowerCase() || profile?.email?.trim().toLowerCase() || ""

    if (role !== "admin") {
      // Check teachers table or teacher domain
      const { data: t } = await admin
        .from("teachers")
        .select("id, teacher_id, full_name, email, department, designation")
        .ilike("email", email)
        .maybeSingle()

      if (t || email.includes("@tinymind.com") || user.user_metadata?.role === "teacher") {
        role = "teacher"
      }
    }

    // If teacher, find corresponding record in teachers table
    let teacherRecord: any = null
    if (role === "teacher" || role === "admin") {
      const { data: t } = await admin
        .from("teachers")
        .select("id, teacher_id, full_name, email, department, designation")
        .ilike("email", email)
        .maybeSingle()

      teacherRecord = t || null
    }

    return { user, profile, role, teacherRecord }
  } catch (err) {
    console.error("[teacher-attendance/auth] Error:", err)
    return { user: null, role: null, teacherRecord: null }
  }
}

/**
 * GET /api/teacher-attendance?date=YYYY-MM-DD[&teacherId=UUID]
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date") || new Date().toISOString().slice(0, 10)
    const requestedTeacherId = searchParams.get("teacherId")

    const auth = await getAuthContext(request)
    if (!auth.user || (auth.role !== "teacher" && auth.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized: Teacher or Admin access required." }, { status: 401 })
    }

    const admin = getAdminClient()

    let targetTeacherId: string | null = null
    let targetTeacherName: string | null = null

    if (auth.role === "admin" && requestedTeacherId) {
      targetTeacherId = requestedTeacherId
      const { data: t } = await admin.from("teachers").select("id, full_name").eq("id", requestedTeacherId).maybeSingle()
      targetTeacherName = t?.full_name || null
    } else if (auth.role === "teacher") {
      targetTeacherId = auth.teacherRecord?.id || null
      targetTeacherName = auth.teacherRecord?.full_name || auth.profile?.name || null
    }

    // Query students
    let studentsQuery = admin
      .from("students")
      .select("id, name, age, date_of_birth, program, section, admission_no, teacher, teacher_id, photo")
      .order("name")

    if (auth.role === "teacher") {
      if (targetTeacherId && targetTeacherName) {
        studentsQuery = studentsQuery.or(`teacher_id.eq.${targetTeacherId},teacher.ilike.%${targetTeacherName}%`)
      } else if (targetTeacherId) {
        studentsQuery = studentsQuery.eq("teacher_id", targetTeacherId)
      } else if (targetTeacherName) {
        studentsQuery = studentsQuery.ilike("teacher", `%${targetTeacherName}%`)
      }
    } else if (auth.role === "admin" && targetTeacherId) {
      if (targetTeacherName) {
        studentsQuery = studentsQuery.or(`teacher_id.eq.${targetTeacherId},teacher.ilike.%${targetTeacherName}%`)
      } else {
        studentsQuery = studentsQuery.eq("teacher_id", targetTeacherId)
      }
    }

    let studentsData: any[] = []
    const { data: students, error: studentErr } = await studentsQuery
    if (studentErr) {
      // Fallback if teacher_id column is not yet present
      const { data: fallbackStudents, error: fallbackErr } = await admin
        .from("students")
        .select("id, name, age, date_of_birth, program, section, admission_no, teacher, photo")
        .order("name")

      if (fallbackErr) {
        return NextResponse.json({ error: fallbackErr.message }, { status: 500 })
      }
      const filtered = (fallbackStudents || []).filter(
        (s: any) => targetTeacherName && s.teacher && s.teacher.toLowerCase().includes(targetTeacherName.toLowerCase())
      )
      studentsData = filtered.length > 0 ? filtered : (fallbackStudents || [])
    } else {
      studentsData = students || []
    }

    if (studentsData.length === 0) {
      const { data: allStudents } = await admin
        .from("students")
        .select("id, name, age, date_of_birth, program, section, admission_no, teacher, photo")
        .order("name")
      if (allStudents && allStudents.length > 0) {
        studentsData = allStudents
      }
    }

    const studentIds = studentsData.map((s) => s.id)

    // Fetch existing attendance for these students on this date
    let attendanceMap: Record<string, any> = {}
    if (studentIds.length > 0) {
      const { data: attData, error: attErr } = await admin
        .from("attendance")
        .select("id, student_id, date, status, teacher_id, created_at, updated_at")
        .eq("date", date)
        .in("student_id", studentIds)

      if (!attErr && attData) {
        attData.forEach((a) => {
          attendanceMap[a.student_id] = a
        })
      }
    }

    return NextResponse.json({
      date,
      teacher: auth.teacherRecord || { id: targetTeacherId, full_name: targetTeacherName },
      students: studentsData,
      attendance: attendanceMap,
    })
  } catch (err: any) {
    console.error("[teacher-attendance/GET] Error:", err)
    return NextResponse.json({ error: err?.message || "Failed to fetch attendance data" }, { status: 500 })
  }
}

/**
 * POST /api/teacher-attendance
 * Body: {
 *   date: "YYYY-MM-DD",
 *   records: [ { studentId: "uuid", status: "present" | "absent" | "leave" } ]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request)
    if (!auth.user || (auth.role !== "teacher" && auth.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized: Teacher or Admin access required." }, { status: 401 })
    }

    const body = await request.json()
    const { date, records } = body as {
      date: string
      records: { studentId: string; status: "present" | "absent" | "leave" | "holiday" }[]
    }

    if (!date || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: "Date and a non-empty records array are required." }, { status: 400 })
    }

    // Validate date format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Invalid date format. Expected YYYY-MM-DD." }, { status: 400 })
    }

    const admin = getAdminClient()
    const teacherId = auth.teacherRecord?.id || null

    // If teacher, verify that all student IDs belong to this teacher
    if (auth.role === "teacher") {
      const teacherName = auth.teacherRecord?.full_name || auth.profile?.name || ""
      const studentIds = records.map((r) => r.studentId)

      let verifyQuery = admin
        .from("students")
        .select("id")
        .in("id", studentIds)

      if (teacherId && teacherName) {
        verifyQuery = verifyQuery.or(`teacher_id.eq.${teacherId},teacher.ilike.%${teacherName}%`)
      } else if (teacherId) {
        verifyQuery = verifyQuery.eq("teacher_id", teacherId)
      } else if (teacherName) {
        verifyQuery = verifyQuery.ilike("teacher", `%${teacherName}%`)
      }

      const { data: allowedStudents, error: verifyErr } = await verifyQuery
      if (verifyErr) {
        return NextResponse.json({ error: "Failed to verify student assignments." }, { status: 500 })
      }

      const allowedSet = new Set((allowedStudents || []).map((s) => s.id))
      const unauthorizedIds = studentIds.filter((id) => !allowedSet.has(id))

      if (unauthorizedIds.length > 0) {
        return NextResponse.json(
          { error: "Unauthorized: You can only submit attendance for students assigned to your class." },
          { status: 403 }
        )
      }
    }

    const validStatuses = new Set(["present", "absent", "leave", "holiday"])
    const rowsToUpsert = records.map((r) => {
      const status = validStatuses.has(r.status) ? r.status : "present"
      return {
        student_id: r.studentId,
        date: date,
        status: status,
        teacher_id: teacherId,
        updated_at: new Date().toISOString(),
      }
    })

    // Upsert into Supabase attendance table with conflict resolution on (student_id, date)
    let { data: upserted, error: upsertErr } = await admin
      .from("attendance")
      .upsert(rowsToUpsert, { onConflict: "student_id,date" })
      .select()

    if (upsertErr) {
      // Fallback without teacher_id / updated_at
      const simpleRows = records.map((r) => ({
        student_id: r.studentId,
        date: date,
        status: validStatuses.has(r.status) ? r.status : "present",
      }))
      const fallbackResult = await admin
        .from("attendance")
        .upsert(simpleRows, { onConflict: "student_id,date" })
        .select()

      if (fallbackResult.error) {
        console.error("[teacher-attendance/POST] Upsert error:", fallbackResult.error)
        return NextResponse.json({ error: "Failed to save attendance: " + fallbackResult.error.message }, { status: 500 })
      }
      upserted = fallbackResult.data
    }

    return NextResponse.json({
      success: true,
      count: upserted?.length || rowsToUpsert.length,
      message: "Attendance saved successfully ✓",
      date,
    })
  } catch (err: any) {
    console.error("[teacher-attendance/POST] Unexpected error:", err)
    return NextResponse.json(
      { error: "We couldn't save attendance. Please check your connection and try again." },
      { status: 500 }
    )
  }
}
