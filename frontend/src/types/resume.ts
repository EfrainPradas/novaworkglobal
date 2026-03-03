// Interview-Magnet Resume System™ Types
// Based on NovaWork Global 2025 Workbook
// V2: Resume Builder Restructure — 4-step workflow

export interface CARStory {
  id?: string
  user_id?: string
  resume_id?: string | null

  // Core CAR Framework (Challenge-Action-Result)
  role_title?: string
  company_name?: string
  start_date?: string
  end_date?: string
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

  // V2 fields
  title?: string
  source_type?: 'manual' | 'imported'
  status?: 'draft' | 'polished'
  skills_tags?: string[]
  linked_work_experience_ids?: string[]

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

  // V2: Role Explanation & Metrics
  role_explanation?: string
  scope_metrics?: ScopeMetrics
  industry_tags?: string[]

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

export interface AccomplishmentBankItem {
  id?: string
  user_id: string

  bullet_text: string
  role_title?: string
  company_name?: string
  start_date?: string
  end_date?: string

  source: 'manual' | 'imported' | 'car_story' | 'ai_generated'
  original_source_id?: string // Ref to work_experience or par_story
  par_story_id?: string

  is_starred: boolean
  times_used: number
  last_used_at?: string

  skills?: string[]
  competencies?: Competency[]

  created_at?: string
  updated_at?: string
}

// ============================================
// V2: Resume Builder Restructure Types
// ============================================

export interface ScopeMetrics {
  clients?: string
  budget?: string
  team_size?: string
  headcount?: string
  sales?: string
  skus?: string
  revenue?: string
  cost_savings?: string
  cycle_time?: string
  sla?: string
  performance?: string
  [key: string]: string | undefined
}

export interface UserContactProfile {
  user_id: string
  first_name: string
  middle_name?: string
  last_name: string
  phone: string
  email?: string
  address_line1?: string
  address_line2?: string
  country: string
  state: string
  city: string
  postal_code?: string
  linkedin_url?: string
  portfolio_url?: string
  contact_info_complete: boolean
  created_at?: string
  updated_at?: string
}

export type YearsExperienceBucket = '0-2' | '3-5' | '6-10' | '10-15' | '15+'

export interface PositioningQuestionnaire {
  id?: string
  user_id: string
  identity_current_title?: string
  identity_target_title?: string
  identity_one_phrase?: string
  years_experience_bucket?: YearsExperienceBucket
  industries?: string[]
  environments?: string[]
  functions?: string[]
  trusted_problems?: string
  impact_types?: string[]
  scale_team_size?: string
  scale_budget?: string
  scale_geo_scope?: string
  scale_project_scale?: string
  strengths?: string[]
  complexity_moment?: string
  colleagues_describe?: string
  differentiator?: string
  job_descriptions?: string[]
  technical_skills_tools?: string[]
  certifications_advanced_training?: string[]
  platforms_systems?: string[]
  methodologies?: string[]
  languages_spoken?: string[]
  top5_accomplishment_ids?: string[]
  largest_result?: string
  most_complex_project?: string
  stakeholder_exposure?: string[]
  created_at?: string
  updated_at?: string
}

export interface GeneratedProfessionalProfile {
  id?: string
  user_id: string
  questionnaire_id?: string
  output_identity_sentence?: string
  output_blended_value_sentence?: string
  output_competency_paragraph?: string
  output_areas_of_excellence?: string
  output_skills_section?: {
    tools_platforms?: string[]
    methodologies?: string[]
    languages?: string[]
  }
  edited_by_user: boolean
  version: number
  created_at?: string
  updated_at?: string
}
