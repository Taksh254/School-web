"use client"

import type { Payment } from "@/lib/types"
import { Printer } from "lucide-react"

interface ReceiptProps {
  payment: Payment
  studentName: string
  parentName?: string
  program?: string
}

export default function Receipt({ payment, studentName, parentName, program }: ReceiptProps) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Receipt Card */}
      <div className="bg-soft-white rounded-3xl border border-beige/20 overflow-hidden print:shadow-none" id="receipt-printable">
        {/* Header */}
        <div className="bg-gradient-to-r from-pistachio to-sage p-6 text-white text-center">
          <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-white/20 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
              <path d="M20 4C16 8 12 12 8 18C4 24 4 30 8 34C12 38 18 38 24 34C30 30 34 24 34 20C34 16 30 12 26 8C22 4 20 4 20 4Z" fill="white" fillOpacity="0.3" />
              <circle cx="16" cy="20" r="1.5" fill="white" />
              <circle cx="24" cy="20" r="1.5" fill="white" />
              <path d="M18 26C19 27 21 27 22 26" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </svg>
          </div>
          <h2 className="text-lg font-display font-bold">Tiny Mind Play School</h2>
          <p className="text-white/70 text-xs mt-0.5">Fee Receipt</p>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-beige/20">
            <span className="text-xs text-olive/50 font-body">Receipt No.</span>
            <span className="text-sm font-medium text-olive font-display">{payment.receiptNo}</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-beige/20">
            <span className="text-xs text-olive/50 font-body">Date</span>
            <span className="text-sm text-olive font-body">{new Date(payment.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-beige/20">
            <span className="text-xs text-olive/50 font-body">Student</span>
            <span className="text-sm text-olive font-body">{studentName}</span>
          </div>
          {parentName && (
            <div className="flex justify-between items-center pb-3 border-b border-beige/20">
              <span className="text-xs text-olive/50 font-body">Parent</span>
              <span className="text-sm text-olive font-body">{parentName}</span>
            </div>
          )}
          {program && (
            <div className="flex justify-between items-center pb-3 border-b border-beige/20">
              <span className="text-xs text-olive/50 font-body">Program</span>
              <span className="text-sm text-olive font-body">{program}</span>
            </div>
          )}
          <div className="flex justify-between items-center pb-3 border-b border-beige/20">
            <span className="text-xs text-olive/50 font-body">Description</span>
            <span className="text-sm text-olive font-body">{payment.description}</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-beige/20">
            <span className="text-xs text-olive/50 font-body">Payment Method</span>
            <span className="text-sm text-olive font-body">{payment.method}</span>
          </div>

          {/* Amount */}
          <div className="bg-cream rounded-2xl p-4 flex justify-between items-center">
            <span className="text-sm font-medium text-olive font-display">Amount Paid</span>
            <span className="text-xl font-display font-bold text-olive">₹{payment.amount.toLocaleString("en-IN")}</span>
          </div>

          <p className="text-[10px] text-olive/30 text-center pt-2 font-body">
            This is a computer-generated receipt. No signature required.
          </p>
        </div>
      </div>

      {/* Print button */}
      <button
        onClick={handlePrint}
        className="mt-4 w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-cream text-olive text-sm font-medium hover:bg-beige/30 transition-colors print:hidden"
      >
        <Printer className="w-4 h-4" /> Print Receipt
      </button>
    </div>
  )
}
