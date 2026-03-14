import React, { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Minimize2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import AgentMessage from './AgentMessage'
import AgentQuickActions from './AgentQuickActions'

interface Message {
  role: 'user' | 'assistant'
  content: string
  intent?: string
}

const QUICK_ACTIONS = [
  { label: '¿Por dónde empiezo?', message: 'Where do I start? I am new here.' },
  { label: '¿Qué hago después?', message: 'What should I do next?' },
  { label: 'Revisar mis CARs', message: 'Please review my CAR stories and give me feedback.' },
  { label: 'Ayuda con el resume', message: 'Help me with my resume.' },
  { label: 'Mejor historia para entrevista', message: 'Which of my stories is best for an interview?' },
]

export default function SupportAgentWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const sessionId = useRef(`session_${Date.now()}`).current

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Send a welcome message
      setMessages([{
        role: 'assistant',
        content: '👋 ¡Hola! Soy tu Super Agente de Soporte. Puedo ayudarte con tu resume, historias CAR, preparación para entrevistas, y mucho más.\n\n¿En qué te puedo ayudar hoy?'
      }])
    }
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || loading) return

    const userMessage: Message = { role: 'user', content: messageText }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    // Optimistically add streaming assistant message
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Not authenticated')

      const apiBase = import.meta.env.VITE_API_URL || ''
      const response = await fetch(`${apiBase}/api/agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: messageText,
          sessionId,
          conversationHistory: newMessages
            .filter(m => m.role === 'user' || m.role === 'assistant')
            .slice(-6)
            .map(m => ({ role: m.role, content: m.content }))
        }),
      })

      if (!response.ok) throw new Error('Agent request failed')

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ''
      let intent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'delta') {
                assistantContent += data.content
                setMessages(prev => [
                  ...prev.slice(0, -1),
                  { role: 'assistant', content: assistantContent, intent }
                ])
              } else if (data.type === 'done') {
                intent = data.intent || ''
                setMessages(prev => [
                  ...prev.slice(0, -1),
                  { role: 'assistant', content: assistantContent, intent }
                ])
              }
            } catch (_) {}
          }
        }
      }
    } catch (err) {
      console.error('[SupportAgent] Error:', err)
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: 'Lo siento, ocurrió un error. Por favor intenta de nuevo.' }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-blue-600 to-violet-600 text-white rounded-full shadow-2xl hover:shadow-blue-500/30 hover:scale-110 transition-all duration-200 flex items-center justify-center"
          title="Super Support Agent"
          aria-label="Open Support Agent"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-h-[620px] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">Super Agent</div>
                <div className="text-xs opacity-75">NovaWork Global</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors" aria-label="Minimize">
                <Minimize2 className="w-4 h-4" />
              </button>
              <button onClick={() => { setIsOpen(false); setMessages([]) }} className="p-1 hover:bg-white/20 rounded-lg transition-colors" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: '420px' }}>
            {messages.map((msg, i) => (
              <AgentMessage key={i} role={msg.role} content={msg.content} />
            ))}
            {loading && messages[messages.length - 1]?.content === '' && (
              <div className="flex gap-1 items-center px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick actions (show only initially) */}
          {messages.length <= 1 && (
            <AgentQuickActions actions={QUICK_ACTIONS} onSelect={sendMessage} />
          )}

          {/* Input */}
          <div className="px-3 py-3 border-t border-slate-200 dark:border-slate-700">
            <div className="flex gap-2 items-end">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu pregunta..."
                rows={1}
                disabled={loading}
                className="flex-1 resize-none px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                style={{ maxHeight: '80px' }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                className="px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-semibold flex-shrink-0"
              >
                →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
