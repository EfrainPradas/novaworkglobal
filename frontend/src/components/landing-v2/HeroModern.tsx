import { ArrowRight, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import heroLoop2 from '../../assets/hero-loop-2.webp'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function HeroModern() {
    const navigate = useNavigate()
    const { t } = useTranslation()

    return (
        <section className="relative min-h-[90vh] flex items-center bg-white overflow-hidden pt-36 pb-20">
            {/* Abstract Background Shapes - Keeping NovaWork Colors */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-primary-50/50 transform skew-x-12 translate-x-32" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-50 rounded-full blur-3xl opacity-30" />

            <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
                <div className="grid lg:grid-cols-2 gap-12 items-center">

                    {/* Text Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >


                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 leading-[1.1] mb-8">
                            {t('hero.title').split(' ').slice(0, 2).join(' ')} <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary">
                                {t('hero.title').split(' ').slice(2).join(' ')}
                            </span>
                        </h1>

                        <p className="text-2xl font-medium text-gray-900 mb-6">
                            {t('hero.subtitle')}
                        </p>

                        <p className="text-lg md:text-xl text-gray-500 max-w-lg leading-relaxed mb-10 border-l-4 border-primary-200 pl-6">
                            {t('hero.description')}
                        </p>

                        <div className="flex flex-row gap-4">
                            <button
                                onClick={() => navigate('/programs/novanext')}
                                className="group px-5 py-3 bg-primary-600 text-white rounded-full border border-primary-600 font-semibold text-base flex items-center gap-2 hover:bg-primary-700 transition-all shadow-lg hover:shadow-primary-500/25 whitespace-nowrap"
                            >
                                {t('hero.ctaStart')}
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>

                            <button
                                onClick={() => document.getElementById('programs')?.scrollIntoView({ behavior: 'smooth' })}
                                className="px-5 py-3 bg-primary-50 text-primary-700 rounded-full font-semibold text-base hover:bg-primary-100 transition-all flex items-center gap-2 whitespace-nowrap"
                            >
                                {t('hero.ctaExplore')}
                            </button>
                        </div>
                    </motion.div>

                    {/* Visual / Image */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="relative hidden lg:block"
                    >
                        <div className="relative z-10 w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border-4 border-white translate-x-0">
                            <img
                                src={heroLoop2}
                                alt="Executive Strategy Animation"
                                className="w-full h-full object-contain bg-white"
                            />
                        </div>

                        {/* Decorative Grid */}
                        <div className="absolute -z-10 top-10 -right-10 w-full h-full border-2 border-gray-200" />
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
