import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ClipboardList, AlertTriangle, ChevronRight, ChevronLeft, Save, Sparkles, Loader2, Check, CheckCircle2, ArrowRight, Play } from 'lucide-react'
import LearnMoreLink from '../../components/common/LearnMoreLink'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { PositioningQuestionnaire as QuestionnaireType, GeneratedProfessionalProfile } from '../../types/resume'
import GeneratedProfileView from '../../components/resume-builder/GeneratedProfileView'
import { trackEvent } from '../../lib/analytics'
import { useGuidedStep } from '../../hooks/useGuidedStep'
import { GuidedStepFooter } from '../../components/guided-path'

// In production, we need the deployment-specific API prefix if VITE_API_URL is missing
const fallbackApi = window.location.pathname.startsWith('/novaworkglobal')
    ? '/novaworkglobal-api'
    : ''
const API_BASE_URL = import.meta.env.VITE_API_URL || fallbackApi

const SECTION_KEYS = ['identity', 'environments', 'impact', 'strengths', 'skills', 'high_impact'] as const

export default function PositioningQuestionnairePage() {
    const guided = useGuidedStep('professional_positioning')
    const { t, i18n } = useTranslation()
    const navigate = useNavigate()

    const SECTIONS = SECTION_KEYS.map(key => ({
        key,
        label: t(`resumeBuilder.questionnaire.section_${key}`)
    }))

    const ENVIRONMENT_OPTIONS: string[] = t('resumeBuilder.questionnaire.environmentOptions', { returnObjects: true }) as string[]
    const IMPACT_TYPE_OPTIONS: string[] = t('resumeBuilder.questionnaire.impactOptions', { returnObjects: true }) as string[]
    const STRENGTH_OPTIONS: string[] = t('resumeBuilder.questionnaire.strengthOptions', { returnObjects: true }) as string[]
    const STAKEHOLDER_OPTIONS: string[] = t('resumeBuilder.questionnaire.stakeholderOptions', { returnObjects: true }) as string[]

    const [searchParams] = useSearchParams()
    const isStandalone = searchParams.get('mode') === 'standalone'
    const [currentSection, setCurrentSection] = useState(0)
    const [activeVideoSrc, setActiveVideoSrc] = useState<string | null>(null)
    const [form, setForm] = useState<Partial<QuestionnaireType>>({
        identity_current_title: '',
        identity_target_title: '',
        identity_one_phrase: '',
        years_experience_bucket: undefined,
        industries: [],
        environments: [],
        functions: [],
        trusted_problems: '',
        impact_types: [],
        scale_team_size: '',
        scale_budget: '',
        scale_geo_scope: '',
        scale_project_scale: '',
        strengths: [],
        complexity_moment: '',
        colleagues_describe: '',
        differentiator: '',
        technical_skills_tools: [],
        certifications_advanced_training: [],
        platforms_systems: [],
        methodologies: [],
        languages_spoken: [],
        job_descriptions: [],
        stakeholder_exposure: []
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [generatedProfile, setGeneratedProfile] = useState<GeneratedProfessionalProfile | null>(null)
    const [hasStoryCards, setHasStoryCards] = useState(true)
    const [showProfile, setShowProfile] = useState(false)
    const [tagInputs, setTagInputs] = useState<Record<string, string>>({})
    const [error, setError] = useState<string | null>(null)
    const [saved, setSaved] = useState(false)
    const trackedSteps = useRef<Set<string>>(new Set())

    useEffect(() => {
        loadData()
    }, [])

    useEffect(() => {
        if (!loading) {
            let currentStep = ''
            if (showProfile) {
                currentStep = 'generated-profile'
            } else {
                const stepMap: Record<number, string> = {
                    0: 'pos-identity', 1: 'pos-environments', 2: 'pos-impact',
                    3: 'pos-strengths', 4: 'pos-skills', 5: 'pos-stories'
                }
                currentStep = stepMap[currentSection]
            }
        }
    }, [currentSection, showProfile, loading])

    const loadData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Load questionnaire
            const token = (await supabase.auth.getSession()).data.session?.access_token
            const resp = await fetch(`${API_BASE_URL}/api/positioning-questionnaire`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const result = await resp.json()
            if (result.data) setForm(prev => ({ ...prev, ...result.data }))

            // Check stories & accomplishment bank
            const { count } = await supabase
                .from('par_stories')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.id)

            const { count: bankCount } = await supabase
                .from('accomplishment_bank')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.id)

            setHasStoryCards((count || 0) > 0 || (bankCount || 0) > 0)

            // Load existing profile
            const profileResp = await fetch(`${API_BASE_URL}/api/positioning-questionnaire/generated-profiles`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const profileResult = await profileResp.json()
            if (profileResult.data?.length > 0) {
                setGeneratedProfile(profileResult.data[0])
            }
        } catch (e) {
            console.error('Error loading questionnaire:', e)
        }
        setLoading(false)
        trackEvent('analytics', 'questionnaire_loaded', { has_existing_profile: !!generatedProfile })
    }

    const handleSave = async () => {
        setSaving(true)
        setError(null)
        try {
            const token = (await supabase.auth.getSession()).data.session?.access_token
            const resp = await fetch(`${API_BASE_URL}/api/positioning-questionnaire`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(form)
            })

            if (!resp.ok) {
                const err = await resp.json()
                throw new Error(err.details || err.error || 'Failed to save progress')
            }

            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
            await trackEvent('analytics', 'questionnaire_saved', { section: SECTION_LABELS[currentSection], section_key: SECTION_KEYS[currentSection] })
            return true
        } catch (e: any) {
            console.error('Error saving:', e)
            setError(e.message)
            return false
        } finally {
            setSaving(false)
        }
    }

    const handleGenerate = async () => {
        const saved = await handleSave()
        if (!saved) return

        setGenerating(true)
        setError(null)
        try {
            const token = (await supabase.auth.getSession()).data.session?.access_token
            const resp = await fetch(`${API_BASE_URL}/api/positioning-questionnaire/generate-profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ language: i18n.language?.slice(0, 2) })
            })

            const result = await resp.json()
            if (resp.ok && result.success) {
                await trackEvent('analytics', 'questionnaire_profile_generated', { version: result.data?.version })
                await trackEvent('analytics', 'questionnaire_funnel_completed', { total_sections: SECTIONS.length })
                setGeneratedProfile(result.data)
                setShowProfile(true)
            } else {
                throw new Error(result.details || result.error || 'Failed to generate profile')
            }
        } catch (e: any) {
            console.error('Error generating:', e)
            setError(e.message)
        } finally {
            setGenerating(false)
        }
    }

    const updateField = (field: string, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    const toggleArrayItem = (field: string, item: string) => {
        setForm(prev => {
            const current = (prev as any)[field] || []
            return {
                ...prev,
                [field]: current.includes(item)
                    ? current.filter((i: string) => i !== item)
                    : [...current, item]
            }
        })
    }

    const addTagItem = (field: string) => {
        const val = tagInputs[field]?.trim()
        if (!val) return
        setForm(prev => ({
            ...prev,
            [field]: [...((prev as any)[field] || []), val]
        }))
        setTagInputs(prev => ({ ...prev, [field]: '' }))
    }

    const removeTagItem = (field: string, idx: number) => {
        setForm(prev => ({
            ...prev,
            [field]: ((prev as any)[field] || []).filter((_: any, i: number) => i !== idx)
        }))
    }

    const SECTION_LABELS: Record<number, string> = {
        0: 'Sección 1 de 6: Identidad y Objetivo',
        1: 'Sección 2 de 6: Ambientes y Funciones',
        2: 'Sección 3 de 6: Impacto y Escala',
        3: 'Sección 4 de 6: Fortalezas y Diferenciadores',
        4: 'Sección 5 de 6: Habilidades y Herramientas',
        5: 'Sección 6 de 6: Historias de Alto Impacto'
    }

    const nextSection = async () => {
        await trackEvent('analytics', 'questionnaire_section_next', {
            from_section: SECTION_LABELS[currentSection],
            to_section: SECTION_LABELS[currentSection + 1],
            section_number: currentSection + 1,
            total_sections: SECTIONS.length
        })

        await handleSave()
        if (currentSection < SECTIONS.length - 1) setCurrentSection(currentSection + 1)
    }

    const prevSection = async () => {
        await trackEvent('analytics', 'questionnaire_section_back', {
            from_section: SECTION_LABELS[currentSection],
            to_section: SECTION_LABELS[currentSection - 1],
            section_number: currentSection + 1
        })

        await handleSave()
        if (currentSection > 0) setCurrentSection(currentSection - 1)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            </div>
        )
    }

    if (generating) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-16 h-16 text-primary-600 animate-spin" />
                    <span className="text-primary-900 font-semibold mt-2">{t('resumeBuilder.questionnaire.generatingProfile', 'Generating your Professional Profile...')}</span>
                </div>
            </div>
        )
    }

    if (showProfile && generatedProfile) {
        return (
            <GeneratedProfileView
                profile={generatedProfile}
                onBack={() => setShowProfile(false)}
                onRegenerate={handleGenerate}
                generating={generating}
            />
        )
    }

    const renderTagField = (field: string, label: string, placeholder: string) => (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
            <div className="flex flex-wrap gap-2 mb-2">
                {((form as any)[field] || []).map((item: string, idx: number) => (
                    <span key={idx} className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs flex items-center gap-1">
                        {item}
                        <button onClick={() => removeTagItem(field, idx)} className="hover:text-red-500">×</button>
                    </span>
                ))}
            </div>
            <div className="flex gap-2">
                <input
                    value={tagInputs[field] || ''}
                    onChange={e => setTagInputs(prev => ({ ...prev, [field]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTagItem(field))}
                    className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    placeholder={placeholder}
                />
                <button onClick={() => addTagItem(field)} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 text-gray-700 dark:text-gray-300">{t('resumeBuilder.questionnaire.add', 'Add')}</button>
            </div>
        </div>
    )

    const renderChecklistField = (field: string, options: string[], label: string) => (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
            <div className="flex flex-wrap gap-2">
                {options.map(opt => {
                    const selected = ((form as any)[field] || []).includes(opt)
                    return (
                        <button
                            key={opt}
                            onClick={() => toggleArrayItem(field, opt)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selected
                                ? 'bg-primary-100 text-primary-700 border border-primary-300 dark:bg-primary-900/30 dark:text-primary-300'
                                : 'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200'
                                }`}
                        >
                            {selected && <Check className="w-3 h-3 inline mr-1" />}
                            {opt}
                        </button>
                    )
                })}
            </div>
        </div>
    )

    const inputClass = "w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
            <div className="max-w-3xl mx-auto">

                {/* Back Link */}
                <button
                    onClick={() => navigate(isStandalone ? '/dashboard/resume-builder' : '/dashboard/resume/story-cards')}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> {isStandalone ? t('resumeBuilder.questionnaire.backToResumeBuilder', 'Back to Resume Builder') : t('resumeBuilder.questionnaire.backToCarStories', 'Back to CAR Stories')}
                </button>

                {/* Header */}
                <div className="mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium mb-3">
                        <ClipboardList className="w-4 h-4" /> {t('resumeBuilder.questionnaire.step3', 'Step 3')}
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('resumeBuilder.questionnaire.title', 'Professional Positioning Questionnaire')}</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{t('resumeBuilder.questionnaire.subtitle', 'Complete this after your accomplishments for best results.')}</p>
                </div>

                {/* Warning if no stories */}
                {!hasStoryCards && (
                    <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">{t('resumeBuilder.questionnaire.warningText', 'Completing your accomplishments first improves the quality of the generated profile.')}</p>
                            <button onClick={() => navigate('/dashboard/resume/story-cards')} className="text-sm text-amber-700 dark:text-amber-300 underline mt-1">{t('resumeBuilder.questionnaire.goToStoryCards', 'Go to your "accomplishment bank" →')}</button>
                        </div>
                    </div>
                )}

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
                        </div>
                        <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">×</button>
                    </div>
                )}

                {/* Success Alert */}
                {saved && (
                    <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                        <CheckCircle2 className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-primary-800 dark:text-primary-200">{t('common.saved', 'Saved!')}</p>
                        </div>
                    </div>
                )}

                {/* Section Progress & Top Navigation */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                    <div className="flex-1 w-full">
                        <div className="flex items-center gap-1 mb-2">
                            {SECTIONS.map((s, i) => (
                                <button
                                    key={s.key}
                                    onClick={() => setCurrentSection(i)}
                                    className={`flex-1 h-2 rounded-full transition-all ${i <= currentSection ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'
                                        }`}
                                />
                            ))}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
                            {t('resumeBuilder.questionnaire.sectionLabel', 'Section {{current}} of {{total}}: {{name}}', { current: currentSection + 1, total: SECTIONS.length, name: SECTIONS[currentSection].label })}
                        </p>
                    </div>
                    <div className="flex-shrink-0 flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                        {currentSection > 0 && (
                            <button
                                onClick={prevSection}
                                disabled={saving}
                                className="flex items-center justify-center gap-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl text-sm font-medium transition-all"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                        )}
                        {currentSection < SECTIONS.length - 1 ? (
                            <button
                                onClick={nextSection}
                                disabled={saving}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold shadow-md transition-all"
                            >
                                {t('common.nextSection', 'Next Section')}
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleGenerate}
                                disabled={generating || saving}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold shadow-md transition-all"
                            >
                                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                {t('common.generateProfile', 'Generate')}
                            </button>
                        )}
                    </div>
                </div>

                {/* Section Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 md:p-8 space-y-6">

                    {/* Section 1: Identity & Target */}
                    {currentSection === 0 && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('resumeBuilder.questionnaire.currentJobTitle', 'Current Job Title')}</label>
                                <input value={form.identity_current_title || ''} onChange={e => updateField('identity_current_title', e.target.value)} className={inputClass} placeholder={t('resumeBuilder.questionnaire.currentJobTitlePlaceholder', 'e.g., Director of Supply Chain')} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('resumeBuilder.questionnaire.onePhraseIdentity', 'One-Phrase Identity')}</label>
                                <p className="text-xs text-gray-500 mb-1">{t('resumeBuilder.questionnaire.onePhraseIdentityHelper', 'How would you describe yourself in one powerful phrase?')}</p>
                                <input value={form.identity_one_phrase || ''} onChange={e => updateField('identity_one_phrase', e.target.value)} className={inputClass} placeholder={t('resumeBuilder.questionnaire.onePhraseIdentityPlaceholder', 'e.g., Operational strategist who turns chaos into scalable systems')} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('resumeBuilder.questionnaire.yearsOfExperience', 'Years of Experience')}</label>
                                <div className="flex flex-wrap gap-2">
                                    {(['0-2', '3-5', '6-10', '10-15', '15+'] as const).map(bucket => (
                                        <button
                                            key={bucket}
                                            onClick={() => updateField('years_experience_bucket', bucket)}
                                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${form.years_experience_bucket === bucket
                                                ? 'bg-primary-100 text-primary-700 border border-primary-300 dark:bg-primary-900/30 dark:text-primary-300'
                                                : 'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200'
                                                }`}
                                        >
                                            {bucket} years
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {renderTagField('industries', t('resumeBuilder.questionnaire.industries', 'Industries'), t('resumeBuilder.questionnaire.industriesPlaceholder', 'e.g., Manufacturing, Healthcare'))}
                        </>
                    )}

                    {/* Section 2: Environments & Functions */}
                    {currentSection === 1 && (
                        <>
                            {renderChecklistField('environments', ENVIRONMENT_OPTIONS, t('resumeBuilder.questionnaire.workEnvironments', 'Work Environments'))}
                            {renderTagField('functions', t('resumeBuilder.questionnaire.functions', 'Functions (2-3 primary)'), t('resumeBuilder.questionnaire.functionsPlaceholder', 'e.g., Operations, Finance, Strategy'))}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('resumeBuilder.questionnaire.trustedProblems', 'Trusted Problems')}</label>
                                <p className="text-xs text-gray-500 mb-1">{t('resumeBuilder.questionnaire.trustedProblemsHelper', 'What type of problems do people bring to you to solve?')}</p>
                                <textarea value={form.trusted_problems || ''} onChange={e => updateField('trusted_problems', e.target.value)} rows={3} className={inputClass + ' resize-none'} placeholder={t('resumeBuilder.questionnaire.trustedProblemsPlaceholder', 'e.g., Complex cross-functional challenges...')} />
                            </div>
                        </>
                    )}

                    {/* Section 3: Impact & Scale */}
                    {currentSection === 2 && (
                        <>
                            {renderChecklistField('impact_types', IMPACT_TYPE_OPTIONS, t('resumeBuilder.questionnaire.typesOfImpact', 'Types of Impact You Deliver'))}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('resumeBuilder.questionnaire.teamSize', 'Team Size')}</label>
                                    <input value={form.scale_team_size || ''} onChange={e => updateField('scale_team_size', e.target.value)} className={inputClass} placeholder={t('resumeBuilder.questionnaire.teamSizePlaceholder', 'e.g., 50+ direct, 200+ indirect')} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('resumeBuilder.questionnaire.budgetManaged', 'Budget Managed')}</label>
                                    <input value={form.scale_budget || ''} onChange={e => updateField('scale_budget', e.target.value)} className={inputClass} placeholder={t('resumeBuilder.questionnaire.budgetManagedPlaceholder', 'e.g., $25M annual')} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('resumeBuilder.questionnaire.geographicScope', 'Geographic Scope')}</label>
                                    <input value={form.scale_geo_scope || ''} onChange={e => updateField('scale_geo_scope', e.target.value)} className={inputClass} placeholder={t('resumeBuilder.questionnaire.geographicScopePlaceholder', 'e.g., Global (US, EU, APAC)')} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('resumeBuilder.questionnaire.projectScale', 'Project Scale')}</label>
                                    <input value={form.scale_project_scale || ''} onChange={e => updateField('scale_project_scale', e.target.value)} className={inputClass} placeholder={t('resumeBuilder.questionnaire.projectScalePlaceholder', 'e.g., 12-month, $10M programs')} />
                                </div>
                            </div>
                            {renderChecklistField('stakeholder_exposure', STAKEHOLDER_OPTIONS, t('resumeBuilder.questionnaire.stakeholderExposure', 'Stakeholder Exposure'))}
                        </>
                    )}

                    {/* Section 4: Strengths & Differentiators */}
                    {currentSection === 3 && (
                        <>
                            {renderChecklistField('strengths', STRENGTH_OPTIONS, t('resumeBuilder.questionnaire.coreStrengths', 'Core Strengths (select your top 5-8)'))}
                        </>
                    )}

                    {/* Section 5: Skills & Tools */}
                    {currentSection === 4 && (
                        <>
                            {renderTagField('technical_skills_tools', t('resumeBuilder.questionnaire.technicalSkills', 'Technical Skills & Tools'), t('resumeBuilder.questionnaire.technicalSkillsPlaceholder', 'e.g., SAP, Python, Tableau'))}
                            {renderTagField('platforms_systems', t('resumeBuilder.questionnaire.platformsSystems', 'Platforms & Systems'), t('resumeBuilder.questionnaire.platformsSystemsPlaceholder', 'e.g., Salesforce, Oracle, AWS'))}
                            {renderTagField('methodologies', t('resumeBuilder.questionnaire.methodologies', 'Methodologies & Frameworks'), t('resumeBuilder.questionnaire.methodologiesPlaceholder', 'e.g., Lean Six Sigma, Agile, PMBOK'))}
                            {renderTagField('certifications_advanced_training', t('resumeBuilder.questionnaire.certifications', 'Certifications & Advanced Training'), t('resumeBuilder.questionnaire.certificationsPlaceholder', 'e.g., PMP, CPA, AWS Solutions Architect'))}
                            {renderTagField('languages_spoken', t('resumeBuilder.questionnaire.languagesSpoken', 'Languages Spoken'), t('resumeBuilder.questionnaire.languagesSpokenPlaceholder', 'e.g., English, Spanish, French'))}
                        </>
                    )}

                    {/* Section 6: High-Impact Stories */}
                    {currentSection === 5 && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('resumeBuilder.questionnaire.largestResult', 'Your Largest Result')}</label>
                                <p className="text-xs text-gray-500 mb-1">What is the single most impressive number or outcome you've delivered?</p>
                                <textarea value={form.largest_result || ''} onChange={e => updateField('largest_result', e.target.value)} rows={2} className={inputClass + ' resize-none'} placeholder="e.g., Generated $25M in additional revenue over 18 months by..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('resumeBuilder.questionnaire.mostComplexProject', 'Most Complex Project')}</label>
                                <p className="text-xs text-gray-500 mb-1">Aside from the complexity moment, what project required the most coordination?</p>
                                <textarea value={form.most_complex_project || ''} onChange={e => updateField('most_complex_project', e.target.value)} rows={3} className={inputClass + ' resize-none'} placeholder="e.g., Managed the global rollout of a new ERP system for 5000+ users..." />
                            </div>
                        </>
                    )}
                </div>

                {/* Navigation Footer */}
                <div className="flex justify-between gap-4 mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex gap-2">
                        <button
                            onClick={prevSection}
                            disabled={currentSection === 0}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${currentSection === 0
                                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            <ArrowLeft className="w-4 h-4" /> {t('common.back', 'Back')}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2.5 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl text-sm font-medium transition-all"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {t('common.saveProgress', 'Save Progress')}
                        </button>
                    </div>

                    {currentSection < SECTIONS.length - 1 ? (
                        <button
                            onClick={nextSection}
                            disabled={saving}
                            className="flex items-center gap-2 px-8 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold shadow-lg transition-all"
                        >
                            {t('common.nextSection', 'Next Section')}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleGenerate}
                            disabled={generating || saving}
                            className="flex items-center gap-2 px-8 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold shadow-lg transition-all"
                        >
                            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            {t('common.generateProfile', 'Generate Professional Profile')}
                        </button>
                    )}
                </div>

                {/* Existing generated profile */}
                {generatedProfile && !showProfile && (
                    <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generated Profile (v{generatedProfile.version})</h3>
                                <p className="text-sm text-gray-500">Click to view and edit your professional profile.</p>
                            </div>
                            <button
                                onClick={() => { setShowProfile(true); trackEvent('analytics', 'questionnaire_view_profile', { version: generatedProfile?.version }) }}
                                className="px-4 py-2 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-sm font-medium hover:bg-primary-100 dark:hover:bg-primary-800/40 transition-colors"
                            >
                                View Profile →
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Video Modal */}
            {activeVideoSrc && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" onClick={() => setActiveVideoSrc(null)}>
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                    <div className="relative w-full max-w-5xl bg-black rounded-2xl overflow-hidden shadow-2xl z-10" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setActiveVideoSrc(null)}
                            className="absolute top-4 right-4 z-20 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <div className="w-full aspect-video bg-black">
                            <video src={activeVideoSrc} className="w-full h-full outline-none" controls controlsList="nodownload" autoPlay playsInline>
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    </div>
                </div>
            )}

            {/* Guided Path Footer */}
            <GuidedStepFooter
              isVisible={guided.isGuidedMode && guided.isStepComplete}
              nextStepName={guided.nextStepName}
              nextStepKey={guided.nextStepKey}
              onContinue={guided.completeAndAdvance}
              onSkip={() => guided.skipAndAdvance()}
            />
        </div>
    )
}
