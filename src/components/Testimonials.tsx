"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import SectionHeader from "./SectionHeader";
import AnimatedElement from "./AnimatedElement";

const testimonials = [
  {
    quote:
      "Little Blossoms has been a second home for our daughter. She's grown so confident and loves going to school every morning. The teachers are incredibly caring.",
    name: "Priya Sharma",
    child: "Mother of Aanya (Age 4)",
    rating: 5,
    color: "bg-sage/5",
    accent: "bg-sage/10",
  },
  {
    quote:
      "The Montessori approach here is wonderful. Our son has developed such a love for learning. The outdoor play area and art sessions are his absolute favorites.",
    name: "Rahul & Neha Verma",
    child: "Parents of Arjun (Age 5)",
    rating: 5,
    color: "bg-terracotta/5",
    accent: "bg-terracotta/10",
  },
  {
    quote:
      "We were nervous about starting preschool, but the team made the transition so smooth. The daily updates and photos give us so much peace of mind.",
    name: "Anita Kapoor",
    child: "Mother of Riya (Age 3)",
    rating: 5,
    color: "bg-sage-light/5",
    accent: "bg-sage-light/10",
  },
  {
    quote:
      "Both my children have been through Little Blossoms and the foundation they received here was incredible. They were more than ready for primary school.",
    name: "Vikram Singh",
    child: "Father of Kabir & Myra",
    rating: 5,
    color: "bg-wood/10",
    accent: "bg-wood/20",
  },
];

export default function Testimonials() {
  return (
    <section className="py-16 md:py-24 bg-cream relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-beige/50 to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedElement>
          <SectionHeader
            label="Happy Parents"
            title="What Families Say About Us"
            description="Real words from real families who trust us with their little ones."
          />
        </AnimatedElement>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {testimonials.map((testimonial, index) => (
            <AnimatedElement key={testimonial.name} delay={index * 0.1}>
              <motion.div
                whileHover={{ y: -3 }}
                className={`relative rounded-2xl p-6 md:p-8 ${testimonial.color} border border-wood/15 shadow-sm`}
              >
                <Quote className="w-8 h-8 text-sage/20 absolute top-6 right-6" />

                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-terracotta text-terracotta"
                    />
                  ))}
                </div>

                <blockquote className="text-navy/70 text-sm md:text-base leading-relaxed mb-6 italic">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>

                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-full ${testimonial.accent} flex items-center justify-center text-lg`}
                  >
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-display font-semibold text-navy">
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-navy/50">{testimonial.child}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatedElement>
          ))}
        </div>
      </div>
    </section>
  );
}
