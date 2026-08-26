"use server"

import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import type {
  Student,
  StudentDevelopment,
  ClassActivity,
  HomeActivity,
  TeacherLeave,
  Announcement,
  SchoolEvent,
  Teacher,
  TeacherNote,
  AttendanceRecord,
} from "@/lib/types"

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase service role not configured")
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/**
 * Validates authenticated teacher or admin user on the server.
 * Returns teacher metadata and verifies teacher permissions.
 */
export async function getTeacherContext() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    return { authorized: false, user: null, teacher: null, error: "Database not configured" }
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {}
      },
    },
  })

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return { authorized: false, user: null, teacher: null, error: "Not authenticated" }
  }

  const admin = getAdminClient()
  const email = user.email?.trim().toLowerCase() || ""

  // Check profile role
  const { data: profile } = await admin
    .from("profiles")
    .select("id, email, name, role")
    .eq("id", user.id)
    .maybeSingle()

  let role = profile?.role || "parent"
  if (role !== "admin") {
    // Check if in teachers table or matches teacher domain
    const { data: t } = await admin
      .from("teachers")
      .select("id, teacher_id, full_name, email, department, designation, phone, address, qualification, experience, photo, joining_date, employment_type, status")
      .ilike("email", email)
      .maybeSingle()

    if (t || email.includes("@tinymind.com") || user.user_metadata?.role === "teacher") {
      role = "teacher"
    }
  }

  if (role !== "teacher" && role !== "admin") {
    return { authorized: false, user, teacher: null, error: "Unauthorized: Teacher access required." }
  }

  // Fetch teacher record
  let teacherRecord: any = null
  const { data: tData } = await admin
    .from("teachers")
    .select("id, teacher_id, full_name, email, department, designation, phone, address, qualification, experience, photo, joining_date, employment_type, status")
    .ilike("email", email)
    .maybeSingle()

  if (tData) {
    teacherRecord = tData
  } else {
    teacherRecord = {
      id: user.id,
      teacher_id: "TCH-000",
      full_name: profile?.name || user.user_metadata?.full_name || email.split("@")[0],
      email: email,
      department: "Primary",
      designation: "Class Teacher",
    }
  }

  return {
    authorized: true,
    user,
    role,
    teacher: teacherRecord,
    error: null,
  }
}

// ── 1. MY STUDENTS ─────────────────────────────────────────────

export async function getTeacherAssignedStudents(): Promise<{ students: Student[]; teacher: any; error?: string }> {
  const ctx = await getTeacherContext()
  if (!ctx.authorized || !ctx.teacher) {
    return { students: [], teacher: null, error: ctx.error || "Unauthorized" }
  }

  const admin = getAdminClient()
  const teacherId = ctx.teacher.id
  const teacherName = ctx.teacher.full_name || ""

  let studentsQuery = admin
    .from("students")
    .select("id, name, age, date_of_birth, program, section, admission_no, parent_name, parent_email, parent_phone, teacher, teacher_id, photo")
    .order("name")

  if (ctx.role === "teacher") {
    if (teacherId && teacherName) {
      studentsQuery = studentsQuery.or(`teacher_id.eq.${teacherId},teacher.ilike.%${teacherName}%`)
    } else if (teacherId) {
      studentsQuery = studentsQuery.eq("teacher_id", teacherId)
    } else if (teacherName) {
      studentsQuery = studentsQuery.ilike("teacher", `%${teacherName}%`)
    }
  }

  let rawStudents: any[] = []
  const { data: students, error } = await studentsQuery
  if (error) {
    // Fallback if teacher_id column is missing
    const { data: fallback, error: fbErr } = await admin
      .from("students")
      .select("id, name, age, date_of_birth, program, section, admission_no, parent_name, parent_email, parent_phone, teacher, photo")
      .order("name")
    if (fbErr) return { students: [], teacher: ctx.teacher, error: fbErr.message }
    const filtered = (fallback || []).filter(
      (s: any) => s.teacher && teacherName && s.teacher.toLowerCase().includes(teacherName.toLowerCase())
    )
    rawStudents = filtered.length > 0 ? filtered : (fallback || [])
  } else {
    rawStudents = students || []
  }

  if (rawStudents.length === 0) {
    const { data: allStuds } = await admin
      .from("students")
      .select("id, name, age, date_of_birth, program, section, admission_no, parent_name, parent_email, parent_phone, teacher, photo")
      .order("name")
    if (allStuds && allStuds.length > 0) {
      rawStudents = allStuds
    }
  }

  const mapped: Student[] = rawStudents.map((s: any) => ({
    id: s.id,
    name: s.name,
    age: s.age || 0,
    dateOfBirth: s.date_of_birth || "",
    program: s.program,
    section: s.section || "A",
    parentName: s.parent_name || "",
    parentEmail: s.parent_email || "",
    parentPhone: s.parent_phone || "",
    admissionNo: s.admission_no,
    teacher: s.teacher || "",
    teacherId: s.teacher_id,
    photo: s.photo,
  }))

  return { students: mapped, teacher: ctx.teacher }
}

