import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Briefcase, CheckSquare, AlertCircle, FileText, Search, MessageSquare, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import JobApplicationTracker from '../../components/fast-track/JobApplicationTracker'
import ResumeTailoringChecklist from '../../components/fast-track/ResumeTailoringChecklist'
import ResumeTracking from '../../pages/resume-builder/ResumeTracking'
import { BackButton } from '../../components/common/BackButton'

export default function OnlineJobApplications() {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState<'tracker' | 'checklist' | 'resumes'>('tracker')
    const [showReferralModal, setShowReferralModal] = useState(false)

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
                            <BackButton to="/job-search-hub" label="Back to Job Search" className="mb-2 pl-0" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Online Job Applications</h1>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Step 2: Track applications & leverage referrals</p>
                            </div>
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

                {/* Action Row: JD Analyzer & Referral Guide */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* JD Analyzer Integration */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-xl p-6 flex items-center justify-between gap-4">
                        <div>
                            <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-1 flex items-center gap-2">
                                <FileText className="w-5 h-5" /> Check ATS Score
                            </h3>
                            <p className="text-amber-800 dark:text-amber-200/80 text-xs">
                                Compare resume vs. job description before applying.
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/resume/jd-analyzer')}
                            className="px-4 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 font-medium whitespace-nowrap shadow-sm"
                        >
                            Launch Analyzer
                        </button>
                    </div>

                    {/* Referral Guide Access */}
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-900/40 rounded-xl p-6 flex items-center justify-between gap-4">
                        <div>
                            <h3 className="font-bold text-indigo-900 dark:text-indigo-100 mb-1 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5" /> Referral Guide
                            </h3>
                            <p className="text-indigo-800 dark:text-indigo-200/80 text-xs">
                                Step-by-step scripts to get referred by employees.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowReferralModal(true)}
                            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 font-medium whitespace-nowrap shadow-sm"
                        >
                            Open Guide
                        </button>
                    </div>
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

            {/* Referral Guide Modal */}
            {showReferralModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <MessageSquare className="w-6 h-6 text-indigo-600" />
                                Referral Scripts & Guide
                            </h2>
                            <button onClick={() => setShowReferralModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-8 space-y-8">

                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">1</div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 mb-1">Identify the right person</h3>
                                        <p className="text-gray-600 text-sm">Don't ask the CEO. Look for peers (future teammates) or managers on LinkedIn. Use the "People" tab on the Company page.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">2</div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 mb-1">Connect with a personalized note</h3>
                                        <p className="text-gray-600 text-sm">Never send a blank connection request. Mention a shared interest, school, or genuine curiosity about their work.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                                <h4 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">Copy & Paste Templates</h4>

                                <div className="space-y-6">
                                    <div>
                                        <p className="text-xs font-bold text-indigo-600 mb-2">OPTION A: The "Curious Peer" Approach (Best for 2nd connections)</p>
                                        <div className="bg-white p-4 rounded-lg border border-gray-200 text-gray-700 text-sm font-mono leading-relaxed">
                                            "Hi [Name], I'm a [Current Role] and saw you're working on [Project/Team] at [Company]. I've been following [Company]'s work in [Area] and would love to hear your perspective on the team culture. Open to a 10-min virtual coffee? No expectations!"
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs font-bold text-indigo-600 mb-2">OPTION B: The "Direct Application" Approach</p>
                                        <div className="bg-white p-4 rounded-lg border border-gray-200 text-gray-700 text-sm font-mono leading-relaxed">
                                            "Hi [Name], I just applied for the [Role] position at [Company]. I noticed we both [Shared Connection/Interest]. I'd love to ask one quick question about your experience with the team to see if I'd be a good cultural fit. Thanks!"
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-indigo-50 p-4 rounded-lg flex gap-3">
                                <AlertCircle className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                                <p className="text-indigo-800 text-sm">
                                    <strong>Pro Tip:</strong> Only ask for the referral AFTER you've established rapport or if they offer. "Do you think my background aligns with what the team needs?" is a soft way to prompt them.
                                </p>
                            </div>

                        </div>
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
                            <button
                                onClick={() => setShowReferralModal(false)}
                                className="px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-black transition-colors"
                            >
                                Got it, I'm ready
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}
