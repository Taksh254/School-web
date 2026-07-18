import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

const BCRYPT_ROUNDS = 12

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase service role not configured")
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function isAuthorizedAdmin(request: NextRequest): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return false

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
    if (error || !user) return false

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    return profile?.role === "admin"
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const authorized = await isAuthorizedAdmin(request)
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized — admin access required" }, { status: 401 })
    }

    const body = await request.json()
    const { studentId } = body as { studentId: string }

    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 })
    }

    const admin = getAdminClient()

    // Fetch student's admission number (the reset password)
    const { data: student, error: fetchError } = await admin
      .from("students")
      .select("id, admission_no")
      .eq("id", studentId)
      .maybeSingle()

    if (fetchError || !student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Hash the admission number as the new default password
    const newHash = await bcrypt.hash(student.admission_no.toUpperCase(), BCRYPT_ROUNDS)

    const { error: updateError } = await admin
      .from("students")
      .update({
        parent_password_hash: newHash,
        password_reset_required: true,
        password_last_changed: null,
      })
      .eq("id", studentId)

    if (updateError) {
      console.error("[reset-parent-password] Update error:", updateError.message)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Parent password reset to admission number." })
  } catch (err: any) {
    console.error("[reset-parent-password] Unexpected error:", err?.message)
    return NextResponse.json({ error: "An error occurred." }, { status: 500 })
  }
}
