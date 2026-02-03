import { useTranslation } from 'react-i18next'

interface CareerPath {
  title: string
  description: string
  salaryRange: { min: number; max: number }
  demandLevel: 'high' | 'medium' | 'low'
  requiredSkills: string[]
}

interface ClaritySnapshot {
  careerPaths: CareerPath[]
  clarityScore: number
}

interface CareerClaritySnapshotProps {
  snapshot: ClaritySnapshot | null
  onComplete: () => void
  loading: boolean
}

export default function CareerClaritySnapshot({
  snapshot,
  onComplete,
  loading,
}: CareerClaritySnapshotProps) {
  const { t } = useTranslation()

  if (!snapshot) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">{t('onboarding.snapshot.loading')}</p>
      </div>
    )
  }

  const getDemandLevelColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-green-100 text-green-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getDemandLevelLabel = (level: string) => {
    return t(`onboarding.snapshot.demandLevels.${level}`)
  }

  const formatSalary = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h2 className="text-3xl font-heading font-bold text-gray-900 mb-3">
          {t('onboarding.snapshot.title')}
        </h2>
        <p className="text-gray-600 mb-6">
          {t('onboarding.snapshot.subtitle')}
        </p>

        {/* Clarity Score */}
        <div className="inline-flex items-center gap-3 bg-primary-50 px-6 py-3 rounded-full">
          <span className="text-sm font-medium text-primary-700">
            {t('onboarding.snapshot.clarityScore')}:
          </span>
          <span className="text-2xl font-bold text-primary-600">
            {snapshot.clarityScore}%
          </span>
        </div>
      </div>

      {/* Career Paths */}
      <div className="space-y-6 mb-8">
        {snapshot.careerPaths.map((path, index) => (
          <div
            key={index}
            className={`
              bg-white border-2 rounded-xl p-6 transition-all hover:shadow-lg
              ${index === 0 ? 'border-primary-500 ring-2 ring-primary-100' : 'border-gray-200'}
            `}
          >
            {/* Path Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {index === 0 && (
                    <span className="bg-primary-600 text-white text-xs font-semibold px-2 py-1 rounded">
                      {t('onboarding.snapshot.recommended')}
                    </span>
                  )}
                  <h3 className="text-xl font-heading font-bold text-gray-900">
                    {path.title}
                  </h3>
                </div>
                <p className="text-gray-600 mb-4">{path.description}</p>
              </div>
            </div>

            {/* Path Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Salary Range */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">
                    {t('onboarding.snapshot.salaryRange')}
                  </span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {formatSalary(path.salaryRange.min)} - {formatSalary(path.salaryRange.max)}
                </p>
              </div>

              {/* Demand Level */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">
                    {t('onboarding.snapshot.demand')}
                  </span>
                </div>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getDemandLevelColor(path.demandLevel)}`}>
                  {getDemandLevelLabel(path.demandLevel)}
                </span>
              </div>

              {/* Required Skills Count */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">
                    {t('onboarding.snapshot.keySkills')}
                  </span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {path.requiredSkills.length} {t('onboarding.snapshot.skills')}
                </p>
              </div>
            </div>

            {/* Skills List */}
            <div className="mt-4 flex flex-wrap gap-2">
              {path.requiredSkills.map((skill, skillIndex) => (
                <span
                  key={skillIndex}
                  className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">
              {t('onboarding.snapshot.nextStepTitle')}
            </h4>
            <p className="text-sm text-gray-600">
              {t('onboarding.snapshot.nextStepDescription')}
            </p>
          </div>
        </div>
      </div>

      {/* Complete Button */}
      <div className="text-center">
        <button
          onClick={onComplete}
          disabled={loading}
          className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 text-lg"
        >
          {loading ? t('common.loading') : t('onboarding.snapshot.goToDashboard')}
        </button>
      </div>
    </div>
  )
}
