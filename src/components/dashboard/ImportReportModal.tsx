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
  totalRows?: number
  duplicatesSkipped?: number
  parentCreatedCount?: number
  parentSkippedCount?: number
  parentErrorCount?: number
  parentAccounts?: { email: string; defaultPassword?: string; created: boolean; skipped: boolean; error?: string }[]
}

export default function ImportReportModal({
  open,
  onClose,
  title,
  successCount,
  failCount,
  errors,
  totalRows,
  duplicatesSkipped,
  parentCreatedCount,
  parentSkippedCount,
  parentErrorCount,
  parentAccounts,
}: ImportReportModalProps) {
  const isPerfect = failCount === 0 && successCount > 0
  const isFailedEntirely = successCount === 0 && failCount > 0

  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="space-y-5">
        {/* Status Illustration */}
        <div className="flex flex-col items-center text-center">
          {isPerfect ? (
            <div className="w-14 h-14 rounded-full bg-pistachio/10 flex items-center justify-center mb-2.5 text-pistachio">
              <CheckCircle className="w-8 h-8" />
            </div>
          ) : isFailedEntirely ? (
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-2.5 text-red-500">
              <XCircle className="w-8 h-8" />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mb-2.5 text-amber-500">
              <AlertTriangle className="w-8 h-8" />
            </div>
          )}

          <h3 className="font-display font-bold text-olive text-lg">
            {isPerfect ? "Import Complete!" : isFailedEntirely ? "Import Failed" : "Imported with Warnings"}
          </h3>
          <p className="text-xs text-olive/40 font-body mt-0.5">
            Student list processing summary
          </p>
        </div>

        {/* Counts summary */}
        <div className="grid grid-cols-4 gap-2 bg-cream/40 rounded-2xl p-3.5 border border-beige/10">
          <div className="text-center">
            <span className="text-[9px] uppercase font-bold text-olive/40 font-body block">Total Rows</span>
            <span className="text-xl font-display font-bold text-olive block mt-0.5">{totalRows ?? successCount + failCount}</span>
          </div>
          <div className="text-center border-l border-beige/20">
            <span className="text-[9px] uppercase font-bold text-olive/40 font-body block">Success</span>
            <span className="text-xl font-display font-bold text-pistachio block mt-0.5">{successCount}</span>
          </div>
          <div className="text-center border-l border-beige/20">
            <span className="text-[9px] uppercase font-bold text-olive/40 font-body block">Duplicates</span>
            <span className={`text-xl font-display font-bold block mt-0.5 ${(duplicatesSkipped ?? 0) > 0 ? "text-amber-500" : "text-olive/30"}`}>
              {duplicatesSkipped ?? 0}
            </span>
          </div>
          <div className="text-center border-l border-beige/20">
            <span className="text-[9px] uppercase font-bold text-olive/40 font-body block">Failed</span>
            <span className={`text-xl font-display font-bold block mt-0.5 ${failCount > 0 ? "text-red-500" : "text-olive/30"}`}>
              {failCount}
            </span>
          </div>
        </div>

        {/* Parent provisioning summary */}
        {parentCreatedCount !== undefined && (
          <div className="grid grid-cols-3 gap-2 bg-pistachio/5 rounded-2xl p-3.5 border border-pistachio/10 text-center">
            <div>
              <span className="text-[9px] uppercase font-bold text-olive/40 font-body block">Parent Accounts</span>
              <span className="text-xl font-display font-bold text-pistachio block mt-0.5">{parentCreatedCount}</span>
            </div>
            <div className="border-l border-beige/20">
              <span className="text-[9px] uppercase font-bold text-olive/40 font-body block">Skipped/Linked</span>
              <span className="text-xl font-display font-bold text-olive/40 block mt-0.5">{parentSkippedCount ?? 0}</span>
            </div>
            <div className="border-l border-beige/20">
              <span className="text-[9px] uppercase font-bold text-olive/40 font-body block">Error</span>
              <span className={`text-xl font-display font-bold block mt-0.5 ${(parentErrorCount ?? 0) > 0 ? "text-red-500" : "text-olive/30"}`}>
                {parentErrorCount ?? 0}
              </span>
            </div>
          </div>
        )}

        {/* Parent Accounts Provisioned list */}
        {parentAccounts && parentAccounts.some(p => p.created) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-olive/60 uppercase tracking-wider font-body">
                Generated Parent Logins
              </h4>
              <span className="text-[9px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-medium font-body border border-amber-200/50">
                Please copy these credentials now!
              </span>
            </div>
            <div className="max-h-[160px] overflow-y-auto rounded-2xl border border-beige/25 bg-cream/20 p-3 text-xs">
              <table className="w-full text-left font-body">
                <thead>
                  <tr className="border-b border-beige/20 text-olive/50 text-[10px] uppercase font-bold">
                    <th className="pb-1.5 font-semibold">Email</th>
                    <th className="pb-1.5 font-semibold">Default Password</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-beige/10">
                  {parentAccounts.filter(p => p.created).map((acct, idx) => (
                    <tr key={idx} className="text-olive/80">
                      <td className="py-2 pr-2 font-mono select-all break-all">{acct.email}</td>
                      <td className="py-2 font-mono font-bold select-all">{acct.defaultPassword}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Errors list */}
        {errors.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-olive/60 uppercase tracking-wider font-body">
              Validation Errors ({errors.length})
            </h4>
            <div className="max-h-[140px] overflow-y-auto rounded-2xl border border-beige/25 bg-cream/20 p-3 space-y-1.5 text-xs">
              {errors.map((err, i) => (
                <div key={i} className="flex gap-2 text-olive/70 font-body leading-relaxed border-b border-beige/10 pb-1.5 last:border-0 last:pb-0">
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
