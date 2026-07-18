import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const COOKIE_NAME = "parent_session"

// Rate limit: in-memory, per admission number
const loginAttempts = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const entry = loginAttempts.get(key)
  if (!entry || entry.resetAt < now) {
    loginAttempts.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  entry.count++
  if (entry.count > MAX_ATTEMPTS) return true
  return false
}

function clearAttempts(key: string) {
  loginAttempts.delete(key)
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase service role not configured")
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { admissionNo, password } = body as { admissionNo: string; password: string }

    if (!admissionNo || !password) {
      return NextResponse.json({ error: "Admission number and password are required." }, { status: 400 })
    }

    const normalizedAdmission = admissionNo.trim().toUpperCase()

    // Rate limiting per admission number
    if (isRateLimited(normalizedAdmission)) {
      return NextResponse.json(
        { error: "Too many failed attempts. Please try again in 15 minutes." },
        { status: 429 }
      )
    }

    const admin = getAdminClient()

    // Look up student by admission number
    const { data: student, error: lookupError } = await admin
      .from("students")
      .select("id, name, admission_no, parent_name, parent_password_hash, password_reset_required")
      .eq("admission_no", normalizedAdmission)
      .maybeSingle()

    if (lookupError || !student) {
      return NextResponse.json({ error: "Invalid admission number or password." }, { status: 401 })
    }

    // Verify password
    let passwordValid = false
    if (!student.parent_password_hash) {
      // No hash stored yet: default password = admission number (exact match)
      passwordValid = password === normalizedAdmission
    } else {
      passwordValid = await bcrypt.compare(password, student.parent_password_hash)
    }

    if (!passwordValid) {
      return NextResponse.json({ error: "Invalid admission number or password." }, { status: 401 })
    }

    // Clear rate limit on success
    clearAttempts(normalizedAdmission)

    const mustChangePassword = !student.parent_password_hash || !!student.password_reset_required

    // Mint session JWT (lives server-side only)
    const sessionPayload = {
      studentId: student.id,
      admissionNo: student.admission_no,
      parentName: student.parent_name,
      role: "parent" as const,
      mustChangePassword,
    }

    const token = jwt.sign(sessionPayload, JWT_SECRET, { expiresIn: "7d" })

    const response = NextResponse.json({ success: true, mustChangePassword })
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (err: any) {
    console.error("[parent-login] Unexpected error:", err?.message)
    return NextResponse.json({ error: "An error occurred. Please try again." }, { status: 500 })
  }
}
