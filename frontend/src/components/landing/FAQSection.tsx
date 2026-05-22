import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function FAQSection() {
  const { t } = useTranslation()
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const items = t('faq.items', { returnObjects: true }) as { question: string; answer: string }[]

  return (
    <section id="faq" className="py-20 px-4 bg-[var(--ascendia-surface)]">
      <div className="max-w-3xl mx-auto">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-4"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-[var(--ascendia-accent)] text-[var(--ascendia-primary)] text-xs font-semibold tracking-wider uppercase">
            {t('faq.badge')}
          </span>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--ascendia-text)] mb-6">
            <span className="font-serif">{t('faq.title')}</span>
          </h2>
          <p className="text-lg text-[var(--ascendia-text-muted)] max-w-2xl mx-auto leading-relaxed">
            {t('faq.subtitle')}
          </p>
        </motion.div>

        {/* Accordion */}
        <div className="flex flex-col gap-3">
          {items.map((item, index) => {
            const isOpen = openIndex === index
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className={`border rounded-[var(--ascendia-radius-md)] overflow-hidden transition-colors ${
                  isOpen
                    ? 'border-[var(--ascendia-primary)] bg-[var(--ascendia-accent-subtle)]'
                    : 'border-[var(--ascendia-border-soft)] bg-[var(--ascendia-surface)]'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                >
                  <span className="text-base font-semibold text-[var(--ascendia-text)] pr-4">{item.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-[var(--ascendia-text-muted)] shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="px-6 pb-5"
                  >
                    <p className="text-sm text-[var(--ascendia-text-muted)] leading-relaxed">{item.answer}</p>
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}