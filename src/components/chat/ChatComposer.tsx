"use client"

import { useState, useRef, type KeyboardEvent } from "react"
import { Send } from "lucide-react"

interface ChatComposerProps {
  onSend: (message: string) => Promise<void>
  disabled?: boolean
}

const MAX_LENGTH = 2000

export default function ChatComposer({ onSend, disabled = false }: ChatComposerProps) {
  const [value, setValue] = useState("")
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const canSend = value.trim().length > 0 && value.trim().length <= MAX_LENGTH && !sending && !disabled

  const handleSend = async () => {
    const msg = value.trim()
    if (!msg || sending || disabled) return

    setSending(true)
    try {
      await onSend(msg)
      setValue("")
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    } finally {
      setSending(false)
      textareaRef.current?.focus()
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter → send. Shift+Enter → new line.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    // Auto-resize textarea
    const el = e.target
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 140) + "px"
  }

  const charsLeft = MAX_LENGTH - value.length

  return (
    <div className="border-t border-beige/20 bg-soft-white p-3 sm:p-4">
      <div className="flex items-end gap-2">
        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
            rows={1}
            disabled={disabled || sending}
            className="w-full resize-none overflow-hidden px-4 py-3 rounded-2xl bg-cream border border-beige/30 text-sm text-olive placeholder:text-olive/30 outline-none focus:border-pistachio focus:bg-white transition-all font-body leading-relaxed disabled:opacity-60"
            style={{ minHeight: "46px", maxHeight: "140px" }}
            aria-label="Message"
          />
          {/* Char counter — only show when nearing limit */}
          {value.length > MAX_LENGTH * 0.8 && (
            <span
              className={`absolute right-3 bottom-2 text-[10px] font-body ${
                charsLeft < 0 ? "text-red-500" : "text-olive/30"
              }`}
            >
              {charsLeft}
            </span>
          )}
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Send message"
          className="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center bg-gradient-to-br from-pistachio to-sage text-white shadow-soft transition-all hover:shadow-lift hover:-translate-y-0.5 disabled:opacity-40 disabled:translate-y-0 disabled:shadow-none"
        >
          {sending ? (
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>

      <p className="text-[10px] text-olive/25 font-body mt-1.5 ml-1">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  )
}
