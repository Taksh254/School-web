"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { getStudents, getFees, getAnnouncements } from "@/lib/data-store"
import StatCard from "@/components/dashboard/StatCard"
import { Users, CreditCard, BarChart3, GraduationCap, Bell, TrendingUp, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function AdminDashboard() {
  const [totalStudents, setTotalStudents] = useState(0)
  const [totalCollected, setTotalCollected] = useState(0)
  const [totalPending, setTotalPending] = useState(0)
  const [collectionRate, setCollectionRate] = useState(0)
  const [classCounts, setClassCounts] = useState<{ name: string; count: number }[]>([])
  const [recentAnnouncements, setRecentAnnouncements] = useState<{ title: string; date: string }[]>([])

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAdminData = async () => {
      setLoading(true)
      try {
        const [students, fees, announcements] = await Promise.all([
          getStudents(),
          getFees(),
          getAnnouncements(),
        ])

        setTotalStudents(students.length)

        const collected = fees.reduce((s, f) => s + f.paidAmount, 0)
        const total = fees.reduce((s, f) => s + f.amount, 0)
        setTotalCollected(collected)
        setTotalPending(total - collected)
        setCollectionRate(total > 0 ? Math.round((collected / total) * 100) : 0)

        // Class breakdown
        const counts: Record<string, number> = {}
        students.forEach((s) => { counts[s.program] = (counts[s.program] || 0) + 1 })
        setClassCounts(Object.entries(counts).map(([name, count]) => ({ name, count })))

        // Recent announcements
        setRecentAnnouncements(announcements.slice(0, 4).map((a) => ({ title: a.title, date: a.date })))
      } catch (err) {
        console.error("Admin dashboard load error:", err)
      } finally {
        setLoading(false)
      }
    }
    loadAdminData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 rounded-full border-2 border-pistachio border-t-transparent animate-spin" />
      </div>
    )
  }

  const maxClassCount = Math.max(...classCounts.map((c) => c.count), 1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-display font-bold text-olive">Admin Dashboard</h1>
        <p className="text-sm text-olive/50 font-body">School overview and analytics</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Students" value={totalStudents} sub="All programs" color="bg-pistachio/10" index={0} href="/dashboard/admin/students" />
        <StatCard icon={CreditCard} label="Fee Collected" value={`₹${(totalCollected / 1000).toFixed(1)}K`} sub={`${collectionRate}% collected`} color="bg-sage/10" index={1} href="/dashboard/admin/fees" />
        <StatCard icon={TrendingUp} label="Pending Fees" value={`₹${(totalPending / 1000).toFixed(1)}K`} sub="To be collected" color="bg-beige/30" index={2} href="/dashboard/admin/fees" />
        <StatCard icon={GraduationCap} label="Programs" value={classCounts.length} sub="Active classes" color="bg-cream" index={3} href="/dashboard/admin/students" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Class Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft"
        >
          <h3 className="text-base font-display font-semibold text-olive mb-5">Students by Program</h3>
          <div className="space-y-4">
            {classCounts.map((cls, i) => (
              <div key={cls.name}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-olive font-body">{cls.name}</span>
                  <span className="text-olive/50 font-body">{cls.count} students</span>
                </div>
                <div className="h-3 rounded-full bg-cream overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(cls.count / maxClassCount) * 100}%` }}
                    transition={{ duration: 0.6, delay: 0.3 + i * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                    className="h-full rounded-full bg-gradient-to-r from-pistachio to-sage"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Fee Collection Bar */}
          <div className="mt-8 pt-6 border-t border-beige/15">
            <h4 className="text-sm font-display font-semibold text-olive mb-3">Fee Collection Rate</h4>
            <div className="h-5 rounded-full bg-cream overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${collectionRate}%` }}
                transition={{ duration: 0.8, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                className="h-full rounded-full bg-gradient-to-r from-pistachio to-sage flex items-center justify-end pr-2"
              >
                <span className="text-[10px] font-medium text-white font-body">{collectionRate}%</span>
              </motion.div>
            </div>
            <div className="flex justify-between mt-1.5 text-xs text-olive/40 font-body">
              <span>₹{totalCollected.toLocaleString("en-IN")} collected</span>
              <span>₹{totalPending.toLocaleString("en-IN")} pending</span>
            </div>
          </div>
        </motion.div>

        {/* Quick Links & Recent Activity */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft"
          >
            <h3 className="text-base font-display font-semibold text-olive mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { href: "/dashboard/admin/students", label: "Manage Students", icon: Users, color: "bg-pistachio/10" },
                { href: "/dashboard/admin/fees", label: "Fee Records", icon: CreditCard, color: "bg-sage/10" },
                { href: "/dashboard/admin/announcements", label: "Announcements", icon: Bell, color: "bg-cream" },
                { href: "/dashboard/admin/reports", label: "View Reports", icon: BarChart3, color: "bg-beige/30" },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-cream/70 transition-colors group"
                >
                  <div className={`w-9 h-9 rounded-lg ${action.color} flex items-center justify-center`}>
                    <action.icon className="w-4 h-4 text-olive" />
                  </div>
                  <span className="text-sm font-medium text-olive/70 group-hover:text-olive transition-colors font-body">{action.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-olive/20 ml-auto group-hover:text-olive/50 transition-colors" />
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Recent Announcements */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft"
          >
            <h3 className="text-base font-display font-semibold text-olive mb-4">Recent Notices</h3>
            <div className="space-y-3">
              {recentAnnouncements.map((a, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-pistachio mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm text-olive/70 font-body">{a.title}</p>
                    <p className="text-xs text-olive/35 font-body">{new Date(a.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
