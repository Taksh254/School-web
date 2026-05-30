"use client"

import { motion } from "framer-motion"
import { Star, Quote } from "lucide-react"

const testimonials = [
  { quote: "Happy Kids has been a second home for our daughter. She's grown so confident and loves going to school every morning. The teachers are incredibly caring.", name: "Priya Sharma", child: "Mother of Aanya", color: "bg-pistachio/5" },
  { quote: "The Montessori approach here is wonderful. Our son has developed such a love for learning. The outdoor play area and art sessions are his favorites.", name: "Rahul & Neha Verma", child: "Parents of Arjun", color: "bg-sage/5" },
  { quote: "We were nervous about starting preschool, but the team made the transition so smooth. The daily updates and photos give us so much peace of mind.", name: "Anita Kapoor", child: "Mother of Riya", color: "bg-cream" },
]

export default function TestimonialsSection() {
  return (
    <section className="py-20 md:py-28 bg-cream relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-soft-white to-transparent pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center mb-12 md:mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-pistachio/10 text-olive text-sm font-medium font-display mb-3">Happy Parents</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-olive leading-tight">What Families Say</h2>
          <p className="mt-4 text-olive/60 text-base md:text-lg max-w-xl mx-auto">Real words from real families who trust us with their little ones.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((t, i) => (
            <motion.div key={t.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -3 }} className={`relative rounded-3xl p-6 md:p-8 ${t.color} border border-beige/20 shadow-soft`}>
              <Quote className="w-8 h-8 text-pistachio/20 absolute top-6 right-6" />
              <div className="flex gap-1 mb-4">{Array.from({ length: 5 }).map((_, i) => (<Star key={i} className="w-4 h-4 fill-pistachio text-pistachio" />))}</div>
              <blockquote className="text-olive/70 text-sm md:text-base leading-relaxed mb-6 italic">&ldquo;{t.quote}&rdquo;</blockquote>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-pistachio/15 flex items-center justify-center text-lg font-display font-semibold text-olive">{t.name.charAt(0)}</div>
                <div><p className="text-sm font-display font-semibold text-olive">{t.name}</p><p className="text-xs text-olive/50">{t.child}</p></div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
