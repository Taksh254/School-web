"use client"

import { motion } from "framer-motion"
import { Baby, Sprout, TreePine, Music, ArrowRight } from "lucide-react"
import Link from "next/link"

const programs = [
  { icon: Baby, title: "Play Group", age: "2-3 Years", desc: "A gentle introduction to school life through sensory play, music, and guided exploration in a warm environment.", color: "bg-pistachio/10 text-olive" },
  { icon: Sprout, title: "Nursery", age: "3-4 Years", desc: "Building independence and curiosity through structured play, creative arts, and early language concepts.", color: "bg-sage/10 text-olive" },
  { icon: TreePine, title: "Kindergarten", age: "4-6 Years", desc: "Preparing confident learners for primary school with a balanced approach to academics and social skills.", color: "bg-cream text-olive" },
  { icon: Music, title: "Activity Classes", age: "2-6 Years", desc: "Enrichment programs including art, music, dance, and yoga that nurture individual talents.", color: "bg-beige/20 text-olive" },
]

export default function ProgramsSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-soft-white rounded-3xl border border-beige/30 shadow-soft p-8 md:p-12">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center mb-12 md:mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-pistachio/10 text-olive text-sm font-medium font-display mb-3">Our Programs</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-olive leading-tight">Designed for Every Stage</h2>
          <p className="mt-4 text-olive/60 text-base md:text-lg max-w-xl mx-auto">Age-appropriate programs that nurture your child&apos;s natural curiosity and love for learning.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {programs.map((p, i) => (
            <motion.div key={p.title}
              initial={{ opacity: 0, x: i % 2 === 0 ? -80 : 80, y: 30 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: false, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: [0.25, 0.1, 0.25, 1] }}
              whileHover={{ y: -4 }}
              className="group relative bg-soft-white rounded-3xl p-6 md:p-8 border border-white/50 shadow-soft hover:shadow-card transition-shadow duration-300">
              <div className="flex items-start gap-4 md:gap-6">
                <div className={`w-14 h-14 rounded-2xl ${p.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                  <p.icon className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-1">
                    <h3 className="text-xl font-display font-semibold text-olive">{p.title}</h3>
                    <span className="px-3 py-0.5 rounded-full bg-pistachio/10 text-olive text-xs font-medium">{p.age}</span>
                  </div>
                  <p className="text-sm text-olive/60 leading-relaxed mb-4">{p.desc}</p>
                  <Link href="/programs" className="inline-flex items-center gap-1.5 text-sm font-medium text-olive hover:text-pistachio transition-colors group/link">
                    Learn more <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
          </div>
        </div>
      </div>
    </section>
  )
}
