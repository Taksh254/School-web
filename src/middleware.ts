import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "./lib/supabase-middleware"

const publicPaths = ["/login", "/", "/about", "/programs", "/gallery", "/admissions", "/contact", "/parent-corner"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    // If already logged in, redirect to dashboard
    if (pathname === "/login") {
      const { supabase } = createClient(request)
      const { data: { user }, error } = await supabase.auth.getUser()

      if (!error && user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle()

        const role = profile?.role || (user.email?.toLowerCase().includes("admin") ? "admin" : "parent")
        const target = role === "admin" ? "/dashboard/admin" : "/dashboard/parent"
        return NextResponse.redirect(new URL(target, request.url))
      }
    }
    return NextResponse.next()
  }

  // Protect all dashboard and admin routes
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    const { supabase, supabaseResponse } = createClient(request)
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Role check
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    const role = profile?.role || (user.email?.toLowerCase().includes("admin") ? "admin" : "parent")

    // Admin routes - only admins
    if (pathname.startsWith("/dashboard/admin") || pathname.startsWith("/admin")) {
      if (role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard/parent", request.url))
      }
      return supabaseResponse
    }

    // Parent routes - only parents
    if (pathname.startsWith("/dashboard/parent") || pathname.startsWith("/parent")) {
      if (role !== "parent") {
        return NextResponse.redirect(new URL("/dashboard/admin", request.url))
      }
      return supabaseResponse
    }

    return supabaseResponse
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/.*\\.(?:mp4|jpg|jpeg|gif|png|svg|webp)$).*)",
  ],
}
