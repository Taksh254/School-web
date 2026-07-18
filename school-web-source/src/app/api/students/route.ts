import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

/**
 * /api/students  — server-side student mutations using the Service Role Key
 * so writes always succeed regardless of the client's JWT / RLS state.
 *
 * All requests are verified to originate from an authenticated admin user
 * before any mutation is performed.
 *
 * POST   { action: "add",    data: StudentRow }                → { student }
 * POST   { action: "update", id: string, data: Partial<StudentRow> } → { ok }
 * POST   { action: "delete", id: string }                     → { ok }
 * POST   { action: "bulk",   data: StudentRow[] }              → { students }
 */

/**
 * Returns true if the incoming request comes from an authenticated admin.
 * Verifies the Supabase JWT and checks profiles.role in the DB.
 */
async function isAuthorizedAdmin(request: NextRequest): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) return false

  try {
    const supabaseResponse = NextResponse.next({ request })
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    })
    
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return false

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    return profile?.role === "admin"
  } catch (err) {
    console.error("[students/auth] Session check failed:", err)
  }

  return false
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase service role not configured")
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

const VALID_PROGRAMS = ["Play Group", "Nursery", "LKG", "UKG"] as const

function validateAndFixRow(dbRow: any): { row: any; error?: string } {
  const row = { ...dbRow }
  if (row.program !== undefined && !VALID_PROGRAMS.includes(row.program)) {
    console.warn("[students] Invalid program value received:", JSON.stringify(row.program))
    return { row, error: `Invalid program "${row.program}". Allowed: ${VALID_PROGRAMS.join(", ")}` }
  }
  return { row }
}

export async function POST(request: NextRequest) {
  try {
    const authorized = await isAuthorizedAdmin(request)
    if (!authorized) {
      return NextResponse.json(
        { error: "Unauthorized — admin access required" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action } = body as { action: string }

    const admin = getAdminClient()

    if (action === "add") {
      const { data: rawRow } = body as { data: any }
      const { row: dbRow, error: validationError } = validateAndFixRow(rawRow)
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 })
      }

      const { data: inserted, error } = await admin
        .from("students")
        .insert([dbRow])
        .select()
        .single()

      if (error) {
        console.error("[students/add] error:", error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ student: inserted })
    }

    if (action === "update") {
      const { id, data: rawRow } = body as { id: string; data: any }
      const { row: dbRow, error: validationError } = validateAndFixRow(rawRow)
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 })
      }

      const { error } = await admin
        .from("students")
        .update(dbRow)
        .eq("id", id)

      if (error) {
        console.error("[students/update] error:", error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ ok: true })
    }

    if (action === "delete") {
      const { id } = body as { id: string }
      const { error } = await admin.from("students").delete().eq("id", id)

      if (error) {
        console.error("[students/delete] error:", error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ ok: true })
    }

    if (action === "bulk") {
      const { data: rawRows } = body as { data: any[] }
      const validatedRows: any[] = []
      for (const rawRow of rawRows) {
        const { row, error: ve } = validateAndFixRow(rawRow)
        if (ve) return NextResponse.json({ error: ve }, { status: 400 })
        validatedRows.push(row)
      }
      const { data: inserted, error } = await admin
        .from("students")
        .insert(validatedRows)
        .select()

      if (error) {
        console.error("[students/bulk] error:", error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ students: inserted })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (err: any) {
    console.error("[students] Unexpected error:", err?.message)
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    )
  }
}
