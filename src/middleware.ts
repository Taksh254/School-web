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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log(`[middleware] Incoming request for path: ${pathname}`)

  // ── Exclude system and API routes from redirects ──────────────────────────
  if (
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  ) {
    console.log(`[middleware] Excluded system/API route: ${pathname}`)
    return NextResponse.next()
  }

  // ── /login: let client-side handle dashboard redirects to avoid logout loops ────────────────
  if (pathname === "/login") {
    console.log(`[middleware] /login route accessed — letting client-side handle authentication redirect.`)
    return NextResponse.next()
  }

  // ── Other public paths ────────────────────────────────────────────────────
  if (isPublicPath(pathname)) {
    console.log(`[middleware] Public path: ${pathname}`)
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
          console.log(`[middleware] Dashboard bypass cookie found (role: ${role}) for path: ${pathname}`)

          if (pathname.startsWith("/dashboard/admin") && role !== "admin") {
            console.log(`[middleware] Bypass redirect: Admin role required for path ${pathname}. Redirecting to /dashboard/parent`)
            return NextResponse.redirect(new URL("/dashboard/parent", request.url))
          }
          if (pathname.startsWith("/dashboard/parent") && role !== "parent") {
            console.log(`[middleware] Bypass redirect: Parent role required for path ${pathname}. Redirecting to /dashboard/admin`)
            return NextResponse.redirect(new URL("/dashboard/admin", request.url))
          }
          return NextResponse.next()
        } catch { /* malformed cookie — fall through to Supabase check */ }
      }
    }

    const { supabase, supabaseResponse } = createClient(request)

    let role: string | null = null
    let userObject: any = null
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      console.log(`[middleware] Protected route check — Path: ${pathname}, User: ${user ? user.email : "none"}, Error: ${error?.message || "none"}`)
      if (!error && user) {
        userObject = user
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle()
        role = resolveRole(profile?.role, user.email)
        console.log(`[middleware] Profile role: ${profile?.role || "none"}, Resolved role: ${role}`)
      }
    } catch (err: any) {
      console.error(`[middleware] Network or Supabase error checking session for path ${pathname}:`, err?.message)
    }

    if (!role) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      console.log(`[middleware] Unauthenticated or no role resolved for ${pathname}. Redirecting to login: ${loginUrl.toString()}`)
      return NextResponse.redirect(loginUrl)
    }

    // Role-based access control
    if (pathname.startsWith("/dashboard/admin") && role !== "admin") {
      console.log(`[middleware] RBAC violation: ${userObject?.email} (role: ${role}) accessed ${pathname}. Redirecting to /dashboard/parent`)
      return NextResponse.redirect(new URL("/dashboard/parent", request.url))
    }
    if (pathname.startsWith("/dashboard/parent") && role !== "parent") {
      console.log(`[middleware] RBAC violation: ${userObject?.email} (role: ${role}) accessed ${pathname}. Redirecting to /dashboard/admin`)
      return NextResponse.redirect(new URL("/dashboard/admin", request.url))
    }

    console.log(`[middleware] Access granted to ${userObject?.email} (role: ${role}) for path: ${pathname}`)
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
