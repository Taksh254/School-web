"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowRight, KeyRound } from "lucide-react"

export default function ParentChangePasswordPage() {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [showPass, setShowPass] = useState(false)

  const [skipping, setSkipping] = useState(false)

  const handleSkip = async () => {
    setSkipping(true)
    setError("")
    try {
      const res = await fetch("/api/parent-skip-password", {
        method: "POST",
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error || "Failed to skip. Please try again.")
        setSkipping(false)
        return
      }
      window.location.href = "/dashboard/parent"
    } catch {
      setError("A connection error occurred. Please try again.")
      setSkipping(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/parent-change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (process.env.NODE_ENV === "development") {
          console.error(`[parent-change-password] API error ${res.status}:`, json.error || "Unknown error")
        }
        setError(json.error || "Failed to update password. Please try again.")
        setSubmitting(false)
        return
      }
      // Redirect to parent dashboard on success
      window.location.href = "/dashboard/parent"
    } catch (err: any) {
      if (process.env.NODE_ENV === "development") {
        console.error("[parent-change-password] Network/client error:", err?.message)
      }
      setError("A connection error occurred. Please try again.")
      setSubmitting(false)
    }
  }

  const inputCls =
    "w-full px-5 py-3.5 rounded-full bg-cream border border-white/60 text-olive text-sm placeholder:text-beige/60 transition-all duration-300 outline-none focus:bg-white focus:border-pistachio font-body"
  const inputStyle = { boxShadow: "inset 0 2px 4px rgba(90,100,80,0.04)" }

  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(160deg, rgba(247,242,232,0.6) 0%, rgba(232,216,195,0.6) 40%, rgba(183,201,168,0.6) 100%)" }}
    >
      <div className="absolute inset-0 paper-texture pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-[400px]"
      >
        <div className="bg-soft-white rounded-[32px] p-8 sm:p-10 shadow-card border border-white/50 paper-texture">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-pistachio to-sage flex items-center justify-center shadow-lg">
              <KeyRound className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-olive text-2xl font-display font-bold mb-2">Set New Password</h1>
            <p className="text-olive/60 text-sm font-body">
              Please create a new password to continue, or skip to use your admission number for now.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 text-center font-body">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-olive mb-1.5 font-body">
                New Password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPass ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  minLength={8}
                  className={inputCls}
                  style={inputStyle}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-olive/40 hover:text-olive text-xs font-body"
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-olive mb-1.5 font-body">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type={showPass ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your new password"
                required
                minLength={8}
                className={inputCls}
                style={inputStyle}
                autoComplete="new-password"
              />
            </div>

            <motion.button
              type="submit"
              disabled={submitting || skipping}
              whileHover={!submitting && !skipping ? { scale: 1.02, y: -1 } : {}}
              whileTap={!submitting && !skipping ? { scale: 0.98 } : {}}
              className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium font-body transition-all duration-300 disabled:opacity-60 shadow-[0_4px_16px_rgba(183,201,168,0.25)] mt-2"
            >
              <span>{submitting ? "Saving..." : "Set Password & Continue"}</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleSkip}
                disabled={submitting || skipping}
                className="text-xs text-olive/50 hover:text-olive hover:underline font-body transition-colors disabled:opacity-50 py-1 inline-flex items-center gap-1"
              >
                {skipping ? "Skipping..." : "Skip for now →"}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
