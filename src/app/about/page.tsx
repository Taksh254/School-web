"use client";

import { motion } from "framer-motion";
import { Heart, Target, Eye, Shield, Users, BookOpen } from "lucide-react";
import SectionHeader from "@/components/SectionHeader";
import AnimatedElement from "@/components/AnimatedElement";

const values = [
  {
    icon: Heart,
    title: "Love & Care",
    description:
      "Every child is unique and deserves to feel safe, valued, and loved. We nurture each child with patience and warmth.",
    color: "bg-sage/10 text-sage-dark",
  },
  {
    icon: Target,
    title: "Our Mission",
    description:
      "To create a joyful, stimulating environment where children develop a lifelong love for learning through exploration and play.",
    color: "bg-terracotta/10 text-terracotta",
  },
  {
    icon: Eye,
    title: "Our Vision",
    description:
      "A world where every child begins their educational journey with confidence, curiosity, and a strong sense of self.",
    color: "bg-navy/5 text-navy-light",
  },
  {
    icon: Shield,
    title: "Safety First",
    description:
      "Child safety is our top priority. From secure premises to trained staff, every measure is taken to protect your child.",
    color: "bg-sage-light/20 text-sage-dark",
  },
  {
    icon: Users,
    title: "Expert Team",
    description:
      "Our Montessori-trained teachers bring passion, experience, and continuous learning to create the best environment for your child.",
    color: "bg-wood/20 text-wood-dark",
  },
  {
    icon: BookOpen,
    title: "Holistic Approach",
    description:
      "We focus on cognitive, social, emotional, and physical development through a balanced blend of structured and free play.",
    color: "bg-sage/5 text-sage-dark",
  },
];

const team = [
  { name: "Ms. Sunita Mehta", role: "Founder & Principal", initial: "S", color: "bg-sage/20" },
  { name: "Ms. Priya Kapoor", role: "Head of Curriculum", initial: "P", color: "bg-terracotta/20" },
  { name: "Ms. Anita Desai", role: "Senior Teacher", initial: "A", color: "bg-sage-light/20" },
  { name: "Mr. Rohan Joshi", role: "Activity Coordinator", initial: "R", color: "bg-wood/20" },
];

export default function AboutPage() {
  return (
    <>
      <section className="py-16 md:py-24 bg-gradient-to-b from-cream to-beige/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedElement>
            <SectionHeader
              label="About Us"
              title="A Little Story About Our Little School"
              description="Tiny Mind Play School was born from a simple belief — that early childhood should be filled with wonder, warmth, and the joy of discovery."
            />
          </AnimatedElement>

          <div className="grid lg:grid-cols-2 gap-12 items-center mt-8">
            <AnimatedElement direction="left">
              <div className="relative">
                <div className="aspect-[4/3] rounded-2xl bg-beige shadow-inner flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-sage/20 flex items-center justify-center mb-4">
                      <span className="text-3xl">🏡</span>
                    </div>
                    <p className="text-navy/40 font-display">Since 2015</p>
                  </div>
                </div>
                <div className="absolute -bottom-4 -left-4 w-full h-full rounded-2xl bg-sage/5 -z-10" />
              </div>
            </AnimatedElement>

            <AnimatedElement direction="right" delay={0.1}>
              <div className="space-y-4">
                <p className="text-olive/70 leading-relaxed">
                  Founded in 2015, Tiny Mind Play School started with a small group of six
                  children in a sunlit room filled with books, blocks, and laughter. Today, we are a
                  thriving community of over 120 families who trust us with their most precious
                  little ones.
                </p>
                <p className="text-olive/70 leading-relaxed">
                  Our approach is inspired by Montessori philosophy and Scandinavian preschool
                  design — clean, warm, and child-centered. We believe in learning through play,
                  exploration, and meaningful relationships.
                </p>
                <p className="text-olive/70 leading-relaxed">
                  Every corner of our school is designed to spark curiosity. From our cozy reading
                  nooks to our garden classroom, children are free to explore, create, and grow at
                  their own pace.
                </p>
              </div>
            </AnimatedElement>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedElement>
            <SectionHeader
              title="What We Stand For"
              description="Our values guide everything we do — from how we design our classrooms to how we nurture each child."
            />
          </AnimatedElement>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((value, index) => (
              <AnimatedElement key={value.title} delay={index * 0.05}>
                <motion.div
                  whileHover={{ y: -3 }}
                  className="bg-beige/50 rounded-2xl p-6 border border-wood/15 hover:shadow-sm transition-all"
                >
                  <div
                    className={`w-12 h-12 rounded-xl ${value.color} flex items-center justify-center mb-4`}
                  >
                    <value.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-display font-semibold text-navy mb-2">
                    {value.title}
                  </h3>
                  <p className="text-sm text-navy/60 leading-relaxed">{value.description}</p>
                </motion.div>
              </AnimatedElement>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-beige/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedElement>
            <SectionHeader
              label="Our Team"
              title="Meet Our Wonderful Educators"
              description="Passionate, caring, and dedicated to nurturing your child's potential."
            />
          </AnimatedElement>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, index) => (
              <AnimatedElement key={member.name} delay={index * 0.1}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="text-center bg-cream rounded-2xl p-6 border border-wood/15 shadow-sm"
                >
                  <div
                    className={`w-20 h-20 mx-auto rounded-full ${member.color} flex items-center justify-center text-2xl font-display font-bold text-navy mb-4`}
                  >
                    {member.initial}
                  </div>
                  <h3 className="text-base font-display font-semibold text-navy">{member.name}</h3>
                  <p className="text-sm text-navy/50">{member.role}</p>
                </motion.div>
              </AnimatedElement>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
