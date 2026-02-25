import { motion } from 'framer-motion'
import { Brain, Heart, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function DifferentiatorSection() {
    const { t } = useTranslation()
    return (
        <section id="methodology" className="py-20 px-4 bg-gray-50">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                        {t('differentiator.title')}
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                        {t('differentiator.description')}
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-12 mt-16">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-center"
                    >
                        <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                            <Heart className="w-10 h-10 text-white" strokeWidth={2} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('differentiator.humanCardTitle')}</h3>
                        <p className="text-gray-600 leading-relaxed">
                            {t('differentiator.humanCardText')}
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-center"
                    >
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                            <Brain className="w-10 h-10 text-white" strokeWidth={2} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('differentiator.aiCardTitle')}</h3>
                        <p className="text-gray-600 leading-relaxed">
                            {t('differentiator.aiCardText')}
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="text-center"
                    >
                        <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                            <Zap className="w-10 h-10 text-white" strokeWidth={2} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('differentiator.pathCardTitle')}</h3>
                        <p className="text-gray-600 leading-relaxed">
                            {t('differentiator.pathCardText')}
                        </p>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="mt-16 text-center"
                >
                    <p className="text-lg text-gray-700 max-w-2xl mx-auto">
                        <span className="font-bold text-primary-600">{t('differentiator.resultLabel')}</span> {t('differentiator.resultText')}
                    </p>
                </motion.div>
            </div>
        </section>
    )
}
