import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"
import { ADMIN_EMAILS } from "@/lib/types"

function isAdminEmail(email: string): boolean {
  const lower = email.toLowerCase()
  return ADMIN_EMAILS.includes(lower)
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  // `next` is set when Supabase redirects via PKCE and we need to send the user
  // somewhere other than the dashboard (e.g. password reset).
  const next = searchParams.get("next") ?? ""
  const type = searchParams.get("type") ?? ""

  console.log(`[auth/callback] GET request received. Origin: ${origin}, Code present: ${!!code}, type: ${type}, next: ${next}`)

  if (!code) {
    console.warn("[auth/callback] Missing code. Redirecting to login with error.")
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
  }

  const pendingCookies: Array<{
    name: string
    value: string
    options: Record<string, unknown>
  }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            console.log(`[auth/callback] Cookie to set: ${name}`)
            pendingCookies.push({ name, value, options: options ?? {} })
          })
        },
      },
    }
  )

  console.log("[auth/callback] Exchanging OAuth code for session...")
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error("[auth/callback] exchangeCodeForSession FAILED:", exchangeError.message)
    const errResponse = NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
    pendingCookies.forEach(({ name, value, options }) =>
      errResponse.cookies.set(name, value, options as Parameters<typeof errResponse.cookies.set>[2])
    )
    return errResponse
  }

  // ── Password-recovery flow ────────────────────────────────────────────────
  // When a user clicks a password-reset link, Supabase exchanges the PKCE code
  // here and then the user must be sent to /auth/reset-password (NOT the
  // dashboard) so they can choose a new password.
  //
  // Supabase signals a recovery flow in two ways:
  //   1. `type=recovery` query param on the callback URL  (some versions)
  //   2. `next` param contains "/auth/reset-password"     (when redirectTo is set)
  //
  // We check both so the flow works regardless of Supabase version.
  const isRecovery = type === "recovery" || next.startsWith("/auth/reset-password")

  if (isRecovery) {
    console.log("[auth/callback] Recovery flow detected — redirecting to /auth/reset-password")
    const recoveryUrl = `${origin}/auth/reset-password`
    const recoveryResponse = NextResponse.redirect(recoveryUrl)
    pendingCookies.forEach(({ name, value, options }) =>
      recoveryResponse.cookies.set(name, value, options as Parameters<typeof recoveryResponse.cookies.set>[2])
    )
    return recoveryResponse
  }

  // ── Normal sign-in / OAuth flow ───────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()
  console.log(`[auth/callback] User authenticated successfully: ${user ? user.email : "none"} (ID: ${user ? user.id : "none"})`)

  let destination = "/dashboard/parent"

  if (user?.email) {
    const email = user.email.trim().toLowerCase()
    const name = user.user_metadata?.full_name || user.user_metadata?.name || email.split("@")[0]
    const correctRole = isAdminEmail(email) ? "admin" : "parent"

    console.log(`[auth/callback] Resolving role for ${email}. Email matches admin: ${isAdminEmail(email)}`)

    // Ensure profile has the correct role (create or update)
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    console.log(`[auth/callback] Existing DB profile:`, existingProfile)

    if (!existingProfile) {
      console.log(`[auth/callback] Creating profile for user ${user.id} with role ${correctRole}`)
      await supabase.from("profiles").insert({
        id: user.id,
        email,
        name,
        role: correctRole,
      })
    } else if (existingProfile.role !== correctRole) {
      console.log(`[auth/callback] Updating profile role for user ${user.id} from ${existingProfile.role} to ${correctRole}`)
      await supabase
        .from("profiles")
        .update({ email, name, role: correctRole })
        .eq("id", user.id)
    }

    if (correctRole === "admin") {
      destination = "/dashboard/admin"
    }
  }

  // Honor a safe `next` redirect if provided (and it's not a recovery path)
  if (next && next.startsWith("/") && !next.startsWith("/auth/reset-password")) {
    destination = next
  }

  console.log(`[auth/callback] Redirecting user to destination: ${destination}`)
  const finalResponse = NextResponse.redirect(`${origin}${destination}`)
  pendingCookies.forEach(({ name, value, options }) =>
    finalResponse.cookies.set(name, value, options as Parameters<typeof finalResponse.cookies.set>[2])
  )

  return finalResponse
}
