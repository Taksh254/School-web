"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { getNotes } from "@/lib/data-store"
import type { TeacherNote } from "@/lib/types"
import { MessageCircle, Award, BookOpen, Heart, AlertCircle, Star } from "lucide-react"

const categoryConfig: Record<string, { icon: typeof Star; color: string; label: string }> = {
  achievement: { icon: Award, color: "bg-amber-50 text-amber-500", label: "Achievement" },
  academic: { icon: BookOpen, color: "bg-pistachio/10 text-olive", label: "Academic" },
  behavior: { icon: Heart, color: "bg-sage/10 text-olive", label: "Behavior" },
  health: { icon: AlertCircle, color: "bg-red-50 text-red-400", label: "Health" },
  general: { icon: MessageCircle, color: "bg-cream text-olive/50", label: "General" },
}

export default function ParentNotesPage() {
  const { user } = useAuth()
  const childId = user?.childId
  const [notes, setNotes] = useState<TeacherNote[]>([])
  const [hasChild, setHasChild] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true)
      try {
        // Primary: Load from parent-data
        const res = await fetch("/api/parent-data?type=notes", { cache: "no-store" })
        if (res.ok) {
          const data = await res.json()
          if (data.student) {
            setNotes(data.notes || [])
            setHasChild(true)
            setLoading(false)
            return
          }
        }

        if (childId) {
          const data = await getNotes(childId)
          setNotes(data)
          setHasChild(true)
        }
      } catch (err) {
        console.error("Notes fetch error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchNotes()
  }, [childId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 rounded-full border-2 border-pistachio border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!hasChild && !childId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-display font-bold text-olive">Teacher Notes</h1>
          <p className="text-sm text-olive/50 font-body">Messages and observations from your child&apos;s teachers</p>
        </div>
        <div className="bg-cream border border-beige/40 rounded-3xl p-6 text-center shadow-soft">
          <p className="text-sm text-olive/60 font-body">No student profile is linked to this account. Please link a student profile to view notes.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-display font-bold text-olive">Teacher Notes</h1>
        <p className="text-sm text-olive/50 font-body">Messages and observations from your child&apos;s teachers</p>
      </div>

      <div className="space-y-4">
        {notes.map((note, i) => {
          const config = categoryConfig[note.category] || categoryConfig.general
          const Icon = config.icon

          return (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-soft-white rounded-2xl p-5 border border-beige/20 shadow-soft"
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl ${config.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium font-body ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="text-xs text-olive/30 font-body">
                      {new Date(note.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </div>
                  <p className="text-sm text-olive/70 leading-relaxed mb-2 font-body">{note.message}</p>
                  <p className="text-xs text-olive/40 font-body">— {note.teacherName}</p>
                </div>
              </div>
            </motion.div>
          )
        })}

        {notes.length === 0 && (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-cream flex items-center justify-center mx-auto mb-3">
              <MessageCircle className="w-6 h-6 text-olive/25" />
            </div>
            <p className="text-sm text-olive/40 font-body">No notes yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
