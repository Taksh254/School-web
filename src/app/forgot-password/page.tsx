"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { isSupabaseConfigured } from "@/lib/supabase"

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth()
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const [simulatedResetLink, setSimulatedResetLink] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setSubmitting(true)
    setError("")
    setSuccessMsg("")
    setSimulatedResetLink("")

    try {
      const res = await forgotPassword(email)
      if (res.success) {
        setSuccessMsg(
          "If an account matches that email, a secure password reset link has been sent. Please check your inbox."
        )
        if (!isSupabaseConfigured()) {
          setSimulatedResetLink(`/auth/reset-password?email=${encodeURIComponent(email)}`)
        }
      } else {
        setError(res.error || "Failed to process request")
      }
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden"
      style={{ background: "linear-gradient(160deg, rgba(247, 242, 232, 0.6) 0%, rgba(232, 216, 195, 0.6) 40%, rgba(183, 201, 168, 0.6) 100%)" }}>
      <div className="absolute inset-0 paper-texture pointer-events-none" />

      <motion.div className="absolute top-1/4 left-[5%] text-pistachio/10 text-2xl" animate={{ rotate: [0, 15, 0], scale: [1, 1.1, 1] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>✦</motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative w-full max-w-[420px]">
        <div className="bg-soft-white rounded-[32px] p-8 sm:p-10 shadow-card border border-white/50 paper-texture">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-olive/40 hover:text-olive transition-colors font-body mb-4">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Login
          </Link>
          <div className="text-center mb-8">
            <div className="w-[88px] h-[88px] mx-auto mb-5 rounded-full overflow-hidden border border-white/60 flex items-center justify-center shadow-[0_4px_16px_rgba(183,201,168,0.3)] bg-gradient-to-br from-pistachio to-sage">
              <Image src="/images/logo.jpg" alt="Logo" width={88} height={88} className="w-full h-full object-cover" priority />
            </div>
            <h1 className="text-olive text-[28px] sm:text-[32px] font-display font-bold leading-tight mb-1.5 font-bold">Forgot Password</h1>
            <p className="text-olive/60 text-sm font-body">Enter your email address to receive a secure password recovery link</p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 text-center font-body">{error}</div>
          )}

          {successMsg && (
            <div className="mb-5 p-4 rounded-xl bg-green-50 border border-green-200 text-sm text-green-800 text-center font-body space-y-3">
              <p>{successMsg}</p>
              {simulatedResetLink && (
                <Link
                  href={simulatedResetLink}
                  className="inline-block w-full text-center px-4 py-2 rounded-full border border-pistachio-dark text-xs font-semibold text-pistachio-dark hover:bg-pistachio/10 transition-colors"
                >
                  [Demo Fallback] Proceed to Reset Password page
                </Link>
              )}
            </div>
          )}

          {!successMsg && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium text-olive mb-1.5 text-left font-body">Email Address</label>
                <input id="forgot-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required
                  className="w-full px-5 py-3.5 rounded-full bg-cream border border-white/60 text-olive text-sm placeholder:text-beige/60 transition-all duration-300 outline-none focus:bg-white focus:border-pistachio focus:shadow-glow font-body"
                  style={{ boxShadow: "inset 0 2px 4px rgba(90,100,80,0.04)" }} />
              </div>
              <motion.button type="submit" disabled={submitting} whileHover={!submitting ? { scale: 1.02, y: -1 } : {}} whileTap={!submitting ? { scale: 0.98 } : {}}
                className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium font-body transition-all duration-300 disabled:opacity-60 shadow-[0_4px_16px_rgba(183,201,168,0.25)] hover:shadow-[0_6px_24px_rgba(183,201,168,0.35)]">
                <span>{submitting ? "Sending..." : "Send Reset Link"}</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </form>
          )}

          <div className="mt-5 text-center">
            <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-olive/50 hover:text-olive transition-colors font-body">
              Cancel and Return
            </Link>
          </div>
        </div>
        <p className="text-center mt-6 text-xs text-olive/40 font-body">Tiny Mind Play School &copy; {new Date().getFullYear()}</p>
      </motion.div>
    </div>
  )
}
