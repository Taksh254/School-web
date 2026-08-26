"use client"

export const dynamic = "force-dynamic"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, ArrowLeft, User, Users, Wifi, WifiOff, Search } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import ChatBubble from "@/components/chat/ChatBubble"
import ChatComposer from "@/components/chat/ChatComposer"

interface Conversation {
  id: string
  student_id: string
  parent_name: string
  admission_no: string
  status: string
  created_at: string
  updated_at: string
  lastMessage: { message: string; created_at: string; sender_role: string } | null
  unreadCount: number
}

interface Message {
  id: string
  conversation_id: string
  sender_role: "parent" | "principal"
  sender_name: string
  message: string
  created_at: string
  read_at: string | null
}

function formatRelativeTime(iso: string): string {
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

export default function AdminMessagesPage() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [realtime, setRealtime] = useState(false)
  const [adminName, setAdminName] = useState("Principal")
  const [search, setSearch] = useState("")

  const filteredConversations = useMemo(() => {
    if (!search) return conversations
    const q = search.toLowerCase().trim()
    return conversations.filter(
      (c) =>
        (c.parent_name && c.parent_name.toLowerCase().includes(q)) ||
        (c.admission_no && c.admission_no.toLowerCase().includes(q))
    )
  }, [conversations, search])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Get Supabase session token for Authorization header
  const getToken = useCallback(async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
  }, [])

  // Load all conversations
  const loadConversations = useCallback(async () => {
    setLoadingConvs(true)
    try {
      const token = await getToken()
      if (!token) { setError("Not authenticated as admin"); return }

      const res = await fetch("/api/chat/conversations", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      })
      if (!res.ok) throw new Error("Failed to load conversations")
      const data = await res.json()
      setConversations(data.conversations || [])
    } catch (err: any) {
      setError(err?.message || "Failed to load conversations")
    } finally {
      setLoadingConvs(false)
    }
  }, [getToken])

  useEffect(() => {
    if (user?.name) setAdminName(user.name)
    loadConversations()
  }, [loadConversations, user])

  // Load messages for selected conversation
  const openConversation = useCallback(async (conv: Conversation) => {
    setSelectedConv(conv)
    setLoadingMsgs(true)
    setMessages([])

    try {
      const token = await getToken()
      if (!token) return

      const res = await fetch(`/api/chat/messages?conversationId=${conv.id}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      })
      if (!res.ok) throw new Error("Failed to load messages")
      const data = await res.json()
      setMessages(data.messages || [])

      // Mark parent messages as read
      fetch("/api/chat/read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ conversationId: conv.id }),
      }).then(() => {
        // Clear unread badge on the conversation in state
        setConversations((prev) =>
          prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
        )
      }).catch(() => {})

      // Subscribe to realtime for this conversation
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }

      const channel = supabase
        .channel(`chat-admin-${conv.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conv.id}`,
          },
          async (payload) => {
            const newMsg = payload.new as Message
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev
              return [...prev, newMsg]
            })
            // If a parent sends a message, mark it read immediately (we're viewing)
            if (newMsg.sender_role === "parent") {
              const t = await getToken()
              if (t) {
                fetch("/api/chat/read", {
                  method: "POST",
                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
                  body: JSON.stringify({ conversationId: conv.id }),
                }).catch(() => {})
              }
            }
            // Refresh conversation list badges
            loadConversations()
          }
        )
        .subscribe((status) => {
          setRealtime(status === "SUBSCRIBED")
        })

      channelRef.current = channel
    } catch (err: any) {
      setError(err?.message || "Failed to open conversation")
    } finally {
      setLoadingMsgs(false)
    }
  }, [getToken, loadConversations])

  const handleBack = () => {
    setSelectedConv(null)
    setMessages([])
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    setRealtime(false)
    loadConversations()
  }

  const handleSend = async (message: string) => {
    if (!selectedConv) return
    const token = await getToken()
    if (!token) throw new Error("Not authenticated")

    const res = await fetch("/api/chat/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ conversationId: selectedConv.id, message }),
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

  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <AnimatePresence>
          {selectedConv && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onClick={handleBack}
              className="p-2 rounded-xl hover:bg-cream text-olive/50 hover:text-olive transition-colors"
              aria-label="Back to conversations"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>
        <div>
          <h1 className="text-xl font-display font-bold text-olive flex items-center gap-2">
            {selectedConv ? (
              <>
                <span>{selectedConv.parent_name}</span>
                <span className="text-olive/30 font-body text-sm font-normal">
                  · {selectedConv.admission_no}
                </span>
              </>
            ) : (
              <>
                Messages
                {totalUnread > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                    {totalUnread > 9 ? "9+" : totalUnread}
                  </span>
                )}
              </>
            )}
          </h1>
          <p className="text-sm text-olive/50 font-body">
            {selectedConv ? `Student: ${selectedConv.admission_no}` : "Parent–Principal conversations"}
          </p>
        </div>
        {selectedConv && (
          <div className="ml-auto flex items-center gap-1.5">
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
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-700 font-body">
          {error}
        </div>
      )}

      {/* Conversation list */}
      {!selectedConv && (
        <div className="space-y-4">
          {conversations.length > 0 && (
            <div className="relative">
              <Search className="w-4 h-4 text-olive/40 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations by admission number or parent name..."
                className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-soft-white border border-beige/25 text-sm text-olive placeholder:text-olive/40 outline-none focus:border-pistachio focus:ring-2 focus:ring-pistachio/20 transition-all font-body shadow-soft"
              />
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-soft-white rounded-3xl border border-beige/20 shadow-soft overflow-hidden"
          >
            {loadingConvs ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-7 h-7 rounded-full border-2 border-pistachio border-t-transparent animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-14 h-14 rounded-full bg-pistachio/10 flex items-center justify-center">
                  <Users className="w-7 h-7 text-pistachio/50" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-display font-semibold text-olive/60">No conversations yet</p>
                  <p className="text-xs text-olive/40 font-body mt-1">
                    Conversations will appear here when parents send their first message.
                  </p>
                </div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm font-display font-semibold text-olive/60">No matching conversations</p>
                <p className="text-xs text-olive/40 font-body mt-1">
                  Try searching with a different admission number or parent name.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-beige/10">
                {filteredConversations.map((conv) => (
                <li key={conv.id}>
                  <button
                    onClick={() => openConversation(conv)}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-cream/60 transition-colors text-left"
                  >
                    {/* Avatar */}
                    <div className="shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-pistachio/20 to-sage/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-olive/50" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-olive truncate font-body">
                          {conv.parent_name}
                        </span>
                        <span className="text-[10px] text-olive/35 font-body shrink-0">
                          {conv.lastMessage ? formatRelativeTime(conv.lastMessage.created_at) : formatRelativeTime(conv.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-olive/40 font-body mt-0.5 truncate">
                        {conv.lastMessage ? (
                          <>
                            {conv.lastMessage.sender_role === "principal" ? "You: " : ""}
                            {conv.lastMessage.message}
                          </>
                        ) : (
                          <span className="italic">No messages yet</span>
                        )}
                      </p>
                      <p className="text-[10px] text-olive/30 font-body mt-0.5">Adm. {conv.admission_no}</p>
                    </div>

                    {/* Unread badge */}
                    {conv.unreadCount > 0 && (
                      <span className="shrink-0 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
            )}
          </motion.div>
        </div>
      )}

      {/* Chat window */}
      {selectedConv && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col rounded-3xl border border-beige/20 shadow-soft overflow-hidden bg-soft-white"
          style={{ height: "calc(100vh - 13rem)" }}
        >
          {/* Messages */}
          <div className="flex-1 overflow-y-auto bg-cream/40 px-4 py-4">
            {loadingMsgs ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-7 h-7 rounded-full border-2 border-pistachio border-t-transparent animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <div className="w-14 h-14 rounded-full bg-pistachio/10 flex items-center justify-center">
                  <MessageCircle className="w-7 h-7 text-pistachio/50" />
                </div>
                <div>
                  <p className="text-sm font-display font-semibold text-olive/60">No messages yet</p>
                  <p className="text-xs text-olive/40 font-body mt-1">Reply to start the conversation.</p>
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
                      isOwn={msg.sender_role === "principal"}
                    />
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Composer */}
          <ChatComposer onSend={handleSend} disabled={!selectedConv} />
        </motion.div>
      )}
    </div>
  )
}
