"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ClipboardList, Search, Filter, Trash2, Eye, X,
  CheckCircle, Clock, PhoneCall, XCircle, ChevronDown,
  RefreshCw, Calendar, User, Mail, Phone, MessageSquare,
} from "lucide-react"
import Modal from "@/components/dashboard/Modal"

// ── Types ──────────────────────────────────────────────────────────────────

type InquiryStatus = "Pending" | "Contacted" | "Admitted" | "Rejected"

interface Inquiry {
  id: string
  child_name: string
  date_of_birth: string
  program: string
  parent_name: string
  email: string
  phone: string
  message: string | null
  status: InquiryStatus
  created_at: string
  updated_at: string | null
  notes: string | null
}

// ── Status config ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<InquiryStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  Pending:   { label: "Pending",   color: "text-amber-700",  bg: "bg-amber-50 border-amber-200",   icon: Clock },
  Contacted: { label: "Contacted", color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",     icon: PhoneCall },
  Admitted:  { label: "Admitted",  color: "text-pistachio",  bg: "bg-pistachio/10 border-pistachio/20", icon: CheckCircle },
  Rejected:  { label: "Rejected",  color: "text-red-600",    bg: "bg-red-50 border-red-200",       icon: XCircle },
}

const ALL_STATUSES: InquiryStatus[] = ["Pending", "Contacted", "Admitted", "Rejected"]

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

function formatRefId(uuid: string): string {
  return `TM-${uuid.slice(0, 8).toUpperCase()}`
}

