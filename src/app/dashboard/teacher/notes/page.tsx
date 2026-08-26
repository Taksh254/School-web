"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
  FileText,
  Plus,
  Search,
  ArrowLeft,
  X,
  Trash2,
  Edit2,
  Tag,
  Users,
} from "lucide-react"
import {
  getTeacherAssignedStudents,
  getTeacherNotesForStudents,
  saveTeacherStudentNote,
  deleteTeacherStudentNote,
} from "@/app/actions/teacher-portal-actions"
import type { Student } from "@/lib/types"

const CATEGORIES = [
  { id: "all", label: "All Categories" },
  { id: "academic", label: "Academic" },
  { id: "behavior", label: "Behaviour" },
  { id: "activity", label: "Activity" },
  { id: "achievement", label: "Achievement" },
  { id: "general", label: "General" },
]

const CATEGORY_COLORS: Record<string, string> = {
  academic: "bg-blue-100 text-blue-800 border-blue-200",
  behavior: "bg-amber-100 text-amber-800 border-amber-200",
  activity: "bg-purple-100 text-purple-800 border-purple-200",
  achievement: "bg-emerald-100 text-emerald-800 border-emerald-200",
  general: "bg-cream text-olive border-beige/30",
  health: "bg-rose-100 text-rose-800 border-rose-200",
}

export default function TeacherNotesPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState("")
  const [category, setCategory] = useState("general")
  const [message, setMessage] = useState("")
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [studRes, notesRes] = await Promise.all([
        getTeacherAssignedStudents(),
        getTeacherNotesForStudents(),
      ])
      if (studRes.students) {
        setStudents(studRes.students)
        if (studRes.students.length > 0 && !selectedStudentId) {
          setSelectedStudentId(studRes.students[0].id)
        }
      }
      if (notesRes.data) setNotes(notesRes.data)
    } catch (err) {
      console.error("Error loading notes:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenAdd = () => {
    setEditingNoteId(null)
    setMessage("")
    setCategory("general")
    if (students.length > 0) setSelectedStudentId(students[0].id)
    setModalOpen(true)
  }

  const handleOpenEdit = (note: any) => {
    setEditingNoteId(note.id)
    setSelectedStudentId(note.studentId)
    setCategory(note.category)
    setMessage(note.message)
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudentId || !message.trim()) return
    setSaving(true)
    try {
      const today = new Date().toISOString().slice(0, 10)
      const res = await saveTeacherStudentNote({
        id: editingNoteId || undefined,
        studentId: selectedStudentId,
        category,
        message: message.trim(),
        date: today,
      })
      if (res.success) {
        setModalOpen(false)
        setMessage("")
        loadData()
      } else {
        alert(res.error || "Failed to save note")
      }
    } catch (err: any) {
      alert(err?.message || "Error saving note")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return
    try {
      const res = await deleteTeacherStudentNote(id)
      if (res.success) {
        setNotes((prev) => prev.filter((n) => n.id !== id))
      } else {
        alert(res.error || "Failed to delete")
      }
    } catch (err: any) {
      alert(err?.message || "Error deleting")
    }
  }

  const filtered = notes.filter((n) => {
    const q = search.toLowerCase().trim()
    const student = students.find((s) => s.id === (n.studentId || n.student_id))
    const matchesSearch =
      !q ||
      (n.studentName && n.studentName.toLowerCase().includes(q)) ||
      (student?.admissionNo && student.admissionNo.toLowerCase().includes(q)) ||
      n.message.toLowerCase().includes(q)
    const matchesCat = categoryFilter === "all" || n.category === categoryFilter
    return matchesSearch && matchesCat
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
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-olive">Teacher Notes</h1>
          <p className="text-xs sm:text-sm text-olive/60 font-body">
            Daily logs, behavioural observations, and achievements for your assigned students
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium font-body shadow-soft hover:opacity-95 transition-opacity shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create Note
        </button>
      </div>

      {/* ── SEARCH & CATEGORY FILTER ─────────────────────────────────── */}
      <div className="bg-soft-white rounded-3xl p-4 sm:p-5 border border-beige/20 shadow-soft space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-olive/40 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes by student name, admission number, or content..."
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-cream border border-beige/25 text-sm text-olive placeholder:text-olive/40 outline-none focus:border-pistachio transition-all font-body"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium font-body transition-all ${
                categoryFilter === cat.id
                  ? "bg-pistachio text-white shadow-soft"
                  : "bg-cream text-olive/60 hover:bg-beige/30"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── NOTES GRID ──────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[250px]">
          <div className="w-8 h-8 rounded-full border-3 border-pistachio border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-soft-white rounded-3xl p-12 border border-beige/20 shadow-soft text-center">
          <FileText className="w-10 h-10 text-olive/20 mx-auto mb-2" />
          <h3 className="text-base font-display font-semibold text-olive">No notes found</h3>
          <p className="text-xs text-olive/50 font-body mt-1 max-w-sm mx-auto mb-4">
            Record observations, academic remarks, or achievements for your students.
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-pistachio text-white text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" /> Add Note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((note) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-soft-white rounded-3xl p-5 border border-beige/20 shadow-soft flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                      CATEGORY_COLORS[note.category] || "bg-cream text-olive"
                    }`}
                  >
                    {note.category}
                  </span>
                  <span className="text-[11px] text-olive/40 font-mono">{note.date}</span>
                </div>

                <h3 className="font-display font-bold text-sm text-olive mb-2">{note.studentName}</h3>
                <p className="text-xs text-olive/75 font-body leading-relaxed whitespace-pre-wrap">{note.message}</p>
              </div>

              <div className="flex items-center justify-between pt-4 mt-3 border-t border-beige/15 text-xs text-olive/40 font-body">
                <span>By {note.teacherName || "Teacher"}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(note)}
                    className="p-1.5 rounded-lg text-olive/50 hover:text-olive hover:bg-cream transition-colors"
                    title="Edit Note"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="p-1.5 rounded-lg text-olive/40 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── ADD/EDIT NOTE MODAL ─────────────────────────────────────── */}
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
                    <FileText className="w-4 h-4 text-pistachio" />
                  </div>
                  <div>
                    <h2 className="text-lg font-display font-bold text-olive">
                      {editingNoteId ? "Edit Student Note" : "New Student Note"}
                    </h2>
                    <p className="text-xs text-olive/50 font-body">Record notes and observations</p>
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
                  <label className="text-xs font-semibold text-olive font-body block mb-1">Select Student *</label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    required
                    disabled={!!editingNoteId}
                    className="w-full p-2.5 rounded-xl bg-cream border border-beige/30 text-xs text-olive outline-none focus:border-pistachio font-body"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.program} {s.section})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-olive font-body block mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-cream border border-beige/30 text-xs text-olive outline-none focus:border-pistachio font-body capitalize"
                  >
                    <option value="academic">Academic</option>
                    <option value="behavior">Behaviour</option>
                    <option value="activity">Activity</option>
                    <option value="achievement">Achievement</option>
                    <option value="general">General Observation</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-olive font-body block mb-1">Note Content *</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    placeholder="Write detailed observation, feedback, or achievement note..."
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
                    {saving ? "Saving..." : editingNoteId ? "Update Note" : "Create Note"}
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
