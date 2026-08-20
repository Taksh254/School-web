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

// ── Auth Method 1: parent_session JWT cookie (admission-number login) ────────
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

// ── Auth Method 2: Supabase Auth JWT (email login / OAuth) ───────────────────
// Returns { userId, displayName } if the caller is a valid Supabase Auth user
// whose profiles row has role = 'parent'. Returns null otherwise.
async function getSupabaseParent(
  request: NextRequest,
  admin: ReturnType<typeof getAdminClient>
): Promise<{ userId: string; displayName: string } | null> {
  try {
    const authHeader = request.headers.get("authorization") || ""
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null
    if (!bearerToken) return null

    const { data: { user }, error } = await admin.auth.getUser(bearerToken)
    if (error || !user) return null

    const { data: profile } = await admin
      .from("profiles")
      .select("role, name, child_id")
      .eq("id", user.id)
      .maybeSingle()

    if (!profile || profile.role !== "parent") return null

    return { userId: user.id, displayName: profile.name || "Parent" }
  } catch {
    return null
  }
}

// ── Auth Method 3: Supabase Auth via admin-role check ────────────────────────
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

    const { data: profile } = await admin
      .from("profiles")
      .select("role, name")
      .eq("id", user.id)
      .maybeSingle()

    if (profile?.role !== "admin") return null
    return { userId: user.id, displayName: profile.name || "Principal" }
  } catch {
    return null
  }
}

// ── Resolve studentId for a Supabase-auth parent ─────────────────────────────
// Looks up profiles.child_id for the given Supabase user ID.
async function resolveStudentIdForSupabaseParent(
  userId: string,
  admin: ReturnType<typeof getAdminClient>
): Promise<string | null> {
  // 1. Check profiles.child_id
  const { data: profile } = await admin
    .from("profiles")
    .select("child_id")
    .eq("id", userId)
    .maybeSingle()

  if (profile?.child_id) {
    if (DEV) console.log("[chat/conversations] Resolved student via profiles.child_id:", profile.child_id)
    return profile.child_id
  }

  // 2. Fallback: check students.parent_id
  const { data: student } = await admin
    .from("students")
    .select("id")
    .eq("parent_id", userId)
    .maybeSingle()

  if (student?.id) {
    if (DEV) console.log("[chat/conversations] Resolved student via students.parent_id:", student.id)
    return student.id
  }

  if (DEV) console.log("[chat/conversations] Could not resolve studentId for Supabase-auth parent userId:", userId)
  return null
}

// ── GET /api/chat/conversations ───────────────────────────────────────────────
// Parent (cookie-auth):    returns their conversation (creates if first-time)
// Parent (Supabase-auth):  same, resolved via profiles.child_id
// Admin (Supabase-auth):   returns all conversations with unread counts
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  if (DEV) console.log("[chat/conversations] GET request received")

  let admin: ReturnType<typeof getAdminClient>
  try {
    admin = getAdminClient()
  } catch (configErr: any) {
    console.error("[chat/conversations] Supabase misconfiguration:", configErr?.message)
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 })
  }

  // ── Check admin first ──
  const adminUser = await getAdminUser(request, admin)
  if (adminUser) {
    if (DEV) console.log("[chat/conversations] Admin path — userId:", adminUser.userId)
    return handleAdminRequest(admin)
  }

  // ── Resolve parent identity ─────────────────────────────────────────────
  // Try method 1: parent_session cookie (admission-number login)
  let studentId: string | null = null
  let parentDisplayName = "Parent"

  const cookieSession = getParentCookieSession(request)
  if (cookieSession) {
    if (DEV) {
      console.log("[chat/conversations] Parent session verified —", {
        role: cookieSession.role,
        studentId: cookieSession.studentId || "(none)",
        admissionNo: cookieSession.admissionNo || "(none)",
      })
    }
    parentDisplayName = cookieSession.parentName || "Parent"
    studentId = cookieSession.studentId || null

    if (!studentId && cookieSession.admissionNo) {
      const { data: student, error: stuErr } = await admin
        .from("students")
        .select("id, parent_name")
        .ilike("admission_no", cookieSession.admissionNo.trim())
        .maybeSingle()

      if (stuErr) {
        console.error("[chat/conversations] Student lookup error:", stuErr.code, stuErr.message)
        return NextResponse.json({ error: "Student lookup failed", detail: DEV ? stuErr.message : undefined }, { status: 500 })
      }
      if (!student) {
        if (DEV) console.log("[chat/conversations] No student found for admissionNo:", cookieSession.admissionNo)
        return NextResponse.json({ error: "Student not found" }, { status: 404 })
      }
      studentId = student.id
    }
  }

  // Try method 2: Supabase Auth Bearer token (email login / OAuth)
  if (!studentId) {
    const supabaseParent = await getSupabaseParent(request, admin)
    if (supabaseParent) {
      if (DEV) console.log("[chat/conversations] Supabase-auth parent verified, userId:", supabaseParent.userId)
      parentDisplayName = supabaseParent.displayName
      studentId = await resolveStudentIdForSupabaseParent(supabaseParent.userId, admin)
    }
  }

  if (!studentId) {
    if (DEV) console.log("[chat/conversations] No valid parent auth found (no cookie, no Bearer token)")
    return NextResponse.json({ error: "Unauthorized — no valid session" }, { status: 401 })
  }

  if (DEV) console.log("[chat/conversations] Resolved studentId:", studentId)

  return handleParentRequest(admin, studentId, parentDisplayName)
}

