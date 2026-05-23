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

const MAX_RETRIES = 2
const RETRY_DELAYS = [3000, 6000] // ms — waits 3s then 6s before retrying

/**
 * Call the backend translation endpoint and return translated resume data.
 * Retries on 504 (Gateway Timeout) and 429 (Rate Limit) with backoff.
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

  let lastError: Error = new Error('Translation failed')

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 90000) // 90s client-side timeout

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resumeData, targetLanguage }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Translation failed' }))
        const errorMsg = errorData.error || errorData.details || 'Translation failed'

        if ((response.status === 504 || response.status === 429) && attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt]))
          continue
        }

        throw new Error(errorMsg)
      }

      const { translatedResumeData } = await response.json()
      return translatedResumeData as ResumeData
    } catch (err: any) {
      if (err.name === 'AbortError') {
        lastError = new Error('Translation timed out. Please try again.')
        if (attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt]))
          continue
        }
      } else {
        lastError = err
        if (attempt < MAX_RETRIES && (err.message?.includes('504') || err.message?.includes('429') || err.message?.includes('Failed to fetch'))) {
          await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt]))
          continue
        }
      }
      throw err
    }
  }

  throw lastError
}