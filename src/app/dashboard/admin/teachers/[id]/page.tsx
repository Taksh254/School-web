"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
  ArrowLeft, User, CreditCard, CalendarCheck, CalendarMinus, FileText,
  Plus, Pencil, Trash2, Download, Upload, Printer, IdCard, MessageSquare, Briefcase, Activity
} from "lucide-react"

import {
  getTeacher, deleteTeacher, getTeacherSalaries, addTeacherSalary, getTeacherAttendance,
  addTeacherAttendance, getTeacherLeaves, addTeacherLeave, updateTeacherLeaveStatus,
  getTeacherDocuments, addTeacherDocument, getTeacherNotes, addTeacherNote
} from "@/app/actions/teacher-actions"

import { Teacher, TeacherSalary, TeacherAttendance, TeacherLeave, TeacherDocument, AdminTeacherNote } from "@/lib/types"
import Modal from "@/components/dashboard/Modal"
import DataTable from "@/components/dashboard/DataTable"
import { supabase } from "@/lib/supabase"
import StatCard from "@/components/dashboard/StatCard"

type TabType = "Overview" | "Personal" | "Salary" | "Attendance" | "Leave" | "Documents" | "Notes"

const TABS: { id: TabType; label: string; icon: any }[] = [
  { id: "Overview", label: "Overview", icon: Activity },
  { id: "Personal", label: "Personal Info", icon: User },
  { id: "Salary", label: "Salary", icon: CreditCard },
  { id: "Attendance", label: "Attendance", icon: CalendarCheck },
  { id: "Leave", label: "Leave", icon: CalendarMinus },
  { id: "Documents", label: "Documents", icon: FileText },
  { id: "Notes", label: "Notes", icon: MessageSquare },
]

