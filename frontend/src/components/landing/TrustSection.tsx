import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

export default function TrustSection() {
    const { t } = useTranslation()

    const logos = [
        t('trust.logos.google'),
        t('trust.logos.microsoft'),
        t('trust.logos.stripe'),
        t('trust.logos.salesforce'),
        t('trust.logos.meta'),
        t('trust.logos.amazon'),
    ]

    return (
        <section className="py-12 px-4 bg-[var(--ascendia-surface)] border-y border-[var(--ascendia-border-soft)]">
            <div className="max-w-7xl mx-auto">
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-center text-sm text-[var(--ascendia-text-muted)] mb-8"
                >
                    {t('trust.title')}
                </motion.p>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4"
                >
                    {logos.map((name) => (
                        <span
                            key={name}
                            className="text-lg md:text-xl font-bold text-[var(--ascendia-text-subtle)] tracking-tight"
                        >
                            {name}
                        </span>
                    ))}
                </motion.div>
            </div>
        </section>
    )
}