import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Briefcase, CheckSquare, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import JobApplicationTracker from '../../components/fast-track/JobApplicationTracker'
import ResumeTailoringChecklist from '../../components/fast-track/ResumeTailoringChecklist'

export default function ApplySmartOnline() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'tracker' | 'checklist'>('tracker')
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

  const referralRate = stats.total > 0 ? Math.round((stats.withReferral / stats.total) * 100) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Apply Smart Online</h1>
                <p className="text-sm text-gray-600">Step 2: Track applications & leverage referrals</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Methodology Info Banner */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 mb-8 text-white">
          <h2 className="text-2xl font-bold mb-2">The Referral Advantage</h2>
          <p className="text-primary-100 mb-4">
            Applications WITH a referral have an 80% callback rate vs 1-2% without. This is THE game-changer.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold mb-1">{stats.total}</div>
              <div className="text-sm text-primary-100">Total Applications</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold mb-1">{referralRate}%</div>
              <div className="text-sm text-primary-100">With Referral</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold mb-1">{stats.followUps}</div>
              <div className="text-sm text-primary-100">Follow-ups Due</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold mb-1">{stats.interviews}</div>
              <div className="text-sm text-primary-100">Interviews</div>
            </div>
          </div>
        </div>

        {/* Pending Follow-ups Alert */}
        {stats.followUps > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-1">
                {stats.followUps} {stats.followUps === 1 ? 'application needs' : 'applications need'} follow-up!
              </h3>
              <p className="text-sm text-yellow-800">
                Following up after 7 days increases your response rate by 30%. Check the Job Tracker tab.
              </p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="grid grid-cols-2 divide-x divide-gray-200">
            <button
              onClick={() => setActiveTab('tracker')}
              className={`relative p-6 text-left transition-all ${
                activeTab === 'tracker'
                  ? 'bg-primary-50 border-b-2 border-primary-600'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <Briefcase
                  className={`w-6 h-6 ${
                    activeTab === 'tracker' ? 'text-primary-600' : 'text-gray-400'
                  }`}
                />
              </div>
              <h3
                className={`font-semibold mb-1 ${
                  activeTab === 'tracker' ? 'text-primary-900' : 'text-gray-900'
                }`}
              >
                Job Application Tracker
              </h3>
              <p className="text-sm text-gray-500">Track applications, referrals & follow-ups</p>
            </button>

            <button
              onClick={() => setActiveTab('checklist')}
              className={`relative p-6 text-left transition-all ${
                activeTab === 'checklist'
                  ? 'bg-primary-50 border-b-2 border-primary-600'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <CheckSquare
                  className={`w-6 h-6 ${
                    activeTab === 'checklist' ? 'text-primary-600' : 'text-gray-400'
                  }`}
                />
              </div>
              <h3
                className={`font-semibold mb-1 ${
                  activeTab === 'checklist' ? 'text-primary-900' : 'text-gray-900'
                }`}
              >
                Resume Tailoring Checklist
              </h3>
              <p className="text-sm text-gray-500">Ensure each resume is optimized</p>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {activeTab === 'tracker' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Job Application Tracker
              </h2>
              <p className="text-gray-600 mb-6">
                Track every application with referral status and automatic follow-up reminders.
              </p>
              <JobApplicationTracker />
            </div>
          )}

          {activeTab === 'checklist' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Resume Tailoring Checklist
              </h2>
              <p className="text-gray-600 mb-6">
                Use this checklist before submitting each application to ensure maximum impact.
              </p>
              <ResumeTailoringChecklist />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
