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
    <section id="how-it-works" className="py-20 px-4 bg-gradient-to-b from-[var(--ascendia-bg)] to-[var(--ascendia-surface)] relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-48 h-48 md:w-96 md:h-96 bg-[var(--ascendia-accent)] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-48 h-48 md:w-96 md:h-96 bg-[var(--ascendia-accent)] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-48 h-48 md:w-96 md:h-96 bg-[var(--ascendia-accent)] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
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
          <span className="inline-block px-3 py-1 rounded-full bg-[var(--ascendia-accent)] text-[var(--ascendia-primary)] text-xs font-semibold tracking-wider uppercase mb-4">
            {t('howItWorks.kicker')}
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--ascendia-text)] mb-4">
            <span className="font-serif">{t('howItWorks.title')}</span>
          </h2>
          <p className="text-lg text-[var(--ascendia-text-muted)] max-w-2xl mx-auto">
            {t('howItWorks.subtitle')}
          </p>
        </motion.div>

        {/* Steps Container */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 relative"
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
                  <div className="group bg-[var(--ascendia-surface)] rounded-2xl p-6 md:p-8 shadow-md hover:shadow-md transition-all duration-300 border border-[var(--ascendia-border-soft)] hover:border-[var(--ascendia-accent)] h-full">
                    {/* Number Badge */}
                    <motion.div
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                      className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[var(--ascendia-primary)] flex items-center justify-center text-[var(--ascendia-primary-foreground)] text-xl md:text-2xl font-bold mb-6 shadow-md mx-auto relative"
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
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-[var(--ascendia-primary)] p-0.5 group-hover:scale-110 transition-transform duration-300">
                        <div className="w-full h-full rounded-2xl bg-[var(--ascendia-surface)] flex items-center justify-center">
                          <Icon className="w-8 h-8 md:w-10 md:h-10 text-[var(--ascendia-primary)]" strokeWidth={2} />
                        </div>
                      </div>
                    </motion.div>

                    {/* Content */}
                    <h3 className="text-xl md:text-2xl font-bold text-[var(--ascendia-text)] mb-3 text-center group-hover:text-[var(--ascendia-primary)] transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-[var(--ascendia-text-muted)] text-center leading-relaxed">{step.description}</p>

                    {/* Bottom Accent Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--ascendia-primary)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-2xl"></div>
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
