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
      badge: null,
    },
    {
      key: 'advance',
      name: t('memberships.advance.name'),
      price: t('memberships.advance.price'),
      renewalPrice: t('memberships.advance.renewalPrice'),
      description: t('memberships.advance.description'),
      features: t('memberships.advance.features', { returnObjects: true }) as string[],
      cta: t('memberships.advance.cta'),
      featured: true,
      badge: t('memberships.advance.badge'),
      disclosure: t('memberships.advance.disclosure'),
    },
    {
      key: 'apex',
      name: t('memberships.apex.name'),
      price: t('memberships.apex.price'),
      renewalPrice: t('memberships.apex.renewalPrice'),
      description: t('memberships.apex.description'),
      features: t('memberships.apex.features', { returnObjects: true }) as string[],
      cta: t('memberships.apex.cta'),
      featured: false,
      badge: t('memberships.apex.badge'),
      disclosure: t('memberships.apex.disclosure'),
    },
  ]

  return (
    <section id="memberships" className="py-20 px-4 bg-[var(--ascendia-bg)]">
      <div className="max-w-6xl mx-auto">
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
          {plans.map((plan, index) => {
            const isPaid = plan.key !== 'core'

            return (
              <motion.div
                key={plan.key}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className={`relative bg-[var(--ascendia-surface)] rounded-[var(--ascendia-radius-lg)] border flex flex-col overflow-hidden ${
                  plan.featured
                    ? 'border-[var(--ascendia-primary)] shadow-[var(--ascendia-shadow-lg)]'
                    : 'border-[var(--ascendia-border-soft)] shadow-[var(--ascendia-shadow-sm)]'
                }`}
              >
                {plan.badge && (
                  <span className={`absolute top-4 right-4 z-10 px-3 py-1 text-xs font-semibold rounded-full ${
                    plan.key === 'advance'
                      ? 'bg-[var(--ascendia-primary)] text-white shadow-sm'
                      : 'bg-[var(--ascendia-accent)] text-[var(--ascendia-primary)] border border-[var(--ascendia-primary)]/20'
                  }`}>
                    {plan.badge}
                  </span>
                )}

                <div className="p-6 md:p-8 flex flex-col flex-grow">
                  {/* Plan Name */}
                  <h3 className="text-2xl font-bold text-[var(--ascendia-text)] mb-2">{plan.name}</h3>

                  {/* Price Display */}
                  <div className="mb-2">
                    {isPaid ? (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-5xl font-bold text-[var(--ascendia-primary)]">${plan.price}</span>
                        </div>
                        <p className="text-sm font-medium text-[var(--ascendia-text-muted)] mt-1">
                          {t('memberships.starterAccess')}
                        </p>
                        <p className="text-base text-[var(--ascendia-text-muted)] mt-1">
                          {t('memberships.thenPerMonth', { price: plan.renewalPrice })}
                        </p>
                      </>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-bold text-[var(--ascendia-text)]">${plan.price}</span>
                        <span className="text-[var(--ascendia-text-muted)]">{t('memberships.perMonth')}</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-[var(--ascendia-text-muted)] mt-3 mb-6 leading-relaxed">{plan.description}</p>

                  {/* Features */}
                  <ul className="flex flex-col gap-3 mb-8 flex-grow">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-[var(--ascendia-text)]">
                        <Check className="w-4 h-4 text-[var(--ascendia-primary)] mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={() => {
                      localStorage.setItem('novawork_pending_plan', plan.key)
                      navigate(`/signup?plan=${plan.key}`)
                    }}
                    className={`w-full py-3.5 rounded-full text-sm font-semibold transition-all ${
                      plan.featured
                        ? 'bg-[var(--ascendia-primary)] text-white hover:bg-[var(--ascendia-primary-hover)]'
                        : plan.key === 'apex'
                          ? 'bg-[var(--ascendia-primary)] text-white hover:bg-[var(--ascendia-primary-hover)]'
                          : 'bg-[var(--ascendia-accent)] text-[var(--ascendia-primary)] hover:bg-[var(--ascendia-accent-hover)]'
                    }`}
                  >
                    {plan.cta}
                  </button>

                  {/* Disclosure */}
                  {plan.disclosure && (
                    <p className="text-xs text-[var(--ascendia-text-muted)] mt-3 text-center leading-relaxed">
                      {plan.disclosure}
                    </p>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}