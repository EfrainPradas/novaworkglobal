import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Clock } from 'lucide-react'

interface ComingSoonProps {
    programName: string
    tagline: string
}

export default function ComingSoon({ programName, tagline }: ComingSoonProps) {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Home
                    </button>
                </nav>
            </header>

            {/* Coming Soon Section */}
            <section className="py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Icon */}
                    <div className="mb-8">
                        <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                            <Clock className="w-12 h-12 text-primary-600" />
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                        {programName}
                    </h1>

                    {/* Tagline */}
                    <p className="text-2xl font-semibold text-primary-600 mb-8">
                        {tagline}
                    </p>

                    {/* Coming Soon Badge */}
                    <div className="inline-block mb-8 px-6 py-3 bg-gradient-to-r from-primary-600 to-teal-600 text-white rounded-full text-lg font-bold shadow-lg">
                        Coming Soon
                    </div>

                    {/* Description */}
                    <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-8">
                        <p className="text-lg text-gray-700 leading-relaxed mb-6">
                            We're working hard to bring you this comprehensive program. Stay tuned for more details!
                        </p>
                        <p className="text-gray-600">
                            In the meantime, explore <span className="font-semibold text-primary-600">NovaNext™</span> to start your career journey.
                        </p>
                    </div>

                    {/* CTA Button */}
                    <button
                        onClick={() => navigate('/programs/novanext')}
                        className="bg-primary-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-primary-700 transition-all shadow-xl hover:shadow-2xl"
                    >
                        Explore NovaNext →
                    </button>
                </div>
            </section>
        </div>
    )
}
