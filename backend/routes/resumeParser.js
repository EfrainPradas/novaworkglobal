/**
 * Resume Parser API Route
 * Handles resume upload and AI-powered parsing to extract work experience
 */

import express from 'express'
import multer from 'multer'
import pdf from 'pdf-parse'
import mammoth from 'mammoth'
import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'

const router = express.Router()

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

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

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
 * Parse work experience using OpenAI
 */
async function parseWorkExperience(resumeText) {
    const prompt = `You are an expert resume parser. Extract all work experience from the following resume text and return it in a structured JSON format.

For each job/position, extract:
- company_name: The company/organization name
- job_title: The job title/position
- location_city: City where the job was located (if available)
- location_country: Country where the job was located (if available)
- start_date: Start date in YYYY-MM format (e.g., "2020-01")
- end_date: End date in YYYY-MM format or null if current
- is_current: Boolean - true if this is their current job
- scope_description: Brief description of the role/scope (1-2 sentences)
- accomplishments: Array of bullet points describing achievements/responsibilities

IMPORTANT RULES:
1. Return ONLY valid JSON, no markdown formatting
2. If a field is not found, use null
3. Parse dates to YYYY-MM format
4. Extract ALL accomplishments exactly as they appear in the resume text. Do not summarize, shorten, or filter them.
5. Capture every single bullet point found for the role.

Resume Text:
${resumeText}

Return format:
{
  "experiences": [
    {
      "company_name": "string",
      "job_title": "string",
      "location_city": "string or null",
      "location_country": "string or null",
      "start_date": "YYYY-MM",
      "end_date": "YYYY-MM or null",
      "is_current": boolean,
      "scope_description": "string or null",
      "accomplishments": ["string", "string", ...]
    }
  ]
}`

    const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            {
                role: 'system',
                content: 'You are an expert resume parser that extracts work experience data and returns it in structured JSON format. You always return valid JSON without markdown formatting.'
            },
            {
                role: 'user',
                content: prompt
            }
        ],
        temperature: 0.3,
        max_tokens: 4000
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
        console.log('🤖 Parsing with AI...')
        const parsed = await parseWorkExperience(resumeText)

        console.log(`✅ Extracted ${parsed.experiences.length} work experiences`)

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
            message: error.message
        })
    }
})

export default router
