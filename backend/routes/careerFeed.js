/**
 * Career Intelligence Feed — Routes
 *
 * Public-facing endpoints:
 *   GET  /api/career-feed              — Personalized feed (approved/published items)
 *   GET  /api/career-feed/:id          — Single item detail
 *   GET  /api/career-feed/sources      — Active sources list
 *   GET  /api/career-feed/preferences  — User's feed preferences
 *   PUT  /api/career-feed/preferences  — Upsert user preferences
 *
 * Curation endpoints (admin/curator):
 *   GET  /api/career-feed/curation/queue    — Curation queue (filterable by status)
 *   GET  /api/career-feed/curation/pending  — Items awaiting review (alias)
 *   PUT  /api/career-feed/curation/:itemId  — Curate an item (approve/reject/publish)
 *   POST /api/career-feed/curation/:itemId/publish  — Publish an approved item
 *   PUT  /api/career-feed/curation/:itemId/featured  — Toggle featured flag
 *   GET  /api/career-feed/curation/stats    — Feed statistics
 */

import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { openai } from '../services/openai.js'
import {
  getPersonalizedFeed,
  getFeedItemById,
  getActiveSources,
  getUserPreferences,
  upsertUserPreferences,
  getCurationQueue,
  getPendingCuration,
  curateFeedItem,
  publishFeedItem,
  toggleFeatured,
  getFeedStats,
} from '../services/careerFeed.js'

const router = express.Router()

const VALID_CURATION_STATUSES = ['pending', 'approved', 'rejected', 'archived', 'published']

// Super users authorized for curation operations
const CURATOR_EMAILS = ['awoodw@gmail.com', 'efrain.pradas@gmail.com', 'isacriperez@gmail.com']

function requireCurator(req, res, next) {
  if (!CURATOR_EMAILS.includes(req.user?.email)) {
    return res.status(403).json({ error: 'Unauthorized. Curation access is restricted.' })
  }
  next()
}

// ─── Public feed ────────────────────────────────────────────

