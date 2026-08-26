"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
  CalendarDays,
  Plus,
  ArrowLeft,
  X,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
} from "lucide-react"
import {
  getTeacherLeaveRequests,
  submitTeacherLeaveRequest,
  cancelTeacherLeaveRequest,
} from "@/app/actions/teacher-portal-actions"
import type { TeacherLeave, LeaveType } from "@/lib/types"

const LEAVE_TYPES: LeaveType[] = ["Casual Leave", "Medical Leave", "Paid Leave", "Unpaid Leave"]

export default function TeacherLeaveRequestsPage() {
  const [leaves, setLeaves] = useState<TeacherLeave[]>([])
  const [loading, setLoading] = useState(true)

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10))
  const [leaveType, setLeaveType] = useState<LeaveType>("Casual Leave")
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const loadLeaves = async () => {
    setLoading(true)
    try {
      const res = await getTeacherLeaveRequests()
      if (res.data) setLeaves(res.data)
    } catch (err) {
      console.error("Error loading leaves:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLeaves()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!startDate || !endDate || !reason.trim()) return
    setSubmitting(true)
    try {
      const res = await submitTeacherLeaveRequest({
        startDate,
        endDate,
        type: leaveType,
        reason: reason.trim(),
      })
      if (res.success) {
        setModalOpen(false)
        setReason("")
        loadLeaves()
      } else {
        alert(res.error || "Failed to submit leave request")
      }
    } catch (err: any) {
      alert(err?.message || "Error submitting leave")
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this pending leave request?")) return
    try {
      const res = await cancelTeacherLeaveRequest(id)
      if (res.success) {
        setLeaves((prev) => prev.filter((l) => l.id !== id))
      } else {
        alert(res.error || "Failed to cancel")
      }
    } catch (err: any) {
      alert(err?.message || "Error cancelling")
    }
  }

  const pendingCount = leaves.filter((l) => l.status === "Pending").length
  const approvedCount = leaves.filter((l) => l.status === "Approved").length
  const rejectedCount = leaves.filter((l) => l.status === "Rejected").length

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard/teacher" className="text-xs text-olive/50 hover:text-olive flex items-center gap-1 font-body">
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-olive">Leave Requests</h1>
          <p className="text-xs sm:text-sm text-olive/60 font-body">
            Apply for leave, track application approvals, and view leave history
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium font-body shadow-soft hover:opacity-95 transition-opacity shrink-0"
        >
          <Plus className="w-4 h-4" />
          Apply for Leave
        </button>
      </div>

      {/* ── SUMMARY STATS ───────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-soft-white rounded-3xl p-5 border border-amber-200/60 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 font-body">Pending</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-display font-bold text-amber-900 mt-2">{pendingCount}</p>
          <p className="text-[11px] text-amber-600 font-body mt-0.5">Under Principal review</p>
        </div>

        <div className="bg-soft-white rounded-3xl p-5 border border-emerald-200/60 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 font-body">Approved</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-display font-bold text-emerald-900 mt-2">{approvedCount}</p>
          <p className="text-[11px] text-emerald-600 font-body mt-0.5">Approved applications</p>
        </div>

        <div className="bg-soft-white rounded-3xl p-5 border border-beige/20 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-olive/60 font-body">Rejected</span>
            <XCircle className="w-4 h-4 text-olive/40" />
          </div>
          <p className="text-2xl sm:text-3xl font-display font-bold text-olive mt-2">{rejectedCount}</p>
          <p className="text-[11px] text-olive/40 font-body mt-0.5">Not approved</p>
        </div>
      </div>

      {/* ── LEAVE HISTORY TABLE ──────────────────────────────────────── */}
      <div className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft">
        <h3 className="font-display font-bold text-base text-olive mb-4">Leave Application History</h3>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 rounded-full border-3 border-pistachio border-t-transparent animate-spin" />
          </div>
        ) : leaves.length === 0 ? (
          <div className="text-center py-12">
            <CalendarDays className="w-10 h-10 text-olive/20 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-olive font-body">No leave applications submitted</h4>
            <p className="text-xs text-olive/50 font-body mt-0.5 mb-4">
              When you submit a leave request, it will appear here for status tracking.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-pistachio text-white text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" /> Apply for Leave
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {leaves.map((l) => (
              <div
                key={l.id}
                className="p-4 rounded-2xl bg-cream/30 border border-beige/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-body"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-olive text-sm">{l.type}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                        l.status === "Approved"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : l.status === "Pending"
                          ? "bg-amber-100 text-amber-800 border-amber-200"
                          : "bg-rose-100 text-rose-800 border-rose-200"
                      }`}
                    >
                      {l.status}
                    </span>
                  </div>
                  <p className="text-olive/70 font-mono">
                    {l.start_date} → {l.end_date} (Applied on: {l.applied_on})
                  </p>
                  <p className="text-olive/80 italic">&quot;{l.reason}&quot;</p>
                </div>

                {l.status === "Pending" && (
                  <button
                    onClick={() => handleCancel(l.id)}
                    className="self-start sm:self-center px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Cancel Request
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── APPLY LEAVE MODAL ───────────────────────────────────────── */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-soft-white rounded-[32px] p-6 sm:p-8 max-w-lg w-full border border-beige/25 shadow-card"
            >
              <div className="flex items-center justify-between pb-4 border-b border-beige/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-pistachio/15 text-olive flex items-center justify-center">
                    <CalendarDays className="w-4 h-4 text-pistachio" />
                  </div>
                  <div>
                    <h2 className="text-lg font-display font-bold text-olive">Apply for Leave</h2>
                    <p className="text-xs text-olive/50 font-body">Submit leave for Principal approval</p>
                  </div>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-cream hover:bg-beige/40 flex items-center justify-center text-olive/60"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-olive font-body block mb-1">Leave Type *</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-cream border border-beige/30 text-xs text-olive outline-none focus:border-pistachio font-body"
                  >
                    {LEAVE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-olive font-body block mb-1">From Date *</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      className="w-full p-2.5 rounded-xl bg-cream border border-beige/30 text-xs text-olive outline-none focus:border-pistachio font-body"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-olive font-body block mb-1">To Date *</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                      className="w-full p-2.5 rounded-xl bg-cream border border-beige/30 text-xs text-olive outline-none focus:border-pistachio font-body"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-olive font-body block mb-1">Reason for Leave *</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    placeholder="Provide details regarding the reason for your leave request..."
                    required
                    className="w-full p-3 rounded-2xl bg-cream border border-beige/30 text-xs text-olive placeholder:text-olive/40 outline-none focus:border-pistachio font-body"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-5 py-2.5 rounded-full bg-cream text-olive text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-full bg-gradient-to-r from-pistachio to-sage text-white text-xs font-semibold hover:opacity-95 disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : "Submit Application"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
