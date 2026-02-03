import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { Eye, Download, Send, Calendar, Building2, Briefcase, Filter, Search, ChevronDown } from 'lucide-react'

interface TailoredResume {
  id: string
  user_id: string
  master_resume_id: string
  jd_analysis_id: string
  company_name: string
  job_title: string
  tailored_profile: string
  tailored_skills: string[]
  tailored_bullets: any
  match_score: number
  status: 'draft' | 'sent' | 'reviewed'
  application_status: string
  sent_to_company: string
  sent_at: string
  last_status_update: string
  created_at: string
  updated_at: string
}

export const ResumeTracker: React.FC = () => {
  const navigate = useNavigate()
  const [userId, setUserId] = useState<string | null>(null)
  const [resumeId, setResumeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [resumes, setResumes] = useState<TailoredResume[]>([])
  const [filteredResumes, setFilteredResumes] = useState<TailoredResume[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [viewingResume, setViewingResume] = useState<TailoredResume | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const [sendToCompany, setSendToCompany] = useState('')
  const [exportFormat, setExportFormat] = useState<'html' | 'word'>('html')

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      // Close all dropdowns when clicking outside
      document.querySelectorAll('[id^="export-dropdown-"]').forEach(dropdown => {
        if (!target.closest(`#${dropdown.id}`) && !target.closest('button')) {
          dropdown.classList.add('hidden')
        }
      })
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    filterResumes()
  }, [resumes, searchTerm, statusFilter])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
      await loadResume(user.id)
      await loadTailoredResumes(user.id)
    } else {
      setLoading(false)
    }
  }

  const loadResume = async (uid: string) => {
    try {
      const { data: resume, error } = await supabase
        .from('user_resumes')
        .select('id')
        .eq('user_id', uid)
        .eq('is_master', true)
        .single()

      if (error) throw error
      setResumeId(resume.id)
    } catch (error) {
      console.error('Error loading resume:', error)
    }
  }

  const loadTailoredResumes = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('tailored_resumes')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })

      if (error) throw error
      setResumes(data || [])
    } catch (error) {
      console.error('Error loading tailored resumes:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterResumes = () => {
    let filtered = [...resumes]

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(r =>
        r.company_name?.toLowerCase().includes(term) ||
        r.job_title?.toLowerCase().includes(term)
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.application_status === statusFilter)
    }

    setFilteredResumes(filtered)
  }

  const handleViewResume = async (resume: TailoredResume) => {
    // Load user info if not present
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

  const handleExportResume = async (resume: TailoredResume, format: 'html' | 'word' = 'html') => {
    try {
      // Load user info if not present
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

      // Build Work Experience HTML
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

      // Build Areas of Excellence HTML
      const skillsText = (resume.tailored_skills || []).join(' | ')

      // Build User Header HTML
      const userInfo = resume.tailored_bullets?.user_info || {}
      const contactParts = []
      const locationParts = [userInfo.location_city, userInfo.location_country].filter(Boolean)
      if (locationParts.length > 0) contactParts.push(locationParts.join(', '))
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
    body { font-family: Georgia, serif; margin: 40px 60px; color: #333; line-height: 1.6; }
    h2 { font-size: 18px; font-weight: bold; color: #111; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-top: 30px; margin-bottom: 15px; }
    .section { margin-bottom: 30px; }
    .profile-text { text-align: justify; line-height: 1.6; color: #333; }
    .skills-text { line-height: 1.6; color: #333; }
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
  ${parStoriesHTML ? `<div class="section"><h2>Key Accomplishments</h2>${parStoriesHTML}</div>` : ''}
  ${workExpHTML ? `<div class="section"><h2>Work Experience</h2>${workExpHTML}</div>` : ''}
</body>
</html>
      `

      // Create appropriate content and filename based on format
      let content: string
      let mimeType: string
      let fileName: string
      let successMessage: string

      if (format === 'word') {
        // For Word format, create HTML with Word-compatible styling and .doc extension
        const wordHTML = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>Resume - ${resume.tailored_bullets?.user_info?.full_name || 'Unknown'}</title>
  <!--[if gte mso 9]>
  <xml><w:WordDocument><w:View>Print</w:View><w:Zoom>90</w:Zoom></w:WordDocument></xml>
  <![endif]-->
  <style>
    @page { margin: 1in; }
    body {
      font-family: 'Calibri', 'Arial', sans-serif;
      font-size: 11pt;
      line-height: 1.2;
      margin: 0;
      padding: 0;
    }
    .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #2c5282; padding-bottom: 15px; }
    .name { font-size: 18pt; font-weight: bold; margin-bottom: 5px; }
    .contact { font-size: 10pt; color: #666; margin-bottom: 10px; }
    .section { margin-bottom: 20px; }
    h2 { font-size: 14pt; font-weight: bold; color: #2c5282; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
    .profile-text { margin-bottom: 15px; text-align: justify; }
    .skills-text { margin-bottom: 15px; }
    .job-title { font-style: italic; color: #2c5282; }
    .job-details { font-weight: bold; }
    .accomplishment { margin-bottom: 15px; }
    .accomplishment p { margin: 3px 0; }
    .accomplishment ul { margin: 5px 0; padding-left: 20px; }
    .accomplishment li { margin: 2px 0; }
  </style>
</head>
<body>
  <div class="header">
    <div class="name">${resume.tailored_bullets?.user_info?.full_name || 'Your Name'}</div>
    <div class="contact">
      ${resume.tailored_bullets?.user_info?.email || ''} •
      ${resume.tailored_bullets?.user_info?.phone || ''} •
      ${resume.tailored_bullets?.user_info?.location_city || ''}${resume.tailored_bullets?.user_info?.location_country ? ', ' + resume.tailored_bullets?.user_info?.location_country : ''} •
      ${resume.tailored_bullets?.user_info?.linkedin_url || ''}
    </div>
  </div>
  <div class="section">
    <h2>Professional Profile</h2>
    <p class="profile-text">${resume.tailored_profile || 'N/A'}</p>
  </div>
  <div class="section">
    <h2>Areas of Excellence</h2>
    <p class="skills-text">${skillsText}</p>
  </div>
  ${parStoriesHTML ? `<div class="section"><h2>Key Accomplishments</h2>${parStoriesHTML}</div>` : ''}
  ${workExpHTML ? `<div class="section"><h2>Work Experience</h2>${workExpHTML}</div>` : ''}
</body>
</html>`
        content = wordHTML
        mimeType = 'application/msword'
        fileName = `Resume_${resume.company_name}_${resume.job_title}.doc`
        successMessage = '✅ Resume exported as Word document successfully!'
      } else {
        // HTML format (existing logic)
        content = htmlContent
        mimeType = 'text/html'
        fileName = `Resume_${resume.company_name}_${resume.job_title}.html`
        successMessage = '✅ Resume exported as HTML successfully!'
      }

      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      URL.revokeObjectURL(url)

      alert(successMessage)
    } catch (error: any) {
      console.error('Error exporting:', error)
      alert('Failed to export resume: ' + error.message)
    }
  }

  const handleMarkAsSent = (resume: TailoredResume) => {
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

      if (userId) await loadTailoredResumes(userId)
    } catch (error: any) {
      console.error('Error marking as sent:', error)
      alert('Failed to update: ' + error.message)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'found': return 'bg-purple-100 text-purple-700 border-purple-300'
      case 'tailoring': return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'applied': return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'followed_up': return 'bg-indigo-100 text-indigo-700 border-indigo-300'
      case 'interviewing': return 'bg-orange-100 text-orange-700 border-orange-300'
      case 'offer': return 'bg-green-100 text-green-700 border-green-300'
      case 'rejected': return 'bg-red-100 text-red-700 border-red-300'
      case 'draft': return 'bg-gray-100 text-gray-700 border-gray-300'
      default: return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const getMatchScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (!userId) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
          Please sign in to view your resume tracker.
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 text-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  const stats = {
    total: resumes.length,
    applied: resumes.filter(r => r.application_status === 'applied').length,
    interviewing: resumes.filter(r => r.application_status === 'interviewing').length,
    offer: resumes.filter(r => r.application_status === 'offer').length,
    followed_up: resumes.filter(r => r.application_status === 'followed_up').length
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            📊 Resume Tracker
          </h1>
          <p className="text-gray-600 mt-2">
            Track all your tailored resumes and their application status
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-indigo-200 rounded-lg p-4">
          <div className="text-3xl font-bold text-indigo-600">{stats.total}</div>
          <div className="text-sm text-gray-600 mt-1">Total Resumes</div>
        </div>
        <div className="bg-white border-2 border-blue-200 rounded-lg p-4">
          <div className="text-3xl font-bold text-blue-600">{stats.applied}</div>
          <div className="text-sm text-gray-600 mt-1">Applied</div>
        </div>
        <div className="bg-white border-2 border-orange-200 rounded-lg p-4">
          <div className="text-3xl font-bold text-orange-600">{stats.interviewing}</div>
          <div className="text-sm text-gray-600 mt-1">Interviewing</div>
        </div>
        <div className="bg-white border-2 border-green-200 rounded-lg p-4">
          <div className="text-3xl font-bold text-green-600">{stats.offer}</div>
          <div className="text-sm text-gray-600 mt-1">Offers</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by company or job title..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">🔍 All Status</option>
              <option value="found">🟣 Found</option>
              <option value="tailoring">🟡 Tailoring</option>
              <option value="applied">🔵 Applied</option>
              <option value="followed_up">🟣 Followed Up</option>
              <option value="interviewing">🟠 Interviewing</option>
              <option value="offer">🟢 Offer</option>
              <option value="rejected">🔴 Rejected</option>
              <option value="draft">⚫ Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* Resumes List */}
      {filteredResumes.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow-md text-center">
          <div className="text-gray-400 text-6xl mb-4">📄</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No resumes found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Start by analyzing a job description and generating tailored resumes'}
          </p>
          <button
            onClick={() => navigate('/resume-builder/jd-analyzer')}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Go to JD Analyzer
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredResumes.map((resume) => (
            <div
              key={resume.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{resume.job_title}</h3>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(resume.application_status || 'draft')}`}>
                          {(resume.application_status || 'draft').replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Building2 className="w-4 h-4" />
                        <span className="font-medium">{resume.company_name}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getMatchScoreColor(resume.match_score)}`}>
                        {resume.match_score}%
                      </div>
                      <div className="text-xs text-gray-500">Match Score</div>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Created: {new Date(resume.created_at).toLocaleDateString()}</span>
                    </div>
                    {resume.sent_at && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Send className="w-4 h-4" />
                        <span>Sent: {new Date(resume.sent_at).toLocaleDateString()}</span>
                      </div>
                    )}
                    {resume.sent_to_company && (
                      <div className="col-span-2 text-gray-600">
                        <span className="font-semibold">Sent to:</span> {resume.sent_to_company}
                      </div>
                    )}
                  </div>

                  {/* Skills Preview */}
                  {resume.tailored_skills && resume.tailored_skills.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs text-gray-500 mb-1">Key Skills:</div>
                      <div className="flex flex-wrap gap-2">
                        {resume.tailored_skills.slice(0, 5).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded"
                          >
                            {skill}
                          </span>
                        ))}
                        {resume.tailored_skills.length > 5 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            +{resume.tailored_skills.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => handleViewResume(resume)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => {
                        const dropdown = document.getElementById(`export-dropdown-${resume.id}`)
                        if (dropdown) {
                          dropdown.classList.toggle('hidden')
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                    >
                      <Download className="w-4 h-4" />
                      Export
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <div
                      id={`export-dropdown-${resume.id}`}
                      className="hidden absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleExportResume(resume, 'html')
                          document.getElementById(`export-dropdown-${resume.id}`)?.classList.add('hidden')
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100 text-gray-700 rounded-t-lg"
                      >
                        <Download className="w-4 h-4" />
                        Export as HTML
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleExportResume(resume, 'word')
                          document.getElementById(`export-dropdown-${resume.id}`)?.classList.add('hidden')
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100 text-gray-700 rounded-b-lg"
                      >
                        <Download className="w-4 h-4" />
                        Export as Word (.doc)
                      </button>
                    </div>
                  </div>
                  {resume.status !== 'sent' && (
                    <button
                      onClick={() => handleMarkAsSent(resume)}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors whitespace-nowrap"
                    >
                      <Send className="w-4 h-4" />
                      Mark Sent
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingResume && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {viewingResume.job_title} - {viewingResume.company_name}
              </h2>
              <button
                onClick={() => {
                  setShowViewModal(false)
                  setViewingResume(null)
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-8 space-y-8 bg-white" style={{ fontFamily: 'Georgia, serif' }}>
              {/* User Info Header */}
              {viewingResume.tailored_bullets?.user_info?.full_name && (
                <div className="text-center border-b-2 border-gray-300 pb-6 mb-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {viewingResume.tailored_bullets.user_info.full_name}
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

              {/* PAR Stories */}
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
                  onClick={() => handleExportResume(viewingResume, 'html')}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                >
                  📄 Export as HTML
                </button>
                <button
                  onClick={() => handleExportResume(viewingResume, 'word')}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                >
                  📄 Export as Word (.doc)
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
      )}

      {/* Send Modal */}
      {showSendModal && viewingResume && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-bold text-gray-900">Mark Resume as Sent</h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title
                </label>
                <input
                  type="text"
                  value={viewingResume.job_title}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sent To (Name/Email) *
                </label>
                <input
                  type="text"
                  value={sendToCompany}
                  onChange={(e) => setSendToCompany(e.target.value)}
                  placeholder="e.g., John Doe - john@company.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
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
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
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
      )}
    </div>
  )
}
