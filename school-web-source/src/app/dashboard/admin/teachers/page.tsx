"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { 
  Users, 
  UserCheck, 
  UserMinus, 
  IndianRupee, 
  Cake, 
  Plus, 
  Pencil, 
  Trash2,
  FileSpreadsheet,
  Download,
  Eye
} from "lucide-react"
import StatCard from "@/components/dashboard/StatCard"
import DataTable from "@/components/dashboard/DataTable"
import Modal from "@/components/dashboard/Modal"
import { getTeachers, addTeacher, updateTeacher, deleteTeacher } from "@/app/actions/teacher-actions"
import type { Teacher, EmploymentType, TeacherStatus } from "@/lib/types"
import { exportTeachersCSV, exportTeachersExcel } from "@/lib/excel-export"

const emptyForm: Partial<Teacher> = {
  teacher_id: "",
  full_name: "",
  gender: "Female",
  dob: "",
  phone: "",
  email: "",
  address: "",
  qualification: "",
  experience: "",
  designation: "",
  department: "",
  specialization: "",
  joining_date: "",
  employment_type: "Full Time",
  status: "Active",
  emergency_contact: "",
  blood_group: "",
  aadhaar_number: "",
  pan_number: "",
  bank_name: "",
  account_number: "",
  ifsc_code: "",
  upi_id: ""
}

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Teacher | null>(null)
  const [form, setForm] = useState<Partial<Teacher>>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [errorBanner, setErrorBanner] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>("All")

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getTeachers()
      setTeachers(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const filtered = filter === "All" ? teachers : teachers.filter(t => t.status === filter)

  // Stats calculation
  const totalTeachers = teachers.length
  const activeTeachers = teachers.filter(t => t.status === "Active").length
  const onLeaveTeachers = teachers.filter(t => t.status === "On Leave").length
  
  // Basic birthdays logic (upcoming in next 30 days)
  const upcomingBirthdays = teachers.filter(t => {
    if (!t.dob) return false
    const dob = new Date(t.dob)
    const today = new Date()
    const nextBday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate())
    if (nextBday < today) nextBday.setFullYear(today.getFullYear() + 1)
    const diffTime = Math.abs(nextBday.getTime() - today.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 30
  }).length

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (teacher: Teacher) => {
    setEditing(teacher)
    setForm(teacher)
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorBanner(null)
    setSubmitting(true)

    try {
      if (editing) {
        const res = await updateTeacher(editing.id, form)
        if ('error' in res) throw new Error(res.error)
        setTeachers(prev => prev.map(t => t.id === editing.id ? (res as Teacher) : t))
      } else {
        const res = await addTeacher(form as Omit<Teacher, "id" | "created_at" | "updated_at">)
        if ('error' in res) throw new Error(res.error)
        setTeachers(prev => [...prev, res as Teacher])
      }
      setModalOpen(false)
    } catch (err: any) {
      setErrorBanner(err.message || "Failed to save teacher")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await deleteTeacher(id)
      if (!res.success) throw new Error(res.error)
      setTeachers(prev => prev.filter(t => t.id !== id))
      setDeleteConfirm(null)
    } catch (err: any) {
      setErrorBanner(err.message || "Failed to delete teacher")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 rounded-full border-2 border-pistachio border-t-transparent animate-spin" />
      </div>
    )
  }

  const columns = [
    {
      key: "full_name", label: "Teacher", sortable: true,
      render: (row: Record<string, unknown>) => {
        const t = row as unknown as Teacher
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-pistachio/10 flex items-center justify-center text-xs font-display font-bold text-olive">
              {t.full_name.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-olive">{t.full_name}</p>
            </div>
          </div>
        )
      },
    },
    { key: "phone", label: "Phone" },
    { key: "employment_type", label: "Type" },
    { 
      key: "status", label: "Status",
      render: (row: Record<string, unknown>) => {
        const t = row as unknown as Teacher
        const colors = {
          "Active": "text-pistachio bg-pistachio/10",
          "On Leave": "text-amber-500 bg-amber-50",
          "Resigned": "text-red-500 bg-red-50"
        }
        return (
          <span className={`px-2 py-1 rounded-md text-xs font-medium ${colors[t.status]}`}>
            {t.status}
          </span>
        )
      }
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-display font-bold text-olive">Teacher Management</h1>
          <p className="text-sm text-olive/50 font-body">Manage staff records, salaries, and attendance</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportTeachersCSV(teachers, "teachers_export")}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cream hover:bg-beige/40 text-olive text-xs font-medium border border-beige/20 transition-all shadow-soft font-body"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            onClick={() => exportTeachersExcel(teachers, "teachers_export")}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cream hover:bg-beige/40 text-olive text-xs font-medium border border-beige/20 transition-all shadow-soft font-body"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
          </button>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium shadow-soft hover:shadow-lift hover:-translate-y-0.5 transition-all duration-300"
          >
            <Plus className="w-4 h-4" /> Add Teacher
          </button>
        </div>
      </div>

      {errorBanner && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-700 flex justify-between items-center font-body">
          <span>{errorBanner}</span>
          <button onClick={() => setErrorBanner(null)} className="text-red-500 hover:text-red-700 font-bold ml-2">×</button>
        </div>
      )}

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard icon={Users} label="Total Teachers" value={totalTeachers} color="bg-pistachio/10" index={0} />
        <StatCard icon={UserCheck} label="Active" value={activeTeachers} color="bg-sage/10" index={1} />
        <StatCard icon={UserMinus} label="On Leave" value={onLeaveTeachers} color="bg-amber-100/50" index={2} />
        <StatCard icon={Cake} label="Upcoming Birthdays" value={upcomingBirthdays} color="bg-rose-100/50" index={3} />
        <StatCard icon={IndianRupee} label="Salary Pending" value={"—"} color="bg-red-100/50" index={4} />
        <StatCard icon={IndianRupee} label="Salary Paid" value={"—"} color="bg-cream" index={5} />
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["All", "Active", "On Leave", "Resigned"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all font-body ${
              filter === f
                ? "bg-pistachio/15 text-olive shadow-[inset_0_0_0_1px_rgba(183,201,168,0.3)]"
                : "bg-cream text-olive/50 hover:text-olive"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft">
        <DataTable
          columns={columns}
          data={filtered as unknown as Record<string, unknown>[]}
          searchKeys={["full_name", "email", "phone"]}
          searchPlaceholder="Search teachers..."
          emptyTitle="No teachers found"
          actions={(row) => {
            const t = row as unknown as Teacher
            return (
              <div className="flex items-center gap-1">
                <Link href={`/dashboard/admin/teachers/${t.id}`} className="p-1.5 rounded-lg hover:bg-cream text-olive/40 hover:text-olive transition-colors" title="View Profile">
                  <Eye className="w-3.5 h-3.5" />
                </Link>
                <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-cream text-olive/40 hover:text-olive transition-colors" title="Edit Teacher">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setDeleteConfirm(t.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-olive/40 hover:text-red-500 transition-colors" title="Delete Teacher">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          }}
        />
      </motion.div>

      {/* Add / Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Teacher" : "Add Teacher"} maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-olive mb-1 font-body">Teacher ID *</label>
              <input type="text" required value={form.teacher_id} onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-olive mb-1 font-body">Full Name *</label>
              <input type="text" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-olive mb-1 font-body">Email *</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-olive mb-1 font-body">Phone *</label>
              <input type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-olive mb-1 font-body">Date of Birth *</label>
              <input type="date" required value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-olive mb-1 font-body">Gender *</label>
              <select required value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as any })}
                className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all">
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-olive mb-1 font-body">Employment Type *</label>
              <select required value={form.employment_type} onChange={(e) => setForm({ ...form, employment_type: e.target.value as any })}
                className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all">
                <option value="Full Time">Full Time</option>
                <option value="Part Time">Part Time</option>
                <option value="Contract">Contract</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-olive mb-1 font-body">Designation *</label>
              <input type="text" required value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-olive mb-1 font-body">Department *</label>
              <input type="text" required value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-olive mb-1 font-body">Qualification *</label>
              <input type="text" required value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-olive mb-1 font-body">Experience</label>
              <input type="text" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-olive mb-1 font-body">Joining Date *</label>
              <input type="date" required value={form.joining_date} onChange={(e) => setForm({ ...form, joining_date: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-olive mb-1 font-body">Address *</label>
              <input type="text" required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-olive mb-1 font-body">Emergency Contact *</label>
              <input type="text" required value={form.emergency_contact} onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-olive mb-1 font-body">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all">
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Resigned">Resigned</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} disabled={submitting}
              className="flex-1 px-4 py-2.5 rounded-xl bg-cream text-olive/60 text-sm font-medium hover:bg-beige/30 transition-colors font-body disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium shadow-soft hover:shadow-lift transition-all font-body disabled:opacity-70 flex items-center justify-center gap-2">
              {submitting ? "Saving..." : (editing ? "Save Changes" : "Add Teacher")}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Teacher" maxWidth="max-w-sm">
        <p className="text-sm text-olive/60 mb-4 font-body">
          Are you sure you want to remove this teacher? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteConfirm(null)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-cream text-olive/60 text-sm font-medium hover:bg-beige/30 transition-colors font-body">
            Cancel
          </button>
          <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors font-body">
            Delete Teacher
          </button>
        </div>
      </Modal>
    </div>
  )
}
