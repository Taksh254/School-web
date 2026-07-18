"use client"

import { motion } from "framer-motion"
import { Inbox } from "lucide-react"

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-cream flex items-center justify-center mb-4">
        {icon || <Inbox className="w-7 h-7 text-olive/30" />}
      </div>
      <h3 className="text-base font-display font-semibold text-olive/70 mb-1">{title}</h3>
      {description && <p className="text-sm text-olive/40 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  )
}
