import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FileText, Clock, Layers, ArrowLeft, ArrowRight, CheckCircle2, Play } from 'lucide-react'
import LearnMoreLink from '../../components/common/LearnMoreLink'
import { getVideoUrl } from '@/config/videoUrls'
import { supabase } from '../../lib/supabase'
import { BackButton } from '../../components/common/BackButton'
import SelectResumeLanguage from '../../components/resume-builder/SelectResumeLanguage'
import {
  detectResumeLanguage,
  translateResumeData,
  saveTranslatedResumeToStorage,
  SECTION_HEADERS,
  type ResumeLanguage,
  type ResumeData,
} from '../../services/resumeTranslator'

export default function ResumeTypeSelection() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const isStandalone = searchParams.get('mode') === 'standalone'
    const [selectedType, setSelectedType] = useState<'chronological' | 'functional' | null>(null)
    const [activeVideoSrc, setActiveVideoSrc] = useState<string | null>(null)

    // Language selection state
    const [showLanguageModal, setShowLanguageModal] = useState(false)
    const [isTranslating, setIsTranslating] = useState(false)
    const [translationError, setTranslationError] = useState<string | null>(null)
    const [detectedLanguage, setDetectedLanguage] = useState<ResumeLanguage>('en')
    const [resumeDataForTranslation, setResumeDataForTranslation] = useState<ResumeData | null>(null)

    const handleContinue = async () => {
        if (selectedType) {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    // Update the master resume with the selected type
                    const { error } = await supabase
                        .from('user_resumes')
                        .update({ resume_type: selectedType })
                        .eq('user_id', user.id)
                        .eq('is_master', true)

                    if (error) throw error
                }

                // Load resume data to detect language and show modal
                const data = await loadMinimalResumeData(user!.id)
                if (data) {
                    const detected = detectResumeLanguage(data)
                    setDetectedLanguage(detected)
                    setResumeDataForTranslation(data)
                }

                setShowLanguageModal(true)
            } catch (error) {
                console.error('Error saving resume type:', error)
                // Fallback: navigate directly
                navigate('/dashboard/resume/final-preview')
            }
        }
    }

    const handleLanguageConfirm = async (language: ResumeLanguage) => {
        // Same language — no translation needed
        if (language === detectedLanguage || !resumeDataForTranslation) {
            setShowLanguageModal(false)
            navigate('/dashboard/resume/final-preview')
            return
        }

        // Different language — translate
        setIsTranslating(true)
        setTranslationError(null)

        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) {
                setShowLanguageModal(false)
                navigate('/dashboard/resume/final-preview')
                return
            }

            const translated = await translateResumeData(resumeDataForTranslation, language, token)
            const sectionHeaders = SECTION_HEADERS[language]
            saveTranslatedResumeToStorage(translated, language, sectionHeaders)

            setShowLanguageModal(false)
            navigate('/dashboard/resume/final-preview')
        } catch (error: any) {
            console.error('Translation error:', error)
            setTranslationError(error.message || 'Translation failed')
            setIsTranslating(false)
        }
    }

    const handleLanguageClose = () => {
        if (isTranslating) return
        setShowLanguageModal(false)
        setTranslationError(null)
    }

    // Minimal load to detect language — full data will be loaded by ResumeFinalPreview
    const loadMinimalResumeData = async (userId: string): Promise<ResumeData | null> => {
        try {
            const { data: masterResumes } = await supabase
                .from('user_resumes')
                .select('*')
                .eq('user_id', userId)
                .eq('is_master', true)
                .order('created_at', { ascending: false })
                .limit(1)

            const masterResume = masterResumes?.[0]
            if (!masterResume) return null

            const { data: work } = await supabase
                .from('work_experience')
                .select('*, accomplishments(*)')
                .eq('resume_id', masterResume.id)
                .order('start_date', { ascending: false })
                .limit(1)

            return {
                contact: { full_name: '', email: null, phone: null, linkedin: null, linkedin_url: null, location: null, portfolio: null },
                summary: masterResume.profile_summary || '',
                areas_of_excellence: masterResume.areas_of_excellence || [],
                skills_section: {},
                work_experience: (work || []).map((exp: any) => ({
                    ...exp,
                    accomplishments: (exp.accomplishments || []).filter((a: any) => a.is_visible !== false),
                })),
                education: [],
                certifications: [],
                awards: [],
                resume_type: masterResume.resume_type || selectedType || 'chronological',
                master_resume_id: masterResume.id,
            }
        } catch (e) {
            console.error('Error loading resume data for language detection:', e)
            return null
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6 md:p-10 transition-colors duration-200">
            <div className="mx-auto max-w-5xl">
                <BackButton
                    to="/dashboard/resume-builder"
                    label={t('resumeBuilder.typeSelection.backToBuilder', 'Back to Resume Builder')}
                    variant="light"
                    className="mb-8 pl-0"
                />

                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white md:text-5xl">
                        {t('resumeBuilder.typeSelection.title', 'Choose Your Resume')}
                    </h1>
                    <p className="mt-4 text-base text-slate-600 dark:text-slate-400 md:text-lg max-w-2xl mx-auto">
                        {t('resumeBuilder.typeSelection.subtitle', 'Select the structural format that best highlights your professional narrative and aligns with your target role.')}
                    </p>
                    <div className="flex items-center justify-center gap-3 mt-6">
                        <button
                            onClick={() => setActiveVideoSrc(getVideoUrl('The_Architecture_of_Access__Decoding_the_Résumé_Reality_Match.mp4'))}
                            className="flex items-center gap-2 px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                            <Play className="w-4 h-4" /> {t('resumeBuilder.typeSelection.watchVideo', 'Watch video')}
                        </button>
                        <LearnMoreLink
                          label={t('resumeBuilder.typeSelection.learnMoreLabel', 'Which resume is right for you?')}
                          description={t('resumeBuilder.typeSelection.learnMoreText', 'One format does not fit all roles')}
                          onClick={() => navigate('/dashboard/resume/type-selection/learn-more')}
                        />
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
                    {/* Chronological Option */}
                    <button
                        onClick={() => setSelectedType('chronological')}
                        className={`relative flex flex-col items-center justify-center p-10 text-left transition-all duration-300 rounded-[2rem] border-2 bg-white dark:bg-slate-900 shadow-sm ${selectedType === 'chronological'
                            ? 'border-blue-600 dark:border-blue-500 shadow-xl shadow-blue-500/10 scale-[1.02]'
                            : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700 hover:shadow-md'
                            }`}
                    >
                        {selectedType === 'chronological' && (
                            <div className="absolute top-6 right-6 text-blue-600 dark:text-blue-500">
                                <CheckCircle2 className="w-8 h-8 fill-blue-50 dark:fill-blue-500/10" />
                            </div>
                        )}
                        <div className={`mb-6 p-5 rounded-2xl ${selectedType === 'chronological' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}>
                            <Clock className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">{t('resumeBuilder.typeSelection.chronological', 'Chronological')}</h2>
                        <p className="text-center text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                            {t('resumeBuilder.typeSelection.chronologicalDesc', 'The industry standard. Best for showing a steady progression in a specific career path. Highlights your most recent experiences first.')}
                        </p>
                    </button>

                    {/* Functional Option */}
                    <button
                        onClick={() => setSelectedType('functional')}
                        className={`relative flex flex-col items-center justify-center p-10 text-left transition-all duration-300 rounded-[2rem] border-2 bg-white dark:bg-slate-900 shadow-sm ${selectedType === 'functional'
                            ? 'border-cyan-600 dark:border-cyan-500 shadow-xl shadow-cyan-500/10 scale-[1.02]'
                            : 'border-slate-200 dark:border-slate-800 hover:border-cyan-300 dark:hover:border-slate-700 hover:shadow-md'
                            }`}
                    >
                        {selectedType === 'functional' && (
                            <div className="absolute top-6 right-6 text-cyan-600 dark:text-cyan-500">
                                <CheckCircle2 className="w-8 h-8 fill-cyan-50 dark:fill-cyan-500/10" />
                            </div>
                        )}
                        <div className={`mb-6 p-5 rounded-2xl ${selectedType === 'functional' ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}>
                            <Layers className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">{t('resumeBuilder.typeSelection.functional', 'Functional')}</h2>
                        <p className="text-center text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                            {t('resumeBuilder.typeSelection.functionalDesc', 'Skill-based focus. Ideal for career changers or those with gaps, bridging past achievements to new domains by grouping related capabilities.')}
                        </p>
                    </button>
                </div>

                {/* Continue Action */}
                <div className="mt-12 text-center">
                    <button
                        disabled={!selectedType}
                        onClick={handleContinue}
                        className={`inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${selectedType
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 hover:-translate-y-1'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                            }`}
                    >
                        {t('resumeBuilder.typeSelection.generateResume', 'Generate Resume')} <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Language Selection Modal */}
            <SelectResumeLanguage
                open={showLanguageModal}
                onClose={handleLanguageClose}
                onConfirm={handleLanguageConfirm}
                detectedLanguage={detectedLanguage}
                isTranslating={isTranslating}
            />

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
                                {t('resumeBuilder.typeSelection.videoNotSupported', 'Your browser does not support the video tag.')}
                            </video>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}