// ── Parent: get or create conversation ──────────────────────────────────────
async function handleParentRequest(
  admin: ReturnType<typeof getAdminClient>,
  studentId: string,
  parentDisplayName: string
) {
  // Look up student record for admission number and parent name
  const { data: student } = await admin
    .from("students")
    .select("admission_no, parent_name")
    .eq("id", studentId)
    .maybeSingle()

  const admissionNo = student?.admission_no || ""
  const parentName = student?.parent_name || parentDisplayName

  // Look up existing conversation
  const { data: conv, error: fetchErr } = await admin
    .from("conversations")
    .select("*")
    .eq("student_id", studentId)
    .maybeSingle()

  if (fetchErr) {
    console.error("[chat/conversations] Conversation fetch error:", fetchErr.code, fetchErr.message)
    return NextResponse.json(
      {
        error: "Failed to fetch conversation",
        supabaseCode: DEV ? fetchErr.code : undefined,
        detail: DEV ? fetchErr.message : undefined,
      },
      { status: 500 }
    )
  }

  let finalConv = conv

  // First-time parent: create conversation
  if (!finalConv) {
    if (DEV) console.log("[chat/conversations] No existing conversation — creating one for studentId:", studentId)
    const { data: newConv, error: createErr } = await admin
      .from("conversations")
      .insert({
        student_id: studentId,
        parent_name: parentName,
        admission_no: admissionNo,
      })
      .select()
      .single()

    if (createErr) {
      console.error("[chat/conversations] Conversation create error:", createErr.code, createErr.message)
      return NextResponse.json(
        {
          error: "Failed to create conversation",
          supabaseCode: DEV ? createErr.code : undefined,
          detail: DEV ? createErr.message : undefined,
        },
        { status: 500 }
      )
    }
    if (!newConv) {
      return NextResponse.json({ error: "Failed to create conversation — no data returned" }, { status: 500 })
    }
    finalConv = newConv
    if (DEV) console.log("[chat/conversations] Created new conversation:", finalConv.id)
  } else {
    if (DEV) console.log("[chat/conversations] Found existing conversation:", finalConv.id)
  }

  // Unread count from principal
  const { count: unreadCount } = await admin
    .from("messages")
    .select("id", { count: "exact" })
    .eq("conversation_id", finalConv.id)
    .eq("sender_role", "principal")
    .is("read_at", null)

  return NextResponse.json({
    conversation: finalConv,
    unreadCount: unreadCount || 0,
  })
}

// ── Admin: list all conversations ────────────────────────────────────────────
async function handleAdminRequest(admin: ReturnType<typeof getAdminClient>) {
  const { data: conversations, error } = await admin
    .from("conversations")
    .select("*")
    .order("updated_at", { ascending: false })

  if (error) {
    console.error("[chat/conversations] Admin fetch error:", error.code, error.message)
    return NextResponse.json(
      { error: "Failed to fetch conversations", detail: DEV ? error.message : undefined },
      { status: 500 }
    )
  }

  const enriched = await Promise.all(
    (conversations || []).map(async (conv: any) => {
      const [lastMsgResult, unreadResult] = await Promise.all([
        admin
          .from("messages")
          .select("message, created_at, sender_role")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        admin
          .from("messages")
          .select("id", { count: "exact" })
          .eq("conversation_id", conv.id)
          .eq("sender_role", "parent")
          .is("read_at", null),
      ])
      return {
        ...conv,
        lastMessage: lastMsgResult.data || null,
        unreadCount: unreadResult.count || 0,
      }
    })
  )

  return NextResponse.json({ conversations: enriched })
}
