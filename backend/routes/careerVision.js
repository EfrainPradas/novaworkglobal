/**
 * Career Vision Routes
 * API endpoints for Career Vision feature
 */

import express from 'express'
import { requireAuth, supabase } from '../middleware/auth.js'
import { generateCareerVisionSuggestions, generateCareerVisionStatement, analyzeJobHistory } from '../services/openai.js'

const router = express.Router()

// All Career Vision routes require authentication
router.use(requireAuth)

// ============================================
// CAREER VISION PROFILE
// ============================================

/**
 * GET /api/career-vision/profile
 * Get user's career vision profile
 */
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.id

    console.log(`🎯 Fetching career vision profile for user: ${userId}`)

    const { data, error } = await supabase
      .from('career_vision_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (not an error)
      throw error
    }

    console.log(`✅ Profile ${data ? 'found' : 'not found'}`)

    res.json({
      success: true,
      profile: data || null
    })

  } catch (error) {
    console.error('❌ Error fetching career vision profile:', error)
    res.status(500).json({
      error: 'Failed to fetch profile',
      details: error.message
    })
  }
})

/**
 * POST /api/career-vision/profile
 * Create or update user's career vision profile
 *
 * Body: {
 *   skills_knowledge: string[],
 *   core_values: string[],
 *   interests: string[],
 *   career_vision_statement?: string
 * }
 */
router.post('/profile', async (req, res) => {
  try {
    const userId = req.user.id
    const { skills_knowledge, core_values, interests, career_vision_statement } = req.body

    console.log(`💾 Saving career vision profile for user: ${userId}`)

    // Validate required fields
    if (!skills_knowledge || !core_values || !interests) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'skills_knowledge, core_values, and interests are required'
      })
    }

    // Check if profile exists
    const { data: existing } = await supabase
      .from('career_vision_profiles')
      .select('id')
      .eq('user_id', userId)
      .single()

    let result
    if (existing) {
      // Update existing profile
      const { data, error } = await supabase
        .from('career_vision_profiles')
        .update({
          skills_knowledge,
          core_values,
          interests,
          career_vision_statement,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      result = data
      console.log(`✅ Profile updated`)
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from('career_vision_profiles')
        .insert({
          user_id: userId,
          skills_knowledge,
          core_values,
          interests,
          career_vision_statement
        })
        .select()
        .single()

      if (error) throw error
      result = data
      console.log(`✅ Profile created`)
    }

    // Update user_profiles flags
    await supabase
      .from('user_profiles')
      .update({
        career_vision_started: true
      })
      .eq('user_id', userId)

    res.json({
      success: true,
      profile: result
    })

  } catch (error) {
    console.error('❌ Error saving career vision profile:', error)
    res.status(500).json({
      error: 'Failed to save profile',
      details: error.message
    })
  }
})

// ============================================
// JOB HISTORY ANALYSIS
// ============================================

/**
 * GET /api/career-vision/job-history
 * Get all job history entries for user
 */
router.get('/job-history', async (req, res) => {
  try {
    const userId = req.user.id

    console.log(`📋 Fetching job history for user: ${userId}`)

    const { data, error } = await supabase
      .from('job_history_analysis')
      .select('*')
      .eq('user_id', userId)
      .order('job_order', { ascending: true })

    if (error) throw error

    console.log(`✅ Found ${data.length} job history entries`)

    res.json({
      success: true,
      jobHistory: data
    })

  } catch (error) {
    console.error('❌ Error fetching job history:', error)
    res.status(500).json({
      error: 'Failed to fetch job history',
      details: error.message
    })
  }
})

/**
 * POST /api/career-vision/job-history
 * Create new job history entry
 */
router.post('/job-history', async (req, res) => {
  try {
    const userId = req.user.id
    const jobData = req.body

    console.log(`📝 Creating job history entry for user: ${userId}`)

    // Validate required fields
    if (!jobData.job_title || !jobData.company_name) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'job_title and company_name are required'
      })
    }

    const { data, error } = await supabase
      .from('job_history_analysis')
      .insert({
        user_id: userId,
        ...jobData
      })
      .select()
      .single()

    if (error) throw error

    console.log(`✅ Job history entry created`)

    res.json({
      success: true,
      jobHistory: data
    })

  } catch (error) {
    console.error('❌ Error creating job history:', error)
    res.status(500).json({
      error: 'Failed to create job history',
      details: error.message
    })
  }
})

/**
 * PUT /api/career-vision/job-history/:id
 * Update existing job history entry
 */
