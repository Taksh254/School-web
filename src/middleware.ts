import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "./lib/supabase-middleware"

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

function redirectWithCookies(request: NextRequest, targetUrl: string, supabaseResponse: NextResponse) {
  const redirectResponse = NextResponse.redirect(new URL(targetUrl, request.url))
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie.name, cookie.value, {
      path: cookie.path,
      domain: cookie.domain,
      maxAge: cookie.maxAge,
      expires: cookie.expires,
      secure: cookie.secure,
      httpOnly: cookie.httpOnly,
      sameSite: cookie.sameSite,
    })
  })
  return redirectResponse
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Exclude system and API routes from auth checks ─────────────────────
  if (
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next()
  }

  // ── Login page: pass through (redirect handled client-side after hydration) ──
  if (pathname === "/login" || pathname === "/forgot-password") {
    return NextResponse.next()
  }

  // ── Public pages: pass through ────────────────────────────────────────
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // ── Protected: /dashboard/* ───────────────────────────────────────────
  if (pathname.startsWith("/dashboard")) {
    const { supabase, supabaseResponse } = createClient(request)

    let role: string | null = null

    try {
      // getUser() validates the JWT against Supabase servers — cannot be spoofed.
      const { data: { user }, error } = await supabase.auth.getUser()

      if (!error && user) {
        // Role comes exclusively from the DB profile — never from email pattern matching.
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle()

        role = profile?.role || null
      }
    } catch (err: any) {
      // Log on server only — never expose session details to the client.
      console.error(`[middleware] Session check failed for ${pathname}:`, err?.message)
    }

    if (!role) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return redirectWithCookies(request, loginUrl.pathname + loginUrl.search, supabaseResponse)
    }

    // Role-based access control
    if (pathname.startsWith("/dashboard/admin") && role !== "admin") {
      return redirectWithCookies(request, "/dashboard/parent", supabaseResponse)
    }
    if (pathname.startsWith("/dashboard/parent") && role !== "parent") {
      return redirectWithCookies(request, "/dashboard/admin", supabaseResponse)
    }

    // Always return supabaseResponse so refreshed tokens propagate via Set-Cookie.
    return supabaseResponse
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Run on everything except static assets and Next.js internals
    "/((?!_next/static|_next/image|favicon\\.ico|images/.*\\.(?:mp4|jpg|jpeg|gif|png|svg|webp)$).*)",
  ],
}
