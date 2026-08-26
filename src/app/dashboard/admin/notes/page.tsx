"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { getNotes, getStudents, addNote, deleteNote } from "@/lib/data-store"
import type { TeacherNote, Student } from "@/lib/types"
import StatCard from "@/components/dashboard/StatCard"
import DataTable from "@/components/dashboard/DataTable"
import Modal from "@/components/dashboard/Modal"
import SearchableStudentSelect from "@/components/dashboard/SearchableStudentSelect"
import { MessageCircle, Plus, Trash2, Award, BookOpen, Heart, AlertCircle, Star, Filter, Users, ShieldAlert } from "lucide-react"

const CATEGORIES = ["academic", "behavior", "health", "general", "achievement"] as const
type NoteCategory = typeof CATEGORIES[number]

const categoryConfig: Record<string, { icon: typeof Star; color: string; label: string }> = {
  achievement: { icon: Award, color: "bg-amber-50 border-amber-150 text-amber-600", label: "Achievement" },
  academic: { icon: BookOpen, color: "bg-pistachio/15 border-pistachio/30 text-olive", label: "Academic" },
  behavior: { icon: Heart, color: "bg-sage/15 border-sage/30 text-olive", label: "Behavior" },
  health: { icon: AlertCircle, color: "bg-red-50 border-red-150 text-red-600", label: "Health" },
  general: { icon: MessageCircle, color: "bg-cream border-beige/20 text-olive/60", label: "General" },
}

interface NoteRow {
  id: string
  studentId: string
  studentName: string
  admissionNo: string
  teacherName: string
  date: string
  message: string
  category: string
}

