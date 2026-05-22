import { motion } from 'framer-motion'
import { Brain, Heart, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function DifferentiatorSection() {
    const { t } = useTranslation()
    return (
        <section id="methodology" className="py-20 px-4 bg-[var(--ascendia-surface)]">
            <div className="max-w-7xl mx-auto">
                {/* Kicker */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-4"
                >
                    <span className="inline-block px-3 py-1 rounded-full bg-[var(--ascendia-accent)] text-[var(--ascendia-primary)] text-xs font-semibold tracking-wider uppercase">
                        {t('differentiator.kicker')}
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
                        <span className="font-serif">{t('differentiator.title')}</span>
                    </h2>
                    <p className="text-lg text-[var(--ascendia-text-muted)] max-w-2xl mx-auto leading-relaxed">
                        {t('differentiator.description')}
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                    {[
                        { icon: Heart, title: t('differentiator.humanCardTitle'), text: t('differentiator.humanCardText'), bg: 'bg-[var(--ascendia-primary)]' },
                        { icon: Brain, title: t('differentiator.aiCardTitle'), text: t('differentiator.aiCardText'), bg: 'bg-[var(--ascendia-secondary)]' },
                        { icon: Zap, title: t('differentiator.pathCardTitle'), text: t('differentiator.pathCardText'), bg: 'bg-[var(--ascendia-accent)]' },
                    ].map((card, index) => {
                        const Icon = card.icon
                        const isAccent = card.bg === 'bg-[var(--ascendia-accent)]'
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="text-center"
                            >
                                <div className={`w-16 h-16 md:w-20 md:h-20 ${card.bg} rounded-[var(--ascendia-radius-md)] flex items-center justify-center mx-auto mb-6 shadow-[var(--ascendia-shadow-sm)]`}>
                                    <Icon className={`w-8 h-8 md:w-10 md:h-10 ${isAccent ? 'text-[var(--ascendia-primary)]' : 'text-[var(--ascendia-primary-foreground)]'}`} strokeWidth={2} />
                                </div>
                                <h3 className="text-xl font-bold text-[var(--ascendia-text)] mb-4">{card.title}</h3>
                                <p className="text-[var(--ascendia-text-muted)] leading-relaxed">{card.text}</p>
                            </motion.div>
                        )
                    })}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="mt-16 text-center"
                >
                    <p className="text-base text-[var(--ascendia-text-muted)] max-w-2xl mx-auto">
                        <span className="font-bold text-[var(--ascendia-primary)]">{t('differentiator.resultLabel')}</span> {t('differentiator.resultText')}
                    </p>
                </motion.div>
            </div>
        </section>
    )
}