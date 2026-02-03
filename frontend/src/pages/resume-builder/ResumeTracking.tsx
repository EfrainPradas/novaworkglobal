import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
// import { useTranslation } from 'react-i18next'
import { BackButton } from '../../components/common/BackButton'

interface TrackedResume {
  id: string
  job_title: string
  company_name: string
  sent_at: string
  sent_to_company: string
  application_status: string
  last_status_update: string | null
  interview_date: string | null
  notes: string | null
  recruiter_contact: string | null
  match_score: number
  created_at: string
  status?: string
}

const STATUS_OPTIONS = [
  { value: 'draft', label: '📝 Draft', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  { value: 'sent', label: '✉️ Sent', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'under_review', label: '👀 Under Review', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  { value: 'interview_scheduled', label: '📅 Interview Scheduled', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  { value: 'interviewed', label: '💬 Interviewed', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' },
  { value: 'offer_received', label: '🎉 Offer Received', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  { value: 'rejected', label: '❌ Rejected', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  { value: 'position_filled', label: '🔒 Position Filled', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' },
  { value: 'withdrawn', label: '🚫 Withdrawn', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
]

interface ResumeTrackingProps {
  embedded?: boolean
}

export default function ResumeTracking({ embedded = false }: ResumeTrackingProps) {
  // const { t } = useTranslation()
  const navigate = useNavigate()
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [resumes, setResumes] = useState<TrackedResume[]>([])
  const [filteredResumes, setFilteredResumes] = useState<TrackedResume[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string>('sent')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingStatus, setEditingStatus] = useState<string>('')
  const [editingNotes, setEditingNotes] = useState<string>('')
  const [editingInterviewDate, setEditingInterviewDate] = useState<string>('')
  const [editingRecruiter, setEditingRecruiter] = useState<string>('')
  const [sortBy, setSortBy] = useState<'date' | 'company' | 'status'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (selectedStatus === 'all') {
      setFilteredResumes(resumes)
    } else {
      setFilteredResumes(resumes.filter(r => {
        const status = r.application_status || r.status || 'draft'
        return status === selectedStatus
      }))
    }
  }, [selectedStatus, resumes])

  // No useEffect for sorting - we'll sort in the render

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/signin')
        return
      }
      setUserId(user.id)
      await loadResumes(user.id)
    } catch (error) {
      console.error('Auth error:', error)
      navigate('/signin')
    } finally {
      setLoading(false)
    }
  }

  const loadResumes = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('tailored_resumes')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Normalize data: use application_status if available, otherwise fall back to status
      const normalizedData = (data || []).map(resume => ({
        ...resume,
        application_status: resume.application_status || resume.status || 'draft'
      }))

      setResumes(normalizedData)
    } catch (error: any) {
      console.error('Error loading resumes:', error)
      alert('Failed to load resumes: ' + error.message)
    }
  }

  const handleEditStatus = (resume: TrackedResume) => {
    setEditingId(resume.id)
    setEditingStatus(resume.application_status || 'draft')
    setEditingNotes(resume.notes || '')
    setEditingInterviewDate(resume.interview_date ? new Date(resume.interview_date).toISOString().slice(0, 16) : '')
    setEditingRecruiter(resume.recruiter_contact || '')
  }

  const handleSaveStatus = async () => {
    if (!editingId) return

    try {
      const updateData: any = {
        application_status: editingStatus,
        last_status_update: new Date().toISOString(),
        notes: editingNotes || null,
        recruiter_contact: editingRecruiter || null,
      }

      if (editingInterviewDate) {
        updateData.interview_date = new Date(editingInterviewDate).toISOString()
      } else {
        updateData.interview_date = null
      }

      const { error } = await supabase
        .from('tailored_resumes')
        .update(updateData)
        .eq('id', editingId)

      if (error) throw error

      alert('✅ Status updated successfully!')
      setEditingId(null)
      if (userId) await loadResumes(userId)
    } catch (error: any) {
      console.error('Error updating status:', error)
      alert('Failed to update: ' + error.message)
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingStatus('')
    setEditingNotes('')
    setEditingInterviewDate('')
    setEditingRecruiter('')
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusObj = STATUS_OPTIONS.find(s => s.value === status)
    return statusObj || { label: status, color: 'bg-gray-100 text-gray-700' }
  }

  const getStats = () => {
    const total = resumes.length
    const sent = resumes.filter(r => r.application_status === 'sent').length
    const underReview = resumes.filter(r => r.application_status === 'under_review').length
    const interviews = resumes.filter(r =>
      r.application_status === 'interview_scheduled' || r.application_status === 'interviewed'
    ).length
    const offers = resumes.filter(r => r.application_status === 'offer_received').length
    const rejected = resumes.filter(r => r.application_status === 'rejected').length

    return { total, sent, underReview, interviews, offers, rejected }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tracking data...</p>
        </div>
      </div>
    )
  }

  const stats = getStats()

  // Compute sorted resumes for display
  const sortedResumes = [...filteredResumes].sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case 'date':
        comparison = new Date(b.sent_at || b.created_at).getTime() - new Date(a.sent_at || a.created_at).getTime()
        break
      case 'company':
        comparison = (a.company_name || '').localeCompare(b.company_name || '')
        break
      case 'status':
        const statusA = a.application_status || a.status || 'draft'
        const statusB = b.application_status || b.status || 'draft'
        comparison = statusA.localeCompare(statusB)
        break
    }

    return sortOrder === 'asc' ? -comparison : comparison
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header - Only apply if not embedded */}
      {!embedded && (
        <header className="bg-white dark:bg-gray-800 shadow transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <BackButton to="/job-search-hub" label="Back to Job Search" variant="light" className="mb-2 pl-0" />
                <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
                  📊 Resume Application Tracker
                </h1>
              </div>
              <button
                onClick={() => navigate('/resume/jd-analyzer')}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center gap-2"
              >
                <span className="text-lg">🔍</span>
                Analyze New Job
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 transition-colors duration-200">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Resumes</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 transition-colors duration-200">
            <p className="text-sm text-gray-600 dark:text-gray-400">Sent</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.sent}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 transition-colors duration-200">
            <p className="text-sm text-gray-600 dark:text-gray-400">Under Review</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.underReview}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 transition-colors duration-200">
            <p className="text-sm text-gray-600 dark:text-gray-400">Interviews</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.interviews}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 transition-colors duration-200">
            <p className="text-sm text-gray-600 dark:text-gray-400">Offers</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.offers}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 transition-colors duration-200">
            <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.rejected}</p>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6 transition-colors duration-200">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Filter by Status:</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Statuses</option>
                {STATUS_OPTIONS.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="date">Date</option>
                <option value="company">Company</option>
                <option value="status">Status</option>
              </select>
            </div>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
            </button>

            <div className="ml-auto text-sm text-gray-600 dark:text-gray-400">
              Showing {sortedResumes.length} of {resumes.length} resumes
            </div>
          </div>
        </div>

        {/* Resumes Table */}
        {sortedResumes.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center transition-colors duration-200">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No resumes found.</p>
            <button
              onClick={() => navigate('/resume-builder/jd-analyzer')}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700"
            >
              Create Your First Resume
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors duration-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Sent Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Match Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {sortedResumes.map((resume) => (
                    <tr key={resume.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{resume.job_title}</div>
                        {resume.recruiter_contact && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">Recruiter: {resume.recruiter_contact}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{resume.company_name}</div>
                        {resume.sent_to_company && resume.sent_to_company !== resume.company_name && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">Sent to: {resume.sent_to_company}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === resume.id ? (
                          <select
                            value={editingStatus}
                            onChange={(e) => setEditingStatus(e.target.value)}
                            className="text-sm px-2 py-1 border border-gray-300 rounded"
                          >
                            {STATUS_OPTIONS.map(status => (
                              <option key={status.value} value={status.value}>{status.label}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`inline-flex text-xs px-2 py-1 rounded-full font-semibold ${getStatusBadge(resume.application_status).color}`}>
                            {getStatusBadge(resume.application_status).label}
                          </span>
                        )}
                        {resume.interview_date && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            📅 {formatDate(resume.interview_date)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(resume.sent_at)}
                        {resume.last_status_update && (
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            Updated: {formatDate(resume.last_status_update)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">
                            {resume.match_score != null ? `${resume.match_score}%` : 'N/A'}
                          </div>
                          {resume.match_score != null && (
                            <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${resume.match_score >= 80 ? 'bg-green-500' :
                                  resume.match_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                style={{ width: `${resume.match_score}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {editingId === resume.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveStatus}
                              className="text-green-600 hover:text-green-900"
                            >
                              ✓ Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-red-600 hover:text-red-900"
                            >
                              ✗ Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditStatus(resume)}
                            className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                          >
                            ✏️ Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Edit Details Modal */}
        {editingId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-200">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Update Application Status</h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Application Status *
                  </label>
                  <select
                    value={editingStatus}
                    onChange={(e) => setEditingStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  >
                    {STATUS_OPTIONS.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Interview Date & Time (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={editingInterviewDate}
                    onChange={(e) => setEditingInterviewDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Recruiter Contact (Optional)
                  </label>
                  <input
                    type="text"
                    value={editingRecruiter}
                    onChange={(e) => setEditingRecruiter(e.target.value)}
                    placeholder="e.g., Jane Smith - jane@company.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={editingNotes}
                    onChange={(e) => setEditingNotes(e.target.value)}
                    rows={4}
                    placeholder="Add any notes about the application, interview feedback, follow-up actions, etc."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveStatus}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  💾 Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
