import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

const ADMIN_EMAILS = new Set(["admin@school.com", "sehrawatsonia27@gmail.com"])

function isAdminEmail(email: string): boolean {
  const lower = email.toLowerCase()
  return ADMIN_EMAILS.has(lower) || lower.includes("admin")
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  // ── No code param ── (user landed here without going through Google)
  if (!code) {
    console.warn("[auth/callback] No code param — redirecting to login error")
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
  }

  // ── Collect all cookies that Supabase wants to set ──
  // We cannot mutate NextResponse.redirect's Location header after creation,
  // so we collect cookies into an array and stamp them onto a fresh redirect
  // once we know the destination.
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
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Accumulate; we'll apply them to the final response below
          cookiesToSet.forEach(({ name, value, options }) => {
            pendingCookies.push({ name, value, options: options ?? {} })
          })
        },
      },
    }
  )

  // ── Exchange the one-time code for a session ──
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error("[auth/callback] exchangeCodeForSession failed:", exchangeError.message)
    const errResponse = NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
    pendingCookies.forEach(({ name, value, options }) =>
      errResponse.cookies.set(name, value, options as Parameters<typeof errResponse.cookies.set>[2])
    )
    return errResponse
  }

  // ── Determine the user's role ──
  const { data: { user } } = await supabase.auth.getUser()

  let destination = "/dashboard/parent" // safe default

  if (user?.email) {
    // 1. Try the persisted profile first (most authoritative)
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    if (profile?.role === "admin" || isAdminEmail(user.email)) {
      destination = "/dashboard/admin"
    }
  }

  // ── Build the final redirect with ALL session cookies attached ──
  const finalResponse = NextResponse.redirect(`${origin}${destination}`)
  pendingCookies.forEach(({ name, value, options }) =>
    finalResponse.cookies.set(name, value, options as Parameters<typeof finalResponse.cookies.set>[2])
  )

  return finalResponse
}
