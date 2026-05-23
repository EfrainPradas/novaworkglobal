import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { BackButton } from '../../components/common/BackButton'
import { FileText, Globe, Calendar, Edit3, Trash2, Eye, Search, Filter } from 'lucide-react'

interface TailoredResume {
  id: string
  user_id: string
  master_resume_id: string
  jd_analysis_id?: string | null
  company_name?: string
  job_title?: string
  document_name?: string
  output_language?: string
  generated_at?: string
  status?: string
  application_status?: string
  match_score?: number
  tailored_profile?: string
  tailored_skills?: string[]
  tailored_bullets?: any
  created_at: string
  updated_at?: string
}

export default function MyResumes() {
  const navigate = useNavigate()
  const [userId, setUserId] = useState<string | null>(null)
  const [resumes, setResumes] = useState<TailoredResume[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLang, setFilterLang] = useState<string>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDocName, setEditDocName] = useState('')
  const [editCompany, setEditCompany] = useState('')
  const [editJobTitle, setEditJobTitle] = useState('')

  useEffect(() => { loadResumes() }, [])

  const loadResumes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/signin'); return }
      setUserId(user.id)

      const { data, error } = await supabase
        .from('tailored_resumes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setResumes((data as TailoredResume[]) || [])
    } catch (err) {
      console.error('Error loading resumes:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (resume: TailoredResume) => {
    setEditingId(resume.id)
    setEditDocName(resume.document_name || '')
    setEditCompany(resume.company_name || '')
    setEditJobTitle(resume.job_title || '')
  }

  const handleSaveEdit = async () => {
    if (!editingId) return
    try {
      const { error } = await supabase
        .from('tailored_resumes')
        .update({
          document_name: editDocName || null,
          company_name: editCompany || null,
          job_title: editJobTitle || null,
        })
        .eq('id', editingId)

      if (error) throw error
      setEditingId(null)
      if (userId) await loadResumes()
    } catch (err) {
      console.error('Error saving:', err)
    }
  }

  const handleDelete = async (resume: TailoredResume) => {
    if (!confirm(`Delete "${resume.document_name || resume.job_title || 'this resume'}"?`)) return
    try {
      const { error } = await supabase
        .from('tailored_resumes')
        .delete()
        .eq('id', resume.id)
      if (error) throw error
      if (userId) await loadResumes()
    } catch (err) {
      console.error('Error deleting:', err)
    }
  }

  const filteredResumes = resumes.filter(r => {
    const matchesSearch = !searchTerm ||
      (r.document_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.job_title || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLang = filterLang === 'all' || (r.output_language || 'en') === filterLang
    return matchesSearch && matchesLang
  })

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'generated': return { label: 'Generated', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' }
      case 'draft': return { label: 'Draft', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' }
      case 'sent': return { label: 'Sent', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' }
      default: return { label: status || 'Draft', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' }
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-slate-500 dark:text-slate-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6 md:p-10 transition-colors duration-200">
      <div className="max-w-5xl mx-auto">
        <BackButton
          to="/dashboard/resume-builder"
          label="Back to Resume Studio"
          variant="light"
          className="mb-6 pl-0"
        />

        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">My Resumes</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            All your tailored resumes in one place. Edit details, view, or manage your documents.
          </p>
        </div>

        {/* Search & Filter */}
        {resumes.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, company, or position..."
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filterLang}
                onChange={(e) => setFilterLang(e.target.value)}
                className="px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Languages</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
          </div>
        )}

        {/* Resume List */}
        {filteredResumes.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {resumes.length === 0 ? 'No resumes yet' : 'No matches found'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              {resumes.length === 0
                ? 'Generate your first tailored resume from the JD Analyzer.'
                : 'Try adjusting your search or filter.'}
            </p>
            {resumes.length === 0 && (
              <button
                onClick={() => navigate('/dashboard/resume-builder/jd-analyzer')}
                className="px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors"
              >
                Go to JD Analyzer
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredResumes.map((resume) => {
              const badge = getStatusBadge(resume.status)
              return (
                <div key={resume.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Title & Subtitle */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {resume.document_name || resume.job_title || 'Untitled Resume'}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {resume.company_name && <span>{resume.company_name}</span>}
                        {resume.output_language && resume.output_language !== 'en' && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            <Globe className="w-3 h-3 mr-0.5" />{resume.output_language === 'es' ? 'ES' : resume.output_language.toUpperCase()}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className="flex-shrink-0">
                      <span className={`inline-flex text-xs px-2.5 py-1 rounded-full font-semibold ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>

                    {/* Match Score */}
                    {resume.match_score != null && (
                      <div className="flex items-center gap-2 flex-shrink-0 w-20">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{resume.match_score}%</span>
                        <div className="flex-1 bg-slate-200 dark:bg-slate-600 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${resume.match_score >= 80 ? 'bg-green-500' : resume.match_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${resume.match_score}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Date */}
                    <div className="flex-shrink-0 text-xs text-slate-400 dark:text-slate-500 w-28 text-right hidden md:block">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      {formatDate(resume.generated_at || resume.created_at)}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => handleEdit(resume)} className="px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20 rounded-lg transition-colors">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(resume)} className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Resume Details</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Document Name</label>
                <input
                  type="text"
                  value={editDocName}
                  onChange={(e) => setEditDocName(e.target.value)}
                  placeholder="e.g., Resume — Senior PM — Google"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Company</label>
                  <input
                    type="text"
                    value={editCompany}
                    onChange={(e) => setEditCompany(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Position</label>
                  <input
                    type="text"
                    value={editJobTitle}
                    onChange={(e) => setEditJobTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex gap-3">
              <button onClick={() => setEditingId(null)} className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">
                Cancel
              </button>
              <button onClick={handleSaveEdit} className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}