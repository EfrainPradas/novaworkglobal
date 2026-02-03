// Interview-Magnet Resume System™ Types
// Based on NovaWork Global 2025 Workbook

export interface CARStory {
  id?: string
  user_id?: string
  resume_id?: string | null

  // Core CAR Framework (Challenge-Action-Result)
  role_company: string // "Senior PM at Google"
  year: string // "2020"
  problem_challenge: string // Keeps DB field name compatibility
  actions: string[] // Array of 2-3 actions
  result: string // Quantified outcome
  metrics: string[] // ["25%", "$500K", "10 weeks"]

  // Filtering
  will_do_again: boolean
  competencies: string[] // Skills demonstrated

  // Conversion
  converted_to_bullet: boolean
  bullet_text?: string

  created_at?: string
}

export interface BulletVariation {
  text: string
  emphasis: 'metric' | 'action' | 'scope'
  characterCount: number
}

export interface Accomplishment {
  id?: string
  work_experience_id: string
  par_story_id?: string | null

  // Bullet Content
  bullet_text: string
  raw_bullet?: string

  // Components (for analysis)
  verb?: string // "Increased", "Led", "Reduced"
  scope?: string // "Across 12 product lines"
  action?: string // "by implementing agile"
  metric?: string // "resulting in 40% faster delivery"

  // Display
  order_index: number
  is_featured: boolean

  created_at?: string
}

export interface WorkExperience {
  id?: string
  resume_id: string

  // Company Info
  company_name: string
  company_description?: string
  location_city?: string
  location_country?: string

  // Role Info
  job_title: string
  start_date: string // "YYYY" or "MM/YYYY"
  end_date?: string | null
  is_current: boolean

  // Scope
  scope_description?: string
  budget?: string
  headcount?: string
  geographies?: string[]
  vendors?: string[]

  // Tools
  tools_systems?: string[]

  // Display
  order_index: number

  // Relations
  accomplishments?: Accomplishment[]

  created_at?: string
}

export interface UserResume {
  id?: string
  user_id: string

  // Header Info
  full_name: string
  email?: string
  phone?: string
  location_city?: string
  location_country?: string
  linkedin_url?: string
  portfolio_url?: string

  // Professional Profile (Step 1)
  profile_summary?: string
  areas_of_excellence?: string[]

  // Resume Metadata
  resume_type: 'chronological' | 'functional'
  is_master: boolean
  tailored_for_job_title?: string | null

  // Relations
  work_experiences?: WorkExperience[]
  education?: Education[]
  certifications?: Certification[]

  created_at?: string
  updated_at?: string
}

export interface Education {
  id?: string
  resume_id: string

  degree_title: string
  institution: string
  location?: string
  graduation_year?: string

  order_index: number

  created_at?: string
}

export interface Certification {
  id?: string
  resume_id: string

  certification_name: string
  issuing_organization?: string
  issue_date?: string
  expiry_date?: string
  credential_id?: string
  credential_url?: string

  order_index: number

  created_at?: string
}

export interface JobDescriptionAnalysis {
  id?: string
  user_id: string

  // JD Source
  job_title: string
  company_name?: string
  job_description_text: string
  jd_url?: string

  // AI Extraction
  top_keywords?: KeywordExtraction[]
  extracted_requirements?: any

  // Mapping
  keyword_mapping?: KeywordMapping[]

  created_at?: string
}

export interface KeywordExtraction {
  keyword: string
  count: number
  category: 'hard_skill' | 'soft_skill' | 'tool' | 'certification' | 'other'
  priority_score: number
}

export interface KeywordMapping {
  keyword: string
  where_it_goes: 'profile' | 'skills' | 'accomplishments'
  matching_evidence: string
  status: 'done' | 'tweak' | 'missing'
}

export interface TailoredResume {
  id?: string
  user_id: string
  master_resume_id: string
  jd_analysis_id?: string | null

  // Tailored Content
  tailored_profile?: string
  tailored_skills?: string[]
  tailored_bullets?: any // JSONB

  // Export
  file_url?: string
  filename?: string

  created_at?: string
}

// Competencies (for PAR stories)
export const COMPETENCIES = [
  'Leadership',
  'Technical/Engineering',
  'Strategic Planning',
  'Financial Management',
  'Project Management',
  'Team Building',
  'Negotiation',
  'Problem Solving',
  'Communication',
  'Customer Service',
  'Sales/Business Development',
  'Marketing',
  'Operations',
  'Change Management',
  'Innovation',
  'Data Analysis',
  'Process Improvement'
] as const

export type Competency = typeof COMPETENCIES[number]

// Action Verbs (for bullet points)
export const STRONG_VERBS = [
  'Achieved', 'Accelerated', 'Accomplished', 'Acquired', 'Advanced',
  'Amplified', 'Architected', 'Automated', 'Boosted', 'Built',
  'Championed', 'Closed', 'Coached', 'Collaborated', 'Completed',
  'Consolidated', 'Converted', 'Coordinated', 'Created', 'Decreased',
  'Delivered', 'Demonstrated', 'Designed', 'Developed', 'Directed',
  'Drove', 'Elevated', 'Eliminated', 'Enabled', 'Engineered',
  'Enhanced', 'Established', 'Exceeded', 'Executed', 'Expanded',
  'Facilitated', 'Forged', 'Founded', 'Generated', 'Grew',
  'Guided', 'Hired', 'Implemented', 'Improved', 'Increased',
  'Influenced', 'Initiated', 'Innovated', 'Integrated', 'Launched',
  'Led', 'Leveraged', 'Managed', 'Maximized', 'Mentored',
  'Negotiated', 'Optimized', 'Orchestrated', 'Organized', 'Overhauled',
  'Partnered', 'Pioneered', 'Planned', 'Positioned', 'Produced',
  'Reduced', 'Redesigned', 'Restructured', 'Revitalized', 'Scaled',
  'Spearheaded', 'Streamlined', 'Strengthened', 'Transformed', 'Upgraded'
] as const

export type StrongVerb = typeof STRONG_VERBS[number]
