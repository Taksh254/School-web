"use client"

import { motion } from "framer-motion"
import { Palette, Music, BookOpen, Sun, Globe, Heart } from "lucide-react"

const activities = [
  { icon: Palette, title: "Art & Craft", desc: "Painting, clay modeling, and creative projects that spark imagination.", color: "bg-pistachio/10 text-olive" },
  { icon: Music, title: "Music & Dance", desc: "Rhythm, movement, and songs that develop coordination and joy.", color: "bg-sage/10 text-olive" },
  { icon: BookOpen, title: "Story Time", desc: "Interactive storytelling that builds language skills and a love for reading.", color: "bg-cream text-olive" },
  { icon: Sun, title: "Outdoor Play", desc: "Nature walks, sand play, and garden exploration in our safe outdoor space.", color: "bg-beige/20 text-olive" },
  { icon: Globe, title: "Discovery Time", desc: "Science experiments, puzzles, and hands-on exploration of the world.", color: "bg-pistachio/10 text-olive" },
  { icon: Heart, title: "Mindful Moments", desc: "Simple yoga, breathing exercises, and quiet reflection time.", color: "bg-sage/10 text-olive" },
]

export default function ActivitiesSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-soft-white rounded-3xl border border-beige/30 shadow-soft p-8 md:p-12">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center mb-12 md:mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-pistachio/10 text-olive text-sm font-medium font-display mb-3">Daily Activities</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-olive leading-tight">A Day at Tiny Mind</h2>
          <p className="mt-4 text-olive/60 text-base md:text-lg max-w-xl mx-auto">Every day is filled with purposeful play, creative exploration, and joyful learning.</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {activities.map((a, i) => (
            <motion.div key={a.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
              whileHover={{ y: -3 }} className="bg-soft-white rounded-2xl p-5 md:p-6 border border-beige/20 shadow-soft hover:shadow-card transition-all duration-300">
              <div className={`w-12 h-12 rounded-xl ${a.color} flex items-center justify-center mb-4`}><a.icon className="w-6 h-6" /></div>
              <h3 className="text-base font-display font-semibold text-olive mb-2">{a.title}</h3>
              <p className="text-sm text-olive/60 leading-relaxed">{a.desc}</p>
            </motion.div>
          ))}
          </div>
        </div>
      </div>
    </section>
  )
}
