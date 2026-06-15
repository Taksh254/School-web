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

  const { data: { user } } = await supabase.auth.getUser()

  let destination = "/dashboard/parent"

  if (user?.email) {
    const email = user.email.trim().toLowerCase()
    const name = user.user_metadata?.full_name || user.user_metadata?.name || email.split("@")[0]
    const correctRole = isAdminEmail(email) ? "admin" : "parent"

    // Ensure profile has the correct role (create or update)
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    if (!existingProfile) {
      await supabase.from("profiles").insert({
        id: user.id,
        email,
        name,
        role: correctRole,
      })
    } else if (existingProfile.role !== correctRole) {
      await supabase
        .from("profiles")
        .update({ email, name, role: correctRole })
        .eq("id", user.id)
    }

    if (correctRole === "admin") {
      destination = "/dashboard/admin"
    }
  }

  const finalResponse = NextResponse.redirect(`${origin}${destination}`)
  pendingCookies.forEach(({ name, value, options }) =>
    finalResponse.cookies.set(name, value, options as Parameters<typeof finalResponse.cookies.set>[2])
  )

  return finalResponse
}
