"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import {
  CalendarCheck,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Sparkles,
  Palette,
  BookOpen,
  FileText,
  Bell,
  Calendar,
  MessageSquare,
  CheckSquare,
  Square,
  ChevronRight,
  Plus,
} from "lucide-react"
import {
  getTeacherAssignedStudents,
  getTeacherAnnouncements,
  getTeacherCalendarEvents,
  getStudentDevelopmentList,
} from "@/app/actions/teacher-portal-actions"
import type { Student, Announcement, SchoolEvent, StudentDevelopment } from "@/lib/types"

function getTodayIST(): string {
  const now = new Date()
  const istOffset = 5.5 * 60 * 60 * 1000 // UTC +5:30
  const istDate = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + istOffset)
  const y = istDate.getFullYear()
  const m = String(istDate.getMonth() + 1).padStart(2, "0")
  const d = String(istDate.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good Morning"
  if (hour < 17) return "Good Afternoon"
  return "Good Evening"
}

export default function TeacherDashboardPage() {
  const { user } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [teacher, setTeacher] = useState<any>(null)
  const [attendanceMap, setAttendanceMap] = useState<Record<string, any>>({})
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [events, setEvents] = useState<SchoolEvent[]>([])
  const [recentObservations, setRecentObservations] = useState<StudentDevelopment[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Checklist state
  const [tasks, setTasks] = useState<{ id: string; label: string; href: string; done: boolean }[]>([
    { id: "att", label: "Mark class attendance for today", href: "/dashboard/teacher/attendance", done: false },
    { id: "dev", label: "Add student development observations", href: "/dashboard/teacher/development", done: false },
    { id: "act", label: "Review & plan class activities", href: "/dashboard/teacher/activities", done: false },
    { id: "home", label: "Check home activities for parents", href: "/dashboard/teacher/home-activities", done: false },
  ])

  const today = getTodayIST()

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [studRes, annRes, evtRes, devRes, attRes, chatRes] = await Promise.all([
          getTeacherAssignedStudents(),
          getTeacherAnnouncements(),
          getTeacherCalendarEvents(),
          getStudentDevelopmentList(),
          fetch(`/api/teacher-attendance?date=${today}`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : {})).catch(() => ({})),
          fetch("/api/teacher-chat", { cache: "no-store" }).then((r) => (r.ok ? r.json() : {})).catch(() => ({})),
        ])

        const attData = attRes as any
        const chatData = chatRes as any

        if (studRes.students) setStudents(studRes.students)
        if (studRes.teacher) setTeacher(studRes.teacher)
        if (annRes.data) setAnnouncements(annRes.data.slice(0, 3))
        if (evtRes.data) setEvents(evtRes.data.slice(0, 3))
        if (devRes.data) setRecentObservations(devRes.data.slice(0, 4))
        if (attData && attData.attendance) {
          setAttendanceMap(attData.attendance)
          const hasMarked = Object.keys(attData.attendance).length > 0
          setTasks((prev) => prev.map((t) => (t.id === "att" ? { ...t, done: hasMarked } : t)))
        }

        // Count unread messages
        if (chatData && chatData.messages) {
          const unread = (chatData.messages as any[]).filter((m) => m.sender_role === "principal" && !m.read_at).length
          setUnreadCount(unread)
        }
      } catch (err) {
        console.error("Teacher dashboard load error:", err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [today])

  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  }

  // Calculate attendance numbers
  let presentCount = 0
  let absentCount = 0
  let leaveCount = 0
  const isMarked = Object.keys(attendanceMap).length > 0

  students.forEach((s) => {
    const record = attendanceMap[s.id]
    if (record) {
      if (record.status === "present") presentCount++
      else if (record.status === "absent") absentCount++
      else if (record.status === "leave") leaveCount++
    }
  })

  const workingDays = presentCount + absentCount
  const attendanceRate = workingDays > 0 ? Math.round((presentCount / workingDays) * 100) : isMarked ? 100 : 0
  const teacherName = teacher?.full_name || user?.name || "Teacher"
  const assignedClass = teacher?.department || (students.length > 0 ? `${students[0].program} ${students[0].section}` : "Class Teacher")

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 rounded-full border-3 border-pistachio border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ── 1. WELCOME BANNER ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-soft-white rounded-3xl p-6 sm:p-8 border border-beige/25 shadow-soft relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-pistachio/20 to-sage/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pistachio/15 text-olive text-xs font-display font-medium">
                <Sparkles className="w-3.5 h-3.5 text-pistachio" />
                Teacher Portal
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cream text-olive/70 text-xs font-body font-medium border border-beige/30">
                {assignedClass}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-display font-bold text-olive">
              {getGreeting()}, {teacherName.split(" ")[0]} 👋
            </h1>
            <p className="text-sm text-olive/60 font-body mt-1">
              Welcome to BloomDesk. Here is what is happening in your classroom today.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/dashboard/teacher/attendance"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium font-body shadow-soft hover:opacity-95 transition-opacity"
            >
              <CalendarCheck className="w-4 h-4" />
              {isMarked ? "Update Attendance" : "Take Attendance"}
            </Link>
            <Link
              href="/dashboard/teacher/development"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-cream text-olive text-sm font-medium font-body border border-beige/30 hover:bg-white transition-colors"
            >
              <Sparkles className="w-4 h-4 text-pistachio" />
              New Observation
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ── 2. TODAY'S CLASS STATS CARDS ──────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Students */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-soft-white rounded-2xl p-4 sm:p-5 border border-beige/20 shadow-soft flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-olive/50 font-body">My Students</span>
            <div className="w-8 h-8 rounded-xl bg-pistachio/15 flex items-center justify-center text-olive">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-display font-bold text-olive">{students.length}</p>
            <p className="text-[11px] text-olive/40 font-body mt-0.5">Assigned to your class</p>
          </div>
        </motion.div>

        {/* Present Today */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-soft-white rounded-2xl p-4 sm:p-5 border border-emerald-100 shadow-soft flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700 font-body">Present Today</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-display font-bold text-emerald-800">{presentCount}</p>
            <p className="text-[11px] text-emerald-600 font-body mt-0.5">{isMarked ? "Marked in class" : "Pending marking"}</p>
          </div>
        </motion.div>

        {/* Absent Today */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-soft-white rounded-2xl p-4 sm:p-5 border border-rose-100 shadow-soft flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-700 font-body">Absent</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-display font-bold text-rose-800">{absentCount}</p>
            <p className="text-[11px] text-rose-600 font-body mt-0.5">{absentCount > 0 ? "Requires follow-up" : "All accounted for"}</p>
          </div>
        </motion.div>

        {/* On Leave */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-soft-white rounded-2xl p-4 sm:p-5 border border-amber-100 shadow-soft flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700 font-body">On Leave</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-display font-bold text-amber-800">{leaveCount}</p>
            <p className="text-[11px] text-amber-600 font-body mt-0.5">Authorized leave</p>
          </div>
        </motion.div>

        {/* Attendance Rate */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="col-span-2 sm:col-span-2 lg:col-span-1 bg-soft-white rounded-2xl p-4 sm:p-5 border border-beige/20 shadow-soft flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-olive/50 font-body">Attendance Rate</span>
            <div className="w-8 h-8 rounded-xl bg-sage/15 flex items-center justify-center text-olive">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-display font-bold text-olive">{attendanceRate}%</p>
            <p className="text-[11px] text-olive/40 font-body mt-0.5">Excludes leaves</p>
          </div>
        </motion.div>
      </div>

      {/* ── 3. MAIN GRID (TODAY'S TASKS & QUICK ACCESS) ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Tasks & Recent Observations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Tasks Checklist */}
          <div className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-bold text-base text-olive flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-pistachio" />
                  Today&apos;s Checklist
                </h3>
                <p className="text-xs text-olive/50 font-body mt-0.5">Daily classroom priorities for {assignedClass}</p>
              </div>
              <span className="text-xs font-medium text-olive/60 bg-cream px-3 py-1 rounded-full border border-beige/30">
                {tasks.filter((t) => t.done).length} of {tasks.length} done
              </span>
            </div>

            <div className="space-y-2.5">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    task.done ? "bg-emerald-50/40 border-emerald-200/50" : "bg-cream/40 border-beige/20 hover:bg-cream"
                  }`}
                >
                  <button
                    onClick={() => toggleTask(task.id)}
                    className="flex items-center gap-3 text-left flex-1"
                  >
                    {task.done ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-olive/40 flex-shrink-0" />
                    )}
                    <span className={`text-sm font-body ${task.done ? "line-through text-olive/40" : "text-olive font-medium"}`}>
                      {task.label}
                    </span>
                  </button>

                  <Link
                    href={task.href}
                    className="text-xs text-olive/50 hover:text-olive px-2.5 py-1 rounded-lg hover:bg-white/80 transition-colors font-body flex items-center gap-1"
                  >
                    Open
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Student Observations */}
          <div className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-bold text-base text-olive flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-pistachio" />
                  Recent Student Development Observations
                </h3>
                <p className="text-xs text-olive/50 font-body mt-0.5">Latest developmental ratings and teacher notes</p>
              </div>
              <Link
                href="/dashboard/teacher/development"
                className="text-xs text-olive/60 hover:text-olive font-body flex items-center gap-1"
              >
                View All
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentObservations.length === 0 ? (
              <div className="text-center py-8 bg-cream/40 rounded-2xl border border-beige/20">
                <Sparkles className="w-8 h-8 text-olive/20 mx-auto mb-2" />
                <p className="text-sm font-medium text-olive/70 font-body">No observations recorded yet</p>
                <p className="text-xs text-olive/40 font-body mt-0.5 mb-3">Record observations across communication, motor, and social skills.</p>
                <Link
                  href="/dashboard/teacher/development"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-pistachio text-white text-xs font-medium font-body"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Observation
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recentObservations.map((obs) => (
                  <div key={obs.id} className="p-4 rounded-2xl bg-cream/30 border border-beige/20">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="font-semibold text-sm text-olive">{obs.studentName}</p>
                      <span className="text-[10px] text-olive/40 font-body">{obs.date}</span>
                    </div>
                    <p className="text-xs text-olive/70 font-body line-clamp-2 italic mb-2.5">
                      &quot;{obs.observation}&quot;
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Comm: {obs.communication}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                        Social: {obs.socialDevelopment}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Quick Links, Announcements, Messages */}
        <div className="space-y-6">
          {/* Quick Hub */}
          <div className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft">
            <h3 className="font-display font-bold text-base text-olive mb-3">Teacher Hub</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/dashboard/teacher/students"
                className="p-3 rounded-2xl bg-cream/40 hover:bg-cream border border-beige/20 flex flex-col items-center text-center transition-all group"
              >
                <div className="w-8 h-8 rounded-xl bg-pistachio/15 text-olive flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-olive font-body">My Students</span>
                <span className="text-[10px] text-olive/40 font-body">{students.length} assigned</span>
              </Link>

              <Link
                href="/dashboard/teacher/activities"
                className="p-3 rounded-2xl bg-cream/40 hover:bg-cream border border-beige/20 flex flex-col items-center text-center transition-all group"
              >
                <div className="w-8 h-8 rounded-xl bg-sage/15 text-olive flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <Palette className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-olive font-body">Activities</span>
                <span className="text-[10px] text-olive/40 font-body">Plan class fun</span>
              </Link>

              <Link
                href="/dashboard/teacher/home-activities"
                className="p-3 rounded-2xl bg-cream/40 hover:bg-cream border border-beige/20 flex flex-col items-center text-center transition-all group"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-olive font-body">Home Fun</span>
                <span className="text-[10px] text-olive/40 font-body">For parents</span>
              </Link>

              <Link
                href="/dashboard/teacher/notes"
                className="p-3 rounded-2xl bg-cream/40 hover:bg-cream border border-beige/20 flex flex-col items-center text-center transition-all group"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-olive font-body">Student Notes</span>
                <span className="text-[10px] text-olive/40 font-body">Observations</span>
              </Link>

              <Link
                href="/dashboard/teacher/messages"
                className="p-3 rounded-2xl bg-cream/40 hover:bg-cream border border-beige/20 flex flex-col items-center text-center transition-all group relative"
              >
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-800 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-olive font-body">Principal Chat</span>
                <span className="text-[10px] text-olive/40 font-body">Direct messages</span>
              </Link>

              <Link
                href="/dashboard/teacher/leave-requests"
                className="p-3 rounded-2xl bg-cream/40 hover:bg-cream border border-beige/20 flex flex-col items-center text-center transition-all group"
              >
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-olive font-body">Apply Leave</span>
                <span className="text-[10px] text-olive/40 font-body">Time off</span>
              </Link>
            </div>
          </div>

          {/* School Announcements */}
          <div className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-sm text-olive flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-amber-500" />
                Announcements
              </h3>
              <Link href="/dashboard/teacher/announcements" className="text-xs text-olive/50 hover:text-olive">
                All
              </Link>
            </div>

            {announcements.length === 0 ? (
              <p className="text-xs text-olive/40 font-body py-3">No active announcements</p>
            ) : (
              <div className="space-y-2.5">
                {announcements.map((ann) => (
                  <div key={ann.id} className="p-3 rounded-xl bg-cream/30 border border-beige/15">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-xs font-semibold text-olive line-clamp-1">{ann.title}</p>
                      {ann.priority === "urgent" && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 font-bold uppercase">
                          Urgent
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-olive/60 font-body line-clamp-2">{ann.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming School Events */}
          <div className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-sm text-olive flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-pistachio" />
                Upcoming Events
              </h3>
              <Link href="/dashboard/teacher/calendar" className="text-xs text-olive/50 hover:text-olive">
                Calendar
              </Link>
            </div>

            {events.length === 0 ? (
              <p className="text-xs text-olive/40 font-body py-3">No upcoming events scheduled</p>
            ) : (
              <div className="space-y-2.5">
                {events.map((evt) => (
                  <div key={evt.id} className="flex items-start gap-3 p-2.5 rounded-xl bg-cream/30 border border-beige/15">
                    <div className="w-10 text-center flex-shrink-0 bg-white rounded-lg p-1 border border-beige/20">
                      <span className="block text-[9px] uppercase font-bold text-olive/40">{evt.date.slice(5, 7)}</span>
                      <span className="block text-sm font-bold text-olive leading-none">{evt.date.slice(8, 10)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-olive line-clamp-1">{evt.title}</p>
                      <p className="text-[10px] text-olive/50 font-body">{evt.time} • {evt.location}</p>
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
