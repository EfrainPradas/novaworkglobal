
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BackButton } from '../../components/common/BackButton'
import { getVideoUrl } from '@/config/videoUrls'
import VisualGuide from '../../components/common/VisualGuide'
import LearnMoreLink from '../../components/common/LearnMoreLink'
import { Target, ArrowRight, Users, LayoutDashboard, Compass, Network, HelpCircle, Brain, Globe, X, Play } from 'lucide-react'
import AIJobSearch from '../../components/job-search/AIJobSearch'

export default function JobSearchHub() {
    const navigate = useNavigate()
    const { t } = useTranslation()
    const [showGuide, setShowGuide] = useState(false)
    const [showVideoModal, setShowVideoModal] = useState(false)

    /*
    useEffect(() => {
        // Auto-show guide if not seen before
        const seen = localStorage.getItem('guide_seen_job-search-hub-tour')
        if (!seen) {
            // Small delay for better UX
            setTimeout(() => setShowGuide(true), 1000)
        }
    }, [])
    */

    const tools = [
        {
            id: 'ai-job-search',
            title: t('jobSearch.hub.aiMatchingTitle', 'AI Job Search'),
            description: t('jobSearch.hub.aiMatchingDesc', 'Find personalized job matches based on your skills, career vision, and preferences using Google Jobs.'),
            icon: Brain,
            route: '/dashboard/job-search/ai-recommendations',
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200',
            badge: t('jobSearch.hub.aiPowered', 'AI Powered'),
            className: 'md:col-span-full'
        },
        {
            id: 'plan-search',
            title: t('jobSearch.hub.step1Title', 'Step 1: Plan Your Search'),
            description: t('jobSearch.hub.step1Desc', 'Define your target market (Companies, Industries, Roles) and strategy. Start here for focus.'),
            icon: Compass,
            route: '/dashboard/job-search/plan-your-search',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            badge: t('jobSearch.hub.startHere', 'Start Here'),
            className: ''
        },
        {
            id: 'application-tracker',
            title: t('jobSearch.hub.step2Title', 'Step 2: Online Job Applications'),
            description: t('jobSearch.hub.step2Desc', 'Track applications, leverage referrals, and analyze JDs in one place.'),
            icon: LayoutDashboard,
            route: '/dashboard/job-search/online-applications',
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200',
            badge: t('jobSearch.hub.dailyTool', 'Daily Tool'),
            className: ''
        },
        {
            id: 'headhunters',
            title: t('jobSearch.hub.step3Title', 'Step 3: Headhunters & Firms'),
            description: t('jobSearch.hub.step3Desc', 'Target recruiters with smart filters and access top firm rankings.'),
            icon: Users,
            route: '/dashboard/job-search/headhunters',
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            borderColor: 'border-orange-200',
            badge: null,
            className: ''
        },
        {
            id: 'networking',
            title: t('jobSearch.hub.step4Title', 'Step 4: Networking Strategy'),
            description: t('jobSearch.hub.step4Desc', 'Access the hidden job market with the 60-Day Plan and 90-Sec Story.'),
            icon: Network,
            route: '/dashboard/job-search/networking',
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200',
            badge: null,
            className: ''
        },
        {
            id: 'online-presence',
            title: t('jobSearch.hub.step5Title', 'Step 5: Your online presence'),
            description: t('jobSearch.hub.step5Desc', 'Optimize your LinkedIn profile and personal brand to attract recruiters.'),
            icon: Globe,
            route: '/dashboard/job-search/social-positioning',
            color: 'text-cyan-600',
            bgColor: 'bg-cyan-50',
            borderColor: 'border-cyan-200',
            badge: null,
            className: ''
        }
    ]


    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 pb-10 transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div>
                        <BackButton to="/dashboard" label="Back to Dashboard" className="mb-2 pl-0" />
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-3">
                            <span className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg">
                                <Target className="w-8 h-8" />
                            </span>
                            {t('jobSearch.hub.title', 'Job Search & Application Suite')}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300 max-w-2xl text-base">
                            {t('jobSearch.hub.subtitle', 'Your dashboard for landing the job. Plan, track, analyze, and prepare.')}
                        </p>
                        <div
                            onClick={() => navigate('/dashboard/job-search/learn-more')}
                            className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-medium cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                        >
                            <span className="font-bold">{t('jobSearch.hub.strategicFramework', 'Understand the Strategic Framework:')}</span>
                            <span>{t('jobSearch.hub.frameworkStat', 'Success, getting called 75% faster than most')}</span>
                            <ArrowRight className="w-4 h-4 ml-1" />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowVideoModal(true)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
                        >
                            <Play fill="currentColor" className="w-4 h-4" /> {t('common.watchVideo', 'Watch video')}
                        </button>
                    </div>
                </div>

                {/* AI Job Search & Tools Section */}
                <div id="ai-search-engine" className="scroll-mt-6">
                    <AIJobSearch>
                        {/* Tools Grid - Now injected between search and results */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {tools.slice(1).map((tool) => { // Skip the first tool (AI Job Search) since it's the wrapper
                                const Icon = tool.icon
                                return (
                                    <div
                                        key={tool.id}
                                        onClick={() => navigate(tool.route)}
                                        className={`group relative p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-indigo-100 dark:hover:border-indigo-900 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col ${tool.className || ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className={`p-3 rounded-lg ${tool.bgColor} dark:bg-gray-700 ${tool.color} dark:text-white group-hover:scale-110 transition-transform duration-300`}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            {tool.badge && (
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${tool.bgColor} dark:bg-gray-700 ${tool.color} dark:text-white`}>
                                                    {tool.badge}
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                            {tool.title}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 flex-grow leading-relaxed">
                                            {tool.description}
                                        </p>

                                        <div className="flex items-center text-indigo-600 dark:text-indigo-400 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                                            {t('jobSearch.hub.openTool', 'Open Tool')} <ArrowRight className="w-4 h-4 ml-2" />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </AIJobSearch>
                </div>

            </div>

            {/* Visual Guide Overlay */}
            <VisualGuide
                guideId="job-search-hub-tour"
                isVisible={showGuide}
                onClose={() => setShowGuide(false)}
                steps={[
                    {
                        title: 'Welcome to Job Search Dashboard',
                        content: 'This is your central hub for managing your entire job search process. We have broken it down into 4 strategic pillars.',
                        position: 'center'
                    },
                    {
                        title: 'AI Job Search Engine',
                        content: 'We have integrated our powerful AI Search engine directly here. Use it to find jobs that match your profile perfectly.',
                        target: 'ai-search-engine',
                        position: 'bottom'
                    },
                    {
                        title: '1. Plan Your Strategy',
                        content: 'Start here! Define your target roles and companies. A focused search is 10x more effective than "spraying and praying".',
                        target: 'Plan Your Search' // Note: This might need adjustment if ID logic changes for VisualGuide
                    },
                    {
                        title: '2. Track Applications',
                        content: 'Use the "Online Job Applications" tool to track every submission. It includes a Resume Tailoring Checklist and Referral Guide.',
                        target: 'Online Job Applications'
                    },
                    {
                        title: '3. Leverage Headhunters',
                        content: 'Don\'t just rely on job boards. Use this tool to find and connect with top recruiters in your industry.',
                        target: 'Headhunters & Firms'
                    },
                    {
                        title: '4. Networking & Methodology',
                        content: 'Access the hidden job market with our networking scripts and the "Fast-Track" methodology video.',
                        target: 'Networking Strategy'
                    }
                ]}
            />

            {/* Video Modal - Unified Frame */}
            {showVideoModal && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
                    onClick={() => setShowVideoModal(false)}
                >
                    {/* Dark Overlay */}
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>

                    {/* Modal Content */}
                    <div
                        className="relative w-full max-w-5xl bg-black rounded-2xl overflow-hidden shadow-2xl z-10 animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={() => setShowVideoModal(false)}
                            className="absolute top-4 right-4 z-20 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors"
                            aria-label="Close video"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {/* Video Player */}
                        <div className="w-full aspect-video bg-black flex items-center justify-center relative">
                            <video
                                src={getVideoUrl('The_Job_Search_&_Application_Suite.mp4')}
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
