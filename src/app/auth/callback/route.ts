import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? ""
  const type = searchParams.get("type") ?? ""

  if (!code) {
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
            pendingCookies.push({ name, value, options: options ?? {} })
          })
        },
      },
    }
  )

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
  const isRecovery = type === "recovery" || next.startsWith("/auth/reset-password")

  if (isRecovery) {
    const recoveryUrl = `${origin}/auth/reset-password`
    const recoveryResponse = NextResponse.redirect(recoveryUrl)
    pendingCookies.forEach(({ name, value, options }) =>
      recoveryResponse.cookies.set(name, value, options as Parameters<typeof recoveryResponse.cookies.set>[2])
    )
    return recoveryResponse
  }

  // ── Normal sign-in / OAuth flow ───────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()
  
  let destination = "/dashboard/parent"

  if (user?.email) {
    const email = user.email.trim().toLowerCase()
    const name = user.user_metadata?.full_name || user.user_metadata?.name || email.split("@")[0]

    // Fetch existing profile
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    if (!existingProfile) {
      // Create new profile as parent by default.
      // Admin accounts must be created manually or via SQL.
      await supabase.from("profiles").insert({
        id: user.id,
        email,
        name,
        role: "parent",
      })
    }
    
    // Route based on DB role
    if (existingProfile?.role === "admin") {
      destination = "/dashboard/admin"
    }
  }

  // Honor a safe `next` redirect if provided
  if (next && next.startsWith("/") && !next.startsWith("/auth/reset-password")) {
    destination = next
  }

  const finalResponse = NextResponse.redirect(`${origin}${destination}`)
  pendingCookies.forEach(({ name, value, options }) =>
    finalResponse.cookies.set(name, value, options as Parameters<typeof finalResponse.cookies.set>[2])
  )

  return finalResponse
}
