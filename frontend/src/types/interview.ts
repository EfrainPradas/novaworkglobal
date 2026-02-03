// Interview Mastery System™ Types
// STEP 3: Interview Preparation & Strategy
// Based on Career Coach Connection 2022 Materials

// ============================================
// 1. INTERVIEW PREPARATION (Main Entity)
// ============================================

export interface InterviewPreparation {
  id?: string
  user_id?: string

  // Company & Role
  company_name: string
  position_title: string
  job_description?: string
  jd_url?: string

  // Interview Details
  interview_date?: string // ISO timestamp
  interview_location?: string

  // Interview Type Classification (4 Dimensions)
  interview_type_who?: InterviewTypeWho
  interview_type_how?: InterviewTypeHow
  interview_type_when?: InterviewTypeWhen
  interview_type_how_many?: InterviewTypeHowMany

  // Status
  status: InterviewStatus

  // Progress Tracking (3 Phases)
  phase1_completed: boolean // Before (Prepare)
  phase2_completed: boolean // During (Execution)
  phase3_completed: boolean // After (Follow-up)

  // Oral Introduction (Positioning Statement)
  oral_introduction?: string

  created_at?: string
  updated_at?: string

  // Relations (populated by joins)
  research?: InterviewResearch
  jd_comparisons?: JDComparisonAnalysis[]
  practice_sessions?: InterviewPracticeSession[]
  session_notes?: InterviewSessionNotes
  thank_you_notes?: ThankYouNote[]
  followups?: InterviewFollowup[]
  negotiation_prep?: InterviewNegotiationPrep
}

// ============================================
// 2. INTERVIEW RESEARCH (Phase 1: Before)
// ============================================

export interface InterviewResearch {
  id?: string
  interview_prep_id: string

  // Interviewer Info
  interviewer_name?: string
  interviewer_role?: string
  interviewer_linkedin_url?: string
  common_connections?: string
  interviewer_notes?: string

  // Company Research
  company_news?: string
  company_financials?: string
  company_culture?: string
  industry_trends?: string
  competitors_analyzed?: string[]

  // General Notes
  research_notes?: string
  research_completed: boolean

  created_at?: string
}

// ============================================
// 3. JOB DESCRIPTION COMPARISON (Phase 1: Before)
// ============================================

export interface JDComparisonAnalysis {
  id?: string
  interview_prep_id: string

  // Requirement from Job Description
  responsibility: string

  // My Experience (linked to PAR story or free text)
  my_experience_par_id?: string | null // Links to par_stories.id
  my_experience_text?: string

  // Gap Analysis
  match_level?: MatchLevel
  gap_notes?: string
  how_to_address?: string

  order_index: number

  created_at?: string

  // Relations (populated by joins)
  par_story?: any // Import from resume.ts if needed
}

// ============================================
// 4. INTERVIEW QUESTIONS (Global Library)
// ============================================

export interface InterviewQuestion {
  id?: string

  // Question Details
  question_text: string
  question_category: QuestionCategory
  question_subcategory?: string

  // Source & Context
  source: QuestionSource
  difficulty_level: DifficultyLevel

  // Additional Info
  answering_tips?: string
  common_for_roles?: string[]
  par_methodology_applicable: boolean

  // Metadata
  is_active: boolean

  created_at?: string
}

// ============================================
// 5. MY QUESTION ANSWERS (User's Prepared Answers)
// ============================================

export interface InterviewQuestionAnswer {
  id?: string
  user_id?: string
  question_id: string

  // Answer Content
  answer_text: string

  // Linked PAR Story (if using PAR methodology)
  par_story_id?: string | null // Links to par_stories.id

  // Practice Tracking
  times_practiced: number
  last_practiced_date?: string // ISO timestamp
  confidence_level: number // 1-5 (1=needs work, 5=confident)
  needs_improvement: boolean

  // Notes
  improvement_notes?: string

  created_at?: string
  updated_at?: string

  // Relations (populated by joins)
  question?: InterviewQuestion
  par_story?: any // Import from resume.ts if needed
}

// ============================================
// 6. PRACTICE SESSIONS (Phase 1: Before)
// ============================================

export interface InterviewPracticeSession {
  id?: string
  interview_prep_id: string

  // Practice Details
  practice_type?: PracticeType
  practice_date: string // ISO timestamp
  duration_minutes?: number

  // Questions Practiced
  questions_practiced?: string[] // Array of question_ids (stored as JSONB)

  // Self-Evaluation
  what_went_well?: string
  what_to_improve?: string
  overall_confidence?: number // 1-5

  // Notes
  practice_notes?: string

