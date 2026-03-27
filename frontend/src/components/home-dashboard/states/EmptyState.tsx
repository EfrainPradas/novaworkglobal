import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  message: string
  className?: string
  icon?: React.ReactNode
}

export default function EmptyState({ message, className = '', icon }: EmptyStateProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-100 p-8 flex flex-col items-center justify-center text-center gap-3 ${className}`}
    >
      <div className="text-slate-300">
        {icon ?? <Inbox size={32} />}
      </div>
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  )
}
