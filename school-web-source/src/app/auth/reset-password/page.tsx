"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

export default function ResetPasswordPage() {
  const router = useRouter()
  const { updatePassword } = useAuth()
  
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [verifyingSession, setVerifyingSession] = useState(true)
  const [sessionValid, setSessionValid] = useState(false)

  // ── Session verification ───────────────────────────────────────────────────
  //
  // Supabase password reset works in two modes depending on the project settings:
  //
  // MODE A — PKCE (default for @supabase/ssr):
  //   Email link → /auth/callback?code=XXX&next=/auth/reset-password
  //   The callback route calls exchangeCodeForSession(), sets the session cookie,
  //   then redirects HERE. By the time we render, getSession() already returns a
  //   valid session. We just need to call getSession() and show the form.
  //
  // MODE B — Implicit (legacy):
  //   Email link → /auth/reset-password#access_token=...&type=recovery
  //   The Supabase JS client parses the hash, fires onAuthStateChange with
  //   event=PASSWORD_RECOVERY, and getSession() returns the recovery session.
  //
  // Strategy:
  //   1. Log everything for debugging.
  //   2. Call getSession() immediately — covers MODE A and page-refresh after MODE B.
  //   3. Simultaneously listen via onAuthStateChange — covers MODE B first-load.
  //   4. Hard 8 s timeout — if neither resolves, the link is genuinely invalid.
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setSessionValid(true)
      setVerifyingSession(false)
      return
    }

    let settled = false

    function settle(valid: boolean, err?: string) {
      if (settled) return
      settled = true
      console.log("[reset-password] settle →", valid, err ?? "")
      if (!valid && err) setError(err)
      setSessionValid(valid)
      setVerifyingSession(false)
    }

    // ── Debug: log current URL and hash ──────────────────────────────────────
    if (typeof window !== "undefined") {
      console.log("[reset-password] href  :", window.location.href)
      console.log("[reset-password] hash  :", window.location.hash || "(empty)")
      console.log("[reset-password] search:", window.location.search || "(empty)")
    }

    // ── Step 1: onAuthStateChange (covers implicit/MODE B, and PKCE refresh) ─
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[reset-password] onAuthStateChange →", event, session ? "session present" : "no session")
      if (event === "PASSWORD_RECOVERY") {
        console.log("[reset-password] PASSWORD_RECOVERY — showing form")
        settle(true)
      } else if (event === "SIGNED_IN" && session) {
        // Some Supabase versions fire SIGNED_IN for recovery sessions on this page
        console.log("[reset-password] SIGNED_IN with session — showing form")
        settle(true)
      } else if (event === "SIGNED_OUT") {
        settle(false, "Session expired. Please request a new password reset link.")
      }
    })

    // ── Step 2: getSession() check (covers MODE A / PKCE after callback) ─────
    async function checkExistingSession() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        console.log(
          "[reset-password] getSession() →",
          session ? `session present (user: ${session.user?.email})` : "null",
          sessionError ? `error: ${sessionError.message}` : ""
        )
        if (session && !sessionError) {
          settle(true)
        }
        // If null — don't fail yet; wait for onAuthStateChange or timeout
      } catch (err: any) {
        console.error("[reset-password] getSession() threw:", err?.message)
      }
    }
    checkExistingSession()

    // ── Step 3: Timeout fallback ──────────────────────────────────────────────
    // 8 s is generous enough for slow connections. If PKCE exchange was done
    // by the callback route, getSession() resolves in <100 ms. If the user
    // is arriving via an implicit hash, onAuthStateChange fires in <500 ms.
    const timeout = setTimeout(() => {
      console.warn("[reset-password] 8 s timeout — no valid recovery session detected. Link is likely expired or invalid.")
      settle(false, "Invalid or expired password reset link. Please request a new one.")
    }, 8000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || !confirmPassword) return
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setSubmitting(true)
    setError("")
    setSuccess("")

    try {
      const res = await updatePassword(password)
      if (res.success) {
        setSuccess("Password updated successfully!")
        
        // Sign out the temporary recovery session so the user must re-login
        if (isSupabaseConfigured()) {
          await supabase.auth.signOut()
        }

        setTimeout(() => {
          router.replace("/login?resetSuccess=true")
        }, 1500)
      } else {
        setError(res.error || "Failed to update password")
      }
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (verifyingSession) {
    return (
      <div className="relative min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(160deg, rgba(247, 242, 232, 0.6) 0%, rgba(232, 216, 195, 0.6) 40%, rgba(183, 201, 168, 0.6) 100%)" }}>
        <div className="w-8 h-8 rounded-full border-2 border-pistachio border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden"
      style={{ background: "linear-gradient(160deg, rgba(247, 242, 232, 0.6) 0%, rgba(232, 216, 195, 0.6) 40%, rgba(183, 201, 168, 0.6) 100%)" }}>
      <div className="absolute inset-0 paper-texture pointer-events-none" />

      <motion.div className="absolute top-1/4 left-[5%] text-pistachio/10 text-2xl" animate={{ rotate: [0, 15, 0], scale: [1, 1.1, 1] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>✦</motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative w-full max-w-[420px]">
        <div className="bg-soft-white rounded-[32px] p-8 sm:p-10 shadow-card border border-white/50 paper-texture">
          <div className="text-center mb-8">
            <div className="w-[88px] h-[88px] mx-auto mb-5 rounded-full overflow-hidden border border-white/60 flex items-center justify-center shadow-[0_4px_16px_rgba(183,201,168,0.3)] bg-gradient-to-br from-pistachio to-sage">
              <img src="/images/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-olive text-[28px] sm:text-[32px] font-display font-bold leading-tight mb-1.5 font-bold">Reset Password</h1>
            <p className="text-olive/60 text-sm font-body">Choose a new password for your account</p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 text-center font-body">{error}</div>
          )}

          {success && (
            <div className="mb-5 p-3 rounded-xl bg-green-50 border border-green-200 text-sm text-green-800 text-center font-body">{success}</div>
          )}

          {sessionValid && !success && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="reset-password" className="block text-sm font-medium text-olive mb-1.5 text-left font-body">New Password</label>
                <div className="relative">
                  <input id="reset-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter new password (min 6 chars)" required
                    className="w-full px-5 py-3.5 pr-12 rounded-full bg-cream border border-white/60 text-olive text-sm placeholder:text-beige/60 transition-all duration-300 outline-none focus:bg-white focus:border-pistachio focus:shadow-glow font-body"
                    style={{ boxShadow: "inset 0 2px 4px rgba(90,100,80,0.04)" }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-olive/40 hover:text-olive transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-olive mb-1.5 text-left font-body">Confirm Password</label>
                <div className="relative">
                  <input id="confirm-password" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" required
                    className="w-full px-5 py-3.5 pr-12 rounded-full bg-cream border border-white/60 text-olive text-sm placeholder:text-beige/60 transition-all duration-300 outline-none focus:bg-white focus:border-pistachio focus:shadow-glow font-body"
                    style={{ boxShadow: "inset 0 2px 4px rgba(90,100,80,0.04)" }} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-olive/40 hover:text-olive transition-colors">
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <motion.button type="submit" disabled={submitting} whileHover={!submitting ? { scale: 1.02, y: -1 } : {}} whileTap={!submitting ? { scale: 0.98 } : {}}
                className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium font-body transition-all duration-300 disabled:opacity-60 shadow-[0_4px_16px_rgba(183,201,168,0.25)] hover:shadow-[0_6px_24px_rgba(183,201,168,0.35)]">
                <span>{submitting ? "Updating..." : "Update Password"}</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </form>
          )}

          {!sessionValid && (
            <div className="mt-6 text-center">
              <Link href="/login" className="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium transition-all shadow-soft hover:shadow-lift font-body">
                Return to Login Page
              </Link>
            </div>
          )}
        </div>
        <p className="text-center mt-6 text-xs text-olive/40 font-body">Tiny Mind Play School &copy; {new Date().getFullYear()}</p>
      </motion.div>
    </div>
  )
}
