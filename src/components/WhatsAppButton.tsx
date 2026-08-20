"use client"

import { motion } from "framer-motion"
import { MessageCircle } from "lucide-react"

export default function WhatsAppButton() {
  const phoneNumber = "918527737413"
  const defaultMessage = encodeURIComponent(
    "Hello Tiny Mind Play School, I would like to enquire about admissions and schedule a campus visit."
  )
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${defaultMessage}`

  return (
    <aside aria-label="WhatsApp quick chat" className="print:hidden whatsapp-button">
      <motion.a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1, y: -2 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#25D366] text-white font-medium shadow-lift hover:shadow-2xl transition-all group"
        aria-label="Chat on WhatsApp"
      >
        <div className="relative flex items-center justify-center">
          <MessageCircle className="w-5 h-5 fill-current" />
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-40 group-hover:block hidden" />
        </div>
        <span className="text-xs font-semibold tracking-wide pr-0.5 font-body hidden sm:inline-block">
          Chat on WhatsApp
        </span>
      </motion.a>
    </aside>
  )
}
