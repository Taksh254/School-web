"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Leaf, Unlock, ArrowLeft, UserPlus, LogIn } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function LoginPage() {
  const router = useRouter()
  const { user, loading, login, bypassLogin, register } = useAuth()
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("admin@school.com")
  const [password, setPassword] = useState("Admin@123")
  const [name, setName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

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

  if (user) return null

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setSubmitting(true)
    setError("")

    try {
      const res = await login(email, password)
      if (res.success) {
        const normalised = email.toLowerCase().trim()
        if (normalised.includes("admin") || normalised === "sehrawatsonia27@gmail.com") {
          router.push("/dashboard/admin")
        } else {
          router.push("/dashboard/parent")
        }
      } else {
        setError(res.error || "Login failed")
      }
    } catch {
      setError("Login failed. Please try again.")
    } finally {
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
        } else {
          router.push("/dashboard/parent")
        }
      } else {
        setError(res.error || "Registration failed")
      }
    } catch {
      setError("Registration failed. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden"
      style={{ background: "linear-gradient(160deg, #F7F2E8 0%, #E8D8C3 40%, #B7C9A8 100%)" }}>
      <div className="absolute inset-0 paper-texture pointer-events-none" />

      <motion.div className="absolute top-12 left-[15%] text-pistachio/20" animate={{ y: [0, -8, 0], rotate: [0, 5, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
        <Leaf className="w-6 h-6" />
      </motion.div>
      <motion.div className="absolute bottom-20 right-[12%] text-sage/20" animate={{ y: [0, -6, 0], rotate: [0, -3, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}>
        <Leaf className="w-5 h-5" />
      </motion.div>
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
            <button onClick={async () => { await bypassLogin("admin@school.com"); router.push("/dashboard/admin") }}
              className="w-full flex items-center justify-center gap-2 px-6 py-2.5 rounded-full border-2 border-dashed border-pistachio/40 text-sm text-pistachio-dark font-medium font-body transition-all duration-300 hover:border-pistachio hover:bg-pistachio/10 hover:shadow-glow">
              <Unlock className="w-3.5 h-3.5" />
              <span>Bypass Login (enter as Admin)</span>
            </button>
            <button onClick={async () => { await bypassLogin("parent@school.com"); router.push("/dashboard/parent") }}
              className="w-full flex items-center justify-center gap-2 px-6 py-2.5 rounded-full border-2 border-dashed border-sage/40 text-sm text-olive font-medium font-body transition-all duration-300 hover:border-sage hover:bg-sage/10 hover:shadow-glow">
              <Unlock className="w-3.5 h-3.5" />
              <span>Bypass Login (enter as Parent)</span>
            </button>
            <p className="text-xs text-beige/60 text-center font-body">Admin: admin@school.com / Admin@123</p>
            <p className="text-xs text-beige/60 text-center font-body mt-1">Parent: parent@school.com / (any password)</p>
          </div>
        </div>
        <p className="text-center mt-6 text-xs text-olive/40 font-body">Tiny Mind Play School &copy; {new Date().getFullYear()}</p>
      </motion.div>
    </div>
  )
}
