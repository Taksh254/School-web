"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Bell,
  BarChart3,
  CalendarCheck,
  MessageCircle,
  Calendar,
  FileText,
  X,
  Crown,
} from "lucide-react"

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const adminLinks = [
  { href: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/admin/students", label: "Students", icon: Users },
  { href: "/dashboard/admin/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/dashboard/admin/fees", label: "Fee Management", icon: CreditCard },
  { href: "/dashboard/admin/announcements", label: "Announcements", icon: Bell },
  { href: "/dashboard/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/dashboard/admin/principal", label: "Profile", icon: Crown },
]

const parentLinks = [
  { href: "/dashboard/parent", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/parent/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/dashboard/parent/fees", label: "Fees & Payments", icon: CreditCard },
  { href: "/dashboard/parent/announcements", label: "Announcements", icon: Bell },
  { href: "/dashboard/parent/events", label: "Events", icon: Calendar },
  { href: "/dashboard/parent/notes", label: "Teacher Notes", icon: MessageCircle },
]

export default function DashboardSidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const links = user?.role === "admin" ? adminLinks : parentLinks

  const sidebar = (
    <div className="flex flex-col h-full bg-soft-white border-r border-beige/20">
      {/* Logo */}
      <div className="p-5 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pistachio to-sage flex items-center justify-center shrink-0">
          <svg width="18" height="18" viewBox="0 0 40 40" fill="none">
            <path d="M20 4C16 8 12 12 8 18C4 24 4 30 8 34C12 38 18 38 24 34C30 30 34 24 34 20C34 16 30 12 26 8C22 4 20 4 20 4Z" fill="white" fillOpacity="0.4" />
            <circle cx="16" cy="20" r="1.5" fill="white" />
            <circle cx="24" cy="20" r="1.5" fill="white" />
            <path d="M18 26C19 27 21 27 22 26" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </svg>
        </div>
        <div className="min-w-0">
          <span className="text-base font-display font-bold text-olive block leading-tight">Tiny Mind Play School</span>
          <span className="text-[10px] text-olive/40 font-body uppercase tracking-wider">
            {user?.role === "admin" ? "Admin Portal" : "Parent Portal"}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-pistachio/15 text-olive shadow-[inset_0_0_0_1px_rgba(183,201,168,0.2)]"
                  : "text-olive/50 hover:text-olive hover:bg-cream/70"
              )}
            >
              <link.icon className={cn("w-[18px] h-[18px]", isActive ? "text-olive" : "text-olive/40")} />
              {link.label}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-pistachio"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-beige/15">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-olive/40 hover:text-olive hover:bg-cream/50 transition-colors font-body"
        >
          Back to Website
        </Link>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-[240px] shrink-0 h-screen sticky top-0">
        {sidebar}
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-[90] bg-olive/20 backdrop-blur-sm"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="lg:hidden fixed inset-y-0 left-0 z-[95] w-[260px] shadow-lift"
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-3 w-8 h-8 rounded-lg bg-cream flex items-center justify-center text-olive/50 hover:text-olive z-10"
                aria-label="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
