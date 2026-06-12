import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "./lib/supabase-middleware"
import { inferRoleFromEmail } from "./lib/types"

/**
 * Determine the effective role for a user.
 * Email-based admin detection always wins over the DB profile value so that
 * known admin emails are never accidentally downgraded to 'parent' by a
 * stale database row.
 */
function resolveRole(dbRole: string | undefined | null, email: string | null | undefined): string {
  const emailRole = email ? inferRoleFromEmail(email) : "parent"
  // If email is a known admin, always admin — regardless of DB value
  if (emailRole === "admin") return "admin"
  // Otherwise trust the DB, falling back to email inference
  return dbRole || emailRole
}

// Paths that never require authentication
const PUBLIC_PATHS = [
  "/",
  "/about",
  "/programs",
  "/gallery",
  "/admissions",
  "/contact",
  "/parent-corner",
]

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Exclude system and API routes from redirects ──────────────────────────
  if (
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next()
  }

  // ── /login: if already authenticated, bounce to dashboard ────────────────
  if (pathname === "/login") {
    // Bypass cookie (demo/dev mode)
    if (process.env.NODE_ENV === "development") {
      const bypassCookie = request.cookies.get("hk_bypass_user")
      if (bypassCookie?.value) {
        try {
          const bypassUser = JSON.parse(decodeURIComponent(bypassCookie.value))
          const target = bypassUser.role === "admin" ? "/dashboard/admin" : "/dashboard/parent"
          return NextResponse.redirect(new URL(target, request.url))
        } catch { /* malformed cookie — ignore */ }
      }
    }

    const { supabase, supabaseResponse } = createClient(request)
    const { data: { user }, error } = await supabase.auth.getUser()

    if (!error && user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()

      const role = resolveRole(profile?.role, user.email)
      const target = role === "admin" ? "/dashboard/admin" : "/dashboard/parent"

      // Preserve any refreshed session cookies on the redirect
      const redirectResponse = NextResponse.redirect(new URL(target, request.url))
      supabaseResponse.cookies.getAll().forEach(({ name, value, ...rest }) => {
        redirectResponse.cookies.set(name, value, rest)
      })
      return redirectResponse
    }

    return supabaseResponse
  }

  // ── Other public paths ────────────────────────────────────────────────────
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // ── Protected: /dashboard/* ───────────────────────────────────────────────
  if (pathname.startsWith("/dashboard")) {
    // Bypass cookie (demo/dev mode) — check first, no Supabase call needed
    if (process.env.NODE_ENV === "development") {
      const bypassCookie = request.cookies.get("hk_bypass_user")
      if (bypassCookie?.value) {
        try {
          const bypassUser = JSON.parse(decodeURIComponent(bypassCookie.value))
          const role: string = bypassUser.role

          if (pathname.startsWith("/dashboard/admin") && role !== "admin") {
            return NextResponse.redirect(new URL("/dashboard/parent", request.url))
          }
          if (pathname.startsWith("/dashboard/parent") && role !== "parent") {
            return NextResponse.redirect(new URL("/dashboard/admin", request.url))
          }
          return NextResponse.next()
        } catch { /* malformed cookie — fall through to Supabase check */ }
      }
    }

    const { supabase, supabaseResponse } = createClient(request)

    let role: string | null = null
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (!error && user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle()
        role = resolveRole(profile?.role, user.email)
      }
    } catch { /* network error — treat as unauthenticated */ }

    if (!role) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Role-based access control
    if (pathname.startsWith("/dashboard/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard/parent", request.url))
    }
    if (pathname.startsWith("/dashboard/parent") && role !== "parent") {
      return NextResponse.redirect(new URL("/dashboard/admin", request.url))
    }

    // Always return supabaseResponse so refreshed tokens are forwarded
    return supabaseResponse
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Run on everything except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon\\.ico|images/.*\\.(?:mp4|jpg|jpeg|gif|png|svg|webp)$).*)",
  ],
}