  created_at?: string
}

// ============================================
// 7. INTERVIEW SESSION NOTES (Phase 2: During)
// ============================================

export interface InterviewSessionNotes {
  id?: string
  interview_prep_id: string

  // Session Info
  session_date?: string // ISO timestamp
  duration_minutes?: number

  // Questions & Answers
  questions_asked?: string[]
  difficult_moments?: string
  things_went_well?: string
  things_to_improve?: string

  // Company Insights (learned during interview)
  company_challenges_discussed?: string
  team_dynamics_observed?: string
  company_culture_insights?: string
  next_steps_mentioned?: string

  // Decision Factors
  salary_discussed?: string
  benefits_discussed?: string
  start_date_discussed?: string

  // My Questions Asked
  my_questions_asked?: string[]

  // Overall Impression
  overall_feeling?: OverallFeeling
  likelihood_to_advance?: LikelihoodToAdvance

  created_at?: string
}

// ============================================
// 8. THANK YOU NOTES (Phase 3: After)
// ============================================

export interface ThankYouNote {
  id?: string
  interview_prep_id: string

  // Recipient Info
  recipient_name: string
  recipient_email: string
  recipient_role?: string

  // Content
  note_subject?: string
  note_body: string

  // Personalization (from interview)
  conversation_callbacks?: string[] // Specific things discussed
  value_propositions?: string[] // What I can contribute
  clarifications?: string[]
  additional_info?: string

  // Tracking
  sent_date?: string // ISO timestamp
  status: ThankYouNoteStatus
  response_received_date?: string // ISO timestamp
  response_notes?: string

  created_at?: string
}

// ============================================
// 9. FOLLOW-UP TRACKING (Phase 3: After)
// ============================================

export interface InterviewFollowup {
  id?: string
  interview_prep_id: string

  // Follow-up Details
  followup_type: FollowupType
  followup_method?: FollowupMethod
  followup_date: string // ISO timestamp
  followup_message?: string

  // Recommended Timeline
  recommended_followup_date?: string // ISO timestamp
  is_within_recommended_timeline: boolean

  // Response
  response_received: boolean
  response_date?: string // ISO timestamp
  response_notes?: string

  // Next Action
  next_action?: string
  next_action_date?: string // ISO timestamp
  next_action_completed: boolean

  created_at?: string
}

// ============================================
// 10. NEGOTIATION PREPARATION (Phase 3: After)
// ============================================

export interface InterviewNegotiationPrep {
  id?: string
  interview_prep_id: string

  // Salary Research
  market_salary_low?: number
  market_salary_mid?: number
  market_salary_high?: number
  salary_sources?: string[]

  // My Targets
  my_minimum_acceptable?: number
  my_target_salary?: number
  my_stretch_goal?: number

  // Other Negotiables
  negotiable_items?: NegotiableItems // JSONB
  non_negotiable_items?: string[]

  // Strategy
  negotiation_strategy?: string
  walk_away_point?: string

  // Offer Received
  offer_received: boolean
  offer_details?: OfferDetails // JSONB
  offer_received_date?: string // ISO timestamp
  offer_deadline?: string // ISO timestamp

  // Decision
  decision_made: boolean
  decision?: NegotiationDecision
  decision_date?: string // ISO timestamp
  decision_notes?: string

  created_at?: string
}

// ============================================
// SUPPORTING TYPES & INTERFACES
// ============================================

export interface NegotiableItems {
  signing_bonus?: number
  equity?: string
  pto_days?: number
  remote_work?: boolean
  relocation_assistance?: boolean
  professional_development?: string
  flexible_hours?: boolean
  other?: string
}

export interface OfferDetails {
  base_salary?: number
  signing_bonus?: number
  equity?: string
  pto_days?: number
  health_benefits?: string
  retirement_match?: string
  other_benefits?: string
  start_date?: string
}

// ============================================
// ENUMS & CONSTANTS
// ============================================

// Interview Status
export type InterviewStatus = 'preparing' | 'scheduled' | 'completed' | 'cancelled'

export const INTERVIEW_STATUSES: InterviewStatus[] = [
  'preparing',
  'scheduled',
  'completed',
  'cancelled'
]

// Interview Type Classification (4 Dimensions)
export type InterviewTypeWho = 'HR/Recruiter' | 'Hiring Manager' | 'Panel'
export type InterviewTypeHow = 'In-person' | 'Virtual' | 'AI'
export type InterviewTypeWhen = 'Screening' | 'Mid-process' | 'Final'
export type InterviewTypeHowMany = 'Individual' | 'Panel' | 'Group'

