import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

const ADMIN_EMAILS = ["admin@school.com", "sehrawatsonia27@gmail.com"]

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  // No code → bail out immediately
  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
  }

  // ── Build a response that will carry the new session cookies ──
  // We start with a temporary redirect target; we'll override it once we know the role.
  // IMPORTANT: we must use the SAME response object for both cookie-writing AND the final
  // redirect, otherwise the Set-Cookie headers from exchangeCodeForSession are lost.
  const response = NextResponse.redirect(`${origin}/login?error=auth_callback_error`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        // Write cookies onto `response` so they travel with the redirect
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error("[auth/callback] exchangeCodeForSession error:", exchangeError.message)
    // response already points to error URL – return it (with any partial cookies)
    return response
  }

  // Session exchanged successfully — determine destination
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return response // still points to error URL
  }

  // Try to read the stored profile role first
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  const email = (user.email || "").toLowerCase()
  const isAdmin =
    profile?.role === "admin" ||
    ADMIN_EMAILS.includes(email) ||
    email.includes("admin")

  const destination = isAdmin ? "/dashboard/admin" : "/dashboard/parent"

  // Override the redirect URL while keeping all cookies on the same response object
  response.headers.set("location", `${origin}${destination}`)

  return response
}
