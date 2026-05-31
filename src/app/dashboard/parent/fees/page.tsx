"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { getFees, getPayments, getStudent } from "@/lib/data-store"
import type { FeeRecord, Payment } from "@/lib/types"
import StatCard from "@/components/dashboard/StatCard"
import Modal from "@/components/dashboard/Modal"
import Receipt from "@/components/dashboard/Receipt"
import { CreditCard, CheckCircle, Clock, FileText, Download } from "lucide-react"

export default function ParentFeesPage() {
  const { user } = useAuth()
  const childId = user?.childId || "s1"
  const [fees, setFees] = useState<FeeRecord[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)

  const [loading, setLoading] = useState(true)
  const [child, setChild] = useState<any>(null)

  useEffect(() => {
    const fetchFeesData = async () => {
      setLoading(true)
      try {
        const [feesData, paymentsData, studentData] = await Promise.all([
          getFees(childId),
          getPayments(childId),
          getStudent(childId),
        ])
        setFees(feesData)
        setPayments(paymentsData)
        setChild(studentData || null)
      } catch (err) {
        console.error("Fees page fetch error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchFeesData()
  }, [childId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 rounded-full border-2 border-pistachio border-t-transparent animate-spin" />
      </div>
    )
  }
  const totalFees = fees.reduce((sum, f) => sum + f.amount, 0)
  const paidFees = fees.reduce((sum, f) => sum + f.paidAmount, 0)
  const pendingFees = totalFees - paidFees

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-display font-bold text-olive">Fees & Payments</h1>
        <p className="text-sm text-olive/50 font-body">Track your fee status and payment history</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CreditCard} label="Total Fees" value={`₹${totalFees.toLocaleString("en-IN")}`} color="bg-pistachio/10" index={0} />
        <StatCard icon={CheckCircle} label="Paid" value={`₹${paidFees.toLocaleString("en-IN")}`} color="bg-sage/10" index={1} />
        <StatCard icon={Clock} label="Pending" value={`₹${pendingFees.toLocaleString("en-IN")}`} color="bg-beige/30" index={2} />
        <StatCard icon={FileText} label="Receipts" value={payments.length} sub="Downloadable" color="bg-cream" index={3} />
      </div>

      {/* Fee Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft"
      >
        <h3 className="text-base font-display font-semibold text-olive mb-4">Fee Breakdown</h3>
        <div className="space-y-3">
          {fees.map((fee) => (
            <div key={fee.id} className="flex items-center justify-between p-4 rounded-2xl bg-cream/50 border border-beige/10">
              <div>
                <p className="text-sm font-medium text-olive">{fee.term}</p>
                <p className="text-xs text-olive/40 mt-0.5 font-body">
                  Due: {new Date(fee.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-display font-semibold text-olive">₹{fee.amount.toLocaleString("en-IN")}</p>
                <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium font-body ${
                  fee.status === "paid" ? "bg-pistachio/15 text-olive" :
                  fee.status === "pending" ? "bg-amber-50 text-amber-600" :
                  fee.status === "overdue" ? "bg-red-50 text-red-500" :
                  "bg-blue-50 text-blue-500"
                }`}>
                  {fee.status === "paid" ? "Paid" : fee.status === "overdue" ? "Overdue" : fee.status === "partial" ? `Partial · ₹${(fee.amount - fee.paidAmount).toLocaleString("en-IN")} due` : "Pending"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Payment History */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft"
      >
        <h3 className="text-base font-display font-semibold text-olive mb-4">Payment History</h3>
        {payments.length === 0 ? (
          <p className="text-sm text-olive/40 text-center py-8 font-body">No payments recorded yet</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-beige/15">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-cream/60">
                  <th className="text-left px-4 py-3 text-xs font-medium text-olive/50 uppercase tracking-wider font-body">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-olive/50 uppercase tracking-wider font-body">Description</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-olive/50 uppercase tracking-wider font-body">Method</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-olive/50 uppercase tracking-wider font-body">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-olive/50 uppercase tracking-wider font-body">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t border-beige/10 hover:bg-cream/30 transition-colors">
                    <td className="px-4 py-3 text-olive/70 font-body">{new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                    <td className="px-4 py-3 text-olive/70 font-body">{p.description}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full bg-pistachio/10 text-olive text-xs font-medium font-body">{p.method}</span>
                    </td>
                    <td className="px-4 py-3 font-display font-semibold text-olive">₹{p.amount.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedPayment(p)}
                        className="flex items-center gap-1 text-xs text-olive/50 hover:text-olive transition-colors font-body"
                      >
                        <Download className="w-3 h-3" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Receipt Modal */}
      <Modal open={!!selectedPayment} onClose={() => setSelectedPayment(null)} title="Fee Receipt" maxWidth="max-w-md">
        {selectedPayment && (
          <Receipt
            payment={selectedPayment}
            studentName={child?.name || ""}
            parentName={child?.parentName}
            program={child?.program}
          />
        )}
      </Modal>
    </div>
  )
}
