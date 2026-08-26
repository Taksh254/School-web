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

  // ── Password change routes: whitelist & prevent redirect loop ────────
  if (pathname.startsWith("/auth/parent-change-password")) {
    const parentSession = await getParentSession(request)
    if (!parentSession) {
      return NextResponse.redirect(new URL("/login?tab=parent", request.url))
    }
    // Session is valid — permit access to change password page (no redirect loops)
    return NextResponse.next()
  }

  // ── Other /auth/* routes: pass through (callback, reset-password, change-password) ─
  if (pathname.startsWith("/auth/")) {
    return NextResponse.next()
  }

  // ── Public pages: pass through ────────────────────────────────────────
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

// ── Protected: /dashboard/* ──────────────────────────────────────────
  if (pathname.startsWith("/dashboard")) {
    const parentSession = await getParentSession(request)

    // Handle /dashboard/parent/* with parent_session cookie
    if (pathname.startsWith("/dashboard/parent") && parentSession) {
      if (parentSession.mustChangePassword) {
        return NextResponse.redirect(new URL("/auth/parent-change-password", request.url))
      }
      return NextResponse.next()
    }

    // Check Supabase Auth session
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

        if (profile?.role) {
          role = profile.role
        } else if (user.email) {
          const { data: teacherRecord } = await supabase
            .from("teachers")
            .select("id")
            .ilike("email", user.email.trim())
            .maybeSingle()

          if (teacherRecord) {
            role = "teacher"
          } else {
            role = "parent"
          }
        } else {
          role = "parent"
        }
      }
    } catch {
      // Non-fatal session lookup error
    }

    // If no Supabase user but parent cookie exists, route to /dashboard/parent
    if (!role && parentSession) {
      if (parentSession.mustChangePassword) {
        return NextResponse.redirect(new URL("/auth/parent-change-password", request.url))
      }
      if (pathname === "/dashboard" || pathname === "/dashboard/") {
        return NextResponse.redirect(new URL("/dashboard/parent", request.url))
      }
      if (pathname.startsWith("/dashboard/parent")) {
        return NextResponse.next()
      }
      // Parent cookie attempting to access admin or teacher dashboard -> redirect to parent
      return NextResponse.redirect(new URL("/dashboard/parent", request.url))
    }

    // Unauthenticated -> redirect to /login
    if (!role) {
      const loginUrl = new URL("/login", request.url)
      if (pathname.startsWith("/dashboard/parent")) {
        loginUrl.searchParams.set("tab", "parent")
      } else if (pathname !== "/dashboard" && pathname !== "/dashboard/") {
        loginUrl.searchParams.set("redirect", pathname)
      }
      return redirectWithCookies(request, loginUrl.pathname + loginUrl.search, authClient.supabaseResponse)
    }

    // Root /dashboard route
    if (pathname === "/dashboard" || pathname === "/dashboard/") {
      const target =
        role === "admin"
          ? "/dashboard/admin"
          : role === "teacher"
          ? "/dashboard/teacher"
          : "/dashboard/parent"
      return redirectWithCookies(request, target, authClient.supabaseResponse)
    }

    // Role enforcement
    if (pathname.startsWith("/dashboard/admin") && role !== "admin") {
      const fallback = role === "teacher" ? "/dashboard/teacher" : "/dashboard/parent"
      return redirectWithCookies(request, fallback, authClient.supabaseResponse)
    }

    if (pathname.startsWith("/dashboard/teacher") && role !== "teacher" && role !== "admin") {
      return redirectWithCookies(request, "/dashboard/parent", authClient.supabaseResponse)
    }

    if (pathname.startsWith("/dashboard/parent") && role !== "parent" && role !== "admin") {
      const fallback = role === "teacher" ? "/dashboard/teacher" : "/dashboard/admin"
      return redirectWithCookies(request, fallback, authClient.supabaseResponse)
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
