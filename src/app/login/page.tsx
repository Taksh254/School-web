"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Unlock, ArrowLeft, UserPlus, LogIn } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function LoginPage() {
  const router = useRouter()
  const { user, loading, login, bypassLogin, register, loginWithGoogle } = useAuth()
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("sehrawatsonia27@gmail.com")
  const [password, setPassword] = useState("Saksham@123")
  const [name, setName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleGoogleLogin = async () => {
    setSubmitting(true)
    setError("")
    try {
      const res = await loginWithGoogle()
      if (!res.success) {
        setError(res.error || "Google login failed")
      }
    } catch {
      setError("An error occurred during Google login")
    } finally {
      setSubmitting(false)
    }
  }

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      const target = user.role === "admin" ? "/dashboard/admin" : "/dashboard/parent"
      router.replace(target)
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(160deg, #F7F2E8 0%, #E8D8C3 40%, #B7C9A8 100%)" }}>
        <div className="w-8 h-8 rounded-full border-2 border-pistachio border-t-transparent animate-spin" />
      </div>
    )
  }

  if (user) {
    const target = user.role === "admin" ? "/dashboard/admin" : "/dashboard/parent"
    router.replace(target)
    return null
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setSubmitting(true)
    setError("")

    try {
      const res = await login(email, password)
      if (!res.success) {
        setError(res.error || "Login failed")
        setSubmitting(false)
      }
      // On success: user state updates via AuthContext, useEffect handles redirect
    } catch {
      setError("Login failed. Please try again.")
      setSubmitting(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) return
    setSubmitting(true)
    setError("")

    try {
      const res = await register(name, email, password)
      if (res.success) {
        if (res.error) {
          setError(res.error)
          setSubmitting(false)
        }
        // On success: user state updates via AuthContext, useEffect handles redirect
      } else {
        setError(res.error || "Registration failed")
        setSubmitting(false)
      }
    } catch {
      setError("Registration failed. Please try again.")
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden"
      style={{ background: "linear-gradient(160deg, #F7F2E8 0%, #E8D8C3 40%, #B7C9A8 100%)" }}>
      <div className="absolute inset-0 paper-texture pointer-events-none" />

      <motion.div className="absolute top-1/4 left-[5%] text-pistachio/10 text-2xl" animate={{ rotate: [0, 15, 0], scale: [1, 1.1, 1] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>✦</motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative w-full max-w-[420px]">
        <div className="bg-soft-white rounded-[32px] p-8 sm:p-10 shadow-card border border-white/50 paper-texture">
          <a href="/" className="inline-flex items-center gap-1.5 text-xs text-olive/40 hover:text-olive transition-colors font-body mb-4">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </a>
          <div className="text-center mb-8">
            <div className="w-[88px] h-[88px] mx-auto mb-5 rounded-full bg-gradient-to-br from-pistachio to-sage flex items-center justify-center shadow-[0_4px_16px_rgba(183,201,168,0.3)]">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path d="M20 4C16 8 12 12 8 18C4 24 4 30 8 34C12 38 18 38 24 34C30 30 34 24 34 20C34 16 30 12 26 8C22 4 20 4 20 4Z" fill="white" fillOpacity="0.3" />
                <circle cx="16" cy="20" r="1.5" fill="white" />
                <circle cx="24" cy="20" r="1.5" fill="white" />
                <path d="M18 26C19 27 21 27 22 26" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              </svg>
            </div>
            <h1 className="text-olive text-[28px] sm:text-[32px] font-display font-bold leading-tight mb-1.5">Tiny Mind Play School</h1>
            <p className="text-olive/60 text-sm font-body">{mode === "login" ? "Login to your portal" : "Create a parent account"}</p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 text-center">{error}</div>
          )}

          <AnimatePresence mode="wait">
            {mode === "login" ? (
              <motion.form key="login" onSubmit={handleLogin} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-olive mb-1.5 text-left font-body">Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required
                    className="w-full px-5 py-3.5 rounded-full bg-cream border border-white/60 text-olive text-sm placeholder:text-beige/60 transition-all duration-300 outline-none focus:bg-white focus:border-pistachio focus:shadow-glow font-body"
                    style={{ boxShadow: "inset 0 2px 4px rgba(90,100,80,0.04)" }} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-olive mb-1.5 text-left font-body">Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required
                    className="w-full px-5 py-3.5 rounded-full bg-cream border border-white/60 text-olive text-sm placeholder:text-beige/60 transition-all duration-300 outline-none focus:bg-white focus:border-pistachio focus:shadow-glow font-body"
                    style={{ boxShadow: "inset 0 2px 4px rgba(90,100,80,0.04)" }} />
                </div>
                <motion.button type="submit" disabled={submitting} whileHover={!submitting ? { scale: 1.02, y: -1 } : {}} whileTap={!submitting ? { scale: 0.98 } : {}}
                  className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium font-body transition-all duration-300 disabled:opacity-60 shadow-[0_4px_16px_rgba(183,201,168,0.25)] hover:shadow-[0_6px_24px_rgba(183,201,168,0.35)]">
                  <span>{submitting ? "Logging in..." : "Enter Portal"}</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </motion.form>
            ) : (
              <motion.form key="signup" onSubmit={handleSignup} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-olive mb-1.5 text-left font-body">Full Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required
                    className="w-full px-5 py-3.5 rounded-full bg-cream border border-white/60 text-olive text-sm placeholder:text-beige/60 transition-all duration-300 outline-none focus:bg-white focus:border-pistachio focus:shadow-glow font-body"
                    style={{ boxShadow: "inset 0 2px 4px rgba(90,100,80,0.04)" }} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-olive mb-1.5 text-left font-body">Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required
                    className="w-full px-5 py-3.5 rounded-full bg-cream border border-white/60 text-olive text-sm placeholder:text-beige/60 transition-all duration-300 outline-none focus:bg-white focus:border-pistachio focus:shadow-glow font-body"
                    style={{ boxShadow: "inset 0 2px 4px rgba(90,100,80,0.04)" }} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-olive mb-1.5 text-left font-body">Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" required
                    className="w-full px-5 py-3.5 rounded-full bg-cream border border-white/60 text-olive text-sm placeholder:text-beige/60 transition-all duration-300 outline-none focus:bg-white focus:border-pistachio focus:shadow-glow font-body"
                    style={{ boxShadow: "inset 0 2px 4px rgba(90,100,80,0.04)" }} />
                </div>
                <motion.button type="submit" disabled={submitting} whileHover={!submitting ? { scale: 1.02, y: -1 } : {}} whileTap={!submitting ? { scale: 0.98 } : {}}
                  className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium font-body transition-all duration-300 disabled:opacity-60 shadow-[0_4px_16px_rgba(183,201,168,0.25)] hover:shadow-[0_6px_24px_rgba(183,201,168,0.35)]">
                  <span>{submitting ? "Creating account..." : "Create Account"}</span>
                  <UserPlus className="w-4 h-4" />
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-beige/20"></div>
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
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span>Continue with Google</span>
          </motion.button>

          <div className="mt-5 text-center">
            <button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError("") }}
              className="inline-flex items-center gap-1.5 text-sm text-olive/50 hover:text-olive transition-colors font-body">
              {mode === "login" ? (
                <><UserPlus className="w-3.5 h-3.5" /> Don&apos;t have an account? Sign up</>
              ) : (
                <><LogIn className="w-3.5 h-3.5" /> Already have an account? Log in</>
              )}
            </button>
          </div>

          <div className="mt-6 pt-5 border-t border-beige/30 space-y-3">
            <button onClick={async () => { await bypassLogin("admin@school.com") }}
              className="w-full flex items-center justify-center gap-2 px-6 py-2.5 rounded-full border-2 border-dashed border-pistachio/40 text-sm text-pistachio-dark font-medium font-body transition-all duration-300 hover:border-pistachio hover:bg-pistachio/10 hover:shadow-glow">
              <Unlock className="w-3.5 h-3.5" />
              <span>Bypass Login (enter as Admin)</span>
            </button>
            <button onClick={async () => { await bypassLogin("parent@school.com") }}
              className="w-full flex items-center justify-center gap-2 px-6 py-2.5 rounded-full border-2 border-dashed border-sage/40 text-sm text-olive font-medium font-body transition-all duration-300 hover:border-sage hover:bg-sage/10 hover:shadow-glow">
              <Unlock className="w-3.5 h-3.5" />
              <span>Bypass Login (enter as Parent)</span>
            </button>
            <p className="text-xs text-beige/60 text-center font-body">Admin: sehrawatsonia27@gmail.com / Saksham@123</p>
            <p className="text-xs text-beige/60 text-center font-body mt-1">Parent: parent@school.com / (any password)</p>
          </div>
        </div>
        <p className="text-center mt-6 text-xs text-olive/40 font-body">Tiny Mind Play School &copy; {new Date().getFullYear()}</p>
      </motion.div>
    </div>
  )
}
