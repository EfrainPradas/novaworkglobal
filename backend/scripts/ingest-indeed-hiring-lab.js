/**
 * Indeed Hiring Lab Ingestion Script
 *
 * Fetches research articles from Indeed Hiring Lab's RSS feed.
 * Classifies by category and tags for personalization.
 * Ingests into career_feed_items via the careerFeed service.
 *
 * Usage:
 *   node scripts/ingest-indeed-hiring-lab.js
 *   node scripts/ingest-indeed-hiring-lab.js --max=20
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env' })
dotenv.config({ path: '../.env.backend' })

import axios from 'axios'
import { ingestFeedItem } from '../services/careerFeed.js'
import { supabaseAdmin, supabase } from '../services/supabase.js'

// ─── Config ─────────────────────────────────────────────────

const RSS_URL = 'https://www.hiringlab.org/feed/'

// Category classification by keywords in title/description
const CATEGORY_RULES = [
  { keywords: ['jobs report', 'employment', 'payroll', 'job creation', 'job growth'], category: 'hiring_trends' },
  { keywords: ['layoff', 'job cuts', 'reduction', 'downsizing'], category: 'layoffs' },
  { keywords: ['remote', 'hybrid', 'work from home', 'return to office', 'telework'], category: 'remote_work' },
  { keywords: ['salary', 'wage', 'compensation', 'pay', 'earnings'], category: 'salary' },
  { keywords: ['AI', 'artificial intelligence', 'automation', 'machine learning'], category: 'ai_impact' },
  { keywords: ['skill', 'training', 'upskill', 'reskill', 'qualification'], category: 'skills_demand' },
  { keywords: ['gender', 'diversity', 'women', 'equity', 'inclusion'], category: 'industry_shift' },
  { keywords: ['outlook', 'forecast', 'trend', 'jolts', 'labor market', 'economic'], category: 'economic_outlook' },
]

// ─── Simple XML parser (no dependency needed for RSS) ───────

function extractTag(xml, tag) {
  const regex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?</${tag}>`, 's')
  const match = xml.match(regex)
  return match ? match[1].trim() : null
}

function extractAllItems(xml) {
  const items = []
  const regex = /<item>(.*?)<\/item>/gs
  let match
  while ((match = regex.exec(xml)) !== null) {
    items.push(match[1])
  }
  return items
}

function parseRssItem(itemXml) {
  return {
    title: extractTag(itemXml, 'title'),
    link: extractTag(itemXml, 'link'),
    description: extractTag(itemXml, 'description'),
    pubDate: extractTag(itemXml, 'pubDate'),
    creator: extractTag(itemXml, 'dc:creator'),
    guid: extractTag(itemXml, 'guid'),
    categories: [...itemXml.matchAll(/<category[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/category>/g)]
      .map(m => m[1].trim()),
  }
}

// ─── Classification ─────────────────────────────────────────

function classifyCategory(title, description) {
  const text = `${title} ${description}`.toLowerCase()
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(kw => text.includes(kw.toLowerCase()))) {
      return rule.category
    }
  }
  return 'economic_outlook' // Default for Indeed Hiring Lab
}

function classifyCareerGoals(category) {
  const goalMap = {
    hiring_trends: ['transition', 'alignment'],
    layoffs: ['reinvention', 'transition'],
    remote_work: ['transition', 'alignment'],
    salary: ['alignment'],
    ai_impact: ['transition', 'reinvention', 'alignment'],
    skills_demand: ['transition', 'reinvention'],
    industry_shift: ['reinvention', 'transition'],
    economic_outlook: ['transition', 'reinvention', 'alignment'],
  }
  return goalMap[category] ?? ['transition', 'alignment']
}

function extractGeographies(text) {
  const lower = text.toLowerCase()
  const geos = []
  if (/\b(u\.?s\.?|united states|american|america)\b/.test(lower)) geos.push('US')
  if (/\b(europe|european|eu|germany|france|uk|britain)\b/.test(lower)) geos.push('EU')
  if (/\b(latin america|latam|brazil|mexico|colombia)\b/.test(lower)) geos.push('LATAM')
  if (/\b(global|world|international)\b/.test(lower)) geos.push('global')
  return geos.length ? geos : ['US'] // Default to US since Indeed Hiring Lab is US-focused
}

// ─── Get source ID ──────────────────────────────────────────

async function getSourceId() {
  const client = supabaseAdmin || supabase
  const { data, error } = await client
    .from('career_feed_sources')
    .select('id')
    .eq('slug', 'indeed_hiring_lab')
    .single()
  if (error) throw new Error(`Indeed Hiring Lab source not found: ${error.message}`)
  return data.id
}

// ─── Main ───────────────────────────────────────────────────

async function run() {
  const args = process.argv.slice(2)
  const maxArg = args.find(a => a.startsWith('--max='))
  const maxItems = maxArg ? parseInt(maxArg.split('=')[1]) : 30

  console.log(`\n📊 Indeed Hiring Lab Ingestion — max: ${maxItems}`)

  // Fetch RSS
  console.log('   Fetching RSS feed...')
  const { data: rssXml } = await axios.get(RSS_URL, {
    timeout: 15000,
    headers: { 'User-Agent': 'NovaWork-CareerFeed/1.0' },
    responseType: 'text',
  })

  const rawItems = extractAllItems(rssXml)
  console.log(`   Found ${rawItems.length} items in feed`)

  const sourceId = await getSourceId()
  let totalIngested = 0
  let totalSkipped = 0

  const items = rawItems.slice(0, maxItems).map(parseRssItem)

  for (const item of items) {
    if (!item.title || !item.link) continue

    const category = classifyCategory(item.title, item.description ?? '')
    const careerGoals = classifyCareerGoals(category)
    const textForGeo = `${item.title} ${item.description ?? ''}`
    const targetGeographies = extractGeographies(textForGeo)

    // Clean description: strip HTML tags
    const summary = item.description
      ? item.description.replace(/<[^>]+>/g, '').replace(/&[^;]+;/g, ' ').trim().slice(0, 500)
      : null

    try {
      await ingestFeedItem({
        sourceId,
        externalId: `ihl-${item.guid || Buffer.from(item.link).toString('base64url').slice(0, 64)}`,
        title: item.title.trim(),
        summary,
        contentUrl: item.link,
        imageUrl: null,
        publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : null,
        itemType: item.categories?.includes('Spotlight') ? 'report' : 'signal',
        category,
        targetRoles: [], // Indeed Hiring Lab is macro-level, not role-specific
        targetIndustries: [],
        targetGeographies,
        careerGoals,
        relevanceScore: 7.5, // Higher default — Indeed Hiring Lab is authoritative
        metadata: {
          author: item.creator,
          rss_categories: item.categories,
          source: 'Indeed Hiring Lab RSS',
        },
      })
      totalIngested++
      console.log(`   ✓ ${item.title.slice(0, 70)}`)
    } catch (err) {
      if (err.message?.includes('duplicate') || err.code === '23505') {
        totalSkipped++
      } else {
        console.error(`   ⚠️  Error: "${item.title.slice(0, 50)}":`, err.message)
      }
    }
  }

  console.log(`\n✅ Indeed Hiring Lab ingestion complete: ${totalIngested} new, ${totalSkipped} duplicates skipped`)
}

run().catch(err => {
  console.error('❌ Indeed Hiring Lab ingestion failed:', err)
  process.exit(1)
})
