import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import BookingModal from '../booking/BookingModal'

export default function CoachingTeaser() {
  const { t } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<{ title: string; price: number } | null>(null)

  const options = [
    {
      title: t('coachingTeaser.email', 'Email'),
      price: 39,
      unit: t('coachingTeaser.perMonth', '/ mes'),
      detail: t('coachingTeaser.emailDetail', '3 correos mensuales'),
    },
    {
      title: t('coachingTeaser.session', 'Sesión 1:1'),
      price: 149,
      unit: t('coachingTeaser.perSession', '/ sesión'),
      detail: t('coachingTeaser.sessionDetail', '45 min en vivo'),
    },
    {
      title: t('coachingTeaser.bundle', 'Coach + Email'),
      price: 179,
      unit: t('coachingTeaser.perMonth', '/ mes'),
      detail: t('coachingTeaser.bundleDetail', '1 sesión + 3 emails'),
    },
  ]

  const handleClick = (opt: { title: string; price: number }) => {
    setSelectedService(opt)
    setIsModalOpen(true)
  }

  return (
    <div className="mt-10">
      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-700 mb-8" />

      {/* Question */}
      <p className="text-center text-gray-600 dark:text-gray-400 text-base mb-8">
        {t('coachingTeaser.question', '¿Quieres retroalimentación de un')}{' '}
        <span className="font-bold text-gray-900 dark:text-white">
          {t('coachingTeaser.certifiedCoach', 'coach certificado')}
        </span>
        ? {t('coachingTeaser.chooseOption', 'Elige una opción.')}
      </p>

      {/* Compact cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
        {options.map((opt) => (
          <button
            key={opt.title}
            onClick={() => handleClick(opt)}
            className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-center hover:shadow-lg hover:-translate-y-0.5 hover:border-primary-300 transition-all cursor-pointer"
          >
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{opt.title}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              ${opt.price}
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">{opt.unit}</span>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{opt.detail}</p>
          </button>
        ))}
      </div>

      {/* Link */}
      <div className="text-center mt-6">
        <a
          href="/dashboard/coaching"
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
        >
          {t('coachingTeaser.learnMore', 'Conocer más sobre coaching')} <ArrowRight className="w-4 h-4" />
        </a>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {t('coachingTeaser.noCommitment', 'Sin compromisos · Cancela cuando quieras')}
        </p>
      </div>

      {selectedService && (
        <BookingModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          serviceName={selectedService.title}
          price={selectedService.price}
        />
      )}
    </div>
  )
}
