import { useState, useEffect } from 'react'
import { Plus, Search, ExternalLink, Users, CheckCircle, XCircle, Clock, AlertCircle, Briefcase, X, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface JobApplication {
  id: string
  job_title: string
  company: string
  where_found: string
  date_found: string
  link_to_posting: string
  top_keywords: string[]
  referral_requested: boolean
  referral_contact_name: string | null
  referral_made: boolean
  application_status: 'found' | 'tailoring' | 'applied' | 'followed_up' | 'interviewing' | 'offer' | 'rejected'
  date_applied: string | null
  auto_follow_up_date: string | null
  last_follow_up_date: string | null
  follow_up_count: number
  created_at: string
}

const EMPTY_FORM = {
  job_title: '',
  company: '',
  where_found: 'LinkedIn',
  date_found: new Date().toISOString().split('T')[0],
  link_to_posting: '',
  top_keywords: '',
  referral_requested: false,
  referral_contact_name: '',
  referral_made: false,
  application_status: 'found' as JobApplication['application_status'],
  date_applied: '',
}

export default function JobApplicationTracker() {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [referralFilter, setReferralFilter] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('job_applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setApplications(data || [])
    } catch (error) {
      console.error('Error loading applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveApplication = async () => {
    if (!form.job_title.trim() || !form.company.trim()) {
      alert('Job Title and Company are required.')
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Auto-calculate follow-up date (7 days after applied)
      const followUpDate = form.date_applied
        ? new Date(new Date(form.date_applied).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : null

      const { error } = await supabase.from('job_applications').insert({
        user_id: user.id,
        job_title: form.job_title.trim(),
        company: form.company.trim(),
        where_found: form.where_found,
        date_found: form.date_found,
        link_to_posting: form.link_to_posting.trim() || null,
        top_keywords: form.top_keywords
          ? form.top_keywords.split(',').map(k => k.trim()).filter(Boolean)
          : [],
        referral_requested: form.referral_requested,
        referral_contact_name: form.referral_contact_name.trim() || null,
        referral_made: form.referral_made,
        application_status: form.application_status,
        date_applied: form.date_applied || null,
        auto_follow_up_date: followUpDate,
        last_follow_up_date: null,
        follow_up_count: 0,
      })

      if (error) throw error

      setForm({ ...EMPTY_FORM })
      setShowAddModal(false)
      await loadApplications()
    } catch (error: any) {
      console.error('Error saving application:', error)
      alert('Error saving. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'found':
        return 'bg-purple-100 text-purple-700 border-purple-300'
      case 'tailoring':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'applied':
        return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'followed_up':
        return 'bg-indigo-100 text-indigo-700 border-indigo-300'
      case 'interviewing':
        return 'bg-orange-100 text-orange-700 border-orange-300'
      case 'offer':
        return 'bg-green-100 text-green-700 border-green-300'
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'offer':
        return <CheckCircle className="w-4 h-4" />
      case 'rejected':
        return <XCircle className="w-4 h-4" />
      case 'interviewing':
        return <Users className="w-4 h-4" />
      case 'followed_up':
      case 'applied':
        return <Clock className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const isFollowUpDue = (app: JobApplication) => {
    if (!app.auto_follow_up_date) return false
    const today = new Date().toISOString().split('T')[0]
    return app.auto_follow_up_date <= today && app.application_status === 'applied'
  }

  // Filter applications
  let filteredApplications = applications

  if (searchTerm) {
    filteredApplications = filteredApplications.filter(
      app =>
        app.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.company.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  if (statusFilter !== 'all') {
    filteredApplications = filteredApplications.filter(app => app.application_status === statusFilter)
  }

  if (referralFilter === 'with_referral') {
    filteredApplications = filteredApplications.filter(app => app.referral_made)
  } else if (referralFilter === 'without_referral') {
    filteredApplications = filteredApplications.filter(app => !app.referral_made)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by job title or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="all">🔍 All Status</option>
          <option value="found">🟣 Found</option>
          <option value="tailoring">🟡 Tailoring</option>
          <option value="applied">🔵 Applied</option>
          <option value="followed_up">🟣 Followed Up</option>
          <option value="interviewing">🟠 Interviewing</option>
          <option value="offer">🟢 Offer</option>
          <option value="rejected">🔴 Rejected</option>
        </select>

        {/* Referral Filter */}
        <select
          value={referralFilter}
          onChange={(e) => setReferralFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="all">All Referrals</option>
          <option value="with_referral">With Referral</option>
          <option value="without_referral">Without Referral</option>
        </select>

        {/* Add Application Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-primary-600 hover:to-primary-700 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Application
        </button>
      </div>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
          <Briefcase className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Applications Found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm || statusFilter !== 'all' || referralFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Start tracking your job applications'}
          </p>
          {!searchTerm && statusFilter === 'all' && referralFilter === 'all' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-primary-600 hover:to-primary-700 transition-all"
            >
              Add Your First Application
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((app) => (
            <div
              key={app.id}
              className={`bg-white dark:bg-gray-800 border-2 rounded-lg p-6 hover:shadow-md transition-shadow ${isFollowUpDue(app) ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/10' : 'border-gray-200 dark:border-gray-700'
                }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{app.job_title}</h3>
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full border flex items-center gap-1 ${getStatusColor(
                        app.application_status
                      )}`}
                    >
                      {getStatusIcon(app.application_status)}
                      {app.application_status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    {app.referral_made && (
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 border border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Referral
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 font-medium">{app.company}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>Found on: {app.where_found}</span>
                    <span>•</span>
                    <span>
                      {new Date(app.date_found).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                {app.link_to_posting && (
                  <a
                    href={app.link_to_posting}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 p-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                )}
              </div>

              {/* Referral Info */}
              {app.referral_made && app.referral_contact_name && (
                <div className="bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-900/40 rounded-lg p-3 mb-4">
                  <p className="text-sm text-green-800 dark:text-green-300">
                    <span className="font-semibold">Referral from:</span> {app.referral_contact_name}
                  </p>
                </div>
              )}

              {/* Follow-up Alert */}
              {isFollowUpDue(app) && (
                <div className="bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-900/40 rounded-lg p-3 mb-4 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-yellow-900 dark:text-yellow-300 text-sm">Follow-up Due!</p>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200/80">
                      It's been 7+ days since you applied. Time to follow up!
                    </p>
                  </div>
                </div>
              )}

              {/* Keywords */}
              {app.top_keywords && app.top_keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {app.top_keywords.slice(0, 5).map((keyword, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded"
                    >
                      {keyword}
                    </span>
                  ))}
                  {app.top_keywords.length > 5 && (
                    <span className="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                      +{app.top_keywords.length - 5} more
                    </span>
                  )}
                </div>
              )}

              {/* Application Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {app.date_applied && (
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Applied</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(app.date_applied).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
                {app.auto_follow_up_date && (
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Follow-up Date</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(app.auto_follow_up_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
                {app.follow_up_count > 0 && (
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Follow-ups</p>
                    <p className="font-medium text-gray-900 dark:text-white">{app.follow_up_count}x</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Application Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary-600" /> Add Job Application
              </h2>
              <button onClick={() => { setShowAddModal(false); setForm({ ...EMPTY_FORM }) }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Job Title + Company */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Data Analyst"
                    value={form.job_title}
                    onChange={e => setForm(f => ({ ...f, job_title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Company <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Stripe"
                    value={form.company}
                    onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Where Found + Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Where Found</label>
                  <select
                    value={form.where_found}
                    onChange={e => setForm(f => ({ ...f, where_found: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option>LinkedIn</option>
                    <option>Indeed</option>
                    <option>Glassdoor</option>
                    <option>Company Website</option>
                    <option>Referral</option>
                    <option>Handshake</option>
                    <option>ZipRecruiter</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select
                    value={form.application_status}
                    onChange={e => setForm(f => ({ ...f, application_status: e.target.value as JobApplication['application_status'] }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="found">🟣 Found</option>
                    <option value="tailoring">🟡 Tailoring Resume</option>
                    <option value="applied">🔵 Applied</option>
                    <option value="followed_up">🔵 Followed Up</option>
                    <option value="interviewing">🟠 Interviewing</option>
                    <option value="offer">🟢 Offer</option>
                    <option value="rejected">🔴 Rejected</option>
                  </select>
                </div>
              </div>

              {/* Date Found + Date Applied */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Date Found</label>
                  <input
                    type="date"
                    value={form.date_found}
                    onChange={e => setForm(f => ({ ...f, date_found: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Date Applied <span className="text-xs text-gray-400 font-normal">(follow-up auto-set to +7 days)</span>
                  </label>
                  <input
                    type="date"
                    value={form.date_applied}
                    onChange={e => setForm(f => ({ ...f, date_applied: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Link to Posting */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Link to Job Posting</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={form.link_to_posting}
                  onChange={e => setForm(f => ({ ...f, link_to_posting: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Top Keywords <span className="text-xs text-gray-400 font-normal">comma separated</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. SQL, Python, Tableau, Data Visualization"
                  value={form.top_keywords}
                  onChange={e => setForm(f => ({ ...f, top_keywords: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Referral section */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/40 rounded-lg p-4 space-y-3">
                <p className="text-sm font-semibold text-green-800 dark:text-green-300">Referral</p>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={form.referral_requested}
                      onChange={e => setForm(f => ({ ...f, referral_requested: e.target.checked }))}
                      className="w-4 h-4 text-primary-600 rounded"
                    />
                    Referral Requested
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={form.referral_made}
                      onChange={e => setForm(f => ({ ...f, referral_made: e.target.checked }))}
                      className="w-4 h-4 text-primary-600 rounded"
                    />
                    Referral Confirmed ✓
                  </label>
                </div>
                {(form.referral_requested || form.referral_made) && (
                  <input
                    type="text"
                    placeholder="Contact name (e.g. John Smith)"
                    value={form.referral_contact_name}
                    onChange={e => setForm(f => ({ ...f, referral_contact_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-green-300 dark:border-green-700 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  />
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => { setShowAddModal(false); setForm({ ...EMPTY_FORM }) }}
                className="px-5 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveApplication}
                disabled={saving}
                className="px-6 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-semibold hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Plus className="w-4 h-4" /> Save Application</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
