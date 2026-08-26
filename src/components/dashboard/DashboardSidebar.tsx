"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { useEffect, useState, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase"
import {
  LayoutDashboard,
  Users,
  UserCheck,
  CreditCard,
  Bell,
  BarChart3,
  CalendarCheck,
  MessageCircle,
  Calendar,
  FileText,
  X,
  Crown,
  User,
  ClipboardList,
  MessageSquare,
  Sparkles,
  Palette,
  BookOpen,
  CalendarDays,
  Settings,
} from "lucide-react"

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const adminLinks = [
  { href: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/admin/students", label: "Students", icon: Users },
  { href: "/dashboard/admin/teachers", label: "Teachers", icon: UserCheck },
  { href: "/dashboard/admin/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/dashboard/admin/fees", label: "Fee Management", icon: CreditCard },
  { href: "/dashboard/admin/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/admin/enquiries", label: "Enquiries", icon: ClipboardList },
  { href: "/dashboard/admin/notes", label: "Teacher Notes", icon: MessageCircle },
  { href: "/dashboard/admin/announcements", label: "Announcements", icon: Bell },
  { href: "/dashboard/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/dashboard/admin/principal", label: "Profile", icon: Crown },
]

const teacherLinks = [
  { href: "/dashboard/teacher", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/teacher/students", label: "My Students", icon: Users },
  { href: "/dashboard/teacher/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/dashboard/teacher/development", label: "Student Development", icon: Sparkles },
  { href: "/dashboard/teacher/notes", label: "Notes", icon: FileText },
  { href: "/dashboard/teacher/activities", label: "Activities", icon: Palette },
  { href: "/dashboard/teacher/home-activities", label: "Home Activities", icon: BookOpen },
  { href: "/dashboard/teacher/announcements", label: "Announcements", icon: Bell },
  { href: "/dashboard/teacher/calendar", label: "Calendar", icon: Calendar },
  { href: "/dashboard/teacher/leave-requests", label: "Leave Requests", icon: CalendarDays },
  { href: "/dashboard/teacher/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/teacher/profile", label: "My Profile", icon: User },
  { href: "/dashboard/teacher/settings", label: "Settings", icon: Settings },
]

const parentLinks = [
  { href: "/dashboard/parent", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/parent/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/dashboard/parent/fees", label: "Fees & Payments", icon: CreditCard },
  { href: "/dashboard/parent/chat", label: "Chat with Principal", icon: MessageSquare },
  { href: "/dashboard/parent/announcements", label: "Announcements", icon: Bell },
  { href: "/dashboard/parent/events", label: "Events", icon: Calendar },
  { href: "/dashboard/parent/notes", label: "Teacher Notes", icon: MessageCircle },
  { href: "/dashboard/parent/profile", label: "Profile", icon: User },
]

/** Fetch unread count for the current user from the chat API. */
async function fetchParentUnread(token?: string): Promise<number> {
  try {
    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`
    const res = await fetch("/api/chat/conversations", { headers, cache: "no-store" })
    if (!res.ok) return 0
    const data = await res.json()
    return data.unreadCount || 0
  } catch {
    return 0
  }
}

async function fetchAdminUnread(token: string): Promise<number> {
  try {
    const res = await fetch("/api/chat/conversations", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (!res.ok) return 0
    const data = await res.json()
    const convs: { unreadCount: number }[] = data.conversations || []
    return convs.reduce((s, c) => s + (c.unreadCount || 0), 0)
  } catch {
    return 0
  }
}

// ── Module-level session token cache ──────────────────────────────────────────
// Avoids calling getSession() (network round-trip) on every Realtime message.
let _cachedToken: string | null = null
async function getCachedToken(): Promise<string | null> {
  if (_cachedToken) return _cachedToken
  const { data: { session } } = await supabase.auth.getSession()
  _cachedToken = session?.access_token ?? null
  return _cachedToken
}

/** Debounce helper — waits `ms` ms after the last call before executing fn. */
function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout> | null = null
  return ((...args: unknown[]) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }) as T
}

export default function DashboardSidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const isTeacher = user?.role === "teacher" || pathname.startsWith("/dashboard/teacher")
  const isAdmin = user?.role === "admin"
  const isParent = !user || pathname.startsWith("/dashboard/parent")
  const links = isAdmin ? adminLinks : isTeacher ? teacherLinks : parentLinks

  const [unreadCount, setUnreadCount] = useState(0)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const refreshUnread = useCallback(async () => {
    const token = await getCachedToken()
    if (isAdmin) {
      if (token) {
        const count = await fetchAdminUnread(token)
        setUnreadCount(count)
      }
    } else if (isParent) {
      // Works for both cookie-auth and Supabase-auth parents
      const count = await fetchParentUnread(token || undefined)
      setUnreadCount(count)
    }
  }, [isAdmin, isParent])

  useEffect(() => {
    // Invalidate cached token on mount (may have changed)
    _cachedToken = null
    refreshUnread()

    // Debounced refresh so rapid message bursts don't pile up API calls
    const debouncedRefresh = debounce(() => { refreshUnread() }, 600)

    // Subscribe to new messages to update badge in real time
    const channel = supabase
      .channel("sidebar-unread-watch")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        debouncedRefresh
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        debouncedRefresh
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [refreshUnread])

  // Reset badge when visiting the chat page
  useEffect(() => {
    if (
      pathname === "/dashboard/parent/chat" ||
      pathname === "/dashboard/admin/messages"
    ) {
      setUnreadCount(0)
    }
  }, [pathname])

  const chatHref = isAdmin ? "/dashboard/admin/messages" : "/dashboard/parent/chat"

  const sidebar = (
    <div className="flex flex-col h-full bg-soft-white border-r border-beige/20">
      {/* Logo */}
      <div className="p-5 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full overflow-hidden border border-beige/25 flex items-center justify-center shrink-0 shadow-soft relative">
          <Image src="/images/logo.jpg" alt="Logo" fill sizes="36px" className="object-cover" priority />
        </div>
        <div className="min-w-0">
          <span className="text-base font-display font-bold text-olive block leading-tight">Tiny Mind Play School</span>
          <span className="text-[10px] text-olive/40 font-body uppercase tracking-wider">
            {isAdmin ? "Admin Portal" : isTeacher ? "Teacher Portal" : "Parent Portal"}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const isActive = pathname === link.href
          const isChatLink = link.href === chatHref
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
              <div className="ml-auto flex items-center gap-1">
                {/* Unread badge on the chat link */}
                {isChatLink && unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="w-1.5 h-1.5 rounded-full bg-pistachio"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </div>
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