export async function getStudentFullDetails(studentId: string) {
  const ctx = await getTeacherContext()
  if (!ctx.authorized || !ctx.teacher) {
    return { error: "Unauthorized" }
  }

  const admin = getAdminClient()

  // Verify student exists and belongs to this teacher
  const { data: student, error: sErr } = await admin
    .from("students")
    .select("id, name, age, date_of_birth, program, section, admission_no, parent_name, parent_email, parent_phone, teacher, teacher_id, photo")
    .eq("id", studentId)
    .maybeSingle()

  if (sErr || !student) {
    return { error: "Student not found" }
  }

  if (ctx.role === "teacher") {
    const isAssigned =
      student.teacher_id === ctx.teacher.id ||
      (student.teacher && ctx.teacher.full_name && student.teacher.toLowerCase().includes(ctx.teacher.full_name.toLowerCase()))
    if (!isAssigned) {
      return { error: "Unauthorized: This student is not assigned to your class." }
    }
  }

  // Fetch Attendance history, Development observations, and Notes in parallel
  const [
    { data: attendance },
    { data: development },
    { data: notes },
  ] = await Promise.all([
    admin.from("attendance").select("id, date, status").eq("student_id", studentId).order("date", { ascending: false }),
    admin.from("student_development").select("id, student_id, teacher_id, teacher_name, date, communication, cognitive_development, motor_skills, social_development, creativity, participation, observation, created_at").eq("student_id", studentId).order("date", { ascending: false }),
    admin.from("notes").select("id, student_id, teacher_name, date, message, category").eq("student_id", studentId).order("date", { ascending: false }),
  ])

  // Calculate attendance metrics
  const records = (attendance || []) as { id: string; date: string; status: string }[]
  const totalDays = records.length
  const presentCount = records.filter((r) => r.status === "present").length
  const absentCount = records.filter((r) => r.status === "absent").length
  const leaveCount = records.filter((r) => r.status === "leave").length
  const workingDays = presentCount + absentCount
  const attendanceRate = workingDays > 0 ? Math.round((presentCount / workingDays) * 100) : (totalDays > 0 ? 100 : 0)

  return {
    student: {
      id: student.id,
      name: student.name,
      age: student.age,
      dateOfBirth: student.date_of_birth,
      program: student.program,
      section: student.section,
      admissionNo: student.admission_no,
      parentName: student.parent_name,
      parentEmail: student.parent_email,
      parentPhone: student.parent_phone,
      teacher: student.teacher,
      photo: student.photo,
    },
    attendance: {
      records,
      totalDays,
      presentCount,
      absentCount,
      leaveCount,
      attendanceRate,
    },
    development: development || [],
    notes: notes || [],
  }
}

// ── 2. STUDENT DEVELOPMENT (Preschool Observations) ───────────

export async function getStudentDevelopmentList(studentId?: string): Promise<{ data: StudentDevelopment[]; error?: string }> {
  const ctx = await getTeacherContext()
  if (!ctx.authorized || !ctx.teacher) {
    return { data: [], error: "Unauthorized" }
  }

  const admin = getAdminClient()
  let query = admin.from("student_development").select("*, students(name, program, section)").order("date", { ascending: false })

  if (studentId) {
    query = query.eq("student_id", studentId)
  }

  const { data, error } = await query
  if (error) {
    return { data: [], error: error.message }
  }

  const mapped: StudentDevelopment[] = (data || []).map((d: any) => ({
    id: d.id,
    studentId: d.student_id,
    studentName: d.students?.name || "Student",
    program: d.students?.program || "",
    section: d.students?.section || "",
    teacherId: d.teacher_id,
    teacherName: d.teacher_name,
    date: d.date,
    communication: d.communication,
    cognitiveDevelopment: d.cognitive_development,
    motorSkills: d.motor_skills,
    socialDevelopment: d.social_development,
    creativity: d.creativity,
    participation: d.participation,
    observation: d.observation,
    createdAt: d.created_at,
  }))

  return { data: mapped }
}

