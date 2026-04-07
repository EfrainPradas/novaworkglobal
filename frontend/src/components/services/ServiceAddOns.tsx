import { useState } from 'react'
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
    cta?: string
}

const ADD_ONS: AddOnService[] = [
    {
        id: '1-1-session',
        title: '1:1 Session',
        price: 149,
        unit: '/ session',
        description: 'Deep clarity & strategy in a premium, one-time 45-min live session with a career coach.',
        features: [
            '45-minute live session',
            'Deep clarity & strategy',
            'Premium, one-time format',
            'Action plan summary'
        ],
        cta: 'Book Session'
    },
    {
        id: 'email-coaching',
        title: 'Email Coaching',
        price: 39,
        unit: '/ month',
        description: 'Ongoing guidance with lightweight support. Get 3 emails per month from your coach.',
        features: [
            '3 emails / month',
            'Ongoing guidance',
            'Lightweight support',
            'Flexible schedule'
        ],
        cta: 'Get Email Support'
    },
    {
        id: 'coach-email',
        title: 'Coach + Email',
        price: 179,
        unit: '/ month',
        description: 'Strategy + continuity with a discounted bundle. 1 session + 3 emails per month.',
        features: [
            '1 session + 3 emails / month',
            'Strategy + continuity',
            'Discounted bundle',
            'Priority access'
        ],
        recommended: true,
        cta: 'Get Support'
    }
]

export default function ServiceAddOns() {
    const { t } = useTranslation()
    const [selectedService, setSelectedService] = useState<AddOnService | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const handleBookClick = (service: AddOnService) => {
        setSelectedService(service)
        setIsModalOpen(true)
    }

    return (
        <section className="py-12 bg-gradient-to-br from-indigo-50 to-white dark:from-gray-800 dark:to-gray-800 rounded-2xl border border-indigo-100 dark:border-gray-700 p-8 shadow-sm my-16">
            <div className="text-center max-w-3xl mx-auto mb-12">
                <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                    {t('resumeBuilder.menu.accelerateResults', 'ACCELERATE YOUR RESULTS')}
                </span>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-4 mb-4">
                    {t('resumeBuilder.menu.needGuidance', 'Need Personalized Guidance?')}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                    While our AI tools are powerful, sometimes you need a human expert.
                    Book a 1:1 session with our world-class coaches to breakthrough faster.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {ADD_ONS.map((service) => (
                    <div
                        key={service.id}
                        className={`
                            relative bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg border transition-all hover:shadow-xl hover:-translate-y-1
                            ${service.recommended ? 'border-primary-500 ring-1 ring-primary-500' : 'border-gray-200 dark:border-gray-700'}
                        `}
                    >
                        {service.recommended && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                                <Star className="w-3 h-3 fill-current" />
                                MOST POPULAR
                            </div>
                        )}

                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{service.title}</h3>
                            <div className="mt-2 flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-gray-900 dark:text-white">${service.price}</span>
                                <span className="text-gray-500 dark:text-gray-400 text-sm">{service.unit}</span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mt-3 min-h-[60px]">
                                {service.description}
                            </p>
                        </div>

                        <ul className="space-y-3 mb-8">
                            {service.features.map((feature, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => handleBookClick(service)}
                            className={`
                                w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors
                                ${service.recommended
                                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                                }
                            `}
                        >
                            {service.cta || 'Book Now'} <ArrowRight className="w-4 h-4" />
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
