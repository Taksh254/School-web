"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Menu, LogOut, User, Crown } from "lucide-react"
import Link from "next/link"
import { getPrincipalProfile } from "@/lib/data-store"

interface TopbarProps {
  onMenuClick: () => void
}

export default function DashboardTopbar({ onMenuClick }: TopbarProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [principal, setPrincipal] = useState(getPrincipalProfile())

  useEffect(() => {
    const handler = () => setPrincipal(getPrincipalProfile())
    window.addEventListener("storage", handler)
    return () => window.removeEventListener("storage", handler)
  }, [])

  const handleLogout = async () => {
    await logout()
  }

  const displayName = user?.role === "admin" ? principal.name : user?.name
  const displayPhoto = user?.role === "admin" ? principal.photoUrl : ""
  const profileLink = user?.role === "admin" ? "/dashboard/admin/principal" : "/dashboard/parent"

  return (
    <header className="sticky top-0 z-40 bg-cream/80 backdrop-blur-md border-b border-beige/20">
      <div className="flex items-center justify-between px-4 md:px-6 h-14">
        {/* Left — mobile menu + greeting */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden w-9 h-9 rounded-xl bg-soft-white border border-beige/20 flex items-center justify-center text-olive/60 hover:text-olive transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div>
            <p className="text-sm font-display font-semibold text-olive">
              {getGreeting()}, {user?.name?.split(" ")[0] || "there"}
            </p>
            <p className="text-[11px] text-olive/40 font-body hidden sm:block">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* Right — user + logout */}
        <div className="flex items-center gap-2">
          <Link
            href={profileLink}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-soft-white border border-beige/15 hover:border-pistachio/30 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-pistachio/15 flex items-center justify-center overflow-hidden">
              {displayPhoto ? (
                <img src={displayPhoto} alt={displayName || ""} className="w-full h-full object-cover" />
              ) : (
                <User className="w-3.5 h-3.5 text-olive" />
              )}
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-olive font-body">{displayName}</p>
              <p className="text-[10px] text-olive/40 capitalize font-body">{user?.role}</p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-olive/50 hover:text-olive hover:bg-soft-white border border-transparent hover:border-beige/20 transition-all text-xs font-medium font-body"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good Morning"
  if (hour < 17) return "Good Afternoon"
  return "Good Evening"
}
