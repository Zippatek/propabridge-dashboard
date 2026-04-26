'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { ArrowRight, Paperclip, ChevronRight, Sparkles, Bot } from 'lucide-react'
import { PropertyCard } from '@/components/ui'
import { mockProperties } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

interface ChatMessage {
  id: string
  role: 'user' | 'propa'
  content: string
  timestamp: string
}

const initialMessages: ChatMessage[] = [
  {
    id: '1',
    role: 'propa',
    content:
      "Hello! 👋 I'm Propa, your AI property assistant. I can help you find verified homes across Abuja, Kaduna, and Minna. What are you looking for today?",
    timestamp: '10:00 AM',
  },
]

const quickReplies = [
  'Find a 3-bed in Gwarinpa',
  'Properties under ₦2M',
  'Show me verified estates',
]

/**
 * Chat with Propa Page
 * FOUNDATION.md Section 8.4
 */
export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [showProperties, setShowProperties] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const sendMessage = (text: string) => {
    if (!text.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // Simulated Propa response
    setTimeout(() => {
      setIsTyping(false)
      const propaReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'propa',
        content: getPropaResponse(text),
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
      }
      setMessages((prev) => [...prev, propaReply])
      setShowProperties(true)
    }, 1800)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-144px)] animate-fade-up">
      {/* ─── Chat Area ───────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-white rounded-card shadow-card overflow-hidden relative">
        {/* Subtle gradient header */}
        <div className="px-6 py-4 border-b border-divider flex items-center gap-3 bg-gradient-to-r from-white to-beige/40">
          <div className="w-10 h-10 rounded-full gradient-navy flex items-center justify-center relative">
            <Bot size={18} className="text-white" strokeWidth={1.5} />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-verified border-2 border-white" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-navy flex items-center gap-1.5">
              Propa AI
              <Sparkles size={14} className="text-gold" />
            </p>
            <p className="text-[12px] text-subtle">
              {isTyping ? 'Typing...' : 'Online · Responds instantly'}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {messages.map((msg, i) => (
            <div
              key={msg.id}
              className={cn(
                'flex gap-3 max-w-[80%] animate-fade-up',
                msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
              )}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {/* Avatar */}
              {msg.role === 'propa' && (
                <div className="w-8 h-8 rounded-full gradient-navy flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-[10px] font-bold text-white">P</span>
                </div>
              )}

              {/* Bubble */}
              <div>
                <div
                  className={cn(
                    'px-4 py-3 text-body-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-action to-[#0055cc] text-white rounded-[16px_16px_4px_16px] shadow-sm'
                      : 'bg-white border border-[#e8ecf2] text-navy rounded-[16px_16px_16px_4px] shadow-sm'
                  )}
                >
                  {msg.content}
                </div>
                <span className="text-[11px] text-placeholder mt-1.5 block px-1">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-3 max-w-[80%] animate-fade-up">
              <div className="w-8 h-8 rounded-full gradient-navy flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-[10px] font-bold text-white">P</span>
              </div>
              <div className="px-5 py-4 bg-white border border-[#e8ecf2] rounded-[16px_16px_16px_4px] shadow-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-subtle/50 animate-typing-1" />
                <span className="w-2 h-2 rounded-full bg-subtle/50 animate-typing-2" />
                <span className="w-2 h-2 rounded-full bg-subtle/50 animate-typing-3" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick replies */}
        {messages.length <= 1 && (
          <div className="px-6 pb-3 flex gap-2 flex-wrap">
            {quickReplies.map((reply) => (
              <button
                key={reply}
                onClick={() => sendMessage(reply)}
                className="px-4 py-2 rounded-badge bg-beige text-body-sm text-navy font-medium hover:bg-navy hover:text-white transition-all duration-200 border border-transparent hover:border-navy"
              >
                {reply}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="p-4 border-t border-divider flex items-center gap-3 bg-gradient-to-r from-white to-beige/20"
        >
          <button
            type="button"
            className="text-placeholder hover:text-subtle transition-colors duration-150"
            aria-label="Attach file"
          >
            <Paperclip size={20} strokeWidth={1.5} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Propa about properties..."
            className="flex-1 px-5 py-3 rounded-badge bg-beige border-none text-body-sm text-navy placeholder-placeholder focus:outline-none focus:ring-2 focus:ring-action transition-all duration-150"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="w-10 h-10 rounded-full bg-action hover:bg-action-hover disabled:opacity-40 flex items-center justify-center transition-all duration-200 hover:shadow-md disabled:shadow-none"
            aria-label="Send message"
          >
            <ArrowRight size={18} className="text-white" />
          </button>
        </form>
      </div>

      {/* ─── Property Results Panel (Desktop) ────────── */}
      {showProperties && (
        <div className="hidden lg:flex flex-col w-[340px] bg-white rounded-card shadow-card overflow-hidden flex-shrink-0 animate-slide-in-left">
          <div className="p-5 border-b border-divider bg-gradient-to-r from-white to-beige/30">
            <h3 className="text-h4 text-navy flex items-center gap-2">
              Properties found
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-action text-[11px] font-bold text-white">
                {mockProperties.length}
              </span>
            </h3>
            <p className="text-caption text-subtle mt-1">
              All physically verified by our team
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {mockProperties.slice(0, 3).map((property, i) => (
              <div
                key={property.id}
                className="border border-[#e2e8f0] rounded-card overflow-hidden card-lift animate-fade-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="relative h-32">
                  <Image
                    src={property.images[0]}
                    alt={property.title}
                    fill
                    className="object-cover"
                  />
                  {/* Verified badge */}
                  <div className="absolute bottom-2 left-2 px-2 py-1 rounded-badge glass text-[10px] font-semibold text-navy flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-verified" />
                    Verified
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-h4 text-navy">
                    {new Intl.NumberFormat('en-NG', {
                      style: 'currency',
                      currency: 'NGN',
                      minimumFractionDigits: 0,
                    }).format(property.price)}
                    {property.priceType === 'yearly' ? '/yr' : ''}
                  </p>
                  <p className="text-body-sm text-navy font-medium mt-1 line-clamp-1">
                    {property.title}
                  </p>
                  <p className="text-caption text-subtle mt-1">
                    {property.location}
                  </p>
                  <button className="mt-2 text-nav font-semibold text-action flex items-center gap-1 hover:text-action-hover transition-colors duration-150 group">
                    View Details <ChevronRight size={12} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function getPropaResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase()
  if (lower.includes('gwarinpa') || lower.includes('3-bed')) {
    return "Oya, I've found some nice options in Gwarinpa for you! I'm showing 3 verified listings on the right. All physically inspected — no wahala. Want me to narrow it down by budget?"
  }
  if (lower.includes('under') || lower.includes('₦2m') || lower.includes('budget')) {
    return "I've pulled up properties under your budget. These are all verified by our team — title-checked and physically inspected. Check the results on the right. Which one catches your eye?"
  }
  if (lower.includes('estate') || lower.includes('verified')) {
    return "Here are some of the top verified estates we have listed. Every single one has been physically inspected by our team. Zero fees to book a viewing — just say the word and I'll set it up!"
  }
  return "I hear you! Let me search our verified listings for you. I've pulled up some options on the right — all physically inspected and title-verified. Anything specific you'd like to filter by?"
}
