import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface OnboardingData {
    currentSituation: string[]
    topPriority: string[]
}

interface SituationPriorityProps {
    data: OnboardingData
    onUpdate: (data: Partial<OnboardingData>) => void
    onNext: () => void
    onBack: () => void
}

export default function SituationPriority({
    data,
    onUpdate,
    onNext,
    onBack,
}: SituationPriorityProps) {
    const { t } = useTranslation()
    const [validationError, setValidationError] = useState<string | null>(null)

    const situationOptions = [
        { value: 'actively_job_hunting', label: t('onboarding.questions.situations.activelyJobHunting') },
        { value: 'exploring_new_career', label: t('onboarding.questions.situations.exploringNewCareer') },
        { value: 'feeling_stuck', label: t('onboarding.questions.situations.feelingStuck') },
        { value: 'recently_laid_off', label: t('onboarding.questions.situations.recentlyLaidOff') },
        { value: 'new_graduate', label: t('onboarding.questions.situations.newGraduate') },
        { value: 'career_changer', label: t('onboarding.questions.situations.careerChanger') },
    ]

    const priorityOptions = [
        { value: 'better_job', label: t('onboarding.questions.priorities.betterJob') },
        { value: 'higher_salary', label: t('onboarding.questions.priorities.higherSalary') },
        { value: 'career_change', label: t('onboarding.questions.priorities.careerChange') },
        { value: 'work_life_balance', label: t('onboarding.questions.priorities.workLifeBalance') },
        { value: 'remote_work', label: t('onboarding.questions.priorities.remoteWork') },
        { value: 'international_opportunity', label: t('onboarding.questions.priorities.internationalOpportunity') },
    ]

    const toggleSelection = (field: 'currentSituation' | 'topPriority', value: string) => {
        const currentValues = data[field] || []
        const newValues = currentValues.includes(value)
            ? currentValues.filter(v => v !== value)
            : [...currentValues, value]

        onUpdate({ [field]: newValues })
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setValidationError(null)

        if (!data.currentSituation || data.currentSituation.length === 0) {
            setValidationError("Please select at least one option for your current situation.")
            return
        }

        if (!data.topPriority || data.topPriority.length === 0) {
            setValidationError("Please select at least one top priority.")
            return
        }

        onNext()
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-heading font-bold text-gray-900 mb-3">
                    Your Current State
                </h2>
                <p className="text-gray-600">
                    Help us understand where you are and what matters most to you right now.
                </p>
            </div>

            {validationError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{validationError}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Question 1: Current Situation (Multiple Choice) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        What's your current situation? <span className="text-red-500">*</span> (Select all that apply)
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {situationOptions.map((option) => (
                            <div
                                key={option.value}
                                onClick={() => toggleSelection('currentSituation', option.value)}
                                className={`p-3 border rounded-lg cursor-pointer transition-all flex items-center gap-3 ${(data.currentSituation || []).includes(option.value)
                                        ? 'border-primary-500 bg-primary-50'
                                        : 'border-gray-200 hover:border-primary-200'
                                    }`}
                            >
                                <div className={`w-5 h-5 rounded border flex items-center justify-center ${(data.currentSituation || []).includes(option.value)
                                        ? 'bg-primary-500 border-primary-500'
                                        : 'border-gray-400'
                                    }`}>
                                    {(data.currentSituation || []).includes(option.value) && (
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                                <span className="text-sm text-gray-700">{option.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Question 2: Top Priority (Multiple Choice) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        What's your top priority right now? <span className="text-red-500">*</span> (Select all that apply)
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {priorityOptions.map((option) => (
                            <div
                                key={option.value}
                                onClick={() => toggleSelection('topPriority', option.value)}
                                className={`p-3 border rounded-lg cursor-pointer transition-all flex items-center gap-3 ${(data.topPriority || []).includes(option.value)
                                        ? 'border-primary-500 bg-primary-50'
                                        : 'border-gray-200 hover:border-primary-200'
                                    }`}
                            >
                                <div className={`w-5 h-5 rounded border flex items-center justify-center ${(data.topPriority || []).includes(option.value)
                                        ? 'bg-primary-500 border-primary-500'
                                        : 'border-gray-400'
                                    }`}>
                                    {(data.topPriority || []).includes(option.value) && (
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                                <span className="text-sm text-gray-700">{option.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex gap-4 pt-6">
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                    >
                        {t('common.back')}
                    </button>
                    <button
                        type="submit"
                        className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                    >
                        {t('common.continue')}
                    </button>
                </div>
            </form>
        </div>
    )
}
