import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Briefcase, Trophy, User, CheckCircle, ArrowRight, Play, Mail } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { BackButton } from '../../components/common/BackButton'

interface ResumeOption {
  id: string
  title: string
  description: string
  icon: React.ElementType
  route: string
  completed: boolean
  current: boolean
  color: string
  bgColor: string
  borderColor: string
}

export default function ResumeBuilderMenu() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [userLevel, setUserLevel] = useState<'basic' | 'pro' | 'executive'>('basic')

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) {
      // Fetch subscription tier
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

      await loadProgress(user.id)
    }
    setLoading(false)
  }

  const canAccess = (requiredLevel: string) => {
    const levels = { basic: 1, pro: 2, executive: 3 }
    return levels[userLevel] >= levels[requiredLevel as keyof typeof levels]
  }

  const loadProgress = async (userId: string) => {
    try {
      const { data: workExp } = await supabase.from('work_experience').select('id').eq('resume_id', userId).limit(1)
      const { data: profile } = await supabase.from('user_profiles').select('id').eq('user_id', userId).single()
      const { data: carStories } = await supabase.from('par_stories').select('id').eq('user_id', userId).limit(1)

      const completed = new Set<string>()
      if (workExp && workExp.length > 0) completed.add('work-experience')
      if (profile) completed.add('profile')
      if (carStories && carStories.length > 0) completed.add('car-stories')

      setCompletedSteps(completed)
    } catch (error) {
      console.error('Error loading progress:', error)
    }
  }

  const resumeOptions: ResumeOption[] = [
    {
      id: 'work-experience',
      title: 'Work Experience',
      description: 'Build your career history with ease.',
      icon: Briefcase,
      route: '/resume/work-experience',
      completed: completedSteps.has('work-experience'),
      current: !completedSteps.has('work-experience'),
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200'
    },
    {
      id: 'car-accomplishments',
      title: 'CAR Stories',
      description: 'Highlight your key achievements.',
      icon: Trophy,
      route: '/resume/car-stories',
      completed: completedSteps.has('car-stories'),
      current: completedSteps.has('work-experience') && !completedSteps.has('car-stories'),
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      id: 'profile',
      title: 'Professional Profile',
      description: 'Craft a compelling summary.',
      icon: User,
      route: '/resume/profile',
      completed: completedSteps.has('profile'),
      current: completedSteps.has('car-stories') && !completedSteps.has('profile'),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'cover-letter',
      title: 'Cover Letter Generator',
      description: 'AI-powered personalized cover letters.',
      icon: Mail,
      route: '/resume/cover-letter',
      completed: false,
      current: false,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },

  ]

  if (!user) return null
  if (loading) return <div className="p-12 text-center text-gray-500">Loading...</div>

  const progressPercentage = Math.round((completedSteps.size / 3) * 100)
  const isJobSearchAccessible = canAccess('pro')

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10 min-h-screen">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 p-8 rounded-2xl shadow-xl text-white border border-transparent dark:border-gray-700">
        <div>
          <BackButton
            to="/dashboard"
            label="Back to Dashboard"
            variant="dark"
            className="mb-4 pl-0"
          />
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-400" />
            Resume Builder
          </h1>
          <p className="text-gray-300 max-w-xl">
            Create a professional, ATS-optimized resume. Follow the steps below or use individual tools.
          </p>
        </div>

        {/* Global Progress Indicator */}
        <div className="flex items-center gap-6 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-gray-600"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                strokeDasharray={175}
                strokeDashoffset={175 - (175 * progressPercentage) / 100}
                className="text-blue-400 transition-all duration-1000 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-sm font-bold">{progressPercentage}%</span>
          </div>
          <div className="text-left">
            <p className="font-semibold">Your Progress</p>
            <p className="text-xs text-gray-300">{completedSteps.size} of 3 steps completed</p>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {resumeOptions.map((option) => {
          const Icon = option.icon
          // Free navigation enabled - no locking logic needed for these basic tools as per requirements

          return (
            <div
              key={option.id}
              onClick={() => navigate(option.route)}
              className={`
                group relative p-8 rounded-2xl border transition-all duration-300
                bg-white dark:bg-gray-800 hover:shadow-2xl cursor-pointer hover:-translate-y-1
                border-gray-200 dark:border-gray-700
                ${option.current ? `ring-2 ring-offset-2 dark:ring-offset-gray-900 ${option.color.replace('text-', 'ring-')}` : ''}
              `}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-4 rounded-xl ${option.bgColor} dark:bg-gray-700 ${option.color} dark:text-white`}>
                  <Icon className="w-8 h-8" />
                </div>
                {option.completed ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  // Show arrow on hover if not completed
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className={`w-6 h-6 ${option.color} dark:text-white`} />
                  </div>
                )}
              </div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {option.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {option.description}
              </p>

              <div className="flex items-center justify-between mt-auto">
                <span className={`text-sm font-medium ${option.color} dark:text-white`}>
                  {option.completed ? 'Edit Details' : 'Get Started'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Action Footer - Apply Jobs (LOCKED FOR BASIC) */}
      <div
        onClick={() => {
          if (isJobSearchAccessible) navigate('/job-search/plan-your-search')
          else alert('Job Search is a Pro feature. Upgrade to unlock!')
        }}
        className={`
           rounded-2xl p-8 text-white shadow-lg transition-all flex items-center justify-between group
           ${isJobSearchAccessible
            ? 'bg-gradient-to-r from-blue-600 to-indigo-700 cursor-pointer hover:shadow-2xl hover:scale-[1.01]'
            : 'bg-gray-800 cursor-not-allowed opacity-80'}
        `}
      >
        <div>
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
            <Play className="fill-current w-6 h-6" />
            {isJobSearchAccessible ? 'Ready to Apply?' : 'Ready to Apply? (Pro Only)'}
          </h2>
          <p className={isJobSearchAccessible ? "text-blue-100" : "text-gray-400"}>
            {isJobSearchAccessible
              ? 'Start your job search journey with AI-powered recommendations.'
              : 'Upgrade to Pro to access our AI-powered job search engine.'}
          </p>
        </div>
        <div className={`p-3 rounded-full transition-colors ${isJobSearchAccessible ? 'bg-white/20 group-hover:bg-white/30' : 'bg-gray-700'}`}>
          <ArrowRight className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  )
}