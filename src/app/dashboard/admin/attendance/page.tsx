"use client"

import { useEffect, useState, useCallback, useRef, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { getAttendance, getStudents, bulkAddAttendance, deleteAttendance } from "@/lib/data-store"
import { getTeachers } from "@/app/actions/teacher-actions"
import type { AttendanceRecord, Student, Teacher, AttendanceStatus } from "@/lib/types"
import StatCard from "@/components/dashboard/StatCard"
import DataTable from "@/components/dashboard/DataTable"
import Modal from "@/components/dashboard/Modal"
import ImportReportModal from "@/components/dashboard/ImportReportModal"
import { parseCsvFile, validateAttendance, exportToCSV, exportToExcel } from "@/lib/importer-exporter"
import { 
  CalendarCheck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Upload, 
  Download, 
  FileSpreadsheet, 
  Plus, 
  Calendar, 
  Filter, 
  Trash2, 
  UserCheck, 
  ChevronLeft, 
  ChevronRight, 
  BarChart3, 
  Users, 
  Search,
  Eye,
  Award
} from "lucide-react"

function getTodayIST(): string {
  const now = new Date()
  const istOffset = 5.5 * 60 * 60 * 1000
  const istDate = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + istOffset)
  const y = istDate.getFullYear()
  const m = String(istDate.getMonth() + 1).padStart(2, "0")
  const d = String(istDate.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function formatDateDisplay(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split("-").map(Number)
    const date = new Date(y, m - 1, d)
    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

interface AttendanceRow extends Record<string, unknown> {
  id: string
  studentId: string
  studentName: string
  admissionNo: string
  program: string
  section: string
  teacher: string
  date: string
  status: AttendanceStatus
}

export default function AdminAttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  
  // Active Tab: "teachers" | "records" | "reports"
  const [activeTab, setActiveTab] = useState<"teachers" | "records" | "reports">("teachers")
  
  // Selected Date for Overview & Teacher view
  const [selectedDate, setSelectedDate] = useState<string>(getTodayIST())
  
  // Table filters
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [teacherFilter, setTeacherFilter] = useState<string>("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // Student Report Modal
  const [reportStudent, setReportStudent] = useState<Student | null>(null)
  const [reportSearch, setReportSearch] = useState("")

  // Mark attendance modal state
  const [markModalOpen, setMarkModalOpen] = useState(false)
  const [attendanceDate, setAttendanceDate] = useState("")
  const [studentStatuses, setStudentStatuses] = useState<Record<string, AttendanceStatus>>({})
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [savingMark, setSavingMark] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importReport, setImportReport] = useState<{
    open: boolean
    successCount: number
    failCount: number
    errors: { row: number; error: string }[]
  } | null>(null)
  const [errorBanner, setErrorBanner] = useState<string | null>(null)
  const [successBanner, setSuccessBanner] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [attendanceData, studentsData, teachersData] = await Promise.all([
        getAttendance(),
        getStudents(),
        getTeachers(),
      ])
      setAttendance(attendanceData)
      setStudents(studentsData)
      setTeachers(teachersData)
    } catch (err) {
      console.error("Refresh attendance error:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const handleDelete = async (id: string) => {
    setErrorBanner(null)
    try {
      await deleteAttendance(id)
      setDeleteConfirm(null)
      setSuccessBanner("Record deleted successfully.")
      refresh()
    } catch (err: any) {
      setErrorBanner(err?.message || "Failed to remove attendance record.")
      setDeleteConfirm(null)
    }
  }

  // Reset/initialize student statuses when opening Mark modal
  useEffect(() => {
    if (markModalOpen) {
      const targetDate = attendanceDate || selectedDate || getTodayIST()
      setAttendanceDate(targetDate)

      const existingForDate = attendance.filter((a) => a.date === targetDate)
      const existingMap = new Map(existingForDate.map((a) => [a.studentId, a.status]))

      const initial: Record<string, AttendanceStatus> = {}
      students.forEach((s) => {
        initial[s.id] = existingMap.get(s.id) || "present"
      })
      setStudentStatuses(initial)
    }
  }, [markModalOpen, attendanceDate, selectedDate, attendance, students])

  const handleSaveMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!attendanceDate || students.length === 0) return
    setSavingMark(true)
    setErrorBanner(null)

    const records = Object.entries(studentStatuses).map(([studentId, status]) => ({
      studentId,
      date: attendanceDate,
      status,
    }))

    try {
      await bulkAddAttendance(records)
      setSuccessBanner(`Attendance saved for ${formatDateDisplay(attendanceDate)} ✓`)
      setMarkModalOpen(false)
      await refresh()
    } catch (err: any) {
      setErrorBanner("Failed to save attendance: " + (err.message || err))
    } finally {
      setSavingMark(false)
    }
  }

  // Combine attendance with student details
  const rows: AttendanceRow[] = useMemo(() => {
    return attendance.map((a) => {
      const student = students.find((s) => s.id === a.studentId)
      return {
        id: a.id,
        studentId: a.studentId,
        studentName: student ? student.name : "Unknown Student",
        admissionNo: student ? student.admissionNo : "",
        program: student ? student.program : "N/A",
        section: student ? student.section : "A",
        teacher: student ? student.teacher : "Unassigned",
        date: a.date,
        status: a.status,
      }
    })
  }, [attendance, students])

  // Filter rows for Table View
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const matchesStatus = statusFilter === "all" || r.status === statusFilter
      const matchesTeacher = teacherFilter === "all" || r.teacher === teacherFilter
      const matchesStartDate = !startDate || r.date >= startDate
      const matchesEndDate = !endDate || r.date <= endDate
      return matchesStatus && matchesTeacher && matchesStartDate && matchesEndDate
    })
  }, [rows, statusFilter, teacherFilter, startDate, endDate])

  // Compute stats for SELECTED DATE
  const todayAttendance = useMemo(() => {
    return attendance.filter((a) => a.date === selectedDate)
  }, [attendance, selectedDate])

  const todayStudentCount = students.length
  const todayPresent = todayAttendance.filter((a) => a.status === "present").length
  const todayAbsent = todayAttendance.filter((a) => a.status === "absent").length
  const todayLeaves = todayAttendance.filter((a) => a.status === "leave").length
  
  // Rate calculation (Leave is NOT counted as Absent)
  // Attendance Rate = Present / (Present + Absent) * 100
  const activeWorkingDays = todayPresent + todayAbsent
  const todayRate = activeWorkingDays > 0 ? ((todayPresent / activeWorkingDays) * 100).toFixed(1) : "100.0"

  // Teacher-wise breakdown for SELECTED DATE
  const teacherBreakdown = useMemo(() => {
    // Group students by teacher
    const groups = new Map<string, {
      teacherName: string
      students: Student[]
      present: number
      absent: number
      leave: number
      unmarked: number
    }>()

    students.forEach((s) => {
      const tName = s.teacher || "Unassigned"
      if (!groups.has(tName)) {
        groups.set(tName, {
          teacherName: tName,
          students: [],
          present: 0,
          absent: 0,
          leave: 0,
          unmarked: 0,
        })
      }
      groups.get(tName)!.students.push(s)
    })

    // Populate attendance counts for selectedDate
    const dateAttMap = new Map(todayAttendance.map((a) => [a.studentId, a.status]))

    groups.forEach((group) => {
      group.students.forEach((st) => {
        const status = dateAttMap.get(st.id)
        if (status === "present") group.present++
        else if (status === "absent") group.absent++
        else if (status === "leave") group.leave++
        else group.unmarked++
      })
    })

    return Array.from(groups.values()).sort((a, b) => a.teacherName.localeCompare(b.teacherName))
  }, [students, todayAttendance])

  // Student Report Statistics Calculator (for student reports tab)
  const getStudentStats = (studentId: string, targetMonth?: number, targetYear?: number) => {
    let records = attendance.filter((a) => a.studentId === studentId)
    if (targetMonth !== undefined && targetYear !== undefined) {
      records = records.filter((a) => {
        const [y, m] = a.date.split("-").map(Number)
        return y === targetYear && m === (targetMonth + 1)
      })
    }

    const present = records.filter((r) => r.status === "present").length
    const absent = records.filter((r) => r.status === "absent").length
    const leave = records.filter((r) => r.status === "leave").length
    const total = records.length
    const working = present + absent
    const rate = working > 0 ? ((present / working) * 100).toFixed(1) : (total > 0 ? "100.0" : "N/A")

    return { present, absent, leave, total, rate, records }
  }

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      const parsedRows = await parseCsvFile(file)
      const validation = validateAttendance(parsedRows, students, attendance)

      if (validation.validRecords.length > 0) {
        await bulkAddAttendance(validation.validRecords)
        await refresh()
      }

      setImportReport({
        open: true,
        successCount: validation.successCount,
        failCount: validation.failCount,
        errors: validation.errors,
      })
    } catch (err: any) {
      console.error("Import error:", err)
      setErrorBanner("Failed to parse CSV file: " + (err.message || err))
    } finally {
      setLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleExportCSV = () => {
    exportToCSV(filteredRows, `attendance_export_${selectedDate}`)
  }

  const handleExportExcel = () => {
    exportToExcel(filteredRows, `attendance_export_${selectedDate}`)
  }

  const adjustDate = (days: number) => {
    const [y, m, d] = selectedDate.split("-").map(Number)
    const cur = new Date(y, m - 1, d)
    cur.setDate(cur.getDate() + days)
    const newY = cur.getFullYear()
    const newM = String(cur.getMonth() + 1).padStart(2, "0")
    const newD = String(cur.getDate()).padStart(2, "0")
    setSelectedDate(`${newY}-${newM}-${newD}`)
  }

  const columns = [
    {
      key: "studentName",
      label: "Student",
      sortable: true,
      render: (row: AttendanceRow) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-pistachio/15 flex items-center justify-center text-xs font-display font-bold text-olive">
            {row.studentName.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-olive">{row.studentName}</p>
            <p className="text-[11px] text-olive/40">{row.program} • Sec {row.section}</p>
          </div>
        </div>
      ),
    },
    { key: "teacher", label: "Teacher", sortable: true },
    { key: "date", label: "Date", sortable: true },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row: AttendanceRow) => {
        const colorMap = {
          present: "bg-emerald-100 text-emerald-800 border-emerald-200",
          absent: "bg-rose-100 text-rose-800 border-rose-200",
          leave: "bg-amber-100 text-amber-800 border-amber-200",
          holiday: "bg-sky-100 text-sky-800 border-sky-200",
        }
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${colorMap[row.status] || "bg-cream text-olive"}`}>
            {row.status}
          </span>
        )
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (row: AttendanceRow) => (
        <button
          onClick={() => setDeleteConfirm(row.id)}
          className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 transition-colors"
          title="Delete Record"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ]

  const distinctTeachers = useMemo(() => {
    return Array.from(new Set(students.map((s) => s.teacher).filter(Boolean))).sort()
  }, [students])

  const filteredStudentsForReports = useMemo(() => {
    return students.filter((s) => {
      const q = reportSearch.toLowerCase()
      return (
        s.name.toLowerCase().includes(q) ||
        (s.admissionNo && s.admissionNo.toLowerCase().includes(q)) ||
        (s.program && s.program.toLowerCase().includes(q)) ||
        (s.teacher && s.teacher.toLowerCase().includes(q))
      )
    })
  }, [students, reportSearch])

  return (
    <div className="space-y-6">
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-olive">Attendance Management</h1>
          <p className="text-xs sm:text-sm text-olive/50 font-body">
            Daily attendance overview, teacher-wise tracking, and monthly student reports
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportCSV}
            accept=".csv"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cream hover:bg-beige/40 text-olive text-xs font-medium border border-beige/20 transition-all shadow-soft"
          >
            <Upload className="w-3.5 h-3.5" /> Import CSV
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cream hover:bg-beige/40 text-olive text-xs font-medium border border-beige/20 transition-all shadow-soft"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cream hover:bg-beige/40 text-olive text-xs font-medium border border-beige/20 transition-all shadow-soft"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
          </button>

          <button
            onClick={() => setMarkModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-xs font-semibold shadow-soft hover:shadow-lift transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Mark / Edit Attendance
          </button>
        </div>
      </div>

      {/* ── BANNERS ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {successBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-body flex items-center justify-between shadow-soft"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successBanner}</span>
            </div>
            <button onClick={() => setSuccessBanner(null)} className="text-emerald-600 hover:text-emerald-800 font-bold text-base">×</button>
          </motion.div>
        )}

        {errorBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-body flex items-center justify-between shadow-soft"
          >
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorBanner}</span>
            </div>
            <button onClick={() => setErrorBanner(null)} className="text-rose-600 hover:text-rose-800 font-bold text-base">×</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DATE CONTROLLER & SUMMARY CARDS ─────────────────────────── */}
      <div className="bg-soft-white rounded-3xl p-5 sm:p-6 border border-beige/25 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-display font-bold text-olive">Attendance Summary</h2>
            <p className="text-xs text-olive/50 font-body">Overview for {formatDateDisplay(selectedDate)}</p>
          </div>

          <div className="flex items-center gap-2 bg-cream/70 p-1.5 rounded-2xl border border-beige/20 shrink-0">
            <button
              onClick={() => adjustDate(-1)}
              className="w-7 h-7 rounded-xl bg-white hover:bg-beige/20 text-olive flex items-center justify-center transition-colors shadow-xs"
              title="Previous Day"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-display font-semibold text-olive outline-none px-2 cursor-pointer"
            />
            <button
              onClick={() => adjustDate(1)}
              className="w-7 h-7 rounded-xl bg-white hover:bg-beige/20 text-olive flex items-center justify-center transition-colors shadow-xs"
              title="Next Day"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            {selectedDate !== getTodayIST() && (
              <button
                onClick={() => setSelectedDate(getTodayIST())}
                className="text-[11px] px-2 py-1 bg-pistachio/15 text-olive font-medium rounded-lg hover:bg-pistachio/25 transition-colors ml-1"
              >
                Today
              </button>
            )}
          </div>
        </div>

        {/* 5 Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard
            icon={Users}
            label="Total Students"
            value={todayStudentCount}
            color="bg-pistachio/10"
            index={0}
          />
          <StatCard
            icon={CheckCircle}
            label="Present"
            value={todayPresent}
            sub={`${todayStudentCount > 0 ? Math.round((todayPresent / todayStudentCount) * 100) : 0}% of class`}
            color="bg-emerald-50"
            index={1}
          />
          <StatCard
            icon={XCircle}
            label="Absent"
            value={todayAbsent}
            color="bg-rose-50"
            index={2}
          />
          <StatCard
            icon={Clock}
            label="On Leave"
            value={todayLeaves}
            color="bg-amber-50"
            index={3}
          />
          <StatCard
            icon={Award}
            label="Attendance Rate"
            value={`${todayRate}%`}
            sub="Leave excluded from absent"
            color="bg-sage/10"
            index={4}
          />
        </div>
      </div>

      {/* ── TABS NAVIGATION ─────────────────────────────────────────── */}
      <div className="flex gap-2 p-1 bg-cream/70 rounded-2xl border border-beige/20 w-fit">
        <button
          onClick={() => setActiveTab("teachers")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold font-body transition-all ${
            activeTab === "teachers"
              ? "bg-white text-olive shadow-sm border border-white/80"
              : "text-olive/60 hover:text-olive"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Teacher-Wise Overview
        </button>

        <button
          onClick={() => setActiveTab("records")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold font-body transition-all ${
            activeTab === "records"
              ? "bg-white text-olive shadow-sm border border-white/80"
              : "text-olive/60 hover:text-olive"
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          All Attendance Records
        </button>

        <button
          onClick={() => setActiveTab("reports")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold font-body transition-all ${
            activeTab === "reports"
              ? "bg-white text-olive shadow-sm border border-white/80"
              : "text-olive/60 hover:text-olive"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Student History & Reports
        </button>
      </div>

      {/* ── TAB 1: TEACHER-WISE OVERVIEW ─────────────────────────────── */}
      {activeTab === "teachers" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {teacherBreakdown.length === 0 ? (
            <div className="p-10 text-center bg-soft-white rounded-3xl border border-beige/25">
              <Users className="w-8 h-8 text-olive/30 mx-auto mb-2" />
              <p className="text-sm font-body text-olive/60">No teachers or classes found.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {teacherBreakdown.map((group, idx) => {
                const totalAssigned = group.students.length
                const recorded = group.present + group.absent + group.leave
                const isComplete = recorded === totalAssigned && totalAssigned > 0
                const working = group.present + group.absent
                const classRate = working > 0 ? ((group.present / working) * 100).toFixed(0) : "100"

                return (
                  <div
                    key={group.teacherName}
                    className="bg-soft-white rounded-3xl p-5 border border-beige/25 shadow-soft hover:shadow-lift transition-all space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pistachio/20 to-cream flex items-center justify-center text-olive font-display font-bold text-sm border border-beige/20 shadow-xs">
                          {group.teacherName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-base font-display font-bold text-olive">{group.teacherName}</h3>
                          <p className="text-xs text-olive/50 font-body">
                            {totalAssigned} Students Assigned
                          </p>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold font-body ${
                        isComplete ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {isComplete ? "Completed ✓" : "Pending"}
                      </span>
                    </div>

                    {/* Counts Bar */}
                    <div className="grid grid-cols-3 gap-2 bg-cream/50 p-3 rounded-2xl border border-beige/15 text-center">
                      <div>
                        <p className="text-[10px] text-emerald-800/70 font-body uppercase font-bold">Present</p>
                        <p className="text-lg font-display font-bold text-emerald-700">{group.present}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-rose-800/70 font-body uppercase font-bold">Absent</p>
                        <p className="text-lg font-display font-bold text-rose-700">{group.absent}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-amber-800/70 font-body uppercase font-bold">On Leave</p>
                        <p className="text-lg font-display font-bold text-amber-700">{group.leave}</p>
                      </div>
                    </div>

                    {/* Progress representation */}
                    <div>
                      <div className="flex justify-between text-xs font-body text-olive/60 mb-1">
                        <span>Attendance Rate</span>
                        <span className="font-semibold text-olive">{classRate}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-beige/20 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${classRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* ── TAB 2: ALL ATTENDANCE RECORDS ────────────────────────────── */}
      {activeTab === "records" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Filter Toolbar */}
          <div className="flex flex-wrap items-center gap-3 bg-soft-white p-4 rounded-2xl border border-beige/20 shadow-soft">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-olive/40" />
              <span className="text-xs font-medium text-olive">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-cream border border-beige/20 text-xs text-olive outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="leave">On Leave</option>
                <option value="holiday">Holiday</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-olive">Teacher:</span>
              <select
                value={teacherFilter}
                onChange={(e) => setTeacherFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-cream border border-beige/20 text-xs text-olive outline-none"
              >
                <option value="all">All Teachers</option>
                {distinctTeachers.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs font-medium text-olive">Range:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1 rounded-xl bg-cream border border-beige/20 text-xs text-olive"
                placeholder="From"
              />
              <span className="text-xs text-olive/40">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1 rounded-xl bg-cream border border-beige/20 text-xs text-olive"
                placeholder="To"
              />
              {(startDate || endDate || statusFilter !== "all" || teacherFilter !== "all") && (
                <button
                  onClick={() => {
                    setStatusFilter("all")
                    setTeacherFilter("all")
                    setStartDate("")
                    setEndDate("")
                  }}
                  className="text-xs text-rose-600 hover:underline font-medium ml-2"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          <div className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft">
            <DataTable
              columns={columns}
              data={filteredRows}
              searchPlaceholder="Search by student name, admission number, program, teacher..."
              searchKeys={["studentName", "admissionNo", "program", "teacher", "date"]}
              initialPageSize={15}
            />
          </div>
        </motion.div>
      )}

      {/* ── TAB 3: STUDENT HISTORY & REPORTS ─────────────────────────── */}
      {activeTab === "reports" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-olive/40 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={reportSearch}
              onChange={(e) => setReportSearch(e.target.value)}
              placeholder="Search student by name, admission number, program, or teacher..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-soft-white border border-beige/25 text-sm text-olive placeholder:text-olive/40 outline-none focus:border-pistachio focus:ring-2 focus:ring-pistachio/20 transition-all font-body shadow-soft"
            />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudentsForReports.map((s) => {
              const currentMonth = new Date().getMonth()
              const currentYear = new Date().getFullYear()
              const stats = getStudentStats(s.id, currentMonth, currentYear)
              const overall = getStudentStats(s.id)

              return (
                <div
                  key={s.id}
                  className="bg-soft-white rounded-3xl p-5 border border-beige/25 shadow-soft hover:shadow-lift transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pistachio/20 to-cream flex items-center justify-center font-display font-bold text-sm text-olive shrink-0 border border-beige/20 shadow-xs">
                        {s.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-base font-display font-bold text-olive truncate">{s.name}</h4>
                        <p className="text-xs text-olive/50 font-body">
                          {s.program} • {s.admissionNo || "ADM"} • {s.teacher || "No Teacher"}
                        </p>
                      </div>
                    </div>

                    <div className="bg-cream/50 rounded-2xl p-3 border border-beige/15 space-y-2 text-xs font-body mb-3">
                      <p className="font-semibold text-olive border-b border-beige/15 pb-1">
                        Current Month ({new Date().toLocaleString("en-IN", { month: "long" })})
                      </p>
                      <div className="grid grid-cols-3 gap-1 text-center">
                        <div>
                          <span className="text-emerald-700 font-bold text-sm block">{stats.present}</span>
                          <span className="text-[10px] text-olive/60">Present</span>
                        </div>
                        <div>
                          <span className="text-rose-700 font-bold text-sm block">{stats.absent}</span>
                          <span className="text-[10px] text-olive/60">Absent</span>
                        </div>
                        <div>
                          <span className="text-amber-700 font-bold text-sm block">{stats.leave}</span>
                          <span className="text-[10px] text-olive/60">On Leave</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-beige/15 text-[11px]">
                        <span className="text-olive/60">Monthly Rate:</span>
                        <span className="font-bold text-olive">{stats.rate}%</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setReportStudent(s)}
                    className="w-full py-2 px-3 rounded-xl bg-cream hover:bg-beige/30 text-olive text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Detailed History
                  </button>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* ── MARK / EDIT ATTENDANCE MODAL ─────────────────────────────── */}
      <Modal
        open={markModalOpen}
        onClose={() => setMarkModalOpen(false)}
        title="Mark / Edit Class Attendance"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveMarkAttendance} className="space-y-4">
          <div className="flex items-center gap-3 bg-cream/50 p-3 rounded-2xl border border-beige/20">
            <label className="text-xs font-medium text-olive font-body shrink-0">Date:</label>
            <input
              type="date"
              required
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white border border-beige/20 text-xs font-semibold text-olive outline-none"
            />
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const updated: Record<string, AttendanceStatus> = {}
                  students.forEach((s) => (updated[s.id] = "present"))
                  setStudentStatuses(updated)
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-semibold hover:bg-emerald-200 transition-colors"
              >
                Mark All Present
              </button>
            </div>
          </div>

          <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1">
            {students.map((student) => {
              const curStatus = studentStatuses[student.id] || "present"
              return (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-cream/40 border border-beige/15 text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-olive truncate">{student.name}</p>
                    <p className="text-[10px] text-olive/50">{student.program} • {student.teacher}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setStudentStatuses((prev) => ({ ...prev, [student.id]: "present" }))}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                        curStatus === "present" ? "bg-emerald-600 text-white shadow-xs" : "bg-white text-olive/70 border border-beige/20"
                      }`}
                    >
                      Present
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentStatuses((prev) => ({ ...prev, [student.id]: "absent" }))}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                        curStatus === "absent" ? "bg-rose-600 text-white shadow-xs" : "bg-white text-olive/70 border border-beige/20"
                      }`}
                    >
                      Absent
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentStatuses((prev) => ({ ...prev, [student.id]: "leave" }))}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                        curStatus === "leave" ? "bg-amber-500 text-white shadow-xs" : "bg-white text-olive/70 border border-beige/20"
                      }`}
                    >
                      Leave
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setMarkModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-cream text-olive/60 text-xs font-semibold hover:bg-beige/30 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingMark}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-xs font-semibold shadow-soft hover:shadow-lift transition-all disabled:opacity-50"
            >
              {savingMark ? "Saving..." : "Save Attendance"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── DETAILED STUDENT ATTENDANCE REPORT MODAL ────────────────── */}
      {reportStudent && (
        <Modal
          open={!!reportStudent}
          onClose={() => setReportStudent(null)}
          title={`${reportStudent.name}'s Attendance Report`}
          maxWidth="max-w-xl"
        >
          {(() => {
            const stats = getStudentStats(reportStudent.id)
            return (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-cream/50 border border-beige/20">
                  <div className="w-11 h-11 rounded-xl bg-pistachio/20 flex items-center justify-center font-display font-bold text-olive">
                    {reportStudent.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-base font-display font-bold text-olive">{reportStudent.name}</h4>
                    <p className="text-xs text-olive/50 font-body">
                      Admission No: {reportStudent.admissionNo || "ADM"} • Program: {reportStudent.program} • Teacher: {reportStudent.teacher}
                    </p>
                  </div>
                </div>

                {/* Stat summary */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-soft-white border border-beige/15">
                    <p className="text-[10px] text-olive/50 font-bold uppercase">Total Days</p>
                    <p className="text-lg font-display font-bold text-olive">{stats.total}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <p className="text-[10px] text-emerald-800 font-bold uppercase">Present</p>
                    <p className="text-lg font-display font-bold text-emerald-700">{stats.present}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                    <p className="text-[10px] text-rose-800 font-bold uppercase">Absent</p>
                    <p className="text-lg font-display font-bold text-rose-700">{stats.absent}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                    <p className="text-[10px] text-amber-800 font-bold uppercase">On Leave</p>
                    <p className="text-lg font-display font-bold text-amber-700">{stats.leave}</p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-pistachio/10 border border-pistachio/20 flex items-center justify-between text-xs font-body">
                  <span className="text-olive/70 font-medium">Overall Attendance Rate (Leave excluded):</span>
                  <span className="font-display font-bold text-base text-olive">{stats.rate}%</span>
                </div>

                {/* History list */}
                <div>
                  <h5 className="text-xs font-bold text-olive uppercase tracking-wider mb-2">Recent Attendance History</h5>
                  <div className="max-h-[220px] overflow-y-auto space-y-1.5 pr-1 text-xs">
                    {stats.records.length === 0 ? (
                      <p className="text-olive/40 py-4 text-center">No attendance records found for this student.</p>
                    ) : (
                      stats.records.slice().reverse().map((rec) => (
                        <div key={rec.id} className="flex justify-between items-center p-2 rounded-xl bg-cream/40 border border-beige/15">
                          <span className="font-medium text-olive">{formatDateDisplay(rec.date)}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                            rec.status === "present"
                              ? "bg-emerald-100 text-emerald-800"
                              : rec.status === "absent"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {rec.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setReportStudent(null)}
                  className="w-full py-2.5 rounded-xl bg-cream text-olive/70 text-xs font-semibold hover:bg-beige/30 transition-colors"
                >
                  Close Report
                </button>
              </div>
            )
          })()}
        </Modal>
      )}

      {/* ── DELETE CONFIRMATION MODAL ───────────────────────────────── */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Attendance Record"
        maxWidth="max-w-sm"
      >
        <p className="text-xs text-olive/60 mb-4 font-body">
          Are you sure you want to remove this attendance record? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setDeleteConfirm(null)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-cream text-olive/60 text-xs font-semibold hover:bg-beige/30 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors"
          >
            Delete Record
          </button>
        </div>
      </Modal>

      {/* ── CSV IMPORT REPORT MODAL ─────────────────────────────────── */}
      {importReport && (
        <ImportReportModal
          open={importReport.open}
          onClose={() => setImportReport(null)}
          totalRows={importReport.successCount + importReport.failCount}
          successCount={importReport.successCount}
          failCount={importReport.failCount}
          errors={importReport.errors}
          title="Attendance Import Report"
        />
      )}
    </div>
  )
}
