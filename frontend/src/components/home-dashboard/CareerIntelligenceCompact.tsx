/**
 * CareerIntelligenceCompact
 *
 * Curated external resource links for career intelligence,
 * organized by category with auto-rotating vertical carousel.
 */

import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'

interface ResourceLink {
  labelKey: string
  labelFallback: string
  url: string
}

interface Category {
  titleKey: string
  titleFallback: string
  links: ResourceLink[]
  whyItMattersKey: string
  whyItMattersFallback: string
}

const CATEGORIES: Category[] = [
  {
    titleKey: 'dashboard.careerIntelligence.cat1Title',
    titleFallback: 'Global Hiring and Workforce Moves',
    links: [
      { labelKey: 'dashboard.careerIntelligence.cat1Link1', labelFallback: 'Read Reuters Business News', url: 'https://www.reuters.com/business/' },
      { labelKey: 'dashboard.careerIntelligence.cat1Link2', labelFallback: 'Explore Bloomberg Careers and Economy', url: 'https://www.bloomberg.com/economics' },
      { labelKey: 'dashboard.careerIntelligence.cat1Link3', labelFallback: 'Follow CNBC Work and Careers', url: 'https://www.cnbc.com/work/' },
    ],
    whyItMattersKey: 'dashboard.careerIntelligence.cat1Why',
    whyItMattersFallback: 'Layoffs in one company often signal hiring in another. This is early warning + opportunity detection.',
  },
  {
    titleKey: 'dashboard.careerIntelligence.cat2Title',
    titleFallback: 'Economy and Job Market Signals',
    links: [
      { labelKey: 'dashboard.careerIntelligence.cat2Link1', labelFallback: 'Track U.S. Labor Market Data (BLS)', url: 'https://www.bls.gov/' },
      { labelKey: 'dashboard.careerIntelligence.cat2Link2', labelFallback: 'Read Federal Reserve Economic Insights', url: 'https://www.federalreserve.gov/data.htm' },
      { labelKey: 'dashboard.careerIntelligence.cat2Link3', labelFallback: 'Explore OECD Employment Outlook', url: 'https://www.oecd.org/employment/' },
    ],
    whyItMattersKey: 'dashboard.careerIntelligence.cat2Why',
    whyItMattersFallback: 'Hiring is driven by economics, not just resumes.',
  },
  {
    titleKey: 'dashboard.careerIntelligence.cat3Title',
    titleFallback: 'AI, Automation and Job Disruption',
    links: [
      { labelKey: 'dashboard.careerIntelligence.cat3Link1', labelFallback: 'Read MIT Technology Review (Work & AI)', url: 'https://www.technologyreview.com/topic/artificial-intelligence/' },
      { labelKey: 'dashboard.careerIntelligence.cat3Link2', labelFallback: 'Explore OpenAI News and Updates', url: 'https://openai.com/blog/' },
      { labelKey: 'dashboard.careerIntelligence.cat3Link3', labelFallback: 'Follow Google AI Developments', url: 'https://ai.google/' },
    ],
    whyItMattersKey: 'dashboard.careerIntelligence.cat3Why',
    whyItMattersFallback: 'This is the fastest-moving risk and opportunity zone in your career.',
  },
  {
    titleKey: 'dashboard.careerIntelligence.cat4Title',
    titleFallback: 'Companies Hiring and Industry Moves',
    links: [
      { labelKey: 'dashboard.careerIntelligence.cat4Link1', labelFallback: 'Read TechCrunch Startup News', url: 'https://techcrunch.com/' },
      { labelKey: 'dashboard.careerIntelligence.cat4Link2', labelFallback: 'Explore Crunchbase News', url: 'https://news.crunchbase.com/' },
      { labelKey: 'dashboard.careerIntelligence.cat4Link3', labelFallback: 'Follow VentureBeat AI and Tech Hiring', url: 'https://venturebeat.com/' },
    ],
    whyItMattersKey: 'dashboard.careerIntelligence.cat4Why',
    whyItMattersFallback: 'Funding = hiring (often before jobs are posted).',
  },
  {
    titleKey: 'dashboard.careerIntelligence.cat5Title',
    titleFallback: 'Industry Specific Signals',
    links: [
      { labelKey: 'dashboard.careerIntelligence.cat5Link1', labelFallback: 'Read The Wall Street Journal Careers', url: 'https://www.wsj.com/news/business' },
      { labelKey: 'dashboard.careerIntelligence.cat5Link2', labelFallback: 'Explore Financial Times Work and Careers', url: 'https://www.ft.com/work-careers' },
    ],
    whyItMattersKey: 'dashboard.careerIntelligence.cat5Why',
    whyItMattersFallback: 'Deep dives by sector: tech, healthcare, finance, energy, and more.',
  },
]

