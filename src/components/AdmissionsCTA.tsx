"use client"

import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export default function AdmissionsCTA() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-pistachio/10 via-cream to-sage/10" />
      <div className="absolute inset-0 paper-texture" />
      <motion.div className="absolute bottom-10 right-[10%] text-pistachio/15 text-3xl" animate={{ y: [0, -8, 0], rotate: [0, 5, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>✦</motion.div>
      <motion.div className="absolute top-10 left-[8%] text-sage/10 text-2xl" animate={{ y: [0, -6, 0], rotate: [0, -5, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}>✦</motion.div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <span className="inline-block px-4 py-1.5 rounded-full bg-pistachio/10 text-olive text-sm font-medium font-display mb-4">Admissions Open</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-olive leading-tight mb-4">
            Ready to Begin This Beautiful Journey?
          </h2>
          <p className="text-olive/60 text-base md:text-lg max-w-xl mx-auto mb-8">
            Give your child the gift of a joyful, nurturing early education. We&apos;d love to welcome you to the Happy Kids family.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/admissions"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-pistachio to-sage text-white font-medium shadow-soft hover:shadow-lift hover:-translate-y-0.5 transition-all duration-300">
              Start Your Application <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/contact"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border-2 border-pistachio/30 text-olive font-medium hover:bg-cream hover:border-pistachio/50 transition-all duration-300">
              Schedule a Visit
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
