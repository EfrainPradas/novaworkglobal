import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Zap, Network, ChevronRight } from 'lucide-react'

/* ─── Mini Calendar ─────────────────────────────────── */
function MiniCalendar() {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const todayDate = today.getDate()

  const monthName = today.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  const firstDay = new Date(year, month, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Build grid: blanks + days
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null)

  const DAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  return (
    <div className="w-full">
      {/* Month header */}
      <p className="text-xs font-semibold text-slate-600 text-center mb-2 capitalize">
        {monthName}
      </p>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADERS.map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-slate-300">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => (
          <div key={i} className="flex items-center justify-center h-6">
            {day !== null && (
              <span
                className="flex items-center justify-center rounded-full text-[11px] font-medium transition-colors"
                style={{
                  width: 22,
                  height: 22,
                  background: day === todayDate ? '#1976D2' : 'transparent',
                  color: day === todayDate ? '#fff' : day < todayDate ? '#CBD5E1' : '#334155',
                  fontWeight: day === todayDate ? 700 : 500,
                }}
              >
                {day}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Quick Action Cards ─────────────────────────────── */
export default function QuickActionCards() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">

      {/* Card 1 — Continue Program */}
      <button
        onClick={() => navigate('/resume-builder')}
        className="text-left rounded-2xl p-5 flex flex-col gap-3 transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] group"
        style={{ background: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
      >
        <div className="flex items-start justify-between">
          <span
            className="flex items-center justify-center rounded-xl"
            style={{ width: 40, height: 40, background: '#EFF6FF', color: '#1976D2' }}
          >
            <Zap size={18} />
          </span>
          <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors mt-1" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800 mb-0.5">{t('dashboard.cta.continueProgram')}</p>
          <p className="text-xs text-slate-400 leading-relaxed">{t('dashboard.quickActions.continueDesc')}</p>
        </div>
      </button>

      {/* Card 2 — Explore Networking */}
      <button
        onClick={() => navigate('/dashboard/networking-sessions')}
        className="text-left rounded-2xl p-5 flex flex-col gap-3 transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] group"
        style={{ background: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
      >
        <div className="flex items-start justify-between">
          <span
            className="flex items-center justify-center rounded-xl"
            style={{ width: 40, height: 40, background: '#F0FDF4', color: '#16A34A' }}
          >
            <Network size={18} />
          </span>
          <ChevronRight size={16} className="text-slate-300 group-hover:text-green-500 transition-colors mt-1" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800 mb-0.5">{t('dashboard.cta.exploreNetworking')}</p>
          <p className="text-xs text-slate-400 leading-relaxed">{t('dashboard.quickActions.networkingDesc')}</p>
        </div>
      </button>

      {/* Card 3 — Member Calendar (mini calendar) */}
      <button
        onClick={() => navigate('/dashboard/member-calendar')}
        className="text-left rounded-2xl p-5 flex flex-col gap-3 transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] group"
        style={{ background: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
      >
        <div className="flex items-start justify-between mb-1">
          <p className="text-sm font-bold text-slate-800">{t('dashboard.cta.viewCalendar')}</p>
          <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors mt-0.5" />
        </div>
        <MiniCalendar />
      </button>

    </div>
  )
}
