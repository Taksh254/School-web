"use client";

import { motion } from "framer-motion";
import {
  Calendar,
  Bell,
  BookOpen,
  MessageCircle,
  FileText,
  Heart,
  ArrowRight,
} from "lucide-react";
import SectionHeader from "@/components/SectionHeader";
import AnimatedElement from "@/components/AnimatedElement";

const resources = [
  {
    icon: Calendar,
    title: "School Calendar",
    description:
      "Stay updated with important dates — holidays, events, parent-teacher meetings, and special activities.",
    color: "bg-sage/10 text-olive",
  },
  {
    icon: Bell,
    title: "Announcements",
    description:
      "Get the latest updates, newsletters, and important communications from the school team.",
    color: "bg-pistachio/10 text-olive",
  },
  {
    icon: BookOpen,
    title: "Learning at Home",
    description:
      "Simple activities, reading lists, and tips to extend your child's learning beyond the classroom.",
    color: "bg-cream text-olive",
  },
  {
    icon: MessageCircle,
    title: "Parent Community",
    description:
      "Connect with other parents, share experiences, and be part of our warm Tiny Mind community.",
    color: "bg-beige/30 text-olive",
  },
  {
    icon: FileText,
    title: "Forms & Downloads",
    description:
      "Access enrollment forms, permission slips, and other important documents in one place.",
    color: "bg-sage/10 text-olive",
  },
  {
    icon: Heart,
    title: "Wellness Guide",
    description:
      "Tips on nutrition, sleep routines, emotional well-being, and preparing your child for school.",
    color: "bg-pistachio/10 text-olive",
  },
];

const tips = [
  {
    title: "Morning Routines That Work",
    excerpt:
      "Start the day with a calm, consistent routine. A simple three-step morning checklist helps children feel secure and independent.",
    author: "Ms. Sunita Mehta",
  },
  {
    title: "Encouraging Emotional Expression",
    excerpt:
      "Help your child name and express their feelings. Use books and role-play to talk about emotions in a safe, playful way.",
    author: "Ms. Priya Kapoor",
  },
  {
    title: "The Power of Playful Learning",
    excerpt:
      "Learning happens everywhere! Simple activities like sorting laundry or counting steps turn everyday moments into learning opportunities.",
    author: "Ms. Anita Desai",
  },
];

export default function ParentCornerPage() {
  return (
    <>
      <section className="mx-4 sm:mx-6 lg:mx-8 my-8 md:my-12 py-12 md:py-20 rounded-[2rem] md:rounded-[3rem] bg-cream/70 backdrop-blur-md border border-white/20 overflow-hidden shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedElement>
            <SectionHeader
              label="Parent Corner"
              title="Supporting You & Your Child"
              description="A dedicated space for parents — with resources, updates, and guidance to support your journey at Tiny Mind Play School."
            />
          </AnimatedElement>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource, index) => (
              <AnimatedElement key={resource.title} delay={index * 0.05}>
                <motion.div
                  whileHover={{ y: -3 }}
                  className="bg-soft-white rounded-2xl p-6 border border-beige/20 shadow-soft hover:shadow-card transition-all"
                >
                  <div
                    className={`w-12 h-12 rounded-xl ${resource.color} flex items-center justify-center mb-4`}
                  >
                    <resource.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-display font-semibold text-olive mb-2">
                    {resource.title}
                  </h3>
                  <p className="text-sm text-olive/60 leading-relaxed mb-4">
                    {resource.description}
                  </p>
                </motion.div>
              </AnimatedElement>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-4 sm:mx-6 lg:mx-8 my-8 md:my-12 py-12 md:py-20 rounded-[2rem] md:rounded-[3rem] bg-beige/40 backdrop-blur-md border border-white/20 overflow-hidden shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedElement>
            <SectionHeader
              label="Parent Tips"
              title="Insights From Our Educators"
              description="Practical advice from our team to support your child's development at home."
              align="left"
            />
          </AnimatedElement>

          <div className="grid md:grid-cols-3 gap-6">
            {tips.map((tip, index) => (
              <AnimatedElement key={tip.title} delay={index * 0.1}>
                <div className="bg-soft-white rounded-2xl p-6 border border-beige/20 shadow-soft">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-pistachio" />
                    <span className="text-xs text-olive/40 font-medium uppercase tracking-wider">
                      Parenting Tip
                    </span>
                  </div>
                  <h3 className="text-base font-display font-semibold text-olive mb-2">
                    {tip.title}
                  </h3>
                  <p className="text-sm text-olive/60 leading-relaxed mb-4">{tip.excerpt}</p>
                  <p className="text-xs text-olive/40 font-hand">&mdash; {tip.author}</p>
                </div>
              </AnimatedElement>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-4 sm:mx-6 lg:mx-8 my-8 md:my-12 py-12 md:py-20 rounded-[2rem] md:rounded-[3rem] bg-white/85 backdrop-blur-md border border-white/60 overflow-hidden shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedElement>
            <div className="max-w-lg mx-auto">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-pistachio/10 flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-olive" />
              </div>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-olive mb-4">
                Connected to the School
              </h2>
              <p className="text-olive/60 mb-6">
                Join our parent WhatsApp group for daily updates, photos, and instant communication
                with teachers.
              </p>
              <a 
                href="https://chat.whatsapp.com/HwoOuzqafqoAEUcUvGY33k" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-pistachio to-sage text-white font-medium hover:shadow-lift hover:-translate-y-0.5 transition-all duration-300 shadow-soft"
              >
                Connect to Community
              </a>
            </div>
          </AnimatedElement>
        </div>
      </section>
    </>
  );
}
