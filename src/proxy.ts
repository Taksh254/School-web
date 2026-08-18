import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "./lib/supabase-middleware"
import { jwtVerify } from "jose"

// ── Constants ──────────────────────────────────────────────────────────────
const JWT_SECRET_RAW = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const PARENT_COOKIE = "parent_session"

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

interface ParentSession {
  studentId: string
  admissionNo: string
  role: "parent"
  mustChangePassword: boolean
}

/**
 * Verifies the parent_session JWT cookie using `jose` (Edge Runtime compatible).
 * `jsonwebtoken` depends on Node.js APIs (process.version, process.nextTick)
 * which are unavailable in the Edge Runtime — hence the switch to jose.
 */
async function getParentSession(request: NextRequest): Promise<ParentSession | null> {
  const token = request.cookies.get(PARENT_COOKIE)?.value
  if (!token || !JWT_SECRET_RAW) return null
  try {
    const secret = new TextEncoder().encode(JWT_SECRET_RAW)
    const { payload } = await jwtVerify(token, secret)
    const session = payload as unknown as ParentSession
    if (session.role !== "parent") return null
    return session
  } catch {
    return null
  }
}

// ── BUG 6 FIX: renamed from `middleware` → `proxy` (Next.js 16 convention)
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Exclude system and API routes from auth checks ─────────────────────
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next()
  }

  // ── Login / forgot password: pass through ────────────────────────────
  if (pathname === "/login" || pathname === "/forgot-password") {
    return NextResponse.next()
  }

  // ── /auth/* routes: pass through EXCEPT /auth/parent-change-password ─
  // BUG 2 FIX: /auth/parent-change-password requires a valid parent_session cookie.
  // All other /auth/* paths (callback, reset-password, etc.) are public.
  if (pathname.startsWith("/auth/") && pathname !== "/auth/parent-change-password") {
    return NextResponse.next()
  }

  // ── Parent change-password page: validate parent session only ─────────
  if (pathname === "/auth/parent-change-password") {
    const parentSession = await getParentSession(request)
    if (!parentSession) {
      return NextResponse.redirect(new URL("/login?tab=parent", request.url))
    }
    return NextResponse.next()
  }

  // ── Public pages: pass through ────────────────────────────────────────
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // ── Protected: /dashboard/parent/* ────────────────────────────────────
  if (pathname.startsWith("/dashboard/parent")) {
    // 1. Check parent_session JWT cookie (admission number login)
    const parentSession = await getParentSession(request)
    if (parentSession) {
      if (parentSession.mustChangePassword) {
        return NextResponse.redirect(new URL("/auth/parent-change-password", request.url))
      }
      return NextResponse.next()
    }

    // 2. Check Supabase Auth session (Google OAuth / Supabase email login)
    const authClient = createClient(request)
    try {
      const { data: { user }, error } = await authClient.supabase.auth.getUser()
      if (!error && user) {
        const { data: profile } = await authClient.supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle()

        const role = profile?.role || "parent"
        if (role === "parent" || role === "admin") {
          return authClient.supabaseResponse
        }
      }
    } catch (err: any) {
      console.error(`[proxy] Parent session check failed for ${pathname}:`, err?.message)
    }

    // Unauthenticated -> redirect to parent login tab
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("tab", "parent")
    return NextResponse.redirect(loginUrl)
  }

  // ── Protected: /dashboard/admin/* and /dashboard → Supabase JWT ───────
  if (pathname.startsWith("/dashboard")) {
    const authClient = createClient(request)
    const supabase = authClient.supabase

    let role: string | null = null

    try {
      const { data: { user }, error } = await supabase.auth.getUser()

      if (!error && user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle()

        role = profile?.role || "parent"
      }
    } catch (err: any) {
      console.error(`[proxy] Session check failed for ${pathname}:`, err?.message)
    }

    // Check if user has parent cookie session for root /dashboard
    if (!role) {
      const parentSession = await getParentSession(request)
      if (parentSession) {
        if (parentSession.mustChangePassword) {
          return NextResponse.redirect(new URL("/auth/parent-change-password", request.url))
        }
        return NextResponse.redirect(new URL("/dashboard/parent", request.url))
      }
      const loginUrl = new URL("/login", request.url)
      if (pathname !== "/dashboard" && pathname !== "/dashboard/") {
        loginUrl.searchParams.set("redirect", pathname)
      }
      return redirectWithCookies(request, loginUrl.pathname + loginUrl.search, authClient.supabaseResponse)
    }

    // Resolve the root /dashboard
    if (pathname === "/dashboard" || pathname === "/dashboard/") {
      return redirectWithCookies(
        request,
        role === "admin" ? "/dashboard/admin" : "/dashboard/parent",
        authClient.supabaseResponse
      )
    }

    // Admin-only: non-admin users cannot access /dashboard/admin
    if (pathname.startsWith("/dashboard/admin") && role !== "admin") {
      return redirectWithCookies(request, "/dashboard/parent", authClient.supabaseResponse)
    }

    return authClient.supabaseResponse
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|images/.*\\.(?:mp4|jpg|jpeg|gif|png|svg|webp)$).*)",
  ],
}
