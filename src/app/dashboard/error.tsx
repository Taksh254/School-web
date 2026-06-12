"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCcw, Home } from "lucide-react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[Dashboard Error]", error)
  }, [error])

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <div className="bg-soft-white rounded-3xl border border-beige/20 shadow-soft p-10 max-w-md w-full text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>

        <div>
          <h1 className="text-xl font-display font-bold text-olive mb-2">Something went wrong</h1>
          <p className="text-sm text-olive/50 font-body leading-relaxed">
            An unexpected error occurred while loading this page. Try refreshing, or go back to the dashboard.
          </p>
          {process.env.NODE_ENV === "development" && (
            <p className="mt-3 text-xs text-red-500 font-mono bg-red-50 rounded-xl px-4 py-2 text-left break-all">
              {error.message}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => reset()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium shadow-soft hover:shadow-lift transition-all font-body"
          >
            <RefreshCcw className="w-4 h-4" />
            Try Again
          </button>
          <a
            href="/dashboard/admin"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cream text-olive/60 text-sm font-medium hover:bg-beige/30 transition-colors font-body"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
