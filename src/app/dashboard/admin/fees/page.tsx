"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import { getFees, getStudents, addFee, markFeePaid, deleteFee, updateFee, bulkAddFees } from "@/lib/data-store"
import type { FeeRecord, Student } from "@/lib/types"
import StatCard from "@/components/dashboard/StatCard"
import DataTable from "@/components/dashboard/DataTable"
import Modal from "@/components/dashboard/Modal"
import ImportReportModal from "@/components/dashboard/ImportReportModal"
import { parseCsvFile, validateFees, exportToCSV, exportToExcel } from "@/lib/importer-exporter"
import { CreditCard, Plus, CheckCircle, Clock, Trash2, TrendingUp, Upload, Download, FileSpreadsheet, Pencil } from "lucide-react"

export default function AdminFeesPage() {
  const [fees, setFees] = useState<FeeRecord[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [editingFee, setEditingFee] = useState<FeeRecord | null>(null)
  const [editForm, setEditForm] = useState({ term: "", amount: 0, dueDate: "" })
  const [form, setForm] = useState({ studentId: "", term: "", amount: 0, dueDate: "" })
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [errorBanner, setErrorBanner] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importReport, setImportReport] = useState<{
    open: boolean
    successCount: number
    failCount: number
    errors: { row: number; error: string }[]
  } | null>(null)

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setErrorBanner(null)
    try {
      const parsedRows = await parseCsvFile(file)
      const validation = validateFees(parsedRows, students, fees)

      if (validation.validRecords.length > 0) {
        await bulkAddFees(validation.validRecords)
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
    const exportData = fees.map((f) => ({
      "Student": f.studentName,
      "Month": f.term,
      "Amount": f.amount,
      "Status": f.status,
    }))
    exportToCSV(exportData, "fees_export")
  }

  const handleExportExcel = () => {
    const exportData = fees.map((f) => ({
      "Student": f.studentName,
      "Month": f.term,
      "Amount": f.amount,
      "Status": f.status,
    }))
    exportToExcel(exportData, "fees_export")
  }


  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [feesData, studentsData] = await Promise.all([
        getFees(),
        getStudents(),
      ])
      setFees(feesData)
      setStudents(studentsData)
    } catch (err) {
      console.error("Refresh fees error:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const totalAmount = fees.reduce((s, f) => s + f.amount, 0)
  const totalPaid = fees.reduce((s, f) => s + f.paidAmount, 0)
  const totalPending = totalAmount - totalPaid
  const collectionRate = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0

  const handleAddFee = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorBanner(null)
    const student = students.find((s) => s.id === form.studentId)
    if (!student) return
    try {
      await addFee({
        studentId: form.studentId,
        studentName: student.name,
        term: form.term,
        amount: form.amount,
        paidAmount: 0,
        dueDate: form.dueDate,
        status: "pending",
      })
      setModalOpen(false)
      setForm({ studentId: "", term: "", amount: 0, dueDate: "" })
      refresh()
    } catch (err: any) {
      setErrorBanner(err?.message || "Failed to create fee record.")
    }
  }

  const handleMarkPaid = async (feeId: string) => {
    setErrorBanner(null)
    try {
      await markFeePaid(feeId, "Cash")
      refresh()
    } catch (err: any) {
      setErrorBanner(err?.message || "Failed to update payment status.")
    }
  }

  const openEditFee = (fee: FeeRecord) => {
    setEditingFee(fee)
    setEditForm({ term: fee.term, amount: fee.amount, dueDate: fee.dueDate })
    setEditModal(true)
  }

  const handleEditFee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingFee) return
    setErrorBanner(null)
    try {
      await updateFee(editingFee.id, {
        term: editForm.term,
        amount: editForm.amount,
        dueDate: editForm.dueDate,
      })
      setEditModal(false)
      setEditingFee(null)
      refresh()
    } catch (err: any) {
      setErrorBanner(err?.message || "Failed to update fee record.")
    }
  }

  const handleDelete = async (feeId: string) => {
    setErrorBanner(null)
    try {
      await deleteFee(feeId)
      setDeleteConfirm(null)
      refresh()
    } catch (err: any) {
      setErrorBanner(err?.message || "Failed to remove fee record.")
      setDeleteConfirm(null)
    }
  }

  if (loading && fees.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 rounded-full border-2 border-pistachio border-t-transparent animate-spin" />
      </div>
    )
  }

  const columns = [
    {
      key: "studentName", label: "Student", sortable: true,
      render: (row: FeeRecord) => <span className="font-medium text-olive">{row.studentName}</span>,
    },
    { key: "term", label: "Term", sortable: true },
    {
      key: "amount", label: "Amount",
      render: (row: FeeRecord) => <span className="font-display font-semibold text-olive">₹{row.amount.toLocaleString("en-IN")}</span>,
    },
    {
      key: "paidAmount", label: "Paid",
      render: (row: FeeRecord) => <span className="text-olive/60">₹{row.paidAmount.toLocaleString("en-IN")}</span>,
    },
    {
      key: "status", label: "Status",
      render: (row: FeeRecord) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize font-body ${
          row.status === "paid" ? "bg-pistachio/15 text-olive" :
          row.status === "overdue" ? "bg-red-50 text-red-500" :
          row.status === "partial" ? "bg-blue-50 text-blue-500" :
          "bg-amber-50 text-amber-600"
        }`}>
          {row.status}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-display font-bold text-olive">Fee Management</h1>
          <p className="text-sm text-olive/50 font-body">Create, track, and manage fee records</p>
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
          <button onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium shadow-soft hover:shadow-lift hover:-translate-y-0.5 transition-all duration-300 font-body font-semibold">
            <Plus className="w-4 h-4" /> Create Fee Record
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
        <StatCard icon={CreditCard} label="Total Fees" value={`₹${(totalAmount / 1000).toFixed(1)}K`} color="bg-pistachio/10" index={0} />
        <StatCard icon={CheckCircle} label="Collected" value={`₹${(totalPaid / 1000).toFixed(1)}K`} color="bg-sage/10" index={1} />
        <StatCard icon={Clock} label="Pending" value={`₹${(totalPending / 1000).toFixed(1)}K`} color="bg-beige/30" index={2} />
        <StatCard icon={TrendingUp} label="Collection Rate" value={`${collectionRate}%`} color="bg-cream" index={3} />
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft">
        <DataTable
          columns={columns as { key: string; label: string; sortable?: boolean; render?: (row: Record<string, unknown>) => React.ReactNode }[]}
          data={fees as unknown as Record<string, unknown>[]}
          searchKeys={["studentName", "term"]}
          searchPlaceholder="Search by student or term..."
          emptyTitle="No fee records"
          emptyDescription="Create a new fee record to get started"
          actions={(row) => {
            const fee = row as unknown as FeeRecord
            return (
              <div className="flex items-center gap-1">
                {fee.status !== "paid" && (
                  <button onClick={() => handleMarkPaid(fee.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-pistachio/10 text-olive text-[11px] font-medium hover:bg-pistachio/20 transition-colors font-body">
                    <CheckCircle className="w-3 h-3" /> Mark Paid
                  </button>
                )}
                <button onClick={() => openEditFee(fee)}
                  className="p-1.5 rounded-lg hover:bg-cream text-olive/40 hover:text-olive transition-colors" title="Edit record" aria-label="Edit">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setDeleteConfirm(fee.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-olive/40 hover:text-red-500 transition-colors" title="Delete record" aria-label="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          }}
        />
      </motion.div>

      {/* Create Fee Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Fee Record">
        <form onSubmit={handleAddFee} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-olive mb-1 font-body">Student *</label>
            <select required value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all font-body">
              <option value="">Select student...</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.program})</option>)}
            </select>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-olive mb-1 font-body">Term / Description *</label>
              <input type="text" required value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })} placeholder="e.g., Q2 Jul-Sep 2026"
                className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all font-body" />
            </div>
            <div>
              <label className="block text-xs font-medium text-olive mb-1 font-body">Amount (₹) *</label>
              <input type="number" required min={0} value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all font-body" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-olive mb-1 font-body">Due Date *</label>
            <input type="date" required value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all font-body" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-cream text-olive/60 text-sm font-medium hover:bg-beige/30 transition-colors font-body">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium shadow-soft hover:shadow-lift transition-all font-body">
              Create Record
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Remove Fee Record" maxWidth="max-w-sm">
        <p className="text-sm text-olive/60 mb-4 font-body">
          Are you sure you want to remove this fee record? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteConfirm(null)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-cream text-olive/60 text-sm font-medium hover:bg-beige/30 transition-colors font-body">
            Cancel
          </button>
          <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors font-body">
            Remove Record
          </button>
        </div>
      </Modal>

      {/* Edit Fee Modal */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title="Edit Fee Record">
        <form onSubmit={handleEditFee} className="space-y-4">
          {editingFee && (
            <p className="text-sm text-olive/60 font-body">
              Editing fee for <span className="font-semibold text-olive">{editingFee.studentName}</span>
            </p>
          )}
          <div>
            <label className="block text-xs font-medium text-olive mb-1 font-body">Term / Description *</label>
            <input type="text" required value={editForm.term} onChange={(e) => setEditForm({ ...editForm, term: e.target.value })} placeholder="e.g., Q2 Jul-Sep 2026"
              className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all font-body" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-olive mb-1 font-body">Amount (₹) *</label>
              <input type="number" required min={0} value={editForm.amount || ""} onChange={(e) => setEditForm({ ...editForm, amount: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all font-body" />
            </div>
            <div>
              <label className="block text-xs font-medium text-olive mb-1 font-body">Due Date *</label>
              <input type="date" required value={editForm.dueDate} onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-cream border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:shadow-glow transition-all font-body" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setEditModal(false)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-cream text-olive/60 text-sm font-medium hover:bg-beige/30 transition-colors font-body">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium shadow-soft hover:shadow-lift transition-all font-body">
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Import Report Modal */}
      {importReport && (
        <ImportReportModal
          open={importReport.open}
          onClose={() => setImportReport(null)}
          title="Fees Import Report"
          successCount={importReport.successCount}
          failCount={importReport.failCount}
          errors={importReport.errors}
        />
      )}
    </div>
  )
}
