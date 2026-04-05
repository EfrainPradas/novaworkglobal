/**
 * GDELT Ingestion Script
 *
 * Fetches labor-market news from GDELT DOC 2.0 API (free, no API key).
 * Classifies articles by category and tags them for personalization.
 * Ingests into career_feed_items via the careerFeed service.
 *
 * Usage:
 *   node scripts/ingest-gdelt.js                  # default: last 3 days
 *   node scripts/ingest-gdelt.js --timespan=7d    # last 7 days
 *   node scripts/ingest-gdelt.js --max=20         # limit records
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env' })
dotenv.config({ path: '../.env.backend' })

import axios from 'axios'
import { ingestFeedItem } from '../services/careerFeed.js'
import { supabaseAdmin, supabase } from '../services/supabase.js'

// ─── Config ─────────────────────────────────────────────────

const GDELT_API = 'https://api.gdeltproject.org/api/v2/doc/doc'

const SEARCH_QUERIES = [
  { query: '(hiring OR "talent acquisition" OR "job growth" OR "job creation")', category: 'hiring_trends' },
  { query: '(layoffs OR "job cuts" OR "workforce reduction" OR restructuring)', category: 'layoffs' },
  { query: '("AI skills" OR "artificial intelligence jobs" OR "machine learning careers" OR "AI hiring")', category: 'ai_impact' },
  { query: '("remote work" OR "work from home" OR "hybrid work" OR "return to office")', category: 'remote_work' },
  { query: '("skills demand" OR "skills gap" OR "upskilling" OR "reskilling")', category: 'skills_demand' },
  { query: '("salary trends" OR "wage growth" OR "compensation" OR "pay raise")', category: 'salary' },
  { query: '("career change" OR "career transition" OR "job market outlook" OR "labor market")', category: 'economic_outlook' },
]

// Simple keyword-based classification for roles/industries/geo
const ROLE_KEYWORDS = {
  software_engineer: ['software', 'developer', 'engineering', 'programmer', 'devops', 'fullstack'],
  data_scientist: ['data scientist', 'data analyst', 'machine learning', 'analytics', 'data engineer'],
  product_manager: ['product manager', 'product management', 'product lead'],
  project_manager: ['project manager', 'project management', 'scrum'],
  financial_analyst: ['financial analyst', 'finance', 'banking', 'fintech'],
  marketing_manager: ['marketing', 'digital marketing', 'growth', 'brand'],
  healthcare_admin: ['healthcare', 'health', 'medical', 'nursing', 'hospital'],
  compliance_officer: ['compliance', 'regulatory', 'legal', 'governance'],
}

const INDUSTRY_KEYWORDS = {
  technology: ['tech', 'software', 'AI', 'startup', 'silicon valley', 'SaaS'],
  finance: ['finance', 'banking', 'fintech', 'investment', 'wall street'],
  healthcare: ['healthcare', 'pharma', 'biotech', 'medical', 'hospital'],
  manufacturing: ['manufacturing', 'factory', 'industrial', 'supply chain'],
  energy: ['energy', 'renewable', 'oil', 'gas', 'solar', 'green'],
  consulting: ['consulting', 'advisory', 'professional services'],
}

const GEO_KEYWORDS = {
  US: ['united states', 'u.s.', 'american', 'us economy'],
  EU: ['european', 'europe', 'eu', 'germany', 'france'],
  UK: ['united kingdom', 'uk', 'britain', 'london'],
  LATAM: ['latin america', 'latam', 'brazil', 'mexico', 'colombia'],
  global: ['global', 'worldwide', 'international'],
}

// ─── Helpers ────────────────────────────────────────────────

function matchKeywords(text, keywordMap) {
  const lower = text.toLowerCase()
  return Object.entries(keywordMap)
    .filter(([, keywords]) => keywords.some(kw => lower.includes(kw.toLowerCase())))
    .map(([key]) => key)
}

function parseGdeltDate(seendate) {
  // Format: 20260404T184500Z
  if (!seendate) return null
  const y = seendate.slice(0, 4)
  const m = seendate.slice(4, 6)
  const d = seendate.slice(6, 8)
  const h = seendate.slice(9, 11)
  const min = seendate.slice(11, 13)
  const s = seendate.slice(13, 15)
  return `${y}-${m}-${d}T${h}:${min}:${s}Z`
}

// ─── Fetch from GDELT ───────��───────────────────────────────

async function fetchGdeltArticles(searchQuery, timespan = '3d', maxRecords = 10) {
  try {
    const params = {
      query: `${searchQuery} sourcelang:english`,
      mode: 'artlist',
      maxrecords: maxRecords,
      format: 'json',
      timespan,
    }
    const { data } = await axios.get(GDELT_API, { params, timeout: 15000 })
    return data?.articles ?? []
  } catch (err) {
    console.error(`  [GDELT] fetch error for query "${searchQuery}":`, err.message)
    return []
  }
}

// ─── Get GDELT source ID ───────────────────────────────────

async function getGdeltSourceId() {
  const client = supabaseAdmin || supabase
  const { data, error } = await client
    .from('career_feed_sources')
    .select('id')
    .eq('slug', 'gdelt')
    .single()
  if (error) throw new Error(`GDELT source not found: ${error.message}`)
  return data.id
}

// ─── Main ───────────────────────────────────────────────────

async function run() {
  const args = process.argv.slice(2)
  const timespanArg = args.find(a => a.startsWith('--timespan='))
  const maxArg = args.find(a => a.startsWith('--max='))
  const timespan = timespanArg ? timespanArg.split('=')[1] : '3d'
  const maxPerQuery = maxArg ? parseInt(maxArg.split('=')[1]) : 10

  console.log(`\n📡 GDELT Ingestion — timespan: ${timespan}, max per query: ${maxPerQuery}`)

  const sourceId = await getGdeltSourceId()
  let totalIngested = 0
  let totalSkipped = 0

  for (let qi = 0; qi < SEARCH_QUERIES.length; qi++) {
    const { query, category } = SEARCH_QUERIES[qi]
    // GDELT rate-limits aggressively — wait between queries
    if (qi > 0) await new Promise(r => setTimeout(r, 6000))
    console.log(`\n🔍 Fetching: ${category}`)
    const articles = await fetchGdeltArticles(query, timespan, maxPerQuery)
    console.log(`   Found ${articles.length} articles`)

    for (const article of articles) {
      if (!article.title || !article.url) continue

      const textForClassification = `${article.title} ${article.domain ?? ''}`
      const targetRoles = matchKeywords(textForClassification, ROLE_KEYWORDS)
      const targetIndustries = matchKeywords(textForClassification, INDUSTRY_KEYWORDS)
      const targetGeographies = matchKeywords(textForClassification, GEO_KEYWORDS)

      // Assign career goals based on category
      const careerGoals =
        ['layoffs', 'industry_shift'].includes(category) ? ['reinvention', 'transition'] :
        ['hiring_trends', 'remote_work'].includes(category) ? ['transition', 'alignment'] :
        ['transition', 'reinvention', 'alignment']

      try {
        await ingestFeedItem({
          sourceId,
          externalId: `gdelt-${Buffer.from(article.url).toString('base64url').slice(0, 64)}`,
          title: article.title.trim(),
          summary: null, // GDELT doesn't provide summaries
          contentUrl: article.url,
          imageUrl: article.socialimage || null,
          publishedAt: parseGdeltDate(article.seendate),
          itemType: 'article',
          category,
          targetRoles,
          targetIndustries,
          targetGeographies,
          careerGoals,
          relevanceScore: 5.0, // Neutral default — curators adjust later
          metadata: {
            gdelt_domain: article.domain,
            gdelt_country: article.sourcecountry,
            gdelt_language: article.language,
          },
        })
        totalIngested++
        process.stdout.write('.')
      } catch (err) {
        if (err.message?.includes('duplicate') || err.code === '23505') {
          totalSkipped++
        } else {
          console.error(`\n   ⚠️  Error ingesting "${article.title.slice(0, 50)}":`, err.message)
        }
      }
    }
  }

  console.log(`\n\n✅ GDELT ingestion complete: ${totalIngested} new, ${totalSkipped} duplicates skipped`)
}

run().catch(err => {
  console.error('❌ GDELT ingestion failed:', err)
  process.exit(1)
})
