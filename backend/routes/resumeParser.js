/**
 * Resume Parser API Route
 * Handles resume upload and AI-powered parsing to extract work experience
 */

import express from 'express'
import multer from 'multer'
import pdf from 'pdf-parse'
import mammoth from 'mammoth'
import { openai } from '../services/openai.js'
import fs from 'fs'
import path from 'path'

import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// 🔒 Security: Require authentication for all resume parsing routes
router.use(requireAuth)

// Configure multer for file uploads
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true)
        } else {
            cb(new Error('Invalid file type. Only PDF and DOCX are allowed.'))
        }
    }
})

// OpenAI client is imported from services/openai.js

/**
 * Extract text from PDF file
 */
async function extractPDFText(filePath) {
    const dataBuffer = fs.readFileSync(filePath)
    const data = await pdf(dataBuffer)
    return data.text
}

/**
 * Extract text from DOCX file
 */
async function extractDOCXText(filePath) {
    const result = await mammoth.extractRawText({ path: filePath })
    return result.value
}

/**
 * Parse the COMPLETE resume using OpenAI
 * Extracts: contact info, profile summary, areas of excellence,
 * work experience (with ALL accomplishments), education, certifications
 */
async function parseResume(resumeText) {
    const prompt = `You are an expert resume parser. Extract ALL content from the following resume and return it in a structured JSON format.

SECTIONS TO EXTRACT:

1. CONTACT INFO:
- full_name, email, phone, city, state, country, linkedin_url

2. PROFILE / SUMMARY:
- profile_summary: The entire professional summary/profile section (or LinkedIn About section).
- who_you_are: A concise professional headline or introductory sentence (e.g., "Senior Software Engineer with 10+ years of experience..."). If using LinkedIn, use the Headline.
- core_skills: A comma-separated string of the most critical hard skills found in the profile (e.g., "React, Node.js, AWS").
- soft_skills: A comma-separated string of soft skills or leadership traits (e.g., "Team Leadership, Communication, Problem Solving").

3. AREAS OF EXCELLENCE / CORE COMPETENCIES:
- areas_of_excellence: Array of skills, competencies, or areas of expertise listed.

4. WORK EXPERIENCE (for each position):
- company_name, job_title, location_city, location_country
- start_date (YYYY-MM), end_date (YYYY-MM or null if current), is_current
- scope_description: Brief 1-2 sentence description of what the role entailed
- accomplishments: Array of ALL bullet points / achievements. Extract EVERY SINGLE bullet point exactly as written. Do NOT summarize, shorten, combine, or skip any. If there are 20 bullets, return all 20. If there are 50, return all 50.

IMPORTANT - "Other positions" sections: If the resume contains a paragraph like "Other positions: Role A at Company X; Role B at Company Y; Role C at Company Z", treat EACH semicolon-separated entry as its own work experience entry. Parse the job_title and company_name from each entry. If no dates are provided, use null for start_date and end_date. Include all of them in the experiences array — do NOT skip them.

5. EDUCATION:
- Array of: degree, field_of_study, institution, graduation_year

6. CERTIFICATIONS:
- Array of: name, issuing_organization, year

CRITICAL RULES:
1. Return ONLY valid JSON. No markdown formatting, no \`\`\` blocks.
2. If a section is not found, use null or empty array [].
3. Parse dates to YYYY-MM format. If dates are missing entirely, return null for both start_date and end_date.
4. DO NOT truncate, summarize, or limit the number of accomplishments. Capture them ALL verbatim.
5. Preserve the original language of the resume (if it's in Spanish, keep it in Spanish).
6. NEVER skip "Other positions" or condensed role listings. Always expand each role into its own experience entry.
7. ABSOLUTELY DO NOT omit roles without dates. If a role has no dates, including condensed "Other positions", extract it and set start_date and end_date to null.

Resume Text:
${resumeText}

Return format:
{
  "contact": {
    "full_name": "string or null",
    "email": "string or null",
    "phone": "string or null",
    "city": "string or null",
    "state": "string or null",
    "country": "string or null",
    "linkedin_url": "string or null"
  },
  "profile_summary": "string or null",
  "who_you_are": "string or null",
  "core_skills": "string or null",
  "soft_skills": "string or null",
  "areas_of_excellence": ["string", ...],
  "experiences": [
    {
      "company_name": "string",
      "job_title": "string",
      "location_city": "string or null",
      "location_country": "string or null",
      "start_date": "YYYY-MM or null",
      "end_date": "YYYY-MM or null",
      "is_current": boolean,
      "scope_description": "string or null",
      "accomplishments": ["string", "string", ...]
    }
  ],
  "education": [
    {
      "degree": "string",
      "field_of_study": "string or null",
      "institution": "string",
      "graduation_year": "string or null"
    }
  ],
  "certifications": [
    {
      "name": "string",
      "issuing_organization": "string or null",
      "year": "string or null"
    }
  ]
}`

    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            {
                role: 'system',
                content: 'You are an expert resume parser. You extract ALL data from resumes into structured JSON, including roles without explicitly defined dates. You NEVER truncate or summarize accomplishments — you capture every single bullet point verbatim. You always return valid JSON without markdown formatting.'
            },
            {
                role: 'user',
                content: prompt
            }
        ],
        temperature: 0.1,
        max_tokens: 16000
    })

    const content = response.choices[0].message.content

    // Remove markdown code blocks if present
    const jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    return JSON.parse(jsonContent)
}

/**
 * POST /api/parse-resume
 * Upload and parse a resume to extract work experience
 */
router.post('/parse-resume', upload.single('file'), async (req, res) => {
    let filePath = null

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' })
        }

        filePath = req.file.path
        const fileType = req.file.mimetype

        console.log(`📄 Processing resume: ${req.file.originalname}`)

        // Extract text based on file type
        let resumeText
        if (fileType === 'application/pdf') {
            resumeText = await extractPDFText(filePath)
        } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            resumeText = await extractDOCXText(filePath)
        } else {
            return res.status(400).json({ error: 'Unsupported file type' })
        }

        if (!resumeText || resumeText.trim().length < 100) {
            return res.status(400).json({ error: 'Could not extract text from resume' })
        }

        console.log(`✅ Extracted ${resumeText.length} characters from resume`)

        // Parse with OpenAI
        console.log('🤖 Parsing complete resume with AI...')
        const parsed = await parseResume(resumeText)

        // Detailed logging
        console.log(`✅ Extracted ${parsed.experiences?.length || 0} work experiences`)
        if (parsed.experiences) {
            parsed.experiences.forEach((exp, i) => {
                console.log(`   📋 ${exp.job_title} at ${exp.company_name}: ${exp.accomplishments?.length || 0} accomplishments`)
            })
        }
        console.log(`✅ Profile summary: ${parsed.profile_summary ? 'Yes' : 'No'}`)
        console.log(`✅ Areas of excellence: ${parsed.areas_of_excellence?.length || 0}`)
        console.log(`✅ Education: ${parsed.education?.length || 0}`)
        console.log(`✅ Certifications: ${parsed.certifications?.length || 0}`)

        // Clean up uploaded file
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
        }

        return res.json(parsed)

    } catch (error) {
        console.error('❌ Error parsing resume:', error)

        // Clean up file on error
        if (filePath && fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath)
            } catch (cleanupError) {
                console.error('Error cleaning up file:', cleanupError)
            }
        }

        return res.status(500).json({
            error: 'Failed to parse resume',
            message: error.message,
            details: error.stack?.split('\n').slice(0, 3).join(' | ')
        })
    }
})

export default router
