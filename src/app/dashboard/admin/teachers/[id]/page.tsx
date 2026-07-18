"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
  ArrowLeft,
  User,
  CreditCard,
  CalendarCheck,
  CalendarMinus,
  FileText,
  Plus,
  Pencil,
  Trash2,
  Download,
  Upload
} from "lucide-react"

import {
  getTeacher,
  getTeacherSalaries,
  addTeacherSalary,
  getTeacherAttendance,
  addTeacherAttendance,
  getTeacherLeaves,
  addTeacherLeave,
  updateTeacherLeaveStatus,
  getTeacherDocuments,
  addTeacherDocument
} from "@/app/actions/teacher-actions"

import {
  Teacher,
  TeacherSalary,
  TeacherAttendance,
  TeacherLeave,
  TeacherDocument
} from "@/lib/types"

import Modal from "@/components/dashboard/Modal"
import DataTable from "@/components/dashboard/DataTable"
import { supabase } from "@/lib/supabase"

type TabType = "Profile" | "Salary" | "Attendance" | "Leave" | "Documents"
const TABS: { id: TabType; label: string; icon: any }[] = [
  { id: "Profile", label: "Profile", icon: User },
  { id: "Salary", label: "Salary & Payroll", icon: CreditCard },
  { id: "Attendance", label: "Attendance", icon: CalendarCheck },
  { id: "Leave", label: "Leave Requests", icon: CalendarMinus },
  { id: "Documents", label: "Documents", icon: FileText },
]

