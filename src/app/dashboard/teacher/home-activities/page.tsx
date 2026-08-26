"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
  BookOpen,
  Plus,
  Search,
  ArrowLeft,
  X,
  Trash2,
  Calendar,
  Home,
  CheckCircle,
} from "lucide-react"
import {
  getTeacherAssignedStudents,
  getHomeActivities,
  saveHomeActivity,
  deleteHomeActivity,
} from "@/app/actions/teacher-portal-actions"
import type { HomeActivity, ProgramType } from "@/lib/types"

export default function TeacherHomeActivitiesPage() {
  const [activities, setActivities] = useState<HomeActivity[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [instructions, setInstructions] = useState("")
  const [program, setProgram] = useState<ProgramType>("Nursery")
  const [section, setSection] = useState("A")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [dueDate, setDueDate] = useState("")
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [studRes, actRes] = await Promise.all([
        getTeacherAssignedStudents(),
        getHomeActivities(),
      ])
      if (studRes.students && studRes.students.length > 0) {
        setStudents(studRes.students)
        setProgram(studRes.students[0].program)
        setSection(studRes.students[0].section)
      }
      if (actRes.data) setActivities(actRes.data)
    } catch (err) {
      console.error("Error loading home activities:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenAdd = () => {
    setTitle("")
    setInstructions("")
    const d = new Date()
    d.setDate(d.getDate() + 3)
    setDueDate(d.toISOString().slice(0, 10))
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !instructions.trim()) return
    setSaving(true)
    try {
      const res = await saveHomeActivity({
        title: title.trim(),
        instructions: instructions.trim(),
        program,
        section,
        date,
        dueDate: dueDate || undefined,
      })
      if (res.success) {
        setModalOpen(false)
        loadData()
      } else {
        alert(res.error || "Failed to save home activity")
      }
    } catch (err: any) {
      alert(err?.message || "Error saving")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this home activity?")) return
    try {
      const res = await deleteHomeActivity(id)
      if (res.success) {
        setActivities((prev) => prev.filter((a) => a.id !== id))
      } else {
        alert(res.error || "Failed to delete")
      }
    } catch (err: any) {
      alert(err?.message || "Error deleting")
    }
  }

  const filtered = activities.filter((a) => {
    const q = search.toLowerCase().trim()
    return (
      !q ||
      a.title.toLowerCase().includes(q) ||
      a.instructions.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard/teacher" className="text-xs text-olive/50 hover:text-olive flex items-center gap-1 font-body">
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-olive">Home Activities</h1>
          <p className="text-xs sm:text-sm text-olive/60 font-body">
            Simple, engaging at-home tasks for parents and children to practice together
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium font-body shadow-soft hover:opacity-95 transition-opacity shrink-0"
        >
          <Plus className="w-4 h-4" />
          Assign Home Activity
        </button>
      </div>

      {/* ── SEARCH ──────────────────────────────────────────────────── */}
      <div className="bg-soft-white rounded-3xl p-4 sm:p-5 border border-beige/20 shadow-soft">
        <div className="relative">
          <Search className="w-4 h-4 text-olive/40 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search home activities..."
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-cream border border-beige/25 text-sm text-olive placeholder:text-olive/40 outline-none focus:border-pistachio transition-all font-body"
          />
        </div>
      </div>

      {/* ── ACTIVITIES GRID ─────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[250px]">
          <div className="w-8 h-8 rounded-full border-3 border-pistachio border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-soft-white rounded-3xl p-12 border border-beige/20 shadow-soft text-center">
          <BookOpen className="w-10 h-10 text-olive/20 mx-auto mb-2" />
          <h3 className="text-base font-display font-semibold text-olive">No home activities assigned yet</h3>
          <p className="text-xs text-olive/50 font-body mt-1 max-w-sm mx-auto mb-4">
            Assign fun parent-child engagement activities like color spotting, counting toys, or reading storybooks.
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-pistachio text-white text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" /> Assign First Activity
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((act) => (
            <motion.div
              key={act.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-800 shrink-0">
                      <Home className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base text-olive">{act.title}</h3>
                      <span className="text-xs text-olive/40 font-body">
                        {act.program} (Sec {act.section}) • Assigned on {act.date}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(act.id)}
                    className="p-1.5 rounded-lg text-olive/30 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete activity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="bg-cream/40 rounded-2xl p-4 border border-beige/20 mb-3">
                  <h4 className="text-[11px] font-bold text-olive uppercase tracking-wider font-body mb-1">
                    Parent Instructions:
                  </h4>
                  <p className="text-xs text-olive/75 font-body leading-relaxed whitespace-pre-wrap">
                    {act.instructions}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-beige/15 flex items-center justify-between text-xs text-olive/50 font-body">
                <span>By {act.teacherName || "Teacher"}</span>
                {act.dueDate && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-medium text-[11px] border border-amber-200">
                    Due: {act.dueDate}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── ASSIGN MODAL ────────────────────────────────────────────── */}
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
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-display font-bold text-olive">Assign Home Activity</h2>
                    <p className="text-xs text-olive/50 font-body">Visible to parents in Parent Portal</p>
                  </div>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-cream hover:bg-beige/40 flex items-center justify-center text-olive/60"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-olive font-body block mb-1">Activity Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Color Hunt: Spot 5 Red and 5 Yellow Objects"
                    required
                    className="w-full p-2.5 rounded-xl bg-cream border border-beige/30 text-xs text-olive placeholder:text-olive/40 outline-none focus:border-pistachio font-body"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-olive font-body block mb-1">Class Program *</label>
                    <select
                      value={program}
                      onChange={(e) => setProgram(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl bg-cream border border-beige/30 text-xs text-olive outline-none focus:border-pistachio font-body"
                    >
                      {["Play Group", "Nursery", "LKG", "UKG"].map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-olive font-body block mb-1">Section *</label>
                    <select
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-cream border border-beige/30 text-xs text-olive outline-none focus:border-pistachio font-body"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-olive font-body block mb-1">Assigned Date *</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="w-full p-2.5 rounded-xl bg-cream border border-beige/30 text-xs text-olive outline-none focus:border-pistachio font-body"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-olive font-body block mb-1">Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-cream border border-beige/30 text-xs text-olive outline-none focus:border-pistachio font-body"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-olive font-body block mb-1">Parent Instructions *</label>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    rows={4}
                    placeholder="Provide clear, simple instructions for parents to guide their child..."
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
                    disabled={saving}
                    className="px-6 py-2.5 rounded-full bg-gradient-to-r from-pistachio to-sage text-white text-xs font-semibold hover:opacity-95 disabled:opacity-50"
                  >
                    {saving ? "Assigning..." : "Assign Home Activity"}
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