export default function AdminNotesPage() {
  const [notes, setNotes] = useState<TeacherNote[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [studentFilter, setStudentFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  // Add modal state
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [form, setForm] = useState({
    studentId: "",
    teacherName: "Ms. Anita Desai",
    category: "general" as NoteCategory,
    message: "",
  })

  // Delete modal state
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setActionError(null)
    try {
      const [notesData, studentsData] = await Promise.all([
        getNotes(),
        getStudents(),
      ])
      setNotes(notesData)
      setStudents(studentsData)

      // Initialize default student for form if available
      if (studentsData.length > 0) {
        setForm((prev) => ({ ...prev, studentId: studentsData[0].id }))
      }
    } catch (err: any) {
      console.error("Refresh notes page error:", err)
      setActionError("Failed to fetch data from server.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  // Combine notes with student details
  const rows: NoteRow[] = notes.map((n) => {
    const student = students.find((s) => s.id === n.studentId)
    return {
      id: n.id,
      studentId: n.studentId,
      studentName: student ? student.name : "Unknown Student",
      admissionNo: student ? student.admissionNo : "",
      teacherName: n.teacherName,
      date: n.date,
      message: n.message,
      category: n.category,
    }
  })

  // Filtering
  const filteredRows = rows.filter((r) => {
    const matchesStudent = studentFilter === "all" || r.studentId === studentFilter
    const matchesCategory = categoryFilter === "all" || r.category === categoryFilter
    return matchesStudent && matchesCategory
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.studentId || !form.message) return
    setActionError(null)
    try {
      await addNote(form)
      setAddModalOpen(false)
      setForm((prev) => ({ ...prev, message: "" }))
      refresh()
    } catch (err: any) {
      setActionError(err?.message || "Failed to add note.")
    }
  }

  const handleDelete = async (id: string) => {
    setActionError(null)
    try {
      await deleteNote(id)
      setDeleteConfirm(null)
      refresh()
    } catch (err: any) {
      setActionError(err?.message || "Failed to delete note.")
      setDeleteConfirm(null)
    }
  }

  if (loading && notes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 rounded-full border-2 border-pistachio border-t-transparent animate-spin" />
      </div>
    )
  }

  const columns = [
    {
      key: "studentName",
      label: "Student",
      sortable: true,
      render: (row: NoteRow) => (
        <div>
          <p className="font-medium text-olive">{row.studentName}</p>
          <p className="text-[10px] text-olive/40">{row.teacherName}</p>
        </div>
      ),
    },
    { key: "date", label: "Date", sortable: true },
    {
      key: "category",
      label: "Category",
      sortable: true,
      render: (row: NoteRow) => {
        const config = categoryConfig[row.category] || categoryConfig.general
        const Icon = config.icon
        return (
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize font-body inline-flex items-center gap-1 border ${config.color}`}>
            <Icon className="w-3 h-3" />
            {config.label}
          </span>
        )
      },
    },
    {
      key: "message",
      label: "Message",
      render: (row: NoteRow) => (
        <p className="text-olive/70 font-body text-xs line-clamp-2 max-w-sm">{row.message}</p>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-display font-bold text-olive">Teacher Notes Management</h1>
          <p className="text-sm text-olive/50 font-body">Share progress reports, achievements, and behavioral remarks with parents</p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium shadow-soft hover:shadow-lift hover:-translate-y-0.5 transition-all duration-300"
        >
          <Plus className="w-4 h-4" /> Add Teacher Note
        </button>
      </div>

      {actionError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-700 flex justify-between items-center font-body">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-500 hover:text-red-700 font-bold ml-2">×</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={MessageCircle} label="Total Notes" value={notes.length} color="bg-pistachio/10" index={0} />
        <StatCard icon={Award} label="Achievements" value={notes.filter((n) => n.category === "achievement").length} color="bg-sage/10" index={1} />
        <StatCard icon={BookOpen} label="Academic Remarks" value={notes.filter((n) => n.category === "academic").length} color="bg-cream" index={2} />
        <StatCard icon={Users} label="Students Emailed" value={new Set(notes.map((n) => n.studentId)).size} color="bg-beige/30" index={3} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-soft-white p-4 rounded-3xl border border-beige/20 shadow-soft">
        <div className="flex items-center gap-2 text-xs text-olive/60 font-body">
          <Filter className="w-3.5 h-3.5 text-olive/40" />
          <span>Student:</span>
          <select
            value={studentFilter}
            onChange={(e) => setStudentFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-cream border border-beige/15 text-olive text-xs outline-none focus:border-pistachio transition-all font-body"
          >
            <option value="all">All Students</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-olive/60 font-body">
          <span>Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-cream border border-beige/15 text-olive text-xs outline-none focus:border-pistachio transition-all font-body"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{categoryConfig[c]?.label || c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Notes Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft"
      >
        <DataTable
          columns={columns as { key: string; label: string; sortable?: boolean; render?: (row: Record<string, unknown>) => React.ReactNode }[]}
          data={filteredRows as unknown as Record<string, unknown>[]}
          searchKeys={["studentName", "admissionNo", "message", "teacherName"]}
          searchPlaceholder="Search notes by student name, admission no, or message..."
          emptyTitle="No teacher notes found"
          emptyDescription="Click 'Add Teacher Note' to share remarks"
          actions={(row) => (
            <button
              onClick={() => setDeleteConfirm(row.id as string)}
              className="p-1.5 rounded-lg hover:bg-red-50 text-olive/40 hover:text-red-500 transition-colors"
              title="Delete note"
              aria-label="Delete note"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        />
      </motion.div>

      {/* Add Note Modal */}
      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)} title="Send Note to Parent" maxWidth="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-olive mb-1 font-body">Select Student *</label>
            <SearchableStudentSelect
              required
              students={students}
              value={form.studentId}
              onChange={(studentId) => setForm({ ...form, studentId })}
              placeholder="Select student..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-olive mb-1 font-body">Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as NoteCategory })}
                className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all font-body"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{categoryConfig[c]?.label || c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-olive mb-1 font-body">Teacher Name *</label>
              <input
                type="text"
                required
                value={form.teacherName}
                onChange={(e) => setForm({ ...form, teacherName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all font-body"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-olive mb-1 font-body">Message *</label>
            <textarea
              required
              rows={4}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Type your notes or observation details here..."
              className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all font-body resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-cream text-olive/60 text-sm font-medium hover:bg-beige/30 transition-colors font-body"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={students.length === 0}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium shadow-soft hover:shadow-lift transition-all font-body disabled:opacity-50"
            >
              Send Note
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Note" maxWidth="max-w-sm">
        <p className="text-sm text-olive/60 mb-4 font-body">
          Are you sure you want to delete this note? This action cannot be undone and parents will no longer see this message.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setDeleteConfirm(null)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-cream text-olive/60 text-sm font-medium hover:bg-beige/30 transition-colors font-body"
          >
            Cancel
          </button>
          <button
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors font-body"
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  )
}
