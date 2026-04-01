/**
 * Smart Guided Path — Constants & Display Metadata
 */

import {
  User,
  Briefcase,
  GraduationCap,
  Trophy,
  Star,
  ClipboardList,
  FileCheck,
} from 'lucide-react'
import type { GuidedStepKey } from '../types/guidedPath'
import type { LucideIcon } from 'lucide-react'

export interface StepDisplayConfig {
  icon: LucideIcon
  color: string
  bgColor: string
  title: string
  description: string
  tips: string[]
}

export const STEP_DISPLAY_CONFIG: Record<GuidedStepKey, StepDisplayConfig> = {
  profile_basic_info: {
    icon: User,
    color: '#1F5BAA',
    bgColor: '#EFF6FF',
    title: 'Contact Information',
    description: 'Set up your professional profile with contact details.',
    tips: [
      'Use a professional email address',
      'Include your LinkedIn URL',
      'Add your city and state/country',
    ],
  },
  resume_experience_capture: {
    icon: Briefcase,
    color: '#10B981',
    bgColor: '#ECFDF5',
    title: 'Work Experience',
    description: 'Add your roles, companies, and key responsibilities.',
    tips: [
      'Start with your most recent position',
      'Include dates, company name, and title',
      'Focus on impact, not just duties',
    ],
  },
  experience_foundation: {
    icon: GraduationCap,
    color: '#8B5CF6',
    bgColor: '#F5F3FF',
    title: 'Education & Certifications',
    description: 'Add your educational background and certifications.',
    tips: [
      'Include degree, institution, and graduation year',
      'Add relevant certifications',
      'Mention honors or relevant coursework',
    ],
  },
  accomplishment_bank: {
    icon: Trophy,
    color: '#D97706',
    bgColor: '#FFFBEB',
    title: 'Accomplishment Bank',
    description: 'Capture your key professional accomplishments.',
    tips: [
      'Quantify results whenever possible',
      'Use action verbs to start each accomplishment',
      'Focus on outcomes, not activities',
    ],
  },
  car_stories: {
    icon: Star,
    color: '#EF4444',
    bgColor: '#FEF2F2',
    title: 'CAR Stories',
    description: 'Build structured stories using Challenge, Action, Result.',
    tips: [
      'Challenge: What problem did you face?',
      'Action: What specific steps did you take?',
      'Result: What measurable outcome did you achieve?',
    ],
  },
  professional_positioning: {
    icon: ClipboardList,
    color: '#0D9488',
    bgColor: '#F0FDFA',
    title: 'Professional Positioning',
    description: 'Define your professional brand and value proposition.',
    tips: [
      'Think about what makes you unique',
      'Identify your target role and industry',
      'Craft a compelling professional summary',
    ],
  },
  guided_path_complete: {
    icon: FileCheck,
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    title: 'Finalize Resume',
    description: 'Review and export your completed resume.',
    tips: [
      'Review all sections for accuracy',
      'Choose a professional template',
      'Export in PDF format',
    ],
  },
}

export const STEP_ROUTE_MAP: Record<GuidedStepKey, string> = {
  profile_basic_info: '/dashboard/resume/contact-info',
  resume_experience_capture: '/dashboard/resume/work-experience',
  experience_foundation: '/dashboard/resume/work-experience',
  accomplishment_bank: '/dashboard/resume/accomplishments-hub',
  car_stories: '/dashboard/resume/car-stories',
  professional_positioning: '/dashboard/resume/questionnaire',
  guided_path_complete: '/dashboard/resume/final-preview',
}

export const GUIDED_PATH_STORAGE_KEY = 'guided_mode_enabled'
