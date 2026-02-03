import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Target, Search, Building2, CheckCircle2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import TargetCompanyCriteria from '../../components/fast-track/TargetCompanyCriteria'
import IndustryResearch from '../../components/fast-track/IndustryResearch'
import CompanyShortlist from '../../components/fast-track/CompanyShortlist'

export default function PlanYourSearch() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'criteria' | 'research' | 'shortlist'>('criteria')

  // Progress tracking
  const [hasCriteria, setHasCriteria] = useState(false)
  const [hasResearch, setHasResearch] = useState(false)
  const [hasShortlist, setHasShortlist] = useState(false)

  useEffect(() => {
    checkProgress()
  }, [])

  const checkProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check if user has target criteria
      const { data: criteria } = await supabase
        .from('target_company_criteria')
        .select('id')
        .eq('user_id', user.id)
        .single()

      setHasCriteria(!!criteria)

      // Check if user has industry research (at least 1)
      const { data: research, count } = await supabase
        .from('industry_research')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)

      setHasResearch((count || 0) > 0)

      // Check if user has company shortlist (at least 10)
      const { count: companyCount } = await supabase
        .from('company_shortlist')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)

      setHasShortlist((companyCount || 0) >= 10)
    } catch (error) {
      console.error('Error checking progress:', error)
    }
  }

  const tabs = [
    {
      id: 'criteria' as const,
      name: 'Target Criteria',
      icon: Target,
      description: 'Define your ideal company',
      completed: hasCriteria
    },
    {
      id: 'research' as const,
      name: 'Industry Research',
      icon: Search,
      description: 'Research 2-3 industries',
      completed: hasResearch
    },
    {
      id: 'shortlist' as const,
      name: 'Company Shortlist',
      icon: Building2,
      description: '10-15 target companies',
      completed: hasShortlist
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 transition-colors duration-200">
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Plan Your Search</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Step 1: Define your target market</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 dark:text-gray-400">Progress:</span>
              <span className="font-semibold text-primary-600 dark:text-primary-400">
                {[hasCriteria, hasResearch, hasShortlist].filter(Boolean).length}/3 Complete
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Methodology Info Banner */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 mb-8 text-white">
          <h2 className="text-2xl font-bold mb-2">Why Plan Your Search?</h2>
          <p className="text-primary-100 mb-4">
            Job seekers who target specific companies are 3x more likely to get interviews than those who apply randomly.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold mb-1">10-15</div>
              <div className="text-sm text-primary-100">Target companies</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold mb-1">2-3</div>
              <div className="text-sm text-primary-100">Industries to focus on</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold mb-1">3x</div>
              <div className="text-sm text-primary-100">Better interview rate</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6 transition-colors duration-200">
          <div className="grid grid-cols-3 divide-x divide-gray-200 dark:divide-gray-700">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative p-6 text-left transition-all ${activeTab === tab.id
                      ? 'bg-primary-50 dark:bg-primary-900/30 border-b-2 border-primary-600 dark:border-primary-400'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <Icon
                      className={`w-6 h-6 ${activeTab === tab.id ? 'text-primary-600' : 'text-gray-400'
                        }`}
                    />
                    {tab.completed && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  <h3
                    className={`font-semibold mb-1 ${activeTab === tab.id ? 'text-primary-900 dark:text-primary-300' : 'text-gray-900 dark:text-white'
                      }`}
                  >
                    {tab.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{tab.description}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 transition-colors duration-200">
          {activeTab === 'criteria' && (
            <TargetCompanyCriteria onComplete={checkProgress} />
          )}

          {activeTab === 'research' && (
            <IndustryResearch onComplete={checkProgress} />
          )}

          {activeTab === 'shortlist' && (
            <CompanyShortlist onComplete={checkProgress} />
          )}
        </div>
      </div>
    </div>
  )
}
