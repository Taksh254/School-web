import Link from "next/link"
import { Heart, Mail, Phone, MapPin, Clock, Camera, Globe, Video } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-olive text-white/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 40 40" fill="none">
                  <path d="M20 4C16 8 12 12 8 18C4 24 4 30 8 34C12 38 18 38 24 34C30 30 34 24 34 20C34 16 30 12 26 8C22 4 20 4 20 4Z" fill="white" fillOpacity="0.4"/>
                  <circle cx="16" cy="20" r="1.5" fill="white"/>
                  <circle cx="24" cy="20" r="1.5" fill="white"/>
                  <path d="M18 26C19 27 21 27 22 26" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                </svg>
              </div>
              <span className="text-xl font-display font-bold text-white">Happy Kids</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Where little minds grow with joy. A warm, nurturing space for your child&apos;s first steps into learning.
            </p>
            <div className="flex items-center gap-3">
              {[Camera, Globe, Video].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-pistachio/30 transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {[
            { title: "Quick Links", links: [
              { label: "Home", href: "/" },
              { label: "Programs", href: "/programs" },
              { label: "Gallery", href: "/gallery" },
              { label: "Admissions", href: "/admissions" },
              { label: "Contact", href: "/contact" },
            ]},
            { title: "Programs", links: [
              { label: "Play Group (2-3 yrs)", href: "/programs" },
              { label: "Nursery (3-4 yrs)", href: "/programs" },
              { label: "Kindergarten (4-6 yrs)", href: "/programs" },
              { label: "Activity Classes", href: "/programs" },
            ]},
          ].map((group) => (
            <div key={group.title}>
              <h4 className="text-sm font-display font-semibold text-pistachio mb-4 uppercase tracking-wider">{group.title}</h4>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-white/60 hover:text-pistachio transition-colors">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="text-sm font-display font-semibold text-pistachio mb-4 uppercase tracking-wider">Visit Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-white/60">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-pistachio" />
                123 Blossom Lane, Green Valley Park, New Delhi 110001
              </li>
              <li className="flex items-center gap-3 text-sm text-white/60">
                <Phone className="w-4 h-4 shrink-0 text-pistachio" />+91 98765 43210
              </li>
              <li className="flex items-center gap-3 text-sm text-white/60">
                <Mail className="w-4 h-4 shrink-0 text-pistachio" />hello@happykids.in
              </li>
              <li className="flex items-start gap-3 text-sm text-white/60">
                <Clock className="w-4 h-4 mt-0.5 shrink-0 text-pistachio" />
                Mon-Fri: 8AM-3PM<br />Sat: 8AM-12PM
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">&copy; {new Date().getFullYear()} Happy Kids Preschool. All rights reserved.</p>
          <p className="text-xs text-white/40 flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-pistachio fill-pistachio" /> for little learners
          </p>
        </div>
      </div>
    </footer>
  )
}
