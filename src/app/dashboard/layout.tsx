"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import DashboardSidebar from "@/components/dashboard/DashboardSidebar"
import DashboardTopbar from "@/components/dashboard/DashboardTopbar"

function getTargetDashboard(role: string) {
  if (role === "admin") return "/dashboard/admin"
  if (role === "teacher") return "/dashboard/teacher"
  return "/dashboard/parent"
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login")
        return
      }

      // Check for mismatched role paths
      if (pathname.startsWith("/dashboard/admin") && user.role !== "admin") {
        router.replace(getTargetDashboard(user.role))
      } else if (pathname.startsWith("/dashboard/teacher") && user.role !== "teacher" && user.role !== "admin") {
        router.replace(getTargetDashboard(user.role))
      } else if (pathname.startsWith("/dashboard/parent") && user.role !== "parent" && user.role !== "admin") {
        router.replace(getTargetDashboard(user.role))
      }
    }
  }, [user, loading, router, pathname])

  const isWrongRole = Boolean(
    user && (
      (pathname.startsWith("/dashboard/admin") && user.role !== "admin") ||
      (pathname.startsWith("/dashboard/teacher") && user.role !== "teacher" && user.role !== "admin") ||
      (pathname.startsWith("/dashboard/parent") && user.role !== "parent" && user.role !== "admin")
    )
  )

  if (loading || !user || isWrongRole) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-pistachio border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream flex">
      <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
