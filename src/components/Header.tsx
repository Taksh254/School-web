"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, ArrowRight, LogIn, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/programs", label: "Programs" },
  { href: "/gallery", label: "Gallery" },
  { href: "/parent-corner", label: "Parent Corner" },
  { href: "/contact", label: "Contact Us" },
]

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const path = usePathname()
  const { user } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (path.startsWith("/login") || path.startsWith("/dashboard")) return null

  return (
    <header className="relative z-50 bg-transparent py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-soft-white/95 backdrop-blur-sm rounded-full border border-beige/30 shadow-soft px-5 md:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-beige/25 flex items-center justify-center shadow-soft relative">
              <Image src="/images/logo.jpg" alt="Logo" fill sizes="36px" className="object-cover" priority />
            </div>
            <span className="text-xl md:text-2xl font-display font-bold text-olive">
              Tiny Mind Play School
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium transition-all duration-200",
                  path === link.href
                    ? "text-olive bg-cream"
                    : "text-olive/60 hover:text-olive hover:bg-cream/50"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 rounded-full border border-pistachio/30 text-olive text-sm font-medium hover:bg-cream transition-all duration-200"
            >
              Login
            </Link>
            <Link
              href="/contact"
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-pistachio to-sage text-white text-sm font-medium shadow-soft hover:shadow-lift hover:-translate-y-0.5 transition-all duration-300"
            >
              Book a Visit
            </Link>
          </div>

          <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden p-2 rounded-lg hover:bg-cream transition-colors" aria-label={isOpen ? "Close" : "Menu"}>
            {isOpen ? <X className="w-5 h-5 text-olive" /> : <Menu className="w-5 h-5 text-olive" />}
          </button>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="lg:hidden border-t border-beige/20 overflow-hidden">
              <nav className="py-4 space-y-1">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)}
                    className={cn("block px-4 py-2.5 rounded-xl text-base font-medium transition-colors",
                      path === link.href ? "bg-cream text-olive" : "text-olive/60 hover:bg-cream/50 hover:text-olive"
                    )}>
                    {link.label}
                  </Link>
                ))}
                <Link href="/login" onClick={() => setIsOpen(false)}
                  className="block text-center px-4 py-2.5 rounded-full border border-pistachio/30 text-olive font-medium mt-3">
                  Login
                </Link>
                <Link href="/contact" onClick={() => setIsOpen(false)}
                  className="block text-center px-4 py-3 rounded-full bg-gradient-to-r from-pistachio to-sage text-white font-medium mt-2">
                  Book a Visit
                </Link>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </div>
    </header>
  )
}
