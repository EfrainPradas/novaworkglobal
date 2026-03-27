import { useTranslation } from 'react-i18next'

export default function PhilosophySection() {
    const { t } = useTranslation()
    return (
        <section className="py-32 bg-gray-50 relative overflow-hidden">
            {/* Background typographic element */}
            <div className="absolute -left-20 top-1/2 -translate-y-1/2 text-[10rem] md:text-[20rem] font-bold text-gray-200 opacity-[0.2] select-none pointer-events-none">
                {t('philosophy.bgText')}
            </div>

            <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                <h2 className="text-sm font-bold tracking-[0.2em] text-primary-600 uppercase mb-8">
                    {t('philosophy.badge')}
                </h2>

                <p className="text-3xl md:text-5xl font-serif font-medium text-gray-900 leading-tight mb-12">
                    "{t('philosophy.quotePart1')} <span className="italic text-primary-700">{t('philosophy.quotePart2')}</span> {t('philosophy.quotePart3')}"
                </p>

                <div className="grid md:grid-cols-2 gap-12 text-left mt-20">
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-4">
                            {t('philosophy.precisionTitle')}
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                            {t('philosophy.precisionText')}
                        </p>
                    </div>
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-4">
                            {t('philosophy.empathyTitle')}
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                            {t('philosophy.empathyText')}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}
