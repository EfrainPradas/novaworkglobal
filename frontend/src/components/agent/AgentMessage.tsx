import React from 'react'

interface Props {
  role: 'user' | 'assistant'
  content: string
}

export default function AgentMessage({ role, content }: Props) {
  const isUser = role === 'user'

  // Simple markdown-like rendering: bold, line breaks, emojis render naturally
  const formatContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Bold: **text**
      const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      return (
        <span key={i}>
          <span dangerouslySetInnerHTML={{ __html: formatted }} />
          {i < text.split('\n').length - 1 && <br />}
        </span>
      )
    })
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-sm'
        }`}
      >
        {content ? formatContent(content) : (
          <span className="opacity-50 italic">...</span>
        )}
      </div>
    </div>
  )
}
