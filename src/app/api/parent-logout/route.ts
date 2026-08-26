import { NextResponse } from "next/server"

function clearCookieResponse() {
  const response = NextResponse.json({ success: true })
  response.cookies.set("parent_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  })
  return response
}

export async function POST() {
  return clearCookieResponse()
}

export async function GET() {
  return clearCookieResponse()
}
