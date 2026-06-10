import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "./lib/supabase-middleware"
import { inferRoleFromEmail } from "./lib/types"

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

  // ── /auth/callback: MUST pass through untouched ──────────────────────────
  // The route handler itself sets all session cookies via Set-Cookie. If the
  // middleware intercepts and returns NextResponse.next() here it can strip
  // those headers. Let Next.js serve the route handler directly.
  if (pathname.startsWith("/auth/")) {
    return NextResponse.next()
  }

  // ── /login: if already authenticated, bounce to dashboard ────────────────
  if (pathname === "/login") {
    // Bypass cookie (demo/dev mode)
    const bypassCookie = request.cookies.get("hk_bypass_user")
    if (bypassCookie?.value) {
      try {
        const bypassUser = JSON.parse(decodeURIComponent(bypassCookie.value))
        const target = bypassUser.role === "admin" ? "/dashboard/admin" : "/dashboard/parent"
        return NextResponse.redirect(new URL(target, request.url))
      } catch { /* malformed cookie — ignore */ }
    }

    const { supabase, supabaseResponse } = createClient(request)
    const { data: { user }, error } = await supabase.auth.getUser()

    if (!error && user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()

      const role = profile?.role || (user.email ? inferRoleFromEmail(user.email) : "parent")
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
        role = profile?.role || (user.email ? inferRoleFromEmail(user.email) : "parent")
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
