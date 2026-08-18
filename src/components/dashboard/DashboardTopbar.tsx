"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Menu, LogOut, User, Crown, Settings, Bell, Shield, ChevronDown } from "lucide-react"
import Link from "next/link"
import { getPrincipalProfile } from "@/lib/data-store"
import { motion, AnimatePresence } from "framer-motion"
import { getProfile } from "@/app/actions/profile-actions"
import { UserProfile } from "@/lib/types"

interface TopbarProps {
  onMenuClick: () => void
}

export default function DashboardTopbar({ onMenuClick }: TopbarProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Real DB profile for the unified system
  const [dbProfile, setDbProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    async function loadProfile() {
      if (user?.id) {
        const p = await getProfile(user.id)
        if (!('error' in p)) {
          setDbProfile(p as UserProfile)
        }
      }
    }
    loadProfile()
  }, [user])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await logout()
  }

  // Fallback to auth context or principal profile if DB profile isn't loaded yet
  const displayName = dbProfile?.name || (user?.role === "admin" ? getPrincipalProfile().name : user?.name)
  const displayPhoto = dbProfile?.photo_url || (user?.role === "admin" ? getPrincipalProfile().photoUrl : "")
  const roleDisplay = dbProfile?.role || user?.role

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
              {getGreeting()}, {displayName?.split(" ")[0] || "there"}
            </p>
            <p className="text-[11px] text-olive/40 font-body hidden sm:block">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* Right — user dropdown */}
        <div className="flex items-center gap-4 relative" ref={dropdownRef}>
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-soft-white border border-beige/15 hover:border-pistachio/30 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-pistachio/15 flex items-center justify-center overflow-hidden">
              {displayPhoto ? (
                <img src={displayPhoto} alt={displayName || ""} className="w-full h-full object-cover" />
              ) : (
                <User className="w-3.5 h-3.5 text-olive" />
              )}
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium text-olive font-body">{displayName}</p>
              <p className="text-[10px] text-olive/40 capitalize font-body">{roleDisplay}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-olive/50 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-soft border border-beige/20 overflow-hidden py-2 z-50"
              >
                <div className="px-4 py-2 border-b border-beige/10 mb-2">
                  <p className="text-sm font-semibold text-olive">{displayName}</p>
                  <p className="text-xs text-olive/50 truncate">{dbProfile?.email || user?.email}</p>
                </div>
                
                <Link href={user?.role === "parent" ? "/dashboard/parent/profile" : "/dashboard/profile"} onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-olive hover:bg-cream/50 transition-colors font-medium">
                  <User className="w-4 h-4 text-olive/50" /> My Profile
                </Link>
                {user?.role !== "parent" && (
                  <>
                    <Link href="/dashboard/profile?tab=Personal" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-olive hover:bg-cream/50 transition-colors font-medium">
                      <Settings className="w-4 h-4 text-olive/50" /> Edit Profile
                    </Link>
                    <Link href="/dashboard/profile?tab=Security" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-olive hover:bg-cream/50 transition-colors font-medium">
                      <Shield className="w-4 h-4 text-olive/50" /> Change Password
                    </Link>
                    <Link href="/dashboard/profile?tab=Notifications" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-olive hover:bg-cream/50 transition-colors font-medium">
                      <Bell className="w-4 h-4 text-olive/50" /> Notification Settings
                    </Link>
                  </>
                )}
                
                <div className="h-px bg-beige/10 my-2" />
                
                <button
                  onClick={() => { setDropdownOpen(false); handleLogout(); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors font-medium"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
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
