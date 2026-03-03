import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { WorkExperience, Accomplishment, CARStory } from '../../types/resume'
import { WorkExperienceForm } from '../../components/resume-builder/WorkExperienceForm'
import { AccomplishmentManager } from '../../components/resume-builder/AccomplishmentManager'
import { supabase } from '../../lib/supabase'
import { useTranslation } from 'react-i18next'
import { BackButton } from '../../components/common/BackButton'
import ResumePreview from '../../components/resume/ResumePreview'
import { ArrowRight } from 'lucide-react'
import { trackEvent } from '../../lib/analytics'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

const WorkExperienceBuilder: React.FC = () => {
  const { t } = useTranslation()
  const [userId, setUserId] = useState<string | null>(null)
  const [resumeId, setResumeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [experiences, setExperiences] = useState<WorkExperience[]>([])
  const [carStories, setCarStories] = useState<CARStory[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingExperience, setEditingExperience] = useState<WorkExperience | undefined>()
  const [showImportModal, setShowImportModal] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isStandalone = searchParams.get('mode') === 'standalone'

  useEffect(() => {
    // Check for auto-open import modal
    if (searchParams.get('openImport') === 'true') {
      setShowImportModal(true)
    }
    checkUser()
  }, [searchParams])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
      await loadResume(user.id)
      await loadCARStories(user.id)
    } else {
      setLoading(false)
    }
  }

  const loadResume = async (uid: string) => {
    try {
      // Try to get existing master resume
      const { data: resumes, error } = await supabase
        .from('user_resumes')
        .select('id')
        .eq('user_id', uid)
        .eq('is_master', true)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) throw error

      const resume = resumes?.[0]
      let activeResumeId: string

      if (!resume) {
        // Create master resume if it doesn't exist
        console.log('📝 Creating master resume for user...')

        // Get user's full name from profile or email
        const { data: { user } } = await supabase.auth.getUser()
        const fullName = user?.user_metadata?.full_name ||
          user?.email?.split('@')[0]?.replace(/[._-]/g, ' ') ||
          'User'

        const { data: newResume, error: createError } = await supabase
          .from('user_resumes')
          .insert({
            user_id: uid,
            is_master: true,
            full_name: fullName,
            email: user?.email || null
          })
          .select('id')
          .single()

        if (createError) throw createError
        activeResumeId = newResume.id
        console.log('✅ Master resume created')
      } else {
        activeResumeId = resume.id
      }

      setResumeId(activeResumeId)
      await loadExperiences(activeResumeId)
    } catch (error) {
      console.error('Error loading resume:', JSON.stringify(error, null, 2))
      setError('Failed to load resume')
    } finally {
      setLoading(false)
    }
  }

  const loadExperiences = async (rId: string) => {
    try {
      const { data, error } = await supabase
        .from('work_experience')
        .select(`
          *,
          accomplishments (
            id,
            bullet_text,
            order_index,
            is_featured,
            par_story_id
          )
        `)
        .eq('resume_id', rId)
        .order('order_index', { ascending: true })

      if (error) throw error

      const sortedExperiences = (data || []).sort((a, b) => {
        if (a.is_current && !b.is_current) return -1
        if (!a.is_current && b.is_current) return 1
        const dateA = a.start_date ? new Date(a.start_date).getTime() : 0
        const dateB = b.start_date ? new Date(b.start_date).getTime() : 0
        return dateB - dateA
      })

      setExperiences(sortedExperiences)
    } catch (error) {
      console.error('Error loading experiences:', error)
    }
  }

  const loadCARStories = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('par_stories') // Keeping DB table
        .select('*')
        .eq('user_id', uid)
        .eq('converted_to_bullet', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCarStories(data || [])
    } catch (error) {
      console.error('Error loading CAR stories:', error)
    }
  }

  // Accomplishment CRUD handlers
  const handleAddAccomplishment = async (workExpId: string, bullet: string, carStoryId?: string) => {
    if (!resumeId) return

    try {
      const exp = experiences.find(e => e.id === workExpId)
      const nextIndex = exp?.accomplishments?.length || 0

      const { error } = await supabase
        .from('accomplishments')
        .insert({
          work_experience_id: workExpId,
          bullet_text: bullet,
          par_story_id: carStoryId || null,
          order_index: nextIndex,
          is_featured: false
        })

      if (error) throw error

      // Also add to Accomplishment Bank
      if (exp && userId) {
        // Check for duplicate in bank first
        const { data: existing } = await supabase
          .from('accomplishment_bank')
          .select('id')
          .eq('user_id', userId)
          .eq('bullet_text', bullet)
          .single()

        if (!existing) {
          await supabase.from('accomplishment_bank').insert({
            user_id: userId,
            bullet_text: bullet,
            role_title: exp.job_title,
            company_name: exp.company_name,
            start_date: exp.start_date,
            end_date: exp.is_current ? 'Present' : exp.end_date,
            source: 'manual',
            original_source_id: workExpId,
            is_starred: false,
            times_used: 1
          })
        }
      }

      trackEvent('audit', 'accomplishment_created', { source: 'resume_builder' }, 'accomplishments', 'new')

      await loadExperiences(resumeId)
    } catch (error) {
      console.error('Error adding accomplishment:', error)
      throw error
    }
  }

  const handleUpdateAccomplishment = async (workExpId: string, accId: string, bullet: string) => {
    if (!resumeId) return

    try {
      const exp = experiences.find(e => e.id === workExpId)
      const acc = exp?.accomplishments?.find(a => a.id === accId)
      const oldBulletText = acc?.bullet_text

      const { error } = await supabase
        .from('accomplishments')
        .update({ bullet_text: bullet })
        .eq('id', accId)

      if (error) throw error

      if (userId && oldBulletText) {
        // Sync text update to the accomplishment bank
        await supabase
          .from('accomplishment_bank')
          .update({ bullet_text: bullet })
          .eq('user_id', userId)
          .eq('original_source_id', workExpId)
          .eq('bullet_text', oldBulletText)
      }

      await loadExperiences(resumeId)
    } catch (error) {
      console.error('Error updating accomplishment:', error)
      throw error
    }
  }

  const handleDeleteAccomplishment = async (workExpId: string, accId: string) => {
    if (!resumeId) return

    try {
      const exp = experiences.find(e => e.id === workExpId)
      const acc = exp?.accomplishments?.find(a => a.id === accId)

      const { error } = await supabase
        .from('accomplishments')
        .delete()
        .eq('id', accId)

      if (error) throw error

      if (userId && acc?.bullet_text) {
        // Detach the link in the bank to prevent inconsistent states
        await supabase
          .from('accomplishment_bank')
          .update({ original_source_id: null })
          .eq('user_id', userId)
          .eq('original_source_id', workExpId)
          .eq('bullet_text', acc.bullet_text)
      }

      await loadExperiences(resumeId)
    } catch (error) {
      console.error('Error deleting accomplishment:', error)
      throw error
    }
  }

  const handleConvertCARStory = async (workExpId: string, carStoryId: string) => {
    if (!resumeId || !userId) return

    try {
      // Get the CAR story
      const { data: carStory, error: fetchError } = await supabase
        .from('par_stories')
        .select('*')
        .eq('id', carStoryId)
        .single()

      if (fetchError) throw fetchError

      // Convert CAR to bullet format
      const bullet = `${carStory.result} ${carStory.metrics.join(', ')}`

      // Add accomplishment
      const exp = experiences.find(e => e.id === workExpId)
      const nextIndex = exp?.accomplishments?.length || 0

      const { error: insertError } = await supabase
        .from('accomplishments')
        .insert({
          work_experience_id: workExpId,
          bullet_text: bullet,
          par_story_id: carStoryId,
          order_index: nextIndex,
          is_featured: false
        })

      if (insertError) throw insertError

      // Also add to Accomplishment Bank
      if (exp) {
        // Check for duplicate in bank first
        const { data: existing } = await supabase
          .from('accomplishment_bank')
          .select('id')
          .eq('user_id', userId)
          .eq('bullet_text', bullet)
          .single()

        if (!existing) {
          await supabase.from('accomplishment_bank').insert({
            user_id: userId,
            bullet_text: bullet,
            role_title: exp.job_title,
            company_name: exp.company_name,
            start_date: exp.start_date,
            end_date: exp.is_current ? 'Present' : exp.end_date,
            source: 'car_story',
            original_source_id: workExpId,
            par_story_id: carStoryId,
            is_starred: false,
            times_used: 1
          })
        }
      }

      // Mark CAR story as converted
      const { error: updateError } = await supabase
        .from('par_stories')
        .update({ converted_to_bullet: true })
        .eq('id', carStoryId)

      if (updateError) throw updateError

      // Reload data
      await loadExperiences(resumeId)
      await loadCARStories(userId)
    } catch (error) {
      console.error('Error converting CAR story:', error)
      throw error
    }
  }

  const handleNewExperience = () => {
    setEditingExperience(undefined)
    setShowForm(true)
  }

  const handleEditExperience = (exp: WorkExperience) => {
    setEditingExperience(exp)
    setShowForm(true)
  }

  const handleDeleteExperience = async (expId: string) => {
    if (!confirm(t('common.confirmDelete'))) return

    try {
      const { error } = await supabase
        .from('work_experience')
        .delete()
        .eq('id', expId)

      if (error) throw error

      setExperiences(experiences.filter(e => e.id !== expId))
    } catch (error) {
      console.error('Error deleting experience:', error)
      setError('Failed to delete experience')
    }
  }

  const handleSaveExperience = async (exp: WorkExperience) => {
    if (!resumeId) return

    try {
      if (editingExperience?.id) {
        // Update
        const { error } = await supabase
          .from('work_experience')
          .update({
            company_name: exp.company_name,
            company_description: exp.company_description,
            location_city: exp.location_city,
            location_country: exp.location_country,
            job_title: exp.job_title,
            start_date: exp.start_date,
            end_date: exp.end_date,
            is_current: exp.is_current,
            scope_description: exp.scope_description,
            budget: exp.budget,
            headcount: exp.headcount,
            geographies: exp.geographies,
            vendors: exp.vendors,
            tools_systems: exp.tools_systems,
            order_index: exp.order_index
          })
          .eq('id', editingExperience.id)

        if (error) throw error
        trackEvent('audit', 'work_experience_updated', {}, 'work_experience', editingExperience.id)
      } else {
        // Create
        const { data, error } = await supabase
          .from('work_experience')
          .insert({
            resume_id: resumeId,
            company_name: exp.company_name,
            company_description: exp.company_description,
            location_city: exp.location_city,
            location_country: exp.location_country,
            job_title: exp.job_title,
            start_date: exp.start_date,
            end_date: exp.end_date,
            is_current: exp.is_current,
            scope_description: exp.scope_description,
            budget: exp.budget,
            headcount: exp.headcount,
            geographies: exp.geographies,
            vendors: exp.vendors,
            tools_systems: exp.tools_systems,
            order_index: experiences.length
          })
          .select()
          .single()

        if (error) throw error
        trackEvent('audit', 'work_experience_created', {}, 'work_experience', data.id)
      }

      await loadExperiences(resumeId)
      setShowForm(false)
      setEditingExperience(undefined)
    } catch (error) {
      console.error('Error saving experience:', error)
      throw error
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingExperience(undefined)
  }

  const handleImportFromResume = async () => {
    if (!importFile || !resumeId) return

    setImporting(true)
    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', importFile)
      formData.append('user_id', userId!)

      // Call backend API to parse resume with AI
      const response = await fetch(`${API_BASE_URL}/api/parse-resume`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Failed to parse resume')

      const parsed = await response.json()
      const { experiences: parsedExperiences, profile_summary, areas_of_excellence, contact } = parsed

      // Update the master resume with profile data if available
      const resumeUpdate: Record<string, any> = {}
      if (profile_summary) resumeUpdate.profile_summary = profile_summary
      if (areas_of_excellence?.length) resumeUpdate.areas_of_excellence = areas_of_excellence
      if (contact) {
        if (contact.full_name) resumeUpdate.full_name = contact.full_name
        if (contact.email) resumeUpdate.email = contact.email
        if (contact.phone) resumeUpdate.phone = contact.phone
        if (contact.city) resumeUpdate.city = contact.city
        if (contact.state) resumeUpdate.state = contact.state
        if (contact.country) resumeUpdate.country = contact.country
        if (contact.linkedin_url) resumeUpdate.linkedin_url = contact.linkedin_url
      }

      if (Object.keys(resumeUpdate).length > 0) {
        const { error } = await supabase
          .from('user_resumes')
          .update(resumeUpdate)
          .eq('id', resumeId)
        if (error) console.error('Error updating resume during import:', error)
        else trackEvent('audit', 'user_resume_updated', { source: 'import' }, 'user_resumes', resumeId)
      }

      // Insert each experience into database
      if (parsedExperiences) {
        for (const exp of parsedExperiences) {
          const { data, error } = await supabase
            .from('work_experience')
            .insert({
              resume_id: resumeId,
              company_name: exp.company_name,
              job_title: exp.job_title,
              location_city: exp.location_city,
              location_country: exp.location_country,
              start_date: exp.start_date,
              end_date: exp.end_date,
              is_current: exp.is_current || false,
              scope_description: exp.scope_description,
              order_index: experiences.length
            })
            .select()
            .single()

          if (error) throw error
          trackEvent('audit', 'work_experience_created', { source: 'import' }, 'work_experience', data.id)

          // Add ALL accomplishments (no limit)
          if (exp.accomplishments && data) {
            for (let i = 0; i < exp.accomplishments.length; i++) {
              const { data: newAccomplishment, error: accError } = await supabase
                .from('accomplishments')
                .insert({
                  work_experience_id: data.id,
                  bullet_text: exp.accomplishments[i],
                  order_index: i,
                  is_featured: false
                })
                .select()
                .single()
              if (accError) console.error('Error inserting accomplishment during import:', accError)
              else trackEvent('audit', 'accomplishment_created', { source: 'import' }, 'accomplishments', newAccomplishment.id)
            }
          }
        }
      }

      // Reload experiences and close modal
      await loadExperiences(resumeId)

      // Batch insert to Accomplishment Bank from parsed resume
      if (parsedExperiences && userId) {
        // Fetch existing bank items to check duplicates
        const { data: existingBankItems } = await supabase
          .from('accomplishment_bank')
          .select('bullet_text')
          .eq('user_id', userId)

        const existingTexts = new Set(existingBankItems?.map(i => i.bullet_text) || [])
        const newBankItems: any[] = []

        parsedExperiences.forEach(exp => {
          if (exp.accomplishments && Array.isArray(exp.accomplishments)) {
            exp.accomplishments.forEach(bullet => {
              if (bullet && !existingTexts.has(bullet)) {
                existingTexts.add(bullet) // prevent duplicates within same batch
                newBankItems.push({
                  user_id: userId,
                  bullet_text: bullet,
                  role_title: exp.job_title || '',
                  company_name: exp.company_name || '',
                  source: 'imported',
                  is_starred: false,
                  times_used: 1,
                  created_at: new Date().toISOString()
                })
              }
            })
          }
        })

        if (newBankItems.length > 0) {
          await supabase.from('accomplishment_bank').insert(newBankItems)
          console.log(`✅ Auto-imported ${newBankItems.length} items to bank`)
        }
      }

      // Sync to client profile (user_profiles AND users)
      if (contact && userId) {
        console.log('🔄 Syncing contact info to client profile...')

        // 1. Update user_profiles — only include non-null/non-empty values
        const profileUpdate: any = {
          user_id: userId,
          updated_at: new Date().toISOString()
        }
        if (contact.full_name) profileUpdate.full_name = contact.full_name
        if (contact.phone) profileUpdate.phone = contact.phone
        if (contact.linkedin_url) profileUpdate.linkedin_url = contact.linkedin_url
        const locationParts = [contact.city, contact.state, contact.country].filter(Boolean).join(', ')
        if (locationParts) profileUpdate.current_location = locationParts

        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert(profileUpdate, { onConflict: 'user_id' })

        if (profileError) console.error('Error syncing to user_profiles:', profileError)

        // 2. Update users table (public info) — only non-null values
        const usersUpdate: any = {}
        if (contact.full_name) usersUpdate.full_name = contact.full_name
        if (contact.phone) usersUpdate.phone = contact.phone
        if (contact.linkedin_url) usersUpdate.linkedin_url = contact.linkedin_url

        if (Object.keys(usersUpdate).length > 0) {
          const { error: userTableError } = await supabase
            .from('users')
            .update(usersUpdate)
            .eq('id', userId)

          if (userTableError) console.error('Error syncing to users table:', userTableError)
        }

        console.log('✅ Profile sync complete')
      }

      setShowImportModal(false)
      setImportFile(null)
    } catch (error) {
      console.error('Error importing from resume:', error)
      setError('Failed to import from resume. Please try again.')
    } finally {
      setImporting(false)
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

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-[#1E293B] dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-200">

        <div className="flex items-center justify-between mb-4">
          <BackButton
            to={isStandalone ? '/resume-builder' : '/resume/contact-info'}
            label={isStandalone ? t('resumeBuilder.menu.backToDashboard') : t('common.back')}
            className="text-white hover:text-gray-200"
          />
          {!isStandalone && (
            <button
              onClick={async () => {
                await trackEvent('analytics', 'step_completed', { step_name: 'work-experience', next_step: 'education' })
                navigate('/resume/education')
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all font-bold text-sm"
            >
              {t('resumeBuilder.menu.nextEducation') || 'Next: Education'}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {isStandalone && (
          <div className="flex space-x-6 mb-6 border-b border-gray-200 dark:border-gray-700">
            <button className="pb-3 border-b-2 border-blue-600 font-semibold text-blue-600 dark:text-blue-400">
              {t('resumeBuilder.menu.workExperience')}
            </button>
            <button
              onClick={() => navigate('/resume/education?mode=standalone')}
              className="pb-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 font-medium transition-colors"
            >
              {t('resumeBuilder.menu.education') || 'Education'}
            </button>
            <button
              onClick={() => navigate('/resume/accomplishment-library?mode=standalone')}
              className="pb-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 font-medium transition-colors"
            >
              Accomplishment Bank
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-300 dark:text-gray-400 mb-1">
              {t('resumeBuilder.steps.craft')} - {t('resumeBuilder.steps.step', { number: 2 })}
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {t('resumeBuilder.workExperience.title')}
            </h1>
            <p className="text-gray-300 mt-2">
              {t('resumeBuilder.menu.workExperienceDesc')}
            </p>
          </div>
          <div className="flex gap-3">
            {!showForm && (
              <>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="px-6 py-3 bg-white dark:bg-gray-700 border-2 border-primary-600 dark:border-primary-500 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-50 dark:hover:bg-gray-600 transition font-medium flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  {t('resumeBuilder.workExperience.importFromResume')}
                </button>
                <button
                  onClick={handleNewExperience}
                  className="px-6 py-3 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition font-medium"
                >
                  + {t('resumeBuilder.workExperience.addNew')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Form or List */}
      {showForm ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-200">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {editingExperience ? t('common.edit') : t('resumeBuilder.workExperience.addNew')}
          </h2>
          <WorkExperienceForm
            onSubmit={handleSaveExperience}
            onCancel={handleCancel}
            initialData={editingExperience}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {experiences.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center transition-colors duration-200">
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t('resumeBuilder.workExperience.noExperience')}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {t('resumeBuilder.workExperience.startAdding')}
              </p>
              <button
                onClick={handleNewExperience}
                className="px-6 py-3 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition font-medium"
              >
                {t('resumeBuilder.workExperience.addFirst')}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {experiences.map((exp, index) => (
                <div key={exp.id} className="bg-[#1E293B] dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-200">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{exp.job_title}</h3>
                      <p className="text-lg text-gray-300">{exp.company_name}</p>
                      <p className="text-sm text-gray-400 mb-4">
                        {exp.start_date} - {exp.is_current ? t('common.present') : exp.end_date}
                        {exp.location_city && ` • ${exp.location_city}`}
                      </p>
                    </div>
                    <div className="flex gap-2 text-sm">
                      <button
                        onClick={() => handleEditExperience(exp)}
                        className="px-3 py-1.5 text-blue-400 hover:text-blue-300 transition"
                      >
                        {t('common.edit')}
                      </button>
                      <button
                        onClick={() => handleDeleteExperience(exp.id!)}
                        className="px-3 py-1.5 text-red-400 hover:text-red-300 transition"
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                  </div>

                  {exp.scope_description && (
                    <p className="text-gray-300 text-sm mb-4 italic">{exp.scope_description}</p>
                  )}


                </div>
              ))}
            </div>
          )}
        </div>
      )}



      {/* Import from Resume Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full p-8 transition-colors duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('resumeBuilder.workExperience.importFromResume')}</h2>
              <button
                onClick={() => {
                  setShowImportModal(false)
                  setImportFile(null)
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {t('resumeBuilder.workExperience.importDescription')}
              </p>

              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition ${importFile ? 'border-green-400 bg-green-50 dark:bg-green-900/20 dark:border-green-600' : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 bg-gray-50 dark:bg-gray-700/50'
                  }`}
                onDrop={(e) => {
                  e.preventDefault()
                  const file = e.dataTransfer.files[0]
                  if (file && (file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
                    setImportFile(file)
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
              >
                {importFile ? (
                  <div>
                    <svg className="w-16 h-16 mx-auto text-green-500 dark:text-green-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{importFile.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{(importFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    <button
                      onClick={() => setImportFile(null)}
                      className="mt-3 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                    >
                      {t('resumeBuilder.workExperience.removeFile')}
                    </button>
                  </div>
                ) : (
                  <div>
                    <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {t('resumeBuilder.workExperience.dragDrop')}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('common.or')}</p>
                    <label className="px-6 py-3 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 cursor-pointer inline-block font-medium transition">
                      {t('resumeBuilder.workExperience.browseFiles')}
                      <input
                        type="file"
                        accept=".pdf,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) setImportFile(file)
                        }}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">{t('resumeBuilder.workExperience.supportFormat')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowImportModal(false)
                  setImportFile(null)
                }}
                className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition font-medium"
              >
                {t('resumeBuilder.workExperience.cancel')}
              </button>
              <button
                onClick={handleImportFromResume}
                disabled={!importFile || importing}
                className={`px-6 py-3 rounded-lg font-medium transition flex items-center gap-2 ${!importFile || importing
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-primary-600 dark:bg-primary-500 text-white hover:bg-primary-700 dark:hover:bg-primary-600'
                  }`}
              >
                {importing ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('resumeBuilder.workExperience.importing')}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    {t('resumeBuilder.workExperience.import')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Resume Preview Button */}
      {userId && <ResumePreview userId={userId} />}
    </div>
  )
}
export default WorkExperienceBuilder
