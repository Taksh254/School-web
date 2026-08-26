"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
  Users,
  CalendarCheck,
  Search,
  ArrowLeft,
  X,
  Phone,
  Sparkles,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Filter,
} from "lucide-react"
import {
  getTeacherAssignedStudents,
  getStudentFullDetails,
  saveTeacherStudentNote,
  saveStudentDevelopment,
} from "@/app/actions/teacher-portal-actions"
import type { Student, ProgramType } from "@/lib/types"

const PROGRAMS: (ProgramType | "All")[] = ["All", "Play Group", "Nursery", "LKG", "UKG"]

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [teacher, setTeacher] = useState<any>(null)
  const [search, setSearch] = useState("")
  const [selectedProgram, setSelectedProgram] = useState<string>("All")
  const [loading, setLoading] = useState(true)
  const [errorBanner, setErrorBanner] = useState<string | null>(null)

  // Selected student for detail modal
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [studentDetails, setStudentDetails] = useState<any>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [activeTab, setActiveTab] = useState<"overview" | "attendance" | "development" | "notes">("overview")

  // Quick note modal inside student modal
  const [newNoteCategory, setNewNoteCategory] = useState("general")
  const [newNoteMessage, setNewNoteMessage] = useState("")
  const [savingNote, setSavingNote] = useState(false)

  // Quick dev observation modal
  const [newObsComm, setNewObsComm] = useState("Good")
  const [newObsCognitive, setNewObsCognitive] = useState("Good")
  const [newObsMotor, setNewObsMotor] = useState("Good")
  const [newObsSocial, setNewObsSocial] = useState("Good")
  const [newObsCreativity, setNewObsCreativity] = useState("Good")
  const [newObsParticipation, setNewObsParticipation] = useState("Good")
  const [newObsText, setNewObsText] = useState("")
  const [savingObs, setSavingObs] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await getTeacherAssignedStudents()
        if (res.error) {
          setErrorBanner(res.error)
        } else {
          setStudents(res.students)
          setTeacher(res.teacher)
        }
      } catch (err: any) {
        setErrorBanner(err?.message || "Failed to load assigned students")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const openStudentModal = async (studentId: string) => {
    setSelectedStudentId(studentId)
    setActiveTab("overview")
    setLoadingDetails(true)
    try {
      const details = await getStudentFullDetails(studentId)
      if (details.error) {
        alert(details.error)
        setSelectedStudentId(null)
      } else {
        setStudentDetails(details)
      }
    } catch (err) {
      console.error("Error loading student details:", err)
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudentId || !newNoteMessage.trim()) return
    setSavingNote(true)
    try {
      const today = new Date().toISOString().slice(0, 10)
      const res = await saveTeacherStudentNote({
        studentId: selectedStudentId,
        category: newNoteCategory,
        message: newNoteMessage.trim(),
        date: today,
      })
      if (res.success) {
        setNewNoteMessage("")
        // Refresh details
        const updated = await getStudentFullDetails(selectedStudentId)
        setStudentDetails(updated)
      } else {
        alert(res.error || "Failed to save note")
      }
    } catch (err: any) {
      alert(err?.message || "Error saving note")
    } finally {
      setSavingNote(false)
    }
  }

  const handleAddObservation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudentId || !newObsText.trim()) return
    setSavingObs(true)
    try {
      const today = new Date().toISOString().slice(0, 10)
      const res = await saveStudentDevelopment({
        studentId: selectedStudentId,
        date: today,
        communication: newObsComm,
        cognitiveDevelopment: newObsCognitive,
        motorSkills: newObsMotor,
        socialDevelopment: newObsSocial,
        creativity: newObsCreativity,
        participation: newObsParticipation,
        observation: newObsText.trim(),
      })
      if (res.success) {
        setNewObsText("")
        const updated = await getStudentFullDetails(selectedStudentId)
        setStudentDetails(updated)
      } else {
        alert(res.error || "Failed to save observation")
      }
    } catch (err: any) {
      alert(err?.message || "Error saving observation")
    } finally {
      setSavingObs(false)
    }
  }

  const filtered = students.filter((s) => {
    const q = search.toLowerCase().trim()
    const matchesSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.admissionNo.toLowerCase().includes(q) ||
      (s.parentName && s.parentName.toLowerCase().includes(q))
    const matchesProg = selectedProgram === "All" || s.program === selectedProgram
    return matchesSearch && matchesProg
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
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-olive">My Students</h1>
          <p className="text-xs sm:text-sm text-olive/60 font-body">
            {students.length} students assigned to your class roster
          </p>
        </div>

        <Link
          href="/dashboard/teacher/attendance"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium font-body shadow-soft hover:opacity-95 transition-opacity shrink-0"
        >
          <CalendarCheck className="w-4 h-4" />
          Mark Attendance
        </Link>
      </div>

      {errorBanner && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-sm text-rose-700 font-body">
          {errorBanner}
        </div>
      )}

      {/* ── SEARCH & PROGRAM FILTERS ─────────────────────────────────── */}
      <div className="bg-soft-white rounded-3xl p-4 sm:p-5 border border-beige/20 shadow-soft space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-olive/40 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, admission number, or parent name..."
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-cream border border-beige/25 text-sm text-olive placeholder:text-olive/40 outline-none focus:border-pistachio focus:ring-2 focus:ring-pistachio/20 transition-all font-body"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-xs text-olive/50 font-body mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Program:
          </span>
          {PROGRAMS.map((prog) => (
            <button
              key={prog}
              onClick={() => setSelectedProgram(prog)}
              className={`px-3 py-1 rounded-full text-xs font-medium font-body transition-all ${
                selectedProgram === prog
                  ? "bg-pistachio text-white shadow-soft"
                  : "bg-cream text-olive/60 hover:bg-beige/30"
              }`}
            >
              {prog}
            </button>
          ))}
        </div>
      </div>

      {/* ── STUDENT CARDS GRID ───────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-9 h-9 rounded-full border-3 border-pistachio border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-soft-white rounded-3xl p-12 border border-beige/20 shadow-soft text-center">
          <Users className="w-12 h-12 text-olive/20 mx-auto mb-3" />
          <h3 className="text-base font-display font-semibold text-olive">No students found</h3>
          <p className="text-xs text-olive/50 font-body mt-1 max-w-sm mx-auto">
            {search || selectedProgram !== "All"
              ? "No students match your filter criteria. Try clearing the search or changing program."
              : "No students have been assigned to your class yet. Please contact school administration."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((student, idx) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.03, 0.3) }}
              onClick={() => openStudentModal(student.id)}
              className="bg-soft-white rounded-3xl p-5 border border-beige/20 shadow-soft hover:shadow-card hover:border-pistachio/50 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pistachio/20 to-sage/20 border border-pistachio/30 flex items-center justify-center text-sm font-display font-bold text-olive shrink-0">
                      {student.photo ? (
                        <img src={student.photo} alt={student.name} className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        student.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base text-olive group-hover:text-pistachio transition-colors">
                        {student.name}
                      </h3>
                      <span className="text-[11px] font-mono text-olive/40">{student.admissionNo}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-cream text-olive/80 border border-beige/30">
                    {student.program} {student.section}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-olive/70 font-body bg-cream/40 rounded-2xl p-3 border border-beige/15 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-olive/40">Parent:</span>
                    <span className="font-medium text-olive">{student.parentName || "—"}</span>
                  </div>
                  {student.parentPhone && (
                    <div className="flex items-center justify-between">
                      <span className="text-olive/40">Phone:</span>
                      <span className="font-mono text-olive/80">{student.parentPhone}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-olive/40">Age / DOB:</span>
                    <span className="text-olive">{student.age > 0 ? `${student.age} yrs` : student.dateOfBirth || "—"}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-beige/15 text-xs text-pistachio font-medium font-body">
                <span>View Full Profile & Progress</span>
                <ArrowLeft className="w-3.5 h-3.5 rotate-180 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── STUDENT DETAILS MODAL ────────────────────────────────────── */}
      <AnimatePresence>
        {selectedStudentId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-soft-white rounded-[32px] p-6 sm:p-8 max-w-2xl w-full border border-beige/25 shadow-card my-8 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-beige/20">
                <div className="flex items-center gap-3.5">
                  <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-pistachio to-sage flex items-center justify-center text-white font-display font-bold text-lg shadow-soft">
                    {studentDetails?.student?.name ? studentDetails.student.name.charAt(0).toUpperCase() : "S"}
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-bold text-olive">
                      {studentDetails?.student?.name || "Student Profile"}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-olive/50 font-body">
                      <span>{studentDetails?.student?.program} Sec {studentDetails?.student?.section}</span>
                      <span>•</span>
                      <span className="font-mono">{studentDetails?.student?.admissionNo}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStudentId(null)}
                  className="w-9 h-9 rounded-full bg-cream hover:bg-beige/40 flex items-center justify-center text-olive/60 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {loadingDetails ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 rounded-full border-3 border-pistachio border-t-transparent animate-spin" />
                </div>
              ) : studentDetails?.student ? (
                <div className="mt-4 space-y-6">
                  {/* Tabs */}
                  <div className="flex gap-2 border-b border-beige/20 pb-2 overflow-x-auto">
                    {[
                      { id: "overview", label: "Overview" },
                      { id: "attendance", label: "Attendance" },
                      { id: "development", label: "Development" },
                      { id: "notes", label: "Teacher Notes" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold font-body transition-all whitespace-nowrap ${
                          activeTab === tab.id
                            ? "bg-pistachio text-white shadow-soft"
                            : "bg-cream text-olive/60 hover:bg-beige/30"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* TAB 1: OVERVIEW */}
                  {activeTab === "overview" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-cream/40 rounded-2xl p-4 border border-beige/20">
                          <span className="text-[11px] text-olive/40 font-body block">Full Name</span>
                          <span className="text-sm font-semibold text-olive font-body">{studentDetails.student.name}</span>
                        </div>
                        <div className="bg-cream/40 rounded-2xl p-4 border border-beige/20">
                          <span className="text-[11px] text-olive/40 font-body block">Admission No</span>
                          <span className="text-sm font-mono font-semibold text-olive">{studentDetails.student.admissionNo}</span>
                        </div>
                        <div className="bg-cream/40 rounded-2xl p-4 border border-beige/20">
                          <span className="text-[11px] text-olive/40 font-body block">Class Program</span>
                          <span className="text-sm font-semibold text-olive font-body">{studentDetails.student.program} (Section {studentDetails.student.section})</span>
                        </div>
                        <div className="bg-cream/40 rounded-2xl p-4 border border-beige/20">
                          <span className="text-[11px] text-olive/40 font-body block">Date of Birth</span>
                          <span className="text-sm font-semibold text-olive font-body">{studentDetails.student.dateOfBirth || "—"} ({studentDetails.student.age} yrs)</span>
                        </div>
                      </div>

                      <div className="bg-soft-white rounded-2xl p-4 border border-beige/25 shadow-soft space-y-3">
                        <h4 className="text-xs font-bold text-olive uppercase tracking-wider font-body">Parent Information</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-body">
                          <div>
                            <span className="text-olive/40 block">Parent Name:</span>
                            <span className="font-semibold text-olive">{studentDetails.student.parentName || "—"}</span>
                          </div>
                          <div>
                            <span className="text-olive/40 block">Contact Phone:</span>
                            <span className="font-mono text-olive flex items-center gap-1.5 mt-0.5">
                              <Phone className="w-3 h-3 text-pistachio" />
                              {studentDetails.student.parentPhone || "—"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-200/60 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-emerald-800 font-body">Overall Attendance Rate</p>
                          <p className="text-2xl font-display font-bold text-emerald-900">{studentDetails.attendance.attendanceRate}%</p>
                        </div>
                        <div className="text-right text-xs text-emerald-700 font-body">
                          <p>{studentDetails.attendance.presentCount} days present</p>
                          <p>{studentDetails.attendance.absentCount} absent • {studentDetails.attendance.leaveCount} on leave</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: ATTENDANCE */}
                  {activeTab === "attendance" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="p-3 bg-cream/40 rounded-xl border border-beige/20">
                          <span className="text-[10px] text-olive/40 block font-body">Rate</span>
                          <span className="text-lg font-bold text-olive">{studentDetails.attendance.attendanceRate}%</span>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                          <span className="text-[10px] text-emerald-600 block font-body">Present</span>
                          <span className="text-lg font-bold text-emerald-800">{studentDetails.attendance.presentCount}</span>
                        </div>
                        <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                          <span className="text-[10px] text-rose-600 block font-body">Absent</span>
                          <span className="text-lg font-bold text-rose-800">{studentDetails.attendance.absentCount}</span>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                          <span className="text-[10px] text-amber-600 block font-body">Leaves</span>
                          <span className="text-lg font-bold text-amber-800">{studentDetails.attendance.leaveCount}</span>
                        </div>
                      </div>

                      <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                        {studentDetails.attendance.records.length === 0 ? (
                          <p className="text-xs text-olive/40 text-center py-6">No attendance records logged yet.</p>
                        ) : (
                          studentDetails.attendance.records.map((r: any) => (
                            <div key={r.id} className="flex items-center justify-between p-2.5 rounded-xl bg-cream/30 border border-beige/15 text-xs font-body">
                              <span className="font-mono text-olive/80">{r.date}</span>
                              <span className={`px-2 py-0.5 rounded-full capitalize font-semibold text-[10px] ${
                                r.status === "present" ? "bg-emerald-100 text-emerald-800" :
                                r.status === "absent" ? "bg-rose-100 text-rose-800" :
                                "bg-amber-100 text-amber-800"
                              }`}>
                                {r.status}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: DEVELOPMENT OBSERVATIONS */}
                  {activeTab === "development" && (
                    <div className="space-y-4">
                      {/* Inline add observation */}
                      <form onSubmit={handleAddObservation} className="p-4 bg-cream/40 rounded-2xl border border-beige/25 space-y-3">
                        <h4 className="text-xs font-bold text-olive uppercase font-body flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-pistachio" /> Add Development Observation
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-body">
                          <div>
                            <label className="text-[10px] text-olive/60 block mb-0.5">Communication</label>
                            <select value={newObsComm} onChange={(e) => setNewObsComm(e.target.value)} className="w-full p-1.5 rounded-lg bg-white border border-beige/30 text-xs text-olive">
                              {["Needs Support", "Developing", "Good", "Very Good", "Excellent"].map((r) => (<option key={r} value={r}>{r}</option>))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-olive/60 block mb-0.5">Cognitive</label>
                            <select value={newObsCognitive} onChange={(e) => setNewObsCognitive(e.target.value)} className="w-full p-1.5 rounded-lg bg-white border border-beige/30 text-xs text-olive">
                              {["Needs Support", "Developing", "Good", "Very Good", "Excellent"].map((r) => (<option key={r} value={r}>{r}</option>))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-olive/60 block mb-0.5">Motor Skills</label>
                            <select value={newObsMotor} onChange={(e) => setNewObsMotor(e.target.value)} className="w-full p-1.5 rounded-lg bg-white border border-beige/30 text-xs text-olive">
                              {["Needs Support", "Developing", "Good", "Very Good", "Excellent"].map((r) => (<option key={r} value={r}>{r}</option>))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-olive/60 block mb-0.5">Social Dev</label>
                            <select value={newObsSocial} onChange={(e) => setNewObsSocial(e.target.value)} className="w-full p-1.5 rounded-lg bg-white border border-beige/30 text-xs text-olive">
                              {["Needs Support", "Developing", "Good", "Very Good", "Excellent"].map((r) => (<option key={r} value={r}>{r}</option>))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-olive/60 block mb-0.5">Creativity</label>
                            <select value={newObsCreativity} onChange={(e) => setNewObsCreativity(e.target.value)} className="w-full p-1.5 rounded-lg bg-white border border-beige/30 text-xs text-olive">
                              {["Needs Support", "Developing", "Good", "Very Good", "Excellent"].map((r) => (<option key={r} value={r}>{r}</option>))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-olive/60 block mb-0.5">Participation</label>
                            <select value={newObsParticipation} onChange={(e) => setNewObsParticipation(e.target.value)} className="w-full p-1.5 rounded-lg bg-white border border-beige/30 text-xs text-olive">
                              {["Needs Support", "Developing", "Good", "Very Good", "Excellent"].map((r) => (<option key={r} value={r}>{r}</option>))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <textarea
                            value={newObsText}
                            onChange={(e) => setNewObsText(e.target.value)}
                            placeholder="Write developmental observation (e.g. participated actively in group storytelling...)"
                            rows={2}
                            required
                            className="w-full p-2.5 rounded-xl bg-white border border-beige/30 text-xs text-olive placeholder:text-olive/40 outline-none focus:border-pistachio font-body"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={savingObs}
                          className="px-4 py-1.5 rounded-full bg-pistachio text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                        >
                          {savingObs ? "Saving..." : "Save Observation"}
                        </button>
                      </form>

                      {/* Observations list */}
                      <div className="space-y-2.5 max-h-56 overflow-y-auto">
                        {studentDetails.development.length === 0 ? (
                          <p className="text-xs text-olive/40 text-center py-4">No observations recorded for this student yet.</p>
                        ) : (
                          studentDetails.development.map((dev: any) => (
                            <div key={dev.id} className="p-3.5 rounded-2xl bg-cream/30 border border-beige/15 space-y-1.5 text-xs font-body">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-olive">{dev.date}</span>
                                <span className="text-[10px] text-olive/40">By {dev.teacher_name || "Teacher"}</span>
                              </div>
                              <p className="text-olive/80 italic">&quot;{dev.observation}&quot;</p>
                              <div className="flex flex-wrap gap-1 pt-1">
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">Comm: {dev.communication}</span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">Cognitive: {dev.cognitive_development}</span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700">Social: {dev.social_development}</span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">Motor: {dev.motor_skills}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 4: TEACHER NOTES */}
                  {activeTab === "notes" && (
                    <div className="space-y-4">
                      {/* Inline Add Note Form */}
                      <form onSubmit={handleAddNote} className="p-4 bg-cream/40 rounded-2xl border border-beige/25 space-y-2.5">
                        <h4 className="text-xs font-bold text-olive uppercase font-body flex items-center gap-1.5">
                          <Plus className="w-3.5 h-3.5 text-pistachio" /> Add Note for Student
                        </h4>
                        <div className="flex gap-2">
                          <select
                            value={newNoteCategory}
                            onChange={(e) => setNewNoteCategory(e.target.value)}
                            className="p-2 rounded-xl bg-white border border-beige/30 text-xs text-olive outline-none"
                          >
                            <option value="academic">Academic</option>
                            <option value="behavior">Behaviour</option>
                            <option value="health">Health</option>
                            <option value="achievement">Achievement</option>
                            <option value="general">General</option>
                          </select>
                          <input
                            type="text"
                            value={newNoteMessage}
                            onChange={(e) => setNewNoteMessage(e.target.value)}
                            placeholder="Write note or observation..."
                            required
                            className="flex-1 px-3 py-2 rounded-xl bg-white border border-beige/30 text-xs text-olive outline-none focus:border-pistachio font-body"
                          />
                          <button
                            type="submit"
                            disabled={savingNote}
                            className="px-4 py-2 rounded-xl bg-pistachio text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 shrink-0"
                          >
                            {savingNote ? "Saving..." : "Add Note"}
                          </button>
                        </div>
                      </form>

                      {/* Notes list */}
                      <div className="space-y-2.5 max-h-56 overflow-y-auto">
                        {studentDetails.notes.length === 0 ? (
                          <p className="text-xs text-olive/40 text-center py-4">No teacher notes recorded for this student.</p>
                        ) : (
                          studentDetails.notes.map((n: any) => (
                            <div key={n.id} className="p-3.5 rounded-2xl bg-cream/30 border border-beige/15 space-y-1 text-xs font-body">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold capitalize text-olive px-2 py-0.5 rounded-md bg-white border border-beige/30 text-[10px]">
                                  {n.category}
                                </span>
                                <span className="text-[10px] text-olive/40">{n.date}</span>
                              </div>
                              <p className="text-olive/80 pt-1">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
