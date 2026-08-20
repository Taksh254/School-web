"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion } from "framer-motion"
import { Save, ArrowLeft, Eye, EyeOff, Lock } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getPrincipalProfile, updatePrincipalProfile, type PrincipalProfile } from "@/lib/data-store"

export default function PrincipalProfilePage() {
  const router = useRouter()
  const { user, updatePassword } = useAuth()
  const [profile, setProfile] = useState<PrincipalProfile>({ name: "", role: "", bio: "", photoUrl: "", initial: "" })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Password fields
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [updatingPassword, setUpdatingPassword] = useState(false)
  const [pwError, setPwError] = useState("")
  const [pwSuccess, setPwSuccess] = useState("")

  useEffect(() => {
    setProfile(getPrincipalProfile())
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const initial = profile.name.charAt(0).toUpperCase() || "P"
    const updated = { ...profile, initial }
    updatePrincipalProfile(updated)
    setProfile(updated)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError("")
    setPwSuccess("")

    if (password.length < 6) {
      setPwError("Password must be at least 6 characters.")
      return
    }

    if (password !== confirmPassword) {
      setPwError("Passwords do not match.")
      return
    }

    setUpdatingPassword(true)
    try {
      const res = await updatePassword(password)
      if (res.success) {
        setPwSuccess("Password changed successfully!")
        setPassword("")
        setConfirmPassword("")
        setTimeout(() => setPwSuccess(""), 4000)
      } else {
        setPwError(res.error || "Failed to update password.")
      }
    } catch {
      setPwError("An error occurred. Please try again.")
    } finally {
      setUpdatingPassword(false)
    }
  }

  const handlePhotoUrl = (url: string) => {
    setProfile((p) => ({ ...p, photoUrl: url }))
  }

  if (!user || user.role !== "admin") return null

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-soft-white hover:bg-cream border border-beige/20 text-olive transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-display font-bold text-olive">Profile & Settings</h1>
            <p className="text-sm text-olive/50 font-body">Manage your principal profile, bio, and account password.</p>
          </div>
        </div>

        <motion.button
          onClick={handleSave}
          disabled={saving}
          whileHover={!saving ? { scale: 1.02 } : {}}
          whileTap={!saving ? { scale: 0.98 } : {}}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium font-body shadow-soft hover:shadow-lift transition-all duration-300 disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </motion.button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Photo / Avatar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft text-center"
        >
          <div className="relative w-32 h-32 mx-auto rounded-full bg-pistachio/20 flex items-center justify-center text-5xl font-display font-bold text-olive mb-4 overflow-hidden">
            {profile.photoUrl ? (
              <Image src={profile.photoUrl} alt={profile.name || "Principal"} width={128} height={128} className="w-full h-full object-cover" />
            ) : (
              profile.initial || "?"
            )}
          </div>
          <label className="block text-sm font-medium text-olive mb-1.5 text-left font-body">Photo URL</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={profile.photoUrl}
              onChange={(e) => handlePhotoUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="flex-1 px-4 py-2.5 rounded-full bg-cream border border-white/60 text-olive text-sm placeholder:text-beige/60 outline-none focus:bg-white focus:border-pistachio transition-all duration-300 font-body"
              style={{ boxShadow: "inset 0 2px 4px rgba(90,100,80,0.04)" }}
            />
          </div>
        </motion.div>

        {/* Form Fields */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="md:col-span-2 bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft space-y-5"
        >
          <div>
            <label className="block text-sm font-medium text-olive mb-1.5 font-body">Full Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Ms. Sunita Mehta"
              className="w-full px-5 py-3 rounded-xl bg-cream border border-white/60 text-olive text-sm placeholder:text-beige/60 outline-none focus:bg-white focus:border-pistachio transition-all duration-300 font-body"
              style={{ boxShadow: "inset 0 2px 4px rgba(90,100,80,0.04)" }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-olive mb-1.5 font-body">Role / Title</label>
            <input
              type="text"
              value={profile.role}
              onChange={(e) => setProfile((p) => ({ ...p, role: e.target.value }))}
              placeholder="e.g. Founder & Principal"
              className="w-full px-5 py-3 rounded-xl bg-cream border border-white/60 text-olive text-sm placeholder:text-beige/60 outline-none focus:bg-white focus:border-pistachio transition-all duration-300 font-body"
              style={{ boxShadow: "inset 0 2px 4px rgba(90,100,80,0.04)" }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-olive mb-1.5 font-body">Bio / Message</label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
              placeholder="Write a brief bio or welcome message..."
              rows={5}
              className="w-full px-5 py-3 rounded-2xl bg-cream border border-white/60 text-olive text-sm placeholder:text-beige/60 outline-none focus:bg-white focus:border-pistachio transition-all duration-300 font-body resize-none"
              style={{ boxShadow: "inset 0 2px 4px rgba(90,100,80,0.04)" }}
            />
          </div>
        </motion.div>
      </div>

      {/* Change Password Card */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="hidden md:block col-span-1" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="md:col-span-2 bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft space-y-5"
        >
          <h3 className="text-sm font-display font-semibold text-olive border-b border-beige/10 pb-3 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Security / Change Password
          </h3>

          {pwError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 text-center font-body">{pwError}</div>
          )}

          {pwSuccess && (
            <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-xs text-green-800 text-center font-body">{pwSuccess}</div>
          )}

          <form onSubmit={handlePasswordUpdate} className="space-y-4">
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
              disabled={updatingPassword}
              whileHover={!updatingPassword ? { scale: 1.02 } : {}}
              whileTap={!updatingPassword ? { scale: 0.98 } : {}}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium font-body shadow-soft hover:shadow-lift transition-all duration-300 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {updatingPassword ? "Updating..." : "Update Password"}
            </motion.button>
          </form>
        </motion.div>
      </div>

      {/* Preview */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft"
      >
        <h3 className="text-base font-display font-semibold text-olive mb-4">Preview</h3>
        <div className="flex items-center gap-5 p-4 rounded-2xl bg-cream/50">
          <div className="relative w-16 h-16 rounded-full bg-pistachio/20 flex items-center justify-center text-2xl font-display font-bold text-olive shrink-0 overflow-hidden">
            {profile.photoUrl ? (
              <Image src={profile.photoUrl} alt={profile.name || "Principal"} width={64} height={64} className="w-full h-full object-cover" />
            ) : (
              profile.initial || "?"
            )}
          </div>
          <div className="min-w-0">
            <p className="text-base font-display font-semibold text-olive">{profile.name || "Your Name"}</p>
            <p className="text-sm text-olive/50">{profile.role || "Your Role"}</p>
            <p className="text-xs text-olive/40 mt-1 line-clamp-2">{profile.bio || "Your bio will appear here..."}</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
