"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { getStudent, getAttendance, getFees, getAnnouncements, getEvents, getNotes } from "@/lib/data-store"
import type { Student, Announcement, SchoolEvent, TeacherNote } from "@/lib/types"
import StatCard from "@/components/dashboard/StatCard"
import { GraduationCap, CalendarCheck, CreditCard, Calendar, Bell, MessageCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function ParentDashboard() {
  const { user } = useAuth()
  const [child, setChild] = useState<Student | null>(null)
  const [attendanceRate, setAttendanceRate] = useState(0)
  const [feeStatus, setFeeStatus] = useState("")
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [events, setEvents] = useState<SchoolEvent[]>([])
  const [notes, setNotes] = useState<TeacherNote[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true)
      try {
        const childId = user?.childId || "s1"
        const s = await getStudent(childId)
        setChild(s || null)

        if (s) {
          // Attendance
          const records = await getAttendance(childId)
          const total = records.filter((r) => r.status !== "holiday").length
          const present = records.filter((r) => r.status === "present").length
          setAttendanceRate(total > 0 ? Math.round((present / total) * 100) : 0)

          // Fee status
          const fees = await getFees(childId)
          const pendingFees = fees.filter((f) => f.status !== "paid")
          setFeeStatus(pendingFees.length > 0 ? `${pendingFees.length} Pending` : "All Paid")

          // Notes
          const fetchedNotes = await getNotes(childId)
          setNotes(fetchedNotes.slice(0, 3))
        }

        // Announcements & events (global)
        const ann = await getAnnouncements()
        setAnnouncements(ann.filter((a) => a.published).slice(0, 3))

        const evs = await getEvents()
        setEvents(evs.slice(0, 3))
      } catch (err) {
        console.error("Parent dashboard load error:", err)
      } finally {
        setLoadingData(false)
      }
    }

    loadData()
  }, [user])

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 rounded-full border-2 border-pistachio border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!child) {
    return (
      <div className="text-center py-12 bg-soft-white rounded-3xl border border-beige/20 shadow-soft">
        <p className="text-olive/50 font-body">No student profile is linked to this account.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Child Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pistachio/20 to-sage/20 flex items-center justify-center text-2xl font-display font-bold text-olive">
            {child.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-display font-bold text-olive">{child.name}</h2>
            <div className="flex flex-wrap gap-3 mt-1 text-sm text-olive/50 font-body">
              <span>{child.program} · Section {child.section}</span>
              <span>·</span>
              <span>Age {child.age} years</span>
              <span>·</span>
              <span>Teacher: {child.teacher}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CalendarCheck} label="Attendance" value={`${attendanceRate}%`} sub="This month" color="bg-pistachio/10" index={0} href="/dashboard/parent/attendance" />
        <StatCard icon={GraduationCap} label="Class" value={child.program} sub={child.teacher} color="bg-sage/10" index={1} />
        <StatCard icon={Calendar} label="Next Event" value={events[0]?.title || "—"} sub={events[0]?.date ? new Date(events[0].date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""} color="bg-cream" index={2} href="/dashboard/parent/events" />
        <StatCard icon={CreditCard} label="Fee Status" value={feeStatus} sub="Current term" color="bg-beige/30" index={3} href="/dashboard/parent/fees" />
      </div>

      {/* Two column layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Announcements */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-display font-semibold text-olive flex items-center gap-2">
              <Bell className="w-4 h-4 text-pistachio" /> Announcements
            </h3>
            <Link href="/dashboard/parent/announcements" className="text-xs text-olive/40 hover:text-olive flex items-center gap-1 font-body transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a.id} className="p-3 rounded-xl bg-cream/60">
                <div className="flex items-start gap-2">
                  {a.priority === "important" && <span className="mt-0.5 w-2 h-2 rounded-full bg-pistachio shrink-0" />}
                  {a.priority === "urgent" && <span className="mt-0.5 w-2 h-2 rounded-full bg-orange-400 shrink-0" />}
                  {a.priority === "normal" && <span className="mt-0.5 w-2 h-2 rounded-full bg-beige shrink-0" />}
                  <div>
                    <p className="text-sm font-medium text-olive/80">{a.title}</p>
                    <p className="text-xs text-olive/40 mt-0.5">{new Date(a.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Teacher Notes */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-display font-semibold text-olive flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-pistachio" /> Teacher Notes
            </h3>
            <Link href="/dashboard/parent/notes" className="text-xs text-olive/40 hover:text-olive flex items-center gap-1 font-body transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {notes.map((n) => (
              <div key={n.id} className="p-3 rounded-xl bg-cream/60">
                <p className="text-sm text-olive/70 line-clamp-2">{n.message}</p>
                <div className="flex justify-between mt-1.5 text-xs text-olive/40">
                  <span>{n.teacherName}</span>
                  <span>{new Date(n.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Upcoming Events */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-display font-semibold text-olive flex items-center gap-2">
            <Calendar className="w-4 h-4 text-pistachio" /> Upcoming Events
          </h3>
          <Link href="/dashboard/parent/events" className="text-xs text-olive/40 hover:text-olive flex items-center gap-1 font-body transition-colors">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {events.map((e) => (
            <div key={e.id} className="p-4 rounded-2xl bg-cream/60 border border-beige/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-pistachio/10 flex flex-col items-center justify-center">
                  <span className="text-[10px] text-olive/50 font-body leading-none">{new Date(e.date).toLocaleDateString("en-IN", { month: "short" })}</span>
                  <span className="text-sm font-display font-bold text-olive leading-none">{new Date(e.date).getDate()}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-olive">{e.title}</p>
                  <p className="text-xs text-olive/40">{e.time} · {e.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
