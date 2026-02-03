import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface OnboardingData {
  currentSituation: string[]
  topPriority: string[]
  targetJobTitle: string
  previousRole1: string
  previousRole2: string
  location: {
    city: string
    state?: string // Added state
    country: string
  }
  preferredLanguage: string
}

interface CareerClarityQuestionsProps {
  data: OnboardingData
  onUpdate: (data: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
  loading: boolean
  error: string | null
}

export default function CareerClarityQuestions({
  data,
  onUpdate,
  onNext,
  onBack,
  loading,
  error,
}: CareerClarityQuestionsProps) {
  const { t } = useTranslation()
  const [validationError, setValidationError] = useState<string | null>(null)

  // Country options
  const countryOptions = [
    { value: 'US', label: 'United States' },
    { value: 'CA', label: 'Canada' },
    { value: 'GB', label: 'United Kingdom' },
    { value: 'AU', label: 'Australia' },
    { value: 'MX', label: 'Mexico' },
    { value: 'ES', label: 'Spain' },
    { value: 'FR', label: 'France' },
    { value: 'DE', label: 'Germany' },
    { value: 'IT', label: 'Italy' },
    { value: 'BR', label: 'Brazil' },
    { value: 'AR', label: 'Argentina' },
    { value: 'CL', label: 'Chile' },
    { value: 'CO', label: 'Colombia' },
    { value: 'PE', label: 'Peru' },
    { value: 'OTHER', label: 'Other' }
  ]

  // US States
  const usStates = [
    { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' }, { value: 'AZ', label: 'Arizona' },
    { value: 'AR', label: 'Arkansas' }, { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
    { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' }, { value: 'FL', label: 'Florida' },
    { value: 'GA', label: 'Georgia' }, { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
    { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' }, { value: 'IA', label: 'Iowa' },
    { value: 'KS', label: 'Kansas' }, { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
    { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' }, { value: 'MA', label: 'Massachusetts' },
    { value: 'MI', label: 'Michigan' }, { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
    { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' }, { value: 'NE', label: 'Nebraska' },
    { value: 'NV', label: 'Nevada' }, { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
    { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' }, { value: 'NC', label: 'North Carolina' },
    { value: 'ND', label: 'North Dakota' }, { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
    { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' }, { value: 'RI', label: 'Rhode Island' },
    { value: 'SC', label: 'South Carolina' }, { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
    { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' }, { value: 'VT', label: 'Vermont' },
    { value: 'VA', label: 'Virginia' }, { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
    { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' }
  ]

  // Options for dropdowns


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    // Validation
    if (!data.targetJobTitle || data.targetJobTitle.trim().length < 2) {
      setValidationError(t('onboarding.questions.errors.enterJobTitle'))
      return
    }

    // Simple validation for previous roles
    if (!data.previousRole1?.trim()) {
      setValidationError("Please enter your most recent previous job title.")
      return
    }

    if (!data.location.city || data.location.city.trim().length < 2) {
      setValidationError(t('onboarding.questions.errors.enterCity'))
      return
    }

    if (!data.location.country || data.location.country.trim().length < 2) {
      setValidationError(t('onboarding.questions.errors.enterCountry'))
      return
    }

    // Check state if country is US
    if (data.location.country === 'US' && (!data.location.state || data.location.state === '')) {
      setValidationError("Please select a state.")
      return
    }

    onNext()
  }

  // Helper for multi-select not needed here anymore

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-heading font-bold text-gray-900 mb-3">
          Career Goals & Location
        </h2>
        <p className="text-gray-600">
          Tell us about your target role and where you want to work.
        </p>
      </div>

      {/* Error Messages */}
      {(error || validationError) && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error || validationError}</p>
        </div>
      )}

      {/* Questions Form */}
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Question 3: Job History & Target */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 border-b pb-2">Experience & Goals</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Previous Job Title 1 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={data.previousRole1 || ''}
                onChange={(e) => onUpdate({ previousRole1: e.target.value })}
                placeholder="e.g. Junior Developer"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Previous Job Title 2 (Optional)
              </label>
              <input
                type="text"
                value={data.previousRole2 || ''}
                onChange={(e) => onUpdate({ previousRole2: e.target.value })}
                placeholder="e.g. Intern"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What's your target job title? <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.targetJobTitle}
              onChange={(e) => onUpdate({ targetJobTitle: e.target.value })}
              placeholder={t('onboarding.questions.jobTitlePlaceholder')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
              disabled={loading}
            />
            <p className="mt-1 text-sm text-gray-500">
              {t('onboarding.questions.jobTitleHelp')}
            </p>
          </div>
        </div>

        {/* Question 4: Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('onboarding.questions.question4')}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            {/* Country Dropdown */}
            <select
              value={data.location.country}
              onChange={(e) =>
                onUpdate({
                  location: { ...data.location, country: e.target.value },
                })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
              disabled={loading}
            >
              <option value="">{t('onboarding.questions.countryPlaceholder')}</option>
              {countryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* City/State - Show dropdown for US, input for others */}
            {data.location.country === 'US' ? (
              <select
                value={data.location.city}
                onChange={(e) =>
                  onUpdate({
                    location: { ...data.location, city: e.target.value },
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                disabled={loading}
              >
                <option value="">Select State</option>
                {usStates.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={data.location.city}
                onChange={(e) =>
                  onUpdate({
                    location: { ...data.location, city: e.target.value },
                  })
                }
                placeholder={t('onboarding.questions.cityPlaceholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                disabled={loading}
              />
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4 pt-6">
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {t('common.back')}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {loading ? t('onboarding.questions.generating') : t('common.continue')}
          </button>
        </div>
      </form>

      {/* Loading Indicator */}
      {loading && (
        <div className="mt-6 flex items-center justify-center gap-3 text-primary-600">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span className="text-sm font-medium">{t('onboarding.questions.analyzingYourProfile')}</span>
        </div>
      )}
    </div>
  )
}
