import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const COOKIE_NAME = "parent_session"
const DEV = process.env.NODE_ENV === "development"

interface ParentSessionPayload {
  studentId: string
  admissionNo: string
  parentName: string
  role: "parent"
  mustChangePassword: boolean
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase service role not configured")
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function getParentCookieSession(request: NextRequest): ParentSessionPayload | null {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token || !JWT_SECRET) return null
  try {
    const payload = jwt.verify(token, JWT_SECRET) as ParentSessionPayload
    if (payload.role !== "parent") return null
    return payload
  } catch {
    return null
  }
}

async function getAdminUserId(
  request: NextRequest,
  admin: ReturnType<typeof getAdminClient>
): Promise<string | null> {
  try {
    const authHeader = request.headers.get("authorization") || ""
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null
    if (!bearerToken) return null
    const { data: { user }, error } = await admin.auth.getUser(bearerToken)
    if (error || !user) return null
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle()
    if (profile?.role !== "admin") return null
    return user.id
  } catch {
    return null
  }
}

async function resolveParentStudentId(
  request: NextRequest,
  admin: ReturnType<typeof getAdminClient>
): Promise<string | null> {
  // Method 1: parent_session cookie
  const cookieSession = getParentCookieSession(request)
  if (cookieSession) {
    let studentId = cookieSession.studentId || null
    if (!studentId && cookieSession.admissionNo) {
      const { data: student } = await admin
        .from("students")
        .select("id")
        .ilike("admission_no", cookieSession.admissionNo.trim())
        .maybeSingle()
      studentId = student?.id || null
    }
    if (studentId) return studentId
  }

  // Method 2: Supabase Auth Bearer token (email / OAuth parents)
  try {
    const authHeader = request.headers.get("authorization") || ""
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null
    if (!bearerToken) return null
    const { data: { user }, error } = await admin.auth.getUser(bearerToken)
    if (error || !user) return null
    const { data: profile } = await admin.from("profiles").select("role, child_id").eq("id", user.id).maybeSingle()
    if (!profile || profile.role !== "parent") return null
    if (profile.child_id) return profile.child_id

    // Fallback: students.parent_id
    const { data: student } = await admin.from("students").select("id").eq("parent_id", user.id).maybeSingle()
    return student?.id || null
  } catch {
    return null
  }
}

// ── POST /api/chat/read ───────────────────────────────────────────────────────
// Parent: marks 'principal' messages as read in their verified conversation
// Admin:  marks 'parent' messages as read in a given conversation
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const admin = getAdminClient()

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const conversationId: string = typeof body.conversationId === "string" ? body.conversationId.trim() : ""
  if (!conversationId) {
    return NextResponse.json({ error: "conversationId is required" }, { status: 400 })
  }

  // Admin path
  const adminUserId = await getAdminUserId(request, admin)
  if (adminUserId) {
    await admin
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("sender_role", "parent")
      .is("read_at", null)
    return NextResponse.json({ success: true })
  }

  // Parent path
  const studentId = await resolveParentStudentId(request, admin)
  if (!studentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // SECURITY: verify the conversation belongs to this student
  const { data: conv } = await admin
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("student_id", studentId)
    .maybeSingle()

  if (!conv) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await admin
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("sender_role", "principal")
    .is("read_at", null)

  return NextResponse.json({ success: true })
}
