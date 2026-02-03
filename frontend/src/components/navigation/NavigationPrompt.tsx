import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import UserMenu from '../common/UserMenu'
import {
  FileText,
  Target,
  Brain,
  ArrowRight,
  Sparkles,
  Star,
  Crown,
  Users
} from 'lucide-react'

interface ActionItem {
  id: string
  title: string
  description: string
  icon: React.ElementType
  color: string
  gradient: string
  shadow: string
  modules: string[]
  requiredLevel: 'basic' | 'pro' | 'executive'
}

export default function NavigationPrompt() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Default to Basic level until loaded
  const [userLevel, setUserLevel] = useState<'basic' | 'pro' | 'executive'>('basic')

  const actions: ActionItem[] = [
    {
      id: 'career-discovery',
      title: 'Discover My Career Path',
      description: 'Find your ideal career direction through AI-powered assessment and market analysis.',
      icon: Brain,
      color: 'text-white',
      gradient: 'from-navy-light to-navy',
      shadow: 'shadow-navy/30',
      modules: ['Career Direction', 'Market Fit'],
      requiredLevel: 'executive'
    },
    {
      id: 'build-resume',
      title: 'Build My Resume',
      description: 'Create a powerful, ATS-optimized resume that gets noticed by top recruiters.',
      icon: FileText,
      color: 'text-white',
      gradient: 'from-primary-400 to-primary-600',
      shadow: 'shadow-primary-500/30',
      modules: ['Resume Builder', 'AI Optimization'],
      requiredLevel: 'basic'
    },
    {
      id: 'job-search-suite',
      title: 'Resume Track & Job Search',
      description: 'Your command center: Application Tracker, JD Analyzer, Interview Prep, and Search Strategy.',
      icon: Target,
      color: 'text-white',
      gradient: 'from-teal-400 to-teal-600',
      shadow: 'shadow-teal-500/30',
      modules: ['Application Tracker', 'JD Analysis', 'Interviews'],
      requiredLevel: 'pro'
    },
    {
      id: 'interview-mastery',
      title: 'Interview Mastery',
      description: 'Prepare for specific interviews with our 3-phase methodology and Question Bank.',
      icon: Users,
      color: 'text-white',
      gradient: 'from-accent-400 to-accent-600',
      shadow: 'shadow-accent-500/30',
      modules: ['Interview Prep', 'Question Bank'],
      requiredLevel: 'executive'
    },
  ]

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // Load user data including subscription_tier
        const { data: userData } = await supabase
          .from('users')
          .select('subscription_tier')
          .eq('id', user.id)
          .single()

        if (userData?.subscription_tier) {
          const tier = userData.subscription_tier
          if (tier === 'executive') setUserLevel('executive')
          else if (tier === 'pro') setUserLevel('pro')
          else setUserLevel('basic')
        }

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

  const getAccessBadge = (requiredLevel: string) => {
    if (requiredLevel === 'basic') return null

    // Premium badge styles
    const badges = {
      pro: {
        icon: Star,
        label: 'Pro',
        className: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-500/20'
      },
      executive: {
        icon: Crown,
        label: 'Executive',
        className: 'bg-amber-100 text-amber-700 ring-1 ring-amber-500/20'
      }
    }

    const badge = badges[requiredLevel as keyof typeof badges]
    if (!badge) return null

    return (
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.className}`}>
        <badge.icon className="w-3.5 h-3.5" />
        {badge.label} {!canAccess(requiredLevel) && 'Required'}
      </div>
    )
  }

  const handleActionClick = (action: ActionItem) => {
    if (!canAccess(action.requiredLevel)) {
      alert(`This feature requires ${action.requiredLevel === 'pro' ? 'Pro' : 'Executive'} membership. Upgrade to unlock this feature!`)
      return
    }

    switch (action.id) {
      case 'career-discovery':
        navigate('/career-vision')
        break
      case 'build-resume':
        navigate('/resume-builder')
        break
      case 'job-search-suite':
        navigate('/job-search-hub')
        break
      case 'interview-mastery':
        navigate('/interview')
        break
      default:
        navigate('/main-menu')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 backdrop-blur-md bg-white/80 dark:bg-gray-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src="/logo.png" alt="NovaWork Global" className="h-10 w-auto" />
              <div className="hidden sm:block">
                {userLevel === 'basic' && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                    Basic Plan
                  </span>
                )}
                {userLevel === 'pro' && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 ring-1 ring-emerald-500/20">
                    <Star className="w-3.5 h-3.5" />
                    Pro Member
                  </div>
                )}
                {userLevel === 'executive' && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 ring-1 ring-amber-500/20">
                    <Crown className="w-3.5 h-3.5" />
                    Executive Member
                  </div>
                )}
              </div>
            </div>
            {user && (
              <UserMenu user={user} userProfile={userProfile} />
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header - Full Width */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl text-gray-600 dark:text-gray-400">
              Welcome back, <span className="font-bold text-gray-900 dark:text-white">{userProfile?.first_name || 'Efrain'}</span> 👋
            </h1>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            What do you want to achieve today?
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Pick a focus — we'll guide you step-by-step with the fastest path to results.
          </p>
        </div>

        <div className="grid grid-cols-12 gap-8 items-start">
          {/* Main Content Area (Left) */}
          <div className="col-span-12 lg:col-span-8">

            {/* Recommended Next Step Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8 relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <span className="text-xs font-bold tracking-wider text-gray-400 uppercase">Recommended Next Step</span>
                <button
                  onClick={() => navigate('/resume-builder')}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="p-4 bg-primary-600 rounded-xl text-white shadow-lg shadow-primary-500/20">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Build My Resume</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 max-w-lg">
                    Continue where you left off. We'll prioritize edits to improve ATS match and clarity.
                  </p>

                  {/* Progress Bar */}
                  <div className="max-w-md">
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-primary-500 w-3/5 rounded-full" />
                    </div>
                    <p className="text-sm text-gray-500">Progress 3/5 steps</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/resume-builder')}
                  className="sm:hidden w-full mt-4 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Start <ArrowRight className="w-4 h-4 inline ml-1" />
                </button>
              </div>
            </div>

            {/* Modules Grid */}
            <div className="grid sm:grid-cols-2 gap-6">
              {actions.map((action) => {
                const Icon = action.icon
                const isAccessible = canAccess(action.requiredLevel)

                // Define background styles based on access
                const cardClasses = isAccessible
                  ? "bg-white dark:bg-gray-800 hover:shadow-md border-gray-100 dark:border-gray-700"
                  : "bg-gray-50/50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 opacity-90"

                return (
                  <div
                    key={action.id}
                    className={`
                      rounded-2xl p-6 border transition-all duration-200 flex flex-col h-full
                      ${cardClasses}
                      ${isAccessible ? 'cursor-pointer' : 'cursor-not-allowed'}
                    `}
                    onClick={() => isAccessible && handleActionClick(action)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`
                        p-3 rounded-xl 
                        ${action.id === 'career-discovery' ? 'bg-indigo-100 text-indigo-600' : ''}
                        ${action.id === 'build-resume' ? 'bg-primary-50 text-primary-600' : ''}
                        ${action.id === 'job-search-suite' ? 'bg-amber-100 text-amber-600' : ''}
                        ${action.id === 'interview-mastery' ? 'bg-emerald-100 text-emerald-600' : ''}
                      `}>
                        <Icon className="w-6 h-6" strokeWidth={2} />
                      </div>

                      {!isAccessible && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-semibold">
                          <Crown className="w-3 h-3" />
                          {action.requiredLevel === 'executive' ? 'Executive' : 'Pro'} Required
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {action.title}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 flex-1">
                      {action.description}
                    </p>

                    <div className="flex items-center justify-between mt-auto">
                      {isAccessible ? (
                        action.id === 'build-resume' ? (
                          <span className="text-sm font-medium text-primary-600">Continue</span>
                        ) : (
                          <button className="text-sm font-medium text-gray-400 hover:text-gray-600">Preview</button>
                        )
                      ) : (
                        <span className="text-sm font-medium text-amber-600 hover:text-amber-700">
                          Upgrade to {action.requiredLevel === 'executive' ? 'Executive' : 'Pro'}
                        </span>
                      )}

                      {isAccessible ? (
                        action.id === 'build-resume' &&
                        <div className="h-1.5 w-20 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary-500 w-3/5 rounded-full" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-gray-400 text-sm">
                          <div className="w-2 h-2 rounded-full bg-gray-300" /> Locked
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Sidebar (Right) */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* Stats Widget */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Your stats this week</h3>

              <div className="flex items-end justify-between mb-2">
                <span className="text-gray-600 font-medium">Resume score</span>
                <span className="text-4xl font-bold text-primary-600">78</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-8">
                <div className="bg-primary-500 h-2 rounded-full" style={{ width: '78%' }}></div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-gray-600">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <span>Applications tracked</span>
                  </div>
                  <span className="font-bold text-gray-900">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-gray-600">
                    <Users className="w-5 h-5 text-gray-400" />
                    <span>Interviews scheduled</span>
                  </div>
                  <span className="font-bold text-gray-900">2</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/resume/upload')}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-gray-700">Upload resume</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                </button>

                <button
                  onClick={() => navigate('/resume/jd-analyzer')}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-100 transition-colors">
                      <Target className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-gray-700">Analyze job description</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}