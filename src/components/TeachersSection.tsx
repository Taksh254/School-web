"use client"

import { motion } from "framer-motion"
import TiltCard from "@/components/ui/tilt-card"

const teachers = [
  { name: "Ms. Sunita Mehta", role: "Founder & Principal", initial: "S", color: "bg-pistachio/20" },
  { name: "Ms. Priya Kapoor", role: "Head of Curriculum", initial: "P", color: "bg-sage/20" },
  { name: "Ms. Anita Desai", role: "Senior Teacher", initial: "A", color: "bg-cream" },
  { name: "Mr. Rohan Joshi", role: "Activity Coordinator", initial: "R", color: "bg-beige/30" },
]

const floatAnims = [
  { y: [0, -5, 0, -3, 0], duration: 5 },
  { y: [0, -7, 0, -4, 0], duration: 6.5 },
  { y: [0, -4, 0, -2, 0], duration: 4.5 },
  { y: [0, -6, 0, -3, 0], duration: 5.5 },
]

export default function TeachersSection() {
  return (
    <section className="py-20 md:py-28 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center mb-12 md:mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-pistachio/10 text-olive text-sm font-medium font-display mb-3">Our Team</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-olive leading-tight">Meet Our Educators</h2>
          <p className="mt-4 text-olive/60 text-base md:text-lg max-w-xl mx-auto">Passionate, caring, and dedicated to nurturing your child&apos;s potential.</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {teachers.map((t, i) => (
            <motion.div
              key={t.name}
              animate={{ y: floatAnims[i].y }}
              transition={{
                duration: floatAnims[i].duration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.3,
              }}
            >
              <TiltCard
                className="text-center bg-soft-white rounded-3xl p-6 md:p-8 border border-white/50 shadow-soft hover:shadow-lift transition-shadow duration-500"
              >
                <div className={`w-24 h-24 mx-auto rounded-full ${t.color} flex items-center justify-center text-3xl font-display font-bold text-olive mb-5`}>
                  {t.initial}
                </div>
                <h3 className="text-lg font-display font-semibold text-olive">{t.name}</h3>
                <p className="text-sm text-olive/50">{t.role}</p>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
