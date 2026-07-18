import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const COOKIE_NAME = "parent_session"
const BCRYPT_ROUNDS = 12

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase service role not configured")
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

interface ParentSession {
  studentId: string
  admissionNo: string
  parentName: string
  role: "parent"
  mustChangePassword: boolean
}

function getParentSession(request: NextRequest): ParentSession | null {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  try {
    const payload = jwt.verify(token, JWT_SECRET) as ParentSession
    if (payload.role !== "parent") return null
    return payload
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = getParentSession(request)
    if (!session) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
    }

    const body = await request.json()
    const { newPassword } = body as { newPassword: string }

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 })
    }

    // Prevent using admission number as the new password
    if (newPassword.toUpperCase() === session.admissionNo.toUpperCase()) {
      return NextResponse.json({ error: "Please choose a different password." }, { status: 400 })
    }

    const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)
    const admin = getAdminClient()

    const { error: updateError } = await admin
      .from("students")
      .update({
        parent_password_hash: newHash,
        password_reset_required: false,
        password_last_changed: new Date().toISOString(),
      })
      .eq("id", session.studentId)

    if (updateError) {
      console.error("[parent-change-password] Update error:", updateError.message)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Reissue session cookie with mustChangePassword = false
    const updatedPayload: ParentSession = {
      ...session,
      mustChangePassword: false,
    }
    const newToken = jwt.sign(updatedPayload, JWT_SECRET, { expiresIn: "7d" })

    const response = NextResponse.json({ success: true })
    response.cookies.set(COOKIE_NAME, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (err: any) {
    console.error("[parent-change-password] Unexpected error:", err?.message)
    return NextResponse.json({ error: "An error occurred." }, { status: 500 })
  }
}
