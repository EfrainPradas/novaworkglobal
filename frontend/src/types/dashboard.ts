export type ModuleId = 'career-vision' | 'resume-builder' | 'job-search' | 'interview-mastery'
export type TierLevel = 'essentials' | 'momentum' | 'executive'
export type StepStatus = 'completed' | 'in-progress' | 'not-started'
export type TierBadge = 'Momentum' | 'Essentials' | 'Executive'

export interface DashboardStep {
  id: string
  title: string
  description: string
  status: StepStatus
  route: string
}

export interface DashboardModule {
  id: ModuleId
  title: string
  description: string
  tier: TierBadge
  requiredLevel: TierLevel
  iconBg: string
  completedSteps: number
  totalSteps: number
  steps: DashboardStep[]
  videoSrc: string
  learnMoreRoute: string
  locked: boolean
}

export interface DashboardStats {
  resumeScore: number
  resumeScoreDelta: number
  applicationsTracked: number
  interviewsScheduled: number
  modulesCompleted: number
  totalModules: number
}
