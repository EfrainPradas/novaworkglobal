import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Zap, Network, Calendar } from 'lucide-react'

interface WelcomeHeroProps {
  userName: string | null
  profileCompletion: number
}

export default function WelcomeHero({ userName, profileCompletion }: WelcomeHeroProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const firstName = userName?.split(' ')[0] ?? ''

  return (
    <div
      className="rounded-2xl p-6 mb-5"
      style={{
        background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 60%, #42A5F5 100%)',
        color: '#fff',
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-blue-100 text-sm font-medium mb-1">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-2xl font-bold leading-tight">
            {firstName
              ? t('dashboard.home.greeting', { name: firstName })
              : t('dashboard.home.title')}
          </h1>
          <p className="mt-1 text-blue-100 text-sm">{t('dashboard.home.subtitle')}</p>

          {/* Profile completion bar */}
          {profileCompletion < 100 && (
            <div className="mt-3 max-w-xs">
              <div className="flex justify-between text-xs text-blue-100 mb-1">
                <span>{t('dashboard.statsSection.profileCompletion')}</span>
                <span>{profileCompletion}%</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.25)' }}>
                <div
                  className="h-1.5 rounded-full transition-all duration-700"
                  style={{ width: `${profileCompletion}%`, background: '#fff' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* CTA buttons */}
        <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
          <button
            onClick={() => navigate('/resume-builder')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
            style={{ background: '#fff', color: '#1565C0' }}
          >
            <Zap size={15} />
            {t('dashboard.cta.continueProgram')}
          </button>
          <button
            onClick={() => navigate('/dashboard/networking-sessions')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all hover:bg-white/20 active:scale-95"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}
          >
            <Network size={15} />
            {t('dashboard.cta.exploreNetworking')}
          </button>
          <button
            onClick={() => navigate('/dashboard/member-calendar')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all hover:bg-white/20 active:scale-95"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}
          >
            <Calendar size={15} />
            {t('dashboard.cta.viewCalendar')}
          </button>
        </div>
      </div>
    </div>
  )
}