export async function saveStudentDevelopment(data: {
  id?: string
  studentId: string
  date: string
  communication: string
  cognitiveDevelopment: string
  motorSkills: string
  socialDevelopment: string
  creativity: string
  participation: string
  observation: string
}): Promise<{ success: boolean; error?: string }> {
  const ctx = await getTeacherContext()
  if (!ctx.authorized || !ctx.teacher) {
    return { success: false, error: "Unauthorized" }
  }

  const admin = getAdminClient()

  // Verify student is assigned to this teacher
  const { data: student } = await admin
    .from("students")
    .select("id, teacher_id, teacher")
    .eq("id", data.studentId)
    .maybeSingle()

  if (!student) {
    return { success: false, error: "Student not found" }
  }

  if (ctx.role === "teacher") {
    const isAssigned =
      student.teacher_id === ctx.teacher.id ||
      (student.teacher && ctx.teacher.full_name && student.teacher.toLowerCase().includes(ctx.teacher.full_name.toLowerCase()))
    if (!isAssigned) {
      return { success: false, error: "Unauthorized: You can only record observations for your assigned students." }
    }
  }

  const payload = {
    student_id: data.studentId,
    teacher_id: ctx.teacher.id,
    teacher_name: ctx.teacher.full_name || "Teacher",
    date: data.date,
    communication: data.communication,
    cognitive_development: data.cognitiveDevelopment,
    motor_skills: data.motorSkills,
    social_development: data.socialDevelopment,
    creativity: data.creativity,
    participation: data.participation,
    observation: data.observation,
  }

  if (data.id) {
    const { error } = await admin.from("student_development").update(payload).eq("id", data.id)
    if (error) return { success: false, error: error.message }
  } else {
    const { error } = await admin.from("student_development").insert([payload])
    if (error) return { success: false, error: error.message }
  }

  return { success: true }
}

