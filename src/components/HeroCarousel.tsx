"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

const images = [
  "/images/IMG20260519102701.jpg",
  "/images/IMG20260519102805.jpg",
  "/images/IMG20260519103145.jpg",
  "/images/IMG20260519103401.jpg",
  "/images/IMG20260521103820.jpg",
  "/images/IMG20260521103847.jpg",
  "/images/IMG20260521104246.jpg",
  "/images/IMG20260521104727.jpg",
  "/images/IMG20260521111141.jpg",
  "/images/IMG20260522103321.jpg",
  "/images/IMG20260522103533.jpg",
  "/images/IMG_20260519_111244.jpg",
]

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0)
  const [loaded, setLoaded] = useState<Set<number>>(new Set([0]))
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length)
    }, 5000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="relative hidden lg:block"
    >
      <div className="relative aspect-[4/5] rounded-4xl overflow-hidden bg-beige/30 shadow-card border border-white/40">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute inset-0"
          >
            <img
              src={images[current]}
              alt="Preschool moments"
              className="w-full h-full object-cover"
              onLoad={() => setLoaded((prev) => new Set(prev).add(current))}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-olive/20 via-transparent to-transparent" />
          </motion.div>
        </AnimatePresence>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`transition-all duration-500 rounded-full ${
                i === current
                  ? "w-6 h-1.5 bg-white/80"
                  : "w-1.5 h-1.5 bg-white/40 hover:bg-white/60"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="absolute -bottom-8 -left-8 bg-soft-white rounded-3xl p-4 shadow-card border border-beige/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-pistachio/15 flex items-center justify-center text-xl">🎨</div>
          <div>
            <p className="text-sm font-display font-semibold text-olive">Creative Learning</p>
            <p className="text-xs text-olive/50">Hands-on activities</p>
          </div>
        </div>
      </div>
      <div className="absolute -top-6 -right-6 bg-soft-white rounded-3xl p-4 shadow-card border border-beige/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-sage/15 flex items-center justify-center text-xl">🌱</div>
          <div>
            <p className="text-sm font-display font-semibold text-olive">Growing Together</p>
            <p className="text-xs text-olive/50">Age 2-6 years</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
