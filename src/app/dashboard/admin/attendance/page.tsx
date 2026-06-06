"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import { getAttendance, getStudents, bulkAddAttendance } from "@/lib/data-store"
import type { AttendanceRecord, Student, AttendanceStatus } from "@/lib/types"
import StatCard from "@/components/dashboard/StatCard"
import DataTable from "@/components/dashboard/DataTable"
import ImportReportModal from "@/components/dashboard/ImportReportModal"
import { parseCsvFile, validateAttendance, exportToCSV, exportToExcel } from "@/lib/importer-exporter"
import { CalendarCheck, CheckCircle, XCircle, Clock, Upload, Download, FileSpreadsheet } from "lucide-react"

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

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importReport, setImportReport] = useState<{
    open: boolean
    successCount: number
    failCount: number
    errors: { row: number; error: string }[]
  } | null>(null)

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

  // Filter rows
  const filteredRows = statusFilter === "all"
    ? rows
    : rows.filter((r) => r.status === statusFilter)

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
      alert("Failed to parse CSV file: " + (err.message || err))
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
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CalendarCheck} label="Total Records" value={total} color="bg-pistachio/10" index={0} />
        <StatCard icon={CheckCircle} label="Days Present" value={present} color="bg-sage/10" index={1} />
        <StatCard icon={XCircle} label="Days Absent" value={absent} color="bg-red-50/50" index={2} />
        <StatCard icon={Clock} label="Leaves" value={leaves} color="bg-cream" index={3} />
      </div>

      {/* Filter Buttons */}
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
          emptyDescription="Import a CSV file to add records"
        />
      </motion.div>

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
    </div>
  )
}
