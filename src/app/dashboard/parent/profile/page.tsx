"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Save, Eye, EyeOff, User, Mail, Phone, GraduationCap } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getStudent } from "@/lib/data-store"
import type { Student } from "@/lib/types"

export default function ParentProfilePage() {
  const router = useRouter()
  const { user, updatePassword } = useAuth()
  const [child, setChild] = useState<Student | null>(null)
  
  // Password states
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (user && user.role !== "parent") {
      router.replace("/dashboard/admin")
      return
    }
    
    // Load student info
    const loadStudent = async () => {
      try {
        // Primary: Load from secure parent session
        const res = await fetch("/api/parent-data?type=student", { cache: "no-store" })
        if (res.ok) {
          const data = await res.json()
          if (data.student) {
            setChild(data.student)
            return
          }
        }

        if (user?.childId) {
          const s = await getStudent(user.childId)
          setChild(s || null)
        }
      } catch (err) {
        console.error("Error loading student in profile:", err)
      }
    }
    loadStudent()
  }, [user, router])

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || !confirmPassword) return
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setSuccess("")
      return
    }

    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const res = await updatePassword(password)
      if (res.success) {
        setSuccess("Password updated successfully!")
        setPassword("")
        setConfirmPassword("")
      } else {
        setError(res.error || "Failed to update password")
      }
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (!user || user.role !== "parent") return null

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <button
          onClick={() => router.push("/dashboard/parent")}
          className="inline-flex items-center gap-1.5 text-xs text-olive/40 hover:text-olive transition-colors font-body mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </button>
        <h1 className="text-xl font-display font-bold text-olive">Profile Settings</h1>
        <p className="text-sm text-olive/50 font-body">Manage your account details and update your password</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Side: Parent Info & Linked Student */}
        <div className="space-y-6 md:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-pistachio/20 flex items-center justify-center text-3xl font-display font-bold text-olive mb-4">
              {user.name ? user.name.charAt(0).toUpperCase() : "P"}
            </div>
            <h2 className="text-center font-display font-bold text-olive text-lg">{user.name}</h2>
            <p className="text-center text-xs text-olive/40 font-body uppercase tracking-wider mt-0.5">{user.role} Account</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft space-y-4"
          >
            <h3 className="text-xs font-body font-bold text-olive/40 uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4" />
              Linked Student
            </h3>
            {child ? (
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-olive/40 font-body">Student Name</p>
                  <p className="text-sm font-medium text-olive font-body">{child.name}</p>
                </div>
                <div>
                  <p className="text-xs text-olive/40 font-body">Class / Program</p>
                  <p className="text-sm font-medium text-olive font-body">{child.program} (Sec {child.section})</p>
                </div>
                <div>
                  <p className="text-xs text-olive/40 font-body">Admission No</p>
                  <p className="text-sm font-medium text-olive font-body">{child.admissionNo}</p>
                </div>
                {child.parentPhone && (
                  <div>
                    <p className="text-xs text-olive/40 font-body">Registered Phone</p>
                    <a href={`tel:${child.parentPhone.replace(/\s+/g, "")}`} className="text-sm font-medium text-olive hover:text-pistachio hover:underline transition-colors font-body">
                      {child.parentPhone}
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-olive/50 font-body">No student profile linked to this account.</p>
            )}
          </motion.div>
        </div>

        {/* Right Side: Account Details & Password Form */}
        <div className="md:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft space-y-5"
          >
            <h3 className="text-sm font-display font-semibold text-olive border-b border-beige/10 pb-3">Account Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-olive mb-1.5 font-body flex items-center gap-1.5 text-olive/60">
                  <User className="w-3.5 h-3.5" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={user.name || ""}
                  disabled
                  className="w-full px-5 py-3 rounded-xl bg-cream/50 border border-white/60 text-olive/60 text-sm outline-none font-body cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-olive mb-1.5 font-body flex items-center gap-1.5 text-olive/60">
                  <Mail className="w-3.5 h-3.5" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={user.email || ""}
                  disabled
                  className="w-full px-5 py-3 rounded-xl bg-cream/50 border border-white/60 text-olive/60 text-sm outline-none font-body cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-olive mb-1.5 font-body flex items-center gap-1.5 text-olive/60">
                  <Phone className="w-3.5 h-3.5" />
                  Helpdesk / Support Phone
                </label>
                <div className="w-full px-5 py-3 rounded-xl bg-cream/50 border border-white/60 text-olive text-sm font-body">
                  <a href="tel:+918527737413" className="hover:text-pistachio hover:underline transition-colors font-medium">
                    +91 8527737413
                  </a>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft space-y-5"
          >
            <h3 className="text-sm font-display font-semibold text-olive border-b border-beige/10 pb-3">Change Password</h3>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 text-center font-body">{error}</div>
            )}

            {success && (
              <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-xs text-green-800 text-center font-body">{success}</div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-olive mb-1.5 font-body text-olive/70">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    className="w-full px-5 py-3 pr-12 rounded-xl bg-cream border border-white/60 text-olive text-sm placeholder:text-beige/60 outline-none focus:bg-white focus:border-pistachio transition-all duration-300 font-body"
                    style={{ boxShadow: "inset 0 2px 4px rgba(90,100,80,0.04)" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-olive/40 hover:text-olive transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-olive mb-1.5 font-body text-olive/70">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    className="w-full px-5 py-3 pr-12 rounded-xl bg-cream border border-white/60 text-olive text-sm placeholder:text-beige/60 outline-none focus:bg-white focus:border-pistachio transition-all duration-300 font-body"
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
                disabled={saving}
                whileHover={!saving ? { scale: 1.02 } : {}}
                whileTap={!saving ? { scale: 0.98 } : {}}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium font-body shadow-soft hover:shadow-lift transition-all duration-300 disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {saving ? "Updating..." : "Update Password"}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
