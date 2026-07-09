import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

/**
 * /api/enquiry
 *
 * POST  — Public. Inserts a new admission inquiry into admission_inquiries.
 * GET   — Admin only. Returns all inquiries (with search, filter, sort).
 * PATCH — Admin only. Updates status or notes on an inquiry.
 * DELETE— Admin only. Deletes an inquiry by id.
 */

const VALID_STATUSES = ["Pending", "Contacted", "Admitted", "Rejected"] as const
const VALID_PROGRAMS = ["Play Group", "Nursery", "LKG", "UKG"] as const

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase service role not configured")
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

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
    console.error("[enquiry/auth] Session check failed:", err)
  }

  return false
}

// ── POST: Public form submission ─────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { childName, childDob, program, parentName, parentEmail, parentPhone, message } = body as {
      childName: string
      childDob: string
      program: string
      parentName: string
      parentEmail: string
      parentPhone: string
      message?: string
    }

    // ── Validation ─────────────────────────────────────────────────────────
    const errors: string[] = []

    if (!childName?.trim()) errors.push("Child's name is required.")
    if (!childDob) errors.push("Date of birth is required.")
    if (!program || !VALID_PROGRAMS.includes(program as any)) errors.push("Please select a valid program.")
    if (!parentName?.trim()) errors.push("Parent name is required.")
    if (!parentEmail?.trim()) errors.push("Email is required.")
    if (!parentPhone?.trim()) errors.push("Phone number is required.")

    // Future DOB not allowed
    if (childDob && new Date(childDob) > new Date()) {
      errors.push("Date of birth cannot be in the future.")
    }

    // Email format
    if (parentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail.trim())) {
      errors.push("Please enter a valid email address.")
    }

    // Indian phone: 10 digits, optionally prefixed with +91 or 0
    if (parentPhone) {
      const digits = parentPhone.replace(/[\s\-\(\)\+]/g, "")
      const stripped = digits.startsWith("91") ? digits.slice(2) : digits.startsWith("0") ? digits.slice(1) : digits
      if (!/^\d{10}$/.test(stripped)) {
        errors.push("Please enter a valid 10-digit Indian mobile number.")
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(" ") }, { status: 400 })
    }

    const supabase = getAdminClient()

    const { data, error } = await supabase
      .from("admission_inquiries")
      .insert({
        child_name: childName.trim(),
        date_of_birth: childDob,
        program: program.trim(),
        parent_name: parentName.trim(),
        email: parentEmail.trim().toLowerCase(),
        phone: parentPhone.trim(),
        message: message?.trim() || null,
        status: "Pending",
      })
      .select("id")
      .single()

    if (error) {
      console.error("[enquiry] Insert failed:", error.message)
      return NextResponse.json({ error: "Failed to submit enquiry. Please try again." }, { status: 500 })
    }

    console.log(`[enquiry] New inquiry submitted — ID: ${data.id}, Parent: ${parentEmail}, Child: ${childName} (${program})`)
    return NextResponse.json({ ok: true, id: data.id })
  } catch (err: any) {
    console.error("[enquiry] Unexpected POST error:", err?.message)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}

// ── GET: Admin — fetch all inquiries ─────────────────────────────────────────
export async function GET(request: NextRequest) {
  const authorized = await isAuthorizedAdmin(request)
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search")?.trim().toLowerCase()

    const supabase = getAdminClient()

    let query = supabase
      .from("admission_inquiries")
      .select("*")
      .order("created_at", { ascending: false })

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) {
      console.error("[enquiry/GET] Query failed:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let results = data ?? []

    // Client-side search (Supabase free tier doesn't have FTS on text columns by default)
    if (search) {
      results = results.filter(
        (r: any) =>
          r.child_name?.toLowerCase().includes(search) ||
          r.parent_name?.toLowerCase().includes(search) ||
          r.email?.toLowerCase().includes(search) ||
          r.phone?.includes(search) ||
          r.program?.toLowerCase().includes(search)
      )
    }

    return NextResponse.json({ enquiries: results })
  } catch (err: any) {
    console.error("[enquiry/GET] Unexpected error:", err?.message)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ── PATCH: Admin — update status / notes ─────────────────────────────────────
export async function PATCH(request: NextRequest) {
  const authorized = await isAuthorizedAdmin(request)
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, status, notes } = body as { id: string; status?: string; notes?: string }

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
    if (status && !VALID_STATUSES.includes(status as any)) {
      return NextResponse.json({ error: `Invalid status. Allowed: ${VALID_STATUSES.join(", ")}` }, { status: 400 })
    }

    const supabase = getAdminClient()
    const update: Record<string, any> = { updated_at: new Date().toISOString() }
    if (status !== undefined) update.status = status
    if (notes !== undefined) update.notes = notes

    const { data, error } = await supabase
      .from("admission_inquiries")
      .update(update)
      .eq("id", id)
      .select("*")
      .single()

    if (error) {
      console.error("[enquiry/PATCH] Update failed:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, enquiry: data })
  } catch (err: any) {
    console.error("[enquiry/PATCH] Unexpected error:", err?.message)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ── DELETE: Admin — delete an inquiry ────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  const authorized = await isAuthorizedAdmin(request)
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    const supabase = getAdminClient()
    const { error } = await supabase.from("admission_inquiries").delete().eq("id", id)

    if (error) {
      console.error("[enquiry/DELETE] Delete failed:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error("[enquiry/DELETE] Unexpected error:", err?.message)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
