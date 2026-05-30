"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Users, GraduationCap, CreditCard, BarChart3, LogOut, User, Plus, FileText, Settings } from "lucide-react"

export default function AdminDashboard() {
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
            <div><h1 className="text-lg font-display font-semibold text-olive">Admin Dashboard</h1><p className="text-sm text-olive/50">Welcome, Principal</p></div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-full bg-soft-white text-olive/60 hover:text-olive border border-beige/20 hover:shadow-soft transition-all text-sm">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users, label: "Total Students", value: "124", sub: "+12 this year", color: "bg-pistachio/10" },
            { icon: GraduationCap, label: "Teachers", value: "12", sub: "4 per class", color: "bg-sage/10" },
            { icon: CreditCard, label: "Fee Collection", value: "₹8.2L", sub: "85% collected", color: "bg-cream" },
            { icon: BarChart3, label: "Admissions", value: "28", sub: "2026-27 cycle", color: "bg-beige/30" },
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

        <div className="grid lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="lg:col-span-2 bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft">
            <h2 className="text-base font-display font-semibold text-olive mb-4">Quick Actions</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { icon: Plus, label: "Add Student", color: "bg-pistachio/10" },
                { icon: Users, label: "Manage Teachers", color: "bg-sage/10" },
                { icon: FileText, label: "View Reports", color: "bg-cream" },
                { icon: CreditCard, label: "Fee Records", color: "bg-beige/30" },
                { icon: Settings, label: "Settings", color: "bg-pistachio/5" },
                { icon: GraduationCap, label: "Admissions", color: "bg-sage/5" },
              ].map((a, i) => (
                <button key={i} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-cream hover:bg-pistachio/10 transition-colors">
                  <div className={`w-10 h-10 rounded-xl ${a.color} flex items-center justify-center`}><a.icon className="w-5 h-5 text-olive" /></div>
                  <span className="text-xs font-medium text-olive">{a.label}</span>
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft">
            <h2 className="text-base font-display font-semibold text-olive mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {[
                { text: "New admission: Rohan Mehta", time: "2h ago" },
                { text: "Fee paid: Aanya Sharma", time: "4h ago" },
                { text: "Teacher meeting scheduled", time: "1d ago" },
                { text: "Attendance report generated", time: "1d ago" },
              ].map((a, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-pistachio mt-1.5 shrink-0" />
                  <div><p className="text-sm text-olive/70">{a.text}</p><p className="text-xs text-olive/40">{a.time}</p></div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
