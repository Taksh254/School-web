import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const COOKIE_NAME = "parent_session"
const DEV = process.env.NODE_ENV === "development"
const MAX_MESSAGE_LENGTH = 2000

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

// ── Shared auth helpers ──────────────────────────────────────────────────────

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

async function getAdminUser(
  request: NextRequest,
  admin: ReturnType<typeof getAdminClient>
): Promise<{ userId: string; displayName: string } | null> {
  try {
    const authHeader = request.headers.get("authorization") || ""
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null
    if (!bearerToken) return null
    const { data: { user }, error } = await admin.auth.getUser(bearerToken)
    if (error || !user) return null
    const { data: profile } = await admin.from("profiles").select("role, name").eq("id", user.id).maybeSingle()
    if (profile?.role !== "admin") return null
    return { userId: user.id, displayName: profile.name || "Principal" }
  } catch {
    return null
  }
}

async function getSupabaseParentStudentId(
  request: NextRequest,
  admin: ReturnType<typeof getAdminClient>
): Promise<{ studentId: string; displayName: string } | null> {
  try {
    const authHeader = request.headers.get("authorization") || ""
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null
    if (!bearerToken) return null
    const { data: { user }, error } = await admin.auth.getUser(bearerToken)
    if (error || !user) return null
    const { data: profile } = await admin.from("profiles").select("role, name, child_id").eq("id", user.id).maybeSingle()
    if (!profile || profile.role !== "parent") return null

    let studentId = profile.child_id || null
    if (!studentId) {
      const { data: student } = await admin.from("students").select("id").eq("parent_id", user.id).maybeSingle()
      studentId = student?.id || null
    }
    if (!studentId) return null
    return { studentId, displayName: profile.name || "Parent" }
  } catch {
    return null
  }
}

/** Resolve verified parent studentId from any supported auth method. Returns null if unauthenticated. */
async function resolveParentStudentId(
  request: NextRequest,
  admin: ReturnType<typeof getAdminClient>
): Promise<{ studentId: string; displayName: string } | null> {
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
    if (studentId) return { studentId, displayName: cookieSession.parentName || "Parent" }
  }

  // Method 2: Supabase Auth Bearer token (email / OAuth parents)
  return getSupabaseParentStudentId(request, admin)
}

// ── GET /api/chat/messages?conversationId=<id> ───────────────────────────────
export async function GET(request: NextRequest) {
  const conversationId = request.nextUrl.searchParams.get("conversationId")
  if (!conversationId) {
    return NextResponse.json({ error: "conversationId is required" }, { status: 400 })
  }

  const admin = getAdminClient()

  // Admin path
  const adminUser = await getAdminUser(request, admin)
  if (adminUser) {
    const { data: messages, error } = await admin
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
    if (error) {
      console.error("[chat/messages] Admin fetch error:", error.code, error.message)
      return NextResponse.json({ error: "Failed to fetch messages", detail: DEV ? error.message : undefined }, { status: 500 })
    }
    return NextResponse.json({ messages: messages || [] })
  }

  // Parent path
  const parentAuth = await resolveParentStudentId(request, admin)
  if (!parentAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // SECURITY: verify conversation belongs to this student
  const { data: conv } = await admin
    .from("conversations")
    .select("id, student_id")
    .eq("id", conversationId)
    .eq("student_id", parentAuth.studentId)
    .maybeSingle()

  if (!conv) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { data: messages, error } = await admin
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("[chat/messages] Parent fetch error:", error.code, error.message)
    return NextResponse.json({ error: "Failed to fetch messages", detail: DEV ? error.message : undefined }, { status: 500 })
  }

  return NextResponse.json({ messages: messages || [] })
}

// ── POST /api/chat/messages ───────────────────────────────────────────────────
// Parent body: { message: string }             → conversationId from session
// Admin body:  { conversationId, message }     → conversationId explicit
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const admin = getAdminClient()

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const rawMessage: string = typeof body.message === "string" ? body.message.trim() : ""
  if (!rawMessage) {
    return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 })
  }
  if (rawMessage.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: `Message exceeds ${MAX_MESSAGE_LENGTH} characters` }, { status: 400 })
  }

  // Admin path
  const adminUser = await getAdminUser(request, admin)
  if (adminUser) {
    const conversationId: string = typeof body.conversationId === "string" ? body.conversationId.trim() : ""
    if (!conversationId) {
      return NextResponse.json({ error: "conversationId is required for admin" }, { status: 400 })
    }
    const { data: conv } = await admin.from("conversations").select("id").eq("id", conversationId).maybeSingle()
    if (!conv) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }
    const { data: msg, error } = await admin
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_role: "principal",  // server-set, never from browser
        sender_name: adminUser.displayName,
        message: rawMessage,
      })
      .select()
      .single()

    if (error) {
      console.error("[chat/messages] Admin send error:", error.code, error.message)
      return NextResponse.json({ error: "Failed to send message", detail: DEV ? error.message : undefined }, { status: 500 })
    }
    return NextResponse.json({ message: msg }, { status: 201 })
  }

  // Parent path
  const parentAuth = await resolveParentStudentId(request, admin)
  if (!parentAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { studentId, displayName } = parentAuth

  // Find or create conversation (server-derived, never from browser)
  let convId: string | undefined
  const { data: existingConv } = await admin
    .from("conversations")
    .select("id")
    .eq("student_id", studentId)
    .maybeSingle()

  if (existingConv) {
    convId = existingConv.id
  } else {
    // Look up student info for the new conversation
    const { data: student } = await admin.from("students").select("admission_no, parent_name").eq("id", studentId).maybeSingle()
    const { data: newConv, error: createErr } = await admin
      .from("conversations")
      .insert({
        student_id: studentId,
        parent_name: student?.parent_name || displayName,
        admission_no: student?.admission_no || "",
      })
      .select("id")
      .single()

    if (createErr || !newConv) {
      console.error("[chat/messages] Conversation create error:", createErr?.code, createErr?.message)
      return NextResponse.json({ error: "Failed to create conversation", detail: DEV ? createErr?.message : undefined }, { status: 500 })
    }
    convId = newConv.id
  }

  if (!convId) {
    return NextResponse.json({ error: "Could not resolve conversation" }, { status: 500 })
  }

  const { data: msg, error } = await admin
    .from("messages")
    .insert({
      conversation_id: convId,
      sender_role: "parent",  // server-set
      sender_name: displayName,
      message: rawMessage,
    })
    .select()
    .single()

  if (error) {
    console.error("[chat/messages] Parent send error:", error.code, error.message)
    return NextResponse.json({ error: "Failed to send message", detail: DEV ? error.message : undefined }, { status: 500 })
  }

  return NextResponse.json({ message: msg }, { status: 201 })
}
