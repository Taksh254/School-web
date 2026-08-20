"use client"

import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  sub?: string
  color?: string
  index?: number
  href?: string
}

export default function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "bg-pistachio/10",
  index = 0,
  href,
}: StatCardProps) {
  const content = (
    <>
      <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5 text-olive" />
      </div>
      <p className="text-xs text-olive/50 font-medium font-body">{label}</p>
      <p className="text-xl font-display font-bold text-olive mt-0.5">{value}</p>
      {sub && <p className="text-xs text-olive/40 mt-0.5">{sub}</p>}
    </>
  )

  const cardClassName = "bg-soft-white rounded-2xl p-5 border border-beige/20 shadow-soft hover:shadow-card transition-all duration-300 block text-left"

  if (href) {
    return (
      <Link href={href} className="block group">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: index * 0.08, ease: [0.25, 0.1, 0.25, 1] }}
          className={`${cardClassName} cursor-pointer hover:scale-[1.02] active:scale-[0.98]`}
        >
          {content}
        </motion.div>
      </Link>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.25, 0.1, 0.25, 1] }}
      className={cardClassName}
    >
      {content}
    </motion.div>
  )
}

