import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Search, Target, Route, Sparkles } from 'lucide-react'

const pillarIcons = [Search, Target, Route, Sparkles]

export default function MethodSection() {
  const { t } = useTranslation()

  const pillars = [
    { title: t('method.pillar1Title'), copy: t('method.pillar1Copy') },
    { title: t('method.pillar2Title'), copy: t('method.pillar2Copy') },
    { title: t('method.pillar3Title'), copy: t('method.pillar3Copy') },
    { title: t('method.pillar4Title'), copy: t('method.pillar4Copy') },
  ]

  return (
    <section id="methodology" className="py-20 px-4 bg-[var(--ascendia-surface)]">
      <div className="max-w-7xl mx-auto">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-4"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-[var(--ascendia-accent)] text-[var(--ascendia-primary)] text-xs font-semibold tracking-wider uppercase">
            {t('method.badge')}
          </span>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--ascendia-text)] mb-6">
            <span className="font-serif">{t('method.title')}</span>
          </h2>
          <p className="text-lg text-[var(--ascendia-text-muted)] max-w-2xl mx-auto leading-relaxed">
            {t('method.subtitle')}
          </p>
        </motion.div>

        {/* Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {pillars.map((pillar, index) => {
            const Icon = pillarIcons[index]
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="bg-[var(--ascendia-bg)] rounded-[var(--ascendia-radius-md)] p-6 border border-[var(--ascendia-border-soft)] hover:border-[var(--ascendia-primary)]/30 hover:shadow-[var(--ascendia-shadow-sm)] transition-all"
              >
                <div className="w-12 h-12 bg-[var(--ascendia-accent)] rounded-[var(--ascendia-radius-sm)] flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-[var(--ascendia-primary)]" />
                </div>
                <h3 className="text-lg font-bold text-[var(--ascendia-text)] mb-2">{pillar.title}</h3>
                <p className="text-sm text-[var(--ascendia-text-muted)] leading-relaxed">{pillar.copy}</p>
              </motion.div>
            )
          })}
        </div>

        {/* Quote */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-16 max-w-3xl mx-auto text-center"
        >
          <blockquote className="text-lg md:text-xl text-[var(--ascendia-text-muted)] italic leading-relaxed border-l-4 border-[var(--ascendia-primary)] pl-6">
            "{t('method.quote')}"
          </blockquote>
        </motion.div>
      </div>
    </section>
  )
}