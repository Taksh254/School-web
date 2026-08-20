"use client"

import { motion } from "framer-motion"
import CountUp from "@/components/ui/CountUp"
import { Users, Award, Heart, Sparkles } from "lucide-react"

const stats = [
  { icon: Users, value: 500, suffix: "+", label: "Happy Children", desc: "Nurtured with care" },
  { icon: Award, value: 8, suffix: "+", label: "Years of Excellence", desc: "Trusted by parents" },
  { icon: Sparkles, value: 15, suffix: "+", label: "Certified Educators", desc: "Montessori trained" },
  { icon: Heart, value: 100, suffix: "%", label: "Joyful Learning", desc: "Child-first philosophy" },
]

export default function StatsSection() {
  return (
    <section className="py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-r from-pistachio/15 via-cream to-sage/15 rounded-3xl p-8 md:p-12 border border-beige/30 shadow-soft"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center flex flex-col items-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-soft-white shadow-soft flex items-center justify-center text-olive mb-3">
                  <stat.icon className="w-6 h-6 text-pistachio" />
                </div>
                <div className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-olive tracking-tight">
                  <CountUp to={stat.value} suffix={stat.suffix} duration={2} />
                </div>
                <div className="text-sm font-semibold text-olive mt-1 font-body">{stat.label}</div>
                <div className="text-xs text-olive/50 font-body">{stat.desc}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
