import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export default function LandingPageCTA() {
    const navigate = useNavigate()
    const { t } = useTranslation()

    return (
        <section className="py-20 px-4 bg-gradient-to-br from-[var(--ascendia-primary)] to-[var(--ascendia-primary-deep)]">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="max-w-4xl mx-auto text-center"
            >
                <h2 className="text-4xl md:text-5xl font-bold text-[var(--ascendia-primary-foreground)] mb-4">
                    <span className="font-serif">{t('cta.title')}</span>
                </h2>
                <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                    {t('cta.subtitle')}
                </p>
                <button
                    onClick={() => document.getElementById('memberships')?.scrollIntoView({ behavior: 'smooth' })}
                    className="group inline-flex items-center gap-2 bg-[var(--ascendia-surface)] text-[var(--ascendia-primary)] px-8 py-4 rounded-full text-lg font-semibold hover:bg-[var(--ascendia-accent)] transition-colors shadow-[var(--ascendia-shadow-md)]"
                >
                    {t('cta.button')}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
            </motion.div>
        </section>
    )
}