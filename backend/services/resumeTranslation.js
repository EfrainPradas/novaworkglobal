/**
 * Resume Translation Service
 *
 * Translates full resume content between English and Spanish using OpenAI.
 * Never mutates original data — returns a new ResumeData object with
 * only the translatable text fields changed.
 *
 * Rules enforced by the prompt:
 *  - Professional resume tone, not literal word-for-word
 *  - Preserve company names, certifications, tech terms, dates, metrics, URLs
 *  - Use strong action verbs and ATS-friendly language
 *  - Do not invent achievements, numbers, or credentials
 */

import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY
})

const LANG_MAP = { en: 'English', es: 'Spanish' }
const DEFAULT_MODEL = 'gpt-4o-mini'

const SYSTEM_PROMPT = `You are a professional resume translator specializing in executive and technical resumes.

TASK: Translate the provided resume data from its source language to the target language specified below.

TARGET LANGUAGE: {targetLanguage}

TRANSLATION RULES — FOLLOW EXACTLY:

1. PROFESSIONAL QUALITY: Produce executive-ready resume language. Use strong action verbs, concise phrasing, and achievement-oriented style. Do NOT translate literally word-for-word — adapt for professional impact.

2. TRANSLATE these fields:
   - Professional summary / profile paragraph
   - Areas of excellence
   - Skill labels in "methodologies" (e.g., "Agile Methodology" → "Metodología Ágil")
   - Job titles ONLY when a standard professional equivalent exists (e.g., "Director of Operations" → "Director de Operaciones"). If the title is industry-standard in English, keep it.
   - Scope descriptions / role explanations
   - Accomplishment bullet text
   - Education: degree titles and fields of study (e.g., "Bachelor of Science in Computer Science" → "Licenciatura en Ciencias de la Computación")
   - Certification issuing organizations (only if they have a well-known translated name)

3. DO NOT TRANSLATE — preserve exactly as-is:
   - Company names (e.g., "Google", "Banco Santander" — keep original)
   - Product names and brand names
   - Technology tools, platforms, and frameworks (e.g., "Power BI", "SQL Server", "AWS", "Salesforce")
   - Certification acronyms (e.g., "PMP", "AWS Solutions Architect", "OSHA 30", "Six Sigma Black Belt")
   - University / institution names (e.g., "MIT", "Universidad de Buenos Aires" — keep original)
   - Dates, numbers, percentages, and metrics (e.g., "25%", "$500K", "10 weeks", "2018-2022")
   - URLs, email addresses, phone numbers
   - LinkedIn links
   - City and country names in location fields (e.g., "Miami, FL" stays as-is)
   - Programming languages (e.g., "Python", "JavaScript")

4. ATS ALIGNMENT: Keep the resume ATS-friendly. Use standard section terms in the target language. Keep bullet structure (verb-first, metric-backed).

5. OUTPUT FORMAT: Return a JSON object with the EXACT same structure as the input resumeData, with only the translatable text fields translated. Non-translatable fields must be identical to the input.

6. ACCENT MARKS: If translating to Spanish, include all proper diacritical marks (á, é, í, ó, ú, ñ, ü).

7. DO NOT ADD information that does not exist in the original. Do not invent achievements, metrics, or credentials.`

/**
 * Translate a full resume data object to the target language.
 *
 * @param {Object} resumeData - The full ResumeData object (same shape as frontend ResumeData)
 * @param {string} targetLanguage - 'en' or 'es'
 * @returns {Promise<Object>} A new ResumeData object with translated text fields
 */
export async function translateResume(resumeData, targetLanguage = 'es') {
  if (!resumeData) throw new Error('resumeData is required')
  if (!['en', 'es'].includes(targetLanguage)) throw new Error('targetLanguage must be "en" or "es"')

  const targetLanguageName = LANG_MAP[targetLanguage] || 'Spanish'

  console.log(`🌍 Translating resume to ${targetLanguageName}...`)

  const userPrompt = `Translate the following resume data to ${targetLanguageName}. Return a JSON object with the EXACT same structure, translating only the text fields that should be translated per the rules above.\n\n${JSON.stringify(resumeData, null, 2)}`

  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT.replace('{targetLanguage}', targetLanguageName) },
        { role: 'user', content: userPrompt }
      ]
    })

    const content = response.choices[0]?.message?.content
    if (!content) throw new Error('Empty response from OpenAI')

    const translatedData = JSON.parse(content)

    // Preserve non-translatable fields that AI might have altered
    translatedData.contact = {
      ...translatedData.contact,
      email: resumeData.contact?.email || translatedData.contact?.email,
      phone: resumeData.contact?.phone || translatedData.contact?.phone,
      linkedin: resumeData.contact?.linkedin || translatedData.contact?.linkedin,
      linkedin_url: resumeData.contact?.linkedin_url || translatedData.contact?.linkedin_url,
      portfolio: resumeData.contact?.portfolio || translatedData.contact?.portfolio,
      full_name: resumeData.contact?.full_name || translatedData.contact?.full_name,
    }

    // Ensure work_experience preserves non-translatable fields
    if (Array.isArray(translatedData.work_experience) && Array.isArray(resumeData.work_experience)) {
      translatedData.work_experience = translatedData.work_experience.map((exp, i) => {
        const orig = resumeData.work_experience[i] || {}
        return {
          ...exp,
          company_name: orig.company_name || exp.company_name,
          location_city: orig.location_city || exp.location_city,
          location_country: orig.location_country || exp.location_country,
          start_date: orig.start_date || exp.start_date,
          end_date: orig.end_date || exp.end_date,
          is_current: orig.is_current ?? exp.is_current,
        }
      })
    }

    // Preserve resume_type and master_resume_id
    translatedData.resume_type = resumeData.resume_type
    translatedData.master_resume_id = resumeData.master_resume_id

    console.log(`✅ Resume translation to ${targetLanguageName} complete`)
    return translatedData
  } catch (error) {
    console.error('❌ Resume translation error:', error)
    throw new Error(`Failed to translate resume: ${error.message}`)
  }
}