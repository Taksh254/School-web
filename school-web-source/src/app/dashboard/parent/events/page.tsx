"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { getEvents } from "@/lib/data-store"
import type { SchoolEvent } from "@/lib/types"
import { Calendar, MapPin, Clock, GraduationCap, Music, Trophy, Palmtree, Users } from "lucide-react"

const typeConfig: Record<string, { icon: typeof Calendar; color: string }> = {
  academic: { icon: GraduationCap, color: "bg-pistachio/10 text-olive" },
  cultural: { icon: Music, color: "bg-sage/10 text-olive" },
  sports: { icon: Trophy, color: "bg-amber-50 text-amber-600" },
  holiday: { icon: Palmtree, color: "bg-cream text-olive/50" },
  meeting: { icon: Users, color: "bg-beige/30 text-olive" },
}

export default function ParentEventsPage() {
  const [events, setEvents] = useState<SchoolEvent[]>([])

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true)
      try {
        const data = await getEvents()
        setEvents(data)
      } catch (err) {
        console.error("Events fetch error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 rounded-full border-2 border-pistachio border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-display font-bold text-olive">Events</h1>
        <p className="text-sm text-olive/50 font-body">Upcoming school events and activities</p>
      </div>

      <div className="space-y-4">
        {events.map((event, i) => {
          const config = typeConfig[event.type] || typeConfig.academic
          const Icon = config.icon
          const eventDate = new Date(event.date)

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-soft-white rounded-3xl p-5 md:p-6 border border-beige/20 shadow-soft hover:shadow-card transition-shadow duration-300"
            >
              <div className="flex gap-4">
                {/* Date block */}
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-cream flex flex-col items-center justify-center shrink-0">
                  <span className="text-[10px] text-olive/40 uppercase font-body leading-none">
                    {eventDate.toLocaleDateString("en-IN", { month: "short" })}
                  </span>
                  <span className="text-xl md:text-2xl font-display font-bold text-olive leading-none mt-0.5">
                    {eventDate.getDate()}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-base font-display font-semibold text-olive">{event.title}</h3>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium capitalize font-body ${config.color}`}>
                      <Icon className="w-3 h-3" /> {event.type}
                    </span>
                  </div>
                  <p className="text-sm text-olive/60 leading-relaxed mb-3 font-body">{event.description}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-olive/40 font-body">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {event.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {event.location}
                    </span>
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
