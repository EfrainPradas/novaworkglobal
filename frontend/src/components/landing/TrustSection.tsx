import { motion } from 'framer-motion'
import { Globe, Users, TrendingUp, CheckCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function TrustSection() {
    const { t } = useTranslation()

    const stats = [
        { icon: Users, value: '10,000+', label: t('trust.stats.guided') },
        { icon: TrendingUp, value: '80+', label: t('trust.stats.expertise') },
        { icon: Globe, value: '5 Continents', label: t('trust.stats.global') },
        { icon: CheckCircle, value: '4.9/5', label: t('trust.stats.rating') }
    ]

    return (
        <section id="insights" className="py-20 px-4 bg-gray-50">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                        {t('trust.title')}
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        {t('trust.subtitle')}
                    </p>
                </motion.div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
                    {stats.map((stat, index) => {
                        const Icon = stat.icon
                        return (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="text-center"
                            >
                                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Icon className="w-8 h-8 text-primary-600" />
                                </div>
                                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                                <div className="text-sm text-gray-600">{stat.label}</div>
                            </motion.div>
                        )
                    })}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl p-8 md:p-12"
                >
                    <blockquote className="text-center">
                        <p className="text-xl md:text-2xl text-gray-700 italic mb-6">
                            "{t('trust.testimonial')}"
                        </p>
                    </blockquote>
                </motion.div>
            </div>
        </section>
    )
}
