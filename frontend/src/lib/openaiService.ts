// Note: We now use the backend API for all OpenAI operations
// This is more secure and avoids CORS issues

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

export interface ExtractedKeyword {
  keyword: string
  category: 'skill' | 'soft_skill' | 'technical' | 'certification' | 'experience' | 'industry'
  priority: 'high' | 'medium' | 'low'
  whereItGoes: 'profile' | 'skills' | 'accomplishments' | 'work_experience'
  currentMatch: boolean
  matchReason?: string
}

export interface KeywordMapping {
  jdKeyword: string
  resumeKeywords: string[]
  matchType: 'exact' | 'partial' | 'none'
  matchReason?: string
}

export interface ResumeData {
  profile_summary?: string
  areas_of_excellence?: string[]
  par_stories?: Array<{
    problem_challenge: string
    actions: any // JSONB array
    result: string
  }>
  work_experience?: Array<{
    job_title: string
    company_name: string
    scope_description?: string
    start_date?: string
    end_date?: string
    is_current?: boolean
  }>
  user_info?: {
    full_name?: string
    email?: string
    phone?: string
    linkedin_url?: string
    location_city?: string
    location_country?: string
  }
}

/**
 * Extract keywords from job description (legacy function - kept for compatibility)
 */
export async function extractKeywordsFromJD(
  jdText: string,
  jobTitle?: string,
  companyName?: string
): Promise<ExtractedKeyword[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/jd-analyzer/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobDescription: jdText,
        userResume: {} // Empty resume for keyword extraction only
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to analyze job description')
    }

    const data = await response.json()

    if (!data.success || !data.keywords) {
      throw new Error('Invalid response from server')
    }

    // Format keywords to match expected interface
    return data.keywords.map((kw: any) => ({
      keyword: kw.keyword,
      category: kw.category,
      priority: kw.priority,
      whereItGoes: kw.whereItGoes,
      currentMatch: kw.currentMatch || false,
      matchReason: kw.matchReason
    }))
  } catch (error: any) {
    console.error('Error extracting keywords from JD:', error)
    throw new Error(`Failed to extract keywords: ${error.message}`)
  }
}

/**
 * Analyze user's resume and match it against extracted keywords using backend API
 */
export async function analyzeResumeMatch(
  resumeData: ResumeData,
  keywords: ExtractedKeyword[]
): Promise<{
  matchedKeywords: ExtractedKeyword[]
  matchScore: number
  keywordMapping: KeywordMapping[]
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/jd-analyzer/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobDescription: '', // Empty for resume matching only
        userResume: resumeData,
        keywords: keywords
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to analyze resume match')
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error('Invalid response from server')
    }

    // For now, return a simplified version
    // The backend already does keyword matching, but we need to match the expected interface
    const keywordsWithMatch = data.keywords.map((kw: any) => ({
      ...kw,
      currentMatch: kw.currentMatch || false,
      matchReason: kw.matchReason
    }))

    const matchScore = data.matchScore || 0
    const matchedKeywords = keywordsWithMatch.filter((kw: any) => kw.currentMatch)

    // Create keyword mappings
    const keywordMapping: KeywordMapping[] = keywordsWithMatch.map((kw: any) => ({
      jdKeyword: kw.keyword,
      resumeKeywords: kw.currentMatch ? [kw.keyword] : [],
      matchType: kw.currentMatch ? 'exact' : 'none' as const
    }))

    return {
      matchedKeywords,
      matchScore,
      keywordMapping
    }
  } catch (error: any) {
    console.error('Error analyzing resume match:', error)
    throw new Error(`Failed to analyze resume match: ${error.message}`)
  }
}

/**
 * Combined function to analyze job description and resume together
 */
export async function analyzeJDAndResume(
  jobDescription: string,
  resumeData: ResumeData
): Promise<{
  keywords: ExtractedKeyword[]
  matchScore: number
  matchedKeywords: ExtractedKeyword[]
  keywordMapping: KeywordMapping[]
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/jd-analyzer/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobDescription,
        userResume: resumeData
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to analyze job description and resume')
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error('Invalid response from server')
    }

    const keywords = data.keywords.map((kw: any) => ({
      keyword: kw.keyword,
      category: kw.category,
      priority: kw.priority,
      whereItGoes: kw.whereItGoes,
      currentMatch: kw.currentMatch || false,
      matchReason: kw.matchReason
    }))

    const matchScore = data.matchScore || 0
    const matchedKeywords = keywords.filter((kw: ExtractedKeyword) => kw.currentMatch)

    // Create keyword mappings
    const keywordMapping: KeywordMapping[] = keywords.map((kw: ExtractedKeyword) => ({
      jdKeyword: kw.keyword,
      resumeKeywords: kw.currentMatch ? [kw.keyword] : [],
      matchType: kw.currentMatch ? 'exact' : 'none' as const
    }))

    return {
      keywords,
      matchScore,
      matchedKeywords,
      keywordMapping
    }
  } catch (error: any) {
    console.error('Error analyzing JD and resume:', error)
    throw new Error(`Failed to analyze: ${error.message}`)
  }
}

/**
 * Check if backend API is properly configured and accessible
 */
export function isOpenAIConfigured(): boolean {
  // In the new architecture, we assume OpenAI is configured on the backend
  // The frontend will know if there are issues when API calls fail
  return true
}