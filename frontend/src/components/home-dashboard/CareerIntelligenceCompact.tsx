/**
 * CareerIntelligenceCompact
 *
 * Curated external resource links for career intelligence,
 * organized by category with auto-rotating vertical carousel.
 */

import { useState, useEffect, useRef } from 'react'
import { ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'

interface ResourceLink {
  label: string
  url: string
}

interface Category {
  title: string
  links: ResourceLink[]
  whyItMatters: string
}

const CATEGORIES: Category[] = [
  {
    title: 'Global Hiring & Workforce Moves',
    links: [
      { label: 'Read Reuters Business News', url: 'https://www.reuters.com/business/' },
      { label: 'Explore Bloomberg Careers & Economy', url: 'https://www.bloomberg.com/economics' },
      { label: 'Follow CNBC Work & Careers', url: 'https://www.cnbc.com/work/' },
    ],
    whyItMatters: 'Layoffs in one company often signal hiring in another. This is early warning + opportunity detection.',
  },
  {
    title: 'Economy & Job Market Signals',
    links: [
      { label: 'Track U.S. Labor Market Data (BLS)', url: 'https://www.bls.gov/' },
      { label: 'Read Federal Reserve Economic Insights', url: 'https://www.federalreserve.gov/data.htm' },
      { label: 'Explore OECD Employment Outlook', url: 'https://www.oecd.org/employment/' },
    ],
    whyItMatters: 'Hiring is driven by economics\u2014not just resumes.',
  },
  {
    title: 'AI, Automation & Job Disruption',
    links: [
      { label: 'Read MIT Technology Review (Work & AI)', url: 'https://www.technologyreview.com/topic/artificial-intelligence/' },
      { label: 'Explore OpenAI News & Updates', url: 'https://openai.com/blog/' },
      { label: 'Follow Google AI Developments', url: 'https://ai.google/' },
    ],
    whyItMatters: 'This is the fastest-moving risk and opportunity zone in your career.',
  },
  {
    title: 'Companies Hiring & Industry Moves',
    links: [
      { label: 'Read TechCrunch Startup News', url: 'https://techcrunch.com/' },
      { label: 'Explore Crunchbase News', url: 'https://news.crunchbase.com/' },
      { label: 'Follow VentureBeat AI & Tech Hiring', url: 'https://venturebeat.com/' },
    ],
    whyItMatters: 'Funding = hiring (often before jobs are posted).',
  },
  {
    title: 'Industry-Specific Signals',
    links: [
      { label: 'Read The Wall Street Journal Careers', url: 'https://www.wsj.com/news/business' },
      { label: 'Explore Financial Times Work & Careers', url: 'https://www.ft.com/work-careers' },
    ],
    whyItMatters: 'Deep dives by sector\u2014tech, healthcare, finance, energy, and more.',
  },
]

const ROTATE_MS = 5_000

export default function CareerIntelligenceCompact() {
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
            CAREER INTELLIGENCE
          </p>
          <h2 className="text-base font-bold text-slate-800 leading-snug">
            Market insights for your career
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
          <h3 className="text-sm font-bold text-slate-700 mb-2.5">{cat.title}</h3>

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
                  {link.label}
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
