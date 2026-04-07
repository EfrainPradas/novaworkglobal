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
  titleKey?: string
  description: string
  descriptionKey?: string
  tips: string[]
}

export const STEP_DISPLAY_CONFIG: Record<GuidedStepKey, StepDisplayConfig> = {
  profile_basic_info: {
    icon: User,
    color: '#1F5BAA',
    bgColor: '#eef6fc',
    title: 'Contact Information',
    titleKey: 'guidedPath.contactInfo',
    description: 'Set up your professional profile with contact details.',
    descriptionKey: 'guidedPath.contactInfoDesc',
    tips: [
      'Use a professional email address',
      'Include your LinkedIn URL',
      'Add your city and state/country',
    ],
  },
  resume_experience_capture: {
    icon: Briefcase,
    color: '#1F5BAA',
    bgColor: '#eef6fc',
    title: 'Work Experience',
    titleKey: 'guidedPath.workExperience',
    description: 'Add your roles, companies, and key responsibilities.',
    descriptionKey: 'guidedPath.workExperienceDesc',
    tips: [
      'Start with your most recent position',
      'Include dates, company name, and title',
      'Focus on impact, not just duties',
    ],
  },
  experience_foundation: {
    icon: GraduationCap,
    color: '#1F5BAA',
    bgColor: '#eef6fc',
    title: 'Education & Certifications',
    titleKey: 'guidedPath.educationCerts',
    description: 'Add your educational background and certifications.',
    descriptionKey: 'guidedPath.educationCertsDesc',
    tips: [
      'Include degree, institution, and graduation year',
      'Add relevant certifications',
      'Mention honors or relevant coursework',
    ],
  },
  accomplishment_bank: {
    icon: Trophy,
    color: '#1F5BAA',
    bgColor: '#eef6fc',
    title: 'Accomplishment Bank',
    titleKey: 'guidedPath.accomplishmentBank',
    description: 'Capture your key professional accomplishments.',
    descriptionKey: 'guidedPath.accomplishmentBankDesc',
    tips: [
      'Quantify results whenever possible',
      'Use action verbs to start each accomplishment',
      'Focus on outcomes, not activities',
    ],
  },
  car_stories: {
    icon: Star,
    color: '#1F5BAA',
    bgColor: '#eef6fc',
    title: 'CAR Stories',
    titleKey: 'guidedPath.carStories',
    description: 'Build structured stories using Challenge, Action, Result.',
    descriptionKey: 'guidedPath.carStoriesDesc',
    tips: [
      'Challenge: What problem did you face?',
      'Action: What specific steps did you take?',
      'Result: What measurable outcome did you achieve?',
    ],
  },
  professional_positioning: {
    icon: ClipboardList,
    color: '#1F5BAA',
    bgColor: '#eef6fc',
    title: 'Professional Positioning',
    titleKey: 'guidedPath.professionalPositioning',
    description: 'Define your professional brand and value proposition.',
    descriptionKey: 'guidedPath.professionalPositioningDesc',
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
