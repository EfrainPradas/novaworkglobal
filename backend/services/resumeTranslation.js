/**
 * Resume Translation Service
 *
 * Translates full resume content between English and Spanish using OpenAI.
 * Never mutates original data — returns a new ResumeData object with
 * only the translatable text fields changed.
 */

import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY
})

const LANG_MAP = { en: 'English', es: 'Spanish' }
const DEFAULT_MODEL = 'gpt-4o-mini'

const SYSTEM_PROMPT = `You are a professional bilingual resume translator. Your ONLY job is to translate resume content from one language to another.

CRITICAL: You MUST translate ALL translatable text. Do NOT echo back the original text unchanged unless it is explicitly listed as non-translatable below.

TARGET LANGUAGE: {targetLanguage}

WHAT TO TRANSLATE (change the language of these):
- summary: Translate the entire professional summary paragraph
- areas_of_excellence: Translate each string in the array
- skills_section.tools_platforms: Translate labels but keep tech names (e.g., "Herramientas y Plataformas: Salesforce | Google Workspace | Canva")
- skills_section.methodologies: Translate methodology names where appropriate
- skills_section.languages: Translate language names (e.g., "Inglés", "Español")
- work_experience[].job_title: Translate to professional equivalent in target language
- work_experience[].scope_description: Translate the full scope description
- work_experience[].role_explanation: Translate if present
- work_experience[].accomplishments[].bullet_text: Translate each bullet point with professional resume quality
- education[].degree_title: Translate degree names (e.g., "Bachelor of Arts" → "Licenciatura en Artes")
- education[].field_of_study: Translate field names
- certifications[].certification_name: Keep acronyms, translate descriptive parts
- certifications[].issuing_organization: Translate if a well-known translated name exists
- awards[].certification_name or .name: Translate award names

WHAT NOT TO TRANSLATE (keep exactly as-is):
- Company names, product names, brand names
- Technology tools/platforms/frameworks (Power BI, SQL Server, AWS, Salesforce, etc.)
- Certification acronyms (PMP, AWS, OSHA 30, Six Sigma)
- University/institution names
- Dates, numbers, percentages, metrics (25%, $500K, 10 weeks, 2018-2022)
- URLs, emails, phone numbers, LinkedIn links
- Programming languages (Python, JavaScript)

STYLE RULES:
- Use professional resume language, NOT literal word-for-word translation
- Use strong action verbs appropriate for the target language
- Keep ATS-friendly structure
- Maintain achievement-oriented, metric-backed bullet style
- If translating to Spanish: use proper diacritical marks (á, é, í, ó, ú, ñ, ü)
- If translating to English: use standard US resume style with action verbs

EXAMPLE — Translating a bullet from English to Spanish:
INPUT: "Led cross-functional teams to deliver enterprise software on time and under budget, resulting in a 25% increase in client satisfaction"
OUTPUT: "Lideré equipos multifuncionales para entregar software empresarial a tiempo y dentro del presupuesto, logrando un aumento del 25% en la satisfacción del cliente"

EXAMPLE — Translating a job title from English to Spanish:
INPUT: "Member Services Representative (Teller)"
OUTPUT: "Representante de Servicios al Socio (Cajero)"

You MUST return a valid JSON object with the EXACT same structure as the input. Every field that exists in the input must exist in the output. Only change the text content of translatable fields.`

/**
 * Translate a full resume data object to the target language.
 */
