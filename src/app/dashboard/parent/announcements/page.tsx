"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { getAnnouncements } from "@/lib/data-store"
import type { Announcement } from "@/lib/types"
import { Bell, AlertTriangle, Info } from "lucide-react"

export default function ParentAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true)
      try {
        const res = await fetch("/api/parent-data?type=announcements", { cache: "no-store" })
        if (res.ok) {
          const json = await res.json()
          if (json.announcements) {
            setAnnouncements(json.announcements)
            setLoading(false)
            return
          }
        }
        const data = await getAnnouncements()
        setAnnouncements(data.filter((a) => a.published))
      } catch (err) {
        console.error("Announcements fetch error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchAnnouncements()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 rounded-full border-2 border-pistachio border-t-transparent animate-spin" />
      </div>
    )
  }

  const priorityConfig = {
    urgent: { icon: AlertTriangle, bg: "bg-red-50 border-red-100", dot: "bg-red-400", badge: "bg-red-50 text-red-500" },
    important: { icon: Bell, bg: "bg-pistachio/5 border-pistachio/15", dot: "bg-pistachio", badge: "bg-pistachio/10 text-olive" },
    normal: { icon: Info, bg: "bg-cream/60 border-beige/15", dot: "bg-beige", badge: "bg-cream text-olive/50" },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-display font-bold text-olive">Announcements</h1>
        <p className="text-sm text-olive/50 font-body">Important updates from the school</p>
      </div>

      <div className="space-y-4">
        {announcements.map((a, i) => {
          const config = priorityConfig[a.priority]
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-2xl p-5 border ${config.bg} shadow-soft`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full ${config.dot} mt-2 shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-base font-display font-semibold text-olive">{a.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize font-body ${config.badge}`}>
                      {a.priority}
                    </span>
                  </div>
                  <p className="text-sm text-olive/60 leading-relaxed mb-2 font-body">{a.content}</p>
                  <div className="flex items-center gap-3 text-xs text-olive/40 font-body">
                    <span>{new Date(a.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
                    <span>·</span>
                    <span>{a.author}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
