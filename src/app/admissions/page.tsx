"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ClipboardCheck, FileText, Calendar, PhoneCall, CheckCircle, Send, HeartHandshake } from "lucide-react"

const steps = [
  { icon: PhoneCall, title: "1. Reach Out", desc: "Give us a call or fill out our inquiry form. We'll answer all your questions and schedule a tour.", color: "bg-pistachio/10 text-olive" },
  { icon: Calendar, title: "2. Visit Us", desc: "Come see our classrooms, meet our teachers, and experience the Tiny Mind environment firsthand.", color: "bg-sage/10 text-olive" },
  { icon: ClipboardCheck, title: "3. Enroll", desc: "Complete the enrollment form and submit required documents. Our team guides you every step.", color: "bg-cream text-olive" },
  { icon: FileText, title: "4. Confirmation", desc: "Receive your welcome kit with school calendar and everything you need for a smooth start.", color: "bg-beige/30 text-olive" },
]

const faqs = [
  { q: "What is the ideal age to start preschool?", a: "Children can join our Play Group from 2 years of age. Children who are walking confidently and showing curiosity about their environment are ready." },
  { q: "What is the teacher-to-child ratio?", a: "We maintain a low ratio of 1:6 for Play Group, 1:8 for Nursery, 1:10 for LKG, and 1:12 for UKG." },
  { q: "What are the school timings?", a: "Play Group runs 9 AM to 12 PM, Nursery 9 AM to 1 PM, LKG 8:30 AM to 1:30 PM, and UKG 8:30 AM to 2:30 PM, Monday through Friday." },
  { q: "Is there a trial period?", a: "Yes! We offer a one-week settling-in period where a parent can stay with the child for a smooth transition." },
  { q: "What documents are required?", a: "You'll need your child's birth certificate, recent photographs, vaccination records, and a filled enrollment form." },
  { q: "Do you provide meals?", a: "We provide healthy, nutritious snacks and lunch. Our menu is vegetarian and designed by a child nutritionist." },
]

export default function AdmissionsPage() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    childName: "",
    childDob: "",
    program: "Nursery",
    parentName: "",
    parentEmail: "",
    parentPhone: "",
    message: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simulate submission API call
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
    }, 1000)
  }

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
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
            {steps.map((s, i) => (
              <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.1 }}
                whileHover={{ y: -4 }} className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft hover:shadow-card transition-all duration-300 text-center">
                <div className={`w-16 h-16 mx-auto rounded-2xl ${s.color} flex items-center justify-center mb-4`}><s.icon className="w-7 h-7" /></div>
                <h4 className="text-base font-display font-semibold text-olive mb-2">{s.title}</h4>
                <p className="text-sm text-olive/60 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Admission Inquiry Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-3xl mx-auto"
          >
            <div className="bg-soft-white rounded-[32px] p-8 md:p-10 border border-beige/25 shadow-soft relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-pistachio/5 rounded-bl-full pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-beige/10 rounded-tr-full pointer-events-none" />

              <AnimatePresence mode="wait">
                {!submitted ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="text-center mb-8">
                      <span className="text-2xl">📝</span>
                      <h3 className="text-2xl font-display font-bold text-olive mt-2">Admission Inquiry Form</h3>
                      <p className="text-sm text-olive/50 font-body mt-1">Please share a few details, and our friendly staff will contact you shortly.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-semibold text-olive mb-1.5 font-body">Child&apos;s Full Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Aarav Sharma"
                            value={formData.childName}
                            onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
                            className="w-full px-4 py-3 rounded-2xl bg-cream/70 border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:bg-white transition-all font-body"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-olive mb-1.5 font-body">Child&apos;s Date of Birth *</label>
                          <input
                            type="date"
                            required
                            value={formData.childDob}
                            onChange={(e) => setFormData({ ...formData, childDob: e.target.value })}
                            className="w-full px-4 py-3 rounded-2xl bg-cream/70 border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:bg-white transition-all font-body"
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-semibold text-olive mb-1.5 font-body">Program of Interest *</label>
                          <select
                            value={formData.program}
                            onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                            className="w-full px-4 py-3 rounded-2xl bg-cream/70 border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:bg-white transition-all font-body"
                          >
                            <option value="Play Group">Play Group (2–3 yrs)</option>
                            <option value="Nursery">Nursery (3–4 yrs)</option>
                            <option value="LKG">LKG (4–5 yrs)</option>
                            <option value="UKG">UKG (5–6 yrs)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-olive mb-1.5 font-body">Parent / Guardian Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Priya Sharma"
                            value={formData.parentName}
                            onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                            className="w-full px-4 py-3 rounded-2xl bg-cream/70 border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:bg-white transition-all font-body"
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-semibold text-olive mb-1.5 font-body">Email Address *</label>
                          <input
                            type="email"
                            required
                            placeholder="priya@example.com"
                            value={formData.parentEmail}
                            onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                            className="w-full px-4 py-3 rounded-2xl bg-cream/70 border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:bg-white transition-all font-body"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-olive mb-1.5 font-body">Phone Number *</label>
                          <input
                            type="tel"
                            required
                            placeholder="+91 XXXXX XXXXX"
                            value={formData.parentPhone}
                            onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                            className="w-full px-4 py-3 rounded-2xl bg-cream/70 border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:bg-white transition-all font-body"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-olive mb-1.5 font-body">Message / Specific Questions</label>
                        <textarea
                          rows={3}
                          placeholder="Tell us a little bit about your child, or ask any questions you have..."
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          className="w-full px-4 py-3 rounded-2xl bg-cream/70 border border-beige/20 text-sm text-olive outline-none focus:border-pistachio focus:bg-white transition-all font-body resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-gradient-to-r from-pistachio to-sage text-white text-sm font-semibold shadow-soft hover:shadow-lift hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60"
                      >
                        <Send className="w-4 h-4" />
                        <span>{loading ? "Sending Inquiry..." : "Submit Inquiry"}</span>
                      </button>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-10"
                  >
                    <div className="w-16 h-16 bg-pistachio/15 rounded-full flex items-center justify-center mx-auto mb-6 text-olive">
                      <HeartHandshake className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-display font-bold text-olive mb-2">Thank You, {formData.parentName}!</h3>
                    <p className="text-sm text-olive/60 font-body max-w-md mx-auto leading-relaxed">
                      We have received your inquiry for <strong className="text-olive">{formData.childName}</strong>. Our admissions coordinator will get in touch with you at <strong className="text-olive">{formData.parentEmail}</strong> or <strong className="text-olive">{formData.parentPhone}</strong> within 24 working hours.
                    </p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="mt-8 px-6 py-2.5 rounded-full border border-pistachio/30 text-olive text-xs font-semibold hover:bg-cream transition-all font-body"
                    >
                      Submit Another Inquiry
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
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
