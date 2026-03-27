import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Save, Trash2, Loader2, CheckCircle2, Building2, ExternalLink, Star, Sparkles } from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

interface CompanyData {
  id?: string
  company_name: string
  industry: string
  website?: string
  linkedin_url?: string
  headquarters?: string
  company_size?: string
  revenue_range?: string
  why_target?: string // Renamed from why_fits_criteria
  recent_news?: string
  financials_growth?: string
  openings_closings?: string
  notes?: string
  apply_link?: string // Link to job application
  job_description?: string // Full job description
  job_title?: string // Specific job title
  match_score?: number // Match score (0-100)
  salary_range?: string // e.g., "$100K-$140K a year"
  posted_date?: string // When posted (e.g., "2 days ago")
  location?: string // Job location
  key_contacts: any // JSONB array
  application_status: 'researching' | 'ready_to_apply' | 'applied' | 'interviewing' | 'offer' | 'rejected'
  follow_up_date: string | null
  priority_score: number
  criteria_match_count: number
  ai_generated: boolean
  last_ai_refresh_date: string | null
  created_at?: string // When added to shortlist
  updated_at?: string
}

interface Props {
  onComplete?: () => void
}

export default function CompanyShortlist({ onComplete }: Props) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [companies, setCompanies] = useState<CompanyData[]>([])
  const [filteredCompanies, setFilteredCompanies] = useState<CompanyData[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [searching, setSearching] = useState(false)
  const [userCriteria, setUserCriteria] = useState<any>(null)
  const [userIndustries, setUserIndustries] = useState<any[]>([])
  const [suggestedCompanies, setSuggestedCompanies] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [addedCompanyNames, setAddedCompanyNames] = useState<Set<string>>(new Set())
  const cameFromSuggestions = useRef(false)

  // Sorting and Filtering
  const [sortBy, setSortBy] = useState<'match_score' | 'date_added' | 'salary'>('match_score')
  const [filterLocation, setFilterLocation] = useState<'all' | 'remote' | 'onsite'>('all')
  const [filterSalary, setFilterSalary] = useState<'all' | '0-80k' | '80k-120k' | '120k+'>('all')
  const [formData, setFormData] = useState<CompanyData>({
    company_name: '',
    industry: '',
    website: '',
    linkedin_url: '',
    headquarters: '',
    company_size: '',
    revenue_range: '',
    why_target: '',
    recent_news: '',
    financials_growth: '',
    openings_closings: '',
    notes: '',
    apply_link: '',
    job_description: '',
    job_title: '',
    match_score: undefined,
    salary_range: '',
    posted_date: '',
    location: '',
    key_contacts: [],
    application_status: 'researching',
    follow_up_date: null,
    priority_score: 5,
    criteria_match_count: 0,
    ai_generated: false,
    last_ai_refresh_date: null
  })

  useEffect(() => {
    loadCompanies()
    loadUserContext()
  }, [])

  // Apply sorting and filtering whenever companies or filters change
  useEffect(() => {
    applyFiltersAndSort()
  }, [companies, sortBy, filterLocation, filterSalary])

  const loadCompanies = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('company_shortlist')
        .select('*')
        .eq('user_id', user.id)
        .order('priority_score', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error

      setCompanies(data || [])
    } catch (error) {
      console.error('Error loading companies:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserContext = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load target criteria
      const { data: criteria } = await supabase
        .from('target_company_criteria')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setUserCriteria(criteria)

      // Load industry research
      const { data: industries } = await supabase
        .from('industry_research')
        .select('*')
        .eq('user_id', user.id)

      setUserIndustries(industries || [])
    } catch (error) {
      console.error('Error loading user context:', error)
    }
  }

  // Helper: Calculate days ago from date string
  const getDaysAgo = (dateString: string | undefined): string => {
    if (!dateString) return ''

    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - date.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 0) return 'Today'
      if (diffDays === 1) return 'Yesterday'
      if (diffDays < 7) return `${diffDays} days ago`
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
      return `${Math.floor(diffDays / 30)} months ago`
    } catch {
      return ''
    }
  }

  // Helper: Check if company was added recently (last 7 days)
  const isRecentlyAdded = (dateString: string | undefined): boolean => {
    if (!dateString) return false

    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - date.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays <= 7
    } catch {
      return false
    }
  }

  // Helper: Extract salary number for sorting
  const extractSalary = (salaryString: string | undefined): number => {
    if (!salaryString) return 0

    // Extract numbers from salary string (e.g., "$100K-$140K" -> 120)
    const matches = salaryString.match(/\$?(\d+)[kK]?/g)
    if (!matches || matches.length === 0) return 0

    const numbers = matches.map(m => {
      const num = parseInt(m.replace(/\$|k|K/g, ''))
      return m.toLowerCase().includes('k') ? num : num / 1000
    })

    // Return average of min and max
    return numbers.reduce((a, b) => a + b, 0) / numbers.length
  }

  // Apply filters and sorting
  const applyFiltersAndSort = () => {
    let filtered = [...companies]

    // Filter by location
    if (filterLocation === 'remote') {
      filtered = filtered.filter(c =>
        c.location?.toLowerCase().includes('remote') ||
        c.location?.toLowerCase().includes('anywhere')
      )
    } else if (filterLocation === 'onsite') {
      filtered = filtered.filter(c =>
        c.location &&
        !c.location.toLowerCase().includes('remote') &&
        !c.location.toLowerCase().includes('anywhere')
      )
    }

    // Filter by salary
    if (filterSalary !== 'all') {
      filtered = filtered.filter(c => {
        const salary = extractSalary(c.salary_range)
        if (filterSalary === '0-80k') return salary > 0 && salary < 80
        if (filterSalary === '80k-120k') return salary >= 80 && salary <= 120
        if (filterSalary === '120k+') return salary > 120
        return true
      })
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'match_score') {
        return (b.match_score || 0) - (a.match_score || 0)
      } else if (sortBy === 'date_added') {
        const dateA = new Date(a.created_at || 0).getTime()
        const dateB = new Date(b.created_at || 0).getTime()
        return dateB - dateA
      } else if (sortBy === 'salary') {
        return extractSalary(b.salary_range) - extractSalary(a.salary_range)
      }
      return 0
    })

    setFilteredCompanies(filtered)
  }

  const handleFindCompanies = async () => {
    if (userIndustries.length === 0) {
      alert('Please add at least 1 industry in Industry Research (Tab 2) first!')
      return
    }

    setSearching(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(`${API_BASE_URL}/api/jobs/company-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          industries: userIndustries,
          criteria: userCriteria
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get company suggestions')
      }

      const data = await response.json()
      setSuggestedCompanies(data.companies || [])
      setShowSuggestions(true)
    } catch (error: any) {
      console.error('❌ Error finding companies:', error)
      alert(`Failed to find companies: ${error.message}\n\nPlease try again.`)
    } finally {
      setSearching(false)
    }
  }

  const generateCompanySuggestions = (industry: string, geography: string, companySize: string, industries: any[]) => {
    // Database of companies by industry (expanded with Utah companies)
    const companyDatabase: any = {
      'saas': [
        // Utah SaaS companies
        { name: 'Qualtrics', size: '1001-5000', location: 'Provo, UT', industry: 'SaaS - Experience Management' },
        { name: 'Domo', size: '501-1000', location: 'American Fork, UT', industry: 'SaaS - Business Intelligence' },
        { name: 'Lucid Software', size: '501-1000', location: 'South Jordan, UT', industry: 'SaaS - Visual Collaboration' },
        { name: 'Divvy', size: '201-500', location: 'Lehi, UT', industry: 'SaaS - Expense Management' },
        { name: 'Podium', size: '501-1000', location: 'Lehi, UT', industry: 'SaaS - Customer Communication' },
        { name: 'Weave', size: '501-1000', location: 'Lehi, UT', industry: 'SaaS - Healthcare Communication' },
        { name: 'Pluralsight', size: '1001-5000', location: 'Draper, UT', industry: 'SaaS - Tech Skills Platform' },
        { name: 'Workfront', size: '501-1000', location: 'Lehi, UT', industry: 'SaaS - Work Management' },
        { name: 'InsideSales', size: '201-500', location: 'Provo, UT', industry: 'SaaS - Sales Acceleration' },
        { name: 'Bamboo HR', size: '201-500', location: 'Lindon, UT', industry: 'SaaS - HR Management' },
        // Other major SaaS
        { name: 'Salesforce', size: '5000+', location: 'San Francisco, CA', industry: 'SaaS - CRM' },
        { name: 'HubSpot', size: '1001-5000', location: 'Cambridge, MA', industry: 'SaaS - Marketing' },
        { name: 'Zoom', size: '1001-5000', location: 'San Jose, CA', industry: 'SaaS - Communication' },
        { name: 'Slack', size: '1001-5000', location: 'San Francisco, CA', industry: 'SaaS - Collaboration' }
      ],
      'fintech': [
        // Utah FinTech companies
        { name: 'MX Technologies', size: '201-500', location: 'Lehi, UT', industry: 'FinTech - Data Connectivity' },
        { name: 'Divvy', size: '201-500', location: 'Lehi, UT', industry: 'FinTech - Expense Management' },
        { name: 'Entrata', size: '1001-5000', location: 'Lehi, UT', industry: 'FinTech - Property Management' },
        { name: 'Finicity', size: '201-500', location: 'Murray, UT', industry: 'FinTech - Financial Data' },
        { name: 'Galileo Financial', size: '501-1000', location: 'Salt Lake City, UT', industry: 'FinTech - Payment Processing' },
        { name: 'Lendio', size: '201-500', location: 'South Jordan, UT', industry: 'FinTech - Small Business Lending' },
        { name: 'Fundbox', size: '201-500', location: 'Lehi, UT', industry: 'FinTech - Business Credit' },
        { name: 'Paysafe', size: '1001-5000', location: 'Salt Lake City, UT', industry: 'FinTech - Payment Solutions' },
        // Other major FinTech
        { name: 'Stripe', size: '1001-5000', location: 'San Francisco, CA', industry: 'FinTech - Payments' },
        { name: 'Square', size: '1001-5000', location: 'San Francisco, CA', industry: 'FinTech - Payments' },
        { name: 'Plaid', size: '201-1000', location: 'San Francisco, CA', industry: 'FinTech - Banking Infrastructure' }
      ],
      'edtech': [
        { name: 'Coursera', size: '1001-5000', location: 'Mountain View, CA', industry: 'EdTech - Online Learning' },
        { name: 'Udemy', size: '1001-5000', location: 'San Francisco, CA', industry: 'EdTech - Online Courses' },
        { name: 'Duolingo', size: '201-1000', location: 'Pittsburgh, PA', industry: 'EdTech - Language Learning' },
        { name: 'Chegg', size: '1001-5000', location: 'Santa Clara, CA', industry: 'EdTech - Student Services' },
        { name: 'Kahoot!', size: '201-1000', location: 'Oslo, Norway', industry: 'EdTech - Gamified Learning' }
      ],
      'ecommerce': [
        { name: 'Shopify', size: '5000+', location: 'Ottawa, Canada', industry: 'E-commerce - Platform' },
        { name: 'Amazon', size: '5000+', location: 'Seattle, WA', industry: 'E-commerce - Marketplace' },
        { name: 'Etsy', size: '1001-5000', location: 'Brooklyn, NY', industry: 'E-commerce - Handmade' },
        { name: 'Wayfair', size: '5000+', location: 'Boston, MA', industry: 'E-commerce - Home Goods' },
        { name: 'Instacart', size: '1001-5000', location: 'San Francisco, CA', industry: 'E-commerce - Grocery Delivery' }
      ],
      'ai': [
        { name: 'OpenAI', size: '201-1000', location: 'San Francisco, CA', industry: 'AI - Research' },
        { name: 'Anthropic', size: '51-200', location: 'San Francisco, CA', industry: 'AI - Safety' },
        { name: 'Scale AI', size: '201-1000', location: 'San Francisco, CA', industry: 'AI - Data Labeling' },
        { name: 'Hugging Face', size: '51-200', location: 'New York, NY', industry: 'AI - ML Platform' },
        { name: 'Cohere', size: '51-200', location: 'Toronto, Canada', industry: 'AI - NLP' }
      ],
      'healthcare': [
        { name: 'Epic Systems', size: '5000+', location: 'Verona, WI', industry: 'Healthcare - EMR' },
        { name: 'Cerner', size: '5000+', location: 'Kansas City, MO', industry: 'Healthcare - IT' },
        { name: 'Teladoc', size: '1001-5000', location: 'Purchase, NY', industry: 'Healthcare - Telehealth' },
        { name: 'Oscar Health', size: '1001-5000', location: 'New York, NY', industry: 'Healthcare - Insurance' }
      ],
      'cybersecurity': [
        { name: 'CrowdStrike', size: '1001-5000', location: 'Austin, TX', industry: 'Cybersecurity - Endpoint' },
        { name: 'Palo Alto Networks', size: '5000+', location: 'Santa Clara, CA', industry: 'Cybersecurity - Network' },
        { name: 'Okta', size: '1001-5000', location: 'San Francisco, CA', industry: 'Cybersecurity - Identity' },
        { name: 'Cloudflare', size: '1001-5000', location: 'San Francisco, CA', industry: 'Cybersecurity - Web Security' }
      ]
    }

    // Get relevant companies based on industry
    const industryKey = industry.toLowerCase().replace(/\s+/g, '')
    let relevantCompanies = companyDatabase[industryKey] || []

    // If no direct match, search across all industries
    if (relevantCompanies.length === 0) {
      Object.values(companyDatabase).forEach((companies: any) => {
        relevantCompanies = relevantCompanies.concat(companies.filter((c: any) =>
          c.industry.toLowerCase().includes(industry.toLowerCase()) ||
          c.name.toLowerCase().includes(industry.toLowerCase())
        ))
      })
    }

    // Filter by company size if specified (flexible matching)
    if (companySize && companySize !== '' && companySize.toLowerCase() !== 'all sizes') {
      const sizeFiltered = relevantCompanies.filter((c: any) => {
        const sizeLower = companySize.toLowerCase()
        const companySizeLower = c.size.toLowerCase()
        // Flexible matching for startup/small companies
        if (sizeLower.includes('startup') || sizeLower.includes('small') || sizeLower.includes('1-50')) {
          return companySizeLower.includes('51-200') || companySizeLower.includes('1-50')
        }
        return companySizeLower.includes(sizeLower) || sizeLower.includes(companySizeLower)
      })
      // Only apply filter if it returns results, otherwise show all
      if (sizeFiltered.length > 0) {
        relevantCompanies = sizeFiltered
      }
    }

    // Try to filter by geography if specified, but show all if no matches
    let geographyMatches = relevantCompanies
    if (geography && geography !== '' && !geography.toLowerCase().includes('remote')) {
      geographyMatches = relevantCompanies.filter((c: any) =>
        c.location.toLowerCase().includes(geography.toLowerCase().split(',')[0].trim())
      )
      // If no geography matches, show all companies but mark them as remote/national
      if (geographyMatches.length === 0) {
        geographyMatches = relevantCompanies
      }
    }

    // Add metadata with match scoring based on geography
    return geographyMatches.map((c: any, idx: number) => {
      const locationMatch = geography && c.location.toLowerCase().includes(geography.toLowerCase().split(',')[0].trim())
      return {
        ...c,
        matchScore: locationMatch ? (90 + Math.floor(Math.random() * 10)) : (75 + Math.floor(Math.random() * 10)),
        suggested: true,
        id: `suggested-${idx}`
      }
    })
  }

  const handleAddSuggested = (suggested: any) => {
    cameFromSuggestions.current = true
    const score = suggested.match_score ?? suggested.matchScore ?? 75

    const formDataToSet = {
      company_name: suggested.company_name || suggested.name || suggested.company || '',
      industry: suggested.industry || '',
      website: suggested.website || '',
      linkedin_url: '',
      headquarters: suggested.headquarters || '',
      company_size: suggested.company_size || suggested.size || '',
      revenue_range: suggested.financials_growth || '',
      job_title: suggested.job_title || suggested.jobTitle || '',
      location: suggested.headquarters || suggested.location || '',
      salary_range: suggested.salary_range || suggested.salary || '',
      posted_date: '',
      apply_link: suggested.website || suggested.applyLink || '',
      job_description: suggested.openings_closings || suggested.jobDescription || '',
      match_score: score,
      why_target: suggested.why_target || `AI Match score: ${score}%`,
      recent_news: suggested.recent_news || '',
      financials_growth: suggested.financials_growth || '',
      openings_closings: suggested.openings_closings || '',
      notes: suggested.notes || '',
      key_contacts: [],
      application_status: 'researching' as const,
      follow_up_date: null,
      priority_score: score >= 90 ? 9 : score >= 80 ? 7 : 5,
      criteria_match_count: 0,
      ai_generated: true,
      last_ai_refresh_date: new Date().toISOString().split('T')[0]
    }

    console.log('📝 Form data being set:', formDataToSet)
    console.log('📝 Apply link in form data:', formDataToSet.apply_link)

    setFormData(formDataToSet)
    setShowForm(true)
    setShowSuggestions(false)
  }

  const handleSave = async () => {
    if (!formData.company_name.trim()) {
      alert('Please enter a company name')
      return
    }

    console.log('💾 Saving company with data:', formData)
    console.log('💾 Apply link being saved:', formData.apply_link)

    setSaving(true)
    setSaved(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const dataToSave = {
        ...formData,
        user_id: user.id
      }

      console.log('💾 Data to be inserted into Supabase:', dataToSave)

      if (editingId) {
        // Update existing
        const { error } = await supabase
          .from('company_shortlist')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId)
          .eq('user_id', user.id)

        if (error) {
          console.error('❌ Error updating company:', error)
          throw error
        }
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('company_shortlist')
          .insert(dataToSave)
          .select()

        console.log('✅ Supabase insert result:', data)
        if (error) {
          console.error('❌ Error inserting company:', error)
          throw error
        }
      }

      setSaved(true)
      setEditingId(null)
      setShowForm(false)

      // If we came from suggestions, return to suggestions view and mark company as added
      if (cameFromSuggestions.current) {
        setAddedCompanyNames(prev => new Set([...prev, formData.company_name]))
        setShowSuggestions(true)
        cameFromSuggestions.current = false
      }

      setFormData({
        company_name: '',
        industry: '',
        website: '',
        linkedin_url: '',
        headquarters: '',
        company_size: '',
        revenue_range: '',
        why_target: '',
        recent_news: '',
        financials_growth: '',
        openings_closings: '',
        notes: '',
        apply_link: '',
        job_description: '',
        job_title: '',
        match_score: undefined,
        salary_range: '',
        posted_date: '',
        location: '',
        key_contacts: [],
        application_status: 'researching',
        follow_up_date: null,
        priority_score: 5,
        criteria_match_count: 0,
        ai_generated: false,
        last_ai_refresh_date: null
      })

      await loadCompanies()

      if (onComplete) onComplete()

      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving company:', error)
      alert('Error saving. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (company: CompanyData) => {
    setFormData(company)
    setEditingId(company.id || null)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this company from your shortlist?')) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('company_shortlist')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      await loadCompanies()
    } catch (error) {
      console.error('Error deleting:', error)
      alert('Error deleting. Please try again.')
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setShowForm(false)
    // If we came from suggestions, go back to them
    if (cameFromSuggestions.current) {
      setShowSuggestions(true)
      cameFromSuggestions.current = false
    }
    setFormData({
      company_name: '',
      industry: '',
      website: '',
      linkedin_url: '',
      headquarters: '',
      company_size: '',
      revenue_range: '',
      why_target: '',
      key_contacts: '',
      priority_score: 5,
      application_status: 'researching' as const,
      notes: '',
      follow_up_date: null,
      criteria_match_count: 0,
      ai_generated: false,
      last_ai_refresh_date: null
    })
  }

  const getPriorityColor = (score: number) => {
    if (score >= 8) return 'bg-red-100 text-red-800 border-red-200' // High
    if (score >= 5) return 'bg-yellow-100 text-yellow-800 border-yellow-200' // Medium
    return 'bg-green-100 text-green-800 border-green-200' // Low
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'researching': return 'bg-blue-100 text-blue-800'
      case 'ready_to_apply': return 'bg-green-100 text-green-800'
      case 'applied': return 'bg-purple-100 text-purple-800'
      case 'not_interested': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Build Your Target Company List</h3>
        <p className="text-sm mb-2 text-blue-800">
          Build your Top 10 target companies that match your criteria. This focused approach:
        </p>
        <ul className="text-sm space-y-1 list-disc list-inside text-blue-800">
          <li>Gives you clear targets instead of applying randomly</li>
          <li>Allows you to research each company deeply</li>
          <li>Makes networking and referrals more strategic</li>
          <li>Increases your interview rate by 3x</li>
        </ul>
        <div className="mt-3 pt-3 border-t border-primary-400">
          <p className="text-sm font-semibold mb-1">
            ✨ New: Click "Find Companies" to discover companies matching your criteria!
          </p>
          <p className="text-xs text-primary-100">
            AI-powered suggestions based on your Target Criteria and Industry Research.
          </p>
        </div>
      </div>

      {/* Company Count & Progress */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{companies.length}</div>
          <div className="text-sm text-gray-600">Total Companies</div>
          <div className="text-xs text-gray-500 mt-1">Target: Top 10</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">
            {companies.filter(c => c.priority_score >= 8).length}
          </div>
          <div className="text-sm text-gray-600">High Priority</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">
            {companies.filter(c => c.application_status === 'ready_to_apply').length}
          </div>
          <div className="text-sm text-gray-600">Ready to Apply</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600">
            {companies.filter(c => c.application_status === 'applied').length}
          </div>
          <div className="text-sm text-gray-600">Applied</div>
        </div>
      </div>

      {/* Action Buttons */}
      {!showForm && !showSuggestions && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleFindCompanies}
            disabled={userIndustries.length === 0 || searching}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-semibold hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Sparkles className="w-5 h-5" />
            {searching ? 'Searching...' : 'Find Companies'}
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Manually
          </button>
        </div>
      )}

      {/* Sorting and Filtering Controls */}
      {!showForm && !showSuggestions && companies.length > 0 && (
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Sort By */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-gray-700">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="match_score">Match Score (High to Low)</option>
                <option value="date_added">Recently Added</option>
                <option value="salary">Salary (High to Low)</option>
              </select>
            </div>

            {/* Filter by Location */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-gray-700">Location:</label>
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value as any)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="remote">Remote Only</option>
                <option value="onsite">On-site Only</option>
              </select>
            </div>

            {/* Filter by Salary */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-gray-700">Salary:</label>
              <select
                value={filterSalary}
                onChange={(e) => setFilterSalary(e.target.value as any)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="0-80k">Under $80K</option>
                <option value="80k-120k">$80K - $120K</option>
                <option value="120k+">$120K+</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="ml-auto">
              <span className="text-sm text-gray-600">
                Showing <span className="font-bold text-primary-600">{filteredCompanies.length}</span> of {companies.length} companies
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Suggested Companies List */}
      {showSuggestions && suggestedCompanies.length > 0 && (
        <div className="bg-white border-2 border-primary-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary-600" />
                Top {suggestedCompanies.length} AI-Suggested Companies
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Based on: <span className="font-medium">{userIndustries.map(i => i.industry_name).join(', ')}</span>
                {userCriteria?.geography && <> • <span className="font-medium">{userCriteria.geography}</span></>}
                {userCriteria?.role_function && <> • <span className="font-medium">{userCriteria.role_function}</span></>}
              </p>
            </div>
            <button
              onClick={() => { setShowSuggestions(false); setSuggestedCompanies([]); setAddedCompanyNames(new Set()) }}
              className="text-sm text-gray-500 hover:text-gray-900 px-3 py-1 rounded hover:bg-gray-100"
            >
              ✕ Close
            </button>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {suggestedCompanies.map((company, idx) => {
              const score = company.match_score ?? company.matchScore ?? 75
              const scoreColor = score >= 85 ? 'bg-green-100 text-green-700' : score >= 70 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
              const companyKey = company.company_name || company.name || ''
              const isAdded = addedCompanyNames.has(companyKey)
              return (
                <div
                  key={idx}
                  className="bg-gradient-to-r from-primary-50 to-white border border-primary-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-bold text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">#{idx + 1}</span>
                        <h4 className="text-base font-bold text-gray-900">{company.company_name || company.name}</h4>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${scoreColor}`}>
                          {score}% Match
                        </span>
                      </div>

                      {/* Meta row */}
                      <div className="flex flex-wrap gap-3 text-xs text-gray-600 mb-2">
                        {company.industry && <span>🏭 {company.industry}</span>}
                        {company.headquarters && <span>📍 {company.headquarters}</span>}
                        {company.company_size && <span>👥 {company.company_size}</span>}
                        {company.website && (
                          <a href={company.website} target="_blank" rel="noopener noreferrer"
                            className="text-primary-600 hover:underline flex items-center gap-0.5">
                            <ExternalLink className="w-3 h-3" /> Website
                          </a>
                        )}
                      </div>

                      {/* Why Target */}
                      {company.why_target && (
                        <p className="text-sm text-gray-700 mb-2">
                          <span className="font-semibold text-primary-700">Why target: </span>{company.why_target}
                        </p>
                      )}

                      {/* Details grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-xs text-gray-600">
                        {company.financials_growth && (
                          <div><span className="font-semibold">💰 Financials:</span> {company.financials_growth}</div>
                        )}
                        {company.openings_closings && (
                          <div><span className="font-semibold">📢 Hiring:</span> {company.openings_closings}</div>
                        )}
                        {company.recent_news && (
                          <div className="md:col-span-2"><span className="font-semibold">📰 Recent news:</span> {company.recent_news}</div>
                        )}
                        {company.notes && (
                          <div className="md:col-span-2"><span className="font-semibold">💡 Tip:</span> {company.notes}</div>
                        )}
                      </div>
                    </div>

                    {/* Add Button */}
                    {isAdded ? (
                      <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium text-sm whitespace-nowrap flex-shrink-0 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Added
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAddSuggested(company)}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm whitespace-nowrap flex-shrink-0"
                      >
                        + Add
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="pt-4 border-t border-gray-200 flex gap-3">
            <button
              onClick={() => { setShowSuggestions(false); setShowForm(true) }}
              className="flex-1 px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 font-semibold"
            >
              + Add Different Company
            </button>
            <button
              onClick={() => { setShowSuggestions(false); setSuggestedCompanies([]); setAddedCompanyNames(new Set()) }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingId ? 'Edit Company' : 'Add New Company'}
            </h3>
            <button
              onClick={handleCancel}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="e.g., Stripe, Airbnb, etc."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Industry */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry
              </label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="e.g., FinTech, SaaS"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://company.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* LinkedIn URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                LinkedIn URL
              </label>
              <input
                type="url"
                value={formData.linkedin_url}
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/company/..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Headquarters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Headquarters
              </label>
              <input
                type="text"
                value={formData.headquarters}
                onChange={(e) => setFormData({ ...formData, headquarters: e.target.value })}
                placeholder="e.g., San Francisco, CA"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Company Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Size
              </label>
              <select
                value={formData.company_size}
                onChange={(e) => setFormData({ ...formData, company_size: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select...</option>
                <option value="1-50">1-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-1000">201-1000 employees</option>
                <option value="1001-5000">1001-5000 employees</option>
                <option value="5000+">5000+ employees</option>
              </select>
            </div>

            {/* Revenue Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Revenue Range
              </label>
              <input
                type="text"
                value={formData.revenue_range}
                onChange={(e) => setFormData({ ...formData, revenue_range: e.target.value })}
                placeholder="e.g., $10M-$100M ARR"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Priority Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority Level
              </label>
              <select
                value={formData.priority_score >= 8 ? '9' : formData.priority_score >= 5 ? '5' : '3'}
                onChange={(e) => setFormData({ ...formData, priority_score: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="9">High - Top choice</option>
                <option value="5">Medium - Good fit</option>
                <option value="3">Low - Backup option</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.application_status}
                onChange={(e) => setFormData({ ...formData, application_status: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="researching">Researching</option>
                <option value="ready_to_apply">Ready to Apply</option>
                <option value="applied">Applied</option>
                <option value="not_interested">Not Interested</option>
              </select>
            </div>

            {/* Key Contacts */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key Contacts
              </label>
              <input
                type="text"
                value={formData.key_contacts}
                onChange={(e) => setFormData({ ...formData, key_contacts: e.target.value })}
                placeholder="Names of people you know at this company or want to connect with"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Why Target */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Why Target This Company?
            </label>
            <textarea
              value={formData.why_target}
              onChange={(e) => setFormData({ ...formData, why_target: e.target.value })}
              placeholder="What makes this company a good fit for you?"
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Job Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Job Description
              </label>
              {formData.job_description && (
                <button
                  onClick={() => {
                    // Store job data in localStorage for JD Analyzer
                    const jobData = {
                      companyName: formData.company_name || '',
                      jobTitle: formData.job_title || '',
                      jobDescription: formData.job_description || '',
                      source: 'company-shortlist-form'
                    }
                    localStorage.setItem('jobAnalysisData', JSON.stringify(jobData))
                    // Navigate to JD Analyzer
                    window.open('/resume-builder/jd-analyzer', '_blank')
                  }}
                  className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all text-sm font-medium shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  Analyze in JD Analyzer
                </button>
              )}
            </div>
            <textarea
              value={formData.job_description}
              onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
              placeholder="Paste the full job description here for analysis..."
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
            />
            {formData.job_description && (
              <p className="text-xs text-gray-500 mt-1">
                {formData.job_description.length} characters • Click "Analyze in JD Analyzer" to compare with your resume
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any other notes about this company?"
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
            {saved && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">Saved!</span>
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !formData.company_name.trim()}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {editingId ? 'Update' : 'Add'} Company
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* List of Companies */}
      {companies.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Your Company Shortlist</h3>
          {filteredCompanies.map((company) => (
            <div
              key={company.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-bold text-gray-900">{company.company_name}</h4>
                    {company.priority_score >= 8 && (
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    )}
                    {/* Recently Added Badge */}
                    {isRecentlyAdded(company.created_at) && (
                      <span className="px-2 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-semibold rounded-full animate-pulse">
                        NEW
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {company.industry && (
                      <span className="text-sm text-gray-600">{company.industry}</span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(company.application_status)}`}>
                      {company.application_status?.replace(/_/g, ' ') || 'Unknown'}
                    </span>
                    {/* Days Since Added */}
                    {company.created_at && (
                      <span className="text-xs text-gray-500">
                        Added {getDaysAgo(company.created_at)}
                      </span>
                    )}
                    {/* Days Since Posted */}
                    {company.posted_date && (
                      <span className="text-xs text-purple-600 font-medium">
                        Posted {company.posted_date}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => handleEdit(company)}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(company.id!)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Apply Link Button - Prominent Display */}
              {company.apply_link && (
                <div className="mb-4 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-3 flex-wrap">
                    <a
                      href={company.apply_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg"
                    >
                      <ExternalLink className="w-5 h-5" />
                      Apply Now
                    </a>
                    {company.job_description && (
                      <button
                        onClick={() => {
                          // Store job data in localStorage for JD Analyzer
                          const jobData = {
                            companyName: company.company_name || '',
                            jobTitle: company.job_title || '',
                            jobDescription: company.job_description || '',
                            salary: company.salary_range || '',
                            source: 'company-shortlist-list'
                          }
                          localStorage.setItem('jobAnalysisData', JSON.stringify(jobData))

                          // Open JD Analyzer - it will read from localStorage
                          window.open('/resume-builder/jd-analyzer', '_blank')
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-purple-700 transition-all shadow-sm hover:shadow-md text-sm"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                          <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        Analyze JD
                      </button>
                    )}
                  </div>
                  {company.job_title && (
                    <p className="text-sm text-gray-600 mt-2">
                      Position: <span className="font-semibold">{company.job_title}</span>
                    </p>
                  )}
                  {company.salary_range && (
                    <p className="text-sm text-gray-600 mt-1">
                      Salary: <span className="font-semibold">{company.salary_range}</span>
                    </p>
                  )}
                  {company.posted_date && (
                    <p className="text-xs text-gray-500 mt-1">
                      Posted: {company.posted_date}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2 italic">
                    💡 Click "Analyze JD" to copy all info and open resume matcher
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {company.location && (
                  <div>
                    <span className="font-semibold text-gray-700">Location:</span>
                    <span className="text-gray-600 ml-2">{company.location}</span>
                  </div>
                )}
                {company.headquarters && (
                  <div>
                    <span className="font-semibold text-gray-700">Headquarters:</span>
                    <span className="text-gray-600 ml-2">{company.headquarters}</span>
                  </div>
                )}
                {company.company_size && (
                  <div>
                    <span className="font-semibold text-gray-700">Size:</span>
                    <span className="text-gray-600 ml-2">{company.company_size}</span>
                  </div>
                )}
                {company.match_score && (
                  <div>
                    <span className="font-semibold text-gray-700">Match Score:</span>
                    <span className="text-green-600 ml-2 font-semibold">{company.match_score}%</span>
                  </div>
                )}
                {company.job_description && (
                  <div className="md:col-span-2">
                    <span className="font-semibold text-gray-700">Job Description:</span>
                    <p className="text-gray-600 mt-1 text-sm line-clamp-3">{company.job_description}</p>
                  </div>
                )}
                {company.why_target && (
                  <div className="md:col-span-2">
                    <span className="font-semibold text-gray-700">Why target:</span>
                    <p className="text-gray-600 mt-1">{company.why_target}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {companies.length === 0 && !showForm && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No companies in your shortlist yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-indigo-600 hover:text-indigo-800 font-semibold"
          >
            Add your first company
          </button>
        </div>
      )}
    </div>
  )
}
