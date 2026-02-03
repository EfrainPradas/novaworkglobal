import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import UserMenu from '../common/UserMenu'
import VideoLink from '../common/VideoLink'
import {
  Briefcase,
  FileText,
  Search,
  Users,
  Star,
  Crown,
  Lock,
  ArrowRight,
  User,
  ChevronDown,
  ChevronUp,
  Play,
  BarChart3,
  Target,
  GraduationCap
} from 'lucide-react'

interface MenuItem {
  id: string
  title: string
  description: string
  icon: React.ElementType
  color: string
  badge?: string
  requiredLevel: 'basic' | 'pro' | 'executive'
  route: string
  steps: string[]
}

export default function MainMenu() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set()) // Nothing expanded by default
  const navigate = useNavigate()

  // Default to Basic level until loaded
  const [userLevel, setUserLevel] = useState<'basic' | 'pro' | 'executive'>('basic')

  const toggleCard = (cardId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(cardId)) {
        newSet.delete(cardId)
      } else {
        newSet.add(cardId)
      }
      return newSet
    })
  }

  const menuItems: MenuItem[] = [
    {
      id: 'career-direction',
      title: 'Career Direction',
      description: 'Discover your ideal career path through AI-powered assessment and planning',
      icon: Star,
      color: 'from-blue-600 to-indigo-600',
      requiredLevel: 'executive',
      route: '/career-vision',
      steps: [
        'Career Vision Discovery',
        'Skills & Values Analysis',
        'Job Preferences',
        'Action Plan'
      ]
    },
    {
      id: 'resume',
      title: 'Resume Builder',
      description: 'Create a powerful resume that gets noticed by recruiters and ATS systems',
      icon: FileText,
      color: 'from-blue-500 to-cyan-500',
      requiredLevel: 'basic',
      route: '/resume-builder',
      steps: [
        'Work Experience',
        'CAR Accomplishments',
        'Professional Profile',
        'Job Description Analyzer',
        'Download Resume',
        'Apply Jobs'
      ]
    },
    {
      id: 'job-search',
      title: 'Job Search & Positioning',
      description: 'Strategic job search with smart tracking, networking, and application management',
      icon: Search,
      color: 'from-emerald-600 to-teal-600',
      requiredLevel: 'pro',
      route: '/job-search/plan-your-search',
      steps: [
        'Plan Your Search',
        'Social Media Positioning',
        'Job Application Tracker',
        'Apply Smart',
        'Network Tracking'
      ]
    },
    {
      id: 'interview',
      title: 'Interview Mastery',
      description: 'Complete interview preparation system with practice and strategy tools',
      icon: Users,
      color: 'from-slate-700 to-slate-900',
      requiredLevel: 'executive',
      route: '/interview',
      steps: [
        'Interview Type Guide',
        'Company Research',
        'JD Comparison',
        'Practice Sessions',
        'Question Bank'
      ]
    }
  ]

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('[data-dropdown]')) {
        setExpandedCards(new Set())
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        console.log('👤 Checking access for user:', user.id)
        // Load user data including subscription_tier
        const { data: userData, error } = await supabase
          .from('users')
          .select('subscription_tier')
          .eq('id', user.id)
          .single()

        console.log('📊 Subscription Data:', userData)
        if (error) console.error('❌ Error fetching subscription:', error)

        // Map DB subscription_tier to UI userLevel
        // DB: basic, pro, executive
        // UI: basic, pro, executive
        if (userData?.subscription_tier) {
          const tier = userData.subscription_tier
          console.log('🏷️ Resolved Tier:', tier)

          if (tier === 'executive') setUserLevel('executive')
          else if (tier === 'pro') setUserLevel('pro')
          else setUserLevel('basic')
        } else {
          console.log('⚠️ No specific tier found, defaulting to basic')
          setUserLevel('basic')
        }

        // Load user profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        setUserProfile(profile)
      }
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setLoading(false)
    }
  }

  const canAccess = (requiredLevel: string) => {
    const levels = { basic: 1, pro: 2, executive: 3 }
    return levels[userLevel] >= levels[requiredLevel as keyof typeof levels]
  }

  const getVideoForSection = (sectionId: string) => {
    const videoMap = {
      'career-direction': (
        <VideoLink
          videoSrc="/videos/AI_&_Your_Career_Path-EN.mp4"
          title="🎥 Watch"
          description="Career Vision Guide"
          className="text-sm"
        />
      ),
      'resume': (
        <VideoLink
          videoSrc="/videos/BRE-EN.mp4"
          title="🎥 Watch"
          description="Build Resume & Execute"
          className="text-sm"
        />
      ),
      'job-search': (
        <VideoLink
          videoSrc="/videos/IMR-EN.mp4"
          title="🎥 Watch"
          description="Identify Market & Research"
          className="text-sm"
        />
      ),
      'interview': (
        <VideoLink
          videoSrc="/videos/Your_Interview_Playbook-EN.mp4"
          title="🎥 Watch"
          description="Interview Playbook"
          className="text-sm"
        />
      )
    }

    return videoMap[sectionId as keyof typeof videoMap] || null
  }

  const getAccessBadge = (requiredLevel: string) => {
    if (requiredLevel === 'basic') return null
    if (requiredLevel === 'pro') {
      return canAccess(requiredLevel) ? (
        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full flex items-center">
          <Star className="h-3 w-3 mr-1" />
          Pro
        </span>
      ) : (
        <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full flex items-center">
          <Lock className="h-3 w-3 mr-1" />
          Pro Required
        </span>
      )
    }
    if (requiredLevel === 'executive') {
      return canAccess(requiredLevel) ? (
        <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full flex items-center">
          <Crown className="h-3 w-3 mr-1" />
          Executive
        </span>
      ) : (
        <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full flex items-center">
          <Lock className="h-3 w-3 mr-1" />
          Executive Required
        </span>
      )
    }
  }


  const handleMenuClick = (item: MenuItem) => {
    if (!canAccess(item.requiredLevel)) {
      // Show upgrade modal
      alert(`This feature requires ${item.requiredLevel === 'pro' ? 'Pro' : 'Executive'} membership. Upgrade to unlock this feature!`)
      return
    }

    // For Executive users or those with access, navigate to the route
    navigate(item.route)
  }

  const handleQuickAccess = (route: string, requiredLevel: 'basic' | 'pro' | 'executive') => {
    if (!canAccess(requiredLevel)) {
      alert(`This feature requires ${requiredLevel === 'pro' ? 'Pro' : 'Executive'} membership. Upgrade to unlock this feature!`)
      return
    }
    navigate(route)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src="/logo.png" alt="NovaWork Global" className="h-20 w-auto" />
              <div className="hidden sm:block">
                {getAccessBadge('executive')}
              </div>
            </div>

            {user && (
              <UserMenu user={user} userProfile={userProfile} />
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to Your Career Command Center
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Choose your path and let AI accelerate your career journey.
            Select the module that matches your current goals.
          </p>
        </div>

        {/* Compact Menu Grid */}
        <div className="space-y-4 mb-12 relative">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isAccessible = canAccess(item.requiredLevel)
            const isExpanded = expandedCards.has(item.id)

            return (
              <div
                key={item.id}
                data-dropdown
                className={`
                  relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300
                  overflow-hidden border-2
                  ${isAccessible
                    ? 'border-transparent hover:border-blue-200 dark:hover:border-blue-600 cursor-pointer'
                    : 'border-gray-200 dark:border-gray-700 opacity-75 cursor-not-allowed'
                  }
                `}
                onClick={() => isAccessible && toggleCard(item.id)}
              >
                {/* Gradient Header */}
                <div className={`h-1 bg-gradient-to-r ${item.color}`}></div>

                {/* Compact Header */}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 bg-gradient-to-br ${item.color} rounded-lg`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{item.title}</h3>
                          {getAccessBadge(item.requiredLevel)}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{item.description}</p>
                      </div>
                    </div>
                    {isAccessible && (
                      <div className="flex items-center gap-2">
                        {item.id === 'resume' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate('/resume-builder/workflow')
                            }}
                            className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm rounded-lg hover:shadow-md transition-colors"
                          >
                            <Play className="h-3 w-3" />
                            Quick Start
                          </button>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Expanded Content - Simple Accordion Style */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                      {/* Header inside dropdown */}
                      <div className={`h-1 bg-gradient-to-r ${item.color} rounded-t-lg`}></div>
                      <div className="p-4 space-y-3">
                        {/* Steps - Compact */}
                        <div>
                          <div className="flex flex-wrap gap-2">
                            {item.steps.map((step, index) => (
                              <div key={index} className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                                <span className={`w-4 h-4 bg-gradient-to-r ${item.color} text-white rounded-full flex items-center justify-center text-[10px] font-bold mr-1`}>
                                  {index + 1}
                                </span>
                                {step}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Career Vision Formula - Only for Career Direction */}
                        {item.id === 'career-direction' && (
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            {/* Compact Venn Diagram with Formula on Right */}
                            <div className="flex items-center justify-center gap-3">
                              {/* Venn Diagram - Smaller and Touching */}
                              <div className="relative w-20 h-16">
                                {/* Skills Circle - Top-Left, moved right */}
                                <div className="absolute top-0 left-1 w-10 h-10 rounded-full bg-blue-300 bg-opacity-60 dark:bg-blue-700 dark:bg-opacity-40 border-2 border-blue-500 dark:border-blue-400 flex items-center justify-center">
                                  <span className="text-[8px] font-bold text-blue-900 dark:text-blue-100">
                                    Skills
                                  </span>
                                </div>

                                {/* Values Circle - Top-Right, moved left */}
                                <div className="absolute top-0 right-1 w-10 h-10 rounded-full bg-green-300 bg-opacity-60 dark:bg-green-700 dark:bg-opacity-40 border-2 border-green-500 dark:border-green-400 flex items-center justify-center">
                                  <span className="text-[8px] font-bold text-green-900 dark:text-green-100">
                                    Values
                                  </span>
                                </div>

                                {/* Interests Circle - Bottom, moved up */}
                                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full bg-red-300 bg-opacity-60 dark:bg-red-700 dark:bg-opacity-40 border-2 border-red-500 dark:border-red-400 flex items-center justify-center">
                                  <span className="text-[8px] font-bold text-red-900 dark:text-red-100">
                                    Interests
                                  </span>
                                </div>

                                {/* Center Intersection */}
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 dark:from-purple-500 dark:to-pink-500 flex items-center justify-center shadow-lg z-10">
                                  <span className="text-[10px]">❤️</span>
                                </div>
                              </div>

                              {/* Formula on Right Side */}
                              <div className="flex items-center gap-1 text-[10px] font-bold text-blue-900 dark:text-blue-100">
                                <span className="text-blue-700">Skills</span>
                                <span className="text-xs">∩</span>
                                <span className="text-green-700">Values</span>
                                <span className="text-xs">∩</span>
                                <span className="text-red-700">Interests</span>
                                <span className="text-xs mx-1">=</span>
                                <span className="text-xs">❤️</span>
                                <span className="text-purple-700 ml-1">Career</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Video Section - Compact */}
                        {isAccessible && (
                          <div className="flex justify-center">
                            {getVideoForSection(item.id)}
                          </div>
                        )}

                        {/* Action Buttons - Compact */}
                        <div className="flex gap-2 pt-2">
                          {isAccessible && (
                            <button
                              className={`
                                flex-1 flex items-center justify-center space-x-1 px-4 py-2 rounded-lg font-medium transition-colors text-xs
                                bg-gradient-to-r ${item.color} text-white hover:shadow-md
                              `}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMenuClick(item)
                              }}
                            >
                              <span>Full Module</span>
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          )}

                          {!isAccessible && (
                            <button
                              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-md transition-colors text-sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate('/upgrade')
                              }}
                            >
                              Upgrade to {item.requiredLevel === 'pro' ? 'Pro' : 'Executive'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Quick Access */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Quick Access & Tools</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => handleQuickAccess('/weekly-reinvention/monday-ritual', 'basic')}
              className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg hover:shadow-md transition-all"
            >
              <div className="text-2xl mb-2">🎯</div>
              <div className="text-sm font-medium text-purple-900">Monday Goals</div>
            </button>

            <button
              onClick={() => handleQuickAccess('/weekly-reinvention/friday-ritual', 'basic')}
              className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg hover:shadow-md transition-all"
            >
              <div className="text-2xl mb-2">🧠</div>
              <div className="text-sm font-medium text-green-900">Friday Review</div>
            </button>

            <button
              onClick={() => handleQuickAccess('/weekly-reinvention/progress', 'basic')}
              className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg hover:shadow-md transition-all"
            >
              <div className="text-2xl mb-2">📊</div>
              <div className="text-sm font-medium text-blue-900">Progress</div>
            </button>

            <button
              onClick={() => handleQuickAccess('/fast-track/ai-recommendations', 'pro')}
              className={`p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg hover:shadow-md transition-all ${!canAccess('pro') ? 'opacity-75' : ''}`}
            >
              <div className="text-2xl mb-2 flex items-center justify-center gap-2">
                🤖 {!canAccess('pro') && <Lock className="h-4 w-4 text-gray-500" />}
              </div>
              <div className="text-sm font-medium text-gray-900">AI Jobs</div>
            </button>

            <button
              onClick={() => handleQuickAccess('/resume/tracking', 'pro')}
              className={`p-4 bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg hover:shadow-md transition-all ${!canAccess('pro') ? 'opacity-75' : ''}`}
            >
              <div className="text-2xl mb-2 flex items-center justify-center gap-2">
                📋 {!canAccess('pro') && <Lock className="h-4 w-4 text-gray-500" />}
              </div>
              <div className="text-sm font-medium text-yellow-900">Tracker</div>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}