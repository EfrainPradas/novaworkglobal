import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  extractKeywordsFromJD,
  analyzeResumeMatch,
  analyzeJDAndResume,
  isOpenAIConfigured,
  type ExtractedKeyword,
  type ResumeData
} from '../../lib/openaiService'

import { BackButton } from '../../components/common/BackButton'

interface JDAnalysis {
  id?: string
  job_title: string
  company_name: string
  jd_text: string
  extracted_keywords: ExtractedKeyword[]
  match_score?: number
}

const JDAnalyzer: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [userId, setUserId] = useState<string | null>(null)
  const [resumeId, setResumeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [jdText, setJdText] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [analysis, setAnalysis] = useState<JDAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savedAnalyses, setSavedAnalyses] = useState<any[]>([])
  const [tailoredResumes, setTailoredResumes] = useState<any[]>([])
  const [viewingResume, setViewingResume] = useState<any | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const [sendToCompany, setSendToCompany] = useState('')
  const [sendMethod, setSendMethod] = useState('email')

  useEffect(() => {
    checkUser()
    checkForJobData()
    checkClipboard()
  }, [])

  const checkClipboard = async () => {
    try {
      // Check if clipboard API is available
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText()
        // If clipboard has substantial text (likely a JD), offer to paste it
        // Only proceed if no job data already exists from localStorage
        if (text && text.length > 200 && !jdText && !companyName && !jobTitle) {
          // Parse the clipboard content to extract company name, job title, and description
          const companyMatch = text.match(/Company:\s*(.+)/i)
          const positionMatch = text.match(/Position:\s*(.+)/i)
          const descriptionMatch = text.match(/---\s*Job Description\s*---\s*([\s\S]+)/i)

          let parsedCompany = companyMatch ? companyMatch[1].trim() : ''
          let parsedPosition = positionMatch ? positionMatch[1].trim() : ''
          let parsedDescription = descriptionMatch ? descriptionMatch[1].trim() : text

          // Auto-fill only if fields are empty
          if (parsedCompany && !companyName) setCompanyName(parsedCompany)
          if (parsedPosition && !jobTitle) setJobTitle(parsedPosition)
          if (parsedDescription && !jdText) setJdText(parsedDescription)

          console.log('✅ Auto-filled from clipboard:', { company: parsedCompany, position: parsedPosition })
        }
      }
    } catch (error) {
      // Clipboard access denied or not available - silently fail
      console.log('Clipboard access not available')
    }
  }

  const checkForJobData = () => {
    try {
      // Check if job data was passed from AI Recommendations (legacy key)
      let jobDataStr = localStorage.getItem('jd-analyzer-job-data')
      let source = 'ai-recommendations'

      // If not found, check for new company shortlist data
      if (!jobDataStr) {
        jobDataStr = localStorage.getItem('jobAnalysisData')
        source = 'company-shortlist'
      }

      if (jobDataStr) {
        const jobData = JSON.parse(jobDataStr)

        // Auto-fill the form with job data (handle both naming conventions)
        if (jobData.jobTitle || jobData.title) setJobTitle(jobData.jobTitle || jobData.title)
        if (jobData.companyName || jobData.company) setCompanyName(jobData.companyName || jobData.company)
        if (jobData.jobDescription || jobData.description) setJdText(jobData.jobDescription || jobData.description)

        // Clear the localStorage so it doesn't persist on page reload
        if (source === 'ai-recommendations') {
          localStorage.removeItem('jd-analyzer-job-data')
        } else {
          localStorage.removeItem('jobAnalysisData')
        }

        console.log(`✅ Auto-filled from ${source}:`, {
          company: jobData.companyName || jobData.company,
          position: jobData.jobTitle || jobData.title,
          hasDescription: !!(jobData.jobDescription || jobData.description)
        })
      }
    } catch (error) {
      console.error('Error loading job data:', error)
    }
  }

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
      await loadResume(user.id)
      await loadSavedAnalyses(user.id)
      await loadTailoredResumes(user.id)
    } else {
      setLoading(false)
    }
  }

  const loadResume = async (uid: string) => {
    try {
      const { data: resumes, error } = await supabase
        .from('user_resumes')
        .select('id')
        .eq('user_id', uid)
        .eq('is_master', true)
        .limit(1)

      const resume = resumes?.[0]

      if (error) throw error
      if (resume) setResumeId(resume.id)
    } catch (error) {
      console.error('Error loading resume:', error)
      setError('Failed to load resume')
    } finally {
      setLoading(false)
    }
  }

  const loadSavedAnalyses = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('job_description_analysis')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setSavedAnalyses(data || [])
    } catch (error) {
      console.error('Error loading analyses:', error)
    }
  }

  const handleAnalyze = async () => {
    if (!jdText.trim() || !userId || !resumeId) {
      setError('Please provide a job description')
      return
    }

    // Check if OpenAI is configured
    if (!isOpenAIConfigured()) {
      setError('OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY to your .env.local file.')
      return
    }

    setAnalyzing(true)
    setError(null)

    try {
      console.log('🔍 Step 1: Loading user resume data...')

      // Step 1: Load user's resume data for matching
      const resumeData = await loadResumeData(userId, resumeId)
      console.log('✅ Resume data loaded')

      console.log('🔍 Step 2: Analyzing job description and resume match with AI...')

      // Step 2: Combined job description and resume analysis using backend API
      const { keywords, matchScore, matchedKeywords, keywordMapping } = await analyzeJDAndResume(
        jdText,
        resumeData
      )
      console.log('✅ Combined analysis complete. Score:', matchScore)
      console.log('🔍 Keywords received:', keywords.map(k => ({
        keyword: k.keyword,
        match: k.currentMatch,
        reason: k.matchReason
      })))

      const newAnalysis: JDAnalysis = {
        job_title: jobTitle,
        company_name: companyName,
        jd_text: jdText,
        extracted_keywords: keywords, // ✅ ALL keywords, not just matched ones
        match_score: matchScore
      }

      setAnalysis(newAnalysis)

      console.log('💾 Step 4: Saving analysis to database...')

      // Step 4: Save to database
      const { data, error: saveError } = await supabase
        .from('job_description_analysis')
        .insert({
          user_id: userId,
          job_title: jobTitle,
          company_name: companyName,
          job_description_text: jdText,
          top_keywords: matchedKeywords,
          keyword_mapping: keywordMapping,
          extracted_requirements: { match_score: matchScore }
        })
        .select()
        .single()

      if (saveError) throw saveError

      console.log('✅ Analysis saved successfully')

      // Reload saved analyses
      await loadSavedAnalyses(userId)

    } catch (error: any) {
      console.error('❌ Error analyzing JD:', error)
      setError(error.message || 'Failed to analyze job description. Please try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  // Helper function to load user's resume data
  const loadResumeData = async (uid: string, resId: string): Promise<ResumeData> => {
    try {
      // Load profile summary and areas of excellence
      const { data: resume, error: resumeError } = await supabase
        .from('user_resumes')
        .select('profile_summary, areas_of_excellence')
        .eq('id', resId)
        .single()

      if (resumeError) {
        console.warn('Resume error:', resumeError)
      }

      // Load PAR stories - don't throw on error, just log
      const { data: parStories, error: parError } = await supabase
        .from('par_stories')
        .select('problem_challenge, actions, result')
        .eq('user_id', uid)

      if (parError) {
        console.warn('PAR stories error:', parError)
      }

      // Load work experience with dates
      const { data: workExp, error: workExpError } = await supabase
        .from('work_experience')
        .select('job_title, company_name, scope_description, start_date, end_date, is_current')
        .eq('resume_id', resId)
        .order('start_date', { ascending: false })

      if (workExpError) {
        console.warn('Work experience error:', workExpError)
      }

      // Load user contact info from user_resumes (if available)
      const { data: userInfo } = await supabase
        .from('user_resumes')
        .select('full_name, email, phone, linkedin_url, location_city, location_country')
        .eq('id', resId)
        .single()

      return {
        profile_summary: resume?.profile_summary || '',
        areas_of_excellence: resume?.areas_of_excellence || [],
        par_stories: parStories || [],
        work_experience: workExp || [],
        user_info: userInfo || {}
      }
    } catch (error) {
      console.error('Error loading resume data:', error)
      // Don't throw - return empty data instead
      return {
        profile_summary: '',
        areas_of_excellence: [],
        par_stories: [],
        work_experience: [],
        user_info: {}
      }
    }
  }

  const handleLoadAnalysis = (savedAnalysis: any) => {
    setJobTitle(savedAnalysis.job_title || '')
    setCompanyName(savedAnalysis.company_name || '')
    setJdText(savedAnalysis.job_description_text || '')
    setAnalysis({
      id: savedAnalysis.id,
      job_title: savedAnalysis.job_title,
      company_name: savedAnalysis.company_name,
      jd_text: savedAnalysis.job_description_text,
      extracted_keywords: savedAnalysis.top_keywords || [],
      match_score: savedAnalysis.extracted_requirements?.match_score || 0
    })
  }

  const handleReset = () => {
    setJobTitle('')
    setCompanyName('')
    setJdText('')
    setAnalysis(null)
    setError(null)
  }

  const handleAddKeyword = async (keyword: ExtractedKeyword) => {
    if (!userId || !resumeId) {
      setError('User or resume not found')
      return
    }

    try {
      // Always add to areas_of_excellence, regardless of whereItGoes
      const { data: resume, error: fetchError } = await supabase
        .from('user_resumes')
        .select('areas_of_excellence')
        .eq('id', resumeId)
        .single()

      if (fetchError) throw fetchError

      const currentAreas = resume?.areas_of_excellence || []

      // Check if keyword already exists (case-insensitive)
      const keywordLower = keyword.keyword.toLowerCase().trim()
      const alreadyExists = currentAreas.some(area => area.toLowerCase().trim() === keywordLower)

      if (!alreadyExists) {
        const { error: updateError } = await supabase
          .from('user_resumes')
          .update({
            areas_of_excellence: [...currentAreas, keyword.keyword]
          })
          .eq('id', resumeId)

        if (updateError) throw updateError
      }

      // Update the keyword status in the current analysis (regardless of whether it was just added or already existed)
      if (analysis) {
        const updatedKeywords = analysis.extracted_keywords.map(kw =>
          kw.keyword.toLowerCase().trim() === keywordLower ? { ...kw, currentMatch: true } : kw
        )

        const newMatchScore = Math.round((updatedKeywords.filter(k => k.currentMatch).length / updatedKeywords.length) * 100)

        // Update the analysis state
        setAnalysis({
          ...analysis,
          extracted_keywords: updatedKeywords,
          match_score: newMatchScore
        })

        // Update the saved analysis in the database
        const updatedRequirements = {
          ...(analysis.extracted_requirements || {}),
          match_score: newMatchScore
        }

        const { error: updateError } = await supabase
          .from('job_description_analysis')
          .update({
            top_keywords: updatedKeywords,
            extracted_requirements: updatedRequirements
          })
          .eq('id', analysis.id)

        if (updateError) {
          console.error('Error updating analysis:', updateError)
        } else {
          // Reload saved analyses to reflect the update
          await loadSavedAnalyses(userId)
        }

        // Show appropriate message based on whether it was added or already existed
        let message = alreadyExists
          ? `✅ "${keyword.keyword}" is already in your Areas of Excellence. Match updated!`
          : `✅ "${keyword.keyword}" added to your Areas of Excellence!`

        message += `\nMatch Score updated: ${newMatchScore}%`

        if (keyword.whereItGoes === 'accomplishments') {
          message += '\n\n💡 Tip: Also consider adding this to your PAR Stories to demonstrate it with specific examples.'
        } else if (keyword.whereItGoes === 'work_experience') {
          message += '\n\n💡 Tip: Also mention this in your work experience descriptions to reinforce it.'
        }

        alert(message)
      }
    } catch (error: any) {
      console.error('Error adding keyword:', error)
      setError('Failed to add keyword: ' + error.message)
    }
  }

  const handleGenerateTailoredResume = async () => {
    if (!userId || !resumeId || !analysis) {
      setError('Missing required data')
      return
    }

    setGenerating(true)
    setError(null)

    try {
      console.log('🎨 Generating tailored resume...')

      // Load full resume data
      const resumeData = await loadResumeData(userId, resumeId)

      // Create tailored version - save to database
      const { data: tailoredResume, error: saveError } = await supabase
        .from('tailored_resumes')
        .insert({
          user_id: userId,
          master_resume_id: resumeId,
          jd_analysis_id: analysis.id,
          company_name: companyName,
          job_title: jobTitle,
          tailored_profile: resumeData.profile_summary || '',
          tailored_skills: resumeData.areas_of_excellence || [],
          tailored_bullets: {
            par_stories: resumeData.par_stories || [],
            work_experience: resumeData.work_experience || [],
            user_info: resumeData.user_info || {}
          },
          match_score: analysis.match_score || 0,
          status: 'draft'
        })
        .select()
        .single()

      if (saveError) throw saveError

      console.log('✅ Tailored resume created:', tailoredResume)

      alert(`✅ Tailored resume generated for ${companyName}!\n\nYou can now edit it manually or export it.`)

      // Reload tailored resumes
      await loadTailoredResumes(userId)

    } catch (error: any) {
      console.error('❌ Error generating tailored resume:', error)
      setError('Failed to generate tailored resume: ' + error.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleEditResumeManually = () => {
    if (!analysis) {
      alert('Please analyze a job description first')
      return
    }

    // Store current analysis for editing context
    sessionStorage.setItem('jd_analysis_for_edit', JSON.stringify({
      jobTitle,
      companyName,
      keywords: analysis.extracted_keywords
    }))

    // Navigate to profile builder with edit mode
    navigate('/resume-builder/profile?mode=edit')
  }

  const loadTailoredResumes = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('tailored_resumes')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setTailoredResumes(data || [])
    } catch (error) {
      console.error('Error loading tailored resumes:', error)
    }
  }

  // OPCIÓN A: Ver/Editar Resume
  const handleViewResume = async (resume: any) => {
    // If resume doesn't have user_info, load it from user_resumes
    if (!resume.tailored_bullets?.user_info?.full_name && resumeId) {
      const { data: userInfo } = await supabase
        .from('user_resumes')
        .select('full_name, email, phone, linkedin_url, location_city, location_country')
        .eq('id', resumeId)
        .single()

      if (userInfo) {
        resume = {
          ...resume,
          tailored_bullets: {
            ...resume.tailored_bullets,
            user_info: userInfo
          }
        }
      }
    }

    setViewingResume(resume)
    setShowViewModal(true)
  }

  // OPCIÓN B: Exportar a PDF
  const handleExportPDF = async (resume: any) => {
    try {
      // If resume doesn't have user_info, load it from user_resumes
      if (!resume.tailored_bullets?.user_info?.full_name && resumeId) {
        const { data: userInfo } = await supabase
          .from('user_resumes')
          .select('full_name, email, phone, linkedin_url, location_city, location_country')
          .eq('id', resumeId)
          .single()

        if (userInfo) {
          resume = {
            ...resume,
            tailored_bullets: {
              ...resume.tailored_bullets,
              user_info: userInfo
            }
          }
        }
      }

      // Build PAR Stories HTML
      const parStoriesHTML = (resume.tailored_bullets?.par_stories || []).map((story: any) => {
        const actions = Array.isArray(story.actions) ? story.actions : [story.actions]
        const actionsHTML = actions.map((action: string) => `<li>${action}</li>`).join('')
        return `
          <div style="margin-bottom: 30px;">
            <p style="text-align: justify; line-height: 1.6; margin-bottom: 8px;">
              <strong>Problem/Challenge:</strong> ${story.problem_challenge}
            </p>
            <div style="margin-left: 20px; margin-bottom: 8px;">
              <p style="margin-bottom: 5px;"><strong>Actions:</strong></p>
              <ul style="margin: 0; padding-left: 20px; list-style-type: disc;">
                ${actionsHTML}
              </ul>
            </div>
            <p style="text-align: justify; line-height: 1.6;">
              <strong>Results:</strong> ${story.result}
            </p>
          </div>
        `
      }).join('')

      // Build Work Experience HTML with dates
      const workExpHTML = (resume.tailored_bullets?.work_experience || []).map((exp: any) => {
        const formatDate = (dateStr: string | undefined) => {
          if (!dateStr) return ''

          // Handle "YYYY" format (e.g., "2020")
          if (/^\d{4}$/.test(dateStr)) {
            return dateStr
          }

          // Handle "MM/YYYY" format (e.g., "01/2020")
          if (/^\d{2}\/\d{4}$/.test(dateStr)) {
            return dateStr.split('/')[1]  // Extract year part
          }

          // Handle other potential formats or return as-is
          return dateStr
        }

        const startYear = formatDate(exp.start_date)
        const endYear = exp.is_current ? 'Present' : formatDate(exp.end_date)
        const dateRange = startYear && endYear ? `${startYear} – ${endYear}` : ''

        return `
        <div style="margin-bottom: 25px;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 5px;">
            <h4 style="font-size: 16px; font-weight: bold; color: #111; margin: 0;">
              ${exp.job_title}
            </h4>
            ${dateRange ? `<span style="font-size: 14px; font-weight: 600; color: #666; white-space: nowrap; margin-left: 10px;">${dateRange}</span>` : ''}
          </div>
          <p style="font-weight: 600; margin-bottom: 10px; color: #333;">
            ${exp.company_name}
          </p>
          <p style="text-align: justify; line-height: 1.6; color: #333;">
            ${exp.scope_description}
          </p>
        </div>
        `
      }).join('')

      // Build Areas of Excellence HTML (pipe-separated)
      const skillsText = (resume.tailored_skills || []).join(' | ')

      // Build User Header HTML
      const userInfo = resume.tailored_bullets?.user_info || {}
      const contactParts = []

      // Build location string
      const locationParts = [userInfo.location_city, userInfo.location_country].filter(Boolean)
      if (locationParts.length > 0) {
        contactParts.push(locationParts.join(', '))
      }

      if (userInfo.phone) contactParts.push(userInfo.phone)
      if (userInfo.email) contactParts.push(userInfo.email)
      if (userInfo.linkedin_url) contactParts.push(`<a href="${userInfo.linkedin_url}" style="color: #2563eb; text-decoration: none;">LinkedIn</a>`)
      const contactLine = contactParts.join(' • ')

      const headerHTML = userInfo.full_name ? `
        <div style="text-align: center; border-bottom: 2px solid #ccc; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="font-size: 28px; font-weight: bold; color: #111; margin: 0 0 10px 0;">
            ${userInfo.full_name}
          </h1>
          <p style="font-size: 14px; color: #333; margin: 0;">
            ${contactLine}
          </p>
        </div>
      ` : ''

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${resume.job_title} - ${resume.company_name}</title>
  <style>
    body {
      font-family: Georgia, serif;
      margin: 40px 60px;
      color: #333;
      line-height: 1.6;
    }
    h2 {
      font-size: 18px;
      font-weight: bold;
      color: #111;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 8px;
      margin-top: 30px;
      margin-bottom: 15px;
    }
    .section {
      margin-bottom: 30px;
    }
    .profile-text {
      text-align: justify;
      line-height: 1.6;
      color: #333;
    }
    .skills-text {
      line-height: 1.6;
      color: #333;
    }
    ul {
      line-height: 1.6;
    }
    li {
      margin-bottom: 5px;
    }
  </style>
</head>
<body>
  ${headerHTML}

  <div class="section">
    <h2>Professional Profile</h2>
    <p class="profile-text">${resume.tailored_profile || 'N/A'}</p>
  </div>

  <div class="section">
    <h2>Areas of Excellence</h2>
    <p class="skills-text">${skillsText}</p>
  </div>

  ${parStoriesHTML ? `
  <div class="section">
    <h2>Key Accomplishments</h2>
    ${parStoriesHTML}
  </div>
  ` : ''}

  ${workExpHTML ? `
  <div class="section">
    <h2>Work Experience</h2>
    ${workExpHTML}
  </div>
  ` : ''}
</body>
</html>
      `

      // Open in new window for printing (Save as PDF)
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(htmlContent)
        printWindow.document.close()
        printWindow.focus()

        // Wait for styles/content to load then print
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 500)
      } else {
        alert('Please allow popups to export the resume.')
      }
    } catch (error: any) {
      console.error('Error exporting:', error)
      alert('Failed to export resume: ' + error.message)
    }
  }

  // OPCIÓN C: Marcar como Enviado
  const handleMarkAsSent = (resume: any) => {
    setViewingResume(resume)
    setSendToCompany(resume.company_name || '')
    setShowSendModal(true)
  }

  const handleConfirmSent = async () => {
    if (!viewingResume || !sendToCompany.trim()) {
      alert('Please enter the recipient name/email')
      return
    }

    try {
      const { error } = await supabase
        .from('tailored_resumes')
        .update({
          status: 'sent',
          application_status: 'sent',
          sent_to_company: sendToCompany,
          sent_at: new Date().toISOString(),
          last_status_update: new Date().toISOString()
        })
        .eq('id', viewingResume.id)

      if (error) throw error

      alert(`✅ Resume marked as sent to ${sendToCompany}!`)
      setShowSendModal(false)
      setSendToCompany('')
      setViewingResume(null)

      // Reload tailored resumes
      if (userId) await loadTailoredResumes(userId)
    } catch (error: any) {
      console.error('Error marking as sent:', error)
      alert('Failed to update: ' + error.message)
    }
  }

  if (!userId) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded">
          {t('common.pleaseSignIn')}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <div className="text-gray-600 dark:text-gray-400">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <BackButton to="/job-search-hub" label="Back to Job Search" className="pl-0" />
        </div>
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            {t('resumeBuilder.steps.target')} - Step 3
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Job Description Analyzer
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Extract top keywords from a job description and map them to your resume for ATS optimization
          </p>
        </div>
      </div>

      {/* Resume Tracker Quick Access */}
      {tailoredResumes.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                📊 Resume Tracker
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                You have <strong>{tailoredResumes.length}</strong> tailored resume{tailoredResumes.length !== 1 ? 's' : ''}.{' '}
                <strong>{tailoredResumes.filter(tr => tr.status === 'sent').length}</strong> sent,{' '}
                <strong>{tailoredResumes.filter(tr => tr.status === 'draft').length}</strong> draft.
              </p>
            </div>
            <button
              onClick={() => navigate('/resume-builder/tracking')}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold transition-colors whitespace-nowrap"
            >
              View Full Tracker →
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Input */}
        <div className="lg:col-span-2 space-y-6">
          {/* JD Input Form */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Job Description Input</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Job Title *
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Senior Product Manager"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Google"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Job Description * (paste full text)
                </label>
                <button
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText()
                      if (text) {
                        setJdText(text)
                      } else {
                        alert('Clipboard is empty')
                      }
                    } catch (error) {
                      alert('Unable to access clipboard. Please paste manually using Ctrl+V')
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 transition-all text-sm font-medium"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  Paste from Clipboard
                </button>
              </div>
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                rows={12}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                placeholder="Paste the complete job description here..."
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {jdText.length} characters • {jdText.split(/\s+/).filter(w => w).length} words
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAnalyze}
                disabled={analyzing || !jdText.trim()}
                className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium"
              >
                {analyzing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </span>
                ) : (
                  '🔍 Analyze JD & Extract Keywords'
                )}
              </button>

              <button
                onClick={() => navigate('/resume/cover-letter', {
                  state: {
                    jobTitle,
                    companyName,
                    jobDescription: jdText
                  }
                })}
                disabled={!jdText.trim() || !jobTitle.trim()}
                title="Generate Cover Letter directly"
                className="px-4 py-3 bg-orange-100 text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                ✉️
              </button>

              {analysis && (
                <button
                  onClick={handleReset}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Analysis Results */}
          {analysis && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Keyword Analysis</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Match Score:</span>
                  <span className={`text-2xl font-bold ${(analysis.match_score || 0) >= 70 ? 'text-green-600 dark:text-green-400' :
                    (analysis.match_score || 0) >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                    {analysis.match_score}%
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400">
                Top 15 ATS keywords extracted from the job description
              </p>

              {/* Debug Info */}
              <div className="mb-4 p-2 bg-yellow-100 text-xs">
                <strong>DEBUG:</strong> Total keywords received: {analysis.extracted_keywords.length} |
                Matched: {analysis.extracted_keywords.filter(k => k.currentMatch).length} |
                Not matched: {analysis.extracted_keywords.filter(k => !k.currentMatch).length}
              </div>

              {/* Keywords Table - Simplified */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm table-fixed border-collapse border border-gray-300 dark:border-gray-600">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left text-xs font-semibold">Keyword</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center text-xs font-semibold">Match</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left text-xs font-semibold">Explanation</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center text-xs font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {console.log(`Total keywords to render: ${analysis.extracted_keywords.length}`) ||
                      analysis.extracted_keywords.map((kw, idx) => {
                        console.log(`Keyword ${idx}: "${kw.keyword}" - match: ${kw.currentMatch}`);
                        return (
                          <tr key={idx} className="border border-gray-300 dark:border-gray-600">
                            <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 font-medium text-xs">{kw.keyword}</td>
                            <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">
                              {kw.currentMatch ? (
                                <span className="text-green-600 dark:text-green-400 font-bold text-sm">✓</span>
                              ) : (
                                <span className="text-red-600 dark:text-red-400 font-bold text-sm">✗</span>
                              )}
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-xs">
                              {kw.currentMatch ? (
                                <span className="text-green-700">Found in your resume</span>
                              ) : (
                                <div>
                                  <span className="text-red-700 font-medium">Not found</span>
                                  {kw.matchReason && (
                                    <div className="text-gray-600 dark:text-gray-400 italic mt-1" title={kw.matchReason}>
                                      {kw.matchReason.length > 80 ? `${kw.matchReason.substring(0, 80)}...` : kw.matchReason}
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-center">
                              {!kw.currentMatch && (
                                <button
                                  onClick={() => handleAddKeyword(kw)}
                                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                                >
                                  + Add to Resume
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={handleGenerateTailoredResume}
                  disabled={generating}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? '⏳ Generating...' : '📄 Generate Tailored Resume'}
                </button>
                <button
                  onClick={handleEditResumeManually}
                  className="flex-1 px-6 py-3 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 font-medium"
                >
                  ✏️ Edit Resume to Match (Manually)
                </button>
              </div>

              {/* Cover Letter Action */}
              <div className="pt-4 border-t">
                <button
                  onClick={() => navigate('/resume/cover-letter', {
                    state: {
                      jobTitle,
                      companyName,
                      jobDescription: jdText
                    }
                  })}
                  className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium flex items-center justify-center gap-2"
                >
                  <span>✉️</span> Generate Cover Letter for this Role
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Saved Analyses & Tailored Resumes */}
        <div className="lg:col-span-1 space-y-6">
          {/* Recent Analyses */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📋 Recent Analyses</h3>

            {savedAnalyses.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                No saved analyses yet. Analyze a job description to get started.
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {savedAnalyses.map((sa) => (
                  <button
                    key={sa.id}
                    onClick={() => handleLoadAnalysis(sa)}
                    className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition"
                  >
                    <div className="font-medium text-gray-900 dark:text-white text-sm">{sa.job_title || 'Untitled Position'}</div>
                    {sa.company_name && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{sa.company_name}</div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(sa.created_at).toLocaleDateString()}
                      </span>
                      {sa.extracted_requirements?.match_score && (
                        <span className={`text-xs font-semibold ${sa.extracted_requirements.match_score >= 70 ? 'text-green-600 dark:text-green-400' :
                          sa.extracted_requirements.match_score >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-red-600 dark:text-red-400'
                          }`}>
                          {sa.extracted_requirements.match_score}% match
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tailored Resumes Section */}
          {tailoredResumes.length > 0 && (
            <div id="tailored-resumes-section" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📄 Tailored Resumes</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {tailoredResumes.map((tr) => (
                  <div
                    key={tr.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white text-sm">{tr.job_title || 'Untitled Position'}</div>
                        {tr.company_name && (
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{tr.company_name}</div>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(tr.created_at).toLocaleString()}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded ${tr.status === 'sent' ? 'bg-green-100 text-green-700' :
                            tr.status === 'draft' ? 'bg-gray-100 dark:bg-gray-700 dark:text-gray-300 text-gray-700 dark:text-gray-300' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                            {tr.status}
                          </span>
                        </div>
                        {tr.sent_to_company && tr.sent_at && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            ✉️ Sent to {tr.sent_to_company} on {new Date(tr.sent_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 ml-2">
                        <button
                          onClick={() => handleViewResume(tr)}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 whitespace-nowrap"
                        >
                          👁️ View
                        </button>
                        <button
                          onClick={() => handleExportPDF(tr)}
                          className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 whitespace-nowrap"
                        >
                          📄 Export
                        </button>
                        {tr.status !== 'sent' && (
                          <button
                            onClick={() => handleMarkAsSent(tr)}
                            className="px-3 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 whitespace-nowrap"
                          >
                            ✉️ Mark Sent
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Ver Resume (Opción A) */}
      {
        showViewModal && viewingResume && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {viewingResume.job_title} - {viewingResume.company_name}
                </h2>
                <button
                  onClick={() => {
                    setShowViewModal(false)
                    setViewingResume(null)
                  }}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="p-8 space-y-8 bg-white" style={{ fontFamily: 'Georgia, serif' }}>
                {/* Header with User Info */}
                {(viewingResume.tailored_bullets?.user_info?.full_name || userId) && (
                  <div className="text-center border-b-2 border-gray-300 pb-6 mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {viewingResume.tailored_bullets.user_info.full_name || 'Your Name'}
                    </h1>
                    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-gray-700">
                      {(viewingResume.tailored_bullets.user_info.location_city || viewingResume.tailored_bullets.user_info.location_country) && (
                        <span>
                          {[viewingResume.tailored_bullets.user_info.location_city, viewingResume.tailored_bullets.user_info.location_country].filter(Boolean).join(', ')}
                        </span>
                      )}
                      {viewingResume.tailored_bullets.user_info.phone && (
                        <span>{viewingResume.tailored_bullets.user_info.phone}</span>
                      )}
                      {viewingResume.tailored_bullets.user_info.email && (
                        <span>{viewingResume.tailored_bullets.user_info.email}</span>
                      )}
                      {viewingResume.tailored_bullets.user_info.linkedin_url && (
                        <span>
                          <a href={viewingResume.tailored_bullets.user_info.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                            LinkedIn
                          </a>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Professional Profile */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b-2 border-primary-600">
                    Professional Profile
                  </h3>
                  <p className="text-gray-800 leading-relaxed text-justify">
                    {viewingResume.tailored_profile || 'N/A'}
                  </p>
                </div>

                {/* Areas of Excellence */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b-2 border-primary-600">
                    Areas of Excellence
                  </h3>
                  <p className="text-gray-800 leading-relaxed">
                    {(viewingResume.tailored_skills || []).join(' | ')}
                  </p>
                </div>

                {/* Key Accomplishments (PAR Stories) */}
                {viewingResume.tailored_bullets?.par_stories && viewingResume.tailored_bullets.par_stories.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b-2 border-primary-600">
                      Key Accomplishments
                    </h3>
                    <div className="space-y-5">
                      {viewingResume.tailored_bullets.par_stories.map((story: any, idx: number) => {
                        const actions = Array.isArray(story.actions) ? story.actions : [story.actions]
                        return (
                          <div key={idx} className="space-y-2">
                            <p className="text-gray-800 leading-relaxed">
                              <span className="font-semibold text-gray-900">Problem/Challenge: </span>
                              {story.problem_challenge}
                            </p>
                            <div className="pl-4">
                              <p className="font-semibold text-gray-900 mb-1">Actions:</p>
                              <ul className="list-none space-y-1">
                                {actions.map((action: string, aidx: number) => (
                                  <li key={aidx} className="text-gray-800 leading-relaxed flex">
                                    <span className="mr-2">•</span>
                                    <span>{action}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <p className="text-gray-800 leading-relaxed">
                              <span className="font-semibold text-gray-900">Results: </span>
                              {story.result}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Work Experience */}
                {viewingResume.tailored_bullets?.work_experience && viewingResume.tailored_bullets.work_experience.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b-2 border-primary-600">
                      Work Experience
                    </h3>
                    <div className="space-y-5">
                      {viewingResume.tailored_bullets.work_experience.map((exp: any, idx: number) => {
                        const formatDate = (dateStr: string | undefined) => {
                          if (!dateStr) return ''

                          // Handle "YYYY" format (e.g., "2020")
                          if (/^\d{4}$/.test(dateStr)) {
                            return dateStr
                          }

                          // Handle "MM/YYYY" format (e.g., "01/2020")
                          if (/^\d{2}\/\d{4}$/.test(dateStr)) {
                            return dateStr.split('/')[1]  // Extract year part
                          }

                          // Handle other potential formats or return as-is
                          return dateStr
                        }

                        const startYear = formatDate(exp.start_date)
                        const endYear = exp.is_current ? 'Present' : formatDate(exp.end_date)
                        const dateRange = startYear && endYear ? `${startYear} – ${endYear}` : ''

                        return (
                          <div key={idx}>
                            <div className="flex items-start justify-between mb-1">
                              <h4 className="font-bold text-gray-900 text-lg">
                                {exp.job_title}
                              </h4>
                              {dateRange && (
                                <span className="text-sm text-gray-600 font-semibold whitespace-nowrap ml-4">
                                  {dateRange}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-700 font-semibold mb-2">{exp.company_name}</p>
                            <p className="text-gray-800 leading-relaxed text-justify">
                              {exp.scope_description}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => handleExportPDF(viewingResume)}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                  >
                    📄 Export as PDF
                  </button>
                  {viewingResume.status !== 'sent' && (
                    <button
                      onClick={() => {
                        setShowViewModal(false)
                        handleMarkAsSent(viewingResume)
                      }}
                      className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold"
                    >
                      ✉️ Mark as Sent
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Modal: Marcar como Enviado (Opción C) */}
      {
        showSendModal && viewingResume && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Mark Resume as Sent</h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={viewingResume.job_title}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sent To (Name/Email) *
                  </label>
                  <input
                    type="text"
                    value={sendToCompany}
                    onChange={(e) => setSendToCompany(e.target.value)}
                    placeholder="e.g., John Doe - john@company.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Send Method
                  </label>
                  <select
                    value={sendMethod}
                    onChange={(e) => setSendMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="email">Email</option>
                    <option value="portal">Company Portal</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 p-3 rounded">
                  <strong>Note:</strong> The current date and time will be recorded as the send date.
                </div>
              </div>

              <div className="px-6 py-4 border-t flex gap-3">
                <button
                  onClick={() => {
                    setShowSendModal(false)
                    setSendToCompany('')
                    setViewingResume(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSent}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  ✉️ Confirm Sent
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  )
}

export default JDAnalyzer
