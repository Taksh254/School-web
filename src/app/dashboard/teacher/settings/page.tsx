"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  Settings,
  Lock,
  Bell,
  Eye,
  Shield,
  ArrowLeft,
  CheckCircle,
  LogOut,
  Save,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"

export default function TeacherSettingsPage() {
  const { user, logout } = useAuth()
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [changingPass, setChangingPass] = useState(false)
  const [passSuccess, setPassSuccess] = useState(false)
  const [passError, setPassError] = useState<string | null>(null)

  // Notification preferences
  const [notifyAnnouncements, setNotifyAnnouncements] = useState(true)
  const [notifyMessages, setNotifyMessages] = useState(true)
  const [prefSaved, setPrefSaved] = useState(false)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPassError(null)
    setPassSuccess(false)

    if (newPassword.length < 6) {
      setPassError("Password must be at least 6 characters.")
      return
    }

    if (newPassword !== confirmPassword) {
      setPassError("Passwords do not match.")
      return
    }

    setChangingPass(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        setPassError(error.message)
      } else {
        setPassSuccess(true)
        setNewPassword("")
        setConfirmPassword("")
        setTimeout(() => setPassSuccess(false), 5000)
      }
    } catch (err: any) {
      setPassError(err?.message || "Failed to update password")
    } finally {
      setChangingPass(false)
    }
  }

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault()
    setPrefSaved(true)
    setTimeout(() => setPrefSaved(false), 3000)
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard/teacher" className="text-xs text-olive/50 hover:text-olive flex items-center gap-1 font-body">
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-olive">Settings & Security</h1>
          <p className="text-xs sm:text-sm text-olive/60 font-body">
            Manage your account security, notification alerts, and application preferences
          </p>
        </div>
      </div>

      {/* ── 1. CHANGE PASSWORD ───────────────────────────────────────── */}
      <div className="bg-soft-white rounded-3xl p-6 sm:p-8 border border-beige/20 shadow-soft space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-beige/20">
          <div className="w-10 h-10 rounded-2xl bg-pistachio/15 text-olive flex items-center justify-center">
            <Lock className="w-5 h-5 text-pistachio" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-olive">Change Password</h3>
            <p className="text-xs text-olive/50 font-body">Update your account login password</p>
          </div>
        </div>

        {passSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-body flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            Password updated successfully!
          </div>
        )}

        {passError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-body">
            {passError}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-olive font-body block mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                className="w-full p-2.5 rounded-xl bg-cream border border-beige/30 text-xs text-olive outline-none focus:border-pistachio font-body"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-olive font-body block mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                required
                className="w-full p-2.5 rounded-xl bg-cream border border-beige/30 text-xs text-olive outline-none focus:border-pistachio font-body"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={changingPass}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-pistachio to-sage text-white text-xs font-semibold hover:opacity-95 disabled:opacity-50 shadow-soft"
            >
              {changingPass ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>

      {/* ── 2. NOTIFICATIONS PREFERENCES ─────────────────────────────── */}
      <div className="bg-soft-white rounded-3xl p-6 sm:p-8 border border-beige/20 shadow-soft space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-beige/20">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-olive">Notification Alerts</h3>
            <p className="text-xs text-olive/50 font-body">Choose notifications you want to receive</p>
          </div>
        </div>

        {prefSaved && (
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-body">
            Preferences saved ✓
          </div>
        )}

        <form onSubmit={handleSavePreferences} className="space-y-3">
          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-cream/40 border border-beige/20 cursor-pointer">
            <div>
              <p className="text-xs font-semibold text-olive font-body">School Circulars & Announcements</p>
              <p className="text-[11px] text-olive/50 font-body">Get notified when urgent announcements are published</p>
            </div>
            <input
              type="checkbox"
              checked={notifyAnnouncements}
              onChange={(e) => setNotifyAnnouncements(e.target.checked)}
              className="w-4 h-4 accent-pistachio rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-cream/40 border border-beige/20 cursor-pointer">
            <div>
              <p className="text-xs font-semibold text-olive font-body">Principal Messages</p>
              <p className="text-[11px] text-olive/50 font-body">Receive instant notifications for messages from administration</p>
            </div>
            <input
              type="checkbox"
              checked={notifyMessages}
              onChange={(e) => setNotifyMessages(e.target.checked)}
              className="w-4 h-4 accent-pistachio rounded"
            />
          </label>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-cream text-olive text-xs font-semibold hover:bg-beige/30 transition-colors border border-beige/30"
            >
              Save Preferences
            </button>
          </div>
        </form>
      </div>

      {/* ── 3. SESSION LOGOUT ────────────────────────────────────────── */}
      <div className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft flex items-center justify-between">
        <div>
          <h4 className="font-display font-bold text-sm text-olive">Sign Out of BloomDesk</h4>
          <p className="text-xs text-olive/50 font-body mt-0.5">End your active teacher session on this device</p>
        </div>
        <button
          onClick={() => logout()}
          className="px-5 py-2 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" /> Logout
        </button>
      </div>
    </div>
  )
}
