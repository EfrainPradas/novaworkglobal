import React, { useState, useEffect } from 'react'
import { UserResume, CARStory } from '../../types/resume'
import { supabase } from '../../lib/supabase'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { COUNTRIES, US_STATES } from '../../constants/locations'
import AvatarUpload from '../../components/common/AvatarUpload'

const ProfileBuilder: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parStories, setParStories] = useState<CARStory[]>([])
  const [resume, setResume] = useState<Partial<UserResume>>({
    full_name: '',
    email: '',
    phone: '',
    location_city: '',
    location_country: '',
    linkedin_url: '',
    portfolio_url: '',
    profile_summary: '',
    areas_of_excellence: [],
    resume_type: 'chronological',
    is_master: true
  })

  // Profile Builder form state
  const [whoYouAre, setWhoYouAre] = useState('')
  const [coreSkills, setCoreSkills] = useState('')
  const [softSkills, setSoftSkills] = useState('')
  const [areaInput, setAreaInput] = useState('')
  const [generatingAI, setGeneratingAI] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [usState, setUsState] = useState('')

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
      await loadResume(user.id)
      await loadPARStories(user.id)
    } else {
      setLoading(false)
    }
  }

  const loadResume = async (uid: string) => {
    console.log('🔍 Loading resume for user:', uid)

    if (isInitializing) {
      console.log('⏸️ Already initializing, skipping...')
      return
    }

    setIsInitializing(true)

    try {
      // Fetch user profile data to pre-fill
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', uid)
        .single()

      // Try to load existing master resume
      console.log('🔍 Querying: user_id =', uid, ', is_master = true')

      const { data: resumes, error } = await supabase
        .from('user_resumes')
        .select('*')
        .eq('user_id', uid)
        .eq('is_master', true)
        .limit(1)

      const data = resumes?.[0]

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error loading resume:', error)
        throw error
      }

      if (data) {
        console.log('✅ Existing resume found:', data)
        // Merge with profile data if resume fields are empty or placeholder
        const updatedResume = { ...data }
        let needsUpdate = false;

        if ((!updatedResume.full_name || updatedResume.full_name === 'Your Name') && userProfile?.full_name) {
          updatedResume.full_name = userProfile.full_name;
          needsUpdate = true;
        }
        if (!updatedResume.phone && userProfile?.phone) {
          updatedResume.phone = userProfile.phone;
          needsUpdate = true;
        }
        if (!updatedResume.linkedin_url && userProfile?.linkedin_url) {
          updatedResume.linkedin_url = userProfile.linkedin_url;
          needsUpdate = true;
        }
        if (!updatedResume.location_city && userProfile?.current_location) {
          // Basic parsing if location is "City, State, Country"
          const parts = userProfile.current_location.split(',').map((s: string) => s.trim()) // Explicit type
          updatedResume.location_city = parts[0]
          // Ensure country matches or defaults
          if (!updatedResume.location_country) updatedResume.location_country = 'USA' // Default or parse
          needsUpdate = true;
        }

        setResume(updatedResume)

        // Parse profile_summary back into components if it exists
        if (data.profile_summary) {
          // ... (existing parsing logic)
          const parts = data.profile_summary.split('. ').filter((s: string) => s.trim()) // Explicit type
          if (parts.length >= 1) setWhoYouAre(parts[0])
          if (parts.length >= 2) setCoreSkills(parts[1])
          if (parts.length >= 3) setSoftSkills(parts.slice(2).join('. ').replace(/\.$/, ''))
        }

        // Parse US state from location_city if country is USA
        if (updatedResume.location_country === 'USA' && updatedResume.location_city) {
          const cityParts = updatedResume.location_city.split(',').map((s: string) => s.trim()) // Explicit type
          if (cityParts.length > 1) {
            const possibleState = cityParts[cityParts.length - 1]
            if (US_STATES.some(state => state.value === possibleState)) {
              setUsState(possibleState)
            }
          }
        }

        // If we updated local state from profile, save it to DB too for consistency
        if (needsUpdate) {
          await supabase
            .from('user_resumes')
            .update({
              full_name: updatedResume.full_name,
              phone: updatedResume.phone,
              linkedin_url: updatedResume.linkedin_url,
              location_city: updatedResume.location_city
            })
            .eq('id', data.id)
        }

      } else {
        console.log('📝 Confirmed no resume exists, creating new one FROM PROFILE')

        // Create a new master resume using PROFILE data
        const { data: newResume, error: createError } = await supabase
          .from('user_resumes')
          .insert({
            user_id: uid,
            full_name: userProfile?.full_name || 'Your Name',
            phone: userProfile?.phone || '',
            linkedin_url: userProfile?.linkedin_url || '',
            location_city: userProfile?.current_location?.split(',')[0] || '', // Basic city extraction
            is_master: true,
            resume_type: 'chronological'
          })
          .select()
          .single()

        if (createError) {
          console.error('❌ Error creating resume:', createError)
          // ... existing error handling
          if (createError.code === '23505') {
            const { data: existing } = await supabase.from('user_resumes').select('*').eq('user_id', uid).eq('is_master', true).single()
            if (existing) { setResume(existing); return }
          }
          throw createError
        }
        console.log('✅ New resume created:', newResume)
        setResume(newResume)
      }
    } catch (error) {
      console.error('❌ Error in loadResume:', error)
      setError('Failed to load resume')
    } finally {
      setLoading(false)
      setIsInitializing(false)
    }
  }

  const loadPARStories = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('par_stories')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })

      if (error) throw error
      setParStories(data || [])
    } catch (error) {
      console.error('Error loading PAR stories:', error)
    }
  }

  const handleGenerateWithAI = async () => {
    if (parStories.length === 0) {
      setError('Please create at least one CAR story first based on your experience')
      return
    }

    setGeneratingAI(true)
    setError(null)

    try {
      // Direct call to our new backend endpoint
      // Using relative path assuming Vite proxy is set up, or full URL from env
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      const response = await fetch(`${apiUrl}/api/generate-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Failed to generate profile')
      }

      const { data } = await response.json()

      console.log('✅ AI Profile Generated:', data)

      // Populate fields with AI data
      if (data.whoYouAre) setWhoYouAre(data.whoYouAre)
      if (data.coreSkills) setCoreSkills(data.coreSkills)
      if (data.softSkills) setSoftSkills(data.softSkills)

      if (data.areasOfExcellence && Array.isArray(data.areasOfExcellence)) {
        setResume(prev => ({
          ...prev,
          areas_of_excellence: data.areasOfExcellence
        }))
      }

    } catch (error: any) {
      console.error('Error generating with AI:', error)
      setError(`Failed to generate profile with AI: ${error.message}`)
    } finally {
      setGeneratingAI(false)
    }
  }

  const handleAddArea = () => {
    if (!areaInput.trim()) return

    const currentAreas = resume.areas_of_excellence || []
    if (!currentAreas.includes(areaInput.trim())) {
      setResume(prev => ({
        ...prev,
        areas_of_excellence: [...currentAreas, areaInput.trim()]
      }))
    }
    setAreaInput('')
  }

  const handleRemoveArea = (area: string) => {
    setResume(prev => ({
      ...prev,
      areas_of_excellence: (prev.areas_of_excellence || []).filter(a => a !== area)
    }))
  }

  const handleSave = async () => {
    console.log('🔍 handleSave called', { userId, resumeId: resume.id })

    if (!userId) {
      setError('User not authenticated')
      return
    }

    if (!resume.id) {
      setError('Resume not loaded. Please refresh the page.')
      console.error('❌ No resume.id found:', resume)
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Combine profile parts into profile_summary
      // Make sure each part ends without a period, then join with ". "
      const parts = [whoYouAre, coreSkills, softSkills]
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(s => s.replace(/\.$/, '')) // Remove trailing period

      const profileSummary = parts.join('. ') + '.'

      // Format location_city with state if USA
      let formattedCity = resume.location_city
      if (resume.location_country === 'USA' && usState && resume.location_city) {
        // Remove any existing state abbreviation
        const cityOnly = resume.location_city.split(',')[0].trim()
        formattedCity = `${cityOnly}, ${usState}`
      }

      console.log('💾 Saving profile:', {
        resumeId: resume.id,
        parts,
        profileSummary,
        areasOfExcellence: resume.areas_of_excellence,
        formattedCity
      })

      const { data, error: updateError } = await supabase
        .from('user_resumes')
        .update({
          full_name: resume.full_name,
          email: resume.email,
          phone: resume.phone,
          location_city: formattedCity,
          location_country: resume.location_country,
          linkedin_url: resume.linkedin_url,
          portfolio_url: resume.portfolio_url,
          profile_summary: profileSummary,
          areas_of_excellence: resume.areas_of_excellence
        })
        .eq('id', resume.id)
        .select()

      if (updateError) {
        console.error('❌ Supabase error:', updateError)
        throw updateError
      }

      console.log('✅ Profile saved successfully:', data)
      alert('Profile saved successfully!')
      navigate('/resume-builder')
    } catch (error: any) {
      console.error('❌ Error saving profile:', error)
      setError(`Failed to save profile: ${error.message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  if (!userId) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
          {t('common.pleaseSignIn')}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <div className="text-gray-600">{t('common.loading')}</div>
      </div>
    )
  }

  const profilePreview = [whoYouAre, coreSkills, softSkills]
    .filter(s => s.trim())
    .join('. ') + (whoYouAre || coreSkills || softSkills ? '.' : '')

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-200">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/resume-builder')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Resume Builder
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500 mb-1">
              {t('resumeBuilder.steps.capture')} - Step 1
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('resumeBuilder.profile.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {t('resumeBuilder.profile.subtitle')}
            </p>
          </div>
          <button
            onClick={handleGenerateWithAI}
            disabled={generatingAI || parStories.length === 0}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generatingAI ? t('common.loading') : t('resumeBuilder.profile.generateWithAI')}
          </button>
        </div>
        {parStories.length === 0 && (
          <div className="mt-4 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded">
            💡 Tip: Create CAR stories first to get better AI-generated profile suggestions
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Header Info Form */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white dark:text-white mb-4">Contact Information</h2>

        {/* Profile Photo */}
        <div className="border-b border-gray-200 dark:border-gray-700 dark:border-gray-700 pb-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-4">Profile Photo</h3>
          {userId && (
            <AvatarUpload
              userId={userId}
              currentAvatarUrl={undefined}
              onAvatarUpdate={(url) => {
                console.log('Avatar updated:', url)
                // Optionally reload user data to refresh avatar in menu
                window.location.reload()
              }}
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={resume.full_name || ''}
              onChange={(e) => setResume(prev => ({ ...prev, full_name: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={resume.email || ''}
              onChange={(e) => setResume(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="john.doe@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={resume.phone || ''}
              onChange={(e) => setResume(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">
              LinkedIn URL
            </label>
            <input
              type="url"
              value={resume.linkedin_url || ''}
              onChange={(e) => setResume(prev => ({ ...prev, linkedin_url: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="https://linkedin.com/in/johndoe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Country
            </label>
            <select
              value={resume.location_country || ''}
              onChange={(e) => {
                setResume(prev => ({ ...prev, location_country: e.target.value }))
                // Clear state if switching from USA to another country
                if (e.target.value !== 'USA') {
                  setUsState('')
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {COUNTRIES.map((country) => (
                <option key={country.value} value={country.value}>
                  {country.label}
                </option>
              ))}
            </select>
          </div>

          {resume.location_country === 'USA' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                State
              </label>
              <select
                value={usState}
                onChange={(e) => setUsState(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {US_STATES.map((state) => (
                  <option key={state.value} value={state.value}>
                    {state.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              City
            </label>
            <input
              type="text"
              value={resume.location_city || ''}
              onChange={(e) => setResume(prev => ({ ...prev, location_city: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder={resume.location_country === 'USA' ? 'San Francisco' : 'Enter city name'}
            />
          </div>
        </div>
      </div>

      {/* Profile Builder Form */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-200 space-y-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Professional Profile</h2>

        {/* Who You Are */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('resumeBuilder.profile.whoYouAre')}
          </label>
          <p className="text-xs text-gray-500 mb-2">
            {t('resumeBuilder.profile.whoYouAreHelp')}
          </p>
          <input
            type="text"
            value={whoYouAre}
            onChange={(e) => setWhoYouAre(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('resumeBuilder.profile.whoYouArePlaceholder')}
          />
        </div>

        {/* Core Skills */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('resumeBuilder.profile.coreSkills')}
          </label>
          <p className="text-xs text-gray-500 mb-2">
            {t('resumeBuilder.profile.coreSkillsHelp')}
          </p>
          <input
            type="text"
            value={coreSkills}
            onChange={(e) => setCoreSkills(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('resumeBuilder.profile.coreSkillsPlaceholder')}
          />
        </div>

        {/* Soft Skills */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('resumeBuilder.profile.softSkills')}
          </label>
          <p className="text-xs text-gray-500 mb-2">
            {t('resumeBuilder.profile.softSkillsHelp')}
          </p>
          <textarea
            value={softSkills}
            onChange={(e) => setSoftSkills(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder={t('resumeBuilder.profile.softSkillsPlaceholder')}
          />
        </div>

        {/* Profile Preview */}
        {profilePreview && (
          <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('resumeBuilder.profile.preview')}
            </div>
            <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
              {profilePreview}
            </p>
          </div>
        )}
      </div>

      {/* Areas of Excellence */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-200 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t('resumeBuilder.profile.areasOfExcellence')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t('resumeBuilder.profile.areasOfExcellenceHelp')}
          </p>
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={areaInput}
            onChange={(e) => setAreaInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddArea()}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="e.g., Project Management, Budget Planning, Team Leadership"
          />
          <button
            onClick={handleAddArea}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
          >
            {t('common.add')}
          </button>
        </div>

        {/* Tags */}
        {resume.areas_of_excellence && resume.areas_of_excellence.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {resume.areas_of_excellence.map((area, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-2 px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm"
              >
                {area}
                <button
                  onClick={() => handleRemoveArea(area)}
                  className="hover:text-primary-900 dark:hover:text-primary-100"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-3 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700/50 transition font-medium"
        >
          {t('common.cancel')}
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium disabled:opacity-50"
        >
          {saving ? t('common.saving') : t('common.save')}
        </button>
      </div>
    </div>
  )
}

export default ProfileBuilder
