import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'

export default function MembershipSection() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const plans = [
    {
      key: 'core',
      name: t('memberships.core.name'),
      price: t('memberships.core.price'),
      description: t('memberships.core.description'),
      features: t('memberships.core.features', { returnObjects: true }) as string[],
      cta: t('memberships.core.cta'),
      featured: false,
      image: '/images/Core.png',
    },
    {
      key: 'advance',
      name: t('memberships.advance.name'),
      price: t('memberships.advance.price'),
      description: t('memberships.advance.description'),
      features: t('memberships.advance.features', { returnObjects: true }) as string[],
      cta: t('memberships.advance.cta'),
      featured: true,
      badge: t('memberships.advance.badge'),
      image: '/images/Advance.png',
    },
    {
      key: 'apex',
      name: t('memberships.apex.name'),
      price: t('memberships.apex.price'),
      description: t('memberships.apex.description'),
      features: t('memberships.apex.features', { returnObjects: true }) as string[],
      cta: t('memberships.apex.cta'),
      featured: false,
      image: '/images/Apex.png',
    },
  ]

  return (
    <section id="memberships" className="py-20 px-4 bg-[var(--ascendia-bg)]">
      <div className="max-w-7xl mx-auto">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-4"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-[var(--ascendia-accent)] text-[var(--ascendia-primary)] text-xs font-semibold tracking-wider uppercase">
            {t('memberships.badge')}
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
            <span className="font-serif">{t('memberships.title')}</span>
          </h2>
          <p className="text-lg text-[var(--ascendia-text-muted)] max-w-2xl mx-auto leading-relaxed">
            {t('memberships.subtitle')}
          </p>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.key}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className={`relative bg-[var(--ascendia-surface)] rounded-[var(--ascendia-radius-lg)] border flex flex-col overflow-hidden group ${
                plan.featured
                  ? 'border-[var(--ascendia-primary)] shadow-[var(--ascendia-shadow-lg)]'
                  : 'border-[var(--ascendia-border-soft)] shadow-[var(--ascendia-shadow-sm)]'
              }`}
            >
              {plan.featured && plan.badge && (
                <span className="absolute top-4 right-4 z-10 px-3 py-1 bg-[var(--ascendia-primary)] text-[var(--ascendia-primary-foreground)] text-xs font-semibold rounded-full shadow-md">
                  {plan.badge}
                </span>
              )}

              {plan.image && (
                <div className="w-full aspect-[2/3] overflow-hidden bg-gradient-to-br from-[var(--ascendia-bg-subtle)] to-[var(--ascendia-bg)] border-b border-[var(--ascendia-border-soft)] relative">
                  <img
                    src={plan.image}
                    alt={plan.name}
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              )}

              <div className="p-6 md:p-8 flex flex-col flex-grow">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-[var(--ascendia-text)] mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-[var(--ascendia-text)]">${plan.price}</span>
                    <span className="text-[var(--ascendia-text-muted)]">{t('memberships.perMonth')}</span>
                  </div>
                  <p className="text-sm text-[var(--ascendia-text-muted)] mt-3 leading-relaxed">{plan.description}</p>
                </div>

                <ul className="flex flex-col gap-3 mb-8 flex-grow">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[var(--ascendia-text)]">
                      <Check className="w-4 h-4 text-[var(--ascendia-primary)] mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => {
                    localStorage.setItem('novawork_pending_plan', plan.key)
                    navigate(`/signup?plan=${plan.key}`)
                  }}
                  className={`w-full py-3 rounded-full text-sm font-semibold transition-all ${
                    plan.featured
                      ? 'bg-[var(--ascendia-primary)] text-[var(--ascendia-primary-foreground)] hover:bg-[var(--ascendia-primary-hover)]'
                      : 'bg-[var(--ascendia-accent)] text-[var(--ascendia-primary)] hover:bg-[var(--ascendia-accent-hover)]'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}