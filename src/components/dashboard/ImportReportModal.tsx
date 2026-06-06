"use client"

import Modal from "./Modal"
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react"
import type { ImportError } from "@/lib/importer-exporter"

interface ImportReportModalProps {
  open: boolean
  onClose: () => void
  title: string
  successCount: number
  failCount: number
  errors: ImportError[]
}

export default function ImportReportModal({
  open,
  onClose,
  title,
  successCount,
  failCount,
  errors,
}: ImportReportModalProps) {
  const isPerfect = failCount === 0 && successCount > 0
  const isFailedEntirely = successCount === 0 && failCount > 0

  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="space-y-6">
        {/* Status Illustration */}
        <div className="flex flex-col items-center text-center">
          {isPerfect ? (
            <div className="w-16 h-16 rounded-full bg-pistachio/10 flex items-center justify-center mb-3 text-pistachio">
              <CheckCircle className="w-10 h-10" />
            </div>
          ) : isFailedEntirely ? (
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-3 text-red-500">
              <XCircle className="w-10 h-10" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-3 text-amber-500">
              <AlertTriangle className="w-10 h-10" />
            </div>
          )}

          <h3 className="font-display font-bold text-olive text-lg">
            {isPerfect ? "Import Complete!" : isFailedEntirely ? "Import Failed" : "Imported with Warnings"}
          </h3>
          <p className="text-xs text-olive/40 font-body mt-1">
            CSV processing report summary
          </p>
        </div>

        {/* Counts summary */}
        <div className="grid grid-cols-2 gap-4 bg-cream/40 rounded-2xl p-4 border border-beige/10">
          <div className="text-center">
            <span className="text-[10px] uppercase font-bold text-olive/40 font-body block">Success</span>
            <span className="text-2xl font-display font-bold text-olive block mt-1">{successCount}</span>
            <span className="text-xs text-olive/60 font-body">records imported</span>
          </div>
          <div className="text-center border-l border-beige/20">
            <span className="text-[10px] uppercase font-bold text-olive/40 font-body block">Failed</span>
            <span className={`text-2xl font-display font-bold block mt-1 ${failCount > 0 ? "text-red-500" : "text-olive/30"}`}>
              {failCount}
            </span>
            <span className="text-xs text-olive/60 font-body">records skipped</span>
          </div>
        </div>

        {/* Errors list */}
        {errors.length > 0 && (
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-olive/60 uppercase tracking-wider font-body">
              Validation Errors ({errors.length})
            </h4>
            <div className="max-h-[200px] overflow-y-auto rounded-2xl border border-beige/25 bg-cream/20 p-3 space-y-2 text-xs">
              {errors.map((err, i) => (
                <div key={i} className="flex gap-2 text-olive/70 font-body leading-relaxed border-b border-beige/10 pb-2 last:border-0 last:pb-0">
                  <span className="font-bold text-red-500 shrink-0">Row {err.row}:</span>
                  <span>{err.error}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Buttons */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium shadow-soft hover:shadow-lift transition-all font-body text-center block"
        >
          Close Report
        </button>
      </div>
    </Modal>
  )
}
