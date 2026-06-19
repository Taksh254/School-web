"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

export default function ChangePasswordPage() {
  const router = useRouter()
  const { user, loading, updatePassword, logout } = useAuth()
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [user, loading, router])

  const validatePassword = () => {
    if (newPassword.length < 6) {
      return "Password must be at least 6 characters long."
    }
    if (newPassword !== confirmPassword) {
      return "Passwords do not match."
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const valError = validatePassword()
    if (valError) {
      setError(valError)
      return
    }

    setSubmitting(true)

    try {
      // 1. Update password in Supabase Auth
      const res = await updatePassword(newPassword)
      if (!res.success) {
        throw new Error(res.error || "Failed to update auth password")
      }

      // 2. If Supabase is configured, update the must_change_password flag in the profile
      if (isSupabaseConfigured() && user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ must_change_password: false })
          .eq("id", user.id)

        if (profileError) {
          console.error("Failed to update profile must_change_password:", profileError.message)
          // Don't fail completely if profile update fails but auth password succeeded
        }
      }

      setSuccess(true)
      setTimeout(() => {
        const target = user?.role === "admin" ? "/dashboard/admin" : "/dashboard/parent"
        router.replace(target)
      }, 2000)
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !user) {
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

      {/* Background Micro-Animations */}
      <motion.div 
        className="absolute top-1/4 left-[5%] text-pistachio/15 text-3xl select-none" 
        animate={{ rotate: [0, 20, 0], scale: [1, 1.1, 1] }} 
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        ✦
      </motion.div>
      <motion.div 
        className="absolute bottom-1/4 right-[5%] text-sage/20 text-4xl select-none" 
        animate={{ rotate: [0, -15, 0], scale: [1, 1.15, 1] }} 
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      >
        ✿
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-[440px]"
      >
        <div className="bg-soft-white rounded-[32px] p-8 sm:p-10 shadow-card border border-white/50 paper-texture">
          <div className="text-center mb-8">
            <div className="w-[80px] h-[80px] mx-auto mb-5 rounded-full overflow-hidden border border-white/65 flex items-center justify-center shadow-[0_4px_16px_rgba(183,201,168,0.3)] bg-gradient-to-br from-pistachio to-sage">
              <Lock className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-olive text-[26px] font-display font-bold leading-tight mb-2">Change Password</h1>
            <p className="text-olive/60 text-sm font-body px-4">
              For security, you must update your temporary password before accessing the dashboard.
            </p>
          </div>

          {success ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 rounded-2xl bg-green-50 border border-green-200 text-center space-y-3"
            >
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
              <h3 className="font-display font-bold text-green-800 text-lg">Password Changed!</h3>
              <p className="text-green-700 text-sm font-body">
                Your password has been successfully updated. Redirecting to your dashboard...
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-body flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-olive mb-1.5 font-body">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                    disabled={submitting}
                    className="w-full px-5 py-3.5 pr-12 rounded-full bg-cream border border-white/60 text-olive text-sm placeholder:text-beige/60 transition-all duration-300 outline-none focus:bg-white focus:border-pistachio focus:shadow-glow font-body"
                    style={{ boxShadow: "inset 0 2px 4px rgba(90,100,80,0.04)" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-olive/40 hover:text-olive transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-olive mb-1.5 font-body">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    required
                    disabled={submitting}
                    className="w-full px-5 py-3.5 pr-12 rounded-full bg-cream border border-white/60 text-olive text-sm placeholder:text-beige/60 transition-all duration-300 outline-none focus:bg-white focus:border-pistachio focus:shadow-glow font-body"
                    style={{ boxShadow: "inset 0 2px 4px rgba(90,100,80,0.04)" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-olive/40 hover:text-olive transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={submitting}
                whileHover={!submitting ? { scale: 1.01, y: -1 } : {}}
                whileTap={!submitting ? { scale: 0.99 } : {}}
                className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium font-body transition-all duration-300 disabled:opacity-60 shadow-[0_4px_16px_rgba(183,201,168,0.25)] hover:shadow-[0_6px_24px_rgba(183,201,168,0.35)]"
              >
                <span>{submitting ? "Updating Password..." : "Update & Continue"}</span>
              </motion.button>

              <button
                type="button"
                onClick={logout}
                className="w-full text-center text-xs text-olive/40 hover:text-olive/75 transition-colors font-body mt-2"
              >
                Log Out
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}
