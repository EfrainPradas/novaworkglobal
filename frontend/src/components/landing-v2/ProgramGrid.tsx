import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight, Play, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getVideoUrl } from '@/config/videoUrls'
import heroLoop2 from '../../assets/hero-loop-2.webp'

const programs = [
    {
        id: 'novanext',
        image: '/images/novanext_v2.jpg',
        path: '/programs/novanext'
    },
    {
        id: 'novarearchitect',
        image: '/images/novarearchitect_v2.jpg',
        path: '/programs/novarearchitect'
    },
    {
        id: 'novalign',
        image: '/images/novaalign_v2.jpg',
        path: '/programs/novaalign'
    }
]

export default function ProgramGrid() {
    const navigate = useNavigate()
    const { t } = useTranslation()
    const [showVideoModal, setShowVideoModal] = useState(false)

    return (
        <section id="programs" className="py-20 md:py-28 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-12 md:mb-16">
                    <div className="max-w-xl">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--ascendia-text)] leading-tight">
                                {t('programs.title')}
                            </h2>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowVideoModal(true)}
                                className="group flex items-center gap-2 px-3 py-1.5 bg-white text-[var(--ascendia-primary)] rounded-full shadow-sm hover:shadow-md transition-all border border-[var(--ascendia-border)] font-semibold"
                            >
                                <div className="w-6 h-6 bg-[var(--ascendia-primary)] rounded-full flex items-center justify-center text-white group-hover:bg-[var(--ascendia-primary-hover)] transition-colors">
                                    <Play className="w-3 h-3 fill-current ml-0.5" />
                                </div>
                                <span className="text-sm">{t('programs.watchVideo')}</span>
                            </motion.button>
                        </div>

                        <p className="text-base md:text-lg text-[var(--ascendia-text-muted)]">
                            {t('programs.description')}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/programs/novanext')}
                        className="hidden md:flex items-center gap-2 text-[var(--ascendia-primary)] font-semibold hover:text-[var(--ascendia-primary-hover)] transition-colors"
                    >
                        {t('programs.compare')} <ArrowUpRight className="w-4 h-4" />
                    </button>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {programs.map((program, index) => (
                        <motion.div
                            key={program.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="group cursor-pointer hover:-translate-y-1 transition-all duration-300"
                            onClick={() => navigate(program.path)}
                        >
                            <div className="relative aspect-[4/5] overflow-hidden bg-[var(--ascendia-bg)] mb-5 rounded-2xl border border-[var(--ascendia-border-soft)]">
                                <img
                                    src={program.image}
                                    alt={t(`programs.cards.${program.id}.title`)}
                                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                                />

                                {/* Hover overlay */}
                                <div className="absolute inset-0 flex items-end p-6 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <p className="text-white font-medium flex items-center gap-2">
                                        {t('programs.viewProgram')} <ArrowUpRight className="w-4 h-4" />
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2 max-w-full">
                                <p className="text-xs font-bold tracking-widest text-[var(--ascendia-text-muted)] uppercase">{t(`programs.cards.${program.id}.subtitle`)}</p>
                                <h3 className="text-xl md:text-2xl font-bold text-[var(--ascendia-text)] group-hover:text-[var(--ascendia-primary)] transition-colors leading-tight">
                                    {t(`programs.cards.${program.id}.title`)}
                                </h3>
                                <p className="text-sm text-[var(--ascendia-text-muted)] leading-relaxed border-t border-[var(--ascendia-border-soft)] pt-3 mt-3 group-hover:text-[var(--ascendia-text)] transition-colors">
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
                            className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setShowVideoModal(false)}
                                className="absolute top-3 right-3 z-10 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-sm"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <video
                                src={getVideoUrl('Landing_Page_novawork.mp4')}
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