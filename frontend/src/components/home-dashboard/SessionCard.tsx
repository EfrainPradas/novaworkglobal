import { useTranslation } from 'react-i18next'
import { Calendar, Clock, Users, CheckCircle, Loader2 } from 'lucide-react'
import type { MemberSession } from '../../types/home-dashboard'

interface SessionCardProps {
  session: MemberSession
  onRegister: (sessionId: string) => void
  onCancel: (sessionId: string) => void
  registering: boolean
}

const SESSION_TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  workshop:    { bg: '#E3F2FD', color: '#1565C0' },
  networking:  { bg: '#E8F5E9', color: '#2E7D32' },
  q_and_a:     { bg: '#FFF3E0', color: '#E65100' },
  masterclass: { bg: '#F3E5F5', color: '#6A1B9A' },
}

export default function SessionCard({ session, onRegister, onCancel, registering }: SessionCardProps) {
  const { t } = useTranslation()

  const typeColor = SESSION_TYPE_COLORS[session.session_type] ?? { bg: '#F1F5F9', color: '#475569' }
  const isRegistered = session.user_registration === 'registered'
  const isFull = session.seats_left === 0 && !isRegistered

  const formattedDate = new Date(session.scheduled_at).toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
  })
  const formattedTime = new Date(session.scheduled_at).toLocaleTimeString(undefined, {
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 p-4 flex flex-col gap-3 transition-all hover:shadow-md"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span
              className="px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: typeColor.bg, color: typeColor.color }}
            >
              {t(`dashboard.sessions.${session.session_type}` as any, session.session_type)}
            </span>
            {isRegistered && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                <CheckCircle size={11} />
                {t('dashboard.sessions.registered')}
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white leading-snug">{session.title}</h3>
          {session.description && (
            <p className="text-xs text-slate-400 dark:text-gray-400 mt-0.5 line-clamp-2">{session.description}</p>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-gray-400">
        <span className="flex items-center gap-1"><Calendar size={12} />{formattedDate}</span>
        <span className="flex items-center gap-1"><Clock size={12} />{formattedTime}</span>
        <span className="flex items-center gap-1">
          <Clock size={12} />{t('dashboard.sessions.duration', { minutes: session.duration_minutes })}
        </span>
        {!isFull && !isRegistered && (
          <span className="flex items-center gap-1 text-emerald-600">
            <Users size={12} />
            {t(`dashboard.sessions.seatsLeft`, {
              count: session.seats_left,
              defaultValue: `${session.seats_left} seats left`,
            })}
          </span>
        )}
        {isFull && (
          <span className="flex items-center gap-1 text-red-500">
            <Users size={12} />{t('dashboard.sessions.full')}
          </span>
        )}
      </div>

      {/* Action */}
      <div className="pt-1">
        {isRegistered ? (
          <button
            onClick={() => onCancel(session.id)}
            disabled={registering}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 border border-red-100 dark:border-red-900/30 disabled:opacity-50"
          >
            {registering ? <Loader2 size={14} className="animate-spin" /> : null}
            {t('dashboard.sessions.cancelRegistration')}
          </button>
        ) : (
          <button
            onClick={() => onRegister(session.id)}
            disabled={isFull || registering}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white"
            style={{ background: isFull ? '#94A3B8' : '#1976D2' }}
          >
            {registering ? <Loader2 size={14} className="animate-spin" /> : null}
            {isFull ? t('dashboard.sessions.full') : t('dashboard.sessions.register')}
          </button>
        )}
      </div>
    </div>
  )
}
