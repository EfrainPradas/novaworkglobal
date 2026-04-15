import { motion } from 'framer-motion'
import { Target, Compass, Wrench, Rocket } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const iconMap = {
  target: Target,
  compass: Compass,
  wrench: Wrench,
  rocket: Rocket
}

const stepIcons: (keyof typeof iconMap)[] = ['target', 'compass', 'wrench', 'rocket']

export default function HowItWorksSection() {
  const { t } = useTranslation()
  const steps = t('howItWorks.steps', { returnObjects: true }) as { title: string; description: string }[]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
        damping: 12
      }
    }
  }

  return (
    <section id="how-it-works" className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-accent-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-accent-light rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-navy via-primary to-accent-600 mb-4">
            {t('howItWorks.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('howItWorks.subtitle')}
          </p>
        </motion.div>

        {/* Steps Container */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative"
        >
          {steps.map((step, index) => {
            const Icon = iconMap[stepIcons[index]]

            return (
              <div key={index}>
                {/* Step Card */}
                <motion.div
                  variants={itemVariants}
                  whileHover={{
                    y: -10,
                    transition: { type: 'spring', stiffness: 300 }
                  }}
                  className="relative z-10"
                >
                  <div className="group bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-primary-200 h-full">
                    {/* Number Badge */}
                    <motion.div
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                      className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold mb-6 shadow-lg mx-auto relative"
                    >
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent"></div>
                      <span className="relative z-10">{index + 1}</span>
                    </motion.div>

                    {/* Icon */}
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      whileInView={{ scale: 1, rotate: 0 }}
                      viewport={{ once: true }}
                      transition={{
                        type: 'spring',
                        stiffness: 200,
                        damping: 15,
                        delay: index * 0.1 + 0.3
                      }}
                      className="mb-6 flex justify-center"
                    >
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-teal-600 p-0.5 group-hover:scale-110 transition-transform duration-300">
                        <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center">
                          <Icon className="w-10 h-10 text-primary-600" strokeWidth={2} />
                        </div>
                      </div>
                    </motion.div>

                    {/* Content */}
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center group-hover:text-primary transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 text-center leading-relaxed">{step.description}</p>

                    {/* Bottom Gradient Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-2xl"></div>
                  </div>
                </motion.div>
              </div>
            )
          })}
        </motion.div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </section>
  )
}
