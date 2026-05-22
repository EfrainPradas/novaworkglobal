import { useTranslation } from 'react-i18next'

export default function PhilosophySection() {
    const { t } = useTranslation()
    return (
        <section className="py-20 md:py-32 bg-[var(--ascendia-bg)] relative overflow-hidden">
            {/* Background typographic element */}
            <div className="absolute -left-20 top-1/2 -translate-y-1/2 text-[5rem] sm:text-[8rem] md:text-[20rem] font-bold text-[var(--ascendia-border-soft)] opacity-[0.2] select-none pointer-events-none">
                {t('philosophy.bgText')}
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
                <h2 className="text-sm font-bold tracking-[0.2em] text-[var(--ascendia-primary)] uppercase mb-8">
                    {t('philosophy.badge')}
                </h2>

                <p className="text-3xl md:text-5xl font-serif font-medium text-[var(--ascendia-text)] leading-tight mb-12">
                    "{t('philosophy.quotePart1')} <span className="italic text-[var(--ascendia-primary)]">{t('philosophy.quotePart2')}</span> {t('philosophy.quotePart3')}"
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 text-left mt-12 md:mt-20">
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-[var(--ascendia-text)] border-b border-[var(--ascendia-border-soft)] pb-4">
                            {t('philosophy.precisionTitle')}
                        </h3>
                        <p className="text-[var(--ascendia-text-muted)] leading-relaxed">
                            {t('philosophy.precisionText')}
                        </p>
                    </div>
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-[var(--ascendia-text)] border-b border-[var(--ascendia-border-soft)] pb-4">
                            {t('philosophy.empathyTitle')}
                        </h3>
                        <p className="text-[var(--ascendia-text-muted)] leading-relaxed">
                            {t('philosophy.empathyText')}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}
