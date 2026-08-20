"use client"

import { motion } from "framer-motion"

interface ChatBubbleProps {
  message: string
  senderRole: "parent" | "principal"
  senderName: string
  createdAt: string
  isOwn: boolean // true if this message was sent by the current viewer
}

function formatTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return "Yesterday"
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

export default function ChatBubble({ message, senderName, createdAt, isOwn }: ChatBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: isOwn ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`flex flex-col gap-1 max-w-[75%] ${isOwn ? "ml-auto items-end" : "mr-auto items-start"}`}
    >
      {/* Sender name */}
      <span className="text-[11px] text-olive/40 font-body px-1">{senderName}</span>

      {/* Bubble */}
      <div
        className={`relative px-4 py-2.5 rounded-2xl text-sm font-body leading-relaxed break-words ${
          isOwn
            ? "bg-gradient-to-br from-pistachio to-sage text-white rounded-tr-sm"
            : "bg-soft-white border border-beige/30 text-olive shadow-soft rounded-tl-sm"
        }`}
        style={{ wordBreak: "break-word" }}
      >
        {/* Render message as plain text — no innerHTML */}
        {message.split("\n").map((line, i) => (
          <span key={i}>
            {line}
            {i < message.split("\n").length - 1 && <br />}
          </span>
        ))}
      </div>

      {/* Timestamp */}
      <span className="text-[10px] text-olive/30 font-body px-1">{formatTime(createdAt)}</span>
    </motion.div>
  )
}

