import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const COOKIE_NAME = "parent_session"

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

    const admin = getAdminClient()

    // Mark password reset as no longer mandatory for this session
    try {
      await admin
        .from("students")
        .update({
          password_reset_required: false,
        })
        .eq("id", session.studentId)
    } catch (err: any) {
      console.warn("[parent-skip-password] DB update warning:", err?.message)
    }

    // Reissue parent_session cookie with mustChangePassword = false
    const sessionPayload = {
      studentId: session.studentId,
      admissionNo: session.admissionNo,
      parentName: session.parentName,
      role: "parent" as const,
      mustChangePassword: false,
    }
    const newToken = jwt.sign(sessionPayload, JWT_SECRET, { expiresIn: "7d" })

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
    console.error("[parent-skip-password] Unexpected error:", err?.message)
    return NextResponse.json({ error: "An error occurred." }, { status: 500 })
  }
}
