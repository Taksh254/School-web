"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import { getStudents, addStudent, updateStudent, deleteStudent, bulkAddStudents, linkParentToStudent } from "@/lib/data-store"
import type { Student, ProgramType } from "@/lib/types"
import StatCard from "@/components/dashboard/StatCard"
import DataTable from "@/components/dashboard/DataTable"
import Modal from "@/components/dashboard/Modal"
import ImportReportModal from "@/components/dashboard/ImportReportModal"
import { parseExcelFile, generatePreview, previewToStudentData } from "@/lib/excel-import"
import type { ImportedRow } from "@/lib/excel-import"
import { exportStudentsCSV, exportStudentsExcel } from "@/lib/excel-export"
import { Users, Plus, Pencil, Trash2, GraduationCap, Upload, Download, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle, ArrowLeft, Link2 } from "lucide-react"

const PROGRAMS: ProgramType[] = ["Play group", "Nursery", "LKG", "UKG"]

function calculateAge(dob: string): number {
  if (!dob) return 0
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return Math.max(0, age)
}

const emptyForm = {
  name: "", age: 3, dateOfBirth: "", program: "Nursery" as ProgramType, section: "A",
  parentName: "", parentEmail: "", parentPhone: "", admissionNo: "", teacher: "",
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Student | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [errorBanner, setErrorBanner] = useState<string | null>(null)

  // Linking parent state
  const [linkParentStudent, setLinkParentStudent] = useState<Student | null>(null)
  const [linkingEmail, setLinkingEmail] = useState("")
  const [linkLoading, setLinkLoading] = useState(false)
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null)
  const [linkError, setLinkError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importReport, setImportReport] = useState<{
    open: boolean
    totalRows: number
    successCount: number
    duplicatesSkipped: number
    failCount: number
    errors: { row: number; error: string }[]
  } | null>(null)

  const [preview, setPreview] = useState<{
    rows: ImportedRow[]
    totalRows: number
    validCount: number
    invalidCount: number
  } | null>(null)
  const [previewFile, setPreviewFile] = useState<File | null>(null)

  useEffect(() => {
    if (linkParentStudent) {
      setLinkingEmail(linkParentStudent.parentEmail || "")
      setLinkSuccess(null)
      setLinkError(null)
    }
  }, [linkParentStudent])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setErrorBanner(null)
    try {
      const parsedRows = await parseExcelFile(file)
      const existingAdmissionNos = students.map((s) => String(s.admissionNo || "").trim().toLowerCase()).filter(Boolean)
      const result = generatePreview(parsedRows, existingAdmissionNos)
      setPreview(result)
      setPreviewFile(file)
    } catch (err: any) {
      console.error("Parse error:", err)
      setErrorBanner("Failed to parse file: " + (err.message || err))
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleConfirmImport = async () => {
    if (!preview || !previewFile) return

    setImporting(true)
    setErrorBanner(null)
    const validRows = preview.rows.filter((r) => r.valid)
    const duplicateRows = preview.rows.filter((r) => !r.valid && r.errors.some((e) => e.startsWith("Duplicate")))
    const invalidRows = preview.rows.filter((r) => !r.valid && !r.errors.some((e) => e.startsWith("Duplicate")))

    try {
      if (validRows.length > 0) {
        const data = previewToStudentData(validRows)
        await bulkAddStudents(data)
        await refresh()
      }

      setImportReport({
        open: true,
        totalRows: preview.totalRows,
        successCount: validRows.length,
        duplicatesSkipped: duplicateRows.length,
        failCount: invalidRows.length,
        errors: preview.rows.filter((r) => !r.valid).map((r) => ({
          row: r.rowNumber,
          error: r.errors.join("; "),
        })),
      })
      setPreview(null)
      setPreviewFile(null)
    } catch (err: any) {
      console.error("Import error:", err)
      setErrorBanner("Failed to import students: " + (err.message || err))
    } finally {
      setImporting(false)
    }
  }

  const handleExportCSV = () => {
    exportStudentsCSV(filtered, "students_export")
  }

  const handleExportExcel = () => {
    exportStudentsExcel(filtered, "students_export")
  }

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
      admissionNo: student.admissionNo,
      teacher: student.teacher,
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorBanner(null)
    try {
      if (editing) {
        await updateStudent(editing.id, form)
      } else {
        await addStudent(form)
      }
      setModalOpen(false)
      refresh()
    } catch (err: any) {
      setErrorBanner(err?.message || "Failed to save student profile.")
    }
  }

  const handleDelete = async (id: string) => {
    setErrorBanner(null)
    try {
      await deleteStudent(id)
      setDeleteConfirm(null)
      refresh()
    } catch (err: any) {
      setErrorBanner(err?.message || "Failed to remove student.")
      setDeleteConfirm(null)
    }
  }

  const handleLinkParent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!linkParentStudent) return
    setLinkLoading(true)
    setLinkSuccess(null)
    setLinkError(null)
    try {
      const ok = await linkParentToStudent(linkParentStudent.id, linkingEmail)
      if (ok) {
        setLinkSuccess("Parent account linked successfully!")
        // Update local student info if parent email changed
        if (linkingEmail.trim().toLowerCase() !== (linkParentStudent.parentEmail || "").trim().toLowerCase()) {
          await updateStudent(linkParentStudent.id, { parentEmail: linkingEmail })
          refresh()
        }
        setTimeout(() => setLinkParentStudent(null), 1500)
      } else {
        setLinkError("Could not link parent account. Please verify that a profile with this email exists.")
      }
    } catch (err: any) {
      setLinkError(err?.message || "Failed to link parent account")
    } finally {
      setLinkLoading(false)
    }
  }

  if (loading && students.length === 0 && !preview) {
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
    { key: "parentName", label: "Parent", sortable: true },
    { key: "teacher", label: "Teacher" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-display font-bold text-olive">Student Management</h1>
          <p className="text-sm text-olive/50 font-body">Add, edit, and manage students</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cream hover:bg-beige/40 text-olive text-xs font-medium border border-beige/20 transition-all shadow-soft font-body disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" /> Import Students
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
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium shadow-soft hover:shadow-lift hover:-translate-y-0.5 transition-all duration-300"
          >
            <Plus className="w-4 h-4" /> Add Student
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
                <button onClick={() => openEdit(student)} className="p-1.5 rounded-lg hover:bg-cream text-olive/40 hover:text-olive transition-colors" title="Edit Student" aria-label="Edit">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setLinkParentStudent(student)} className="p-1.5 rounded-lg hover:bg-cream text-olive/40 hover:text-olive transition-colors" title="Link Parent Account" aria-label="Link Parent">
                  <Link2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setDeleteConfirm(student.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-olive/40 hover:text-red-500 transition-colors" title="Delete Student" aria-label="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          }}
        />
      </motion.div>

      {/* Preview Modal */}
      <Modal open={!!preview} onClose={() => { if (!importing) { setPreview(null); setPreviewFile(null) } }}
        title="Preview Import" maxWidth="max-w-4xl">
        {preview && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-olive/60 font-body">
                {preview.totalRows} row(s) found — {preview.validCount} valid, {preview.invalidCount} invalid
              </p>
              <div className="flex gap-2 text-xs font-body">
                <span className="flex items-center gap-1 text-pistachio"><CheckCircle className="w-3.5 h-3.5" /> Valid</span>
                <span className="flex items-center gap-1 text-red-500"><XCircle className="w-3.5 h-3.5" /> Invalid</span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-beige/25">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-cream/60 text-left text-xs font-bold text-olive/50 uppercase tracking-wider">
                    <th className="px-4 py-3 font-body">#</th>
                    <th className="px-4 py-3 font-body">Student Name</th>
                    <th className="px-4 py-3 font-body">Parent Name</th>
                    <th className="px-4 py-3 font-body">Admission No.</th>
                    <th className="px-4 py-3 font-body">Class</th>
                    <th className="px-4 py-3 font-body">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-beige/10">
                  {preview.rows.map((row) => (
                    <tr key={row.rowNumber} className={`${row.valid ? "" : "bg-red-50/40"} transition-colors`}>
                      <td className="px-4 py-2.5 text-olive/40 font-body text-xs">{row.rowNumber}</td>
                      <td className="px-4 py-2.5 font-medium text-olive font-body">{row.studentName || "—"}</td>
                      <td className="px-4 py-2.5 text-olive/70 font-body">{row.parentName || "—"}</td>
                      <td className="px-4 py-2.5 text-olive/70 font-body">{row.admissionNo || "—"}</td>
                      <td className="px-4 py-2.5 text-olive/70 font-body">{row.className || "—"}</td>
                      <td className="px-4 py-2.5">
                        {row.valid ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-pistachio">
                            <CheckCircle className="w-3.5 h-3.5" /> Valid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500" title={row.errors.join("; ")}>
                            <XCircle className="w-3.5 h-3.5" /> Invalid
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {preview.invalidCount > 0 && (
              <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200/40 space-y-2">
                <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider font-body flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Validation Errors
                </h4>
                {preview.rows.filter((r) => !r.valid).map((r) => (
                  <p key={r.rowNumber} className="text-xs text-amber-800 font-body">
                    <span className="font-bold">Row {r.rowNumber}:</span> {r.errors.join("; ")}
                  </p>
                ))}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setPreview(null); setPreviewFile(null) }}
                disabled={importing}
                className="flex items-center justify-center gap-1.5 flex-1 px-4 py-2.5 rounded-xl bg-cream text-olive/60 text-sm font-medium hover:bg-beige/30 transition-colors font-body disabled:opacity-50"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={importing || preview.validCount === 0}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium shadow-soft hover:shadow-lift transition-all font-body disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {importing ? (
                  <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Importing...</>
                ) : (
                  <><Upload className="w-4 h-4" /> Import {preview.validCount} Student{preview.validCount !== 1 ? "s" : ""}</>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Student" : "Add New Student"} maxWidth="max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="student-name-input" className="block text-xs font-medium text-olive mb-1 font-body">Student Name *</label>
              <input id="student-name-input" type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all font-body" />
            </div>
            <div>
              <label htmlFor="student-dob-input" className="block text-xs font-medium text-olive mb-1 font-body">Date of Birth *</label>
              <input id="student-dob-input" type="date" required value={form.dateOfBirth} onChange={(e) => {
                const dob = e.target.value
                setForm({ ...form, dateOfBirth: dob, age: calculateAge(dob) })
              }}
                className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all font-body" />
            </div>
            <div>
              <label htmlFor="student-age-input" className="block text-xs font-medium text-olive mb-1 font-body">Age</label>
              <input id="student-age-input" type="number" disabled value={form.age}
                className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive/50 outline-none font-body cursor-not-allowed" />
            </div>
            <div>
              <label htmlFor="student-program-select" className="block text-xs font-medium text-olive mb-1 font-body">Program *</label>
              <select id="student-program-select" value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value as ProgramType })}
                className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all font-body">
                {PROGRAMS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="student-section-select" className="block text-xs font-medium text-olive mb-1 font-body">Section *</label>
              <select id="student-section-select" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all font-body">
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </div>
            <div>
              <label htmlFor="student-teacher-input" className="block text-xs font-medium text-olive mb-1 font-body">Teacher</label>
              <input id="student-teacher-input" type="text" value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all font-body" />
            </div>
          </div>

          <div className="border-t border-beige/15 pt-4 mt-2">
            <h4 className="text-xs font-medium text-olive/60 mb-3 font-body uppercase tracking-wider">Parent Information</h4>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="parent-name-input" className="block text-xs font-medium text-olive mb-1 font-body">Parent Name *</label>
                <input id="parent-name-input" type="text" required value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all font-body" />
              </div>
              <div>
                <label htmlFor="parent-email-input" className="block text-xs font-medium text-olive mb-1 font-body">Parent Email</label>
                <input id="parent-email-input" type="email" value={form.parentEmail} onChange={(e) => setForm({ ...form, parentEmail: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all font-body" />
              </div>
              <div>
                <label htmlFor="parent-phone-input" className="block text-xs font-medium text-olive mb-1 font-body">Parent Phone</label>
                <input id="parent-phone-input" type="tel" value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all font-body" />
              </div>
              <div>
                <label htmlFor="student-admission-input" className="block text-xs font-medium text-olive mb-1 font-body">Admission No.</label>
                <input id="student-admission-input" type="text" value={form.admissionNo} onChange={(e) => setForm({ ...form, admissionNo: e.target.value })}
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

      {/* Link Parent Modal */}
      <Modal open={!!linkParentStudent} onClose={() => setLinkParentStudent(null)} title="Link Parent Account" maxWidth="max-w-md">
        <form onSubmit={handleLinkParent} className="space-y-4">
          <p className="text-sm text-olive/60 font-body">
            Link a parent&apos;s registration/auth email to <span className="font-semibold text-olive">{linkParentStudent?.name}</span> to grant them access to this student&apos;s records.
          </p>

          <div>
            <label className="block text-xs font-medium text-olive mb-1 font-body">Parent Email Address *</label>
            <input
              type="email"
              required
              value={linkingEmail}
              onChange={(e) => setLinkingEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all font-body"
              placeholder="parent@school.com"
            />
          </div>

          {linkSuccess && (
            <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-xs text-green-700 font-body text-center">
              {linkSuccess}
            </div>
          )}

          {linkError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-body text-center">
              {linkError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setLinkParentStudent(null)}
              disabled={linkLoading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-cream text-olive/60 text-sm font-medium hover:bg-beige/30 transition-colors font-body disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={linkLoading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium shadow-soft hover:shadow-lift transition-all font-body disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {linkLoading ? "Linking..." : "Link Profile"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Import Report Modal */}
      {importReport && (
        <ImportReportModal
          open={importReport.open}
          onClose={() => setImportReport(null)}
          title="Students Import Report"
          totalRows={importReport.totalRows}
          successCount={importReport.successCount}
          duplicatesSkipped={importReport.duplicatesSkipped}
          failCount={importReport.failCount}
          errors={importReport.errors}
        />
      )}
    </div>
  )
}
