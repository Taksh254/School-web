"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
  Sparkles,
  Plus,
  Search,
  Filter,
  ArrowLeft,
  X,
  Trash2,
  CheckCircle,
  Calendar,
  Smile,
  Users,
} from "lucide-react"
import {
  getTeacherAssignedStudents,
  getStudentDevelopmentList,
  saveStudentDevelopment,
  deleteStudentDevelopment,
} from "@/app/actions/teacher-portal-actions"
import type { Student, StudentDevelopment, DevelopmentRating } from "@/lib/types"

const RATINGS: DevelopmentRating[] = ["Needs Support", "Developing", "Good", "Very Good", "Excellent"]

const RATING_COLORS: Record<DevelopmentRating, string> = {
  "Needs Support": "bg-rose-100 text-rose-800 border-rose-200",
  Developing: "bg-amber-100 text-amber-800 border-amber-200",
  Good: "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Very Good": "bg-sky-100 text-sky-800 border-sky-200",
  Excellent: "bg-purple-100 text-purple-800 border-purple-200",
}

export default function TeacherDevelopmentPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [observations, setObservations] = useState<StudentDevelopment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedStudentFilter, setSelectedStudentFilter] = useState("all")

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState("")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [communication, setCommunication] = useState<DevelopmentRating>("Good")
  const [cognitive, setCognitive] = useState<DevelopmentRating>("Good")
  const [motor, setMotor] = useState<DevelopmentRating>("Good")
  const [social, setSocial] = useState<DevelopmentRating>("Good")
  const [creativity, setCreativity] = useState<DevelopmentRating>("Good")
  const [participation, setParticipation] = useState<DevelopmentRating>("Good")
  const [observationText, setObservationText] = useState("")

  const loadAll = async () => {
    setLoading(true)
    try {
      const [studRes, devRes] = await Promise.all([
        getTeacherAssignedStudents(),
        getStudentDevelopmentList(),
      ])
      if (studRes.students) {
        setStudents(studRes.students)
        if (studRes.students.length > 0 && !selectedStudentId) {
          setSelectedStudentId(studRes.students[0].id)
        }
      }
      if (devRes.data) setObservations(devRes.data)
    } catch (err) {
      console.error("Error loading development data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudentId || !observationText.trim()) return
    setSaving(true)
    try {
      const res = await saveStudentDevelopment({
        studentId: selectedStudentId,
        date,
        communication,
        cognitiveDevelopment: cognitive,
        motorSkills: motor,
        socialDevelopment: social,
        creativity,
        participation,
        observation: observationText.trim(),
      })
      if (res.success) {
        setModalOpen(false)
        setObservationText("")
        loadAll()
      } else {
        alert(res.error || "Failed to save observation")
      }
    } catch (err: any) {
      alert(err?.message || "Error saving observation")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this observation?")) return
    try {
      const res = await deleteStudentDevelopment(id)
      if (res.success) {
        setObservations((prev) => prev.filter((o) => o.id !== id))
      } else {
        alert(res.error || "Failed to delete")
      }
    } catch (err: any) {
      alert(err?.message || "Error deleting")
    }
  }

  const filtered = observations.filter((o) => {
    const q = search.toLowerCase().trim()
    const student = students.find((s) => s.id === o.studentId)
    const matchesSearch =
      !q ||
      (o.studentName && o.studentName.toLowerCase().includes(q)) ||
      (student?.admissionNo && student.admissionNo.toLowerCase().includes(q)) ||
      o.observation.toLowerCase().includes(q)
    const matchesStudent = selectedStudentFilter === "all" || o.studentId === selectedStudentFilter
    return matchesSearch && matchesStudent
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
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-olive">Student Development</h1>
          <p className="text-xs sm:text-sm text-olive/60 font-body">
            Preschool milestone observations & developmental ratings (No numerical marks/grades)
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium font-body shadow-soft hover:opacity-95 transition-opacity shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Observation
        </button>
      </div>

      {/* ── CATEGORIES GUIDE BANNER ─────────────────────────────────── */}
      <div className="bg-soft-white rounded-3xl p-5 border border-beige/20 shadow-soft">
        <h3 className="text-xs font-bold text-olive uppercase tracking-wider font-body mb-3">6 Core Preschool Developmental Domains</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center text-xs font-body">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">🗣️ Communication</div>
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-800 border border-blue-200">🧠 Cognitive</div>
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">🏃 Motor Skills</div>
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-800 border border-purple-200">🤝 Social Dev</div>
          <div className="p-2.5 rounded-xl bg-pink-50 text-pink-800 border border-pink-200">🎨 Creativity</div>
          <div className="p-2.5 rounded-xl bg-sky-50 text-sky-800 border border-sky-200">⭐ Participation</div>
        </div>
      </div>

      {/* ── SEARCH & FILTER ─────────────────────────────────────────── */}
      <div className="bg-soft-white rounded-3xl p-4 sm:p-5 border border-beige/20 shadow-soft flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-olive/40 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search observations by student name, admission number, or text..."
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-cream border border-beige/25 text-sm text-olive placeholder:text-olive/40 outline-none focus:border-pistachio transition-all font-body"
          />
        </div>

        <select
          value={selectedStudentFilter}
          onChange={(e) => setSelectedStudentFilter(e.target.value)}
          className="px-4 py-2.5 rounded-2xl bg-cream border border-beige/25 text-sm text-olive outline-none focus:border-pistachio font-body shrink-0"
        >
          <option value="all">All Assigned Students</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.name} ({s.program})</option>
          ))}
        </select>
      </div>

      {/* ── OBSERVATIONS LIST ───────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[250px]">
          <div className="w-8 h-8 rounded-full border-3 border-pistachio border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-soft-white rounded-3xl p-12 border border-beige/20 shadow-soft text-center">
          <Sparkles className="w-10 h-10 text-olive/20 mx-auto mb-2" />
          <h3 className="text-base font-display font-semibold text-olive">No observations found</h3>
          <p className="text-xs text-olive/50 font-body mt-1 max-w-sm mx-auto mb-4">
            Record meaningful developmental feedback for your assigned students.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-pistachio text-white text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" /> Add First Observation
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((obs) => (
            <motion.div
              key={obs.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-soft-white rounded-3xl p-5 border border-beige/20 shadow-soft flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-display font-bold text-base text-olive">{obs.studentName}</h3>
                    <span className="text-[11px] text-olive/40 font-body">
                      {obs.date} • Observed by {obs.teacherName || "Teacher"}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(obs.id)}
                    className="p-1.5 rounded-lg text-olive/30 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete observation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-olive/80 font-body bg-cream/30 p-3 rounded-2xl border border-beige/15 italic mb-3">
                  &quot;{obs.observation}&quot;
                </p>

                {/* Rating Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[10px] font-body">
                  <div className={`p-1.5 rounded-lg border flex flex-col ${RATING_COLORS[obs.communication] || "bg-cream text-olive"}`}>
                    <span className="opacity-60 text-[9px]">Communication</span>
                    <span className="font-bold">{obs.communication}</span>
                  </div>
                  <div className={`p-1.5 rounded-lg border flex flex-col ${RATING_COLORS[obs.cognitiveDevelopment] || "bg-cream text-olive"}`}>
                    <span className="opacity-60 text-[9px]">Cognitive</span>
                    <span className="font-bold">{obs.cognitiveDevelopment}</span>
                  </div>
                  <div className={`p-1.5 rounded-lg border flex flex-col ${RATING_COLORS[obs.motorSkills] || "bg-cream text-olive"}`}>
                    <span className="opacity-60 text-[9px]">Motor Skills</span>
                    <span className="font-bold">{obs.motorSkills}</span>
                  </div>
                  <div className={`p-1.5 rounded-lg border flex flex-col ${RATING_COLORS[obs.socialDevelopment] || "bg-cream text-olive"}`}>
                    <span className="opacity-60 text-[9px]">Social Dev</span>
                    <span className="font-bold">{obs.socialDevelopment}</span>
                  </div>
                  <div className={`p-1.5 rounded-lg border flex flex-col ${RATING_COLORS[obs.creativity] || "bg-cream text-olive"}`}>
                    <span className="opacity-60 text-[9px]">Creativity</span>
                    <span className="font-bold">{obs.creativity}</span>
                  </div>
                  <div className={`p-1.5 rounded-lg border flex flex-col ${RATING_COLORS[obs.participation] || "bg-cream text-olive"}`}>
                    <span className="opacity-60 text-[9px]">Participation</span>
                    <span className="font-bold">{obs.participation}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── ADD OBSERVATION MODAL ───────────────────────────────────── */}
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
                    <Sparkles className="w-4 h-4 text-pistachio" />
                  </div>
                  <div>
                    <h2 className="text-lg font-display font-bold text-olive">New Student Observation</h2>
                    <p className="text-xs text-olive/50 font-body">Preschool development assessment</p>
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
                    <label className="text-xs font-semibold text-olive font-body block mb-1">Select Student *</label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      required
                      className="w-full p-2.5 rounded-xl bg-cream border border-beige/30 text-xs text-olive outline-none focus:border-pistachio font-body"
                    >
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.program} {s.section})</option>
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

                {/* Rating Selectors */}
                <div className="p-3.5 rounded-2xl bg-cream/40 border border-beige/25 space-y-2.5">
                  <h4 className="text-[11px] font-bold text-olive uppercase font-body">Developmental Domain Ratings</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-body">
                    <div>
                      <label className="text-[10px] text-olive/60 block mb-0.5">🗣️ Communication</label>
                      <select value={communication} onChange={(e) => setCommunication(e.target.value as any)} className="w-full p-1.5 rounded-lg bg-white border border-beige/30 text-xs text-olive">
                        {RATINGS.map((r) => (<option key={r} value={r}>{r}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-olive/60 block mb-0.5">🧠 Cognitive</label>
                      <select value={cognitive} onChange={(e) => setCognitive(e.target.value as any)} className="w-full p-1.5 rounded-lg bg-white border border-beige/30 text-xs text-olive">
                        {RATINGS.map((r) => (<option key={r} value={r}>{r}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-olive/60 block mb-0.5">🏃 Motor Skills</label>
                      <select value={motor} onChange={(e) => setMotor(e.target.value as any)} className="w-full p-1.5 rounded-lg bg-white border border-beige/30 text-xs text-olive">
                        {RATINGS.map((r) => (<option key={r} value={r}>{r}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-olive/60 block mb-0.5">🤝 Social Dev</label>
                      <select value={social} onChange={(e) => setSocial(e.target.value as any)} className="w-full p-1.5 rounded-lg bg-white border border-beige/30 text-xs text-olive">
                        {RATINGS.map((r) => (<option key={r} value={r}>{r}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-olive/60 block mb-0.5">🎨 Creativity</label>
                      <select value={creativity} onChange={(e) => setCreativity(e.target.value as any)} className="w-full p-1.5 rounded-lg bg-white border border-beige/30 text-xs text-olive">
                        {RATINGS.map((r) => (<option key={r} value={r}>{r}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-olive/60 block mb-0.5">⭐ Participation</label>
                      <select value={participation} onChange={(e) => setParticipation(e.target.value as any)} className="w-full p-1.5 rounded-lg bg-white border border-beige/30 text-xs text-olive">
                        {RATINGS.map((r) => (<option key={r} value={r}>{r}</option>))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-olive font-body block mb-1">Observation Details *</label>
                  <textarea
                    value={observationText}
                    onChange={(e) => setObservationText(e.target.value)}
                    rows={3}
                    placeholder="e.g. Participated actively in circle time and demonstrated good sharing skills with peers during group play."
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
                    {saving ? "Saving..." : "Save Observation"}
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
