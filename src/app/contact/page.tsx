"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, AlertCircle } from "lucide-react"

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [subject, setSubject] = useState("Schedule a Visit")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setError(null)
    setLoading(true)

    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childName: name.trim(),
          childDob: new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          program: "Nursery",
          parentName: name.trim(),
          parentEmail: email.trim(),
          parentPhone: phone.trim() || "+91 99999 99999",
          message: `[Subject: ${subject}] ${message.trim()}`,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to send message. Please try again.")
        return
      }

      setSubmitted(true)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSubmitted(false)
    setName("")
    setEmail("")
    setPhone("")
    setMessage("")
    setError(null)
  }

  return (
    <section className="mx-4 sm:mx-6 lg:mx-8 my-8 md:my-12 py-12 md:py-20 rounded-[2rem] md:rounded-[3rem] bg-white/60 backdrop-blur-md border border-white/40 overflow-hidden shadow-soft min-h-[calc(100vh-6rem)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-pistachio/10 text-olive text-sm font-medium font-display mb-3">Contact Us</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-olive leading-tight">We&apos;d Love to Hear From You</h2>
          <p className="mt-4 text-olive/60 text-base md:text-lg">Have a question? Want to schedule a visit? We&apos;re here for you.</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 mt-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <div className="bg-soft-white rounded-[32px] p-6 md:p-8 border border-beige/20 shadow-soft">
              {submitted ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-pistachio/10 flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-olive" />
                  </div>
                  <h3 className="text-xl font-display font-semibold text-olive mb-2">Thank You!</h3>
                  <p className="text-olive/60 text-sm">We&apos;ve received your message and will get back to you within 24 hours.</p>
                  <button onClick={handleReset} className="mt-6 text-sm text-olive hover:text-pistachio font-medium underline underline-offset-2">Send another message</button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 text-xs font-body border border-red-200">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-olive mb-1.5 font-body">Your Name</label>
                      <input id="name" type="text" required placeholder="e.g., Priya Sharma"
                        value={name} onChange={(e) => setName(e.target.value)}
                        disabled={loading}
                        className="w-full px-5 py-3.5 rounded-full bg-cream border border-white/60 text-olive text-sm placeholder:text-beige/60 transition-all duration-300 outline-none focus:bg-white focus:border-pistachio focus:shadow-glow font-body disabled:opacity-60"
                        style={{ boxShadow: "inset 0 2px 4px rgba(90,100,80,0.04)" }} />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-olive mb-1.5 font-body">Email</label>
                      <input id="email" type="email" required placeholder="you@example.com"
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        className="w-full px-5 py-3.5 rounded-full bg-cream border border-white/60 text-olive text-sm placeholder:text-beige/60 transition-all duration-300 outline-none focus:bg-white focus:border-pistachio focus:shadow-glow font-body disabled:opacity-60"
                        style={{ boxShadow: "inset 0 2px 4px rgba(90,100,80,0.04)" }} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-olive mb-1.5 font-body">Phone</label>
                    <input id="phone" type="tel" placeholder="+91 98765 43210"
                      value={phone} onChange={(e) => setPhone(e.target.value)}
                      disabled={loading}
                      className="w-full px-5 py-3.5 rounded-full bg-cream border border-white/60 text-olive text-sm placeholder:text-beige/60 transition-all duration-300 outline-none focus:bg-white focus:border-pistachio focus:shadow-glow font-body disabled:opacity-60"
                      style={{ boxShadow: "inset 0 2px 4px rgba(90,100,80,0.04)" }} />
                  </div>
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-olive mb-1.5 font-body">Subject</label>
                    <select id="subject"
                      value={subject} onChange={(e) => setSubject(e.target.value)}
                      disabled={loading}
                      className="w-full px-5 py-3.5 rounded-full bg-cream border border-white/60 text-olive text-sm transition-all duration-300 outline-none focus:bg-white focus:border-pistachio focus:shadow-glow font-body disabled:opacity-60">
                      <option>Schedule a Visit</option>
                      <option>Admission Inquiry</option>
                      <option>General Question</option>
                      <option>Feedback</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-olive mb-1.5 font-body">Message</label>
                    <textarea id="message" rows={4} required placeholder="Tell us how we can help..."
                      value={message} onChange={(e) => setMessage(e.target.value)}
                      disabled={loading}
                      className="w-full px-5 py-3.5 rounded-2xl bg-cream border border-white/60 text-olive text-sm placeholder:text-beige/60 transition-all duration-300 outline-none focus:bg-white focus:border-pistachio focus:shadow-glow font-body resize-none disabled:opacity-60"
                      style={{ boxShadow: "inset 0 2px 4px rgba(90,100,80,0.04)" }} />
                  </div>
                  <motion.button type="submit" disabled={loading} whileHover={!loading ? { scale: 1.02, y: -1 } : {}} whileTap={!loading ? { scale: 0.98 } : {}}
                    className="w-full flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-pistachio to-sage text-white font-medium shadow-soft hover:shadow-lift transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed">
                    {loading ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>Sending Message...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> <span>Send Message</span>
                      </>
                    )}
                  </motion.button>
                </form>
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="space-y-6">
            <div className="bg-soft-white rounded-3xl p-6 border border-beige/20 shadow-soft">
              <h3 className="text-lg font-display font-semibold text-olive mb-4">Get in Touch</h3>
              <div className="space-y-4">
                {[
                  { icon: Phone, label: "Phone", value: "+91 8527737413", href: "tel:+918527737413", color: "bg-pistachio/10 text-olive" },
                  { icon: Mail, label: "Email", value: "tinymindplayschool01@gmail.com", href: "mailto:tinymindplayschool01@gmail.com", color: "bg-sage/10 text-olive" },
                  { icon: MapPin, label: "Address", value: "Plot No 95, Near Main Market, Mahipalpur, Delhi-110037", color: "bg-cream text-olive" },
                  { icon: Clock, label: "Hours", value: "Mon-Sat: 8AM-1PM", color: "bg-beige/30 text-olive" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center shrink-0`}><item.icon className="w-5 h-5" /></div>
                    <div>
                      <p className="text-sm font-medium text-olive">{item.label}</p>
                      {item.href ? (
                        <a href={item.href} className="text-sm text-olive/70 hover:text-pistachio hover:underline transition-colors">
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-sm text-olive/60">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-cream rounded-3xl p-6 border border-beige/20">
              <h3 className="text-lg font-display font-semibold text-olive mb-3">📍 Find Us</h3>
              <div className="aspect-[16/9] rounded-2xl bg-beige/30 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-8 h-8 text-pistachio mx-auto mb-2" />
                  <p className="text-sm text-olive/40">Map</p>
                  <p className="text-xs text-olive/30">Plot No 95, Mahipalpur, Delhi</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