// GET /api/career-feed/sources  (must come before /:id)
router.get('/sources', requireAuth, async (req, res) => {
  try {
    const data = await getActiveSources()
    res.json({ success: true, data })
  } catch (err) {
    console.error('[careerFeed] /sources error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/career-feed/preferences
router.get('/preferences', requireAuth, async (req, res) => {
  try {
    const data = await getUserPreferences(req.user.id)
    res.json({ success: true, data })
  } catch (err) {
    console.error('[careerFeed] GET /preferences error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PUT /api/career-feed/preferences
router.put('/preferences', requireAuth, async (req, res) => {
  try {
    const { targetRoles, targetIndustries, targetGeographies, careerGoal, notificationEnabled } = req.body
    const data = await upsertUserPreferences(req.user.id, {
      targetRoles,
      targetIndustries,
      targetGeographies,
      careerGoal,
      notificationEnabled,
    })
    res.json({ success: true, data })
  } catch (err) {
    console.error('[careerFeed] PUT /preferences error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/career-feed/curation/access — Check if user has curator access
router.get('/curation/access', requireAuth, (req, res) => {
  res.json({ success: true, data: { isCurator: CURATOR_EMAILS.includes(req.user?.email) } })
})

// ─── Curation ───────────────────────────────────────────────

// GET /api/career-feed/curation/queue?status=pending&limit=50&offset=0
router.get('/curation/queue', requireAuth, requireCurator, async (req, res) => {
  try {
    const { status, limit, offset } = req.query
    if (status && !VALID_CURATION_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_CURATION_STATUSES.join(', ')}` })
    }
    const data = await getCurationQueue({
      status: status ?? undefined,
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
    })
    res.json({ success: true, data })
  } catch (err) {
    console.error('[careerFeed] /curation/queue error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/career-feed/curation/pending  (alias for queue?status=pending)
router.get('/curation/pending', requireAuth, requireCurator, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50
    const data = await getPendingCuration(limit)
    res.json({ success: true, data })
  } catch (err) {
    console.error('[careerFeed] /curation/pending error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/career-feed/curation/stats
router.get('/curation/stats', requireAuth, requireCurator, async (req, res) => {
  try {
    const data = await getFeedStats()
    res.json({ success: true, data })
  } catch (err) {
    console.error('[careerFeed] /curation/stats error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PUT /api/career-feed/curation/:itemId  — Full curation update
router.put('/curation/:itemId', requireAuth, requireCurator, async (req, res) => {
  try {
    const { status, curatorNotes, novaworkTake, actionHint, isFeatured } = req.body
    if (!status || !VALID_CURATION_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_CURATION_STATUSES.join(', ')}` })
    }
    const data = await curateFeedItem(req.params.itemId, {
      status,
      curatorNotes,
      novaworkTake,
      actionHint,
      isFeatured,
      curatedBy: req.user.id,
    })
    res.json({ success: true, data })
  } catch (err) {
    console.error('[careerFeed] PUT /curation/:itemId error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/career-feed/curation/:itemId/publish — Quick publish
router.post('/curation/:itemId/publish', requireAuth, requireCurator, async (req, res) => {
  try {
    const data = await publishFeedItem(req.params.itemId, req.user.id)
    res.json({ success: true, data })
  } catch (err) {
    console.error('[careerFeed] POST /curation/:itemId/publish error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PUT /api/career-feed/curation/:itemId/featured — Toggle featured
router.put('/curation/:itemId/featured', requireAuth, requireCurator, async (req, res) => {
  try {
    const { isFeatured } = req.body
    if (typeof isFeatured !== 'boolean') {
      return res.status(400).json({ error: 'isFeatured must be a boolean' })
    }
    const data = await toggleFeatured(req.params.itemId, isFeatured)
    res.json({ success: true, data })
  } catch (err) {
    console.error('[careerFeed] PUT /curation/:itemId/featured error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/career-feed/curation/ai-generate — AI-generate interpretation fields
router.post('/curation/ai-generate', requireAuth, requireCurator, async (req, res) => {
  try {
    const { title, summary, category, sourceSlug, targetRoles, targetIndustries, targetGeographies, careerGoals, field } = req.body

    if (!title) return res.status(400).json({ error: 'Title is required' })
    if (!field || !['novawork_take', 'action_hint', 'curator_notes'].includes(field)) {
      return res.status(400).json({ error: 'field must be: novawork_take, action_hint, or curator_notes' })
    }

    const context = [
      `Title: ${title}`,
      summary ? `Summary: ${summary}` : null,
      category ? `Category: ${category.replace(/_/g, ' ')}` : null,
      sourceSlug ? `Source: ${sourceSlug}` : null,
      targetRoles?.length ? `Relevant roles: ${targetRoles.join(', ')}` : null,
      targetIndustries?.length ? `Industries: ${targetIndustries.join(', ')}` : null,
      targetGeographies?.length ? `Regions: ${targetGeographies.join(', ')}` : null,
      careerGoals?.length ? `Career goals: ${careerGoals.join(', ')}` : null,
    ].filter(Boolean).join('\n')

    const prompts = {
      novawork_take: `You are a career intelligence analyst at NovaWork, a career management platform. Based on this labor market article, write a concise "Why It Matters" interpretation (2-3 sentences) explaining why this is relevant to professionals managing their careers. Be specific, strategic, and actionable. Write in English.\n\nArticle:\n${context}`,
      action_hint: `You are a career coach at NovaWork. Based on this labor market article, write a concise "What To Do Next" recommendation (1-2 sentences) telling the professional exactly what action they should take. Be specific and practical. Reference NovaWork tools when relevant (Resume Builder, Job Search, Career Vision, JD Analyzer, Interview Mastery). Write in English.\n\nArticle:\n${context}`,
      curator_notes: `You are an editorial curator at NovaWork. Write brief internal notes (1-2 sentences) assessing the editorial value of this article for the NovaWork career feed. Mention relevance, quality, and target audience. Write in English.\n\nArticle:\n${context}`,
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompts[field] }],
      max_tokens: 200,
      temperature: 0.7,
    })

    const generated = completion.choices[0]?.message?.content?.trim() ?? ''
    res.json({ success: true, data: { field, text: generated } })
  } catch (err) {
    console.error('[careerFeed] POST /curation/ai-generate error:', err)
    res.status(500).json({ error: 'AI generation failed' })
  }
})

// POST /api/career-feed/ingest/run — Trigger ingestion from admin UI
router.post('/ingest/run', requireAuth, requireCurator, async (req, res) => {
  try {
    const { execSync } = await import('child_process')
    const path = await import('path')
    const { fileURLToPath } = await import('url')
    const __dirname = path.dirname(fileURLToPath(import.meta.url))
    const scriptsDir = path.join(__dirname, '..', 'scripts')

    const { source } = req.body // 'gdelt', 'indeed', or 'all'
    const scriptMap = {
      gdelt: 'ingest-gdelt.js',
      indeed: 'ingest-indeed-hiring-lab.js',
      all: 'ingest-all.js',
    }
    const scriptFile = scriptMap[source] ?? scriptMap.all

    console.log(`[careerFeed] Running ingestion: ${scriptFile}`)
    const output = execSync(`node "${path.join(scriptsDir, scriptFile)}"`, {
      cwd: path.join(__dirname, '..'),
      timeout: 60000,
      encoding: 'utf-8',
    })

    res.json({ success: true, output })
  } catch (err) {
    console.error('[careerFeed] POST /ingest/run error:', err.message)
    res.status(500).json({
      error: 'Ingestion failed',
      output: err.stdout ?? err.message,
    })
  }
})

// ─── Main feed ──────────────────────────────────────────────

// GET /api/career-feed  (main feed)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { category, item_type, limit, offset } = req.query
    const data = await getPersonalizedFeed(req.user.id, {
      category: category ?? undefined,
      itemType: item_type ?? undefined,
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0,
    })
    res.json({ success: true, data })
  } catch (err) {
    console.error('[careerFeed] / error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/career-feed/:id  (single item — must be last)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const data = await getFeedItemById(req.params.id)
    if (!data) return res.status(404).json({ error: 'Item not found' })
    res.json({ success: true, data })
  } catch (err) {
    console.error('[careerFeed] /:id error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
