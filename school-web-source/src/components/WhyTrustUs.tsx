"use client"

import { motion } from "framer-motion"
import { Shield, Users, Brain, Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import TiltCard from "@/components/ui/tilt-card"

const cards = [
  { icon: Shield, title: "Safe Environment", desc: "Child-safe classrooms, secure premises, and constant supervision. Your child's safety is our highest priority.", color: "bg-pistachio/10 text-olive" },
  { icon: Users, title: "Experienced Teachers", desc: "Our caring educators are Montessori-trained with years of experience in early childhood development.", color: "bg-sage/10 text-olive" },
  { icon: Brain, title: "Creative Learning", desc: "Hands-on activities, art, music, and play-based learning that sparks curiosity and builds confidence.", color: "bg-cream text-olive" },
  { icon: Heart, title: "Emotional Development", desc: "We nurture social-emotional skills through guided play, group activities, and a warm community.", color: "bg-beige/20 text-olive" },
]

const floatAnimations = [
  { y: [0, -6, 0, -3, 0], duration: 5 },
  { y: [0, -8, 0, -4, 0], duration: 6 },
  { y: [0, -5, 0, -2, 0], duration: 4.5 },
  { y: [0, -7, 0, -3, 0], duration: 5.5 },
]

export default function WhyTrustUs() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-soft-white rounded-3xl border border-beige/30 shadow-soft p-8 md:p-12">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center mb-12 md:mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-pistachio/10 text-olive text-sm font-medium font-display mb-3">Why Parents Trust Us</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-olive leading-tight">A Foundation Built on Love & Learning</h2>
          <p className="mt-4 text-olive/60 text-base md:text-lg max-w-xl mx-auto">We understand the trust you place in us. Here&apos;s what makes Tiny Mind a home away from home.</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {cards.map((card, i) => (
            <TiltCard key={card.title}
              className={cn(
                "group relative bg-soft-white rounded-3xl p-6 md:p-8 shadow-soft hover:shadow-lift transition-shadow duration-500 border border-white/50",
                i % 2 === 0 ? "lg:mt-0" : "lg:mt-12",
              )}
            >
              <motion.div
                animate={{ y: floatAnimations[i].y }}
                transition={{
                  duration: floatAnimations[i].duration,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.4,
                }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <motion.div
                  className={`w-14 h-14 rounded-2xl ${card.color} flex items-center justify-center mb-5`}
                  style={{ transform: "translateZ(30px)" }}
                >
                  <card.icon className="w-7 h-7" />
                </motion.div>
                <motion.h3
                  className="text-lg font-display font-semibold text-olive mb-3"
                  style={{ transform: "translateZ(20px)" }}
                >
                  {card.title}
                </motion.h3>
                <motion.p
                  className="text-sm text-olive/60 leading-relaxed"
                  style={{ transform: "translateZ(10px)" }}
                >
                  {card.desc}
                </motion.p>
                <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-pistachio/0 via-pistachio/20 to-pistachio/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            </TiltCard>
          ))}
          </div>
        </div>
      </div>
    </section>
  )
}
