"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { 
  CalendarCheck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RotateCcw, 
  Save, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  GraduationCap,
  Sparkles,
  Search
} from "lucide-react"

type AttendanceState = "present" | "absent" | "leave"

interface StudentItem {
  id: string
  name: string
  age: number
  program: string
  section: string
  admissionNo: string
  photo?: string
}

/**
 * Returns today's date formatted as YYYY-MM-DD in India Standard Time (IST)
 */
function getTodayIST(): string {
  const now = new Date()
  const istOffset = 5.5 * 60 * 60 * 1000 // UTC +5:30
  const istDate = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + istOffset)
  const y = istDate.getFullYear()
  const m = String(istDate.getMonth() + 1).padStart(2, "0")
  const d = String(istDate.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function formatDateDisplay(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split("-").map(Number)
    const date = new Date(y, m - 1, d)
    return date.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good Morning"
  if (hour < 17) return "Good Afternoon"
  return "Good Evening"
}

export default function TeacherAttendancePage() {
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState<string>(getTodayIST())
  const [students, setStudents] = useState<StudentItem[]>([])
  const [teacherInfo, setTeacherInfo] = useState<{ full_name?: string; department?: string } | null>(null)
  const [attendance, setAttendance] = useState<Record<string, AttendanceState>>({})
  const [initialAttendance, setInitialAttendance] = useState<Record<string, AttendanceState>>({})
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successBanner, setSuccessBanner] = useState<string | null>(null)
  const [errorBanner, setErrorBanner] = useState<string | null>(null)
  const [hasExistingData, setHasExistingData] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Filter roster by student name or admission number
  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students
    const q = searchQuery.toLowerCase().trim()
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.admissionNo && s.admissionNo.toLowerCase().includes(q)) ||
        (s.program && s.program.toLowerCase().includes(q))
    )
  }, [students, searchQuery])

  // Fetch students & existing attendance for selected date
  const loadData = useCallback(async (date: string) => {
    setLoading(true)
    setErrorBanner(null)
    setSuccessBanner(null)

    try {
      const res = await fetch(`/api/teacher-attendance?date=${date}`, { cache: "no-store" })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || "Failed to load class attendance.")
      }

      const data = await res.json()
      const studentList: StudentItem[] = data.students || []
      const existingMap: Record<string, any> = data.attendance || {}

      setStudents(studentList)
      if (data.teacher) setTeacherInfo(data.teacher)

      // Determine state for each student:
      // If attendance already saved for this date -> use saved status
      // Otherwise -> DEFAULT ALL TO "present"
      const statusMap: Record<string, AttendanceState> = {}
      let foundExisting = false

      studentList.forEach((s) => {
        if (existingMap[s.id]) {
          foundExisting = true
          const st = existingMap[s.id].status
          statusMap[s.id] = (st === "absent" || st === "leave") ? st : "present"
        } else {
          statusMap[s.id] = "present"
        }
      })

      setHasExistingData(foundExisting)
      setAttendance(statusMap)
      setInitialAttendance({ ...statusMap })
    } catch (err: any) {
      console.error("[TeacherAttendance] Load error:", err)
      setErrorBanner(err?.message || "Could not load students. Please check your connection.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData(selectedDate)
  }, [selectedDate, loadData])

  // Quick 1-tap toggle for single student
  const setStatus = (studentId: string, status: AttendanceState) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }))
    setSuccessBanner(null)
  }

  // Bulk: Mark All Present
  const markAllPresent = () => {
    const updated: Record<string, AttendanceState> = {}
    students.forEach((s) => {
      updated[s.id] = "present"
    })
    setAttendance(updated)
    setSuccessBanner(null)
  }

  // Bulk: Reset Attendance (Revert to initial or all present)
  const resetAttendance = () => {
    setAttendance({ ...initialAttendance })
    setSuccessBanner(null)
  }

  // Save Attendance
  const handleSave = async () => {
    if (students.length === 0) return
    setSaving(true)
    setErrorBanner(null)
    setSuccessBanner(null)

    const records = students.map((s) => ({
      studentId: s.id,
      status: attendance[s.id] || "present",
    }))

    try {
      const res = await fetch("/api/teacher-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          records,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || "Failed to save attendance.")
      }

      setSuccessBanner("Attendance saved successfully ✓")
      setHasExistingData(true)
      setInitialAttendance({ ...attendance })
    } catch (err: any) {
      console.error("[TeacherAttendance] Save error:", err)
      setErrorBanner("We couldn't save attendance. Please check your connection and try again.")
    } finally {
      setSaving(false)
    }
  }

  // Stats calculation
  const stats = useMemo(() => {
    let present = 0
    let absent = 0
    let leave = 0
    students.forEach((s) => {
      const st = attendance[s.id] || "present"
      if (st === "present") present++
      else if (st === "absent") absent++
      else if (st === "leave") leave++
    })
    const total = students.length
    return { present, absent, leave, total }
  }, [students, attendance])

  // Date Navigation (Previous / Next Day)
  const adjustDate = (days: number) => {
    const [y, m, d] = selectedDate.split("-").map(Number)
    const cur = new Date(y, m - 1, d)
    cur.setDate(cur.getDate() + days)
    const newY = cur.getFullYear()
    const newM = String(cur.getMonth() + 1).padStart(2, "0")
    const newD = String(cur.getDate()).padStart(2, "0")
    setSelectedDate(`${newY}-${newM}-${newD}`)
  }

  const teacherName = teacherInfo?.full_name || user?.name || "Teacher"
  const isToday = selectedDate === getTodayIST()

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* ── HEADER & GREETING ────────────────────────────────────────── */}
      <div className="bg-soft-white rounded-3xl p-6 sm:p-8 border border-beige/25 shadow-soft relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-pistachio/15 to-sage/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pistachio/15 text-olive text-xs font-display font-medium mb-2">
              <Sparkles className="w-3 h-3 text-pistachio" />
              Teacher Attendance Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-olive">
              {getGreeting()}, {teacherName} 👋
            </h1>
            <p className="text-xs sm:text-sm text-olive/60 font-body mt-1">
              {students.length > 0
                ? `${students.length} students assigned • Mark class attendance in under a minute`
                : "Manage and record student daily attendance"}
            </p>
          </div>

          {/* Quick Date Control */}
          <div className="flex items-center gap-2 bg-cream/70 p-2 rounded-2xl border border-beige/20 shrink-0">
            <button
              onClick={() => adjustDate(-1)}
              className="w-8 h-8 rounded-xl bg-white hover:bg-beige/20 text-olive flex items-center justify-center transition-colors shadow-xs"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs sm:text-sm font-display font-semibold text-olive outline-none px-2 cursor-pointer"
            />
            <button
              onClick={() => adjustDate(1)}
              className="w-8 h-8 rounded-xl bg-white hover:bg-beige/20 text-olive flex items-center justify-center transition-colors shadow-xs"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Date Display Pill */}
        <div className="mt-4 pt-4 border-t border-beige/15 flex flex-wrap items-center justify-between gap-2 text-xs font-body text-olive/60">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-olive">{formatDateDisplay(selectedDate)}</span>
            {isToday && (
              <span className="px-2 py-0.5 rounded-md bg-pistachio text-white font-medium text-[10px]">
                Today
              </span>
            )}
            {hasExistingData && (
              <span className="px-2 py-0.5 rounded-md bg-olive/10 text-olive text-[10px] font-medium">
                Saved Record
              </span>
            )}
          </div>

          {!isToday && (
            <button
              onClick={() => setSelectedDate(getTodayIST())}
              className="text-xs text-olive font-medium hover:underline"
            >
              Jump to Today →
            </button>
          )}
        </div>
      </div>

      {/* ── BANNERS ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {successBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-body flex items-center justify-between shadow-soft"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successBanner}</span>
            </div>
            <button
              onClick={() => setSuccessBanner(null)}
              className="text-emerald-600 hover:text-emerald-800 text-lg font-bold"
            >
              ×
            </button>
          </motion.div>
        )}

        {errorBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-body flex items-center justify-between shadow-soft"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorBanner}</span>
            </div>
            <button
              onClick={() => setErrorBanner(null)}
              className="text-rose-600 hover:text-rose-800 text-lg font-bold"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SUMMARY STATS & BULK ACTIONS ─────────────────────────────── */}
      {students.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-soft-white rounded-2xl p-4 border border-beige/25 shadow-soft flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pistachio/15 flex items-center justify-center text-olive shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-olive/50 font-body uppercase tracking-wider">Total Class</p>
              <p className="text-xl font-display font-bold text-olive">{stats.total}</p>
            </div>
          </div>

          <div className="bg-soft-white rounded-2xl p-4 border border-emerald-200/50 shadow-soft flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100/70 flex items-center justify-center text-emerald-700 shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-emerald-800/60 font-body uppercase tracking-wider">Present</p>
              <p className="text-xl font-display font-bold text-emerald-700">{stats.present}</p>
            </div>
          </div>

          <div className="bg-soft-white rounded-2xl p-4 border border-rose-200/50 shadow-soft flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100/70 flex items-center justify-center text-rose-700 shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-rose-800/60 font-body uppercase tracking-wider">Absent</p>
              <p className="text-xl font-display font-bold text-rose-700">{stats.absent}</p>
            </div>
          </div>

          <div className="bg-soft-white rounded-2xl p-4 border border-amber-200/50 shadow-soft flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100/70 flex items-center justify-center text-amber-700 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-amber-800/60 font-body uppercase tracking-wider">On Leave</p>
              <p className="text-xl font-display font-bold text-amber-700">{stats.leave}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── BULK ACTION TOOLBAR ──────────────────────────────────────── */}
      {students.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-cream/50 p-3.5 rounded-2xl border border-beige/20">
          <div className="flex items-center gap-2">
            <button
              onClick={markAllPresent}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-soft-white hover:bg-white text-olive text-xs font-medium border border-beige/20 shadow-xs transition-all"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              Mark All Present
            </button>

            <button
              onClick={resetAttendance}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-soft-white hover:bg-white text-olive/60 hover:text-olive text-xs font-medium border border-beige/20 shadow-xs transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5 text-olive/50" />
              Reset
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-display font-semibold shadow-soft hover:shadow-lift hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Attendance
              </>
            )}
          </button>
        </div>
      )}

      {/* ── SEARCH BAR ─────────────────────────────────────────────── */}
      {students.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 text-olive/40 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students by name, admission number, or program..."
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-soft-white border border-beige/25 text-sm text-olive placeholder:text-olive/40 outline-none focus:border-pistachio focus:ring-2 focus:ring-pistachio/20 transition-all font-body shadow-soft"
          />
        </div>
      )}

      {/* ── STUDENTS ATTENDANCE LIST ─────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[320px] bg-soft-white rounded-3xl border border-beige/25">
          <div className="w-9 h-9 rounded-full border-3 border-pistachio border-t-transparent animate-spin mb-3" />
          <p className="text-sm font-body text-olive/60">Loading class roster...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="bg-soft-white rounded-3xl p-10 border border-beige/25 text-center shadow-soft">
          <div className="w-14 h-14 rounded-2xl bg-cream flex items-center justify-center text-olive/40 mx-auto mb-3">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-display font-bold text-olive mb-1">No students assigned yet</h3>
          <p className="text-sm text-olive/60 font-body max-w-md mx-auto mb-4">
            You currently do not have any students assigned to your class. Please contact the school administrator.
          </p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-soft-white rounded-3xl p-8 border border-beige/25 text-center shadow-soft">
          <p className="text-sm font-display font-semibold text-olive/70">No matching students found</p>
          <p className="text-xs text-olive/40 font-body mt-1">Try clearing your search query.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredStudents.map((student, idx) => {
            const currentStatus = attendance[student.id] || "present"

            return (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.3) }}
                className={`bg-soft-white rounded-2xl p-4 border transition-all duration-200 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  currentStatus === "present"
                    ? "border-emerald-200/60 bg-emerald-50/10"
                    : currentStatus === "absent"
                    ? "border-rose-200 bg-rose-50/20"
                    : "border-amber-200 bg-amber-50/20"
                }`}
              >
                {/* Student Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pistachio/20 to-cream flex items-center justify-center font-display font-bold text-sm text-olive shrink-0 border border-beige/20 shadow-xs">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-display font-bold text-olive truncate">
                        {student.name}
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cream text-olive/60 font-mono font-medium border border-beige/20">
                        {student.admissionNo || "ADM"}
                      </span>
                    </div>
                    <p className="text-xs text-olive/50 font-body">
                      {student.program} • Sec {student.section || "A"} • Age {student.age}
                    </p>
                  </div>
                </div>

                {/* 3-State Toggle Buttons (Optimized for Touch & Fast Desktop Clicking) */}
                <div className="grid grid-cols-3 gap-2 shrink-0 w-full md:w-auto mt-2 md:mt-0">
                  {/* PRESENT BUTTON */}
                  <button
                    type="button"
                    onClick={() => setStatus(student.id, "present")}
                    className={`flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold font-body transition-all duration-150 ${
                      currentStatus === "present"
                        ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30 scale-[1.02]"
                        : "bg-cream/80 text-olive/70 hover:bg-emerald-50 hover:text-emerald-700 border border-beige/20"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${currentStatus === "present" ? "bg-white" : "bg-emerald-500"}`} />
                    Present
                  </button>

                  {/* ABSENT BUTTON */}
                  <button
                    type="button"
                    onClick={() => setStatus(student.id, "absent")}
                    className={`flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold font-body transition-all duration-150 ${
                      currentStatus === "absent"
                        ? "bg-rose-600 text-white shadow-sm ring-2 ring-rose-600/30 scale-[1.02]"
                        : "bg-cream/80 text-olive/70 hover:bg-rose-50 hover:text-rose-700 border border-beige/20"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${currentStatus === "absent" ? "bg-white" : "bg-rose-500"}`} />
                    Absent
                  </button>

                  {/* ON LEAVE BUTTON */}
                  <button
                    type="button"
                    onClick={() => setStatus(student.id, "leave")}
                    className={`flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold font-body transition-all duration-150 ${
                      currentStatus === "leave"
                        ? "bg-amber-500 text-white shadow-sm ring-2 ring-amber-500/30 scale-[1.02]"
                        : "bg-cream/80 text-olive/70 hover:bg-amber-50 hover:text-amber-700 border border-beige/20"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${currentStatus === "leave" ? "bg-white" : "bg-amber-500"}`} />
                    On Leave
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* ── STICKY BOTTOM SAVE BUTTON FOR MOBILE ──────────────────────── */}
      {students.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 lg:hidden">
          <div className="bg-soft-white/95 backdrop-blur-md p-3 rounded-2xl border border-beige/30 shadow-lift flex items-center justify-between gap-3">
            <div className="text-xs font-body pl-1">
              <span className="text-emerald-700 font-semibold">{stats.present}P</span> •{" "}
              <span className="text-rose-700 font-semibold">{stats.absent}A</span> •{" "}
              <span className="text-amber-700 font-semibold">{stats.leave}L</span>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pistachio to-sage text-white text-sm font-semibold shadow-soft flex items-center gap-2"
            >
              {saving ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Attendance
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
