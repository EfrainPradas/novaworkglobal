import { motion } from 'framer-motion'
import { Users, Lightbulb, CheckCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function ProblemSection() {
    const { t } = useTranslation()
    return (
        <section className="py-20 px-4 bg-[var(--ascendia-bg)]">
            <div className="max-w-7xl mx-auto">
                {/* Kicker */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-4"
                >
                    <span className="inline-block px-3 py-1 rounded-full bg-[var(--ascendia-accent)] text-[var(--ascendia-primary)] text-xs font-semibold tracking-wider uppercase">
                        {t('problem.kicker')}
                    </span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-[var(--ascendia-text)] mb-6">
                        <span className="font-serif">{t('problem.titlePart1')}</span>{' '}
                        <span className="font-serif text-[var(--ascendia-primary)]">{t('problem.titlePart2')}</span>
                    </h2>
                    <p className="text-lg text-[var(--ascendia-text-muted)] max-w-2xl mx-auto leading-relaxed">
                        {t('problem.descriptionPart1')} {t('problem.descriptionPart2')}
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    {[
                        { icon: Users, text: t('problem.card1'), bg: 'bg-red-50', iconColor: 'text-[var(--ascendia-danger)]' },
                        { icon: Lightbulb, text: t('problem.card2'), bg: 'bg-amber-50', iconColor: 'text-[var(--ascendia-warning)]' },
                        { icon: CheckCircle, text: t('problem.card3'), bg: 'bg-[var(--ascendia-accent)]', iconColor: 'text-[var(--ascendia-primary)]' },
                    ].map((card, index) => {
                        const Icon = card.icon
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-[var(--ascendia-surface)] p-6 md:p-8 rounded-[var(--ascendia-radius-lg)] border border-[var(--ascendia-border-soft)]"
                            >
                                <div className={`w-12 h-12 ${card.bg} rounded-[var(--ascendia-radius-sm)] flex items-center justify-center mb-4`}>
                                    <Icon className={`w-6 h-6 ${card.iconColor}`} />
                                </div>
                                <h3 className="text-base font-semibold text-[var(--ascendia-text)]">{card.text}</h3>
                            </motion.div>
                        )
                    })}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="mt-12 text-center"
                >
                    <p className="text-xl font-semibold text-[var(--ascendia-text)]">
                        {t('problem.solutionPart1')} <span className="text-[var(--ascendia-primary)]">{t('problem.solutionPart2')}</span>
                    </p>
                </motion.div>
            </div>
        </section>
    )
}