import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "./lib/supabase-middleware"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
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

function getParentSession(request: NextRequest): ParentSession | null {
  const token = request.cookies.get(PARENT_COOKIE)?.value
  if (!token || !JWT_SECRET) return null
  try {
    const payload = jwt.verify(token, JWT_SECRET) as ParentSession
    if (payload.role !== "parent") return null
    return payload
  } catch {
    return null
  }
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

  // ── Login / forgot password: pass through ────────────────────────────
  if (pathname === "/login" || pathname === "/forgot-password") {
    return NextResponse.next()
  }

  // ── Parent change-password page: validate parent session only ─────────
  if (pathname === "/auth/parent-change-password") {
    const parentSession = getParentSession(request)
    if (!parentSession) {
      return NextResponse.redirect(new URL("/login?tab=parent", request.url))
    }
    return NextResponse.next()
  }

  // ── Public pages: pass through ────────────────────────────────────────
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // ── Protected: /dashboard/parent/* → validate parent_session cookie ───
  if (pathname.startsWith("/dashboard/parent")) {
    const parentSession = getParentSession(request)
    if (!parentSession) {
      return NextResponse.redirect(new URL("/login?tab=parent", request.url))
    }
    // Forced password change
    if (parentSession.mustChangePassword) {
      return NextResponse.redirect(new URL("/auth/parent-change-password", request.url))
    }
    return NextResponse.next()
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

        role = profile?.role || "admin"
      }
    } catch (err: any) {
      console.error(`[middleware] Session check failed for ${pathname}:`, err?.message)
    }

    if (!role) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return redirectWithCookies(request, loginUrl.pathname + loginUrl.search, authClient.supabaseResponse)
    }

    // Resolve the root /dashboard
    if (pathname === "/dashboard" || pathname === "/dashboard/") {
      return redirectWithCookies(
        request,
        role === "admin" ? "/dashboard/admin" : "/login?tab=parent",
        authClient.supabaseResponse
      )
    }

    // Admin-only: non-admin users cannot access /dashboard/admin
    if (pathname.startsWith("/dashboard/admin") && role !== "admin") {
      return redirectWithCookies(request, "/login?tab=parent", authClient.supabaseResponse)
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

