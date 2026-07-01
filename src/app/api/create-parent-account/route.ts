import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

/**
 * POST /api/create-parent-account
 *
 * Creates a Supabase Auth user for a parent using the Service Role Key
 * so that row-level security and email confirmation are bypassed.
 * Plain-text passwords are NEVER stored in the database.
 *
 * Body: { email, password, studentId, parentName }
 * Returns: { created, skipped, userId? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, studentId, parentName } = body as {
      email: string
      password: string
      studentId: string
      parentName: string
    }

    if (!email || !password || !studentId) {
      return NextResponse.json(
        { error: "Missing required fields: email, password, studentId" },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.warn("[create-parent-account] SUPABASE_SERVICE_ROLE_KEY not configured — skipping account creation")
      return NextResponse.json({ created: false, skipped: true, reason: "service_role_not_configured" })
    }

    // Admin client — uses service role key, bypasses RLS
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const normalizedEmail = email.trim().toLowerCase()

    // Check if user already exists via profiles table (O(1) — scales to unlimited users)
    const { data: existingProfile } = await adminSupabase
      .from("profiles")
      .select("id, child_id")
      .eq("email", normalizedEmail)
      .maybeSingle()

    if (existingProfile) {
      // Still ensure child is linked even if auth user already existed
      await adminSupabase
        .from("profiles")
        .update({ child_id: studentId })
        .eq("email", normalizedEmail)
      return NextResponse.json({ created: false, skipped: true })
    }

    // Create the auth user (email confirmed immediately — no verification email needed)
    const { data: authData, error: createError } = await adminSupabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: parentName || normalizedEmail.split("@")[0] },
    })

    if (createError) {
      console.error("[create-parent-account] createUser failed:", createError.message)
      // Supabase returns this specific error when email already exists in some versions
      if (createError.message?.toLowerCase().includes("already") || createError.message?.toLowerCase().includes("exists")) {
        return NextResponse.json({ created: false, skipped: true })
      }
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    const userId = authData.user?.id
    if (!userId) {
      return NextResponse.json({ error: "User created but ID not returned" }, { status: 500 })
    }

    // Upsert a profile row: role=parent, must_change_password=true, child_id=studentId
    const { error: profileError } = await adminSupabase.from("profiles").upsert(
      {
        id: userId,
        email: normalizedEmail,
        name: parentName || normalizedEmail.split("@")[0],
        role: "parent",
        child_id: studentId,
        must_change_password: true,
      },
      { onConflict: "id" }
    )

    if (profileError) {
      console.error("[create-parent-account] profile upsert failed:", profileError.message)
      // Don't fail the whole request — auth user was created successfully
    }

    console.log(`[create-parent-account] Created parent account for ${normalizedEmail} (user: ${userId})`)
    return NextResponse.json({ created: true, skipped: false, userId })
  } catch (err: any) {
    console.error("[create-parent-account] Unexpected error:", err?.message)
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 })
  }
}
