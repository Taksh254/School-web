import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

/**
 * Creates a Supabase server client that correctly refreshes session cookies
 * and forwards them on the outgoing response.
 *
 * IMPORTANT: always return `supabaseResponse` (or a response that copies its
 * cookies) — never return NextResponse.next() / NextResponse.redirect() without
 * forwarding the cookies, otherwise token refreshes are silently lost.
 */
export function createClient(request: NextRequest) {
  // Start with a pass-through response
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // 1. Mutate the request object so later getAll() calls see fresh values
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          // 2. Rebuild supabaseResponse so it carries the new Set-Cookie headers
          //    Keep the same { request } context so Next.js doesn't lose headers
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  return { supabase, supabaseResponse }
}
