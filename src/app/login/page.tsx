"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, ArrowLeft, ShieldCheck, Users } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

type LoginTab = "admin" | "parent"

export default function LoginPage() {
  const router = useRouter()
  const { user, loading, login, parentLogin, loginWithGoogle } = useAuth()

  const [tab, setTab] = useState<LoginTab>("admin")

  // Admin fields
  const [email, setEmail] = useState("")
  const [adminPassword, setAdminPassword] = useState("")

  // Parent fields
  const [admissionNo, setAdmissionNo] = useState("")
  const [parentPassword, setParentPassword] = useState("")

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      if (params.get("resetSuccess") === "true") {
        setSuccessMsg("Password updated successfully. Please log in.")
      }
      if (params.get("tab") === "parent") setTab("parent")
    }
  }, [])

  // Admin already logged in — redirect
  useEffect(() => {
    if (user && !loading) {
      const params = new URLSearchParams(window.location.search)
      const redirectParam = params.get("redirect")
      if (redirectParam && redirectParam.startsWith("/")) {
        window.location.href = redirectParam
      } else {
        window.location.href = "/dashboard/admin"
      }
    }
  }, [user, loading, router])

  const switchTab = (t: LoginTab) => {
    setTab(t)
    setError("")
    setSuccessMsg("")
    setAdminPassword("")
    setParentPassword("")
    setShowPass(false)
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !adminPassword) return
    setSubmitting(true)
    setError("")
    try {
      const res = await login(email, adminPassword)
      if (!res.success) {
        setError(res.error || "Invalid credentials.")
        setSubmitting(false)
      }
      // On success, the useEffect above handles redirect
    } catch {
      setError("Login failed. Please try again.")
      setSubmitting(false)
    }
  }

  const handleParentLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!admissionNo || !parentPassword) return
    setSubmitting(true)
    setError("")
    try {
      const res = await parentLogin(admissionNo, parentPassword)
      if (!res.success) {
        setError(res.error || "Invalid admission number or password.")
        setSubmitting(false)
        return
      }
      if (res.mustChangePassword) {
        window.location.href = "/auth/parent-change-password"
      } else {
        window.location.href = "/dashboard/parent"
      }
    } catch {
      setError("Login failed. Please try again.")
      setSubmitting(false)
    }
  }

  const handleGoogleLogin = async () => {
    setSubmitting(true)
    setError("")
    try {
      const res = await loginWithGoogle()
      if (!res.success) setError(res.error || "Google login failed")
    } catch {
      setError("An error occurred during Google login")
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls =
    "w-full px-5 py-3.5 rounded-full bg-cream border border-white/60 text-olive text-sm placeholder:text-beige/60 transition-all duration-300 outline-none focus:bg-white focus:border-pistachio font-body"
  const inputStyle = { boxShadow: "inset 0 2px 4px rgba(90,100,80,0.04)" }

  if (loading) {
    return (
      <div
        className="relative min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(160deg, rgba(247,242,232,0.6) 0%, rgba(232,216,195,0.6) 40%, rgba(183,201,168,0.6) 100%)" }}
      >
        <div className="w-8 h-8 rounded-full border-2 border-pistachio border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden"
      style={{ background: "linear-gradient(160deg, rgba(247,242,232,0.6) 0%, rgba(232,216,195,0.6) 40%, rgba(183,201,168,0.6) 100%)" }}
    >
      <div className="absolute inset-0 paper-texture pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-[440px]"
      >
        <div className="bg-soft-white rounded-[32px] p-8 sm:p-10 shadow-card border border-white/50 paper-texture">
          <a href="/" className="inline-flex items-center gap-1.5 text-xs text-olive/40 hover:text-olive transition-colors font-body mb-4">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </a>

          {/* Logo + Title */}
          <div className="text-center mb-6">
            <div className="w-[80px] h-[80px] mx-auto mb-4 rounded-full overflow-hidden border border-white/60 flex items-center justify-center shadow-[0_4px_16px_rgba(183,201,168,0.3)] bg-gradient-to-br from-pistachio to-sage relative">
              <Image src="/images/logo.jpg" alt="Logo" fill sizes="80px" className="object-cover" priority />
            </div>
            <h1 className="text-olive text-[26px] sm:text-[30px] font-display font-bold leading-tight mb-1">
              Tiny Mind Play School
            </h1>
            <p className="text-olive/50 text-sm font-body">School Management Portal</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 p-1 bg-cream rounded-2xl border border-beige/20">
            <button
              type="button"
              id="tab-admin"
              onClick={() => switchTab("admin")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium font-body transition-all duration-200 ${
                tab === "admin"
                  ? "bg-white text-olive shadow-sm border border-white/80"
                  : "text-olive/50 hover:text-olive"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Admin
            </button>
            <button
              type="button"
              id="tab-parent"
              onClick={() => switchTab("parent")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium font-body transition-all duration-200 ${
                tab === "parent"
                  ? "bg-white text-olive shadow-sm border border-white/80"
                  : "text-olive/50 hover:text-olive"
              }`}
            >
              <Users className="w-4 h-4" />
              Parent
            </button>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 text-center font-body">{error}</div>
          )}
          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 text-sm text-green-800 text-center font-body">{successMsg}</div>
          )}

          <AnimatePresence mode="wait">
            {tab === "admin" ? (
              <motion.div
                key="admin"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div>
                    <label htmlFor="admin-email" className="block text-sm font-medium text-olive mb-1.5 font-body">
                      Email Address
                    </label>
                    <input
                      id="admin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@school.com"
                      required
                      className={inputCls}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="admin-password" className="block text-sm font-medium text-olive font-body">
                        Password
                      </label>
                      <a href="/forgot-password" className="text-xs text-pistachio hover:underline font-body font-medium">
                        Forgot Password?
                      </a>
                    </div>
                    <input
                      id="admin-password"
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className={inputCls}
                      style={inputStyle}
                    />
                  </div>
                  <motion.button
                    type="submit"
                    disabled={submitting}
                    whileHover={!submitting ? { scale: 1.02, y: -1 } : {}}
                    whileTap={!submitting ? { scale: 0.98 } : {}}
                    className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium font-body transition-all duration-300 disabled:opacity-60 shadow-[0_4px_16px_rgba(183,201,168,0.25)]"
                  >
                    <span>{submitting ? "Logging in..." : "Enter Admin Portal"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </form>

                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-beige/20" />
                  </div>
                  <div className="relative flex justify-center text-xs font-body">
                    <span className="bg-soft-white px-3 text-olive/40 font-medium">Or continue with</span>
                  </div>
                </div>

                <motion.button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={submitting}
                  whileHover={!submitting ? { scale: 1.02, y: -0.5 } : {}}
                  whileTap={!submitting ? { scale: 0.98 } : {}}
                  className="w-full flex items-center justify-center gap-2.5 px-6 py-3 rounded-full bg-white border border-beige/40 text-olive text-sm font-medium font-body transition-all duration-300 disabled:opacity-60 shadow-sm hover:bg-cream/40"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                  </svg>
                  <span>Continue with Google</span>
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="parent"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={handleParentLogin} className="space-y-4">
                  <div>
                    <label htmlFor="parent-admission" className="block text-sm font-medium text-olive mb-1.5 font-body">
                      Admission Number
                    </label>
                    <input
                      id="parent-admission"
                      type="text"
                      value={admissionNo}
                      onChange={(e) => setAdmissionNo(e.target.value.toUpperCase())}
                      placeholder="e.g. ADM-00125"
                      required
                      className={inputCls}
                      style={inputStyle}
                      autoComplete="username"
                    />
                  </div>
                  <div>
                    <label htmlFor="parent-password" className="block text-sm font-medium text-olive mb-1.5 font-body">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="parent-password"
                        type={showPass ? "text" : "password"}
                        value={parentPassword}
                        onChange={(e) => setParentPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        className={inputCls}
                        style={inputStyle}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(p => !p)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-olive/40 hover:text-olive text-xs font-body"
                      >
                        {showPass ? "Hide" : "Show"}
                      </button>
                    </div>
                    <p className="mt-1.5 text-xs text-olive/40 font-body px-1">
                      First time? Use your Admission Number as password.
                    </p>
                  </div>
                  <motion.button
                    type="submit"
                    disabled={submitting}
                    whileHover={!submitting ? { scale: 1.02, y: -1 } : {}}
                    whileTap={!submitting ? { scale: 0.98 } : {}}
                    className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-gradient-to-r from-sage to-pistachio text-white text-sm font-medium font-body transition-all duration-300 disabled:opacity-60 shadow-[0_4px_16px_rgba(183,201,168,0.25)]"
                  >
                    <span>{submitting ? "Logging in..." : "Enter Parent Portal"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center mt-6 text-xs text-olive/40 font-body">
          Tiny Mind Play School &copy; {new Date().getFullYear()}
        </p>
      </motion.div>
    </div>
  )
}
