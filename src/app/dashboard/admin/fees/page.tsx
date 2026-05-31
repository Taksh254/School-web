"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { getFees, getStudents, addFee, markFeePaid, deleteFee } from "@/lib/data-store"
import type { FeeRecord, Student } from "@/lib/types"
import StatCard from "@/components/dashboard/StatCard"
import DataTable from "@/components/dashboard/DataTable"
import Modal from "@/components/dashboard/Modal"
import { CreditCard, Plus, CheckCircle, Clock, Trash2, TrendingUp } from "lucide-react"

export default function AdminFeesPage() {
  const [fees, setFees] = useState<FeeRecord[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ studentId: "", term: "", amount: 0, dueDate: "" })

  const [loading, setLoading] = useState(true)

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
    const student = students.find((s) => s.id === form.studentId)
    if (!student) return
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
  }

  const handleMarkPaid = async (feeId: string) => {
    await markFeePaid(feeId, "Cash")
    refresh()
  }

  const handleDelete = async (feeId: string) => {
    await deleteFee(feeId)
    refresh()
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
        <button onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium shadow-soft hover:shadow-lift hover:-translate-y-0.5 transition-all duration-300">
          <Plus className="w-4 h-4" /> Create Fee Record
        </button>
      </div>

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
                <button onClick={() => handleDelete(fee.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-olive/40 hover:text-red-500 transition-colors" aria-label="Delete">
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
    </div>
  )
}
