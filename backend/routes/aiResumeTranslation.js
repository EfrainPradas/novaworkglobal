/**
 * AI Resume Translation Routes
 *
 * POST /api/ai/translate-resume
 * Translates full resume content between English and Spanish.
 * Returns a new ResumeData object — original data is never modified.
 */

import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { translateResume } from '../services/resumeTranslation.js'

const router = express.Router()
router.use(requireAuth)

router.post('/translate-resume', async (req, res) => {
  try {
    const { resumeData, targetLanguage } = req.body

    if (!resumeData) {
      return res.status(400).json({ error: 'Missing resumeData' })
    }
    if (!targetLanguage || !['en', 'es'].includes(targetLanguage)) {
      return res.status(400).json({ error: 'targetLanguage must be "en" or "es"' })
    }

    const translatedResumeData = await translateResume(resumeData, targetLanguage)

    res.json({ translatedResumeData })
  } catch (error) {
    console.error('❌ /api/ai/translate-resume error:', error)
    res.status(500).json({
      error: 'Failed to translate resume',
      details: error.message
    })
  }
})

export default router