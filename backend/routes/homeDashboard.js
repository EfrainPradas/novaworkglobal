import express from 'express'
import { requireAuth, supabase } from '../middleware/auth.js'

const router = express.Router()

const TIER_ORDER = { essentials: 1, momentum: 2, executive: 3 }

function getAllowedLevels(membershipLevel) {
  const level = membershipLevel || 'essentials'
  return Object.entries(TIER_ORDER)
    .filter(([, order]) => order <= (TIER_ORDER[level] || 1))
    .map(([l]) => l)
}

// GET /api/home-dashboard/overview
router.get('/overview', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const { data, error } = await supabase.rpc('get_dashboard_overview', {
      p_user_id: userId,
    })
    if (error) return res.status(500).json({ error: error.message })
    res.json({ success: true, data })
  } catch (err) {
    console.error('[homeDashboard] /overview error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/home-dashboard/sessions
router.get('/sessions', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const { level, topic, limit } = req.query
    const { data, error } = await supabase.rpc('get_upcoming_member_sessions', {
      p_user_id: userId,
      p_level: level ?? null,
      p_topic: topic ?? null,
      p_limit: parseInt(limit) || 10,
    })
    if (error) return res.status(500).json({ error: error.message })
    res.json({ success: true, data: data ?? [] })
  } catch (err) {
    console.error('[homeDashboard] /sessions error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/home-dashboard/sessions/:id/register
router.post('/sessions/:id/register', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const { data, error } = await supabase.rpc('register_for_member_session', {
      p_user_id: userId,
      p_session_id: req.params.id,
    })
    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  } catch (err) {
    console.error('[homeDashboard] /sessions/:id/register error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/home-dashboard/sessions/:id/cancel
router.post('/sessions/:id/cancel', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const { data, error } = await supabase.rpc('cancel_member_session_registration', {
      p_user_id: userId,
      p_session_id: req.params.id,
    })
    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  } catch (err) {
    console.error('[homeDashboard] /sessions/:id/cancel error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/home-dashboard/resources
router.get('/resources', requireAuth, async (req, res) => {
  try {
    const { membership_level, limit } = req.query
    const allowedLevels = getAllowedLevels(membership_level)
    const { data, error } = await supabase
      .from('dashboard_resources')
      .select('*')
      .in('membership_level', allowedLevels)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(parseInt(limit) || 6)
    if (error) return res.status(500).json({ error: error.message })
    res.json({ success: true, data: data ?? [] })
  } catch (err) {
    console.error('[homeDashboard] /resources error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/home-dashboard/activity
router.get('/activity', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const { limit } = req.query
    const { data, error } = await supabase
      .from('dashboard_activity_log')
      .select('id, action_type, description, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit) || 6)
    if (error) return res.status(500).json({ error: error.message })
    res.json({ success: true, data: data ?? [] })
  } catch (err) {
    console.error('[homeDashboard] /activity error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/home-dashboard/community
router.get('/community', requireAuth, async (req, res) => {
  try {
    const { membership_level, limit } = req.query
    const allowedLevels = getAllowedLevels(membership_level)
    const { data, error } = await supabase
      .from('community_groups')
      .select('*')
      .in('membership_level', allowedLevels)
      .order('is_featured', { ascending: false })
      .order('member_count', { ascending: false })
      .limit(parseInt(limit) || 4)
    if (error) return res.status(500).json({ error: error.message })
    res.json({ success: true, data: data ?? [] })
  } catch (err) {
    console.error('[homeDashboard] /community error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
