/**
 * Resume Translation Service
 *
 * Client-side service that:
 * 1. Calls the backend translation endpoint
 * 2. Detects resume source language (heuristic)
 * 3. Provides section header maps for EN/ES
 */

export type ResumeLanguage = 'en' | 'es'

export interface SectionHeaders {
  professionalSummary: string
  areasOfExcellence: string
  workExperience: string
  selectedAccomplishments: string
  workHistory: string
  education: string
  certifications: string
  awards: string
  skillsTools: string
  skillsMethodologies: string
  skillsLanguages: string
  present: string
}

export const SECTION_HEADERS: Record<ResumeLanguage, SectionHeaders> = {
  en: {
    professionalSummary: 'Professional Summary',
    areasOfExcellence: 'Areas of Excellence',
    workExperience: 'Work Experience',
    selectedAccomplishments: 'Selected Accomplishments',
    workHistory: 'Work History',
    education: 'Education',
    certifications: 'Certifications',
    awards: 'Awards',
    skillsTools: 'Tools & Platforms',
    skillsMethodologies: 'Methodologies',
    skillsLanguages: 'Languages',
    present: 'Present',
  },
  es: {
    professionalSummary: 'Resumen Profesional',
    areasOfExcellence: 'Áreas de Excelencia',
    workExperience: 'Experiencia Profesional',
    selectedAccomplishments: 'Logros Seleccionados',
    workHistory: 'Historial Laboral',
    education: 'Educación',
    certifications: 'Certificaciones',
    awards: 'Premios',
    skillsTools: 'Herramientas y Plataformas',
    skillsMethodologies: 'Metodologías',
    skillsLanguages: 'Idiomas',
    present: 'Presente',
  },
}

export interface ResumeData {
  contact: any
  summary: string
  areas_of_excellence: string[]
  skills_section: {
    tools_platforms?: string[]
    methodologies?: string[]
    languages?: string[]
  }
  work_experience: any[]
  education: any[]
  certifications: any[]
  awards: any[]
  resume_type: 'chronological' | 'functional'
  master_resume_id: string | null
}

const STORAGE_KEY = 'novawork_translated_resume'

/**
 * Detect the source language of resume content using a heuristic.
 * Checks the professional summary and first accomplishment bullet
 * for Spanish diacritical marks and common Spanish words.
 */
export function detectResumeLanguage(data: ResumeData): ResumeLanguage {
  const sampleTexts: string[] = []

  if (data.summary) sampleTexts.push(data.summary)
  if (data.work_experience?.[0]?.scope_description) {
    sampleTexts.push(data.work_experience[0].scope_description)
  }
  if (data.work_experience?.[0]?.accomplishments?.[0]?.bullet_text) {
    sampleTexts.push(data.work_experience[0].accomplishments[0].bullet_text)
  }
  if (data.areas_of_excellence?.[0]) {
    sampleTexts.push(data.areas_of_excellence[0])
  }

  const combined = sampleTexts.join(' ').toLowerCase()

  // Check for Spanish diacritical marks and common Spanish words
  const spanishMarkers = [
    /[áéíóúñü]/,           // Spanish diacritical marks
    /\bde\b.*\bla\b/,      // "de la" pattern
    /\ben\b.*\bcon\b/,     // "en con" pattern
    /\bdel\b/,
    /\bpor\b/,
    /\bcon\b/,
    /\buna\b/,
    /\bfue\b/,
    /\btuvo\b/,
    /\blíder\b/,
    /\bgerente\b/,
    /\bexperiencia\b/,
    /\bdesarrollo\b/,
    /\bgestión\b/,
    /\bdirigió\b/,
    /\baumentó\b/,
    /\bcreó\b/,
    /\bimplementó\b/,
  ]

  const matchCount = spanishMarkers.filter(pattern => pattern.test(combined)).length

  // Also check for English markers
  const englishMarkers = [
    /\bled\b/i,
    /\bmanaged\b/i,
    /\bdeveloped\b/i,
    /\bimplemented\b/i,
    /\baccomplished\b/i,
    /\bincreased\b/i,
    /\bdecreased\b/i,
    /\bexperience\b/i,
    /\bprofessional\b/i,
    /\bsummary\b/i,
    /\baccomplishments?\b/i,
  ]

  const englishCount = englishMarkers.filter(pattern => pattern.test(combined)).length

  // If there are Spanish diacritical marks, it's almost certainly Spanish
  if (/[áéíóúñü]/.test(combined)) return 'es'
  if (matchCount >= 3) return 'es'
  if (englishCount >= 3 && matchCount < 2) return 'en'
  if (matchCount > englishCount) return 'es'

  // Default to English
  return 'en'
}

/**
 * Call the backend translation endpoint and return translated resume data.
 */
export async function translateResumeData(
  resumeData: ResumeData,
  targetLanguage: ResumeLanguage,
  authToken: string
): Promise<ResumeData> {
  const fallbackApi = window.location.pathname.startsWith('/novaworkglobal')
    ? '/novaworkglobal-api'
    : ''
  const apiUrl = import.meta.env.VITE_API_URL || fallbackApi

  const url = `${apiUrl}/api/ai/translate-resume`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ resumeData, targetLanguage }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Translation failed' }))
    console.error('Translation API error:', response.status, errorData)
    throw new Error(errorData.error || errorData.details || 'Translation failed')
  }

  const { translatedResumeData } = await response.json()
  return translatedResumeData as ResumeData
}

/**
 * Save translated resume data to localStorage for consumption by ResumeFinalPreview.
 */
export function saveTranslatedResumeToStorage(
  resumeData: ResumeData,
  language: ResumeLanguage,
  sectionHeaders: SectionHeaders
): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ resumeData, language, sectionHeaders }))
}

/**
 * Read and consume translated resume data from localStorage.
 * Returns null if no translated data is available.
 * Automatically clears the key after reading (one-time consume).
 */
export function consumeTranslatedResumeFromStorage(): {
  resumeData: ResumeData
  language: ResumeLanguage
  sectionHeaders: SectionHeaders
} | null {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return null

  try {
    const parsed = JSON.parse(stored)
    localStorage.removeItem(STORAGE_KEY)
    return parsed
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}