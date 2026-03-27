import { useState } from 'react'
import { Check, Star, ArrowRight } from 'lucide-react'
import BookingModal from '../booking/BookingModal'

interface AddOnService {
    id: string
    title: string
    price: number
    description: string
    features: string[]
    recommended?: boolean
}

const ADD_ONS: AddOnService[] = [
    {
        id: 'standard-session',
        title: 'Standard Strategy Session',
        price: 199,
        description: '45-min 1:1 session with a career coach to discuss your strategy, roadblocks, or specific questions.',
        features: [
            '45-minute video call',
            'Session recording provided',
            'Action plan summary',
            'Follow-up email support (1 week)'
        ]
    },
    {
        id: 'executive-advisory',
        title: 'Executive Advisory',
        price: 299,
        description: 'Deep-dive session with a Senior Executive Coach for leadership positioning and complex career moves.',
        features: [
            '60-minute video call',
            'Executive presence audit',
            'Strategic networking plan',
            'Negotiation strategy',
            'Priority email access'
        ],
        recommended: true
    },
    {
        id: 'offer-review',
        title: 'Offer Review & Negotiation',
        price: 349,
        description: 'Expert review of your job offer and a custom negotiation strategy to maximize your compensation.',
        features: [
            'Comprehensive offer analysis',
            'Custom counter-offer scripts',
            'Equity/Stock option review',
            'Mock negotiation practice'
        ]
    }
]

export default function ServiceAddOns() {
    const [selectedService, setSelectedService] = useState<AddOnService | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const handleBookClick = (service: AddOnService) => {
        setSelectedService(service)
        setIsModalOpen(true)
    }

    return (
        <section className="py-12 bg-gradient-to-br from-indigo-50 to-white rounded-2xl border border-indigo-100 p-8 shadow-sm my-16">
            <div className="text-center max-w-3xl mx-auto mb-12">
                <span className="bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                    Accelerate Your Results
                </span>
                <h2 className="text-3xl font-bold text-gray-900 mt-4 mb-4">
                    Need Personalized Guidance?
                </h2>
                <p className="text-lg text-gray-600">
                    While our AI tools are powerful, sometimes you need a human expert.
                    Book a 1:1 session with our world-class coaches to breakthrough faster.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {ADD_ONS.map((service) => (
                    <div
                        key={service.id}
                        className={`
                            relative bg-white rounded-xl p-6 shadow-lg border transition-all hover:shadow-xl hover:-translate-y-1
                            ${service.recommended ? 'border-primary-500 ring-1 ring-primary-500' : 'border-gray-200'}
                        `}
                    >
                        {service.recommended && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                                <Star className="w-3 h-3 fill-current" />
                                MOST POPULAR
                            </div>
                        )}

                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-gray-900">{service.title}</h3>
                            <div className="mt-2 flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-gray-900">${service.price}</span>
                                <span className="text-gray-500 text-sm">/session</span>
                            </div>
                            <p className="text-gray-600 text-sm mt-3 min-h-[60px]">
                                {service.description}
                            </p>
                        </div>

                        <ul className="space-y-3 mb-8">
                            {service.features.map((feature, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
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
                                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                }
                            `}
                        >
                            Book Now <ArrowRight className="w-4 h-4" />
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
