import express from 'express'

const router = express.Router()

// ── In-memory cache (30 minutes) ────────────────────────────────────────────
let cache = null
const CACHE_TTL = 30 * 60 * 1000 // 30 min

// ── Tag classifier ───────────────────────────────────────────────────────────
function classifyTag(title = '', description = '') {
  const text = (title + ' ' + description).toLowerCase()
  if (/\d+%|percent|survey|report|study|data|statistics|index|rate/.test(text)) return 'data'
  if (/trend|rise|surge|rebound|growth|increase|demand|record|boom|decline/.test(text)) return 'trend'
  if (/tip|strategy|how to|advice|guide|skill|way to|steps|secret|approach/.test(text)) return 'strategy'
  return 'insight'
}

// ── Static fallback (shown when no API key or fetch fails) ───────────────────
const FALLBACK_ITEMS = [
  {
    tag: 'data',
    title: 'AI & automation skills now listed in 72% of new job postings',
    excerpt: 'Employers across industries are prioritizing candidates with AI fluency, prompt engineering, and automation tool experience.',
    url: null,
  },
  {
    tag: 'trend',
    title: 'Remote work demand rebounds — hybrid roles up 34% YoY',
    excerpt: 'After a wave of return-to-office mandates, hybrid arrangements are surging again as companies compete for top talent.',
    url: null,
  },
  {
    tag: 'strategy',
    title: 'Networking accounts for 70–80% of jobs filled — most never posted',
    excerpt: 'The hidden job market is larger than ever. Relationships, referrals, and community remain the most reliable path to new roles.',
    url: null,
  },
  {
    tag: 'insight',
    title: 'Career changers land roles 2× faster when they quantify impact',
    excerpt: 'Resumes with specific metrics and results outperform generic descriptions in both ATS screening and recruiter reviews.',
    url: null,
  },
]

// ── GET /api/market-news ─────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  // Return cached data if still fresh
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return res.json({ items: cache.data, source: 'cache' })
  }

  const apiKey = process.env.NEWS_API_KEY
  if (!apiKey) {
    console.warn('[marketNews] NEWS_API_KEY not set — using fallback data')
    return res.json({ items: FALLBACK_ITEMS, source: 'fallback' })
  }

  try {
    const query = encodeURIComponent(
      '("job market" OR "hiring" OR "unemployment rate" OR "layoffs" OR "job seekers") AND (employment OR jobs OR hiring OR resume OR interview)'
    )
    const url = `https://newsapi.org/v2/everything?q=${query}&language=en&sortBy=relevancy&pageSize=15&apiKey=${apiKey}`

    const response = await fetch(url)
    const json = await response.json()

    if (json.status !== 'ok') {
      throw new Error(json.message || 'NewsAPI error')
    }

    const items = json.articles
      .filter(a => a.title && a.description && !a.title.includes('[Removed]'))
      .slice(0, 4)
      .map(article => ({
        tag: classifyTag(article.title, article.description),
        // Strip " - Source Name" suffix common in NewsAPI titles
        title: article.title.replace(/\s[-–|]\s[^-–|]+$/, '').trim(),
        excerpt: article.description?.slice(0, 140) || '',
        url: article.url || null,
        publishedAt: article.publishedAt,
        source: article.source?.name || null,
      }))

    cache = { data: items, fetchedAt: Date.now() }
    console.log(`[marketNews] Fetched ${items.length} articles from NewsAPI`)
    res.json({ items, source: 'newsapi' })

  } catch (err) {
    console.error('[marketNews] fetch error:', err.message, '— using fallback')
    res.json({ items: FALLBACK_ITEMS, source: 'fallback' })
  }
})

export default router
