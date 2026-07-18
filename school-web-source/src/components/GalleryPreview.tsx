"use client"

import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

const items = [
  { title: "Outdoor Play Time", emoji: "🌳", bg: "bg-pistachio/10", span: "row-span-2" },
  { title: "Art & Craft", emoji: "🎨", bg: "bg-sage/10" },
  { title: "Story Time", emoji: "📖", bg: "bg-cream" },
  { title: "Music & Movement", emoji: "🎵", bg: "bg-beige/30" },
  { title: "Garden Fun", emoji: "🌻", bg: "bg-pistachio/5" },
  { title: "Little Chefs", emoji: "👩‍🍳", bg: "bg-sage/5" },
  { title: "Circle Time", emoji: "🌈", bg: "bg-cream" },
]

export default function GalleryPreview() {
  return (
    <section className="py-20 md:py-28 bg-soft-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center mb-12 md:mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-pistachio/10 text-olive text-sm font-medium font-display mb-3">Gallery</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-olive leading-tight">Moments That Matter</h2>
          <p className="mt-4 text-olive/60 text-base md:text-lg max-w-xl mx-auto">A glimpse into the joyful everyday moments at Tiny Mind.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 auto-rows-[120px] md:auto-rows-[180px]">
          {items.map((item, i) => (
            <motion.div key={item.title} whileHover={{ scale: 1.02 }}
              className={`relative rounded-2xl md:rounded-3xl overflow-hidden ${item.bg} ${item.span || ""} cursor-pointer group shadow-sm`}>
              <div className="absolute inset-0 bg-gradient-to-t from-olive/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 md:w-16 md:h-16 mx-auto rounded-xl bg-white/20 flex items-center justify-center">
                  <span className="text-2xl md:text-3xl">{item.emoji}</span>
                </div>
              </div>
              <div className="absolute bottom-2 left-3 right-3"><p className="text-xs text-olive/50 font-medium truncate">{item.title}</p></div>
            </motion.div>
          ))}
          <Link href="/gallery"
            className="relative rounded-2xl md:rounded-3xl overflow-hidden bg-pistachio/10 border-2 border-dashed border-pistachio/20 flex items-center justify-center group hover:bg-pistachio/15 transition-colors">
            <span className="flex items-center gap-2 text-sm font-display font-medium text-olive group-hover:gap-3 transition-all">View All <ArrowRight className="w-4 h-4" /></span>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
