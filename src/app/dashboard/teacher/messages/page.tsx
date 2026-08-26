"use client"

import { useEffect, useState, useRef } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  MessageSquare,
  Send,
  ArrowLeft,
  Crown,
  User,
  Clock,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import type { TeacherChatMessage } from "@/lib/types"

export default function TeacherMessagesPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<TeacherChatMessage[]>([])
  const [inputText, setInputText] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const loadMessages = async () => {
    try {
      const res = await fetch("/api/teacher-chat", { cache: "no-store" })
      if (res.ok) {
        const json = await res.json()
        setMessages(json.messages || [])
      }
    } catch (err) {
      console.error("Error loading chat messages:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMessages()

    // Realtime channel
    const channel = supabase
      .channel("teacher-chat-channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "teacher_messages" },
        () => {
          loadMessages()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim()) return
    setSending(true)
    const textToSend = inputText.trim()
    setInputText("")

    try {
      const res = await fetch("/api/teacher-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend }),
      })
      if (res.ok) {
        loadMessages()
      } else {
        const json = await res.json()
        alert(json.error || "Failed to send message")
        setInputText(textToSend)
      }
    } catch (err: any) {
      alert(err?.message || "Connection error")
      setInputText(textToSend)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard/teacher" className="text-xs text-olive/50 hover:text-olive flex items-center gap-1 font-body">
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-olive">Principal Messages</h1>
          <p className="text-xs sm:text-sm text-olive/60 font-body">
            Direct communication channel between you and the Principal / Administration
          </p>
        </div>
      </div>

      {/* ── CHAT CONTAINER ──────────────────────────────────────────── */}
      <div className="bg-soft-white rounded-3xl border border-beige/20 shadow-soft overflow-hidden flex flex-col h-[600px]">
        {/* Chat Header Bar */}
        <div className="p-4 bg-cream/50 border-b border-beige/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pistachio to-sage flex items-center justify-center text-white shadow-soft">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-olive">Principal Office</h3>
              <span className="text-[11px] text-emerald-700 font-body flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Official Channel
              </span>
            </div>
          </div>

          <span className="text-xs text-olive/50 font-body bg-white px-3 py-1 rounded-full border border-beige/30">
            BloomDesk Teacher Chat
          </span>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-cream/15">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 rounded-full border-3 border-pistachio border-t-transparent animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <MessageSquare className="w-12 h-12 text-olive/20 mb-3" />
              <h4 className="font-display font-semibold text-base text-olive">Direct Line to Principal</h4>
              <p className="text-xs text-olive/50 font-body mt-1 max-w-sm">
                Send updates, queries, special classroom requests, or schedule discussions directly with the Principal.
              </p>
            </div>
          ) : (
            messages.map((m: any) => {
              const isTeacher = m.sender_role === "teacher"
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isTeacher ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-olive/40 font-body mb-1 px-1">
                    <span>{m.sender_name || (isTeacher ? "You" : "Principal")}</span>
                    <span>•</span>
                    <span className="font-mono">{m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</span>
                  </div>

                  <div
                    className={`max-w-[75%] p-4 rounded-3xl text-xs sm:text-sm font-body shadow-soft whitespace-pre-wrap leading-relaxed ${
                      isTeacher
                        ? "bg-gradient-to-r from-pistachio to-sage text-white rounded-tr-none"
                        : "bg-white text-olive border border-beige/25 rounded-tl-none"
                    }`}
                  >
                    {m.message}
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-4 bg-white border-t border-beige/20 flex items-center gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message to the Principal..."
            disabled={sending}
            className="flex-1 px-4 py-3 rounded-full bg-cream border border-beige/25 text-sm text-olive placeholder:text-olive/40 outline-none focus:border-pistachio focus:ring-2 focus:ring-pistachio/20 transition-all font-body"
          />
          <button
            type="submit"
            disabled={sending || !inputText.trim()}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-pistachio to-sage text-white flex items-center justify-center shadow-soft hover:opacity-95 disabled:opacity-40 transition-opacity shrink-0"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  )
}
