interface LoadingCardProps {
  lines?: number
  className?: string
}

export default function LoadingCard({ lines = 3, className = '' }: LoadingCardProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 p-5 animate-pulse ${className}`}>
      <div className="h-4 bg-slate-200 dark:bg-gray-600 rounded w-1/3 mb-4" />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 bg-slate-100 dark:bg-gray-700 rounded mb-2"
          style={{ width: `${85 - i * 10}%` }}
        />
      ))}
    </div>
  )
}
