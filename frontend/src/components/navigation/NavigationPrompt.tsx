import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
  Users,
  Play,
  BookOpen
} from 'lucide-react'

interface ActionItem {
  id: string
  titleKey: string
  descKey: string
  icon: React.ElementType
  color: string
  gradient: string
  shadow: string
  modules: string[]
  requiredLevel: 'essentials' | 'momentum' | 'executive'
  videoSrc: string
}

export default function NavigationPrompt() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { t } = useTranslation()

  // Default to Basic level until loaded
  const [userLevel, setUserLevel] = useState<'essentials' | 'momentum' | 'executive'>('essentials')

  const actions: ActionItem[] = [
    {
      id: 'career-discovery',
      titleKey: 'careerVision',
      descKey: 'careerVisionDesc',
      icon: Brain,
      color: 'text-white',
      gradient: 'from-navy-light to-navy',
      shadow: 'shadow-navy/30',
      modules: ['Career Direction', 'Market Fit'],
      requiredLevel: 'momentum',
      videoSrc: '/videos/AI_&_Your_Career_Path-EN.mp4'
    },
    {
      id: 'build-resume',
      titleKey: 'resumeBuilder',
      descKey: 'resumeBuilderDesc',
      icon: FileText,
      color: 'text-white',
      gradient: 'from-primary-400 to-primary-600',
      shadow: 'shadow-primary-500/30',
      modules: ['Resume Builder', 'AI Optimization'],
      requiredLevel: 'essentials',
      videoSrc: '/videos/BRE-EN.mp4'
    },
    {
      id: 'job-search-suite',
      titleKey: 'jobSearch',
      descKey: 'jobSearchDesc',
      icon: Target,
      color: 'text-white',
      gradient: 'from-teal-400 to-teal-600',
      shadow: 'shadow-teal-500/30',
      modules: ['Application Tracker', 'JD Analysis', 'Interviews'],
      requiredLevel: 'momentum',
      videoSrc: '/videos/IMR-EN.mp4'
    },
    {
      id: 'interview-mastery',
      titleKey: 'interviewMastery',
      descKey: 'interviewMasteryDesc',
      icon: Users,
      color: 'text-white',
      gradient: 'from-accent-400 to-accent-600',
      shadow: 'shadow-accent-500/30',
      modules: ['Interview Prep', 'Question Bank'],
      requiredLevel: 'executive',
      videoSrc: '/videos/Your_Interview_Playbook-EN.mp4'
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

        // Map both old and new tier names
        if (userData?.subscription_tier) {
          let tier = userData.subscription_tier
          // Map old tier names to new ones
          if (tier === 'basic') tier = 'essentials'
          if (tier === 'pro') tier = 'momentum'
          setUserLevel(tier as 'essentials' | 'momentum' | 'executive')
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
    const levels = { essentials: 1, momentum: 2, executive: 3 }
    return levels[userLevel] >= levels[requiredLevel as keyof typeof levels]
  }

  const getAccessBadge = (requiredLevel: string) => {
    if (requiredLevel === 'essentials') return null

    // Premium badge styles
    const badges = {
      momentum: {
        icon: Star,
        label: 'Momentum',
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
      alert(`This feature requires ${action.requiredLevel === 'momentum' ? 'Momentum' : 'Executive'} membership. Upgrade to unlock this feature!`)
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
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-gray-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src="/novaworkglobal/logo.png" alt="NovaWork Global" className="h-28 w-auto" />
              <div className="hidden sm:block">
                {userLevel === 'essentials' && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                    Essentials Plan
                  </span>
                )}
                {userLevel === 'momentum' && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 ring-1 ring-emerald-500/20">
                    <Star className="w-3.5 h-3.5" />
                    Momentum Member
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
              <UserMenu user={user} userProfile={userProfile} sizeClass="w-28 h-28 text-3xl" />
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header - Full Width */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl text-gray-600 dark:text-gray-400">
              {t('dashboard.welcomeBack')} <span className="font-bold text-gray-900 dark:text-white">
                {userProfile?.full_name
                  ? userProfile.full_name.split(' ')[0]
                  : user?.email?.split('@')[0] || 'User'}
              </span> 👋
            </h1>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {t('dashboard.whatToAchieve')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            {t('dashboard.pickFocus')}
          </p>
        </div>

        <div className="grid grid-cols-12 gap-8 items-start">
          {/* Main Content Area (Left) */}
          <div className="col-span-12 lg:col-span-8">

            {/* Recommended Next Step Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8 relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <span className="text-xs font-bold tracking-wider text-gray-400 uppercase">{t('dashboard.recommendedNext')}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate('/resume-builder')}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    {t('dashboard.continue')} <ArrowRight className="w-4 h-4" />
                  </button>
                  <a
                    href="/videos/BRE-EN.mp4"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" /> {t('dashboard.watchVideo')}
                  </a>
                  <button
                    onClick={() => navigate('/resume-builder')}
                    className="flex items-center gap-1.5 px-3 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> {t('dashboard.learnMore')}
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="p-4 bg-primary-600 rounded-xl text-white shadow-lg shadow-primary-500/20">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('dashboard.buildMyResume')}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 max-w-lg">
                    {t('dashboard.buildMyResumeDesc')}
                  </p>

                  {/* Progress Bar */}
                  <div className="max-w-md">
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-primary-500 w-3/5 rounded-full" />
                    </div>
                    <p className="text-sm text-gray-500">{t('dashboard.progress')} 3/5 {t('dashboard.steps')}</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/resume-builder')}
                  className="sm:hidden w-full mt-4 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium"
                >
                  {t('dashboard.start')} <ArrowRight className="w-4 h-4 inline ml-1" />
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

                      {/* Always show tier badge with color coding */}
                      <span className={`
                        inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold
                        ${action.requiredLevel === 'essentials' ? 'bg-blue-100 text-blue-700' : ''}
                        ${action.requiredLevel === 'momentum' ? 'bg-emerald-100 text-emerald-700' : ''}
                        ${action.requiredLevel === 'executive' ? 'bg-amber-100 text-amber-700' : ''}
                      `}>
                        {action.requiredLevel === 'essentials' && (
                          <>
                            <Star className="w-3 h-3" />
                            Essentials
                          </>
                        )}
                        {action.requiredLevel === 'momentum' && (
                          <>
                            <Star className="w-3 h-3" />
                            Momentum
                          </>
                        )}
                        {action.requiredLevel === 'executive' && (
                          <>
                            <Crown className="w-3 h-3" />
                            Executive
                          </>
                        )}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {t(`dashboard.${action.titleKey}`)}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 flex-1">
                      {t(`dashboard.${action.descKey}`)}
                    </p>

                    <div className="flex items-center justify-between mt-auto mb-3">
                      {isAccessible ? (
                        action.id === 'build-resume' ? (
                          <span className="text-sm font-medium text-primary-600">{t('dashboard.continue')}</span>
                        ) : (
                          <button className="text-sm font-medium text-gray-400 hover:text-gray-600">{t('dashboard.preview')}</button>
                        )
                      ) : (
                        <span className="text-sm font-medium text-amber-600 hover:text-amber-700">
                          {t('dashboard.upgradeTo')} {action.requiredLevel === 'executive' ? 'Executive' : 'Momentum'}
                        </span>
                      )}

                      {isAccessible ? (
                        action.id === 'build-resume' &&
                        <div className="h-1.5 w-20 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary-500 w-3/5 rounded-full" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-gray-400 text-sm">
                          <div className="w-2 h-2 rounded-full bg-gray-300" /> {t('dashboard.locked')}
                        </div>
                      )}
                    </div>

                    {/* Watch video + Learn more */}
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <a
                        href={action.videoSrc}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        <Play className="w-3 h-3" /> {t('dashboard.watchVideo')}
                      </a>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (isAccessible) handleActionClick(action)
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        <BookOpen className="w-3 h-3" /> {t('dashboard.learnMore')}
                      </button>
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
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">{t('dashboard.yourStats')}</h3>

              <div className="flex items-end justify-between mb-2">
                <span className="text-gray-600 font-medium">{t('dashboard.resumeScore')}</span>
                <span className="text-4xl font-bold text-primary-600">78</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-8">
                <div className="bg-primary-500 h-2 rounded-full" style={{ width: '78%' }}></div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-gray-600">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <span>{t('dashboard.applicationsTracked')}</span>
                  </div>
                  <span className="font-bold text-gray-900">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-gray-600">
                    <Users className="w-5 h-5 text-gray-400" />
                    <span>{t('dashboard.interviewsScheduled')}</span>
                  </div>
                  <span className="font-bold text-gray-900">2</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('dashboard.quickActions')}</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/resume/work-experience?openImport=true')}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-gray-700">{t('dashboard.uploadResume')}</span>
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
                    <span className="font-medium text-gray-700">{t('dashboard.analyzeJD')}</span>
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