router.put('/job-history/:id', async (req, res) => {
  try {
    const userId = req.user.id
    const entryId = req.params.id
    const jobData = req.body

    console.log(`✏️  Updating job history entry: ${entryId}`)

    const { data, error } = await supabase
      .from('job_history_analysis')
      .update(jobData)
      .eq('id', entryId)
      .eq('user_id', userId) // Ensure user owns this entry
      .select()
      .single()

    if (error) throw error

    if (!data) {
      return res.status(404).json({
        error: 'Job history entry not found'
      })
    }

    console.log(`✅ Job history entry updated`)

    res.json({
      success: true,
      jobHistory: data
    })

  } catch (error) {
    console.error('❌ Error updating job history:', error)
    res.status(500).json({
      error: 'Failed to update job history',
      details: error.message
    })
  }
})

/**
 * DELETE /api/career-vision/job-history/:id
 * Delete job history entry
 */
router.delete('/job-history/:id', async (req, res) => {
  try {
    const userId = req.user.id
    const entryId = req.params.id

    console.log(`🗑️  Deleting job history entry: ${entryId}`)

    const { error } = await supabase
      .from('job_history_analysis')
      .delete()
      .eq('id', entryId)
      .eq('user_id', userId) // Ensure user owns this entry

    if (error) throw error

    console.log(`✅ Job history entry deleted`)

    res.json({
      success: true,
      message: 'Job history entry deleted'
    })

  } catch (error) {
    console.error('❌ Error deleting job history:', error)
    res.status(500).json({
      error: 'Failed to delete job history',
      details: error.message
    })
  }
})

// ============================================
// IDEAL WORK PREFERENCES
// ============================================

/**
 * GET /api/career-vision/preferences
 * Get user's work preferences
 */
