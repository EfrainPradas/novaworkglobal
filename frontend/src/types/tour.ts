export interface TourStep {
  target: string
  title: string
  content: string
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto'
  offset?: number
}

export interface TourConfig {
  id: string
  steps: TourStep[]
  autoStart?: boolean
  showHelpTrigger?: boolean
}

export interface TourState {
  completed: boolean
  skipped: boolean
  currentStep: number
  lastViewedAt?: string
}