"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { getStudents, getFees, getAttendance } from "@/lib/data-store"
import StatCard from "@/components/dashboard/StatCard"
import { Users, CreditCard, CalendarCheck, TrendingUp, BarChart3 } from "lucide-react"

export default function AdminReportsPage() {
  const [data, setData] = useState({
    totalStudents: 0,
    classCounts: [] as { name: string; count: number }[],
    totalFees: 0,
    totalPaid: 0,
    totalPending: 0,
    collectionRate: 0,
    avgAttendance: 0,
    monthlyFees: [] as { month: string; collected: number; pending: number }[],
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadReportsData = async () => {
      setLoading(true)
      try {
        const [students, fees, attendance] = await Promise.all([
          getStudents(),
          getFees(),
          getAttendance(),
        ])

        const classCounts: Record<string, number> = {}
        students.forEach((s) => { classCounts[s.program] = (classCounts[s.program] || 0) + 1 })

        const totalFees = fees.reduce((s, f) => s + f.amount, 0)
        const totalPaid = fees.reduce((s, f) => s + f.paidAmount, 0)

        // Attendance rate
        const workingDays = attendance.filter((a) => a.status !== "holiday")
        const presentDays = workingDays.filter((a) => a.status === "present")
        const avgAttendance = workingDays.length > 0 ? Math.round((presentDays.length / workingDays.length) * 100) : 0

        // Monthly fee data (mock for chart)
        const monthlyFees = [
          { month: "Jan", collected: 180000, pending: 22000 },
          { month: "Feb", collected: 175000, pending: 28000 },
          { month: "Mar", collected: 190000, pending: 15000 },
          { month: "Apr", collected: totalPaid, pending: totalFees - totalPaid },
          { month: "May", collected: Math.round(totalPaid * 0.9), pending: Math.round((totalFees - totalPaid) * 1.2) },
        ]

        setData({
          totalStudents: students.length,
          classCounts: Object.entries(classCounts).map(([name, count]) => ({ name, count })),
          totalFees,
          totalPaid,
          totalPending: totalFees - totalPaid,
          collectionRate: totalFees > 0 ? Math.round((totalPaid / totalFees) * 100) : 0,
          avgAttendance,
          monthlyFees,
        })
      } catch (err) {
        console.error("Reports page fetch error:", err)
      } finally {
        setLoading(false)
      }
    }
    loadReportsData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 rounded-full border-2 border-pistachio border-t-transparent animate-spin" />
      </div>
    )
  }

  const maxMonthly = Math.max(...data.monthlyFees.map((m) => m.collected + m.pending), 1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-display font-bold text-olive">Reports & Analytics</h1>
        <p className="text-sm text-olive/50 font-body">Comprehensive school performance overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Students" value={data.totalStudents} color="bg-pistachio/10" index={0} />
        <StatCard icon={CreditCard} label="Fee Collected" value={`₹${(data.totalPaid / 1000).toFixed(1)}K`} sub={`${data.collectionRate}% rate`} color="bg-sage/10" index={1} />
        <StatCard icon={TrendingUp} label="Pending Fees" value={`₹${(data.totalPending / 1000).toFixed(1)}K`} color="bg-beige/30" index={2} />
        <StatCard icon={CalendarCheck} label="Avg Attendance" value={`${data.avgAttendance}%`} sub="All classes" color="bg-cream" index={3} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Fee Collection Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft"
        >
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-4 h-4 text-pistachio" />
            <h3 className="text-base font-display font-semibold text-olive">Monthly Fee Collection</h3>
          </div>

          <div className="flex items-end gap-3 h-48">
            {data.monthlyFees.map((m, i) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col items-center justify-end h-40">
                  {/* Pending */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(m.pending / maxMonthly) * 100}%` }}
                    transition={{ duration: 0.5, delay: 0.3 + i * 0.08 }}
                    className="w-full max-w-[36px] rounded-t-lg bg-beige/40"
                  />
                  {/* Collected */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(m.collected / maxMonthly) * 100}%` }}
                    transition={{ duration: 0.5, delay: 0.3 + i * 0.08 }}
                    className="w-full max-w-[36px] rounded-t-lg bg-gradient-to-t from-pistachio to-sage"
                  />
                </div>
                <span className="text-[10px] text-olive/40 font-body mt-1">{m.month}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-4 mt-4 pt-3 border-t border-beige/15">
            <div className="flex items-center gap-1.5 text-xs text-olive/50 font-body">
              <span className="w-2.5 h-2.5 rounded bg-pistachio" /> Collected
            </div>
            <div className="flex items-center gap-1.5 text-xs text-olive/50 font-body">
              <span className="w-2.5 h-2.5 rounded bg-beige/40" /> Pending
            </div>
          </div>
        </motion.div>

        {/* Class-wise Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft"
        >
          <h3 className="text-base font-display font-semibold text-olive mb-5">Class-wise Breakdown</h3>

          <div className="space-y-6">
            {data.classCounts.map((cls, i) => {
              const classStudentIds = (() => {
                // We don't have direct access here, so use percentage
                const pct = Math.round((cls.count / data.totalStudents) * 100)
                return pct
              })()

              return (
                <div key={cls.name}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg ${i === 0 ? "bg-pistachio/10" : i === 1 ? "bg-sage/10" : "bg-cream"} flex items-center justify-center`}>
                        <Users className="w-4 h-4 text-olive" />
                      </div>
                      <span className="text-sm font-medium text-olive font-body">{cls.name}</span>
                    </div>
                    <span className="text-sm font-display font-semibold text-olive">{cls.count} students</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-cream overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${classStudentIds}%` }}
                      transition={{ duration: 0.6, delay: 0.3 + i * 0.1 }}
                      className={`h-full rounded-full ${i === 0 ? "bg-pistachio" : i === 1 ? "bg-sage" : "bg-olive/30"}`}
                    />
                  </div>
                  <p className="text-[10px] text-olive/35 mt-1 font-body">{classStudentIds}% of total enrollment</p>
                </div>
              )
            })}
          </div>

          {/* Attendance Summary */}
          <div className="mt-6 pt-5 border-t border-beige/15">
            <h4 className="text-sm font-display font-semibold text-olive mb-3">Overall Attendance</h4>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 rounded-full bg-cream overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${data.avgAttendance}%` }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="h-full rounded-full bg-gradient-to-r from-pistachio to-sage"
                />
              </div>
              <span className="text-sm font-display font-bold text-olive">{data.avgAttendance}%</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
