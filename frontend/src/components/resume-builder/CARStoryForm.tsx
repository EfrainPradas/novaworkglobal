import React, { useState, useEffect } from 'react'
import { CARStory, COMPETENCIES } from '../../types/resume'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { Sparkles, Loader2, X, Plus } from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

interface CARStoryFormProps {
    onSubmit: (carStory: CARStory) => Promise<void>
    onCancel: () => void
    initialData?: CARStory
}

export const CARStoryForm: React.FC<CARStoryFormProps> = ({
    onSubmit,
    onCancel,
    initialData
}) => {
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [generatingAccomplishments, setGeneratingAccomplishments] = useState(false)

    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: 20 }, (_, i) => (currentYear - i).toString())

    const [formData, setFormData] = useState<CARStory>(initialData || {
        role_title: '',
        company_name: '',
        start_date: '',
        end_date: '',
        problem_challenge: '',
        actions: ['', '', ''],
        result: '',
        metrics: [],
        will_do_again: true,
        competencies: [],
        converted_to_bullet: false
    })

    const [metricInput, setMetricInput] = useState('')
    const [userSkills, setUserSkills] = useState<string[]>([])

    // Load user skills and interests from Career Vision tables
    useEffect(() => {
        loadUserSkillsAndInterests()
    }, [])

    const loadUserSkillsAndInterests = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Load Skills
            const { data: skillsData } = await supabase
                .from('user_skills')
                .select('skill_name')
                .eq('user_id', user.id)

            // Load Interests
            const { data: interestsData } = await supabase
                .from('user_interests')
                .select('interest_name')
                .eq('user_id', user.id)

            const skills = skillsData?.map((s: any) => s.skill_name) || []
            const interests = interestsData?.map((i: any) => i.interest_name) || []

            // Combine and deduplicate
            const combined = Array.from(new Set([...skills, ...interests]))

            if (combined.length > 0) {
                setUserSkills(combined)
            }
        } catch (err) {
            console.error('Error loading career vision data:', err)
        }
    }

    // Use user skills if available, otherwise fallback to default COMPETENCIES
    const displayCompetencies = userSkills.length > 0 ? userSkills : COMPETENCIES

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!formData.role_title.trim() || !formData.company_name.trim()) {
            setError(t('resumeBuilder.par.errors.roleRequired') || 'Role and Company are required')
            return
        }
        if (!formData.problem_challenge.trim()) {
            setError(t('resumeBuilder.par.errors.problemRequired'))
            return
        }
        const validActions = formData.actions.filter(a => a.trim())
        if (validActions.length < 2) {
            setError(t('resumeBuilder.par.errors.actionsRequired'))
            return
        }
        if (!formData.result.trim()) {
            setError(t('resumeBuilder.par.errors.resultRequired'))
            return
        }

        setLoading(true)
        try {
            await onSubmit({
                ...formData,
                actions: validActions
            })
        } catch (err) {
            setError(err instanceof Error ? err.message : t('carStories.form.errorSaving', 'Error saving CAR story'))
        } finally {
            setLoading(false)
        }
    }

    const handleActionChange = (index: number, value: string) => {
        const newActions = [...formData.actions]
        newActions[index] = value
        setFormData({ ...formData, actions: newActions })
    }

    const handleAddMetric = () => {
        if (metricInput.trim()) {
            setFormData({
                ...formData,
                metrics: [...formData.metrics, metricInput.trim()]
            })
            setMetricInput('')
        }
    }

    const handleRemoveMetric = (index: number) => {
        setFormData({
            ...formData,
            metrics: formData.metrics.filter((_, i) => i !== index)
        })
    }

    const toggleCompetency = (competency: string) => {
        const isSelected = formData.competencies.includes(competency)
        setFormData({
            ...formData,
            competencies: isSelected
                ? formData.competencies.filter(c => c !== competency)
                : [...formData.competencies, competency]
        })
    }

    const generateAccomplishments = async () => {
        if (!formData.problem_challenge.trim() || !formData.result.trim()) {
            setError(t('resumeBuilder.par.errors.requiredFields'))
            return
        }

        setGeneratingAccomplishments(true)
        try {
            const response = await fetch(`${API_BASE_URL}/api/ai/generate-accomplishments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                },
                body: JSON.stringify({
                    challenge: formData.problem_challenge,
                    result: formData.result,
                    role_title: formData.role_title,
                    company_name: formData.company_name,
                    skills: userSkills,
                    competencies: formData.competencies
                })
            })

            if (!response.ok) {
                throw new Error('Failed to generate accomplishments')
            }

            const data = await response.json()

            // Update form with AI-generated metrics
            setFormData({
                ...formData,
                metrics: data.accomplishments || []
            })
        } catch (err) {
            console.error('Error generating accomplishments:', err)
            setError(t('carStories.form.errorGenerating', 'Failed to generate accomplishments. Please try again.'))
        } finally {
            setGeneratingAccomplishments(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 rounded-t-lg">
                <h2 className="text-2xl font-bold">{t('resumeBuilder.par.title')}</h2>
                <p className="text-primary-100 mt-2">{t('resumeBuilder.par.subtitle')}</p>
            </div>

            {/* CAR Guide */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border-x border-b border-blue-100 dark:border-blue-800 p-4 mx-6 -mt-6 mb-6 rounded-b-lg transition-colors duration-200">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">{t('carStories.form.carFrameworkTitle', 'The CAR Framework')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                        <span className="font-bold text-orange-600 dark:text-orange-400">{t('carStories.form.contextChallenge', 'Context/Challenge:')}</span>
                        <p className="text-blue-800 dark:text-blue-200 text-xs mt-1">{t('carStories.form.contextChallengeDesc', 'What specific context, problem, or situation did you face?')}</p>
                    </div>
                    <div>
                        <span className="font-bold text-blue-600 dark:text-blue-400">{t('carStories.form.action', 'Action:')}</span>
                        <p className="text-blue-800 dark:text-blue-200 text-xs mt-1">{t('carStories.form.actionDesc', 'What specific steps did YOU take to solve it?')}</p>
                    </div>
                    <div>
                        <span className="font-bold text-green-600 dark:text-green-400">{t('carStories.form.result', 'Result:')}</span>
                        <p className="text-blue-800 dark:text-blue-200 text-xs mt-1">{t('carStories.form.resultDesc', 'What was the quantifiable outcome (metrics)?')}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-b-lg shadow-md space-y-6 transition-colors duration-200">
                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded">
                        {error}
                    </div>
                )}

                {/* Role/Company & Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('carStories.form.roleTitle', 'Role Title')} *
                        </label>
                        <input
                            type="text"
                            value={formData.role_title}
                            onChange={(e) => setFormData({ ...formData, role_title: e.target.value })}
                            placeholder={t('carStories.form.rolePlaceholder', 'e.g. Software Engineer')}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('carStories.form.companyName', 'Company Name')} *
                        </label>
                        <input
                            type="text"
                            value={formData.company_name}
                            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                            placeholder={t('carStories.form.companyPlaceholder', 'e.g. Tech Corp')}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                            required
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('carStories.form.startDate', 'Start Date')} *
                        </label>
                        <input
                            type="month"
                            value={formData.start_date}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('carStories.form.endDate', 'End Date')} *
                        </label>
                        <input
                            type="month"
                            value={formData.end_date}
                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                        />
                    </div>
                </div>

                {/* Challenge */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('carStories.form.contextChallengeLabel', 'Context/Challenge')} *
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        {t('resumeBuilder.par.problemHelp')}
                    </p>
                    <textarea
                        value={formData.problem_challenge}
                        onChange={(e) => setFormData({ ...formData, problem_challenge: e.target.value })}
                        placeholder={t('resumeBuilder.placeholders.problem')}
                        rows={3}
                        maxLength={300}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                        required
                    />
                    <div className="text-right text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {formData.problem_challenge.length}/300
                    </div>
                </div>

                {/* Actions (2-3) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('resumeBuilder.par.actions')} * (2-3 {t('common.actions')})
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        {t('resumeBuilder.par.actionsHelp')}
                    </p>
                    <div className="space-y-3">
                        {[0, 1, 2].map(index => (
                            <div key={index} className="flex items-start gap-2">
                                <span className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-semibold mt-2">
                                    {index + 1}
                                </span>
                                <input
                                    type="text"
                                    value={formData.actions[index] || ''}
                                    onChange={(e) => handleActionChange(index, e.target.value)}
                                    placeholder={index === 0 ? t('resumeBuilder.placeholders.action1') : index === 1 ? t('resumeBuilder.placeholders.action2') : t('resumeBuilder.placeholders.action3')}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                                    required={index < 2}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Result */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('resumeBuilder.par.result')} *
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        {t('resumeBuilder.par.resultHelp')}
                    </p>
                    <textarea
                        value={formData.result}
                        onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                        placeholder={t('resumeBuilder.placeholders.result')}
                        rows={3}
                        maxLength={300}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                        required
                    />
                    <div className="text-right text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {formData.result.length}/300
                    </div>
                </div>

                {/* AI Accomplishments Generator */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('carStories.form.aiAccomplishmentsGenerator', 'AI Accomplishments Generator')}
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        {t('carStories.form.aiAccomplishmentsDesc', 'Generate 3 powerful accomplishments based on your challenge, actions, and results using AI. These accomplishments will highlight the impact and metrics of your work.')}
                    </p>

                    {/* Show skills being used from Career Vision */}
                    {userSkills && userSkills.length > 0 && (
                        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-2">
                                {t('carStories.form.usingSkills', {defaultValue: 'Using {{count}} skills from your Career Vision:', count: userSkills.length})}
                            </p>
                            <div className="flex flex-wrap gap-1">
                                {userSkills.slice(0, 8).map((skill, index) => (
                                    <span
                                        key={index}
                                        className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs rounded-md font-medium"
                                    >
                                        {skill}
                                    </span>
                                ))}
                                {userSkills.length > 8 && (
                                    <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs rounded-md font-medium">
                                        +{userSkills.length - 8} {t('carStories.form.more', 'more')}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={generateAccomplishments}
                        disabled={generatingAccomplishments || !formData.problem_challenge.trim() || !formData.result.trim()}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${generatingAccomplishments || !formData.problem_challenge.trim() || !formData.result.trim()
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl'
                            }`}
                    >
                        {generatingAccomplishments ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {t('carStories.form.generatingAccomplishments', 'Generating Accomplishments...')}
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" />
                                {t('carStories.form.generateAiAccomplishments', 'Generate AI Accomplishments')}
                            </>
                        )}
                    </button>

                    {/* Display generated accomplishments */}
                    <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('carStories.form.keyMetrics', 'Key Metrics & Accomplishments:')}</p>
                        <div className="space-y-2">
                            {formData.metrics.map((metric, index) => (
                                <div
                                    key={index}
                                    className="flex items-start justify-between gap-2 p-3 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-900/10 border border-primary-200 dark:border-primary-800 rounded-lg group"
                                >
                                    <div className="flex items-start gap-2">
                                        <div className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-semibold mt-0.5">
                                            {index + 1}
                                        </div>
                                        <span className="text-primary-800 dark:text-primary-200 font-medium">{metric}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveMetric(index)}
                                        className="text-primary-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title={t('carStories.form.removeMetric', 'Remove metric')}
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>


                    {/* Manual Metric Input */}
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('carStories.form.addCustomMetric', 'Add Custom Highlight / Metric')}
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={metricInput}
                                onChange={(e) => setMetricInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMetric())}
                                placeholder={t('resumeBuilder.placeholders.metricInput')}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                            />
                            <button
                                type="button"
                                onClick={handleAddMetric}
                                disabled={!metricInput.trim()}
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Will Do Again? */}
                <div>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.will_do_again}
                            onChange={(e) => setFormData({ ...formData, will_do_again: e.target.checked })}
                            className="w-5 h-5 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500 dark:bg-gray-700"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('resumeBuilder.par.willDoAgain')}
                        </span>
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-500 ml-8 mt-1">
                        {t('resumeBuilder.par.willDoAgainHelp')}
                    </p>
                </div>

                {/* Competencies */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('carStories.form.competenciesDemonstrated', 'Competencies Demonstrated')}
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        {t('carStories.form.selectSkills', 'Select the skills you used in this accomplishment')}
                    </p>

                    {userSkills.length === 0 && (
                        <div className="mb-3 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 p-2 rounded border border-orange-200 dark:border-orange-800">
                            {t('carStories.form.tipAddSkills', 'Tip: Go to Career Vision to add your custom Skills & Interests. Showing generic list for now.')}
                        </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                        {displayCompetencies.map(competency => (
                            <button
                                key={competency}
                                type="button"
                                onClick={() => toggleCompetency(competency)}
                                className={`px-3 py-1 rounded-full text-sm font-medium transition ${formData.competencies.includes(competency)
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {competency}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        disabled={loading}
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
                    >
                        {loading ? t('common.saving') : t('carStories.form.saveCar', 'Save CAR')}
                    </button>
                </div>
            </div>
        </form>
    )
}