router.get('/preferences', async (req, res) => {
  try {
    const userId = req.user.id

    console.log(`⚙️  Fetching work preferences for user: ${userId}`)

    const { data, error } = await supabase
      .from('ideal_work_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    console.log(`✅ Preferences ${data ? 'found' : 'not found'}`)

    res.json({
      success: true,
      preferences: data || null
    })

  } catch (error) {
    console.error('❌ Error fetching preferences:', error)
    res.status(500).json({
      error: 'Failed to fetch preferences',
      details: error.message
    })
  }
})

/**
 * POST /api/career-vision/preferences
 * Create or update user's work preferences
 */
router.post('/preferences', async (req, res) => {
  try {
    const userId = req.user.id
    const preferences = req.body

    console.log(`💾 Saving work preferences for user: ${userId}`)

    // Check if preferences exist
    const { data: existing } = await supabase
      .from('ideal_work_preferences')
      .select('id')
      .eq('user_id', userId)
      .single()

    let result
    if (existing) {
      // Update existing preferences
      const { data, error } = await supabase
        .from('ideal_work_preferences')
        .update({
          ...preferences,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      result = data
      console.log(`✅ Preferences updated`)
    } else {
      // Create new preferences
      const { data, error } = await supabase
        .from('ideal_work_preferences')
        .insert({
          user_id: userId,
          ...preferences
        })
        .select()
        .single()

      if (error) throw error
      result = data
      console.log(`✅ Preferences created`)
    }

    res.json({
      success: true,
      preferences: result
    })

  } catch (error) {
    console.error('❌ Error saving preferences:', error)
    res.status(500).json({
      error: 'Failed to save preferences',
      details: error.message
    })
  }
})

// ============================================
// USER PROFILE FLAGS
// ============================================

/**
 * POST /api/career-vision/skip
 * Mark Career Vision as skipped
 */
router.post('/skip', async (req, res) => {
  try {
    const userId = req.user.id

    console.log(`⏭️  User skipping Career Vision: ${userId}`)

    const { error } = await supabase
      .from('user_profiles')
      .update({
        career_vision_skipped: true,
        has_seen_career_vision_prompt: true
      })
      .eq('user_id', userId)

    if (error) throw error

    console.log(`✅ Career Vision marked as skipped`)

    res.json({
      success: true,
      message: 'Career Vision skipped'
    })

  } catch (error) {
    console.error('❌ Error marking skip:', error)
    res.status(500).json({
      error: 'Failed to skip Career Vision',
      details: error.message
    })
  }
})

/**
 * POST /api/career-vision/start
 * Mark Career Vision as started
 */
router.post('/start', async (req, res) => {
  try {
    const userId = req.user.id

    console.log(`🎯 User starting Career Vision: ${userId}`)

    const { error } = await supabase
      .from('user_profiles')
      .update({
        career_vision_started: true,
        has_seen_career_vision_prompt: true
      })
      .eq('user_id', userId)

    if (error) throw error

    console.log(`✅ Career Vision marked as started`)

    res.json({
      success: true,
      message: 'Career Vision started'
    })

  } catch (error) {
    console.error('❌ Error marking start:', error)
    res.status(500).json({
      error: 'Failed to start Career Vision',
      details: error.message
    })
  }
})

/**
 * POST /api/career-vision/complete
 * Mark Career Vision as completed
 */
router.post('/complete', async (req, res) => {
  try {
    const userId = req.user.id

    console.log(`✅ User completing Career Vision: ${userId}`)

    const { error } = await supabase
      .from('user_profiles')
      .update({
        career_vision_completed: true
      })
      .eq('user_id', userId)

    if (error) throw error

    // Also update completed_at in career_vision_profiles
    await supabase
      .from('career_vision_profiles')
      .update({
        completed_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    console.log(`✅ Career Vision marked as completed`)

    res.json({
      success: true,
      message: 'Career Vision completed'
    })

  } catch (error) {
    console.error('❌ Error marking complete:', error)
    res.status(500).json({
      error: 'Failed to complete Career Vision',
      details: error.message
    })
  }
})

/**
 * GET /api/career-vision/status
 * Get user's Career Vision status flags
 */
router.get('/status', async (req, res) => {
  try {
    const userId = req.user.id

    console.log(`📊 Fetching Career Vision status for user: ${userId}`)

    const { data, error } = await supabase
      .from('user_profiles')
      .select('career_vision_started, career_vision_completed, career_vision_skipped, has_seen_career_vision_prompt')
      .eq('user_id', userId)
      .single()

    if (error) throw error

    console.log(`✅ Status retrieved`)

    res.json({
      success: true,
      status: data || {
        career_vision_started: false,
        career_vision_completed: false,
        career_vision_skipped: false,
        has_seen_career_vision_prompt: false
      }
    })

  } catch (error) {
    console.error('❌ Error fetching status:', error)
    res.status(500).json({
      error: 'Failed to fetch status',
      details: error.message
    })
  }
})

// ============================================
// AI-POWERED SUGGESTIONS
// ============================================

/**
 * POST /api/career-vision/suggest
 * Generate AI-powered suggestions for skills, values, and interests
 *
 * Body: {
 *   target_role?: string,
 *   industry?: string,
 *   years_experience?: number,
 *   current_skills?: string[],
 *   current_values?: string[],
 *   current_interests?: string[]
 * }
 */
router.post('/suggest', async (req, res) => {
  try {
    const userId = req.user.id
    const context = req.body

    console.log(`🤖 Generating AI suggestions for user: ${userId}`)

    // Generate suggestions using OpenAI
    const suggestions = await generateCareerVisionSuggestions(context)

    res.json({
      success: true,
      suggestions
    })

  } catch (error) {
    console.error('❌ Error generating suggestions:', error)
    res.status(500).json({
      error: 'Failed to generate suggestions',
      details: error.message
    })
  }
})

/**
 * POST /api/career-vision/generate-statement
 * Generate career vision statement based on user's profile
 *
 * Body: {
 *   skills_knowledge: string[],
 *   core_values: string[],
 *   interests: string[]
 * }
 */
router.post('/generate-statement', async (req, res) => {
  try {
    const userId = req.user.id
    const profile = req.body

    console.log(`📝 Generating career vision statement for user: ${userId}`)

    // Validate required fields
    if (!profile.skills_knowledge || !profile.core_values || !profile.interests) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'skills_knowledge, core_values, and interests are required'
      })
    }

    // Generate statement using OpenAI
    const statement = await generateCareerVisionStatement(profile)

    if (!statement) {
      throw new Error('Failed to generate statement')
    }

    res.json({
      success: true,
      statement
    })

  } catch (error) {
    console.error('❌ Error generating statement:', error)
    res.status(500).json({
      error: 'Failed to generate statement',
      details: error.message
    })
  }
})

/**
 * POST /api/career-vision/analyze-job-history
 * Analyze job history to identify patterns and insights
 *
 * Body: {
 *   jobs: Array<JobHistory>
 * }
 */
router.post('/analyze-job-history', async (req, res) => {
  try {
    const userId = req.user.id
    const { jobs } = req.body

    console.log(`📊 Analyzing job history for user: ${userId}`)

    // Validate
    if (!jobs || !Array.isArray(jobs) || jobs.length < 2) {
      return res.status(400).json({
        error: 'Invalid job history',
        details: 'Please provide at least 2 jobs in an array'
      })
    }

    // Analyze using OpenAI
    const insights = await analyzeJobHistory(jobs)

    res.json({
      success: true,
      insights
    })

  } catch (error) {
    console.error('❌ Error analyzing job history:', error)
    res.status(500).json({
      error: 'Failed to analyze job history',
      details: error.message
    })
  }
})

export default router
