import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

interface ProgramCardProps {
    name: string
    tagline: string
    description: string
    cta: string
    href: string
    variant?: 'default' | 'featured'
}

export default function ProgramCard({
    name,
    tagline,
    description,
    cta,
    href,
    variant = 'default'
}: ProgramCardProps) {
    const navigate = useNavigate()
    const isFeatured = variant === 'featured'

    return (
        <div className={`group relative bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border-2 ${isFeatured ? 'border-primary-500' : 'border-gray-100 hover:border-primary-200'
            } h-full flex flex-col`}>
            {isFeatured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                    Most Popular
                </div>
            )}

            <div className="flex-1">
                <h3 className="text-3xl font-bold text-gray-900 mb-2">{name}</h3>
                <p className="text-lg font-semibold text-primary-600 mb-4">{tagline}</p>
                <p className="text-gray-600 leading-relaxed mb-6">{description}</p>
            </div>

            <button
                onClick={() => navigate(href)}
                className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-full font-bold transition-all group-hover:translate-x-1 ${isFeatured
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
            >
                {cta}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
    )
}
