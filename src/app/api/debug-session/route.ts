import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

const ADMIN_EMAILS = new Set(["admin@school.com", "sehrawatsonia27@gmail.com"])

export async function GET(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll() {},
      },
    }
  )

  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  let profile = null
  if (user?.id) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
    profile = data
  }

  const email = user?.email ?? null
  const emailLower = email?.toLowerCase() ?? null
  const isAdminByEmail = emailLower ? (ADMIN_EMAILS.has(emailLower) || emailLower.includes("admin")) : false

  return NextResponse.json({
    // Session info
    hasSession: !!session,
    sessionError: sessionError?.message ?? null,
    userError: userError?.message ?? null,

    // User info from Supabase Auth
    userId: user?.id ?? null,
    email: user?.email ?? null,
    emailLower,
    provider: user?.app_metadata?.provider ?? null,
    providers: user?.app_metadata?.providers ?? null,
    confirmedAt: user?.confirmed_at ?? null,

    // Role determination
    profileRole: profile?.role ?? null,
    profileExists: !!profile,
    isAdminByEmail,
    effectiveRole: isAdminByEmail ? "admin" : (profile?.role ?? "parent"),

    // Cookies present (names only, not values)
    cookieNames: request.cookies.getAll().map(c => c.name),

    // Admin list
    adminEmails: [...ADMIN_EMAILS],
  })
}