export default function TeacherDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  
  const [activeTab, setActiveTab] = useState<TabType>("Profile")
  const [loading, setLoading] = useState(true)
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  
  // Data lists
  const [salaries, setSalaries] = useState<TeacherSalary[]>([])
  const [attendance, setAttendance] = useState<TeacherAttendance[]>([])
  const [leaves, setLeaves] = useState<TeacherLeave[]>([])
  const [documents, setDocuments] = useState<TeacherDocument[]>([])
  
  // Modals
  const [modalOpen, setModalOpen] = useState<{ type: string; open: boolean }>({ type: "", open: false })
  const [submitting, setSubmitting] = useState(false)
  const [errorBanner, setErrorBanner] = useState<string | null>(null)
  
  // Forms
  const [salaryForm, setSalaryForm] = useState<Partial<TeacherSalary>>({ basic_salary: 0, allowances: 0, bonus: 0, deductions: 0, pf: 0, esi: 0, status: "Pending" })
  const [attendanceForm, setAttendanceForm] = useState<Partial<TeacherAttendance>>({ date: new Date().toISOString().split("T")[0], status: "Present" })
  const [leaveForm, setLeaveForm] = useState<Partial<TeacherLeave>>({ type: "Casual Leave", status: "Pending" })
  const [docForm, setDocForm] = useState<Partial<TeacherDocument>>({ type: "Resume" })
  const [docFile, setDocFile] = useState<File | null>(null)

  const loadData = useCallback(async () => {
    if (!id || typeof id !== "string") return
    setLoading(true)
    try {
      const t = await getTeacher(id)
      if (!t) {
        router.push("/dashboard/admin/teachers")
        return
      }
      setTeacher(t)
      
      const [sals, atts, lvs, docs] = await Promise.all([
        getTeacherSalaries(id),
        getTeacherAttendance(id),
        getTeacherLeaves(id),
        getTeacherDocuments(id)
      ])
      
      setSalaries(sals)
      setAttendance(atts)
      setLeaves(lvs)
      setDocuments(docs)
    } catch (err: any) {
      console.error(err)
      setErrorBanner(err.message)
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => {
    loadData()
  }, [loadData])

  // --- Handlers ---
  
  const handleSalarySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teacher) return
    setSubmitting(true)
    try {
      const net = (Number(salaryForm.basic_salary) || 0) + (Number(salaryForm.allowances) || 0) + (Number(salaryForm.bonus) || 0) 
                  - (Number(salaryForm.deductions) || 0) - (Number(salaryForm.pf) || 0) - (Number(salaryForm.esi) || 0)
      
      const data: any = {
        ...salaryForm,
        teacher_id: teacher.id,
        net_salary: net
      }
      
      const res = await addTeacherSalary(data)
      if ('error' in res) throw new Error(res.error)
      setSalaries(prev => [res as TeacherSalary, ...prev])
      setModalOpen({ type: "", open: false })
    } catch (err: any) {
      setErrorBanner(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teacher) return
    setSubmitting(true)
    try {
      const data: any = {
        ...attendanceForm,
        teacher_id: teacher.id
      }
      const res = await addTeacherAttendance(data)
      if ('error' in res) throw new Error(res.error)
      setAttendance(prev => [res as TeacherAttendance, ...prev])
      setModalOpen({ type: "", open: false })
    } catch (err: any) {
      setErrorBanner(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teacher) return
    setSubmitting(true)
    try {
      const data: any = {
        ...leaveForm,
        teacher_id: teacher.id,
        status: "Pending" // auto
      }
      const res = await addTeacherLeave(data)
      if ('error' in res) throw new Error(res.error)
      setLeaves(prev => [res as TeacherLeave, ...prev])
      setModalOpen({ type: "", open: false })
    } catch (err: any) {
      setErrorBanner(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleLeaveStatusChange = async (leaveId: string, status: any) => {
    try {
      const res = await updateTeacherLeaveStatus(leaveId, status)
      if ('error' in res) throw new Error(res.error)
      setLeaves(prev => prev.map(l => l.id === leaveId ? (res as TeacherLeave) : l))
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teacher || !docFile) return
    setSubmitting(true)
    try {
      // Upload to Supabase Storage
      const fileExt = docFile.name.split('.').pop()
      const fileName = `${teacher.id}_${Date.now()}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('teacher_documents')
        .upload(fileName, docFile)
        
      if (uploadError) throw new Error("Upload failed: " + uploadError.message)
      
      const { data: publicUrlData } = supabase.storage.from('teacher_documents').getPublicUrl(fileName)
      
      const data: any = {
        teacher_id: teacher.id,
        title: docForm.title || docFile.name,
        type: docForm.type,
        file_url: publicUrlData.publicUrl
      }
      
      const res = await addTeacherDocument(data)
      if ('error' in res) throw new Error(res.error)
      
      setDocuments(prev => [res as TeacherDocument, ...prev])
      setModalOpen({ type: "", open: false })
      setDocFile(null)
    } catch (err: any) {
      setErrorBanner(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !teacher) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 rounded-full border-2 border-pistachio border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/admin/teachers" className="p-2 rounded-xl bg-cream hover:bg-beige/40 text-olive transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-display font-bold text-olive">{teacher.full_name}</h1>
            <p className="text-sm text-olive/50 font-body">{teacher.status}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {activeTab === "Salary" && (
            <button onClick={() => setModalOpen({ type: "Salary", open: true })} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium shadow-soft hover:shadow-lift transition-all">
              <Plus className="w-4 h-4" /> Add Salary Record
            </button>
          )}
          {activeTab === "Attendance" && (
            <button onClick={() => setModalOpen({ type: "Attendance", open: true })} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium shadow-soft hover:shadow-lift transition-all">
              <Plus className="w-4 h-4" /> Mark Attendance
            </button>
          )}
          {activeTab === "Leave" && (
            <button onClick={() => setModalOpen({ type: "Leave", open: true })} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium shadow-soft hover:shadow-lift transition-all">
              <Plus className="w-4 h-4" /> Record Leave
            </button>
          )}
          {activeTab === "Documents" && (
            <button onClick={() => setModalOpen({ type: "Documents", open: true })} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium shadow-soft hover:shadow-lift transition-all">
              <Upload className="w-4 h-4" /> Upload Document
            </button>
          )}
        </div>
      </div>

      {errorBanner && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-700 flex justify-between items-center font-body">
          <span>{errorBanner}</span>
          <button onClick={() => setErrorBanner(null)} className="text-red-500 hover:text-red-700 font-bold ml-2">×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-beige/20 overflow-x-auto hide-scrollbar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 font-body whitespace-nowrap ${
              activeTab === tab.id
                ? "border-pistachio text-olive"
                : "border-transparent text-olive/50 hover:text-olive hover:bg-cream/30"
            }`}
          >
            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-pistachio" : ""}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft min-h-[400px]">
        {activeTab === "Profile" && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-olive/50 uppercase tracking-wider">Personal Information</h3>
              <div className="grid grid-cols-2 gap-y-4 text-sm">
                <div className="text-olive/60">Date of Birth</div><div className="font-medium text-olive">{teacher.dob}</div>
                <div className="text-olive/60">Gender</div><div className="font-medium text-olive">{teacher.gender}</div>
                <div className="text-olive/60">Phone</div><div className="font-medium text-olive">{teacher.phone}</div>
                <div className="text-olive/60">Email</div><div className="font-medium text-olive">{teacher.email}</div>
                <div className="text-olive/60">Address</div><div className="font-medium text-olive">{teacher.address}</div>
                <div className="text-olive/60">Emergency Contact</div><div className="font-medium text-olive">{teacher.emergency_contact}</div>
                <div className="text-olive/60">Blood Group</div><div className="font-medium text-olive">{teacher.blood_group || '—'}</div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-olive/50 uppercase tracking-wider">Employment Details</h3>
              <div className="grid grid-cols-2 gap-y-4 text-sm">
                <div className="text-olive/60">Type</div><div className="font-medium text-olive">{teacher.employment_type}</div>
              </div>
              <h3 className="text-sm font-bold text-olive/50 uppercase tracking-wider mt-6">Financial Info</h3>
              <div className="grid grid-cols-2 gap-y-4 text-sm">
                <div className="text-olive/60">Bank Name</div><div className="font-medium text-olive">{teacher.bank_name || '—'}</div>
                <div className="text-olive/60">Account Number</div><div className="font-medium text-olive">{teacher.account_number || '—'}</div>
                <div className="text-olive/60">IFSC Code</div><div className="font-medium text-olive">{teacher.ifsc_code || '—'}</div>
                <div className="text-olive/60">PAN Number</div><div className="font-medium text-olive">{teacher.pan_number || '—'}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Salary" && (
          <DataTable
            columns={[
              { key: "month_year", label: "Month" },
              { key: "basic_salary", label: "Basic (₹)", render: r => Number(r.basic_salary).toLocaleString() },
              { key: "allowances", label: "Allowances (₹)" },
              { key: "deductions", label: "Deductions (₹)" },
              { key: "net_salary", label: "Net Salary (₹)", render: r => <span className="font-bold">₹{Number(r.net_salary).toLocaleString()}</span> },
              { key: "status", label: "Status", render: r => (
                <span className={`px-2 py-1 rounded-md text-xs font-medium ${r.status === 'Paid' ? 'text-pistachio bg-pistachio/10' : 'text-amber-500 bg-amber-50'}`}>{String(r.status)}</span>
              ) }
            ]}
            data={salaries as unknown as Record<string, unknown>[]}
            emptyTitle="No salary records found"
          />
        )}

        {activeTab === "Attendance" && (
          <DataTable
            columns={[
              { key: "date", label: "Date", sortable: true },
              { key: "status", label: "Status", render: r => (
                <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                  r.status === 'Present' ? 'text-pistachio bg-pistachio/10' :
                  r.status === 'Absent' ? 'text-red-500 bg-red-50' :
                  r.status === 'Late Entry' ? 'text-amber-500 bg-amber-50' : 'text-blue-500 bg-blue-50'
                }`}>{String(r.status)}</span>
              ) },
              { key: "notes", label: "Notes" }
            ]}
            data={attendance as unknown as Record<string, unknown>[]}
            emptyTitle="No attendance records found"
          />
        )}

        {activeTab === "Leave" && (
          <DataTable
            columns={[
              { key: "type", label: "Type" },
              { key: "start_date", label: "From" },
              { key: "end_date", label: "To" },
              { key: "reason", label: "Reason" },
              { key: "status", label: "Status", render: r => (
                <select 
                  value={String(r.status)}
                  onChange={(e) => handleLeaveStatusChange(String(r.id), e.target.value)}
                  className={`text-xs font-medium rounded-md px-2 py-1 border-none outline-none ${
                    r.status === 'Approved' ? 'text-pistachio bg-pistachio/10' :
                    r.status === 'Rejected' ? 'text-red-500 bg-red-50' : 'text-amber-500 bg-amber-50'
                  }`}
                >
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              ) }
            ]}
            data={leaves as unknown as Record<string, unknown>[]}
            emptyTitle="No leave requests found"
          />
        )}

        {activeTab === "Documents" && (
          <DataTable
            columns={[
              { key: "title", label: "Document Name" },
              { key: "type", label: "Type" },
              { key: "uploaded_at", label: "Date", render: r => new Date(String(r.uploaded_at)).toLocaleDateString() },
              { key: "actions", label: "Actions", render: r => (
                <a href={String(r.file_url)} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-cream text-pistachio transition-colors inline-block" title="Download">
                  <Download className="w-4 h-4" />
                </a>
              )}
            ]}
            data={documents as unknown as Record<string, unknown>[]}
            emptyTitle="No documents found"
          />
        )}
      </div>

      {/* --- Modals --- */}
      
      {/* Salary Modal */}
      <Modal open={modalOpen.type === "Salary" && modalOpen.open} onClose={() => setModalOpen({ type: "", open: false })} title="Add Salary Record">
        <form onSubmit={handleSalarySubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-olive mb-1">Month & Year * (YYYY-MM)</label>
              <input type="month" required value={salaryForm.month_year || ""} onChange={e => setSalaryForm({...salaryForm, month_year: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-olive mb-1">Basic Salary (₹) *</label>
              <input type="number" required min="0" value={salaryForm.basic_salary} onChange={e => setSalaryForm({...salaryForm, basic_salary: Number(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-olive mb-1">Allowances (₹)</label>
              <input type="number" min="0" value={salaryForm.allowances} onChange={e => setSalaryForm({...salaryForm, allowances: Number(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-olive mb-1">Bonus (₹)</label>
              <input type="number" min="0" value={salaryForm.bonus} onChange={e => setSalaryForm({...salaryForm, bonus: Number(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-olive mb-1">Deductions (₹)</label>
              <input type="number" min="0" value={salaryForm.deductions} onChange={e => setSalaryForm({...salaryForm, deductions: Number(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-olive mb-1">PF (₹)</label>
              <input type="number" min="0" value={salaryForm.pf} onChange={e => setSalaryForm({...salaryForm, pf: Number(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-olive mb-1">ESI (₹)</label>
              <input type="number" min="0" value={salaryForm.esi} onChange={e => setSalaryForm({...salaryForm, esi: Number(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-olive mb-1">Status</label>
              <select value={salaryForm.status} onChange={e => setSalaryForm({...salaryForm, status: e.target.value as any})} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none">
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
            {salaryForm.status === "Paid" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-olive mb-1">Payment Date</label>
                  <input type="date" required value={salaryForm.payment_date || ""} onChange={e => setSalaryForm({...salaryForm, payment_date: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-olive mb-1">Payment Mode</label>
                  <select required value={salaryForm.payment_mode || "Bank Transfer"} onChange={e => setSalaryForm({...salaryForm, payment_mode: e.target.value as any})} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none">
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
              </>
            )}
          </div>
          <button type="submit" disabled={submitting} className="w-full py-3 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium hover:opacity-90">
            {submitting ? "Saving..." : "Save Salary Record"}
          </button>
        </form>
      </Modal>

      {/* Attendance Modal */}
      <Modal open={modalOpen.type === "Attendance" && modalOpen.open} onClose={() => setModalOpen({ type: "", open: false })} title="Mark Attendance">
        <form onSubmit={handleAttendanceSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-olive mb-1">Date *</label>
            <input type="date" required value={attendanceForm.date || ""} onChange={e => setAttendanceForm({...attendanceForm, date: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-olive mb-1">Status *</label>
            <select required value={attendanceForm.status} onChange={e => setAttendanceForm({...attendanceForm, status: e.target.value as any})} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none">
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Half Day">Half Day</option>
              <option value="Late Entry">Late Entry</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-olive mb-1">Notes</label>
            <input type="text" value={attendanceForm.notes || ""} onChange={e => setAttendanceForm({...attendanceForm, notes: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none" />
          </div>
          <button type="submit" disabled={submitting} className="w-full py-3 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium hover:opacity-90">
            {submitting ? "Saving..." : "Save Attendance"}
          </button>
        </form>
      </Modal>

      {/* Leave Modal */}
      <Modal open={modalOpen.type === "Leave" && modalOpen.open} onClose={() => setModalOpen({ type: "", open: false })} title="Record Leave">
        <form onSubmit={handleLeaveSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-olive mb-1">Leave Type *</label>
            <select required value={leaveForm.type} onChange={e => setLeaveForm({...leaveForm, type: e.target.value as any})} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none">
              <option value="Casual Leave">Casual Leave</option>
              <option value="Medical Leave">Medical Leave</option>
              <option value="Paid Leave">Paid Leave</option>
              <option value="Unpaid Leave">Unpaid Leave</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-olive mb-1">Start Date *</label>
              <input type="date" required value={leaveForm.start_date || ""} onChange={e => setLeaveForm({...leaveForm, start_date: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-olive mb-1">End Date *</label>
              <input type="date" required value={leaveForm.end_date || ""} onChange={e => setLeaveForm({...leaveForm, end_date: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-olive mb-1">Reason *</label>
            <textarea required rows={3} value={leaveForm.reason || ""} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none" />
          </div>
          <button type="submit" disabled={submitting} className="w-full py-3 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium hover:opacity-90">
            {submitting ? "Saving..." : "Submit Leave Request"}
          </button>
        </form>
      </Modal>

      {/* Documents Modal */}
      <Modal open={modalOpen.type === "Documents" && modalOpen.open} onClose={() => setModalOpen({ type: "", open: false })} title="Upload Document">
        <form onSubmit={handleDocumentSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-olive mb-1">Title (Optional)</label>
            <input type="text" value={docForm.title || ""} onChange={e => setDocForm({...docForm, title: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-olive mb-1">Document Type *</label>
            <select required value={docForm.type} onChange={e => setDocForm({...docForm, type: e.target.value as any})} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none">
              <option value="Resume">Resume</option>
              <option value="Qualification Certificates">Qualification Certificates</option>
              <option value="ID Proof">ID Proof</option>
              <option value="Joining Letter">Joining Letter</option>
              <option value="Experience Certificate">Experience Certificate</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-olive mb-1">Select File *</label>
            <input type="file" required onChange={e => setDocFile(e.target.files?.[0] || null)} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none" />
          </div>
          <button type="submit" disabled={submitting || !docFile} className="w-full py-3 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium hover:opacity-90 disabled:opacity-50">
            {submitting ? "Uploading..." : "Upload Document"}
          </button>
        </form>
      </Modal>

    </div>
  )
}
