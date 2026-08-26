"use client"

import { useEffect, useState, useMemo } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Clock,
  MapPin,
  Tag,
} from "lucide-react"
import { getTeacherCalendarEvents } from "@/app/actions/teacher-portal-actions"
import type { SchoolEvent } from "@/lib/types"

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const EVENT_COLORS: Record<string, string> = {
  academic: "bg-blue-100 text-blue-800 border-blue-200",
  cultural: "bg-purple-100 text-purple-800 border-purple-200",
  sports: "bg-emerald-100 text-emerald-800 border-emerald-200",
  holiday: "bg-rose-100 text-rose-800 border-rose-200",
  meeting: "bg-amber-100 text-amber-800 border-amber-200",
}

export default function TeacherCalendarPage() {
  const [events, setEvents] = useState<SchoolEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<SchoolEvent | null>(null)

  const month = currentDate.getMonth()
  const year = currentDate.getFullYear()

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await getTeacherCalendarEvents()
        if (res.data) setEvents(res.data)
      } catch (err) {
        console.error("Error loading events:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const { calendarDays, monthEvents } = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayOfWeek = new Date(year, month, 1).getDay()
    const days: { day: number; dateStr: string; events: SchoolEvent[] }[] = []

    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ day: 0, dateStr: "", events: [] })
    }

    const currentMonthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`
    const curMonthEvents = events.filter((e) => e.date.startsWith(currentMonthPrefix))

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentMonthPrefix}-${String(d).padStart(2, "0")}`
      const dayEvts = events.filter((e) => e.date === dateStr)
      days.push({ day: d, dateStr, events: dayEvts })
    }

    return { calendarDays: days, monthEvents: curMonthEvents }
  }, [events, month, year])

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard/teacher" className="text-xs text-olive/50 hover:text-olive flex items-center gap-1 font-body">
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-olive">School Calendar & Events</h1>
          <p className="text-xs sm:text-sm text-olive/60 font-body">
            Official preschool calendar, holidays, parent-teacher meetings, and celebrations
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── 1. MONTHLY CALENDAR GRID ───────────────────────────────── */}
        <div className="lg:col-span-2 bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={prevMonth}
              className="w-9 h-9 rounded-xl bg-cream hover:bg-beige/40 flex items-center justify-center text-olive/60 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-lg font-display font-bold text-olive">
              {MONTH_NAMES[month]} {year}
            </h2>
            <button
              onClick={nextMonth}
              className="w-9 h-9 rounded-xl bg-cream hover:bg-beige/40 flex items-center justify-center text-olive/60 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {DAY_NAMES.map((d) => (
              <div key={d} className="text-center text-[11px] font-bold text-olive/40 py-1 font-body uppercase">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((cell, idx) => {
              if (cell.day === 0) {
                return <div key={`empty-${idx}`} className="h-20 rounded-2xl bg-cream/20" />
              }
              const hasEvents = cell.events.length > 0
              const isToday =
                new Date().toDateString() === new Date(year, month, cell.day).toDateString()

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => hasEvents && setSelectedEvent(cell.events[0])}
                  className={`h-20 p-2 rounded-2xl border transition-all flex flex-col justify-between ${
                    isToday
                      ? "bg-pistachio/15 border-pistachio font-bold text-olive shadow-soft"
                      : hasEvents
                      ? "bg-cream/40 border-beige/30 hover:border-pistachio/50 cursor-pointer"
                      : "bg-soft-white border-beige/15 text-olive/70"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-mono ${isToday ? "text-pistachio font-bold" : "text-olive/80"}`}>
                      {cell.day}
                    </span>
                    {isToday && <span className="w-1.5 h-1.5 rounded-full bg-pistachio" />}
                  </div>

                  {hasEvents && (
                    <div className="space-y-1">
                      {cell.events.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          className={`text-[9px] px-1.5 py-0.5 rounded-md truncate border ${
                            EVENT_COLORS[ev.type] || "bg-cream text-olive"
                          }`}
                          title={ev.title}
                        >
                          {ev.title}
                        </div>
                      ))}
                      {cell.events.length > 2 && (
                        <span className="text-[8px] text-olive/40 font-mono">+{cell.events.length - 2} more</span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── 2. UPCOMING EVENTS LIST ─────────────────────────────────── */}
        <div className="space-y-4">
          <div className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft">
            <h3 className="font-display font-bold text-base text-olive mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-pistachio" />
              Events this Month
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 rounded-full border-2 border-pistachio border-t-transparent animate-spin" />
              </div>
            ) : monthEvents.length === 0 ? (
              <p className="text-xs text-olive/40 font-body text-center py-8">
                No events scheduled for {MONTH_NAMES[month]} {year}.
              </p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {monthEvents.map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedEvent(evt)}
                    className="p-4 rounded-2xl bg-cream/30 border border-beige/20 hover:bg-cream/60 transition-all cursor-pointer space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          EVENT_COLORS[evt.type] || "bg-cream text-olive"
                        }`}
                      >
                        {evt.type}
                      </span>
                      <span className="text-[11px] text-olive/50 font-mono">{evt.date}</span>
                    </div>

                    <h4 className="font-display font-bold text-sm text-olive">{evt.title}</h4>
                    {evt.description && (
                      <p className="text-xs text-olive/70 font-body line-clamp-2">{evt.description}</p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-olive/50 font-body pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-pistachio" /> {evt.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-sage" /> {evt.location}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