export async function translateResume(resumeData, targetLanguage = 'es') {
  if (!resumeData) throw new Error('resumeData is required')
  if (!['en', 'es'].includes(targetLanguage)) throw new Error('targetLanguage must be "en" or "es"')

  const targetLanguageName = LANG_MAP[targetLanguage] || 'Spanish'

  console.log(`🌍 Translating resume to ${targetLanguageName}...`)

  // Build a focused prompt with just the translatable fields
  const fieldsToTranslate = {
    summary: resumeData.summary || '',
    areas_of_excellence: resumeData.areas_of_excellence || [],
    skills_section: resumeData.skills_section || {},
    work_experience: (resumeData.work_experience || []).map(exp => ({
      id: exp.id,
      job_title: exp.job_title || '',
      scope_description: exp.scope_description || '',
      role_explanation: exp.role_explanation || '',
      accomplishments: (exp.accomplishments || []).map(acc => ({
        id: acc.id,
        bullet_text: acc.bullet_text || '',
      })),
    })),
    education: (resumeData.education || []).map(edu => ({
      id: edu.id,
      degree_title: edu.degree_title || edu.degree_type || edu.degree || '',
      field_of_study: edu.field_of_study || '',
      institution: edu.institution || edu.institution_name || '',
    })),
    certifications: (resumeData.certifications || []).map(cert => ({
      id: cert.id,
      certification_name: cert.certification_name || cert.name || '',
      issuing_organization: cert.issuing_organization || '',
    })),
    awards: (resumeData.awards || []).map(award => ({
      id: award.id,
      name: award.certification_name || award.name || '',
      issuing_organization: award.issuing_organization || '',
    })),
  }

  const userPrompt = `Translate this resume content to ${targetLanguageName}. Return ONLY a JSON object with the same structure, with all translatable text fields translated. Do NOT leave any text in the original language unless it is explicitly non-translatable (company names, tech terms, dates, metrics, URLs).

${JSON.stringify(fieldsToTranslate, null, 2)}`

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

    const translatedFields = JSON.parse(content)

    // Debug: log what OpenAI actually returned for key fields
    console.log('🔍 Translation debug — AI returned:')
    console.log('  summary:', translatedFields.summary?.substring(0, 80) + '...')
    console.log('  areas_of_excellence[0]:', translatedFields.areas_of_excellence?.[0])
    console.log('  work_experience count:', translatedFields.work_experience?.length)
    if (translatedFields.work_experience?.[0]) {
      console.log('  work_exp[0].job_title:', translatedFields.work_experience[0].job_title)
      console.log('  work_exp[0].scope_description:', translatedFields.work_experience[0].scope_description?.substring(0, 60) + '...')
      console.log('  work_exp[0].accomplishments[0].bullet_text:', translatedFields.work_experience[0].accomplishments?.[0]?.bullet_text?.substring(0, 80) + '...')
    }
    console.log('  education[0]?.degree_title:', translatedFields.education?.[0]?.degree_title)

    // Deep-merge: start with original data, overlay translated text fields
    const result = JSON.parse(JSON.stringify(resumeData)) // deep clone

    // Summary
    if (translatedFields.summary && typeof translatedFields.summary === 'string') {
      result.summary = translatedFields.summary
    }

    // Areas of excellence
    if (Array.isArray(translatedFields.areas_of_excellence)) {
      result.areas_of_excellence = translatedFields.areas_of_excellence
    }

    // Skills section
    if (translatedFields.skills_section && typeof translatedFields.skills_section === 'object') {
      if (translatedFields.skills_section.tools_platforms) {
        result.skills_section = {
          ...result.skills_section,
          tools_platforms: translatedFields.skills_section.tools_platforms,
          methodologies: translatedFields.skills_section.methodologies || result.skills_section?.methodologies,
          languages: translatedFields.skills_section.languages || result.skills_section?.languages,
        }
      }
    }

    // Work experience
    if (Array.isArray(translatedFields.work_experience)) {
      translatedFields.work_experience.forEach((translatedExp, i) => {
        if (i < result.work_experience.length) {
          if (translatedExp.job_title) result.work_experience[i].job_title = translatedExp.job_title
          if (translatedExp.scope_description) result.work_experience[i].scope_description = translatedExp.scope_description
          if (translatedExp.role_explanation) result.work_experience[i].role_explanation = translatedExp.role_explanation
          if (Array.isArray(translatedExp.accomplishments)) {
            translatedExp.accomplishments.forEach((translatedAcc, j) => {
              if (j < result.work_experience[i].accomplishments.length) {
                if (translatedAcc.bullet_text) {
                  result.work_experience[i].accomplishments[j].bullet_text = translatedAcc.bullet_text
                }
              }
            })
          }
        }
      })
    }

    // Education
    if (Array.isArray(translatedFields.education)) {
      translatedFields.education.forEach((translatedEdu, i) => {
        if (i < result.education.length) {
          if (translatedEdu.degree_title) {
            result.education[i].degree_title = translatedEdu.degree_title
            if (result.education[i].degree_type) result.education[i].degree_type = translatedEdu.degree_title
            if (result.education[i].degree) result.education[i].degree = translatedEdu.degree_title
          }
          if (translatedEdu.field_of_study) result.education[i].field_of_study = translatedEdu.field_of_study
          // Don't translate institution names
        }
      })
    }

    // Certifications
    if (Array.isArray(translatedFields.certifications)) {
      translatedFields.certifications.forEach((translatedCert, i) => {
        if (i < result.certifications.length) {
          if (translatedCert.certification_name) {
            result.certifications[i].certification_name = translatedCert.certification_name
            if (result.certifications[i].name) result.certifications[i].name = translatedCert.certification_name
          }
          if (translatedCert.issuing_organization) {
            result.certifications[i].issuing_organization = translatedCert.issuing_organization
          }
        }
      })
    }

    // Awards
    if (Array.isArray(translatedFields.awards)) {
      translatedFields.awards.forEach((translatedAward, i) => {
        if (i < result.awards.length) {
          if (translatedAward.name) {
            result.awards[i].certification_name = translatedAward.name
            if (result.awards[i].name) result.awards[i].name = translatedAward.name
          }
          if (translatedAward.issuing_organization) {
            result.awards[i].issuing_organization = translatedAward.issuing_organization
          }
        }
      })
    }

    // Preserve non-translatable fields explicitly
    result.contact = {
      ...result.contact,
      email: resumeData.contact?.email,
      phone: resumeData.contact?.phone,
      linkedin: resumeData.contact?.linkedin,
      linkedin_url: resumeData.contact?.linkedin_url,
      portfolio: resumeData.contact?.portfolio,
      full_name: resumeData.contact?.full_name,
    }

    // Preserve non-translatable fields in work experience
    if (Array.isArray(result.work_experience)) {
      result.work_experience = result.work_experience.map((exp, i) => {
        const orig = resumeData.work_experience?.[i] || {}
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

    result.resume_type = resumeData.resume_type
    result.master_resume_id = resumeData.master_resume_id

    console.log(`✅ Resume translation to ${targetLanguageName} complete`)
    return result
  } catch (error) {
    console.error('❌ Resume translation error:', error)
    throw new Error(`Failed to translate resume: ${error.message}`)
  }
}