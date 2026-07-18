"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import { getAttendance, getStudents, bulkAddAttendance, deleteAttendance } from "@/lib/data-store"
import type { AttendanceRecord, Student, AttendanceStatus } from "@/lib/types"
import StatCard from "@/components/dashboard/StatCard"
import DataTable from "@/components/dashboard/DataTable"
import Modal from "@/components/dashboard/Modal"
import ImportReportModal from "@/components/dashboard/ImportReportModal"
import { parseCsvFile, validateAttendance, exportToCSV, exportToExcel } from "@/lib/importer-exporter"
import { CalendarCheck, CheckCircle, XCircle, Clock, Upload, Download, FileSpreadsheet, Plus, Calendar, Filter, Trash2 } from "lucide-react"

interface AttendanceRow {
  id: string
  studentId: string
  studentName: string
  program: string
  date: string
  status: AttendanceStatus
}

export default function AdminAttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // Mark attendance modal state
  const [markModalOpen, setMarkModalOpen] = useState(false)
  const [attendanceDate, setAttendanceDate] = useState("")
  const [studentStatuses, setStudentStatuses] = useState<Record<string, AttendanceStatus>>({})
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [duplicateWarning, setDuplicateWarning] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importReport, setImportReport] = useState<{
    open: boolean
    successCount: number
    failCount: number
    errors: { row: number; error: string }[]
  } | null>(null)
  const [errorBanner, setErrorBanner] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [attendanceData, studentsData] = await Promise.all([
        getAttendance(),
        getStudents(),
      ])
      setAttendance(attendanceData)
      setStudents(studentsData)
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
      refresh()
    } catch (err: any) {
      setErrorBanner(err?.message || "Failed to remove attendance record.")
      setDeleteConfirm(null)
    }
  }

  // Reset/initialize student statuses when opening Mark modal
  useEffect(() => {
    if (markModalOpen) {
      const initial: Record<string, AttendanceStatus> = {}
      students.forEach((s) => {
        initial[s.id] = "present"
      })
      setStudentStatuses(initial)
      setAttendanceDate(new Date().toISOString().slice(0, 10))
    }
  }, [markModalOpen, students])

  // Combine attendance with student names and programs
  const rows: AttendanceRow[] = attendance.map((a) => {
    const student = students.find((s) => s.id === a.studentId)
    return {
      id: a.id,
      studentId: a.studentId,
      studentName: student ? student.name : "Unknown Student",
      program: student ? student.program : "N/A",
      date: a.date,
      status: a.status,
    }
  })

  // Filter rows by status and date range
  const filteredRows = rows.filter((r) => {
    const matchesStatus = statusFilter === "all" || r.status === statusFilter
    const matchesStartDate = !startDate || r.date >= startDate
    const matchesEndDate = !endDate || r.date <= endDate
    return matchesStatus && matchesStartDate && matchesEndDate
  })

  // Compute stats
  const total = attendance.length
  const present = attendance.filter((a) => a.status === "present").length
  const absent = attendance.filter((a) => a.status === "absent").length
  const leaves = attendance.filter((a) => a.status === "leave").length

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
    const exportData = filteredRows.map((r) => ({
      "Student": r.studentName,
      "Date": r.date,
      "Status": r.status,
    }))
    exportToCSV(exportData, "attendance_export")
  }

  const handleExportExcel = () => {
    const exportData = filteredRows.map((r) => ({
      "Student": r.studentName,
      "Date": r.date,
      "Status": r.status,
    }))
    exportToExcel(exportData, "attendance_export")
  }

  const handleMarkSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setErrorBanner(null)

    // F-02: Duplicate date check
    if (!duplicateWarning && attendance.some((a) => a.date === attendanceDate)) {
      setDuplicateWarning(true)
      return
    }

    const records = Object.entries(studentStatuses).map(([studentId, status]) => ({
      studentId,
      date: attendanceDate,
      status,
    }))
    try {
      await bulkAddAttendance(records)
      setMarkModalOpen(false)
      setDuplicateWarning(false)
      refresh()
    } catch (err: any) {
      setErrorBanner("Failed to save attendance: " + (err.message || err))
    }
  }

  if (loading && attendance.length === 0) {
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
      render: (row: AttendanceRow) => (
        <div>
          <p className="font-medium text-olive">{row.studentName}</p>
          <p className="text-[10px] text-olive/40">{row.program}</p>
        </div>
      ),
    },
    { key: "date", label: "Date", sortable: true },
    {
      key: "status",
      label: "Status",
      render: (row: AttendanceRow) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize font-body inline-flex items-center gap-1.5 ${
          row.status === "present" ? "bg-pistachio/15 text-olive" :
          row.status === "absent" ? "bg-red-50 text-red-500" :
          row.status === "leave" ? "bg-amber-50 text-amber-600" :
          "bg-beige/30 text-olive/40"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            row.status === "present" ? "bg-pistachio" :
            row.status === "absent" ? "bg-red-400" :
            row.status === "leave" ? "bg-amber-400" :
            "bg-olive/20"
          }`} />
          {row.status}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row: AttendanceRow) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDeleteConfirm(row.id)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-olive/40 hover:text-red-500 transition-colors"
            title="Delete Record"
            aria-label="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-display font-bold text-olive">Attendance Management</h1>
          <p className="text-sm text-olive/50 font-body">View, track, and import/export attendance records</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportCSV}
            accept=".csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cream hover:bg-beige/40 text-olive text-xs font-medium border border-beige/20 transition-all shadow-soft font-body"
          >
            <Upload className="w-3.5 h-3.5" /> Import CSV
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cream hover:bg-beige/40 text-olive text-xs font-medium border border-beige/20 transition-all shadow-soft font-body"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cream hover:bg-beige/40 text-olive text-xs font-medium border border-beige/20 transition-all shadow-soft font-body"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
          </button>
          <button
            onClick={() => setMarkModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium shadow-soft hover:shadow-lift hover:-translate-y-0.5 transition-all duration-300"
          >
            <Plus className="w-4 h-4" /> Mark Attendance
          </button>
        </div>
      </div>

      {/* Error banner */}
      {errorBanner && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-700 flex justify-between items-center font-body">
          <span>{errorBanner}</span>
          <button onClick={() => setErrorBanner(null)} className="text-red-500 hover:text-red-700 font-bold ml-2">×</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CalendarCheck} label="Total Records" value={total} color="bg-pistachio/10" index={0} />
        <StatCard icon={CheckCircle} label="Days Present" value={present} color="bg-sage/10" index={1} />
        <StatCard icon={XCircle} label="Days Absent" value={absent} color="bg-red-50/50" index={2} />
        <StatCard icon={Clock} label="Leaves" value={leaves} color="bg-cream" index={3} />
      </div>

      {/* Date Range & Status Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-soft-white p-4 rounded-3xl border border-beige/20 shadow-soft">
        <div className="flex gap-2 flex-wrap">
          {[
            { key: "all", label: "All Statuses" },
            { key: "present", label: "Present" },
            { key: "absent", label: "Absent" },
            { key: "leave", label: "Leave" },
            { key: "holiday", label: "Holiday" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all font-body ${
                statusFilter === f.key
                  ? "bg-pistachio/15 text-olive shadow-[inset_0_0_0_1px_rgba(183,201,168,0.3)]"
                  : "bg-cream text-olive/50 hover:text-olive"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-olive/60 font-body">
          <Calendar className="w-3.5 h-3.5 text-olive/40" />
          <span>Date range:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-cream border border-beige/15 text-olive outline-none focus:border-pistachio transition-all"
          />
          <span>to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-cream border border-beige/15 text-olive outline-none focus:border-pistachio transition-all"
          />
          {(startDate || endDate) && (
            <button
              onClick={() => { setStartDate(""); setEndDate("") }}
              className="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors font-medium"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table container */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft"
      >
        <DataTable
          columns={columns as { key: string; label: string; sortable?: boolean; render?: (row: Record<string, unknown>) => React.ReactNode }[]}
          data={filteredRows as unknown as Record<string, unknown>[]}
          searchKeys={["studentName", "date", "status"]}
          searchPlaceholder="Search by student, date, or status..."
          emptyTitle="No attendance records found"
          emptyDescription="Import a CSV file or mark attendance manually"
        />
      </motion.div>

      {/* Mark Attendance Modal */}
      <Modal open={markModalOpen} onClose={() => setMarkModalOpen(false)} title="Mark Attendance" maxWidth="max-w-2xl">
        <form onSubmit={handleMarkSubmit} className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-beige/15">
            <div>
              <label className="block text-xs font-medium text-olive mb-1 font-body">Attendance Date *</label>
              <input
                type="date"
                required
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio transition-all font-body"
              />
            </div>
            <div className="text-right">
              <span className="text-xs text-olive/40 font-body">Total students: {students.length}</span>
            </div>
          </div>

          <div className="max-h-[350px] overflow-y-auto divide-y divide-beige/10 pr-1">
            {students.length === 0 ? (
              <p className="text-sm text-olive/40 font-body py-8 text-center">No students added to the system yet.</p>
            ) : (
              students.map((student) => (
                <div key={student.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-olive">{student.name}</p>
                    <p className="text-xs text-olive/40 font-body">{student.program} · Section {student.section}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {(["present", "absent", "leave"] as AttendanceStatus[]).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setStudentStatuses(prev => ({ ...prev, [student.id]: status }))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium font-body transition-all border capitalize ${
                          studentStatuses[student.id] === status
                            ? status === "present" ? "bg-pistachio/20 border-pistachio text-olive" :
                              status === "absent" ? "bg-red-50 border-red-200 text-red-600" :
                              "bg-amber-50 border-amber-200 text-amber-600"
                            : "bg-cream border-transparent text-olive/40 hover:text-olive hover:bg-beige/10"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-3 pt-3 border-t border-beige/15">
            <button
              type="button"
              onClick={() => setMarkModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-cream text-olive/60 text-sm font-medium hover:bg-beige/30 transition-colors font-body"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={students.length === 0}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium shadow-soft hover:shadow-lift transition-all font-body disabled:opacity-50"
            >
              Save Attendance
            </button>
          </div>
        </form>
      </Modal>

      {/* Import Report Modal */}
      {importReport && (
        <ImportReportModal
          open={importReport.open}
          onClose={() => setImportReport(null)}
          title="Attendance Import Report"
          successCount={importReport.successCount}
          failCount={importReport.failCount}
          errors={importReport.errors}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Attendance Record" maxWidth="max-w-sm">
        <p className="text-sm text-olive/60 mb-4 font-body">
          Are you sure you want to delete this attendance record? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteConfirm(null)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-cream text-olive/60 text-sm font-medium hover:bg-beige/30 transition-colors font-body">
            Cancel
          </button>
          <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors font-body">
            Delete
          </button>
        </div>
      </Modal>

      {/* Duplicate Warning Modal */}
      <Modal open={duplicateWarning} onClose={() => setDuplicateWarning(false)} title="Duplicate Records" maxWidth="max-w-sm">
        <p className="text-sm text-olive/60 mb-4 font-body">
          Attendance for {attendanceDate} has already been recorded. Submitting will add duplicate records. Continue anyway?
        </p>
        <div className="flex gap-3">
          <button onClick={() => setDuplicateWarning(false)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-cream text-olive/60 text-sm font-medium hover:bg-beige/30 transition-colors font-body">
            Cancel
          </button>
          <button onClick={() => handleMarkSubmit()}
            className="flex-1 px-4 py-2.5 rounded-xl bg-pistachio text-white text-sm font-medium hover:bg-pistachio/90 transition-colors font-body">
            Continue
          </button>
        </div>
      </Modal>
    </div>
  )
}
