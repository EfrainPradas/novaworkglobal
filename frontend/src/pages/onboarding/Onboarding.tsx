import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { generateCareerPathSalaries } from '../../services/salaryEstimation'
import ProgressIndicator from '../../components/onboarding/ProgressIndicator'
import ProgramWelcome from '../../components/onboarding/ProgramWelcome'
import OrientationVideos from '../../components/onboarding/OrientationVideos'
import CandidateProfile from '../../components/onboarding/CandidateProfile'
import SituationPriority from '../../components/onboarding/SituationPriority'
import CareerClarityQuestions from '../../components/onboarding/CareerClarityQuestions'
// import CareerClaritySnapshot from '../../components/onboarding/CareerClaritySnapshot' // Removed per request

interface OnboardingData {
  currentSituation: string[] // Changed to string[]
  topPriority: string[] // Changed to string[]
  targetJobTitle: string
  fullName: string
  phoneNumber: string
  linkedInUrl: string
  lastCompany: string
  lastRole: string
  previousRole1: string
  previousRole2: string
  photoUrl?: string
  location: {
    city: string
    state: string
    country: string
  }
  preferredLanguage: string
  skills: string[]
  interests: string[]
  values: string[]
  valuesReasoning: string
}

interface ClaritySnapshot {
  careerPaths: Array<{
    title: string
    description: string
    salaryRange: { min: number; max: number }
    demandLevel: 'high' | 'medium' | 'low'
    requiredSkills: string[]
  }>
  clarityScore: number
}

export default function Onboarding() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    currentSituation: [],
    topPriority: [],
    targetJobTitle: '',
    fullName: '',
    phoneNumber: '',
    linkedInUrl: '',
    lastCompany: '',
    lastRole: '',
    previousRole1: '',
    previousRole2: '',
    location: {
      city: '',
      state: '',
      country: '',
    },
    preferredLanguage: i18n.language || 'en',
    skills: [],
    interests: [],
    values: [],
    valuesReasoning: '',
  })

  const [claritySnapshot, setClaritySnapshot] = useState<ClaritySnapshot | null>(null)

  // Steps configuration
  const steps = [
    { id: 'welcome', title: 'Welcome' },
    { id: 'candidate_profile', title: 'Profile' },
    { id: 'situation_priority', title: 'Situation' },
  ]

  // Check if user is authenticated
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Not authenticated, redirect to sign in
        navigate('/signin')
        return
      }

      setUserId(user.id)

      // Check if user has already completed onboarding
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .single()

      if (profile?.onboarding_completed) {
        // Already completed, redirect to dashboard
        navigate('/dashboard')
      }
    }

    checkAuth()
  }, [navigate])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleDataUpdate = (data: Partial<OnboardingData>) => {
    setOnboardingData({ ...onboardingData, ...data })
  }

  const handleSubmitQuestions = async () => {
    if (!userId) {
      setError('User not authenticated')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Save onboarding responses to database
      const { error: insertError } = await supabase
        .from('onboarding_responses')
        .insert({
          user_id: userId,
          current_situation: onboardingData.currentSituation.join(','), // Join array
          top_priority: onboardingData.topPriority.join(','), // Join array
          target_job_title: onboardingData.targetJobTitle,
          current_location: `${onboardingData.location.city}, ${onboardingData.location.state}, ${onboardingData.location.country}`,
          preferred_language: onboardingData.preferredLanguage,
          skills: [],
          interests: [],
          values: [],
          values_reasoning: ''
        })

      if (insertError) {
        console.error('Error saving onboarding responses:', insertError)
        // setError('Failed to save responses. Please try again.') // Suppress for now if schema issues
      }

      // Update user_profiles with onboarding data
      const { error: updateError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          full_name: onboardingData.fullName,
          phone: onboardingData.phoneNumber,
          linkedin_url: onboardingData.linkedInUrl,
          avatar_url: onboardingData.photoUrl,
          last_company: onboardingData.lastCompany,
          last_role: onboardingData.lastRole,
          target_job_title: onboardingData.targetJobTitle,
          current_location: `${onboardingData.location.city}, ${onboardingData.location.state}, ${onboardingData.location.country}`,
          preferred_language: onboardingData.preferredLanguage,
          onboarding_completed: true, // Mark completed immediately
        }, { onConflict: 'user_id' })

      if (updateError) {
        console.error('Error updating user profile:', updateError)
      }

      // Sync basic info to public users table
      const { error: usersError } = await supabase
        .from('users')
        .update({
          full_name: onboardingData.fullName,
          phone: onboardingData.phoneNumber,
          linkedin_url: onboardingData.linkedInUrl
        })
        .eq('id', userId)

      if (usersError) {
        console.error('Error syncing to users table:', usersError)
      }

      // Generate Career Clarity Snapshot logic removed (or moved to backend/dashboard)
      // Redirect to dashboard
      navigate('/dashboard')

    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteOnboarding = async () => {
    if (!userId) return

    setLoading(true)

    try {
      // Mark onboarding as completed
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ onboarding_completed: true })
        .eq('user_id', userId)

      if (updateError) {
        console.error('Error completing onboarding:', updateError)
        setError('Failed to complete onboarding. Please try again.')
        return
      }

      // Redirect to dashboard
      navigate('/dashboard')
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <ProgramWelcome onNext={handleNext} />

      case 1:
        return (
          <CandidateProfile
            data={onboardingData}
            onUpdate={handleDataUpdate}
            onNext={handleNext}
            onBack={handleBack}
          />
        )

      case 2:
        return (
          <SituationPriority
            data={onboardingData}
            onUpdate={handleDataUpdate}
            onNext={handleSubmitQuestions}
            onBack={handleBack}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Indicator */}
        <ProgressIndicator
          steps={steps}
          currentStep={currentStep}
          className="mb-8"
        />

        {/* Current Step Content */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {renderStep()}
        </div>
      </div>
    </div>
  )
}
