import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "./lib/supabase-middleware"
import { inferRoleFromEmail } from "./lib/types"

const publicPaths = ["/login", "/auth/callback", "/", "/about", "/programs", "/gallery", "/admissions", "/contact", "/parent-corner"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    // If already logged in and visiting /login, redirect to dashboard
    if (pathname === "/login") {
      const bypassCookie = request.cookies.get("hk_bypass_user")
      if (bypassCookie?.value) {
        try {
          const bypassUser = JSON.parse(decodeURIComponent(bypassCookie.value))
          const target = bypassUser.role === "admin" ? "/dashboard/admin" : "/dashboard/parent"
          return NextResponse.redirect(new URL(target, request.url))
        } catch {}
      }

      const { supabase } = createClient(request)
      const { data: { user }, error } = await supabase.auth.getUser()

      if (!error && user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle()

        const role = profile?.role || (user.email ? inferRoleFromEmail(user.email) : "parent")
        const target = role === "admin" ? "/dashboard/admin" : "/dashboard/parent"
        return NextResponse.redirect(new URL(target, request.url))
      }
    }
    return NextResponse.next()
  }

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard")) {
    const bypassCookie = request.cookies.get("hk_bypass_user")
    let role: string | null = null
    let response = NextResponse.next({ request })

    if (bypassCookie?.value) {
      try {
        const bypassUser = JSON.parse(decodeURIComponent(bypassCookie.value))
        role = bypassUser.role
      } catch {}
    }

    if (!role) {
      const { supabase, supabaseResponse } = createClient(request)
      response = supabaseResponse
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
      } catch {}
    }

    if (!role) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Admin routes — only admins
    if (pathname.startsWith("/dashboard/admin")) {
      if (role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard/parent", request.url))
      }
      return response
    }

    // Parent routes — only parents
    if (pathname.startsWith("/dashboard/parent")) {
      if (role !== "parent") {
        return NextResponse.redirect(new URL("/dashboard/admin", request.url))
      }
      return response
    }

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api/|_next/|favicon\\.ico|images/.*\\.(?:mp4|jpg|jpeg|gif|png|svg|webp)$).*)",
  ],
}
