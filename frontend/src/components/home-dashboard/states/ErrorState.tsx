import { AlertCircle } from 'lucide-react'

interface ErrorStateProps {
  message: string
  retryLabel: string
  onRetry: () => void
  className?: string
}

export default function ErrorState({ message, retryLabel, onRetry, className = '' }: ErrorStateProps) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-2xl border border-red-100 dark:border-red-900 p-8 flex flex-col items-center justify-center text-center gap-3 ${className}`}
    >
      <AlertCircle size={28} className="text-red-400" />
      <p className="text-sm text-slate-500 dark:text-gray-400">{message}</p>
      <button
        onClick={onRetry}
        className="mt-1 px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 active:scale-95"
        style={{ background: '#1976D2' }}
      >
        {retryLabel}
      </button>
    </div>
  )
}
