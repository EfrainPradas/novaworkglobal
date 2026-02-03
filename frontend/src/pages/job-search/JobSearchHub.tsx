
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BackButton } from '../../components/common/BackButton'
import VisualGuide from '../../components/common/VisualGuide'
import { Target, ArrowRight, Users, LayoutDashboard, Compass, Network, HelpCircle, Brain, Mail } from 'lucide-react'
import AIJobSearch from '../../components/job-search/AIJobSearch'

export default function JobSearchHub() {
    const navigate = useNavigate()
    const [showGuide, setShowGuide] = useState(false)

    useEffect(() => {
        // Auto-show guide if not seen before
        const seen = localStorage.getItem('guide_seen_job-search-hub-tour')
        if (!seen) {
            // Small delay for better UX
            setTimeout(() => setShowGuide(true), 1000)
        }
    }, [])

    const tools = [
        {
            id: 'ai-job-search',
            title: 'AI Job Search',
            description: 'Find personalized job matches based on your skills, career vision, and preferences using Google Jobs.',
            icon: Brain,
            route: '/fast-track/ai-recommendations',
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200',
            badge: 'AI Powered',
            className: 'md:col-span-full'
        },
        {
            id: 'cover-letter',
            title: 'Cover Letter Generator',
            description: 'Create tailored cover letters in seconds with AI. Customized for each job application.',
            icon: Mail,
            route: '/resume/cover-letter',
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            borderColor: 'border-orange-200',
            badge: 'New',
            className: ''
        },
        {
            id: 'plan-search',
            title: 'Plan Your Search',
            description: 'Define your target market (Companies, Industries, Roles) and strategy. Start here for focus.',
            icon: Compass,
            route: '/job-search/plan-your-search',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            badge: 'Start Here',
            className: ''
        },
        {
            id: 'application-tracker',
            title: 'Online Job Applications',
            description: 'Track applications, leverage referrals, and analyze JDs in one place.',
            icon: LayoutDashboard,
            route: '/job-search/online-applications',
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200',
            badge: 'Daily Tool',
            className: ''
        },
        {
            id: 'headhunters',
            title: 'Headhunters & Firms',
            description: 'Target recruiters with smart filters and access top firm rankings.',
            icon: Users,
            route: '/job-search/headhunters',
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            borderColor: 'border-orange-200',
            badge: null,
            className: ''
        },
        {
            id: 'networking',
            title: 'Networking Strategy',
            description: 'Access the hidden job market with the 60-Day Plan and 90-Sec Story.',
            icon: Network,
            route: '/job-search/networking',
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200',
            badge: null,
            className: ''
        }
    ]


    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 pb-20 transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div>
                        <BackButton to="/dashboard" label="Back to Dashboard" className="mb-4 pl-0" />
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                            <span className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg">
                                <Target className="w-8 h-8" />
                            </span>
                            Job Search & Application Suite
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300 max-w-2xl text-lg">
                            Your command center for landing the job. Plan, track, analyze, and prepare.
                        </p>
                    </div>
                </div>

                {/* AI Job Search Engine Section */}
                <div id="ai-search-engine" className="scroll-mt-6">
                    <AIJobSearch />
                </div>

                {/* Methodology Banner */}
                <div
                    onClick={() => navigate('/job-search/methodology')}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg cursor-pointer hover:shadow-xl transition-all hover:scale-[1.01] group relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Target className="w-40 h-40" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div>
                            <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-bold mb-3">FIRST TIME HERE?</div>
                            <h2 className="text-2xl font-bold mb-2">Understand the Fast-Track System</h2>
                            <p className="text-indigo-100 max-w-xl">
                                Discover the 4-step strategic approach to turning your job search into a targeted personal marketing campaign.
                            </p>
                        </div>
                        <div className="flex-shrink-0 bg-white text-indigo-600 px-6 py-3 rounded-lg font-bold flex items-center group-hover:bg-indigo-50 transition-colors">
                            Learn the Process <ArrowRight className="ml-2 w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* Tools Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {tools.slice(1).map((tool) => { // Skip the first tool (AI Job Search) since it's now embedded above
                        const Icon = tool.icon
                        return (
                            <div
                                key={tool.id}
                                onClick={() => navigate(tool.route)}
                                className={`group relative p-8 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-indigo-100 dark:hover:border-indigo-900 hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col ${tool.className || ''}`}
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`p-4 rounded-xl ${tool.bgColor} dark:bg-gray-700 ${tool.color} dark:text-white group-hover:scale-110 transition-transform duration-300`}>
                                        <Icon className="w-8 h-8" />
                                    </div>
                                    {tool.badge && (
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${tool.bgColor} dark:bg-gray-700 ${tool.color} dark:text-white`}>
                                            {tool.badge}
                                        </span>
                                    )}
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    {tool.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-8 flex-grow leading-relaxed">
                                    {tool.description}
                                </p>

                                <div className="flex items-center text-indigo-600 dark:text-indigo-400 font-semibold group-hover:translate-x-2 transition-transform">
                                    Open Tool <ArrowRight className="w-4 h-4 ml-2" />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Visual Guide Overlay */}
            <VisualGuide
                guideId="job-search-hub-tour"
                isVisible={showGuide}
                onClose={() => setShowGuide(false)}
                steps={[
                    {
                        title: 'Welcome to Job Search Command Center',
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
        </div>
    )
}
