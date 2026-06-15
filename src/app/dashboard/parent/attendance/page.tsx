"use client"

import { useEffect, useState, useMemo } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { getAttendance, getStudent } from "@/lib/data-store"
import type { AttendanceRecord } from "@/lib/types"
import StatCard from "@/components/dashboard/StatCard"
import { CalendarCheck, CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react"

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

export default function AttendancePage() {
  const { user } = useAuth()
  const childId = user?.childId
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)
  const [child, setChild] = useState<any>(null)

  useEffect(() => {
    if (!childId) {
      setLoading(false)
      return
    }
    const fetchAttendance = async () => {
      setLoading(true)
      try {
        const [data, studentData] = await Promise.all([
          getAttendance(childId),
          getStudent(childId),
        ])
        setRecords(data)
        setChild(studentData || null)
      } catch (err) {
        console.error("Attendance fetch error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchAttendance()
  }, [childId])

  const { calendarDays, present, absent, leaves, total } = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayOfWeek = new Date(year, month, 1).getDay()
    const days: { day: number; status: AttendanceRecord["status"] | null }[] = []

    // Empty cells for offset
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ day: 0, status: null })
    }

    let presentCount = 0
    let absentCount = 0
    let leaveCount = 0

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
      const record = records.find((r) => r.date === dateStr)
      const status = record?.status || null
      days.push({ day: d, status })
      if (status === "present") presentCount++
      if (status === "absent") absentCount++
      if (status === "leave") leaveCount++
    }

    const totalDays = presentCount + absentCount + leaveCount
    return { calendarDays: days, present: presentCount, absent: absentCount, leaves: leaveCount, total: totalDays }
  }, [records, month, year])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 rounded-full border-2 border-pistachio border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!childId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-display font-bold text-olive">Attendance</h1>
          <p className="text-sm text-olive/50 font-body">Monthly attendance overview</p>
        </div>
        <div className="bg-cream border border-beige/40 rounded-3xl p-6 text-center shadow-soft">
          <p className="text-sm text-olive/60 font-body">No student profile is linked to this account. Please link a student profile to view attendance.</p>
        </div>
      </div>
    )
  }

  const rate = total > 0 ? Math.round((present / total) * 100) : 0

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1) }
    else setMonth(month - 1)
  }

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1) }
    else setMonth(month + 1)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-display font-bold text-olive">Attendance</h1>
        <p className="text-sm text-olive/50 font-body">
          {child ? `Monthly attendance overview for ${child.name}` : "Monthly attendance overview"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CalendarCheck} label="Attendance Rate" value={`${rate}%`} sub={`${MONTH_NAMES[month]} ${year}`} color="bg-pistachio/10" index={0} />
        <StatCard icon={CheckCircle} label="Days Present" value={present} sub={`of ${total} working days`} color="bg-sage/10" index={1} />
        <StatCard icon={XCircle} label="Days Absent" value={absent} color="bg-beige/30" index={2} />
        <StatCard icon={CalendarCheck} label="Leaves" value={leaves} color="bg-cream" index={3} />
      </div>

      {/* Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft"
      >
        {/* Month nav */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="w-9 h-9 rounded-xl bg-cream hover:bg-beige/30 flex items-center justify-center text-olive/50 hover:text-olive transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h3 className="text-base font-display font-semibold text-olive">
            {MONTH_NAMES[month]} {year}
          </h3>
          <button onClick={nextMonth} className="w-9 h-9 rounded-xl bg-cream hover:bg-beige/30 flex items-center justify-center text-olive/50 hover:text-olive transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAY_NAMES.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-olive/40 py-1 font-body">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((cell, i) => {
            if (cell.day === 0) return <div key={`e-${i}`} />

            let bg = "bg-cream/40 text-olive/30" // no data
            let dot = ""
            if (cell.status === "present") { bg = "bg-pistachio/15 text-olive"; dot = "bg-pistachio" }
            else if (cell.status === "absent") { bg = "bg-red-50 text-red-400"; dot = "bg-red-300" }
            else if (cell.status === "leave") { bg = "bg-amber-50 text-amber-500"; dot = "bg-amber-300" }
            else if (cell.status === "holiday") { bg = "bg-beige/20 text-olive/25"; dot = "" }

            return (
              <div
                key={cell.day}
                className={`relative aspect-square rounded-xl ${bg} flex flex-col items-center justify-center text-sm font-medium transition-colors`}
              >
                {cell.day}
                {dot && <span className={`absolute bottom-1 w-1 h-1 rounded-full ${dot}`} />}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-5 pt-4 border-t border-beige/15">
          {[
            { label: "Present", color: "bg-pistachio" },
            { label: "Absent", color: "bg-red-300" },
            { label: "Leave", color: "bg-amber-300" },
            { label: "Holiday", color: "bg-beige/40" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5 text-xs text-olive/50 font-body">
              <span className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
              {l.label}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