export const INTERVIEW_TYPE_WHO: InterviewTypeWho[] = [
  'HR/Recruiter',
  'Hiring Manager',
  'Panel'
]

export const INTERVIEW_TYPE_HOW: InterviewTypeHow[] = [
  'In-person',
  'Virtual',
  'AI'
]

export const INTERVIEW_TYPE_WHEN: InterviewTypeWhen[] = [
  'Screening',
  'Mid-process',
  'Final'
]

export const INTERVIEW_TYPE_HOW_MANY: InterviewTypeHowMany[] = [
  'Individual',
  'Panel',
  'Group'
]

// Match Levels (for JD comparison)
export type MatchLevel = 'perfect' | 'good' | 'partial' | 'gap'

export const MATCH_LEVELS: MatchLevel[] = [
  'perfect',
  'good',
  'partial',
  'gap'
]

// Question Categories
export type QuestionCategory = 'skills' | 'interests' | 'values' | 'competency'

export const QUESTION_CATEGORIES: QuestionCategory[] = [
  'skills',
  'interests',
  'values',
  'competency'
]

// Question Sources
export type QuestionSource = 'general' | 'amazon' | 'amex' | 'difficult'

export const QUESTION_SOURCES: QuestionSource[] = [
  'general',
  'amazon',
  'amex',
  'difficult'
]

// Difficulty Levels
export type DifficultyLevel = 'easy' | 'medium' | 'hard'

export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  'easy',
  'medium',
  'hard'
]

// Practice Types
export type PracticeType = 'mirror' | 'video_recording' | 'with_friend' | 'mock_interview'

export const PRACTICE_TYPES: PracticeType[] = [
  'mirror',
  'video_recording',
  'with_friend',
  'mock_interview'
]

// Overall Feeling (interview impression)
export type OverallFeeling = 'excellent' | 'good' | 'neutral' | 'poor'

export const OVERALL_FEELINGS: OverallFeeling[] = [
  'excellent',
  'good',
  'neutral',
  'poor'
]

// Likelihood to Advance
export type LikelihoodToAdvance = 'high' | 'medium' | 'low' | 'unknown'

export const LIKELIHOOD_TO_ADVANCE: LikelihoodToAdvance[] = [
  'high',
  'medium',
  'low',
  'unknown'
]

// Thank You Note Status
export type ThankYouNoteStatus = 'draft' | 'sent' | 'responded'

export const THANK_YOU_NOTE_STATUSES: ThankYouNoteStatus[] = [
  'draft',
  'sent',
  'responded'
]

// Follow-up Types
export type FollowupType = 'thank_you_note' | 'status_check' | 'additional_info' | 'linkedin_message'

export const FOLLOWUP_TYPES: FollowupType[] = [
  'thank_you_note',
  'status_check',
  'additional_info',
  'linkedin_message'
]

// Follow-up Methods
export type FollowupMethod = 'email' | 'phone' | 'linkedin'

export const FOLLOWUP_METHODS: FollowupMethod[] = [
  'email',
  'phone',
  'linkedin'
]

// Negotiation Decision
export type NegotiationDecision = 'accepted' | 'declined' | 'countered'

export const NEGOTIATION_DECISIONS: NegotiationDecision[] = [
  'accepted',
  'declined',
  'countered'
]

// ============================================
// INTERVIEW TYPE DESCRIPTIONS
// ============================================

export const INTERVIEW_TYPE_DESCRIPTIONS = {
  WHO: {
    'HR/Recruiter': 'Expert interviewers - Get ready! They know how to interview.',
    'Hiring Manager': 'Easier! They are looking for someone to fix their problems.',
    'Panel': 'Multiple interviewers assessing you simultaneously.'
  },
  HOW: {
    'In-person': 'Be mindful of appearance, eye contact, and attitude.',
    'Virtual': 'Prepare your surroundings and how you look on camera.',
    'AI': 'Work on keywords, eye contact, and facial expressions.'
  },
  WHEN: {
    'Screening': 'Usually over phone, 30 minutes, verifying basic information.',
    'Mid-process': 'Time to sell yourself as the ideal candidate.',
    'Final': 'Close the deal - demonstrate you are the right choice.'
  },
  HOW_MANY: {
    'Individual': 'One-on-one conversation with single interviewer.',
    'Panel': 'More than one interviewer evaluating you.',
    'Group': 'Multiple interviewees being assessed together.'
  }
} as const

// ============================================
// QUESTION CATEGORY DESCRIPTIONS
// ============================================