const ROTATE_MS = 5_000

export default function CareerIntelligenceCompact() {
  const { t } = useTranslation()
  const [activeIdx, setActiveIdx] = useState(0)
  const [sliding, setSliding] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pausedRef = useRef(false)

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    pausedRef.current = false
    timerRef.current = setInterval(() => {
      if (pausedRef.current) return
      setSliding(true)
      setTimeout(() => {
        setActiveIdx(prev => (prev + 1) % CATEGORIES.length)
        setSliding(false)
      }, 350)
    }, ROTATE_MS)
  }

  useEffect(() => {
    startTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const goTo = (idx: number) => {
    setActiveIdx(idx)
    pausedRef.current = true
    if (timerRef.current) clearInterval(timerRef.current)
    // Resume after 30s of inactivity
    setTimeout(() => startTimer(), 30_000)
  }

  const goPrev = () => goTo((activeIdx - 1 + CATEGORIES.length) % CATEGORIES.length)
  const goNext = () => goTo((activeIdx + 1) % CATEGORIES.length)

  const cat = CATEGORIES[activeIdx]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-bold tracking-widest mb-0.5" style={{ color: '#1976D2' }}>
            {t('dashboard.careerIntelligence.title', 'CAREER INTELLIGENCE')}
          </p>
          <h2 className="text-base font-bold text-slate-800 leading-snug">
            {t('dashboard.careerIntelligence.subtitle', 'Market insights for your career')}
          </h2>
        </div>
        {/* Nav arrows */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={goPrev}
            className="p-1 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={goNext}
            className="p-1 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Category card — carousel */}
      <div className="flex-1 overflow-hidden">
        <div
          style={{
            transition: sliding ? 'opacity 0.35s ease, transform 0.35s ease' : 'none',
            opacity: sliding ? 0 : 1,
            transform: sliding ? 'translateY(-8px)' : 'translateY(0)',
          }}
        >
          {/* Category title */}
          <h3 className="text-sm font-bold text-slate-700 mb-2.5">{t(cat.titleKey, cat.titleFallback)}</h3>

          {/* Links */}
          <div className="flex flex-col gap-1.5 mb-3">
            {cat.links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <ExternalLink size={11} className="text-blue-400 shrink-0" />
                <span className="text-xs font-medium text-blue-600 group-hover:text-blue-800 transition-colors">
                  {t(link.labelKey, link.labelFallback)}
                </span>
              </a>
            ))}
          </div>

          {/* Why it matters */}
          <div className="rounded-lg px-3 py-2" style={{ background: '#F8FAFC' }}>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {cat.whyItMatters}
            </p>
          </div>
        </div>
      </div>

      {/* Dots indicator */}
      <div className="flex items-center justify-center gap-1.5 mt-3">
        {CATEGORIES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === activeIdx ? 16 : 6,
              height: 6,
              background: i === activeIdx ? '#3B82F6' : '#CBD5E1',
            }}
          />
        ))}
      </div>
    </div>
  )
}
