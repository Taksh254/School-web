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

async function getAuth(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return { user: null, role: null, teacher: null }

  const res = NextResponse.next({ request })
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, role: null, teacher: null }

  const admin = getAdminClient()
  const email = user.email?.toLowerCase().trim() || ""

  const { data: profile } = await admin.from("profiles").select("id, name, role").eq("id", user.id).maybeSingle()
  let role = profile?.role || "parent"

  const { data: teacher } = await admin
    .from("teachers")
    .select("id, full_name, email, designation")
    .ilike("email", email)
    .maybeSingle()

  if (teacher || email.includes("@tinymind.com") || user.user_metadata?.role === "teacher") {
    if (role !== "admin") role = "teacher"
  }

  const teacherObj = teacher || {
    id: user.id,
    full_name: profile?.name || user.user_metadata?.full_name || email.split("@")[0],
    email: email,
  }

  return { user, role, teacher: teacherObj }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuth(request)
    if (!auth.user || (auth.role !== "teacher" && auth.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const admin = getAdminClient()
    const { searchParams } = new URL(request.url)
    const requestedTeacherId = searchParams.get("teacherId")

    let targetTeacherId = auth.teacher.id
    let targetTeacherName = auth.teacher.full_name
    let targetTeacherEmail = auth.teacher.email

    if (auth.role === "admin" && requestedTeacherId) {
      targetTeacherId = requestedTeacherId
      const { data: t } = await admin.from("teachers").select("id, full_name, email").eq("id", requestedTeacherId).maybeSingle()
      if (t) {
        targetTeacherName = t.full_name
        targetTeacherEmail = t.email
      }
    }

    // Get or create conversation for this teacher
    let { data: conv } = await admin
      .from("teacher_conversations")
      .select("*")
      .eq("teacher_id", targetTeacherId)
      .maybeSingle()

    if (!conv) {
      const { data: newConv, error: createErr } = await admin
        .from("teacher_conversations")
        .insert({
          teacher_id: targetTeacherId,
          teacher_name: targetTeacherName,
          teacher_email: targetTeacherEmail,
          status: "open",
        })
        .select()
        .single()

      if (createErr) {
        // Fallback in case table is in process of creation
        return NextResponse.json({
          conversation: { id: "temp-conv", teacher_name: targetTeacherName },
          messages: [],
        })
      }
      conv = newConv
    }

    // Fetch messages
    const { data: messages } = await admin
      .from("teacher_messages")
      .select("*")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: true })

    // Mark messages as read
    if (auth.role === "teacher") {
      await admin
        .from("teacher_messages")
        .update({ read_at: new Date().toISOString() })
        .eq("conversation_id", conv.id)
        .eq("sender_role", "principal")
        .is("read_at", null)
    }

    return NextResponse.json({
      conversation: conv,
      messages: messages || [],
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuth(request)
    if (!auth.user || (auth.role !== "teacher" && auth.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { message, conversationId, teacherId } = body

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const admin = getAdminClient()
    let convId = conversationId

    if (!convId) {
      const tId = auth.role === "teacher" ? auth.teacher.id : teacherId
      let { data: conv } = await admin.from("teacher_conversations").select("id").eq("teacher_id", tId).maybeSingle()
      if (!conv) {
        const { data: newConv } = await admin
          .from("teacher_conversations")
          .insert({
            teacher_id: tId,
            teacher_name: auth.teacher.full_name,
            teacher_email: auth.teacher.email,
          })
          .select()
          .single()
        conv = newConv
      }
      convId = conv?.id
    }

    const senderRole = auth.role === "admin" ? "principal" : "teacher"
    const senderName = auth.role === "admin" ? "Principal" : auth.teacher.full_name

    const { data: newMsg, error: msgErr } = await admin
      .from("teacher_messages")
      .insert({
        conversation_id: convId,
        sender_role: senderRole,
        sender_name: senderName,
        message: message.trim(),
      })
      .select()
      .single()

    if (msgErr) {
      return NextResponse.json({ error: msgErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: newMsg })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 })
  }
}
