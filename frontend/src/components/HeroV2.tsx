import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, ArrowRight, User } from 'lucide-react'

interface HeroV2Props {
    onStartTrial: () => void
}

export default function HeroV2({ onStartTrial }: HeroV2Props) {
    const { t } = useTranslation()
    const navigate = useNavigate()

    return (
        <section className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden">

            {/* Background Video/Image Layer - ABSOLUTE POS (Contained in Section) */}
            <div className="absolute inset-0 z-0">
                <img
                    src={`${import.meta.env.BASE_URL}hero-loop.webp`}
                    alt="Background Animation"
                    className="w-full h-full object-cover"
                />
                {/* Gradients moving with the background */}
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white/90 to-transparent"></div>
            </div>

            {/* Main Content Layer - Rolls over the fixed background */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-grow flex items-center justify-center py-20">

                {/* Soft "Cloud" behind text */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[60%] bg-white/40 blur-[80px] -z-10 rounded-full pointer-events-none"></div>

                <div className="flex flex-col items-center space-y-6 animate-fade-in-up text-center mt-20">

                    {/* Title (H1) */}
                    <h1 className="text-4xl sm:text-5xl lg:text-7xl font-heading font-extrabold text-brand-ink leading-[1.1] tracking-tight drop-shadow-[0_2px_10px_rgba(255,255,255,0.8)] max-w-5xl mx-auto">
                        Your Next Career Chapter Starts Here
                    </h1>

                    {/* Subtitle (H2) - Single Line on Desktop */}
                    <h2 className="text-xl sm:text-2xl md:text-3xl text-brand-teal-800 font-extrabold w-auto max-w-none mx-auto tracking-wide uppercase drop-shadow-sm bg-white/30 backdrop-blur-sm py-3 px-8 rounded-full inline-block whitespace-normal md:whitespace-nowrap">
                        Clarity. Direction. Momentum.
                    </h2>

                    {/* Description (P) */}
                    <p className="text-lg sm:text-xl text-brand-ink/90 leading-relaxed max-w-4xl mx-auto font-medium mt-4 drop-shadow-md">
                        NovaWork Global helps professionals navigate career change with a proven system that blends 30+ years of human career coaching experience with intelligent AI tools, so you move forward with confidence, not confusion.
                    </p>

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-8 justify-center w-full">
                        <button
                            onClick={onStartTrial}
                            className="bg-brand-teal-600 text-white px-10 py-4 rounded-xl text-lg font-bold hover:bg-brand-teal-700 transition-all shadow-xl hover:shadow-brand-teal-600/30 flex items-center justify-center gap-2 group relative overflow-hidden min-w-[220px]"
                        >
                            <div className="absolute inset-0 bg-white/20 blur-xl group-hover:translate-x-full transition-transform duration-700"></div>
                            <span className="relative">{t('landing.hero.startTrial')}</span>
                            <ArrowRight className="w-5 h-5 relative group-hover:translate-x-1 transition-transform" />
                        </button>

                        <button
                            onClick={() => navigate('/signin')}
                            className="bg-white/80 backdrop-blur-sm text-brand-teal-800 border-2 border-brand-teal-100 px-10 py-4 rounded-xl text-lg font-bold hover:bg-white transition-colors flex items-center justify-center gap-2 group shadow-lg min-w-[220px]"
                        >
                            <User className="w-5 h-5 group-hover:text-brand-teal-900 transition-colors" />
                            {t('landing.hero.signIn')}
                        </button>
                    </div>

                    {/* Trust Line */}
                    <div className="flex items-center gap-2 text-sm text-gray-700 font-bold mt-4 bg-white/40 px-4 py-1 rounded-full backdrop-blur-sm shadow-sm">
                        <Check className="w-4 h-4 text-brand-teal-700" />
                        <p>{t('landing.hero.trust')}</p>
                    </div>
                </div>
            </div>

            {/* Bottom Features Teaser - Floating directly on video/gradient */}
            <div className="relative z-10 w-full py-8 mt-12 bg-white/30 backdrop-blur-md border-t border-white/20">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h3 className="text-brand-ink font-bold text-lg uppercase tracking-wider mb-2 drop-shadow-sm">
                        {t('landing.hero.featuresTitle')}
                    </h3>
                    <p className="text-brand-teal-900 font-bold max-w-2xl mx-auto">
                        {t('landing.hero.featuresDesc')}
                    </p>
                </div>
            </div>

        </section>
    )
}
