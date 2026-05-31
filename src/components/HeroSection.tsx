"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import Link from "next/link"
import { ArrowRight, Leaf } from "lucide-react"
import HeroCarousel from "@/components/HeroCarousel"
import PixelArtBackground from "@/components/PixelArtBackground"

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  })
  const textX = useTransform(scrollYProgress, [0, 0.7], [0, -800])
  const carouselOpacity = useTransform(scrollYProgress, [0, 0.35, 0.55], [1, 1, 0])
  const textOpacity = useTransform(scrollYProgress, [0, 0.45, 0.7], [1, 1, 0])

  return (
    <section ref={sectionRef} className="relative min-h-[85vh] md:min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-b from-soft-white via-cream to-cream">
      <PixelArtBackground />
      <div className="absolute inset-0 pointer-events-none paper-texture" />

      <motion.div className="absolute top-16 left-[12%] text-pistachio/25" animate={{ y: [0, -8, 0], rotate: [0, 5, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
        <Leaf className="w-6 h-6" />
      </motion.div>
      <motion.div className="absolute bottom-24 right-[10%] text-sage/20" animate={{ y: [0, -6, 0], rotate: [0, -3, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}>
        <Leaf className="w-5 h-5" />
      </motion.div>
      <motion.div className="absolute top-1/3 right-[5%] w-2.5 h-2.5 rounded-full bg-pistachio/20" animate={{ opacity: [0.2, 0.7, 0.2] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="absolute bottom-1/3 left-[5%] w-3 h-3 rounded-full bg-sage/15" animate={{ opacity: [0.15, 0.6, 0.15] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }} />
      <motion.div className="absolute top-1/4 left-[3%] text-pistachio/10 text-2xl" animate={{ rotate: [0, 15, 0], scale: [1, 1.1, 1] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>✦</motion.div>
      <motion.div className="absolute bottom-1/4 right-[3%] text-sage/10 text-xl" animate={{ rotate: [0, -10, 0], scale: [1, 1.15, 1] }} transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}>✦</motion.div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div style={{ x: textX, opacity: textOpacity }} className="text-center lg:text-left">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pistachio/10 text-olive text-sm font-display font-medium mb-6">
                  <span className="w-2 h-2 rounded-full bg-pistachio animate-float" />
                  Welcome to Happy Kids Preschool
                </span>
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold text-olive leading-[1.1] tracking-tight">
                Where Little Minds
                <span className="block text-pistachio mt-1">Grow With Joy</span>
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-6 text-lg md:text-xl text-olive/60 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                A warm, nurturing space where your child&apos;s first steps into learning are filled with curiosity, creativity, and joy.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-8 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Link href="/contact"
                  className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-pistachio to-sage text-white font-medium text-base shadow-soft hover:shadow-lift hover:-translate-y-0.5 transition-all duration-300">
                  Book a Visit <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link href="/programs"
                  className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full border-2 border-pistachio/30 text-olive font-medium text-base hover:bg-cream hover:border-pistachio/50 transition-all duration-300">
                  Explore Programs
                </Link>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.5 }}
                className="mt-10 flex flex-wrap items-center gap-6 justify-center lg:justify-start text-sm text-olive/50">
                {["Montessori Inspired", "Age 2-6 Years", "Certified Teachers", "Safe Environment"].map((item) => (
                  <span key={item} className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-pistachio" />{item}</span>
                ))}
              </motion.div>
            </motion.div>

            <motion.div style={{ opacity: carouselOpacity }}><HeroCarousel /></motion.div>
        </div>
      </div>
    </section>
  )
}
