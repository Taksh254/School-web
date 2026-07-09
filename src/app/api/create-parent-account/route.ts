import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"
import { randomBytes } from "crypto"

/**
 * POST /api/create-parent-account
 *
 * Creates a Supabase Auth user for a parent using the Service Role Key.
 * A cryptographically random temporary password is generated and stored
 * in Supabase Auth — it is NEVER returned to the frontend.
 *
 * Requires an authenticated Supabase session where profiles.role = 'admin'.
 *
 * Body:    { email, studentId, parentName }
 * Returns: { created, skipped, userId? }
 *          — No password field in the response.
 */

// ── Auth guard ─────────────────────────────────────────────────────────────

/**
 * Verifies the caller is a logged-in admin by:
 *   1. Validating the Supabase JWT (getUser — server-side validation, not local cache)
 *   2. Reading profiles.role from the database
 *
 * No email-list allowlist. No bypass cookies. No demo modes.
 */
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

    // Role check via DB — the only source of truth
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

// ── Password generation ────────────────────────────────────────────────────

/**
 * Generates a cryptographically secure temporary password.
 * Uses 16 random bytes encoded as base64url → 22 printable chars, no ambiguous characters.
 * Pattern: `<16-char-random>` — completely unpredictable, not derivable from email.
 */
function generateSecureTemporaryPassword(): string {
  return randomBytes(16).toString("base64url")
}

// ── Service-role admin client ──────────────────────────────────────────────

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error("Supabase service role key is not configured")
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// ── Route handler ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // ── Auth guard: only verified admins may call this ──────────────────
    const authorized = await isAuthorizedAdmin(request)
    if (!authorized) {
      return NextResponse.json(
        { error: "Unauthorized — admin access required" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { email, studentId, parentName } = body as {
      email: string
      studentId: string
      parentName: string
    }

    if (!email || !studentId) {
      return NextResponse.json(
        { error: "Missing required fields: email, studentId" },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { created: false, skipped: true, reason: "service_role_not_configured" }
      )
    }

    const adminSupabase = getAdminClient()
    const normalizedEmail = email.trim().toLowerCase()

    // ── Idempotency: check if account already exists ────────────────────
    const { data: existingProfile } = await adminSupabase
      .from("profiles")
      .select("id, child_id")
      .eq("email", normalizedEmail)
      .maybeSingle()

    if (existingProfile) {
      // Ensure parent↔student linkage is current
      await adminSupabase
        .from("profiles")
        .update({ child_id: studentId })
        .eq("email", normalizedEmail)

      await adminSupabase
        .from("students")
        .update({ parent_id: existingProfile.id, parent_email: normalizedEmail })
        .eq("id", studentId)

      return NextResponse.json({ created: false, skipped: true, userId: existingProfile.id })
    }

    // ── Generate a cryptographically secure temporary password ──────────
    // SECURITY: The password is created here, stored in Supabase Auth, and
    // is NOT included in the API response. The admin UI must never display it.
    // The parent must use the "Forgot Password" flow to set their own password.
    const tempPassword = generateSecureTemporaryPassword()

    // ── Create the Auth user ────────────────────────────────────────────
    const { data: authData, error: createError } = await adminSupabase.auth.admin.createUser({
      email: normalizedEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: parentName || normalizedEmail.split("@")[0] },
    })

    if (createError) {
      // Handle race condition where user was created between our check and insert
      if (
        createError.message?.toLowerCase().includes("already") ||
        createError.message?.toLowerCase().includes("exists")
      ) {
        const { data: fallbackProfile } = await adminSupabase
          .from("profiles")
          .select("id")
          .eq("email", normalizedEmail)
          .maybeSingle()
        return NextResponse.json({ created: false, skipped: true, userId: fallbackProfile?.id })
      }
      console.error("[create-parent-account] createUser failed:", createError.message)
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    const userId = authData.user?.id
    if (!userId) {
      return NextResponse.json({ error: "User created but ID not returned" }, { status: 500 })
    }

    // ── Upsert profile row ──────────────────────────────────────────────
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
      // Non-fatal: auth user was created; profile write can be retried.
      console.error("[create-parent-account] profile upsert failed:", profileError.message)
    }

    // ── Backlink student → parent ───────────────────────────────────────
    const { error: studentLinkError } = await adminSupabase
      .from("students")
      .update({ parent_id: userId, parent_email: normalizedEmail })
      .eq("id", studentId)

    if (studentLinkError) {
      console.warn("[create-parent-account] students.parent_id backlink failed:", studentLinkError.message)
    }

    // ── IMPORTANT: password is intentionally NOT included in the response ─
    // The admin should send login credentials to the parent via a separate
    // secure channel. The parent must use "Forgot Password" to set their own.
    return NextResponse.json({ created: true, skipped: false, userId })

  } catch (err: any) {
    console.error("[create-parent-account] Unexpected error:", err?.message)
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    )
  }
}
