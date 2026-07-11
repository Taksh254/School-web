"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Baby, Sprout, TreePine, Music, Clock, Users, BookOpen, Sun, ChevronDown } from "lucide-react"
import Link from "next/link"

const programs = [
  { id: "pg", icon: Baby, title: "Play Group", age: "2-3 Years", ratio: "1:6", timing: "9AM-12PM", color: "bg-pistachio/10 text-olive",
    desc: "A gentle, loving introduction to school life through sensory-rich activities, free play, and guided exploration. Your child will build confidence, social skills, and a love for learning.",
    highlights: ["Sensory play with natural materials", "Music and movement sessions", "Story time with puppets", "Outdoor nature exploration", "Art and messy play", "Social skills through group activities"],
    schedule: "Half-day (3 hours)" },
  { id: "nursery", icon: Sprout, title: "Nursery", age: "3-4 Years", ratio: "1:8", timing: "9AM-1PM", color: "bg-sage/10 text-olive",
    desc: "Building on the foundation of play, introducing more structured learning in language, numeracy, and creative expression through hands-on activities.",
    highlights: ["Early literacy through phonics", "Number concepts with Montessori materials", "Creative arts and crafts", "Show and tell for confidence", "Writing readiness", "Collaborative projects"],
    schedule: "Extended half-day (4 hours)" },
  { id: "lkg", icon: TreePine, title: "LKG", age: "4-5 Years", ratio: "1:10", timing: "8:30AM-1:30PM", color: "bg-cream text-olive",
    desc: "Introducing formal language, math concepts, and science exploration while maintaining active play-based learning. Prepares children for the transition to advanced pre-primary education.",
    highlights: ["Introduction to reading & writing", "Structured mathematics concepts", "Sensory science experiments", "Interactive public speaking", "Cognitive skill games", "Creative building & construction"],
    schedule: "Extended day (5 hours)" },
  { id: "ukg", icon: TreePine, title: "UKG", age: "5-6 Years", ratio: "1:12", timing: "8:30AM-2:30PM", color: "bg-beige/20 text-olive",
    desc: "Focused on school readiness and advanced pre-primary curriculum. Ensuring smooth transition to primary schools with strong language, mathematical, and social skills.",
    highlights: ["Advanced phonics & spelling", "Basic arithmetic & operations", "Environmental science & botany", "Independent reading programs", "Creative writing & journal keeping", "Primary school readiness curriculum"],
    schedule: "Full-day (6 hours)" },
  { id: "activities", icon: Music, title: "Activity Classes", age: "2-6 Years", ratio: "1:8", timing: "Varies", color: "bg-beige/30 text-olive",
    desc: "Enrichment programs that help children discover their unique talents through art, music, dance, and yoga. Each class is a new adventure.",
    highlights: ["Art & Craft: Creative expression", "Music & Dance: Rhythm and movement", "Yoga & Mindfulness: Calm and focus", "Cooking Fun: Simple recipes", "Nature Club: Gardening", "Little Chefs: Cooking experiences"],
    schedule: "Weekly sessions (1 hour)" },
]

export default function ProgramsPage() {
  const [expanded, setExpanded] = useState("pg")

  return (
    <>
      <section className="mx-4 sm:mx-6 lg:mx-8 my-8 md:my-12 py-12 md:py-20 rounded-[2rem] md:rounded-[3rem] bg-white/60 backdrop-blur-md border border-white/40 overflow-hidden shadow-soft min-h-[calc(100vh-6rem)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto text-center mb-12 md:mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-pistachio/10 text-olive text-sm font-medium font-display mb-3">Our Programs</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-olive leading-tight">Designed for Every Stage</h2>
            <p className="mt-4 text-olive/60 text-base md:text-lg">Age-appropriate programs that nurture your child&apos;s natural curiosity.</p>
          </motion.div>

          <div className="max-w-4xl mx-auto mt-8 space-y-4">
            {programs.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.1 }}
                className={`rounded-3xl border border-beige/20 overflow-hidden transition-all ${expanded === p.id ? "shadow-card" : "shadow-soft hover:shadow-card"}`}>
                <button onClick={() => setExpanded(expanded === p.id ? "" : p.id)}
                  className="w-full flex items-center gap-4 p-5 md:p-6 bg-soft-white text-left">
                  <div className={`w-12 h-12 rounded-xl ${p.color} flex items-center justify-center shrink-0`}><p.icon className="w-6 h-6" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <h3 className="text-lg font-display font-semibold text-olive">{p.title}</h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-pistachio/10 text-olive text-xs font-medium">{p.age}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-olive/50">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Ratio {p.ratio}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {p.timing}</span>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-olive/30 transition-transform duration-300 ${expanded === p.id ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {expanded === p.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                      <div className="px-5 md:px-6 pb-6 bg-soft-white border-t border-beige/10">
                        <p className="text-sm text-olive/70 leading-relaxed mb-6">{p.desc}</p>
                        <div className="grid sm:grid-cols-2 gap-3 mb-6">
                          {p.highlights.map((h) => (
                            <div key={h} className="flex items-center gap-2.5 text-sm text-olive/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-pistachio shrink-0" />{h}
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm bg-cream rounded-xl p-4">
                          <span className="flex items-center gap-2 text-olive/60"><Sun className="w-4 h-4 text-pistachio" />{p.schedule}</span>
                          <span className="flex items-center gap-2 text-olive/60"><BookOpen className="w-4 h-4 text-pistachio" />Contact us for fee</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-4 sm:mx-6 lg:mx-8 my-8 md:my-12 py-12 md:py-20 rounded-[2rem] md:rounded-[3rem] bg-pistachio/10 backdrop-blur-md border border-white/40 overflow-hidden shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-olive mb-4">Not Sure Which Program Fits Best?</h2>
          <p className="text-olive/60 max-w-lg mx-auto mb-8">We&apos;re happy to guide you. Schedule a visit and let us help you find the perfect start.</p>
          <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-pistachio to-sage text-white font-medium shadow-soft hover:shadow-lift hover:-translate-y-0.5 transition-all duration-300">Schedule a Visit</Link>
        </div>
      </section>
    </>
  )
}
