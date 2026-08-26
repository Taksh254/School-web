"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
  Palette,
  Plus,
  Search,
  ArrowLeft,
  X,
  Trash2,
  Calendar,
  Sparkles,
  Users,
} from "lucide-react"
import {
  getTeacherAssignedStudents,
  getClassActivities,
  saveClassActivity,
  deleteClassActivity,
} from "@/app/actions/teacher-portal-actions"
import type { ClassActivity, ActivityType, ProgramType } from "@/lib/types"

const ACTIVITY_TYPES: { id: ActivityType; emoji: string; label: string }[] = [
  { id: "Drawing", emoji: "🎨", label: "Drawing & Painting" },
  { id: "Storytelling", emoji: "📚", label: "Storytelling" },
  { id: "Music", emoji: "🎵", label: "Music & Rhymes" },
  { id: "Outdoor Play", emoji: "🏃", label: "Outdoor Play" },
  { id: "Numbers", emoji: "🔢", label: "Numbers & Counting" },
  { id: "Alphabet", emoji: "🔤", label: "Alphabet & Phonics" },
  { id: "Puzzle", emoji: "🧩", label: "Puzzles & Blocks" },
  { id: "Craft", emoji: "✂️", label: "Paper & Craft" },
  { id: "General", emoji: "🌟", label: "General Activity" },
]

