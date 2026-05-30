"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Bell, Calendar, CreditCard, BookOpen, MessageCircle, LogOut, User, GraduationCap, Clock, Star } from "lucide-react"

export default function ParentDashboard() {
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
            <div>
              <h1 className="text-lg font-display font-semibold text-olive">Parent Dashboard</h1>
              <p className="text-sm text-olive/50">Welcome back, Priya</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-full bg-soft-white text-olive/60 hover:text-olive border border-beige/20 hover:shadow-soft transition-all text-sm">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: GraduationCap, label: "Attendance", value: "92%", sub: "This month", color: "bg-pistachio/10" },
            { icon: Star, label: "Class", value: "Nursery", sub: "Ms. Anita", color: "bg-sage/10" },
            { icon: Clock, label: "Next Event", value: "Annual Day", sub: "Jun 15", color: "bg-cream" },
            { icon: CreditCard, label: "Fee Status", value: "Paid", sub: "Till Jun 2026", color: "bg-beige/30" },
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-display font-semibold text-olive flex items-center gap-2"><Bell className="w-4 h-4" /> Announcements</h2>
            </div>
            <div className="space-y-3">
              {["Annual Day rehearsal on June 10", "Summer camp registration open", "Parent-teacher meeting June 20"].map((a, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-cream">
                  <span className="w-2 h-2 rounded-full bg-pistachio mt-1.5 shrink-0" />
                  <p className="text-sm text-olive/70">{a}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-display font-semibold text-olive flex items-center gap-2"><MessageCircle className="w-4 h-4" /> Teacher Messages</h2>
            </div>
            <div className="space-y-3">
              {[
                { msg: "Aanya did wonderfully in art class today!", from: "Ms. Anita", time: "2h ago" },
                { msg: "Please send a sun hat for outdoor play", from: "Ms. Anita", time: "1d ago" },
              ].map((m, i) => (
                <div key={i} className="p-3 rounded-xl bg-cream">
                  <p className="text-sm text-olive/70 mb-1">{m.msg}</p>
                  <div className="flex justify-between text-xs text-olive/40"><span>{m.from}</span><span>{m.time}</span></div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
