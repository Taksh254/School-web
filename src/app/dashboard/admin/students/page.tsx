"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { getStudents, addStudent, updateStudent, deleteStudent } from "@/lib/data-store"
import type { Student, ProgramType } from "@/lib/types"
import StatCard from "@/components/dashboard/StatCard"
import DataTable from "@/components/dashboard/DataTable"
import Modal from "@/components/dashboard/Modal"
import { Users, Plus, Pencil, Trash2, GraduationCap } from "lucide-react"

const PROGRAMS: ProgramType[] = ["Play Group", "Nursery", "Kindergarten"]

const emptyForm = {
  name: "", age: 3, dateOfBirth: "", program: "Nursery" as ProgramType, section: "A",
  parentName: "", parentEmail: "", parentPhone: "", admissionDate: "", teacher: "",
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Student | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getStudents()
      setStudents(data)
    } catch (err) {
      console.error("Refresh students error:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const filtered = filter === "all" ? students : students.filter((s) => s.program === filter)

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (student: Student) => {
    setEditing(student)
    setForm({
      name: student.name,
      age: student.age,
      dateOfBirth: student.dateOfBirth,
      program: student.program,
      section: student.section,
      parentName: student.parentName,
      parentEmail: student.parentEmail,
      parentPhone: student.parentPhone,
      admissionDate: student.admissionDate,
      teacher: student.teacher,
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      await updateStudent(editing.id, form)
    } else {
      await addStudent(form)
    }
    setModalOpen(false)
    refresh()
  }

  const handleDelete = async (id: string) => {
    await deleteStudent(id)
    setDeleteConfirm(null)
    refresh()
  }

  if (loading && students.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 rounded-full border-2 border-pistachio border-t-transparent animate-spin" />
      </div>
    )
  }

  const columns = [
    {
      key: "name", label: "Student", sortable: true,
      render: (row: Student) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-pistachio/10 flex items-center justify-center text-xs font-display font-bold text-olive">
            {row.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-olive">{row.name}</p>
            <p className="text-[11px] text-olive/40">Age {row.age}</p>
          </div>
        </div>
      ),
    },
    { key: "program", label: "Program", sortable: true },
    { key: "section", label: "Section" },
    { key: "parentName", label: "Parent", sortable: true },
    { key: "teacher", label: "Teacher" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-display font-bold text-olive">Student Management</h1>
          <p className="text-sm text-olive/50 font-body">Add, edit, and manage students</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium shadow-soft hover:shadow-lift hover:-translate-y-0.5 transition-all duration-300"
        >
          <Plus className="w-4 h-4" /> Add Student
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Students" value={students.length} color="bg-pistachio/10" index={0} />
        {PROGRAMS.map((prog, i) => (
          <StatCard key={prog} icon={GraduationCap} label={prog} value={students.filter((s) => s.program === prog).length} color={i === 0 ? "bg-sage/10" : i === 1 ? "bg-cream" : "bg-beige/30"} index={i + 1} />
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {["all", ...PROGRAMS].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all font-body ${
              filter === f
                ? "bg-pistachio/15 text-olive shadow-[inset_0_0_0_1px_rgba(183,201,168,0.3)]"
                : "bg-cream text-olive/50 hover:text-olive"
            }`}
          >
            {f === "all" ? "All Programs" : f}
          </button>
        ))}
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft">
        <DataTable
          columns={columns as { key: string; label: string; sortable?: boolean; render?: (row: Record<string, unknown>) => React.ReactNode }[]}
          data={filtered as unknown as Record<string, unknown>[]}
          searchKeys={["name", "parentName", "teacher"]}
          searchPlaceholder="Search students..."
          emptyTitle="No students found"
          actions={(row) => {
            const student = row as unknown as Student
            return (
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(student)} className="p-1.5 rounded-lg hover:bg-cream text-olive/40 hover:text-olive transition-colors" aria-label="Edit">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setDeleteConfirm(student.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-olive/40 hover:text-red-500 transition-colors" aria-label="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          }}
        />
      </motion.div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Student" : "Add New Student"} maxWidth="max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-olive mb-1 font-body">Student Name *</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all font-body" />
            </div>
            <div>
              <label className="block text-xs font-medium text-olive mb-1 font-body">Date of Birth *</label>
              <input type="date" required value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all font-body" />
            </div>
            <div>
              <label className="block text-xs font-medium text-olive mb-1 font-body">Age</label>
              <input type="number" min={1} max={10} value={form.age} onChange={(e) => setForm({ ...form, age: parseInt(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all font-body" />
            </div>
            <div>
              <label className="block text-xs font-medium text-olive mb-1 font-body">Program *</label>
              <select value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value as ProgramType })}
                className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all font-body">
                {PROGRAMS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-olive mb-1 font-body">Section</label>
              <select value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all font-body">
                <option>A</option><option>B</option><option>C</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-olive mb-1 font-body">Teacher</label>
              <input type="text" value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all font-body" />
            </div>
          </div>

          <div className="border-t border-beige/15 pt-4 mt-2">
            <h4 className="text-xs font-medium text-olive/60 mb-3 font-body uppercase tracking-wider">Parent Information</h4>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-olive mb-1 font-body">Parent Name *</label>
                <input type="text" required value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all font-body" />
              </div>
              <div>
                <label className="block text-xs font-medium text-olive mb-1 font-body">Parent Email</label>
                <input type="email" value={form.parentEmail} onChange={(e) => setForm({ ...form, parentEmail: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all font-body" />
              </div>
              <div>
                <label className="block text-xs font-medium text-olive mb-1 font-body">Parent Phone</label>
                <input type="tel" value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all font-body" />
              </div>
              <div>
                <label className="block text-xs font-medium text-olive mb-1 font-body">Admission Date</label>
                <input type="date" value={form.admissionDate} onChange={(e) => setForm({ ...form, admissionDate: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all font-body" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-cream text-olive/60 text-sm font-medium hover:bg-beige/30 transition-colors font-body">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium shadow-soft hover:shadow-lift transition-all font-body">
              {editing ? "Save Changes" : "Add Student"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Remove Student" maxWidth="max-w-sm">
        <p className="text-sm text-olive/60 mb-4 font-body">
          Are you sure you want to remove this student? This will also delete their attendance, fee records, and notes. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteConfirm(null)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-cream text-olive/60 text-sm font-medium hover:bg-beige/30 transition-colors font-body">
            Cancel
          </button>
          <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors font-body">
            Remove Student
          </button>
        </div>
      </Modal>
    </div>
  )
}
