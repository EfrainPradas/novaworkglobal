import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const programs = [
    {
        id: 'novanext',
        title: 'NovaNext™',
        subtitle: 'Career Acceleration',
        description: 'Choose this path if you already know which role you want to pursue next.',
        image: '/novaworkglobal/images/novanext_v2.jpg',
        color: 'bg-primary-600',
        path: '/programs/novanext'
    },
    {
        id: 'novarearchitect',
        title: 'NovaRearchitect™',
        subtitle: 'Complete Reinvention',
        description: 'Choose this path if your current role or industry is no longer viable.',
        image: '/novaworkglobal/images/novarearchitect_v2.jpg',
        color: 'bg-secondary-600',
        path: '/programs/novarearchitect'
    },
    {
        id: 'novalign',
        title: 'NovaAlign™',
        subtitle: 'Leadership Integration',
        description: 'Choose this path if you need clarity before committing to a career direction.',
        image: '/novaworkglobal/images/novaalign_v2.jpg',
        color: 'bg-accent-600',
        path: '/programs/novalign'
    }
]

export default function ProgramGrid() {
    const navigate = useNavigate()
    const { t } = useTranslation()

    return (
        <section id="programs" className="py-32 bg-white">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-end mb-20">
                    <div>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">{t('programs.title')}</h2>
                        <p className="text-xl text-gray-500 max-w-xl">
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
        </section>
    )
}