// ── StatusBadge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: InquiryStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.Pending
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border font-body ${cfg.bg} ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | InquiryStatus>("all")

  const [selected, setSelected] = useState<Inquiry | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Inquiry | null>(null)

  const [statusUpdating, setStatusUpdating] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [adminNotes, setAdminNotes] = useState("")
  const [savingNotes, setSavingNotes] = useState(false)

  // ── Fetch ──────────────────────────────────────────────────────────────

  const fetchEnquiries = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filterStatus !== "all") params.set("status", filterStatus)
      if (search.trim()) params.set("search", search.trim())

      const res = await fetch(`/api/enquiry?${params}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to load enquiries")
      setEnquiries(json.enquiries ?? [])
    } catch (err: any) {
      setError(err.message || "Failed to load enquiries")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [filterStatus, search])

  useEffect(() => { fetchEnquiries() }, [fetchEnquiries])

  // ── Update status ──────────────────────────────────────────────────────

  const handleStatusChange = async (id: string, newStatus: InquiryStatus) => {
    setStatusUpdating(id)
    try {
      const res = await fetch("/api/enquiry", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setEnquiries((prev) => prev.map((e) => e.id === id ? { ...e, status: newStatus, updated_at: json.enquiry?.updated_at ?? e.updated_at } : e))
      if (selected?.id === id) setSelected((prev) => prev ? { ...prev, status: newStatus } : null)
    } catch (err: any) {
      setError("Failed to update status: " + err.message)
    } finally {
      setStatusUpdating(null)
    }
  }

  // ── Save notes ─────────────────────────────────────────────────────────

  const handleSaveNotes = async () => {
    if (!selected) return
    setSavingNotes(true)
    try {
      const res = await fetch("/api/enquiry", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, notes: adminNotes }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setEnquiries((prev) => prev.map((e) => e.id === selected.id ? { ...e, notes: adminNotes } : e))
      setSelected((prev) => prev ? { ...prev, notes: adminNotes } : null)
    } catch (err: any) {
      setError("Failed to save notes: " + err.message)
    } finally {
      setSavingNotes(false)
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/enquiry?id=${deleteTarget.id}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setEnquiries((prev) => prev.filter((e) => e.id !== deleteTarget.id))
      if (selected?.id === deleteTarget.id) setSelected(null)
      setDeleteTarget(null)
    } catch (err: any) {
      setError("Failed to delete: " + err.message)
    } finally {
      setDeleting(false)
    }
  }

  // ── Open detail modal ──────────────────────────────────────────────────

  const openDetail = (enq: Inquiry) => {
    setSelected(enq)
    setAdminNotes(enq.notes ?? "")
  }

  // ── Counts ─────────────────────────────────────────────────────────────

  const counts = {
    all: enquiries.length,
    Pending: enquiries.filter((e) => e.status === "Pending").length,
    Contacted: enquiries.filter((e) => e.status === "Contacted").length,
    Admitted: enquiries.filter((e) => e.status === "Admitted").length,
    Rejected: enquiries.filter((e) => e.status === "Rejected").length,
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-display font-bold text-olive">Admission Enquiries</h1>
          <p className="text-sm text-olive/50 font-body">View and manage all admission inquiry submissions</p>
        </div>
        <button
          onClick={() => fetchEnquiries(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cream hover:bg-beige/40 text-olive text-xs font-medium border border-beige/20 transition-all shadow-soft font-body disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stat pills */}
      <div className="flex flex-wrap gap-2">
        {(["all", ...ALL_STATUSES] as const).map((s) => {
          const isActive = filterStatus === s
          const count = s === "all" ? counts.all : counts[s]
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all font-body flex items-center gap-1.5 ${
                isActive
                  ? "bg-pistachio/15 text-olive shadow-[inset_0_0_0_1px_rgba(183,201,168,0.3)]"
                  : "bg-cream text-olive/50 hover:text-olive"
              }`}
            >
              {s === "all" ? "All" : s}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? "bg-pistachio/20 text-olive" : "bg-beige/40 text-olive/40"}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-olive/30" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, phone..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-soft-white border border-beige/20 text-sm text-olive outline-none focus:border-pistachio transition-all font-body"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-olive/30 hover:text-olive">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-700 font-body flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-2">×</button>
        </div>
      )}

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-soft-white rounded-3xl border border-beige/20 shadow-soft overflow-hidden">

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-pistachio border-t-transparent animate-spin" />
          </div>
        ) : enquiries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-cream flex items-center justify-center mb-4 text-olive/30">
              <ClipboardList className="w-7 h-7" />
            </div>
            <p className="text-sm font-display font-semibold text-olive">No enquiries found</p>
            <p className="text-xs text-olive/40 font-body mt-1">
              {search || filterStatus !== "all" ? "Try changing your search or filter." : "New enquiries will appear here automatically."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-cream/60 text-left text-[10px] font-bold text-olive/50 uppercase tracking-wider border-b border-beige/20">
                  <th className="px-5 py-3.5 font-body">Reference</th>
                  <th className="px-5 py-3.5 font-body">Child</th>
                  <th className="px-5 py-3.5 font-body">Program</th>
                  <th className="px-5 py-3.5 font-body">Parent</th>
                  <th className="px-5 py-3.5 font-body">Contact</th>
                  <th className="px-5 py-3.5 font-body">Status</th>
                  <th className="px-5 py-3.5 font-body">Date</th>
                  <th className="px-5 py-3.5 font-body">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-beige/10">
                {enquiries.map((enq) => (
                  <motion.tr
                    key={enq.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-cream/30 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-mono text-olive/50">{formatRefId(enq.id)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-olive">{enq.child_name}</p>
                      <p className="text-[11px] text-olive/40 font-body">DOB: {enq.date_of_birth}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 rounded-lg bg-sage/10 text-olive text-xs font-medium font-body">{enq.program}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-olive font-body">{enq.parent_name}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-xs text-olive/70 font-body">{enq.email}</p>
                      <p className="text-xs text-olive/50 font-body">{enq.phone}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      {/* Inline status dropdown */}
                      <div className="relative group">
                        <button
                          disabled={statusUpdating === enq.id}
                          className="flex items-center gap-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            const next = document.getElementById(`status-dd-${enq.id}`)
                            next?.classList.toggle("hidden")
                          }}
                        >
                          {statusUpdating === enq.id ? (
                            <div className="w-4 h-4 rounded-full border-2 border-pistachio border-t-transparent animate-spin" />
                          ) : (
                            <>
                              <StatusBadge status={enq.status} />
                              <ChevronDown className="w-3 h-3 text-olive/30" />
                            </>
                          )}
                        </button>
                        <div
                          id={`status-dd-${enq.id}`}
                          className="hidden absolute left-0 top-full mt-1 z-20 bg-white rounded-xl border border-beige/20 shadow-card py-1 min-w-[140px]"
                          onBlur={() => document.getElementById(`status-dd-${enq.id}`)?.classList.add("hidden")}
                        >
                          {ALL_STATUSES.map((s) => (
                            <button
                              key={s}
                              onClick={(e) => {
                                e.stopPropagation()
                                document.getElementById(`status-dd-${enq.id}`)?.classList.add("hidden")
                                if (s !== enq.status) handleStatusChange(enq.id, s)
                              }}
                              className={`w-full text-left px-3.5 py-2 text-xs font-medium font-body transition-colors hover:bg-cream/70 ${s === enq.status ? "text-pistachio" : "text-olive/70"}`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-olive/50 font-body whitespace-nowrap">{formatDate(enq.created_at)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openDetail(enq)}
                          className="p-1.5 rounded-lg hover:bg-cream text-olive/40 hover:text-olive transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(enq)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-olive/40 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Enquiry Details" maxWidth="max-w-lg">
        {selected && (
          <div className="space-y-5">
            {/* Reference + Status */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-olive/40">{formatRefId(selected.id)}</span>
              <StatusBadge status={selected.status} />
            </div>

            {/* Child info */}
            <div className="bg-cream/40 rounded-2xl p-4 border border-beige/10 space-y-2.5 text-sm">
              <h4 className="text-[10px] font-bold text-olive/40 uppercase tracking-wider font-body mb-3">Child Information</h4>
              <div className="flex justify-between">
                <span className="text-olive/50 font-body">Name</span>
                <span className="font-medium text-olive">{selected.child_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-olive/50 font-body">Date of Birth</span>
                <span className="font-medium text-olive">{selected.date_of_birth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-olive/50 font-body">Program</span>
                <span className="font-medium text-olive">{selected.program}</span>
              </div>
            </div>

            {/* Parent info */}
            <div className="bg-cream/40 rounded-2xl p-4 border border-beige/10 space-y-2.5 text-sm">
              <h4 className="text-[10px] font-bold text-olive/40 uppercase tracking-wider font-body mb-3">Parent / Guardian</h4>
              <div className="flex items-center gap-2.5">
                <User className="w-3.5 h-3.5 text-olive/30 shrink-0" />
                <span className="text-olive">{selected.parent_name}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-3.5 h-3.5 text-olive/30 shrink-0" />
                <a href={`mailto:${selected.email}`} className="text-olive hover:text-pistachio transition-colors">{selected.email}</a>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-3.5 h-3.5 text-olive/30 shrink-0" />
                <a href={`tel:${selected.phone}`} className="text-olive hover:text-pistachio transition-colors">{selected.phone}</a>
              </div>
            </div>

            {/* Message */}
            {selected.message && (
              <div className="bg-cream/40 rounded-2xl p-4 border border-beige/10 text-sm">
                <div className="flex items-center gap-1.5 mb-2">
                  <MessageSquare className="w-3.5 h-3.5 text-olive/30" />
                  <h4 className="text-[10px] font-bold text-olive/40 uppercase tracking-wider font-body">Message</h4>
                </div>
                <p className="text-olive/70 font-body leading-relaxed">{selected.message}</p>
              </div>
            )}

            {/* Dates */}
            <div className="flex items-center gap-4 text-xs text-olive/40 font-body">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Submitted {formatDate(selected.created_at)}</span>
              {selected.updated_at && <span>· Updated {formatDate(selected.updated_at)}</span>}
            </div>

            {/* Change Status */}
            <div>
              <p className="text-xs font-semibold text-olive mb-2 font-body">Update Status</p>
              <div className="flex flex-wrap gap-2">
                {ALL_STATUSES.map((s) => (
                  <button
                    key={s}
                    disabled={statusUpdating === selected.id}
                    onClick={() => handleStatusChange(selected.id, s)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-medium font-body border transition-all ${
                      selected.status === s
                        ? "bg-pistachio/15 border-pistachio/30 text-olive"
                        : "bg-cream border-beige/20 text-olive/50 hover:text-olive hover:border-pistachio/20"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Admin Notes */}
            <div>
              <p className="text-xs font-semibold text-olive mb-2 font-body">Internal Notes</p>
              <textarea
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes visible only to admins..."
                className="w-full px-4 py-3 rounded-2xl bg-cream/70 border border-beige/20 text-sm text-olive outline-none focus:border-pistachio transition-all font-body resize-none"
              />
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="mt-2 px-4 py-2 rounded-xl bg-pistachio/10 text-olive text-xs font-medium hover:bg-pistachio/20 transition-colors font-body disabled:opacity-50"
              >
                {savingNotes ? "Saving..." : "Save Notes"}
              </button>
            </div>

            {/* Delete */}
            <button
              onClick={() => { setSelected(null); setDeleteTarget(selected) }}
              className="w-full py-2.5 rounded-xl border border-red-200 text-red-500 text-xs font-medium hover:bg-red-50 transition-colors font-body flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete This Inquiry
            </button>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Enquiry" maxWidth="max-w-sm">
        <p className="text-sm text-olive/60 font-body mb-5 leading-relaxed">
          Are you sure you want to permanently delete the enquiry from <strong className="text-olive">{deleteTarget?.parent_name}</strong> for <strong className="text-olive">{deleteTarget?.child_name}</strong>? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setDeleteTarget(null)}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 rounded-xl bg-cream text-olive/60 text-sm font-medium hover:bg-beige/30 transition-colors font-body disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors font-body disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {deleting ? <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Deleting...</> : "Delete Permanently"}
          </button>
        </div>
      </Modal>
    </div>
  )
}