export default function TeacherProfilePage() {
  const { id } = useParams()
  const router = useRouter()
  
  const [activeTab, setActiveTab] = useState<TabType>("Overview")
  const [loading, setLoading] = useState(true)
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  
  const [salaries, setSalaries] = useState<TeacherSalary[]>([])
  const [attendance, setAttendance] = useState<TeacherAttendance[]>([])
  const [leaves, setLeaves] = useState<TeacherLeave[]>([])
  const [documents, setDocuments] = useState<TeacherDocument[]>([])
  const [notes, setNotes] = useState<AdminTeacherNote[]>([])
  
  const [modalOpen, setModalOpen] = useState<{ type: string; open: boolean }>({ type: "", open: false })
  const [submitting, setSubmitting] = useState(false)
  const [errorBanner, setErrorBanner] = useState<string | null>(null)
  
  const [salaryForm, setSalaryForm] = useState<Partial<TeacherSalary>>({ basic_salary: 0, allowances: 0, bonus: 0, deductions: 0, pf: 0, esi: 0, status: "Pending" })
  const [attendanceForm, setAttendanceForm] = useState<Partial<TeacherAttendance>>({ date: new Date().toISOString().split("T")[0], status: "Present" })
  const [leaveForm, setLeaveForm] = useState<Partial<TeacherLeave>>({ type: "Casual Leave", status: "Pending" })
  const [docForm, setDocForm] = useState<Partial<TeacherDocument>>({ type: "Resume" })
  const [docFile, setDocFile] = useState<File | null>(null)
  const [noteForm, setNoteForm] = useState<Partial<AdminTeacherNote>>({ note: "" })

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
      
      const [sals, atts, lvs, docs, nts] = await Promise.all([
        getTeacherSalaries(id),
        getTeacherAttendance(id),
        getTeacherLeaves(id),
        getTeacherDocuments(id),
        getTeacherNotes(id)
      ])
      
      setSalaries(sals)
      setAttendance(atts)
      setLeaves(lvs)
      setDocuments(docs)
      setNotes(nts)
    } catch (err: any) {
      console.error(err)
      setErrorBanner(err.message)
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => { loadData() }, [loadData])

  // Stats for Overview
  const currentSalary = salaries.length > 0 ? salaries[0].net_salary : 0
  const attendanceTotal = attendance.length
  const attendancePresent = attendance.filter(a => a.status === 'Present').length
  const attendancePercentage = attendanceTotal > 0 ? Math.round((attendancePresent / attendanceTotal) * 100) : 0
  const approvedLeaves = leaves.filter(l => l.status === 'Approved').length
  
  // Handlers
  const handlePrint = () => window.print()
  
  const handleDeleteTeacher = async () => {
    if (!confirm("Are you sure you want to delete this teacher?")) return
    if (!teacher) return
    try {
      await deleteTeacher(teacher.id)
      router.push("/dashboard/admin/teachers")
    } catch (e: any) {
      alert("Failed to delete teacher: " + e.message)
    }
  }

  const handleSalarySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teacher) return
    setSubmitting(true)
    try {
      const net = (Number(salaryForm.basic_salary) || 0) + (Number(salaryForm.allowances) || 0) + (Number(salaryForm.bonus) || 0) 
                  - (Number(salaryForm.deductions) || 0) - (Number(salaryForm.pf) || 0) - (Number(salaryForm.esi) || 0)
      const res = await addTeacherSalary({ ...salaryForm, teacher_id: teacher.id, net_salary: net } as any)
      if ('error' in res) throw new Error(res.error)
      setSalaries(prev => [res as TeacherSalary, ...prev])
      setModalOpen({ type: "", open: false })
    } catch (err: any) { setErrorBanner(err.message) } finally { setSubmitting(false) }
  }

  const handleAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teacher) return
    setSubmitting(true)
    try {
      const res = await addTeacherAttendance({ ...attendanceForm, teacher_id: teacher.id } as any)
      if ('error' in res) throw new Error(res.error)
      setAttendance(prev => [res as TeacherAttendance, ...prev])
      setModalOpen({ type: "", open: false })
    } catch (err: any) { setErrorBanner(err.message) } finally { setSubmitting(false) }
  }

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teacher) return
    setSubmitting(true)
    try {
      const res = await addTeacherLeave({ ...leaveForm, teacher_id: teacher.id, status: "Pending" } as any)
      if ('error' in res) throw new Error(res.error)
      setLeaves(prev => [res as TeacherLeave, ...prev])
      setModalOpen({ type: "", open: false })
    } catch (err: any) { setErrorBanner(err.message) } finally { setSubmitting(false) }
  }

  const handleLeaveStatusChange = async (leaveId: string, status: any) => {
    try {
      const res = await updateTeacherLeaveStatus(leaveId, status)
      if ('error' in res) throw new Error(res.error)
      setLeaves(prev => prev.map(l => l.id === leaveId ? (res as TeacherLeave) : l))
    } catch (err: any) { alert(err.message) }
  }

  const handleDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teacher || !docFile) return
    setSubmitting(true)
    try {
      const fileExt = docFile.name.split('.').pop()
      const fileName = `${teacher.id}_${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('teacher_documents').upload(fileName, docFile)
      if (uploadError) throw new Error("Upload failed: " + uploadError.message)
      const { data: publicUrlData } = supabase.storage.from('teacher_documents').getPublicUrl(fileName)
      const res = await addTeacherDocument({ teacher_id: teacher.id, title: docForm.title || docFile.name, type: docForm.type, file_url: publicUrlData.publicUrl } as any)
      if ('error' in res) throw new Error(res.error)
      setDocuments(prev => [res as TeacherDocument, ...prev])
      setModalOpen({ type: "", open: false }); setDocFile(null)
    } catch (err: any) { setErrorBanner(err.message) } finally { setSubmitting(false) }
  }

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teacher) return
    setSubmitting(true)
    try {
      const res = await addTeacherNote({ teacher_id: teacher.id, note: noteForm.note || "", author: "Admin" })
      if ('error' in res) throw new Error(res.error)
      setNotes(prev => [res as AdminTeacherNote, ...prev])
      setModalOpen({ type: "", open: false }); setNoteForm({ note: "" })
    } catch (err: any) { setErrorBanner(err.message) } finally { setSubmitting(false) }
  }

  if (loading || !teacher) return <div className="flex justify-center p-12"><div className="w-8 h-8 rounded-full border-2 border-pistachio border-t-transparent animate-spin" /></div>

  return (
    <div className="space-y-6 print:m-0 print:p-0 print:bg-white print:text-black">
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-beige/20 shadow-soft relative overflow-hidden print:shadow-none print:border-none print:p-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-pistachio/10 to-transparent rounded-bl-full pointer-events-none print:hidden" />
        
        <div className="flex flex-col md:flex-row gap-8 relative z-10">
          {/* Avatar Area */}
          <div className="flex flex-col items-center space-y-4">
            <div className="w-32 h-32 rounded-3xl bg-pistachio/10 flex items-center justify-center text-4xl font-display font-bold text-olive shadow-inner border border-white/50 overflow-hidden">
              {teacher.photo ? (
                <img src={teacher.photo} alt={teacher.full_name} className="w-full h-full object-cover rounded-3xl" />
              ) : (
                teacher.full_name.charAt(0)
              )}
            </div>
            <div className="flex flex-wrap justify-center gap-2 print:hidden">
              <button onClick={handlePrint} className="p-2 rounded-xl bg-cream hover:bg-beige/40 text-olive transition-colors" title="Print Profile">
                <Printer className="w-4 h-4" />
              </button>
              <button onClick={() => alert("ID Card Generation opens in a new tab (simulated)")} className="p-2 rounded-xl bg-cream hover:bg-beige/40 text-olive transition-colors" title="Generate ID Card">
                <IdCard className="w-4 h-4" />
              </button>
              <button onClick={() => router.push("/dashboard/admin/teachers")} className="p-2 rounded-xl bg-cream hover:bg-beige/40 text-olive transition-colors" title="Edit Teacher">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={handleDeleteTeacher} className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 transition-colors" title="Delete Teacher">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Info Area */}
          <div className="flex-1 space-y-4">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div>
                <h1 className="text-3xl font-display font-bold text-olive mb-1">{teacher.full_name}</h1>
                <p className="text-olive/60 font-body flex items-center gap-2">
                  <Briefcase className="w-4 h-4" /> {teacher.designation || 'Teacher'} • {teacher.department || 'General'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-cream rounded-lg text-xs font-bold text-olive font-mono">ID: {teacher.teacher_id}</span>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${teacher.status === 'Active' ? 'bg-pistachio/20 text-pistachio' : 'bg-amber-100 text-amber-600'}`}>
                  {teacher.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-beige/20">
              <div>
                <p className="text-xs text-olive/50 font-bold uppercase tracking-wider mb-1">Email</p>
                <p className="text-sm font-medium text-olive truncate">{teacher.email}</p>
              </div>
              <div>
                <p className="text-xs text-olive/50 font-bold uppercase tracking-wider mb-1">Phone</p>
                <p className="text-sm font-medium text-olive">{teacher.phone}</p>
              </div>
              <div>
                <p className="text-xs text-olive/50 font-bold uppercase tracking-wider mb-1">Joining Date</p>
                <p className="text-sm font-medium text-olive">{teacher.joining_date}</p>
              </div>
              <div>
                <p className="text-xs text-olive/50 font-bold uppercase tracking-wider mb-1">Experience</p>
                <p className="text-sm font-medium text-olive">{teacher.experience || 'Fresher'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {errorBanner && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-700 flex justify-between items-center print:hidden">
          <span>{errorBanner}</span>
          <button onClick={() => setErrorBanner(null)} className="text-red-500 font-bold ml-2">×</button>
        </div>
      )}

      {/* Tabs Menu */}
      <div className="flex border-b border-beige/20 overflow-x-auto hide-scrollbar print:hidden">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 font-body whitespace-nowrap ${
              activeTab === tab.id ? "border-pistachio text-olive" : "border-transparent text-olive/50 hover:text-olive hover:bg-cream/30"
            }`}>
            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-pistachio" : ""}`} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft min-h-[400px] print:shadow-none print:border-none print:p-0">
        
        {/* OVERVIEW */}
        {activeTab === "Overview" && (
          <div className="space-y-6">
            <h3 className="text-lg font-display font-bold text-olive print:hidden">Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={CreditCard} label="Current Salary" value={`₹${currentSalary.toLocaleString()}`} color="bg-pistachio/10" index={0} />
              <StatCard icon={CalendarCheck} label="Attendance" value={`${attendancePercentage}%`} color="bg-sage/10" index={1} />
              <StatCard icon={CalendarMinus} label="Leaves Taken" value={approvedLeaves} color="bg-amber-100/50" index={2} />
              <StatCard icon={Briefcase} label="Classes Assigned" value={"3"} color="bg-cream" index={3} />
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 pt-4">
              <div className="bg-white p-6 rounded-2xl border border-beige/20">
                <h4 className="text-sm font-bold text-olive mb-4">Assigned Subjects</h4>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-cream rounded-lg text-sm text-olive">Mathematics</span>
                  <span className="px-3 py-1 bg-cream rounded-lg text-sm text-olive">Science</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-beige/20">
                <h4 className="text-sm font-bold text-olive mb-4">Recent Activity</h4>
                <ul className="space-y-3 text-sm text-olive/70">
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-pistachio" /> Salary generated for last month</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Leave request approved</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Uploaded Resume document</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* PERSONAL INFO */}
        {activeTab === "Personal" && (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-display font-bold text-olive mb-4">Personal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-4 bg-white rounded-2xl border border-beige/20"><p className="text-xs text-olive/50 font-bold uppercase mb-1">Date of Birth</p><p className="font-medium text-olive">{teacher.dob}</p></div>
                <div className="p-4 bg-white rounded-2xl border border-beige/20"><p className="text-xs text-olive/50 font-bold uppercase mb-1">Gender</p><p className="font-medium text-olive">{teacher.gender}</p></div>
                <div className="p-4 bg-white rounded-2xl border border-beige/20"><p className="text-xs text-olive/50 font-bold uppercase mb-1">Blood Group</p><p className="font-medium text-olive">{teacher.blood_group || 'N/A'}</p></div>
                <div className="p-4 bg-white rounded-2xl border border-beige/20 md:col-span-2 lg:col-span-3"><p className="text-xs text-olive/50 font-bold uppercase mb-1">Address</p><p className="font-medium text-olive">{teacher.address}</p></div>
                <div className="p-4 bg-white rounded-2xl border border-beige/20"><p className="text-xs text-olive/50 font-bold uppercase mb-1">Emergency Contact</p><p className="font-medium text-olive">{teacher.emergency_contact}</p></div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-display font-bold text-olive mb-4">Professional Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-4 bg-white rounded-2xl border border-beige/20"><p className="text-xs text-olive/50 font-bold uppercase mb-1">Qualification</p><p className="font-medium text-olive">{teacher.qualification}</p></div>
                <div className="p-4 bg-white rounded-2xl border border-beige/20"><p className="text-xs text-olive/50 font-bold uppercase mb-1">Specialization</p><p className="font-medium text-olive">{teacher.specialization || 'N/A'}</p></div>
                <div className="p-4 bg-white rounded-2xl border border-beige/20"><p className="text-xs text-olive/50 font-bold uppercase mb-1">Employment Type</p><p className="font-medium text-olive">{teacher.employment_type}</p></div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-display font-bold text-olive mb-4">Financial & KYC Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-4 bg-white rounded-2xl border border-beige/20"><p className="text-xs text-olive/50 font-bold uppercase mb-1">Aadhaar Number</p><p className="font-medium text-olive">{teacher.aadhaar_number || 'N/A'}</p></div>
                <div className="p-4 bg-white rounded-2xl border border-beige/20"><p className="text-xs text-olive/50 font-bold uppercase mb-1">PAN Number</p><p className="font-medium text-olive">{teacher.pan_number || 'N/A'}</p></div>
                <div className="p-4 bg-white rounded-2xl border border-beige/20"><p className="text-xs text-olive/50 font-bold uppercase mb-1">Bank Name</p><p className="font-medium text-olive">{teacher.bank_name || 'N/A'}</p></div>
                <div className="p-4 bg-white rounded-2xl border border-beige/20"><p className="text-xs text-olive/50 font-bold uppercase mb-1">Account Number</p><p className="font-medium text-olive">{teacher.account_number || 'N/A'}</p></div>
                <div className="p-4 bg-white rounded-2xl border border-beige/20"><p className="text-xs text-olive/50 font-bold uppercase mb-1">IFSC Code</p><p className="font-medium text-olive">{teacher.ifsc_code || 'N/A'}</p></div>
                <div className="p-4 bg-white rounded-2xl border border-beige/20"><p className="text-xs text-olive/50 font-bold uppercase mb-1">UPI ID</p><p className="font-medium text-olive">{teacher.upi_id || 'N/A'}</p></div>
              </div>
            </div>
          </div>
        )}

        {/* SALARY */}
        {activeTab === "Salary" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center print:hidden">
              <h3 className="text-lg font-display font-bold text-olive">Salary History</h3>
              <button onClick={() => setModalOpen({ type: "Salary", open: true })} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium shadow-soft">
                <Plus className="w-4 h-4" /> Add Record
              </button>
            </div>
            <DataTable
              columns={[
                { key: "month_year", label: "Month" },
                { key: "basic_salary", label: "Basic (₹)", render: r => Number(r.basic_salary).toLocaleString() },
                { key: "allowances", label: "Allowances (₹)" },
                { key: "deductions", label: "Deductions (₹)" },
                { key: "net_salary", label: "Net Salary (₹)", render: r => <span className="font-bold">₹{Number(r.net_salary).toLocaleString()}</span> },
                { key: "status", label: "Status", render: r => <span className={`px-2 py-1 rounded-md text-xs font-medium ${r.status === 'Paid' ? 'text-pistachio bg-pistachio/10' : 'text-amber-500 bg-amber-50'}`}>{String(r.status)}</span> },
                { key: "actions", label: "Actions", render: r => (
                  <button onClick={handlePrint} className="text-xs text-pistachio hover:underline print:hidden">Slip</button>
                )}
              ]}
              data={salaries as unknown as Record<string, unknown>[]}
              emptyTitle="No salary records found"
            />
          </div>
        )}

        {/* ATTENDANCE */}
        {activeTab === "Attendance" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center print:hidden">
              <h3 className="text-lg font-display font-bold text-olive">Attendance Records</h3>
              <button onClick={() => setModalOpen({ type: "Attendance", open: true })} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium shadow-soft">
                <Plus className="w-4 h-4" /> Mark Attendance
              </button>
            </div>
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
          </div>
        )}

        {/* LEAVE */}
        {activeTab === "Leave" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center print:hidden">
              <h3 className="text-lg font-display font-bold text-olive">Leave Requests</h3>
              <button onClick={() => setModalOpen({ type: "Leave", open: true })} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium shadow-soft">
                <Plus className="w-4 h-4" /> Record Leave
              </button>
            </div>
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
          </div>
        )}

        {/* DOCUMENTS */}
        {activeTab === "Documents" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center print:hidden">
              <h3 className="text-lg font-display font-bold text-olive">Documents</h3>
              <button onClick={() => setModalOpen({ type: "Documents", open: true })} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium shadow-soft">
                <Upload className="w-4 h-4" /> Upload Doc
              </button>
            </div>
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
          </div>
        )}

        {/* NOTES */}
        {activeTab === "Notes" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center print:hidden">
              <h3 className="text-lg font-display font-bold text-olive">Confidential Notes</h3>
              <button onClick={() => setModalOpen({ type: "Notes", open: true })} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium shadow-soft">
                <Plus className="w-4 h-4" /> Add Note
              </button>
            </div>
            {notes.length === 0 ? (
              <div className="text-center py-12 text-olive/50 font-body text-sm border-2 border-dashed border-beige/20 rounded-2xl">No notes available.</div>
            ) : (
              <div className="grid gap-4">
                {notes.map(note => (
                  <div key={note.id} className="bg-white p-5 rounded-2xl border border-beige/20 shadow-soft">
                    <p className="text-sm text-olive mb-3">{note.note}</p>
                    <div className="flex justify-between text-xs text-olive/50 font-medium bg-cream p-2 rounded-lg">
                      <span>By: {note.author}</span>
                      <span>{new Date(note.date || "").toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
            <div><label className="block text-xs font-medium text-olive mb-1">Basic Salary (₹) *</label><input type="number" required min="0" value={salaryForm.basic_salary} onChange={e => setSalaryForm({...salaryForm, basic_salary: Number(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none" /></div>
            <div><label className="block text-xs font-medium text-olive mb-1">Allowances (₹)</label><input type="number" min="0" value={salaryForm.allowances} onChange={e => setSalaryForm({...salaryForm, allowances: Number(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none" /></div>
            <div><label className="block text-xs font-medium text-olive mb-1">Bonus (₹)</label><input type="number" min="0" value={salaryForm.bonus} onChange={e => setSalaryForm({...salaryForm, bonus: Number(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none" /></div>
            <div><label className="block text-xs font-medium text-olive mb-1">Deductions (₹)</label><input type="number" min="0" value={salaryForm.deductions} onChange={e => setSalaryForm({...salaryForm, deductions: Number(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none" /></div>
            <div><label className="block text-xs font-medium text-olive mb-1">PF (₹)</label><input type="number" min="0" value={salaryForm.pf} onChange={e => setSalaryForm({...salaryForm, pf: Number(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none" /></div>
            <div><label className="block text-xs font-medium text-olive mb-1">ESI (₹)</label><input type="number" min="0" value={salaryForm.esi} onChange={e => setSalaryForm({...salaryForm, esi: Number(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none" /></div>
            <div>
              <label className="block text-xs font-medium text-olive mb-1">Status</label>
              <select value={salaryForm.status} onChange={e => setSalaryForm({...salaryForm, status: e.target.value as any})} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none">
                <option value="Pending">Pending</option><option value="Paid">Paid</option>
              </select>
            </div>
            {salaryForm.status === "Paid" && (
              <>
                <div><label className="block text-xs font-medium text-olive mb-1">Payment Date</label><input type="date" required value={salaryForm.payment_date || ""} onChange={e => setSalaryForm({...salaryForm, payment_date: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none" /></div>
                <div><label className="block text-xs font-medium text-olive mb-1">Payment Mode</label><select required value={salaryForm.payment_mode || "Bank Transfer"} onChange={e => setSalaryForm({...salaryForm, payment_mode: e.target.value as any})} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none"><option value="Bank Transfer">Bank Transfer</option><option value="Cash">Cash</option><option value="Cheque">Cheque</option><option value="UPI">UPI</option></select></div>
              </>
            )}
          </div>
          <button type="submit" disabled={submitting} className="w-full py-3 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium hover:opacity-90">{submitting ? "Saving..." : "Save Salary Record"}</button>
        </form>
      </Modal>

      {/* Attendance Modal */}
      <Modal open={modalOpen.type === "Attendance" && modalOpen.open} onClose={() => setModalOpen({ type: "", open: false })} title="Mark Attendance">
        <form onSubmit={handleAttendanceSubmit} className="space-y-4">
          <div><label className="block text-xs font-medium text-olive mb-1">Date *</label><input type="date" required value={attendanceForm.date || ""} onChange={e => setAttendanceForm({...attendanceForm, date: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none" /></div>
          <div><label className="block text-xs font-medium text-olive mb-1">Status *</label><select required value={attendanceForm.status} onChange={e => setAttendanceForm({...attendanceForm, status: e.target.value as any})} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none"><option value="Present">Present</option><option value="Absent">Absent</option><option value="Half Day">Half Day</option><option value="Late Entry">Late Entry</option></select></div>
          <div><label className="block text-xs font-medium text-olive mb-1">Notes</label><input type="text" value={attendanceForm.notes || ""} onChange={e => setAttendanceForm({...attendanceForm, notes: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none" /></div>
          <button type="submit" disabled={submitting} className="w-full py-3 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium hover:opacity-90">{submitting ? "Saving..." : "Save Attendance"}</button>
        </form>
      </Modal>

      {/* Leave Modal */}
      <Modal open={modalOpen.type === "Leave" && modalOpen.open} onClose={() => setModalOpen({ type: "", open: false })} title="Record Leave">
        <form onSubmit={handleLeaveSubmit} className="space-y-4">
          <div><label className="block text-xs font-medium text-olive mb-1">Leave Type *</label><select required value={leaveForm.type} onChange={e => setLeaveForm({...leaveForm, type: e.target.value as any})} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none"><option value="Casual Leave">Casual Leave</option><option value="Medical Leave">Medical Leave</option><option value="Paid Leave">Paid Leave</option><option value="Unpaid Leave">Unpaid Leave</option></select></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-olive mb-1">Start Date *</label><input type="date" required value={leaveForm.start_date || ""} onChange={e => setLeaveForm({...leaveForm, start_date: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none" /></div>
            <div><label className="block text-xs font-medium text-olive mb-1">End Date *</label><input type="date" required value={leaveForm.end_date || ""} onChange={e => setLeaveForm({...leaveForm, end_date: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none" /></div>
          </div>
          <div><label className="block text-xs font-medium text-olive mb-1">Reason *</label><textarea required rows={3} value={leaveForm.reason || ""} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none" /></div>
          <button type="submit" disabled={submitting} className="w-full py-3 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium hover:opacity-90">{submitting ? "Saving..." : "Submit Leave Request"}</button>
        </form>
      </Modal>

      {/* Documents Modal */}
      <Modal open={modalOpen.type === "Documents" && modalOpen.open} onClose={() => setModalOpen({ type: "", open: false })} title="Upload Document">
        <form onSubmit={handleDocumentSubmit} className="space-y-4">
          <div><label className="block text-xs font-medium text-olive mb-1">Title (Optional)</label><input type="text" value={docForm.title || ""} onChange={e => setDocForm({...docForm, title: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none" /></div>
          <div><label className="block text-xs font-medium text-olive mb-1">Document Type *</label><select required value={docForm.type} onChange={e => setDocForm({...docForm, type: e.target.value as any})} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none"><option value="Resume">Resume</option><option value="Qualification Certificates">Qualification Certificates</option><option value="ID Proof">ID Proof</option><option value="Joining Letter">Joining Letter</option><option value="Experience Certificate">Experience Certificate</option><option value="Other">Other</option></select></div>
          <div><label className="block text-xs font-medium text-olive mb-1">Select File *</label><input type="file" required onChange={e => setDocFile(e.target.files?.[0] || null)} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none" /></div>
          <button type="submit" disabled={submitting || !docFile} className="w-full py-3 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium hover:opacity-90 disabled:opacity-50">{submitting ? "Uploading..." : "Upload Document"}</button>
        </form>
      </Modal>

      {/* Notes Modal */}
      <Modal open={modalOpen.type === "Notes" && modalOpen.open} onClose={() => setModalOpen({ type: "", open: false })} title="Add Confidential Note">
        <form onSubmit={handleNoteSubmit} className="space-y-4">
          <div><label className="block text-xs font-medium text-olive mb-1">Note Content *</label><textarea required rows={4} value={noteForm.note || ""} onChange={e => setNoteForm({...noteForm, note: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm outline-none focus:border-pistachio focus:shadow-glow" placeholder="Enter notes here..." /></div>
          <button type="submit" disabled={submitting} className="w-full py-3 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium hover:opacity-90">{submitting ? "Saving..." : "Add Note"}</button>
        </form>
      </Modal>
    </div>
  )
}
