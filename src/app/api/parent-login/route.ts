import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const COOKIE_NAME = "parent_session"
const BCRYPT_ROUNDS = 12

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

    // Look up student by admission number (case-insensitive)
    let { data: student, error: lookupError } = await admin
      .from("students")
      .select("id, name, admission_no, parent_name, parent_password_hash, password_reset_required")
      .ilike("admission_no", normalizedAdmission)
      .maybeSingle()

    if (lookupError) {
      console.error(
        `[parent-login] DB lookup error for admission_no=${normalizedAdmission}:\n` +
        `  code: ${lookupError.code}\n` +
        `  message: ${lookupError.message}\n` +
        `  details: ${lookupError.details}\n` +
        `  hint: ${lookupError.hint}`
      )

      // Fallback if parent auth columns are missing (e.g. migration_parent_auth.sql not run yet)
      if (lookupError.code === "42703") {
        const { data: fallbackStudent, error: fallbackError } = await admin
          .from("students")
          .select("id, name, admission_no, parent_name")
          .ilike("admission_no", normalizedAdmission)
          .maybeSingle()

        if (!fallbackError && fallbackStudent) {
          student = {
            ...fallbackStudent,
            parent_password_hash: null,
            password_reset_required: true,
          } as any
        } else {
          return NextResponse.json(
            { error: "Server configuration error. The parent authentication columns are missing from the database. Please run migration_parent_auth.sql in Supabase SQL editor." },
            { status: 500 }
          )
        }
      } else {
        return NextResponse.json(
          { error: `Database error: ${lookupError.message || "Unable to query students table"}` },
          { status: 500 }
        )
      }
    }

    if (!student) {
      return NextResponse.json({ error: `No student record found with admission number "${admissionNo.trim()}". Please verify and try again.` }, { status: 401 })
    }

    // Verify password
    let passwordValid = false
    const cleanPassword = password.trim()
    const cleanAdmission = (student.admission_no || normalizedAdmission).trim()

    if (!student.parent_password_hash) {
      // No hash stored yet — default password is the admission number (case-insensitive check)
      passwordValid = cleanPassword.toUpperCase() === cleanAdmission.toUpperCase()

      if (passwordValid) {
        // Fire-and-forget: hash the uppercase admission number and store it
        bcrypt.hash(cleanAdmission.toUpperCase(), BCRYPT_ROUNDS).then((initialHash) =>
          admin
            .from("students")
            .update({
              parent_password_hash: initialHash,
              password_reset_required: true,
              password_last_changed: null,
            })
            .eq("id", student.id)
            .then(({ error }) => {
              if (error) {
                console.error(
                  `[parent-login] hash-init write failed for student ${student.id}:`,
                  error.code,
                  error.message
                )
              }
            })
        )
      }
    } else {
      passwordValid = await bcrypt.compare(cleanPassword, student.parent_password_hash)

      // If comparison failed, try uppercase comparison (in case stored hash is from admission number)
      if (!passwordValid && cleanPassword.toUpperCase() === cleanAdmission.toUpperCase()) {
        passwordValid = await bcrypt.compare(cleanPassword.toUpperCase(), student.parent_password_hash)
      }
    }

    if (!passwordValid) {
      return NextResponse.json({ error: "Invalid password. First-time login? Use your Admission Number." }, { status: 401 })
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
    console.error("[parent-login] Unexpected error:", err?.message, err?.stack)
    return NextResponse.json({ error: "An error occurred. Please try again." }, { status: 500 })
  }
}
