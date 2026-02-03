import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, CheckCircle, ArrowRight, Play, Briefcase, Trophy, User, Search, LineChart } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface Step {
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

export default function ResumeBuilder() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) {
      await loadProgress(user.id)
    }
    setLoading(false)
  }

  const loadProgress = async (userId: string) => {
    try {
      // Check work experience
      const { data: workExp } = await supabase
        .from('work_experience')
        .select('id')
        .eq('resume_id', userId)
        .limit(1)

      // Check profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', userId)
        .single()

      // Check PAR stories
      const { data: parStories } = await supabase
        .from('par_stories')
        .select('id')
        .eq('user_id', userId)
        .limit(1)

      const completed = new Set<string>()
      if (workExp && workExp.length > 0) completed.add('work-experience')
      if (profile) completed.add('profile')
      if (parStories && parStories.length > 0) completed.add('par-stories')

      setCompletedSteps(completed)
    } catch (error) {
      console.error('Error loading progress:', error)
    }
  }

  const steps: Step[] = [
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
      route: '/resume/par-stories',
      completed: completedSteps.has('par-stories'),
      current: completedSteps.has('work-experience') && !completedSteps.has('par-stories'),
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
      current: completedSteps.has('par-stories') && !completedSteps.has('profile'),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'resume-suite',
      title: 'Resume Track & Job Description',
      description: 'Analyze JDs, tailor resumes, and track applications.',
      icon: LineChart,
      route: '/resume/tracking',
      completed: false,
      current: completedSteps.has('profile'),
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    }
  ]

  if (!user) return null
  if (loading) return <div className="p-12 text-center text-gray-500">Loading...</div>

  // Calculate progress
  const progressPercentage = Math.round((completedSteps.size / 3) * 100)

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-gradient-to-r from-gray-900 to-gray-800 p-8 rounded-2xl shadow-xl text-white">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-400" />
            Resume Builder
          </h1>
          <p className="text-gray-300 max-w-xl">
            Create a professional, ATS-optimized resume. Follow the steps below to build your career story.
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
        {steps.map((step, index) => {
          const Icon = step.icon
          const isLocked = !step.current && !step.completed && step.id !== 'resume-suite' && index > 0 && !steps[index - 1].completed

          return (
            <div
              key={step.id}
              onClick={() => !isLocked && navigate(step.route)}
              className={`
                group relative p-8 rounded-2xl border transition-all duration-300
                ${isLocked
                  ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
                  : 'bg-white hover:shadow-2xl cursor-pointer hover:-translate-y-1'
                }
                ${step.current ? `ring-2 ring-offset-2 ${step.color.replace('text-', 'ring-')}` : ''}
              `}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-4 rounded-xl ${step.bgColor} ${step.color}`}>
                  <Icon className="w-8 h-8" />
                </div>
                {step.completed && (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                )}
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {step.title}
              </h3>
              <p className="text-gray-600 mb-6">
                {step.description}
              </p>

              <div className="flex items-center justify-between mt-auto">
                <span className={`text-sm font-medium ${isLocked ? 'text-gray-400' : step.color}`}>
                  {step.completed ? 'Edit Details' : isLocked ? 'Locked' : 'Get Started'}
                </span>
                {!isLocked && (
                  <ArrowRight className={`w-5 h-5 transform group-hover:translate-x-2 transition-transform ${step.color}`} />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Action Footer - Apply Jobs */}
      <div
        onClick={() => navigate('/job-search/plan-your-search')}
        className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg cursor-pointer hover:shadow-2xl hover:scale-[1.01] transition-all flex items-center justify-between group"
      >
        <div>
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
            <Play className="fill-current w-6 h-6" />
            Ready to Apply?
          </h2>
          <p className="text-blue-100">
            Start your job search journey with AI-powered recommendations.
          </p>
        </div>
        <div className="bg-white/20 p-3 rounded-full group-hover:bg-white/30 transition-colors">
          <ArrowRight className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  )
}