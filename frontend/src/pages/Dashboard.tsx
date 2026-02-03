import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import VideoLink from '../components/common/VideoLink'
import UserMenu from '../components/common/UserMenu'
import { pdf } from '@react-pdf/renderer'
import { ResumePDF } from '../components/ResumePDF'
import { UserResume, WorkExperience, Education, Certification } from '../types/resume'
import { Download } from 'lucide-react'

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [parStoriesCount, setParStoriesCount] = useState(0)
  const [hasProfile, setHasProfile] = useState(false)
  const [workExperienceCount, setWorkExperienceCount] = useState(0)
  const [tailoredResumesCount, setTailoredResumesCount] = useState(0)
  const [sentResumesCount, setSentResumesCount] = useState(0)
  const [careerVisionStatus, setCareerVisionStatus] = useState({
    started: false,
    completed: false,
    skipped: false,
    hasSeenPrompt: false
  })
  const [downloadingResume, setDownloadingResume] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Not authenticated, redirect to sign in
        navigate('/signin')
        return
      }

      setUser(user)
      await loadProgress(user.id)
      setLoading(false)
    }

    checkAuth()
  }, [navigate])

  // Reload progress when page becomes visible (e.g., after navigating back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        console.log('📊 Page visible, reloading progress...')
        loadProgress(user.id)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user])

  const loadProgress = async (userId: string) => {
    try {
      // Check PAR stories count
      const { count, error: parError } = await supabase
        .from('par_stories')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      console.log('📊 PAR stories count:', count, 'error:', parError)

      if (!parError && count !== null) {
        setParStoriesCount(count)
      }

      // Check if profile exists
      const { data: resume, error: resumeError } = await supabase
        .from('user_resumes')
        .select('profile_summary, areas_of_excellence')
        .eq('user_id', userId)
        .eq('is_master', true)
        .maybeSingle()

      console.log('📊 Profile check:', { resume, resumeError })

      if (!resumeError && resume) {
        const hasValidProfile =
          resume.profile_summary &&
          resume.profile_summary.length > 10 &&
          resume.areas_of_excellence &&
          resume.areas_of_excellence.length > 0

        console.log('📊 Profile validation:', {
          hasProfileSummary: !!resume.profile_summary,
          summaryLength: resume.profile_summary?.length,
          hasAreas: !!resume.areas_of_excellence,
          areasCount: resume.areas_of_excellence?.length,
          hasValidProfile
        })

        setHasProfile(hasValidProfile)
      }

      // Check work experience count
      const { data: resumeForWorkExp } = await supabase
        .from('user_resumes')
        .select('id')
        .eq('user_id', userId)
        .eq('is_master', true)
        .maybeSingle()

      if (resumeForWorkExp) {
        const { count: workExpCount } = await supabase
          .from('work_experience')
          .select('*', { count: 'exact', head: true })
          .eq('resume_id', resumeForWorkExp.id)

        if (workExpCount !== null) {
          setWorkExperienceCount(workExpCount)
        }
      }

      // Check tailored resumes count
      const { count: tailoredCount } = await supabase
        .from('tailored_resumes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      if (tailoredCount !== null) {
        setTailoredResumesCount(tailoredCount)
      }

      // Check sent resumes count
      const { count: sentCount } = await supabase
        .from('tailored_resumes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'sent')

      if (sentCount !== null) {
        setSentResumesCount(sentCount)
      }

      // Check Career Vision status
      const { data: careerVision } = await supabase
        .from('user_profiles')
        .select('career_vision_started, career_vision_completed, career_vision_skipped, has_seen_career_vision_prompt')
        .eq('user_id', userId)
        .maybeSingle()

      if (careerVision) {
        setCareerVisionStatus({
          started: careerVision.career_vision_started || false,
          completed: careerVision.career_vision_completed || false,
          skipped: careerVision.career_vision_skipped || false,
          hasSeenPrompt: careerVision.has_seen_career_vision_prompt || false
        })
      }

      // Get user full name from user_resumes table
      const { data: resumeData } = await supabase
        .from('user_resumes')
        .select('full_name')
        .eq('user_id', userId)
        .eq('is_master', true)
        .maybeSingle()

      if (resumeData) {
        setUserProfile(resumeData)
      }
    } catch (error) {
      console.error('Error loading progress:', error)
    }
  }


  const handleDownloadResume = async () => {
    if (!user) return

    setDownloadingResume(true)
    try {
      console.log('📄 Starting resume download...')

      // Load master resume
      const { data: resume, error: resumeError } = await supabase
        .from('user_resumes')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_master', true)
        .maybeSingle()

      if (resumeError || !resume) {
        alert('No resume found. Please create your profile first.')
        return
      }

      console.log('📄 Resume loaded:', resume)

      // Load work experiences with accomplishments
      const { data: experiences, error: expError } = await supabase
        .from('work_experience')
        .select(`
          *,
          accomplishments:accomplishment(*)
        `)
        .eq('resume_id', resume.id)
        .order('order_index', { ascending: false })

      if (expError) {
        console.error('Error loading experiences:', expError)
      }

      console.log('📄 Work experiences loaded:', experiences?.length || 0)

      // Load education
      const { data: education, error: eduError } = await supabase
        .from('education')
        .select('*')
        .eq('resume_id', resume.id)
        .order('order_index', { ascending: false })

      if (eduError) {
        console.error('Error loading education:', eduError)
      }

      console.log('📄 Education loaded:', education?.length || 0)

      // Load certifications
      const { data: certifications, error: certError } = await supabase
        .from('certifications')
        .select('*')
        .eq('resume_id', resume.id)
        .order('order_index', { ascending: false })

      if (certError) {
        console.error('Error loading certifications:', certError)
      }

      console.log('📄 Certifications loaded:', certifications?.length || 0)

      // Generate PDF
      console.log('📄 Generating PDF...')
      const doc = (
        <ResumePDF
          resume={resume as UserResume}
          workExperiences={experiences as WorkExperience[] || []}
          education={education as Education[] || []}
          certifications={certifications as Certification[] || []}
        />
      )

      const blob = await pdf(doc).toBlob()
      console.log('📄 PDF generated, size:', blob.size, 'bytes')

      // Download
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${resume.full_name?.replace(/\s+/g, '_') || 'Resume'}_Generic.pdf`
      link.click()
      URL.revokeObjectURL(url)

      console.log('✅ Resume downloaded successfully')
    } catch (error) {
      console.error('Error downloading resume:', error)
      alert('Error downloading resume. Please try again.')
    } finally {
      setDownloadingResume(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="NovaWork Global" className="h-12 w-auto" />
              <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white hidden sm:block">
                Dashboard
              </h1>
            </div>
            <UserMenu user={user} userProfile={userProfile} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl shadow-lg p-8 mb-8 text-white">
          <h2 className="text-3xl font-heading font-bold mb-2">
            Welcome, {
              userProfile?.full_name
                ? userProfile.full_name.split('.').map((n: string) =>
                  n.charAt(0).toUpperCase() + n.slice(1)
                ).join(' ')
                : user?.email?.split('@')[0]?.split('.').map((n: string) =>
                  n.charAt(0).toUpperCase() + n.slice(1)
                ).join(' ') || user?.email
            }!
          </h2>
          <p className="text-primary-100">
            You've successfully completed onboarding. Let's build your career reinvention journey!
          </p>
        </div>

        {/* STEP 1: Career Vision Discovery */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-primary-200 dark:border-primary-700 p-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="inline-block bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-semibold mb-3">
                STEP 1: Career Vision Discovery
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                🎯 Find Your Ideal Career Path
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Discover the intersection of your skills, values, and interests. Get personalized job recommendations that truly fit you.
              </p>

              {/* AI Career Path Video Link */}
              <div className="mb-4">
                <VideoLink
                  videoSrc="/videos/AI_&_Your_Career_Path-EN.mp4"
                  title="📹 Watch"
                  description="AI & Your Career Path"
                />
              </div>
            </div>
          </div>

          {/* Visual Representation - Compact */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-600">
            <div className="text-center">
              <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-xs font-medium mr-1">
                Skills
              </span>
              <span className="text-lg mx-1">∩</span>
              <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-medium mr-1">
                Values
              </span>
              <span className="text-lg mx-1">∩</span>
              <span className="inline-block bg-primary-100 text-primary-700 px-3 py-1 rounded-lg text-xs font-medium mr-1">
                Interests
              </span>
              <span className="text-lg mx-1">=</span>
              <span className="text-xl">❤️</span>
            </div>
          </div>

          {/* Status and CTA */}
          <div className="flex items-center justify-between">
            <div>
              {careerVisionStatus.completed ? (
                <div className="flex items-center gap-2">
                  <span className="text-green-600 text-xl">✓</span>
                  <div className="text-sm font-semibold text-green-700">Completed</div>
                </div>
              ) : careerVisionStatus.started ? (
                <div className="flex items-center gap-2">
                  <span className="text-orange-500 text-xl">⏳</span>
                  <div className="text-sm font-semibold text-orange-700 dark:text-orange-400">In Progress</div>
                </div>
              ) : (
                <div className="text-sm text-gray-600 dark:text-gray-400">Not started • 10-15 minutes</div>
              )}
            </div>
            <button
              onClick={() => navigate(careerVisionStatus.completed ? '/career-vision/summary' : '/career-vision/dashboard')}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition-all"
            >
              {careerVisionStatus.completed ? 'View Career Vision' : careerVisionStatus.started ? 'Continue' : 'Start Discovery'} →
            </button>
          </div>
        </div>

        {/* STEP 2: Resume Builder */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-primary-200 dark:border-primary-700 p-8 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="inline-block bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-semibold mb-3">
                STEP 2: Build Your Resume
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                📝 Interview-Magnet Resume™ Builder
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Create powerful ATS-optimized resumes. Capture CAR stories, build your profile, and tailor for each job.
              </p>
            </div>

            {/* Download Generic Resume Button */}
            <button
              onClick={handleDownloadResume}
              disabled={downloadingResume || !hasProfile}
              title={!hasProfile ? 'Complete your profile first to download your resume' : 'Download Complete Resume (PDF)'}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloadingResume ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
          </div>

          {/* BRE Methodology Video Link */}
          <div className="mb-4">
            <VideoLink
              videoSrc="/videos/BRE-EN.mp4"
              title="📹 Watch"
              description="Learn how to Build Resume & Execute effectively"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/resume-builder/par-stories')}
              className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 hover:from-primary-100 hover:to-primary-200 dark:hover:from-primary-800/40 dark:hover:to-primary-700/40 border border-primary-200 dark:border-primary-700 rounded-lg p-4 text-left transition-all"
            >
              <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">CAR Stories</div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">Capture accomplishments</div>
              {parStoriesCount > 0 ? (
                <div className="text-xs font-semibold text-primary-600">
                  {parStoriesCount} {parStoriesCount === 1 ? 'story' : 'stories'} →
                </div>
              ) : (
                <div className="text-xs font-semibold text-primary-600">Start Here →</div>
              )}
            </button>

            <button
              onClick={() => navigate('/resume-builder/profile')}
              className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 hover:from-primary-100 hover:to-primary-200 dark:hover:from-primary-800/40 dark:hover:to-primary-700/40 border border-primary-200 dark:border-primary-700 rounded-lg p-4 text-left transition-all"
            >
              <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">Profile</div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">Professional summary</div>
              {hasProfile ? (
                <div className="text-xs font-semibold text-green-600">✓ Complete</div>
              ) : (
                <div className="text-xs font-semibold text-primary-600">Build Profile →</div>
              )}
            </button>

            <button
              onClick={() => navigate('/resume-builder/work-experience')}
              className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 hover:from-primary-100 hover:to-primary-200 dark:hover:from-primary-800/40 dark:hover:to-primary-700/40 border border-primary-200 dark:border-primary-700 rounded-lg p-4 text-left transition-all"
            >
              <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">Work Experience</div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">Add your roles</div>
              {workExperienceCount > 0 ? (
                <div className="text-xs font-semibold text-primary-600">
                  {workExperienceCount} {workExperienceCount === 1 ? 'role' : 'roles'} →
                </div>
              ) : (
                <div className="text-xs font-semibold text-primary-600">Add Roles →</div>
              )}
            </button>

            <button
              onClick={() => navigate('/resume-builder/jd-analyzer')}
              className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 hover:from-primary-100 hover:to-primary-200 dark:hover:from-primary-800/40 dark:hover:to-primary-700/40 border border-primary-200 dark:border-primary-700 rounded-lg p-4 text-left transition-all"
            >
              <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">JD Analyzer</div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">Tailor for each job</div>
              {tailoredResumesCount > 0 ? (
                <div className="text-xs font-semibold text-primary-600">
                  {tailoredResumesCount} tailored →
                </div>
              ) : (
                <div className="text-xs font-semibold text-primary-600">Analyze JD →</div>
              )}
            </button>
          </div>
        </div>

        {/* STEP 3: Fast-Track Job Search System */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-primary-200 dark:border-primary-700 p-8 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="inline-block bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-semibold mb-3">
                STEP 3: Apply Smart & Network
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                🚀 Fast-Track Job Search System
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Get called 75% faster with our proven 4-step system. Referrals increase callbacks from 1-2% to 80%!
              </p>

              {/* IMR Methodology Video Link */}
              <div className="mb-4">
                <VideoLink
                  videoSrc="/videos/IMR-EN.mp4"
                  title="📹 Watch"
                  description="Learn how to Identify Market & Research strategically"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/fast-track/plan-your-search')}
              className="bg-primary-50 dark:bg-primary-900/30 hover:bg-primary-100 dark:hover:bg-primary-800/40 border-2 border-primary-200 dark:border-primary-700 rounded-lg p-4 text-left transition-all"
            >
              <div className="text-lg font-bold mb-1 text-gray-900 dark:text-white">Step 1: Plan Your Search</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Target companies & industry research</div>
              <div className="mt-3 text-xs font-semibold text-primary-600">Start Here →</div>
            </button>

            <button
              onClick={() => navigate('/fast-track/apply-smart-online')}
              className="bg-primary-50 dark:bg-primary-900/30 hover:bg-primary-100 dark:hover:bg-primary-800/40 border-2 border-primary-200 dark:border-primary-700 rounded-lg p-4 text-left transition-all"
            >
              <div className="text-lg font-bold mb-1 text-gray-900 dark:text-white">Step 2: Apply Smart</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Job tracker + referral system (80% success)</div>
              <div className="mt-3 text-xs font-semibold text-primary-600">Start Here →</div>
            </button>

            <div className="bg-gray-50 dark:bg-gray-700/30 border-2 border-gray-200 dark:border-gray-600 rounded-lg p-4 opacity-60">
              <div className="text-lg font-bold mb-1 text-gray-700 dark:text-gray-400">Step 5: Recruiters</div>
              <div className="text-sm text-gray-500 dark:text-gray-500">Recruiter CRM & visibility strategy</div>
              <div className="mt-3 text-xs font-semibold text-gray-400 dark:text-gray-500">Coming Soon</div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/30 border-2 border-gray-200 dark:border-gray-600 rounded-lg p-4 opacity-60">
              <div className="text-lg font-bold mb-1 text-gray-700 dark:text-gray-400">Step 6: Network</div>
              <div className="text-sm text-gray-500 dark:text-gray-500">60-day networking plan + 90-sec intro</div>
              <div className="mt-3 text-xs font-semibold text-gray-400 dark:text-gray-500">Coming Soon</div>
            </div>
          </div>
        </div>

        {/* STEP 4: Interview Mastery System */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-primary-200 dark:border-primary-700 p-8 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="inline-block bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-semibold mb-3">
                STEP 4: Interview Preparation & Strategy
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                🎯 Interview Mastery System™
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Master your interview preparation with the proven 3-phase methodology: Before (Prepare) → During (Execute) → After (Follow-up)
              </p>

              {/* Interview Playbook Video Link */}
              <div className="mb-4">
                <VideoLink
                  videoSrc="/videos/Your_Interview_Playbook-EN.mp4"
                  title="📹 Watch"
                  description="Your Interview Playbook"
                />
              </div>
            </div>
          </div>

          {/* 3-Phase Visual */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-600">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl mb-1">📘</div>
                <div className="text-sm font-semibold text-blue-700 dark:text-blue-400">Phase 1: Before</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Research & Prepare</div>
              </div>
              <div>
                <div className="text-3xl mb-1">💼</div>
                <div className="text-sm font-semibold text-green-700 dark:text-green-400">Phase 2: During</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Execute & Impress</div>
              </div>
              <div>
                <div className="text-3xl mb-1">✉️</div>
                <div className="text-sm font-semibold text-purple-700 dark:text-purple-400">Phase 3: After</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Follow-up & Close</div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span className="text-gray-700 dark:text-gray-300">70+ curated interview questions</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span className="text-gray-700 dark:text-gray-300">Practice tracking & confidence</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span className="text-gray-700 dark:text-gray-300">JD comparison with PAR stories</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span className="text-gray-700 dark:text-gray-300">Thank you note generator</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span className="text-gray-700 dark:text-gray-300">Interview type classification</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <span className="text-gray-700 dark:text-gray-300">Salary negotiation prep</span>
            </div>
          </div>

          {/* Action */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Prepare for your interviews like a pro
            </div>
            <button
              onClick={() => navigate('/interview')}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition-all"
            >
              Start Interview Prep →
            </button>
          </div>
        </div>

        {/* STEP 5: Weekly Reinvention Cycle */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-purple-200 dark:border-purple-700 p-8 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold mb-3">
                STEP 5: Weekly Reinvention Cycle
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                🔄 Weekly Reinvention Cycle™
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Build unstoppable momentum with Monday goal setting and Friday reflection rituals. Track progress, maintain streaks, and achieve breakthrough results week after week.
              </p>
            </div>
          </div>

          {/* Weekly Ritual Visual */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-600">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-3xl mb-1">🎯</div>
                <div className="text-sm font-semibold text-blue-700 dark:text-blue-400">Monday Ritual</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Set Weekly Goals</div>
              </div>
              <div>
                <div className="text-3xl mb-1">🧠</div>
                <div className="text-sm font-semibold text-green-700 dark:text-green-400">Friday Ritual</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Reflect & Analyze</div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-purple-600">📊</span>
              <span className="text-gray-700 dark:text-gray-300">Progress tracking dashboard</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-600">🔥</span>
              <span className="text-gray-700 dark:text-gray-300">Streak counter & badges</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-600">📈</span>
              <span className="text-gray-700 dark:text-gray-300">Goal prioritization system</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-600">🏆</span>
              <span className="text-gray-700 dark:text-gray-300">Achievement gamification</span>
            </div>
          </div>

          {/* Current Status */}
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-purple-700 dark:text-purple-300">
                🚀 Start your week with intention and end with insights
              </div>
              <a
                href="/weekly-reinvention/progress"
                className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 hover:underline"
              >
                View Progress →
              </a>
            </div>
          </div>

          {/* Action */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Transform your career journey with consistent weekly progress
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/weekly-reinvention/monday-ritual')}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-semibold transition-all text-sm"
              >
                🎯 Monday Goals
              </button>
              <button
                onClick={() => navigate('/weekly-reinvention/friday-ritual')}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold transition-all text-sm"
              >
                🧠 Friday Reflection
              </button>
              <button
                onClick={() => navigate('/fast-track/ai-recommendations')}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg font-semibold transition-all text-sm"
              >
                🤖 AI Jobs
              </button>
            </div>
          </div>
        </div>

        {/* QUICK ACCESS & TOOLS */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl shadow-lg border-2 border-purple-200 dark:border-purple-700 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold mb-3">
                QUICK ACCESS & TOOLS
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                🚀 AI-Powered Tools
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get personalized job recommendations powered by artificial intelligence
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl mb-1">🤖</div>
              <div className="text-xs font-medium text-purple-600 dark:text-purple-400">NEW</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AI Job Recommendations */}
            <button
              onClick={() => navigate('/fast-track/ai-recommendations')}
              className="group bg-white dark:bg-gray-800 hover:shadow-lg border-2 border-purple-200 dark:border-purple-700 rounded-lg p-6 text-left transition-all hover:scale-105"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center group-hover:from-purple-600 group-hover:to-indigo-600 transition-all">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">AI Job Recommendations</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    Get personalized job matches based on your skills, career vision, and preferences
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                      ✅ Powered by AI
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                      📊 Smart Matching
                    </span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full font-medium">
                      🎯 Real Jobs
                    </span>
                  </div>
                  <div className="mt-3 text-sm font-semibold text-purple-600 group-hover:text-purple-700 transition-colors">
                    Discover Jobs →
                  </div>
                </div>
              </div>
            </button>

            {/* Career Vision */}
            <button
              onClick={() => navigate('/career-vision')}
              className="group bg-white dark:bg-gray-800 hover:shadow-lg border-2 border-purple-200 dark:border-purple-700 rounded-lg p-6 text-left transition-all hover:scale-105"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center group-hover:from-emerald-600 group-hover:to-teal-600 transition-all">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Career Vision</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    Discover your ideal career path through skills, values, and interests analysis
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full font-medium">
                      🎯 Vision Clarity
                    </span>
                    <span className="px-2 py-1 bg-teal-100 text-teal-800 rounded-full font-medium">
                      🔍 Self-Discovery
                    </span>
                  </div>
                  <div className="mt-3 text-sm font-semibold text-emerald-600 group-hover:text-emerald-700 transition-colors">
                    Explore Vision →
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

      </main>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string
  description: string
  icon: 'document' | 'briefcase' | 'calendar'
}

function StatCard({ title, value, description, icon }: StatCardProps) {
  const icons = {
    document: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    ),
    briefcase: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    ),
    calendar: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    ),
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-gray-600">{title}</h4>
        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {icons[icon]}
        </svg>
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  )
}

interface NextStepCardProps {
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'ready'
  actionLabel?: string
}

function NextStepCard({ title, description, status, actionLabel }: NextStepCardProps) {
  const statusColors = {
    pending: 'bg-gray-100 text-gray-600',
    in_progress: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
    ready: 'bg-primary-100 text-primary-700',
  }

  const statusLabels = {
    pending: 'Not Started',
    in_progress: 'In Progress',
    completed: 'Completed',
    ready: 'Ready to Start',
  }

  return (
    <div className="flex items-start gap-4 p-4 border-2 border-gray-100 rounded-lg hover:border-primary-200 transition-colors">
      <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
        {status === 'completed' ? (
          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <div className="w-3 h-3 bg-primary-600 rounded-full"></div>
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-semibold text-gray-900">{title}</h4>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[status]}`}>
            {statusLabels[status]}
          </span>
        </div>
        <p className="text-sm text-gray-600">{description}</p>
        {actionLabel && (
          <p className="text-sm font-medium text-primary-600 mt-2">{actionLabel}</p>
        )}
      </div>
    </div>
  )
}
