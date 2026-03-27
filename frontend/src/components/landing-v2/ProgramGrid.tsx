import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight, Play, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import heroLoop2 from '../../assets/hero-loop-2.webp'

const programs = [
    {
        id: 'novanext',
        title: 'NovaNext™',
        subtitle: 'Career Acceleration',
        description: 'Choose this path if you already know which role you want to pursue next.',
        image: '/images/novanext_v2.jpg',
        color: 'bg-primary-600',
        path: '/programs/novanext'
    },
    {
        id: 'novarearchitect',
        title: 'NovaRearchitect™',
        subtitle: 'Complete Reinvention',
        description: 'Choose this path if your current role or industry is no longer viable.',
        image: '/images/novarearchitect_v2.jpg',
        color: 'bg-secondary-600',
        path: '/programs/novarearchitect'
    },
    {
        id: 'novalign',
        title: 'NovaAlign™',
        subtitle: 'Leadership Integration',
        description: 'Choose this path if you need clarity before committing to a career direction.',
        image: '/images/novaalign_v2.jpg',
        color: 'bg-accent-600',
        path: '/programs/novalign'
    }
]

export default function ProgramGrid() {
    const navigate = useNavigate()
    const { t } = useTranslation()
    const [showVideoModal, setShowVideoModal] = useState(false)

    return (
        <section id="programs" className="py-32 bg-white">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-end mb-20">
                    <div className="max-w-xl">
                        <div className="flex flex-wrap items-center gap-4 mb-6">
                            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                                {t('programs.title')}
                            </h2>
                            
                            {/* Play Video Button - Compact and Premium */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowVideoModal(true)}
                                className="group flex items-center gap-2 px-3 py-1.5 bg-white text-primary-600 rounded-full shadow-md hover:shadow-lg transition-all border border-primary-100 font-semibold"
                            >
                                <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center text-white group-hover:bg-primary-700 transition-colors shadow-sm">
                                    <Play className="w-3 h-3 fill-current ml-0.5" />
                                </div>
                                <span className="text-sm">{t('programs.watchVideo')}</span>
                            </motion.button>
                        </div>
                        
                        <p className="text-xl text-gray-500">
                            {t('programs.description')}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/programs/novanext')}
                        className="hidden md:flex items-center gap-2 text-primary-600 font-semibold hover:text-primary-800 transition-colors mt-6 md:mt-0"
                    >
                        {t('programs.compare')} <ArrowUpRight className="w-5 h-5" />
                    </button>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {programs.map((program, index) => (
                        <motion.div
                            key={program.id}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="group cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all duration-300 rounded-2xl"
                            onClick={() => navigate(program.path)}
                        >
                            <div className="relative aspect-[4/5] overflow-hidden bg-gray-200 mb-6 rounded-2xl">
                                <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${program.color} mix-blend-multiply z-10`} />
                                <img
                                    src={program.image}
                                    alt={program.title}
                                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                                />

                                {/* Overlay text on image for mobile or stylistic choice */}
                                <div className="absolute inset-0 flex items-end p-8 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                    <p className="text-white font-medium flex items-center gap-2">
                                        {t('programs.viewProgram')} <ArrowUpRight className="w-4 h-4" />
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-sm font-bold tracking-widest text-gray-400 uppercase">{t(`programs.cards.${program.id}.subtitle`)}</p>
                                <h3 className="text-3xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                                    {t(`programs.cards.${program.id}.title`)}
                                </h3>
                                <p className="text-gray-500 leading-relaxed border-t border-gray-200 pt-4 mt-4 opacity-80 group-hover:opacity-100 transition-opacity">
                                    {t(`programs.cards.${program.id}.description`)}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Video Modal Overlay */}
            <AnimatePresence>
                {showVideoModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 md:p-8 backdrop-blur-sm"
                        onClick={() => setShowVideoModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setShowVideoModal(false)}
                                className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <video
                                src="/videos/Landing_Page_novawork.mp4"
                                autoPlay
                                controls
                                poster={heroLoop2}
                                className="w-full h-full object-contain"
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    )
}
