import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Briefcase, CheckSquare, FileText, Search } from 'lucide-react'
import LearnMoreLink from '../../components/common/LearnMoreLink'
import { supabase } from '../../lib/supabase'
import JobApplicationTracker from '../../components/fast-track/JobApplicationTracker'
import ResumeTailoringChecklist from '../../components/fast-track/ResumeTailoringChecklist'
import ResumeTracking from '../../pages/resume-builder/ResumeTracking'
import { BackButton } from '../../components/common/BackButton'

export default function OnlineJobApplications() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const isStandalone = searchParams.get('mode') === 'standalone'
    const tabParam = searchParams.get('tab') as 'tracker' | 'checklist' | 'resumes' | null
    const [activeTab, setActiveTab] = useState<'tracker' | 'checklist' | 'resumes'>(tabParam || 'tracker')
    // Google Jobs State
    const [jobTitle, setJobTitle] = useState('')
    const [location, setLocation] = useState('')

    const [stats, setStats] = useState({
        total: 0,
        withReferral: 0,
        followUps: 0,
        interviews: 0
    })

    useEffect(() => {
        loadStats()
    }, [])

    const loadStats = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Get total applications
            const { count: total } = await supabase
                .from('job_applications')
                .select('id', { count: 'exact' })
                .eq('user_id', user.id)

            // Get applications with referral
            const { count: withReferral } = await supabase
                .from('job_applications')
                .select('id', { count: 'exact' })
                .eq('user_id', user.id)
                .eq('referral_made', true)

            // Get pending follow-ups
            const today = new Date().toISOString().split('T')[0]
            const { count: followUps } = await supabase
                .from('job_applications')
                .select('id', { count: 'exact' })
                .eq('user_id', user.id)
                .lte('auto_follow_up_date', today)
                .eq('application_status', 'applied')

            // Get interviews
            const { count: interviews } = await supabase
                .from('job_applications')
                .select('id', { count: 'exact' })
                .eq('user_id', user.id)
                .eq('application_status', 'interviewing')

            setStats({
                total: total || 0,
                withReferral: withReferral || 0,
                followUps: followUps || 0,
                interviews: interviews || 0
            })
        } catch (error) {
            console.error('Error loading stats:', error)
        }
    }

    const handleGoogleSearch = () => {
        if (!jobTitle) return
        // Construct Google Jobs URL: https://www.google.com/search?q=Product+Manager+jobs+near+San+Francisco&ibp=htl;jobs
        const query = `${jobTitle} jobs ${location ? 'near ' + location : ''}`.trim().replace(/\s+/g, '+')
        const url = `https://www.google.com/search?q=${query}&ibp=htl;jobs`
        window.open(url, '_blank')
    }

    const referralRate = stats.total > 0 ? Math.round((stats.withReferral / stats.total) * 100) : 0

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white dark:from-gray-900 dark:to-gray-800 pb-20 transition-colors duration-200">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <BackButton to="/dashboard/job-search-hub" label="Back to Job Search" className="mb-2 pl-0" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Online Job Applications</h1>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Step 2: Track applications & leverage referrals</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
                                ▶ Watch video
                            </button>
                            <LearnMoreLink
                                label="Application best practices"
                                description="Referrals increase your callbacks by 400%"
                                onClick={() => {}}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Google Jobs Smart Search Widget */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-blue-100 dark:border-blue-900/30 p-6 flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" className="w-5 h-5" />
                            Smart Job Search
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Generate an optimized Google Jobs search link to find the latest postings across all platforms (LinkedIn, Glassdoor, ZipRecruiter, etc.).
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <input
                            type="text"
                            placeholder="Job Title (e.g. Product Manager)"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-64"
                        />
                        <input
                            type="text"
                            placeholder="Location (Optional)"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-48"
                        />
                        <button
                            onClick={handleGoogleSearch}
                            disabled={!jobTitle}
                            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
                        >
                            <Search className="w-4 h-4" /> Search Jobs
                        </button>
                    </div>
                </div>

                {/* Action Row: JD Analyzer */}
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-xl p-6 flex items-center justify-between gap-4">
                    <div>
                        <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-1 flex items-center gap-2">
                            <FileText className="w-5 h-5" /> ATS Analyzer
                        </h3>
                        <p className="text-amber-800 dark:text-amber-200/80 text-xs">
                            Compare resume vs. job description before applying.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard/resume-builder/jd-analyzer')}
                        className="px-4 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 font-medium whitespace-nowrap shadow-sm"
                    >
                        Launch Analyzer
                    </button>
                </div>

                {/* Stats Banner */}
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-bold">Application Tunnel</h2>
                            <p className="text-gray-400 text-sm">Target: 30% Referral Rate</p>
                        </div>
                        <div className="mt-4 md:mt-0 px-4 py-1 bg-white/10 rounded-full text-xs font-mono">
                            Last Updated: Today
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                            <div className="text-2xl font-bold mb-1">{stats.total}</div>
                            <div className="text-xs text-gray-400">Applications</div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 border border-white/10 relative overflow-hidden">
                            {referralRate >= 30 && <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full m-2"></div>}
                            <div className="text-2xl font-bold mb-1">{referralRate}%</div>
                            <div className="text-xs text-gray-400">Referral Rate</div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                            <div className="text-2xl font-bold mb-1 text-yellow-400">{stats.followUps}</div>
                            <div className="text-xs text-gray-400">Follow-ups Due</div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                            <div className="text-2xl font-bold mb-1 text-green-400">{stats.interviews}</div>
                            <div className="text-xs text-gray-400">Interviews</div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="grid grid-cols-3 divide-x divide-gray-200 dark:divide-gray-700">
                        <button
                            onClick={() => setActiveTab('tracker')}
                            className={`relative p-4 md:p-6 text-center md:text-left transition-all group ${activeTab === 'tracker'
                                ? 'bg-primary-50 dark:bg-primary-900/20 border-b-2 border-primary-600'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                        >
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3 mb-1">
                                <Briefcase className={`w-5 h-5 ${activeTab === 'tracker' ? 'text-primary-600' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                                <span className={`font-semibold ${activeTab === 'tracker' ? 'text-primary-900 dark:text-primary-400' : 'text-gray-900 dark:text-gray-300'}`}>Tracker</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 hidden md:block pl-8">Active applications status</p>
                        </button>

                        <button
                            onClick={() => setActiveTab('resumes')}
                            className={`relative p-4 md:p-6 text-center md:text-left transition-all group ${activeTab === 'resumes'
                                ? 'bg-primary-50 dark:bg-primary-900/20 border-b-2 border-primary-600'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                        >
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3 mb-1">
                                <FileText className={`w-5 h-5 ${activeTab === 'resumes' ? 'text-primary-600' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                                <span className={`font-semibold ${activeTab === 'resumes' ? 'text-primary-900 dark:text-primary-400' : 'text-gray-900 dark:text-gray-300'}`}>My Resumes</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 hidden md:block pl-8">History & Tailored Versions</p>
                        </button>

                        <button
                            onClick={() => setActiveTab('checklist')}
                            className={`relative p-4 md:p-6 text-center md:text-left transition-all group ${activeTab === 'checklist'
                                ? 'bg-primary-50 dark:bg-primary-900/20 border-b-2 border-primary-600'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                        >
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3 mb-1">
                                <CheckSquare className={`w-5 h-5 ${activeTab === 'checklist' ? 'text-primary-600' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                                <span className={`font-semibold ${activeTab === 'checklist' ? 'text-primary-900 dark:text-primary-400' : 'text-gray-900 dark:text-gray-300'}`}>Checklist</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 hidden md:block pl-8">Quality assurance</p>
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-[500px]">
                    {activeTab === 'tracker' && (
                        <div className="p-4 md:p-8">
                            <JobApplicationTracker />
                        </div>
                    )}

                    {activeTab === 'resumes' && (
                        <div className="p-0">
                            {/* Embed ResumeTracking with embedded prop to hide header */}
                            <ResumeTracking embedded={true} />
                        </div>
                    )}

                    {activeTab === 'checklist' && (
                        <div className="p-4 md:p-8">
                            <ResumeTailoringChecklist />
                        </div>
                    )}
                </div>
            </div>


        </div>
    )
}
