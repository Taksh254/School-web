"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Users, ClipboardList, Bell, BookOpen, LogOut, User, CheckCircle, Clock, AlertCircle } from "lucide-react"

export default function TeacherDashboard() {
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("role")
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-pistachio/20 flex items-center justify-center"><User className="w-6 h-6 text-olive" /></div>
            <div><h1 className="text-lg font-display font-semibold text-olive">Teacher Dashboard</h1><p className="text-sm text-olive/50">Welcome, Ms. Anita</p></div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-full bg-soft-white text-olive/60 hover:text-olive border border-beige/20 hover:shadow-soft transition-all text-sm">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users, label: "Total Students", value: "18", sub: "Nursery class", color: "bg-pistachio/10" },
            { icon: CheckCircle, label: "Present Today", value: "16", sub: "89% attendance", color: "bg-sage/10" },
            { icon: Clock, label: "Pending Tasks", value: "3", sub: "Reports due", color: "bg-cream" },
            { icon: AlertCircle, label: "Notices", value: "2", sub: "Unread", color: "bg-beige/30" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-soft-white rounded-2xl p-5 border border-beige/20 shadow-soft">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}><s.icon className="w-5 h-5 text-olive" /></div>
              <p className="text-xs text-olive/50 font-medium">{s.label}</p>
              <p className="text-lg font-display font-semibold text-olive">{s.value}</p>
              <p className="text-xs text-olive/40">{s.sub}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft">
            <h2 className="text-base font-display font-semibold text-olive flex items-center gap-2 mb-4"><ClipboardList className="w-4 h-4" /> Today&apos;s Attendance</h2>
            <div className="space-y-2">
              {[
                { name: "Aanya Sharma", status: "Present" },
                { name: "Arjun Verma", status: "Present" },
                { name: "Riya Kapoor", status: "Present" },
                { name: "Kabir Singh", status: "Absent" },
                { name: "Myra Singh", status: "Present" },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-cream">
                  <span className="text-sm text-olive/70">{s.name}</span>
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${s.status === "Present" ? "bg-pistachio/15 text-olive" : "bg-beige/30 text-olive/50"}`}>{s.status}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft">
            <h2 className="text-base font-display font-semibold text-olive flex items-center gap-2 mb-4"><Bell className="w-4 h-4" /> Quick Actions</h2>
            <div className="space-y-3">
              {[
                { label: "Mark Attendance", icon: ClipboardList },
                { label: "Add Assignment", icon: BookOpen },
                { label: "Send Notice", icon: Bell },
              ].map((a, i) => (
                <button key={i} className="w-full flex items-center gap-3 p-3 rounded-xl bg-cream hover:bg-pistachio/10 transition-colors text-left">
                  <div className="w-9 h-9 rounded-xl bg-soft-white flex items-center justify-center"><a.icon className="w-4 h-4 text-olive" /></div>
                  <span className="text-sm font-medium text-olive">{a.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
