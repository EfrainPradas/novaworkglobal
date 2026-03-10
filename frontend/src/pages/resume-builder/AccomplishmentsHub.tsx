import React, { useState, useEffect } from 'react'
import { ArrowLeft, ArrowRight, Trophy, Star, BookOpen } from 'lucide-react'
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
                    <button
                        onClick={() => navigate('/resume-builder')}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" /> {t('common.backToResumeBuilder', 'Back to Resume Builder')}
                    </button>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate('/resume/accomplishment-bank-learn-more')}
                            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                            <BookOpen className="w-4 h-4" /> Learn More
                        </button>

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

                {/* Tabs Header */}
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
        </div>
    )
}
