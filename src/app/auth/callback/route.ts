import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

const ADMIN_EMAILS = new Set(["admin@school.com", "sehrawatsonia27@gmail.com"])

function isAdminEmail(email: string): boolean {
  const lower = email.toLowerCase()
  const bySet = ADMIN_EMAILS.has(lower)
  const byName = lower.includes("admin")
  console.log(`[auth/callback] isAdminEmail("${lower}") → bySet=${bySet} byName=${byName}`)
  return bySet || byName
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  console.log(`[auth/callback] Incoming — code present: ${!!code}`)
  console.log(`[auth/callback] Incoming cookies: ${request.cookies.getAll().map(c => c.name).join(", ") || "none"}`)

  if (!code) {
    console.warn("[auth/callback] No code — bail")
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
            console.log(`[auth/callback] setAll: setting cookie "${name}"`)
            pendingCookies.push({ name, value, options: options ?? {} })
          })
        },
      },
    }
  )

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error("[auth/callback] exchangeCodeForSession FAILED:", exchangeError.message, exchangeError)
    const errResponse = NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
    pendingCookies.forEach(({ name, value, options }) =>
      errResponse.cookies.set(name, value, options as Parameters<typeof errResponse.cookies.set>[2])
    )
    return errResponse
  }

  console.log(`[auth/callback] exchangeCodeForSession OK — cookies to forward: ${pendingCookies.length}`)

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  console.log(`[auth/callback] getUser → id="${user?.id}" email="${user?.email}" userError="${userError?.message}"`)

  let destination = "/dashboard/parent"

  if (user?.email) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    console.log(`[auth/callback] profile → role="${profile?.role}" profileError="${profileError?.message}"`)

    const adminByEmail = isAdminEmail(user.email)
    const adminByProfile = profile?.role === "admin"
    console.log(`[auth/callback] adminByEmail=${adminByEmail} adminByProfile=${adminByProfile}`)

    if (adminByProfile || adminByEmail) {
      destination = "/dashboard/admin"
    }
  }

  console.log(`[auth/callback] Final destination: ${origin}${destination}`)

  const finalResponse = NextResponse.redirect(`${origin}${destination}`)
  pendingCookies.forEach(({ name, value, options }) =>
    finalResponse.cookies.set(name, value, options as Parameters<typeof finalResponse.cookies.set>[2])
  )

  return finalResponse
}
