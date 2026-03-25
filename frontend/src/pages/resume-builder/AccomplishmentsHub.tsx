import React, { useState, useEffect } from 'react'
import { ArrowLeft, ArrowRight, Trophy, Star, BookOpen, Play } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { trackEvent } from '../../lib/analytics'

import AccomplishmentLibrary from './AccomplishmentLibrary'
import StoryCardsManager from './StoryCardsManager'
import SavedAccomplishmentGroups from './SavedAccomplishmentGroups'

type TabType = 'bank' | 'cars' | 'groups'

export default function AccomplishmentsHub() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    // We can also let the url dictate the active tab, defaulting to 'bank'
    const initialTab = (searchParams.get('tab') as TabType) || 'bank'
    const [activeTab, setActiveTab] = useState<TabType>(initialTab)
    const isStandalone = searchParams.get('mode') === 'standalone'
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)

    useEffect(() => {
        // Update URL when tab changes without full reload to preserve state
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.set('tab', activeTab)
        window.history.replaceState({}, '', newUrl)
    }, [activeTab])

    const handleContinue = async () => {
        await trackEvent('analytics', 'step_completed', { step_name: 'accomplishments-hub', next_step: 'questionnaire' })
        navigate('/resume/questionnaire')
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-900 font-sans flex flex-col">
            <div className="max-w-[1440px] px-4 pt-8 md:px-8 mx-auto w-full z-10 sticky top-0 bg-[#F8FAFC]/95 dark:bg-gray-900/95 backdrop-blur-sm pb-4 border-b border-gray-200/50 dark:border-gray-800">
                {/* Global Navigation Header - Same for both to not jump around */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate(isStandalone ? '/dashboard' : '/resume-builder')}
                            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors text-sm font-medium"
                        >
                            <ArrowLeft className="w-4 h-4" /> {isStandalone ? 'Back to Dashboard' : t('common.backToResumeBuilder', 'Back to Resume Builder')}
                        </button>
                    </div>

                    <div className="flex items-center gap-2">

                        {!isStandalone && (
                            <button
                                onClick={handleContinue}
                                className="flex items-center gap-2 px-5 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl shadow-md transition-all font-bold text-sm"
                            >
                                {t('resumeBuilder.menu.nextQuestionnaire', 'Next: Professional Profile')}
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 p-1.5 bg-gray-200/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-2xl max-w-fit">
                        <button
                            onClick={() => setActiveTab('bank')}
                            className={`flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl text-sm font-semibold transition-all ${activeTab === 'bank'
                                ? 'bg-white dark:bg-gray-700 text-[#4F46E5] dark:text-indigo-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <Trophy className="w-4 h-4" />
                            {t('accomplishmentLibrary.title', 'Accomplishment Bank')}
                        </button>
                        <button
                            onClick={() => setActiveTab('cars')}
                            className={`flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl text-sm font-semibold transition-all ${activeTab === 'cars'
                                ? 'bg-white dark:bg-gray-700 text-[#4F46E5] dark:text-indigo-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <Star className="w-4 h-4" />
                            {t('resumeBuilder.menu.carStories', 'CARs')}
                        </button>
                        <button
                            onClick={() => setActiveTab('groups')}
                            className={`flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl text-sm font-semibold transition-all ${activeTab === 'groups'
                                ? 'bg-white dark:bg-gray-700 text-[#4F46E5] dark:text-indigo-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <BookOpen className="w-4 h-4" />
                            Saved Groups
                        </button>
                    </div>

                    <button
                        onClick={() => setIsVideoModalOpen(true)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl shadow-sm transition-all text-sm font-bold hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Play size={16} fill="currentColor" />
                        {t('common.watchVideo', 'Watch video')}
                    </button>
                </div>
            </div>

            {/* Content Rendering Area */}
            <div className="flex-1 w-full flex flex-col mt-4">
                {activeTab === 'bank' ? (
                    <AccomplishmentLibrary isNested={true} />
                ) : activeTab === 'groups' ? (
                    <SavedAccomplishmentGroups isNested={true} />
                ) : (
                    <StoryCardsManager isNested={true} />
                )}
            </div>
            {/* Video Modal */}
            {isVideoModalOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
                    onClick={() => setIsVideoModalOpen(false)}
                >
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
                    <div
                        className="relative w-full max-w-5xl bg-black rounded-2xl overflow-hidden shadow-2xl z-10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setIsVideoModalOpen(false)}
                            className="absolute top-4 right-4 z-20 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors"
                            aria-label="Close video"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <div className="w-full aspect-video bg-black flex items-center justify-center relative">
                            <video
                                src={encodeURI(`${import.meta.env.BASE_URL}videos/NovaWork_Accomplishment_Bank.mp4`)}
                                className="w-full h-full outline-none"
                                controls
                                controlsList="nodownload"
                                autoPlay
                                playsInline
                            >
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
