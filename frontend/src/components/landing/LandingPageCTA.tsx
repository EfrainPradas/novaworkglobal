import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

interface LandingPageCTAProps {
    onAction?: () => void;
}

export default function LandingPageCTA({ onAction }: LandingPageCTAProps) {
    const navigate = useNavigate()
    const { t } = useTranslation()

    const handleClick = () => {
        if (onAction) {
            onAction()
        } else {
            // Default behavior if no action provided: Scroll to programs or navigate
            const programsSection = document.getElementById('programs') || document.getElementById('programs-grid')
            if (programsSection) {
                programsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
            } else {
                navigate('/signup')
            }
        }
    }

    return (
        <section className="py-20 bg-primary-600">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-4xl font-heading font-bold text-white mb-4">
                    {t('cta.title')}
                </h2>
                <p className="text-xl text-primary-100 mb-8">
                    {t('cta.subtitle')}
                </p>
                <button
                    onClick={handleClick}
                    className="bg-white text-primary-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
                >
                    {t('cta.button')}
                </button>
            </div>
        </section>
    )
}
