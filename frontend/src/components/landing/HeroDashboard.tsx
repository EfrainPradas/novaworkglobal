import { motion } from 'framer-motion'
import { ArrowRight, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

function ScoreRing({ value, label }: { value: string; label: string }) {
  const numericValue = parseInt(value)
  const circumference = 2 * Math.PI * 52
  const offset = circumference - (numericValue / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-[120px] h-[120px]">
        <svg width="120" height="120" viewBox="0 0 120 120" className="transform -rotate-90">
          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--ascendia-border-soft)" strokeWidth="8" />
          <motion.circle
            cx="60" cy="60" r="52" fill="none"
            stroke="var(--ascendia-primary)" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            whileInView={{ strokeDashoffset: offset }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-[var(--ascendia-text)]">{value}</span>
          <span className="text-xs text-[var(--ascendia-text-muted)]">{label}</span>
        </div>
      </div>
    </div>
  )
}

export default function HeroDashboard() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const matches = [
    { role: t('hero.dashboard.role1'), match: t('hero.dashboard.match1') },
    { role: t('hero.dashboard.role2'), match: t('hero.dashboard.match2') },
    { role: t('hero.dashboard.role3'), match: t('hero.dashboard.match3') },
  ]

  return (
    <section className="relative min-h-[100dvh] flex items-center bg-[var(--ascendia-bg)] overflow-hidden pt-20 pb-16 md:pt-28 md:pb-24">
      {/* Background blobs */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-[var(--ascendia-accent)]/40 transform skew-x-12 translate-x-32 opacity-50" />
      <div className="absolute bottom-0 left-0 w-64 h-64 md:w-96 md:h-96 bg-[var(--ascendia-secondary)]/10 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <span className="inline-block px-3 py-1 rounded-full bg-[var(--ascendia-accent)] text-[var(--ascendia-primary)] text-sm font-semibold mb-6">
              {t('hero.badge')}
            </span>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[var(--ascendia-text)] leading-[1.1] mb-4">
              {t('hero.title1')}{' '}
              <span className="font-serif text-[var(--ascendia-primary)]">{t('hero.title2')}</span>
            </h1>

            <p className="text-xl md:text-2xl font-medium text-[var(--ascendia-text)] mb-3">
              {t('hero.subtitle')}
            </p>

            <p className="text-base md:text-lg text-[var(--ascendia-text-muted)] max-w-lg leading-relaxed mb-8 border-l-[3px] border-[var(--ascendia-primary)]/30 pl-5">
              {t('hero.description')}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
              <button
                onClick={() => document.getElementById('memberships')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto group px-6 py-3 bg-[var(--ascendia-primary)] text-[var(--ascendia-primary-foreground)] rounded-full font-semibold text-base flex items-center justify-center gap-2 hover:bg-[var(--ascendia-primary-hover)] transition-all shadow-sm"
              >
                {t('hero.ctaStart')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto px-6 py-3 bg-[var(--ascendia-accent)] text-[var(--ascendia-primary)] rounded-full font-semibold text-base hover:bg-[var(--ascendia-accent-hover)] transition-all flex items-center justify-center gap-2"
              >
                {t('hero.ctaExplore')}
              </button>
            </div>

            <div className="flex items-center gap-4 text-sm text-[var(--ascendia-text-muted)]">
              <span>{t('hero.trust1')}</span>
              <span className="w-1 h-1 rounded-full bg-[var(--ascendia-text-muted)]" />
              <span>{t('hero.trust2')}</span>
              <span className="w-1 h-1 rounded-full bg-[var(--ascendia-text-muted)]" />
              <span>{t('hero.trust3')}</span>
            </div>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative hidden lg:block"
          >
            <div className="bg-[var(--ascendia-surface)] rounded-[var(--ascendia-radius-lg)] border border-[var(--ascendia-border)] shadow-[var(--ascendia-shadow-lg)] overflow-hidden">
              {/* Dashboard Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--ascendia-border-soft)] bg-[var(--ascendia-surface-muted)]">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[var(--ascendia-primary)]" />
                  <span className="text-sm font-semibold text-[var(--ascendia-text)]">{t('hero.dashboard.title')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-[var(--ascendia-text-muted)]">{t('hero.dashboard.live')}</span>
                </div>
              </div>

              {/* Dashboard Body */}
              <div className="p-5 grid grid-cols-2 gap-4">
                {/* Score Ring */}
                <div className="relative flex flex-col items-center justify-center bg-[var(--ascendia-accent-subtle)] rounded-[var(--ascendia-radius-md)] p-4">
                  <ScoreRing value={t('hero.dashboard.scoreValue')} label={t('hero.dashboard.scoreLabel')} />
                  <p className="text-xs text-[var(--ascendia-text-muted)] text-center mt-2 leading-snug">
                    <span className="font-semibold text-[var(--ascendia-text)]">{t('hero.dashboard.recTitle')}</span>
                    <br />{t('hero.dashboard.recDesc')}
                  </p>
                </div>

                {/* Matches + Progress */}
                <div className="flex flex-col gap-3">
                  {/* Progress */}
                  <div className="bg-[var(--ascendia-accent-subtle)] rounded-[var(--ascendia-radius-md)] p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[var(--ascendia-text-muted)]">{t('hero.dashboard.progressLabel')}</span>
                      <span className="text-xs font-semibold text-[var(--ascendia-primary)]">{t('hero.dashboard.progressDelta')}</span>
                    </div>
                    <div className="w-full h-2 bg-[var(--ascendia-border-soft)] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-[var(--ascendia-primary)] rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: '72%' }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, delay: 0.5 }}
                      />
                    </div>
                  </div>

                  {/* Matches */}
                  <div className="bg-[var(--ascendia-accent-subtle)] rounded-[var(--ascendia-radius-md)] p-3">
                    <span className="text-xs font-semibold text-[var(--ascendia-text)]">{t('hero.dashboard.matchesTitle')}</span>
                    <div className="flex flex-col gap-2 mt-2">
                      {matches.map((m, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-xs text-[var(--ascendia-text-muted)]">{m.role}</span>
                          <span className="text-xs font-semibold text-[var(--ascendia-primary)]">{m.match}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Coach Pill */}
              <div className="mx-5 mb-4 flex items-center justify-between bg-[var(--ascendia-primary)] rounded-[var(--ascendia-radius-full)] px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">A</div>
                  <span className="text-sm text-white font-medium">{t('hero.dashboard.coachName')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-xs text-white/80">{t('hero.dashboard.coachStatus')}</span>
                </div>
              </div>
            </div>

            {/* Floating Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="absolute top-2 -right-4 bg-[var(--ascendia-surface)] border border-[var(--ascendia-border)] shadow-[var(--ascendia-shadow-md)] rounded-[var(--ascendia-radius-md)] px-4 py-2.5"
            >
              <span className="text-lg font-bold text-[var(--ascendia-primary)]">{t('hero.dashboard.statRate')}</span>
              <p className="text-xs text-[var(--ascendia-text-muted)]">{t('hero.dashboard.statRateLabel')}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
              className="absolute bottom-14 -right-4 bg-[var(--ascendia-surface)] border border-[var(--ascendia-border)] shadow-[var(--ascendia-shadow-md)] rounded-[var(--ascendia-radius-md)] px-4 py-2.5"
            >
              <span className="text-lg font-bold text-[var(--ascendia-text)]">{t('hero.dashboard.statMatches')}</span>
              <p className="text-xs text-[var(--ascendia-text-muted)]">{t('hero.dashboard.statMatchesLabel')}</p>
            </motion.div>

            {/* Decorative Grid */}
            <div className="absolute -z-10 top-6 -right-4 w-full h-full border border-[var(--ascendia-border-soft)] rounded-[var(--ascendia-radius-lg)]" />
          </motion.div>
        </div>
      </div>
    </section>
  )
}