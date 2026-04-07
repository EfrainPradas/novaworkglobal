import { useState, useMemo } from 'react'
import { Check, Star, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import BookingModal from '../booking/BookingModal'

interface AddOnService {
    id: string
    title: string
    price: number
    unit: string
    description: string
    features: string[]
    recommended?: boolean
    cta: string
}

export default function ServiceAddOns() {
    const { t } = useTranslation()
    const [selectedService, setSelectedService] = useState<AddOnService | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const addOns: AddOnService[] = useMemo(() => [
        {
            id: 'email-coaching',
            title: t('serviceAddOns.emailCoaching.title', 'Email Coaching'),
            price: 39,
            unit: t('serviceAddOns.emailCoaching.unit', '/ month'),
            description: t('serviceAddOns.emailCoaching.description', 'Ongoing guidance with lightweight support. Get 3 emails per month from your coach.'),
            features: [
                t('serviceAddOns.emailCoaching.feature1', '3 emails / month'),
                t('serviceAddOns.emailCoaching.feature2', 'Ongoing guidance'),
                t('serviceAddOns.emailCoaching.feature3', 'Lightweight support'),
                t('serviceAddOns.emailCoaching.feature4', 'Flexible schedule')
            ],
            cta: t('serviceAddOns.emailCoaching.cta', 'Get Email Support')
        },
        {
            id: '1-1-session',
            title: t('serviceAddOns.oneOnOne.title', '1:1 Session'),
            price: 149,
            unit: t('serviceAddOns.oneOnOne.unit', '/ session'),
            description: t('serviceAddOns.oneOnOne.description', 'Deep clarity & strategy in a premium, one-time 45-min live session with a career coach.'),
            features: [
                t('serviceAddOns.oneOnOne.feature1', '45-minute live session'),
                t('serviceAddOns.oneOnOne.feature2', 'Deep clarity & strategy'),
                t('serviceAddOns.oneOnOne.feature3', 'Premium, one-time format'),
                t('serviceAddOns.oneOnOne.feature4', 'Action plan summary')
            ],
            cta: t('serviceAddOns.oneOnOne.cta', 'Book Session')
        },
        {
            id: 'coach-email',
            title: t('serviceAddOns.coachEmail.title', 'Coach + Email'),
            price: 179,
            unit: t('serviceAddOns.coachEmail.unit', '/ month'),
            description: t('serviceAddOns.coachEmail.description', 'Strategy + continuity with a discounted bundle. 1 session + 3 emails per month.'),
            features: [
                t('serviceAddOns.coachEmail.feature1', '1 session + 3 emails / month'),
                t('serviceAddOns.coachEmail.feature2', 'Strategy + continuity'),
                t('serviceAddOns.coachEmail.feature3', 'Discounted bundle'),
                t('serviceAddOns.coachEmail.feature4', 'Priority access')
            ],
            recommended: true,
            cta: t('serviceAddOns.coachEmail.cta', 'Get Support')
        }
    ], [t])

    const handleBookClick = (service: AddOnService) => {
        setSelectedService(service)
        setIsModalOpen(true)
    }

    return (
        <section className="py-8 bg-gradient-to-br from-primary-50 to-white dark:from-gray-800 dark:to-gray-800 rounded-2xl border border-primary-100 dark:border-gray-700 px-6 pb-6 shadow-sm mt-10">
            <div className="text-center max-w-2xl mx-auto mb-8">
                <span className="bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                    {t('serviceAddOns.accelerateResults', 'ACCELERATE YOUR RESULTS')}
                </span>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-3 mb-2">
                    {t('serviceAddOns.needGuidance', 'Need Personalized Guidance?')}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('serviceAddOns.subtitle', 'While our AI tools are powerful, sometimes you need a human expert. Book a 1:1 session with our world-class coaches to breakthrough faster.')}
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
                {addOns.map((service) => (
                    <div
                        key={service.id}
                        className={`
                            relative bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border transition-all hover:shadow-md hover:-translate-y-0.5
                            ${service.recommended ? 'border-primary-500 ring-1 ring-primary-500' : 'border-gray-200 dark:border-gray-700'}
                        `}
                    >
                        {service.recommended && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                                <Star className="w-3 h-3 fill-current" />
                                {t('serviceAddOns.mostPopular', 'MOST POPULAR')}
                            </div>
                        )}

                        <div className="mb-3">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">{service.title}</h3>
                            <div className="mt-1 flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">${service.price}</span>
                                <span className="text-gray-500 dark:text-gray-400 text-xs">{service.unit}</span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 text-xs mt-2 min-h-[36px] leading-relaxed">
                                {service.description}
                            </p>
                        </div>

                        <ul className="space-y-2 mb-5">
                            {service.features.map((feature, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
                                    <Check className="w-3.5 h-3.5 text-primary-600 flex-shrink-0 mt-0.5" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => handleBookClick(service)}
                            className="w-full py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors bg-primary-600 text-white hover:bg-primary-700"
                        >
                            {service.cta} <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>

            {selectedService && (
                <BookingModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    serviceName={selectedService.title}
                    price={selectedService.price}
                />
            )}
        </section>
    )
}