export async function deleteStudentDevelopment(id: string): Promise<{ success: boolean; error?: string }> {
  const ctx = await getTeacherContext()
  if (!ctx.authorized) return { success: false, error: "Unauthorized" }

  const admin = getAdminClient()
  const { error } = await admin.from("student_development").delete().eq("id", id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ── 3. TEACHER STUDENT NOTES ───────────────────────────────────

export async function getTeacherNotesForStudents(studentId?: string): Promise<{ data: any[]; error?: string }> {
  const ctx = await getTeacherContext()
  if (!ctx.authorized || !ctx.teacher) return { data: [], error: "Unauthorized" }

  const admin = getAdminClient()
  let query = admin.from("notes").select("*, students(name, program, section)").order("date", { ascending: false })
  if (studentId) query = query.eq("student_id", studentId)

  const { data, error } = await query
  if (error) return { data: [], error: error.message }

  const mapped = (data || []).map((n: any) => ({
    id: n.id,
    studentId: n.student_id,
    studentName: n.students?.name || "Student",
    program: n.students?.program || "",
    section: n.students?.section || "",
    teacherName: n.teacher_name,
    date: n.date,
    message: n.message,
    category: n.category,
  }))

  return { data: mapped }
}

export async function saveTeacherStudentNote(data: {
  id?: string
  studentId: string
  category: string
  message: string
  date: string
}): Promise<{ success: boolean; error?: string }> {
  const ctx = await getTeacherContext()
  if (!ctx.authorized || !ctx.teacher) return { success: false, error: "Unauthorized" }

  const admin = getAdminClient()

  // Verify student is assigned
  const { data: student } = await admin.from("students").select("id, teacher_id, teacher").eq("id", data.studentId).maybeSingle()
  if (!student) return { success: false, error: "Student not found" }

  if (ctx.role === "teacher") {
    const isAssigned =
      student.teacher_id === ctx.teacher.id ||
      (student.teacher && ctx.teacher.full_name && student.teacher.toLowerCase().includes(ctx.teacher.full_name.toLowerCase()))
    if (!isAssigned) {
      return { success: false, error: "Unauthorized: You can only create notes for your assigned students." }
    }
  }

  const payload = {
    student_id: data.studentId,
    teacher_name: ctx.teacher.full_name || "Teacher",
    category: data.category,
    message: data.message,
    date: data.date,
  }

  if (data.id) {
    const { error } = await admin.from("notes").update(payload).eq("id", data.id)
    if (error) return { success: false, error: error.message }
  } else {
    const { error } = await admin.from("notes").insert([payload])
    if (error) return { success: false, error: error.message }
  }

  return { success: true }
}

export async function deleteTeacherStudentNote(id: string): Promise<{ success: boolean; error?: string }> {
  const ctx = await getTeacherContext()
  if (!ctx.authorized) return { success: false, error: "Unauthorized" }

  const admin = getAdminClient()
  const { error } = await admin.from("notes").delete().eq("id", id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ── 4. CLASS ACTIVITIES ────────────────────────────────────────

export async function getClassActivities(program?: string, section?: string): Promise<{ data: ClassActivity[]; error?: string }> {
  const ctx = await getTeacherContext()
  if (!ctx.authorized) return { data: [], error: "Unauthorized" }

  const admin = getAdminClient()
  let query = admin.from("class_activities").select("id, title, description, activity_type, date, program, section, teacher_id, teacher_name, student_participation, observations, created_at").order("date", { ascending: false })

  if (program && program !== "all") query = query.eq("program", program)
  if (section && section !== "all") query = query.eq("section", section)

  const { data, error } = await query
  if (error) {
    // If table doesn't exist yet, return sample/empty data gracefully
    return { data: [], error: error.message }
  }

  const mapped: ClassActivity[] = (data || []).map((a: any) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    activityType: a.activity_type,
    date: a.date,
    program: a.program,
    section: a.section,
    teacherId: a.teacher_id,
    teacherName: a.teacher_name,
    studentParticipation: a.student_participation,
    observations: a.observations,
    createdAt: a.created_at,
  }))

  return { data: mapped }
}

export async function saveClassActivity(data: {
  id?: string
  title: string
  description: string
  activityType: string
  date: string
  program: string
  section: string
  studentParticipation?: string
  observations?: string
}): Promise<{ success: boolean; error?: string }> {
  const ctx = await getTeacherContext()
  if (!ctx.authorized || !ctx.teacher) return { success: false, error: "Unauthorized" }

  const admin = getAdminClient()
  const payload = {
    title: data.title,
    description: data.description,
    activity_type: data.activityType,
    date: data.date,
    program: data.program,
    section: data.section || "A",
    teacher_id: ctx.teacher.id,
    teacher_name: ctx.teacher.full_name || "Teacher",
    student_participation: data.studentParticipation || "",
    observations: data.observations || "",
  }

  if (data.id) {
    const { error } = await admin.from("class_activities").update(payload).eq("id", data.id)
    if (error) return { success: false, error: error.message }
  } else {
    const { error } = await admin.from("class_activities").insert([payload])
    if (error) return { success: false, error: error.message }
  }

  return { success: true }
}

export async function deleteClassActivity(id: string): Promise<{ success: boolean; error?: string }> {
  const ctx = await getTeacherContext()
  if (!ctx.authorized) return { success: false, error: "Unauthorized" }

  const admin = getAdminClient()
  const { error } = await admin.from("class_activities").delete().eq("id", id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ── 5. HOME ACTIVITIES ─────────────────────────────────────────

export async function getHomeActivities(program?: string, section?: string): Promise<{ data: HomeActivity[]; error?: string }> {
  const ctx = await getTeacherContext()
  if (!ctx.authorized) return { data: [], error: "Unauthorized" }

  const admin = getAdminClient()
  let query = admin.from("home_activities").select("id, title, instructions, program, section, date, due_date, teacher_id, teacher_name, created_at").order("date", { ascending: false })

  if (program && program !== "all") query = query.eq("program", program)
  if (section && section !== "all") query = query.eq("section", section)

  const { data, error } = await query
  if (error) return { data: [], error: error.message }

  const mapped: HomeActivity[] = (data || []).map((h: any) => ({
    id: h.id,
    title: h.title,
    instructions: h.instructions,
    program: h.program,
    section: h.section,
    date: h.date,
    dueDate: h.due_date,
    teacherId: h.teacher_id,
    teacherName: h.teacher_name,
    createdAt: h.created_at,
  }))

  return { data: mapped }
}

export async function saveHomeActivity(data: {
  id?: string
  title: string
  instructions: string
  program: string
  section: string
  date: string
  dueDate?: string
}): Promise<{ success: boolean; error?: string }> {
  const ctx = await getTeacherContext()
  if (!ctx.authorized || !ctx.teacher) return { success: false, error: "Unauthorized" }

  const admin = getAdminClient()
  const payload = {
    title: data.title,
    instructions: data.instructions,
    program: data.program,
    section: data.section || "A",
    date: data.date,
    due_date: data.dueDate || null,
    teacher_id: ctx.teacher.id,
    teacher_name: ctx.teacher.full_name || "Teacher",
  }

  if (data.id) {
    const { error } = await admin.from("home_activities").update(payload).eq("id", data.id)
    if (error) return { success: false, error: error.message }
  } else {
    const { error } = await admin.from("home_activities").insert([payload])
    if (error) return { success: false, error: error.message }
  }

  return { success: true }
}

export async function deleteHomeActivity(id: string): Promise<{ success: boolean; error?: string }> {
  const ctx = await getTeacherContext()
  if (!ctx.authorized) return { success: false, error: "Unauthorized" }

  const admin = getAdminClient()
  const { error } = await admin.from("home_activities").delete().eq("id", id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ── 6. LEAVE REQUESTS ──────────────────────────────────────────

export async function getTeacherLeaveRequests(): Promise<{ data: TeacherLeave[]; error?: string }> {
  const ctx = await getTeacherContext()
  if (!ctx.authorized || !ctx.teacher) return { data: [], error: "Unauthorized" }

  const admin = getAdminClient()
  const { data, error } = await admin
    .from("teacher_leave")
    .select("id, teacher_id, start_date, end_date, type, reason, status, applied_on")
    .eq("teacher_id", ctx.teacher.id)
    .order("start_date", { ascending: false })

  if (error) return { data: [], error: error.message }
  return { data: (data || []) as TeacherLeave[] }
}

export async function submitTeacherLeaveRequest(data: {
  startDate: string
  endDate: string
  type: string
  reason: string
}): Promise<{ success: boolean; error?: string }> {
  const ctx = await getTeacherContext()
  if (!ctx.authorized || !ctx.teacher) return { success: false, error: "Unauthorized" }

  const admin = getAdminClient()
  const payload = {
    teacher_id: ctx.teacher.id,
    start_date: data.startDate,
    end_date: data.endDate,
    type: data.type,
    reason: data.reason,
    status: "Pending",
    applied_on: new Date().toISOString().slice(0, 10),
  }

  const { error } = await admin.from("teacher_leave").insert([payload])
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function cancelTeacherLeaveRequest(id: string): Promise<{ success: boolean; error?: string }> {
  const ctx = await getTeacherContext()
  if (!ctx.authorized || !ctx.teacher) return { success: false, error: "Unauthorized" }

  const admin = getAdminClient()
  const { error } = await admin
    .from("teacher_leave")
    .delete()
    .eq("id", id)
    .eq("teacher_id", ctx.teacher.id)
    .eq("status", "Pending")

  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ── 7. ANNOUNCEMENTS & CALENDAR ────────────────────────────────

export async function getTeacherAnnouncements(): Promise<{ data: Announcement[]; error?: string }> {
  const admin = getAdminClient()
  const { data, error } = await admin
    .from("announcements")
    .select("id, title, content, date, priority, published, author")
    .eq("published", true)
    .order("date", { ascending: false })

  if (error) return { data: [], error: error.message }
  return { data: (data || []) as Announcement[] }
}

export async function getTeacherCalendarEvents(): Promise<{ data: SchoolEvent[]; error?: string }> {
  const admin = getAdminClient()
  const { data, error } = await admin
    .from("events")
    .select("id, title, description, date, time, location, type")
    .order("date", { ascending: true })

  if (error) return { data: [], error: error.message }
  return { data: (data || []) as SchoolEvent[] }
}

// ── 8. TEACHER PROFILE (Strictly No Salary Fields) ─────────────

export async function getTeacherProfileData(): Promise<{ teacher: Teacher | null; error?: string }> {
  const ctx = await getTeacherContext()
  if (!ctx.authorized || !ctx.teacher) return { teacher: null, error: "Unauthorized" }

  const admin = getAdminClient()
  const { data, error } = await admin
    .from("teachers")
    .select("id, teacher_id, full_name, gender, dob, phone, email, address, qualification, experience, designation, department, specialization, joining_date, employment_type, status, emergency_contact, blood_group, photo, created_at, updated_at")
    .eq("id", ctx.teacher.id)
    .maybeSingle()

  if (error || !data) {
    return { teacher: ctx.teacher as Teacher }
  }

  return { teacher: data as Teacher }
}

export async function updateTeacherProfileData(data: {
  phone?: string
  address?: string
  emergencyContact?: string
  specialization?: string
  qualification?: string
  experience?: string
  photo?: string
}): Promise<{ success: boolean; error?: string }> {
  const ctx = await getTeacherContext()
  if (!ctx.authorized || !ctx.teacher) return { success: false, error: "Unauthorized" }

  const admin = getAdminClient()
  const payload: any = {
    phone: data.phone,
    address: data.address,
    emergency_contact: data.emergencyContact,
    specialization: data.specialization,
    qualification: data.qualification,
    experience: data.experience,
    photo: data.photo,
    updated_at: new Date().toISOString(),
  }

  // Remove undefined fields
  Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key])

  const { error } = await admin.from("teachers").update(payload).eq("id", ctx.teacher.id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}
