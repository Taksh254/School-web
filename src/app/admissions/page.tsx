"use client"

import { motion } from "framer-motion"
import { ClipboardCheck, FileText, Calendar, PhoneCall, CheckCircle } from "lucide-react"

const steps = [
  { icon: PhoneCall, title: "1. Reach Out", desc: "Give us a call or fill out our inquiry form. We'll answer all your questions and schedule a tour.", color: "bg-pistachio/10 text-olive" },
  { icon: Calendar, title: "2. Visit Us", desc: "Come see our classrooms, meet our teachers, and experience the Happy Kids environment firsthand.", color: "bg-sage/10 text-olive" },
  { icon: ClipboardCheck, title: "3. Enroll", desc: "Complete the enrollment form and submit required documents. Our team guides you every step.", color: "bg-cream text-olive" },
  { icon: FileText, title: "4. Confirmation", desc: "Receive your welcome kit with school calendar and everything you need for a smooth start.", color: "bg-beige/30 text-olive" },
]

const faqs = [
  { q: "What is the ideal age to start preschool?", a: "Children can join our Play Group from 2 years of age. Children who are walking confidently and showing curiosity about their environment are ready." },
  { q: "What is the teacher-to-child ratio?", a: "We maintain a low ratio of 1:6 for Play Group, 1:8 for Nursery, and 1:10 for Kindergarten." },
  { q: "What are the school timings?", a: "Play Group runs 9 AM to 12 PM, Nursery 9 AM to 1 PM, and Kindergarten 8:30 AM to 2:30 PM, Monday through Friday." },
  { q: "Is there a trial period?", a: "Yes! We offer a one-week settling-in period where a parent can stay with the child for a smooth transition." },
  { q: "What documents are required?", a: "You'll need your child's birth certificate, recent photographs, vaccination records, and a filled enrollment form." },
  { q: "Do you provide meals?", a: "We provide healthy, nutritious snacks and lunch. Our menu is vegetarian and designed by a child nutritionist." },
]

export default function AdmissionsPage() {
  return (
    <>
      <section className="py-20 md:py-28 bg-gradient-to-b from-soft-white to-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto text-center mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full bg-pistachio/10 text-olive text-sm font-medium font-display mb-3">Admissions</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-olive leading-tight">Welcome to Our Family</h2>
            <p className="mt-4 text-olive/60 text-base md:text-lg">We&apos;re excited to welcome you and your child. Here&apos;s everything you need to know.</p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mt-8 mb-16">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <div className="bg-soft-white rounded-3xl p-8 border border-beige/20 shadow-soft">
                <h3 className="text-xl font-display font-semibold text-olive mb-4">Admission for 2026-27 Now Open</h3>
                <p className="text-sm text-olive/70 leading-relaxed mb-4">Limited seats available for the upcoming academic year. Early admissions encouraged.</p>
                <div className="space-y-3">
                  {["Montessori-inspired curriculum", "Certified early childhood educators", "Safe, secure learning environment", "Regular parent-teacher communication"].map((item) => (
                    <div key={item} className="flex items-start gap-2.5 text-sm text-olive/60">
                      <CheckCircle className="w-4 h-4 text-pistachio mt-0.5 shrink-0" />{item}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="space-y-4">
              {[
                { emoji: "📞", label: "Call Us", detail: "+91 98765 43210" },
                { emoji: "✉️", label: "Email Us", detail: "admissions@happykids.in" },
                { emoji: "🏫", label: "Visit Us", detail: "123 Blossom Lane, Green Valley Park, New Delhi" },
              ].map((item) => (
                <div key={item.label} className="bg-soft-white rounded-2xl p-6 border border-beige/20 shadow-soft">
                  <h4 className="font-display font-semibold text-olive mb-1">{item.emoji} {item.label}</h4>
                  <p className="text-sm text-olive/60">{item.detail}</p>
                </div>
              ))}
            </motion.div>
          </div>

          <h3 className="text-2xl font-display font-bold text-olive text-center mb-10">How Admissions Work</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.1 }}
                whileHover={{ y: -4 }} className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft hover:shadow-card transition-all duration-300 text-center">
                <div className={`w-16 h-16 mx-auto rounded-2xl ${s.color} flex items-center justify-center mb-4`}><s.icon className="w-7 h-7" /></div>
                <h4 className="text-base font-display font-semibold text-olive mb-2">{s.title}</h4>
                <p className="text-sm text-olive/60 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-beige/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full bg-pistachio/10 text-olive text-sm font-medium font-display mb-3">FAQs</span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-olive">Common Questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div key={faq.q} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}
                className="bg-soft-white rounded-2xl p-5 md:p-6 border border-beige/20">
                <h4 className="text-base font-display font-semibold text-olive mb-2">{faq.q}</h4>
                <p className="text-sm text-olive/60 leading-relaxed">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
