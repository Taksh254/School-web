"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  User,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  Calendar,
  Briefcase,
  ShieldCheck,
  Save,
  ArrowLeft,
  Sparkles,
} from "lucide-react"
import {
  getTeacherProfileData,
  updateTeacherProfileData,
} from "@/app/actions/teacher-portal-actions"
import type { Teacher } from "@/lib/types"

export default function TeacherProfilePage() {
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Editable form state
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [emergencyContact, setEmergencyContact] = useState("")
  const [specialization, setSpecialization] = useState("")
  const [qualification, setQualification] = useState("")
  const [experience, setExperience] = useState("")
  const [photo, setPhoto] = useState("")

  const loadProfile = async () => {
    setLoading(true)
    try {
      const res = await getTeacherProfileData()
      if (res.teacher) {
        setTeacher(res.teacher)
        setPhone(res.teacher.phone || "")
        setAddress(res.teacher.address || "")
        setEmergencyContact(res.teacher.emergency_contact || "")
        setSpecialization(res.teacher.specialization || "")
        setQualification(res.teacher.qualification || "")
        setExperience(res.teacher.experience || "")
        setPhoto(res.teacher.photo || "")
      }
    } catch (err) {
      console.error("Error loading profile:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSavedSuccess(false)
    try {
      const res = await updateTeacherProfileData({
        phone,
        address,
        emergencyContact,
        specialization,
        qualification,
        experience,
        photo,
      })
      if (res.success) {
        setSavedSuccess(true)
        setTimeout(() => setSavedSuccess(false), 4000)
        loadProfile()
      } else {
        alert(res.error || "Failed to update profile")
      }
    } catch (err: any) {
      alert(err?.message || "Error updating profile")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <div className="w-8 h-8 rounded-full border-3 border-pistachio border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard/teacher" className="text-xs text-olive/50 hover:text-olive flex items-center gap-1 font-body">
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-olive">My Profile</h1>
          <p className="text-xs sm:text-sm text-olive/60 font-body">
            View your teacher credentials and update your contact details
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 font-body">
          Profile details updated successfully ✓
        </div>
      )}

      {/* ── MAIN CARD ───────────────────────────────────────────────── */}
      <div className="bg-soft-white rounded-3xl p-6 sm:p-8 border border-beige/20 shadow-soft">
        {/* Profile Card Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-beige/20">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-pistachio to-sage flex items-center justify-center text-white text-3xl font-display font-bold shadow-card overflow-hidden shrink-0">
            {photo ? (
              <img src={photo} alt={teacher?.full_name} className="w-full h-full object-cover" />
            ) : (
              teacher?.full_name?.charAt(0) || "T"
            )}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-display font-bold text-olive">{teacher?.full_name}</h2>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                {teacher?.status || "Active"}
              </span>
            </div>
            <p className="text-sm font-medium text-olive/70 font-body">{teacher?.designation || "Class Teacher"} • {teacher?.department || "Primary"}</p>
            <p className="text-xs font-mono text-olive/40">{teacher?.teacher_id} • {teacher?.email}</p>
          </div>
        </div>

        {/* Read-Only School Details */}
        <div className="py-6 border-b border-beige/20 space-y-3">
          <h3 className="text-xs font-bold text-olive uppercase tracking-wider font-body">
            School & Administrative Details (Read-Only)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-body">
            <div className="p-3 bg-cream/40 rounded-xl border border-beige/20">
              <span className="text-olive/40 block text-[10px]">Joining Date</span>
              <span className="font-semibold text-olive">{teacher?.joining_date || "—"}</span>
            </div>
            <div className="p-3 bg-cream/40 rounded-xl border border-beige/20">
              <span className="text-olive/40 block text-[10px]">Employment</span>
              <span className="font-semibold text-olive">{teacher?.employment_type || "Full Time"}</span>
            </div>
            <div className="p-3 bg-cream/40 rounded-xl border border-beige/20">
              <span className="text-olive/40 block text-[10px]">Assigned Class</span>
              <span className="font-semibold text-olive">{teacher?.department || "Primary"}</span>
            </div>
            <div className="p-3 bg-cream/40 rounded-xl border border-beige/20">
              <span className="text-olive/40 block text-[10px]">Role</span>
              <span className="font-semibold text-olive">Class Teacher</span>
            </div>
          </div>
        </div>

        {/* Editable Personal Details Form */}
        <form onSubmit={handleSubmit} className="pt-6 space-y-4">
          <h3 className="text-xs font-bold text-olive uppercase tracking-wider font-body">
            Personal & Contact Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-olive font-body block mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 00000"
                className="w-full p-2.5 rounded-xl bg-cream border border-beige/30 text-xs text-olive outline-none focus:border-pistachio font-body"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-olive font-body block mb-1">Emergency Contact</label>
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="+91 98765 00001"
                className="w-full p-2.5 rounded-xl bg-cream border border-beige/30 text-xs text-olive outline-none focus:border-pistachio font-body"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-olive font-body block mb-1">Residential Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full address..."
              className="w-full p-2.5 rounded-xl bg-cream border border-beige/30 text-xs text-olive outline-none focus:border-pistachio font-body"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-olive font-body block mb-1">Educational Qualification</label>
              <input
                type="text"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                placeholder="e.g. B.Ed, Early Childhood Care"
                className="w-full p-2.5 rounded-xl bg-cream border border-beige/30 text-xs text-olive outline-none focus:border-pistachio font-body"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-olive font-body block mb-1">Experience / Specialization</label>
              <input
                type="text"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="e.g. 5 Years in Montessori Pre-Schooling"
                className="w-full p-2.5 rounded-xl bg-cream border border-beige/30 text-xs text-olive outline-none focus:border-pistachio font-body"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-olive font-body block mb-1">Photo URL (Optional)</label>
            <input
              type="text"
              value={photo}
              onChange={(e) => setPhoto(e.target.value)}
              placeholder="https://..."
              className="w-full p-2.5 rounded-xl bg-cream border border-beige/30 text-xs text-olive outline-none focus:border-pistachio font-body"
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-pistachio to-sage text-white text-xs font-semibold hover:opacity-95 disabled:opacity-50 shadow-soft"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving Changes..." : "Save Profile Details"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