export default function TeacherActivitiesPage() {
  const [activities, setActivities] = useState<ClassActivity[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [activityType, setActivityType] = useState<ActivityType>("Drawing")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [program, setProgram] = useState<ProgramType>("Nursery")
  const [section, setSection] = useState("A")
  const [participation, setParticipation] = useState("")
  const [observations, setObservations] = useState("")
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [studRes, actRes] = await Promise.all([
        getTeacherAssignedStudents(),
        getClassActivities(),
      ])
      if (studRes.students && studRes.students.length > 0) {
        setStudents(studRes.students)
        setProgram(studRes.students[0].program)
        setSection(studRes.students[0].section)
      }
      if (actRes.data) setActivities(actRes.data)
    } catch (err) {
      console.error("Error loading activities:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenAdd = () => {
    setEditingId(null)
    setTitle("")
    setDescription("")
    setActivityType("Drawing")
    setParticipation("Full class participation")
    setObservations("")
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) return
    setSaving(true)
    try {
      const res = await saveClassActivity({
        id: editingId || undefined,
        title: title.trim(),
        description: description.trim(),
        activityType,
        date,
        program,
        section,
        studentParticipation: participation.trim(),
        observations: observations.trim(),
      })
      if (res.success) {
        setModalOpen(false)
        loadData()
      } else {
        alert(res.error || "Failed to save activity")
      }
    } catch (err: any) {
      alert(err?.message || "Error saving activity")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this class activity?")) return
    try {
      const res = await deleteClassActivity(id)
      if (res.success) {
        setActivities((prev) => prev.filter((a) => a.id !== id))
      } else {
        alert(res.error || "Failed to delete activity")
      }
    } catch (err: any) {
      alert(err?.message || "Error deleting")
    }
  }

  const filtered = activities.filter((a) => {
    const q = search.toLowerCase().trim()
    const matchesSearch =
      !q ||
      a.title.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q)
    const matchesType = typeFilter === "all" || a.activityType === typeFilter
    return matchesSearch && matchesType
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
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-olive">Class Activities</h1>
          <p className="text-xs sm:text-sm text-olive/60 font-body">
            Plan, record, and track developmental learning activities for your class
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium font-body shadow-soft hover:opacity-95 transition-opacity shrink-0"
        >
          <Plus className="w-4 h-4" />
          Plan Activity
        </button>
      </div>

      {/* ── SEARCH & ACTIVITY TYPE FILTER ───────────────────────────── */}
      <div className="bg-soft-white rounded-3xl p-4 sm:p-5 border border-beige/20 shadow-soft space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-olive/40 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activities by title or description..."
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-cream border border-beige/25 text-sm text-olive placeholder:text-olive/40 outline-none focus:border-pistachio transition-all font-body"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <button
            onClick={() => setTypeFilter("all")}
            className={`px-3 py-1 rounded-full text-xs font-medium font-body transition-all ${
              typeFilter === "all"
                ? "bg-pistachio text-white shadow-soft"
                : "bg-cream text-olive/60 hover:bg-beige/30"
            }`}
          >
            All Activities
          </button>
          {ACTIVITY_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTypeFilter(t.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium font-body transition-all flex items-center gap-1 ${
                typeFilter === t.id
                  ? "bg-pistachio text-white shadow-soft"
                  : "bg-cream text-olive/60 hover:bg-beige/30"
              }`}
            >
              <span>{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── ACTIVITIES LIST ─────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[250px]">
          <div className="w-8 h-8 rounded-full border-3 border-pistachio border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-soft-white rounded-3xl p-12 border border-beige/20 shadow-soft text-center">
          <Palette className="w-10 h-10 text-olive/20 mx-auto mb-2" />
          <h3 className="text-base font-display font-semibold text-olive">No activities planned yet</h3>
          <p className="text-xs text-olive/50 font-body mt-1 max-w-sm mx-auto mb-4">
            Plan drawing, storytelling, music, or sensory play activities for your students.
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-pistachio text-white text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" /> Plan First Activity
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((act) => {
            const typeInfo = ACTIVITY_TYPES.find((t) => t.id === act.activityType) || { emoji: "🎨", label: act.activityType }
            return (
              <motion.div
                key={act.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl p-2 rounded-2xl bg-cream border border-beige/25">
                        {typeInfo.emoji}
                      </span>
                      <div>
                        <h3 className="font-display font-bold text-base text-olive">{act.title}</h3>
                        <span className="text-xs text-olive/40 font-body">
                          {act.date} • {act.program} (Sec {act.section})
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

                  <p className="text-xs text-olive/75 font-body leading-relaxed mb-3">{act.description}</p>

                  {act.studentParticipation && (
                    <div className="bg-cream/40 rounded-xl p-2.5 border border-beige/15 text-[11px] text-olive/70 font-body mb-2">
                      <span className="font-semibold text-olive/80">Participation: </span>
                      {act.studentParticipation}
                    </div>
                  )}

                  {act.observations && (
                    <div className="bg-emerald-50/50 rounded-xl p-2.5 border border-emerald-200/50 text-[11px] text-emerald-800 font-body">
                      <span className="font-semibold">Observation: </span>
                      {act.observations}
                    </div>
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-beige/15 flex items-center justify-between text-xs text-olive/40 font-body">
                  <span>Led by {act.teacherName || "Teacher"}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-cream text-olive/60 font-medium text-[10px]">
                    {act.activityType}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* ── ADD/EDIT ACTIVITY MODAL ─────────────────────────────────── */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-soft-white rounded-[32px] p-6 sm:p-8 max-w-xl w-full border border-beige/25 shadow-card my-8"
            >
              <div className="flex items-center justify-between pb-4 border-b border-beige/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-pistachio/15 text-olive flex items-center justify-center">
                    <Palette className="w-4 h-4 text-pistachio" />
                  </div>
                  <div>
                    <h2 className="text-lg font-display font-bold text-olive">
                      {editingId ? "Edit Activity" : "Plan Class Activity"}
                    </h2>
                    <p className="text-xs text-olive/50 font-body">Create engaging classroom experiences</p>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-olive font-body block mb-1">Activity Type *</label>
                    <select
                      value={activityType}
                      onChange={(e) => setActivityType(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl bg-cream border border-beige/30 text-xs text-olive outline-none focus:border-pistachio font-body"
                    >
                      {ACTIVITY_TYPES.map((t) => (
                        <option key={t.id} value={t.id}>{t.emoji} {t.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-olive font-body block mb-1">Date *</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="w-full p-2.5 rounded-xl bg-cream border border-beige/30 text-xs text-olive outline-none focus:border-pistachio font-body"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-olive font-body block mb-1">Activity Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Finger Painting & Primary Colors Exploration"
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

                <div>
                  <label className="text-xs font-semibold text-olive font-body block mb-1">Activity Description *</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Step-by-step description of the activity and materials used..."
                    required
                    className="w-full p-3 rounded-2xl bg-cream border border-beige/30 text-xs text-olive placeholder:text-olive/40 outline-none focus:border-pistachio font-body"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-olive font-body block mb-1">Student Participation</label>
                  <input
                    type="text"
                    value={participation}
                    onChange={(e) => setParticipation(e.target.value)}
                    placeholder="e.g. All 22 students participated with high enthusiasm"
                    className="w-full p-2.5 rounded-xl bg-cream border border-beige/30 text-xs text-olive placeholder:text-olive/40 outline-none focus:border-pistachio font-body"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-olive font-body block mb-1">Teacher Observations</label>
                  <textarea
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    rows={2}
                    placeholder="Key learning outcomes or individual milestones observed..."
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
                    {saving ? "Saving..." : editingId ? "Update Activity" : "Save Activity"}
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