export const QUESTION_CATEGORY_DESCRIPTIONS = {
  skills: {
    title: 'Skills Questions',
    purpose: 'Can you do the job? Do you have the knowledge and competencies?',
    strategy: 'Use PAR methodology with specific, quantified examples.'
  },
  interests: {
    title: 'Interests Questions',
    purpose: 'Will you do the job? What do you prefer and like?',
    strategy: 'Show enthusiasm and alignment with the role and company.'
  },
  values: {
    title: 'Values Questions',
    purpose: 'Will you fit with the organization\'s culture? Will you last?',
    strategy: 'Demonstrate cultural fit, professionalism, and long-term commitment.'
  },
  competency: {
    title: 'Competency-Based Questions',
    purpose: 'Understand what you did in the past to predict future performance.',
    strategy: 'ALWAYS use PAR Framework: Problem/Actions/Results with measured outcomes.'
  }
} as const

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getInterviewPhaseProgress(prep: InterviewPreparation): number {
  const phases = [prep.phase1_completed, prep.phase2_completed, prep.phase3_completed]
  const completed = phases.filter(Boolean).length
  return Math.round((completed / 3) * 100)
}

export function getCurrentPhase(prep: InterviewPreparation): 1 | 2 | 3 {
  if (!prep.phase1_completed) return 1
  if (!prep.phase2_completed) return 2
  return 3
}

export function isInterviewUpcoming(prep: InterviewPreparation): boolean {
  if (!prep.interview_date) return false
  const interviewDate = new Date(prep.interview_date)
  const now = new Date()
  return interviewDate > now
}

export function isInterviewPast(prep: InterviewPreparation): boolean {
  if (!prep.interview_date) return false
  const interviewDate = new Date(prep.interview_date)
  const now = new Date()
  return interviewDate < now
}

export function getDaysUntilInterview(prep: InterviewPreparation): number | null {
  if (!prep.interview_date) return null
  const interviewDate = new Date(prep.interview_date)
  const now = new Date()
  const diffTime = interviewDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export function getQuestionsByCategory(
  questions: InterviewQuestion[],
  category: QuestionCategory
): InterviewQuestion[] {
  return questions.filter(q => q.question_category === category)
}

export function getMyAnswerForQuestion(
  questionId: string,
  answers: InterviewQuestionAnswer[]
): InterviewQuestionAnswer | undefined {
  return answers.find(a => a.question_id === questionId)
}

export function calculateAverageConfidence(answers: InterviewQuestionAnswer[]): number {
  if (answers.length === 0) return 0
  const sum = answers.reduce((acc, ans) => acc + ans.confidence_level, 0)
  return Math.round((sum / answers.length) * 10) / 10
}

export function getUnansweredQuestions(
  allQuestions: InterviewQuestion[],
  myAnswers: InterviewQuestionAnswer[]
): InterviewQuestion[] {
  const answeredQuestionIds = new Set(myAnswers.map(a => a.question_id))
  return allQuestions.filter(q => !answeredQuestionIds.has(q.id!))
}

export function getLowConfidenceAnswers(
  answers: InterviewQuestionAnswer[],
  threshold: number = 3
): InterviewQuestionAnswer[] {
  return answers.filter(a => a.confidence_level < threshold)
}

export function formatInterviewDate(dateString: string | undefined): string {
  if (!dateString) return 'Not scheduled'

  const date = new Date(dateString)
  const now = new Date()
  const diffDays = getDaysUntilInterview({ interview_date: dateString } as InterviewPreparation)

  const formatted = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  if (diffDays === null) return formatted
  if (diffDays === 0) return `Today - ${formatted}`
  if (diffDays === 1) return `Tomorrow - ${formatted}`
  if (diffDays > 0) return `In ${diffDays} days - ${formatted}`
  if (diffDays === -1) return `Yesterday - ${formatted}`
  return `${Math.abs(diffDays)} days ago - ${formatted}`
}

export function getMatchLevelColor(level: MatchLevel | undefined): string {
  switch (level) {
    case 'perfect': return 'green'
    case 'good': return 'blue'
    case 'partial': return 'yellow'
    case 'gap': return 'red'
    default: return 'gray'
  }
}

export function getConfidenceLevelLabel(level: number): string {
  if (level <= 1) return 'Needs significant work'
  if (level === 2) return 'Needs improvement'
  if (level === 3) return 'Adequate'
  if (level === 4) return 'Good'
  return 'Very confident'
}

export function getOverallFeelingEmoji(feeling: OverallFeeling | undefined): string {
  switch (feeling) {
    case 'excellent': return '🎉'
    case 'good': return '😊'
    case 'neutral': return '😐'
    case 'poor': return '😔'
    default: return '❓'
  }
}
