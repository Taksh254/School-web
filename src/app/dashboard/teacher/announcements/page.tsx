"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Bell, Search, ArrowLeft, AlertTriangle, Info, Clock, CheckCircle } from "lucide-react"
import { getTeacherAnnouncements } from "@/app/actions/teacher-portal-actions"
import type { Announcement } from "@/lib/types"

export default function TeacherAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("all")

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await getTeacherAnnouncements()
        if (res.data) setAnnouncements(res.data)
      } catch (err) {
        console.error("Error loading announcements:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = announcements.filter((a) => {
    const q = search.toLowerCase().trim()
    const matchesSearch = !q || a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q)
    const matchesPriority = priorityFilter === "all" || a.priority === priorityFilter
    return matchesSearch && matchesPriority
  })

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard/teacher" className="text-xs text-olive/50 hover:text-olive flex items-center gap-1 font-body">
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-olive">School Announcements</h1>
          <p className="text-xs sm:text-sm text-olive/60 font-body">
            Official circulars, notifications, and school updates from the Principal & Administration
          </p>
        </div>
      </div>

      {/* ── SEARCH & FILTER ─────────────────────────────────────────── */}
      <div className="bg-soft-white rounded-3xl p-4 sm:p-5 border border-beige/20 shadow-soft space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-olive/40 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search announcements..."
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-cream border border-beige/25 text-sm text-olive placeholder:text-olive/40 outline-none focus:border-pistachio transition-all font-body"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          {["all", "urgent", "important", "normal"].map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-3 py-1 rounded-full text-xs font-medium font-body capitalize transition-all ${
                priorityFilter === p
                  ? "bg-pistachio text-white shadow-soft"
                  : "bg-cream text-olive/60 hover:bg-beige/30"
              }`}
            >
              {p === "all" ? "All Priorities" : p}
            </button>
          ))}
        </div>
      </div>

      {/* ── LIST ────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[250px]">
          <div className="w-8 h-8 rounded-full border-3 border-pistachio border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-soft-white rounded-3xl p-12 border border-beige/20 shadow-soft text-center">
          <Bell className="w-10 h-10 text-olive/20 mx-auto mb-2" />
          <h3 className="text-base font-display font-semibold text-olive">No announcements found</h3>
          <p className="text-xs text-olive/50 font-body mt-1">There are no school announcements matching your filter.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filtered.map((ann) => (
            <motion.div
              key={ann.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-soft-white rounded-3xl p-6 border shadow-soft transition-all ${
                ann.priority === "urgent"
                  ? "border-rose-200/80 bg-rose-50/20"
                  : ann.priority === "important"
                  ? "border-amber-200/80 bg-amber-50/20"
                  : "border-beige/20"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                      ann.priority === "urgent"
                        ? "bg-rose-100 text-rose-800 border-rose-200"
                        : ann.priority === "important"
                        ? "bg-amber-100 text-amber-800 border-amber-200"
                        : "bg-cream text-olive/80 border-beige/30"
                    }`}
                  >
                    {ann.priority}
                  </span>
                  <h3 className="font-display font-bold text-base text-olive">{ann.title}</h3>
                </div>
                <span className="text-xs text-olive/40 font-mono shrink-0">{ann.date}</span>
              </div>

              <p className="text-xs sm:text-sm text-olive/75 font-body leading-relaxed whitespace-pre-wrap mb-4">
                {ann.content}
              </p>

              <div className="pt-3 border-t border-beige/15 flex items-center justify-between text-xs text-olive/50 font-body">
                <span>Published by {ann.author || "Principal Office"}</span>
                <span className="inline-flex items-center gap-1 text-emerald-700 text-[11px] font-medium">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Official
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
