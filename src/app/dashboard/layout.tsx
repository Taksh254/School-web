"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import DashboardSidebar from "@/components/dashboard/DashboardSidebar"
import DashboardTopbar from "@/components/dashboard/DashboardTopbar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, loading, mustChangePassword } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    console.log(`[dashboard/layout] Guard check — Path: ${pathname}, Loading: ${loading}, User: ${user ? user.email : "none"}, MustChangePassword: ${mustChangePassword}`)
    if (!loading) {
      if (!user) {
        console.log(`[dashboard/layout] Redirecting to /login because user is null`)
        router.replace("/login")
      } else if (mustChangePassword) {
        console.log(`[dashboard/layout] Redirecting to /auth/change-password because mustChangePassword is true`)
        router.replace("/auth/change-password")
      } else {
        const isWrongAdmin = pathname.startsWith("/dashboard/admin") && user.role !== "admin"
        const isWrongParent = pathname.startsWith("/dashboard/parent") && user.role !== "parent"
        if (isWrongAdmin) {
          console.log(`[dashboard/layout] RBAC redirection: User is a parent. Redirecting from admin route to /dashboard/parent`)
          router.replace("/dashboard/parent")
        } else if (isWrongParent) {
          console.log(`[dashboard/layout] RBAC redirection: User is an admin. Redirecting from parent route to /dashboard/admin`)
          router.replace("/dashboard/admin")
        } else {
          console.log(`[dashboard/layout] Access granted to ${user.email} (${user.role}) for path ${pathname}`)
        }
      }
    }
  }, [user, loading, mustChangePassword, router, pathname])

  const isWrongRole = user && (
    (pathname.startsWith("/dashboard/admin") && user.role !== "admin") ||
    (pathname.startsWith("/dashboard/parent") && user.role !== "parent")
  )

  if (loading || isWrongRole || (user && mustChangePassword)) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-pistachio border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!user) return null

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
