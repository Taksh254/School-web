"use client"

export const dynamic = "force-dynamic"

import { useEffect, useRef, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, User, Wifi, WifiOff } from "lucide-react"
import { supabase } from "@/lib/supabase"
import ChatBubble from "@/components/chat/ChatBubble"
import ChatComposer from "@/components/chat/ChatComposer"

interface Message {
  id: string
  conversation_id: string
  sender_role: "parent" | "principal"
  sender_name: string
  message: string
  created_at: string
  read_at: string | null
}

/**
 * Get the Supabase Auth access token if the user is logged in via email/OAuth.
 * Returns null for cookie-session parents (they rely on HttpOnly cookies, not Bearer tokens).
 * Safe to call even when there is no Supabase session.
 */
async function getSupabaseToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
  } catch {
    return null
  }
}

/** Build fetch headers — includes Bearer token for Supabase-auth parents. */
async function authHeaders(extra: Record<string, string> = {}): Promise<Record<string, string>> {
  const token = await getSupabaseToken()
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export default function ParentChatPage() {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [realtime, setRealtime] = useState<boolean>(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Load conversation & messages
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      setError(null)
      try {
        // Build auth headers (handles both cookie-auth and Supabase-auth parents)
        const headers = await authHeaders()

        // 1. Get (or create) conversation
        const convRes = await fetch("/api/chat/conversations", {
          headers,
          cache: "no-store",
        })
        if (!convRes.ok) {
          const errData = await convRes.json().catch(() => ({}))
          throw new Error(errData.error || `Failed to load conversation (${convRes.status})`)
        }
        const convData = await convRes.json()
        const convId: string = convData.conversation?.id
        if (!convId) throw new Error("No conversation returned from server")
        setConversationId(convId)

        // 2. Load messages
        const msgRes = await fetch(`/api/chat/messages?conversationId=${convId}`, {
          headers,
          cache: "no-store",
        })
        if (!msgRes.ok) {
          const errData = await msgRes.json().catch(() => ({}))
          throw new Error(errData.error || "Failed to load messages")
        }
        const msgData = await msgRes.json()
        setMessages(msgData.messages || [])

        // 3. Mark principal messages as read (fire-and-forget)
        fetch("/api/chat/read", {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId: convId }),
        }).catch(() => {})

        // 4. Subscribe to Realtime updates for this conversation
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current)
          channelRef.current = null
        }

        const channel = supabase
          .channel(`chat-parent-${convId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
              filter: `conversation_id=eq.${convId}`,
            },
            async (payload) => {
              const newMsg = payload.new as Message
              setMessages((prev) => {
                if (prev.some((m) => m.id === newMsg.id)) return prev
                return [...prev, newMsg]
              })
              // Auto-mark incoming principal messages as read
              if (newMsg.sender_role === "principal") {
                const h = await authHeaders()
                fetch("/api/chat/read", {
                  method: "POST",
                  headers: { ...h, "Content-Type": "application/json" },
                  body: JSON.stringify({ conversationId: convId }),
                }).catch(() => {})
              }
            }
          )
          .subscribe((status) => {
            setRealtime(status === "SUBSCRIBED")
          })

        channelRef.current = channel
      } catch (err: any) {
        setError(err?.message || "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    init()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [])

  const handleSend = async (message: string) => {
    const headers = await authHeaders({ "Content-Type": "application/json" })
    const res = await fetch("/api/chat/messages", {
      method: "POST",
      headers,
      body: JSON.stringify({ message }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || "Failed to send message")
    }
    const data = await res.json()
    if (data.message) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.message.id)) return prev
        return [...prev, data.message]
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-2 border-pistachio border-t-transparent animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-red-500 font-body text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-xl bg-cream text-olive text-sm font-body hover:bg-beige/40 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-soft-white rounded-t-3xl border border-beige/20 border-b-0 px-5 py-4 flex items-center justify-between shadow-soft"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pistachio to-sage flex items-center justify-center shadow-soft">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-display font-bold text-olive">Chat with Principal</h1>
            <p className="text-xs text-olive/50 font-body">Tiny Mind Play School</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {realtime ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-pistachio" />
              <span className="text-[10px] text-pistachio font-body">Live</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-olive/30" />
              <span className="text-[10px] text-olive/30 font-body">Connecting…</span>
            </>
          )}
        </div>
      </motion.div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto bg-cream/50 border-x border-beige/20 px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-16 h-16 rounded-full bg-pistachio/10 flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-pistachio/50" />
            </div>
            <div>
              <p className="text-sm font-display font-semibold text-olive/60">No messages yet</p>
              <p className="text-xs text-olive/40 font-body mt-1">
                Send your first message to the principal below.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <ChatBubble
                  key={msg.id}
                  message={msg.message}
                  senderRole={msg.sender_role}
                  senderName={msg.sender_name}
                  createdAt={msg.created_at}
                  isOwn={msg.sender_role === "parent"}
                />
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="rounded-b-3xl border border-beige/20 border-t-0 overflow-hidden shadow-soft">
        <ChatComposer onSend={handleSend} disabled={!conversationId} />
      </div>
    </div>
  )
}
