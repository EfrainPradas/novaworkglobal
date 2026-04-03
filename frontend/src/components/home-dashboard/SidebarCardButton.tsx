import { useNavigate } from 'react-router-dom'
import { Play } from 'lucide-react'

interface SidebarCardButtonProps {
  title: string
  label: string
  subtitle?: string
  path: string
  iconBg?: string
  iconColor?: string
  cardBg?: string
  cardHoverBg?: string
}

export default function SidebarCardButton({
  title,
  label,
  subtitle,
  path,
  iconBg = '#E8F5E9',
  iconColor = '#2E7D32',
  cardBg = '#F0FDF4',
  cardHoverBg = '#DCFCE7',
}: SidebarCardButtonProps) {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate(path)}
      className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group"
      style={{
        background: cardBg,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = cardHoverBg
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = cardBg
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'
      }}
    >
      <span
        className="flex-shrink-0 flex items-center justify-center rounded-xl"
        style={{
          width: 42,
          height: 42,
          background: iconBg,
          color: iconColor,
        }}
      >
        <Play size={18} fill="currentColor" className="ml-0.5" />
      </span>

      <div className="flex-1 text-left min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 leading-tight">
          {title}
        </p>
        <p className="text-sm font-semibold text-slate-700 dark:text-gray-200 leading-tight truncate group-hover:text-slate-900 dark:group-hover:text-white">
          {label}
        </p>
        {subtitle && (
          <p className="text-[11px] text-slate-400 dark:text-gray-400 leading-tight mt-0.5 truncate">
            {subtitle}
          </p>
        )}
      </div>
    </button>
  )
}
