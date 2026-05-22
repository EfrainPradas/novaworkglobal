import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import heroLoop2 from '../../assets/hero-loop-2.webp'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function HeroModern() {
    const navigate = useNavigate()
    const { t } = useTranslation()

    return (
        <section className="relative min-h-[100dvh] flex items-center bg-white overflow-hidden pt-20 pb-16 md:pt-28 md:pb-24">
            {/* Subtle background accent */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-[var(--ascendia-accent)]/40 transform skew-x-12 translate-x-32 opacity-50" />
            <div className="absolute bottom-0 left-0 w-64 h-64 md:w-96 md:h-96 bg-[var(--ascendia-secondary)]/10 rounded-full blur-3xl" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
                <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

                    {/* Text Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[var(--ascendia-text)] leading-[1.1] mb-6">
                            {t('hero.title').split(' ').slice(0, 2).join(' ')} <br className="hidden sm:block" />
                            <span className="text-[var(--ascendia-primary)]">
                                {t('hero.title').split(' ').slice(2).join(' ')}
                            </span>
                        </h1>

                        <p className="text-xl md:text-2xl font-medium text-[var(--ascendia-text)] mb-4">
                            {t('hero.subtitle')}
                        </p>

                        <p className="text-base md:text-lg text-[var(--ascendia-text-muted)] max-w-lg leading-relaxed mb-8 border-l-[3px] border-[var(--ascendia-primary)]/30 pl-5">
                            {t('hero.description')}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                            <button
                                onClick={() => navigate('/programs/novanext')}
                                className="w-full sm:w-auto group px-6 py-3 bg-[var(--ascendia-primary)] text-[var(--ascendia-primary-foreground)] rounded-full font-semibold text-base flex items-center justify-center gap-2 hover:bg-[var(--ascendia-primary-hover)] transition-all shadow-sm"
                            >
                                {t('hero.ctaStart')}
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>

                            <button
                                onClick={() => document.getElementById('programs')?.scrollIntoView({ behavior: 'smooth' })}
                                className="w-full sm:w-auto px-6 py-3 bg-[var(--ascendia-accent)] text-[var(--ascendia-primary)] rounded-full font-semibold text-base hover:bg-[var(--ascendia-accent-hover)] transition-all flex items-center justify-center gap-2"
                            >
                                {t('hero.ctaExplore')}
                            </button>
                        </div>
                    </motion.div>

                    {/* Visual / Image */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.15 }}
                        className="relative hidden lg:block"
                    >
                        <div className="relative z-10 w-full aspect-video rounded-2xl overflow-hidden shadow-md border border-[var(--ascendia-border)]">
                            <img
                                src={heroLoop2}
                                alt="Ascendia Career Platform"
                                className="w-full h-full object-contain bg-white"
                            />
                        </div>

                        {/* Decorative Grid */}
                        <div className="absolute -z-10 top-6 -right-4 w-full h-full border border-[var(--ascendia-border-soft)] rounded-2xl" />
                    </motion.div>
                </div>
            </div>
        </section>
    )
}