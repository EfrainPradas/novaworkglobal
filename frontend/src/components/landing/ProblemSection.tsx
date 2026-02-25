import { motion } from 'framer-motion'
import { Users, Lightbulb, CheckCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function ProblemSection() {
    const { t } = useTranslation()
    return (
        <section className="py-20 px-4 bg-white">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                        {t('problem.titlePart1')} <br />
                        <span className="text-primary-600">{t('problem.titlePart2')}</span>
                    </h2>
                    <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
                        {t('problem.descriptionPart1')} <br />
                        {t('problem.descriptionPart2')}
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="bg-gray-50 p-8 rounded-2xl"
                    >
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <Users className="w-6 h-6 text-red-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('problem.card1')}</h3>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="bg-gray-50 p-8 rounded-2xl"
                    >
                        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                            <Lightbulb className="w-6 h-6 text-amber-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('problem.card2')}</h3>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="bg-gray-50 p-8 rounded-2xl"
                    >
                        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="w-6 h-6 text-primary-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('problem.card3')}</h3>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="mt-12 text-center"
                >
                    <p className="text-2xl font-semibold text-gray-900">
                        {t('problem.solutionPart1')} <span className="text-primary-600">{t('problem.solutionPart2')}</span>
                    </p>
                </motion.div>
            </div>

        </section >
    )
}
