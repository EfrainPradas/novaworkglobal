import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Brain, Star, Sparkles, CheckCircle2 } from 'lucide-react'

export default function CareerVisionLearnMore() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white dark:bg-[#030711] font-sans text-[#10223e] dark:text-slate-200 transition-colors duration-300">
      <style dangerouslySetInnerHTML={{
        __html: `
          .hero-gradient-cv {
            background: radial-gradient(circle at top right, rgba(57,208,216,0.18), transparent 28%),
                        linear-gradient(180deg, #f0f6ff 0%, #e8f4fb 100%);
          }
          .dark .hero-gradient-cv {
            background: radial-gradient(circle at top right, rgba(57,208,216,0.12), transparent 30%),
                        radial-gradient(circle at bottom left, rgba(20,58,114,0.15), transparent 40%),
                        linear-gradient(180deg, #030711 0%, #0a1329 100%);
          }
          .cv-card {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .cv-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 20px 40px rgba(10, 32, 74, 0.08);
          }
        `
      }} />

      {/* Topbar */}
      <div className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-slate-950/70 border-b border-[rgba(11,36,80,0.06)] dark:border-white/5">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between px-6 py-4">
          <div
            className="flex items-center gap-3 font-bold text-[#0b2450] dark:text-white cursor-pointer group"
            onClick={() => navigate('/career-vision/dashboard')}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#39d0d8] to-[#143a72] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <Brain className="w-5 h-5" />
            </div>
            <span className="tracking-tight text-lg">NovaWork Global</span>
          </div>
          <button
            onClick={() => navigate('/career-vision/dashboard')}
            className="flex items-center gap-2 text-sm font-semibold text-[#5a6b86] dark:text-slate-400 hover:text-[#0b2450] dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Career Vision
          </button>
        </div>
      </div>

      <div className="hero-gradient-cv">
        {/* Hero */}
        <header className="max-w-[1100px] mx-auto pt-24 pb-20 px-6">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-5 py-2 border border-[#39d0d8]/30 rounded-full bg-[rgba(57,208,216,0.1)] text-[#1c61cf] dark:text-teal-400 text-xs font-black uppercase tracking-widest mb-8 backdrop-blur-sm shadow-[0_0_15px_rgba(57,208,216,0.1)]">
              NovaWork Global Career Orientation Program
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-[#0b2450] dark:text-white leading-[1.05] tracking-tight mb-8">
              Skills &amp; Interests Assessment
            </h1>
            <p className="text-xl md:text-2xl leading-relaxed text-[#5a6b86] dark:text-slate-300 mb-10 max-w-3xl mx-auto">
              The foundational first step of your Career Orientation Program. Map who you are professionally — and where you want to go.
            </p>
            <p className="text-[#39d0d8] font-bold text-lg mb-10">Ignite your next career chapter.</p>
            <div className="flex justify-center gap-4">
              <a href="#pillars" className="px-8 py-4 rounded-2xl bg-[#0b2450] text-white font-bold shadow-lg hover:bg-[#143a72] transition-all">
                Explore the Framework
              </a>
            </div>
          </div>
        </header>

        {/* Infographic */}
        <section className="max-w-[1100px] mx-auto pt-4 pb-8 px-6 text-center">
          <div className="relative group">
            <div className="absolute -inset-4 bg-teal-500/10 rounded-[60px] blur-2xl group-hover:bg-teal-500/20 transition-all duration-700" />
            <img
              src="/images/Career Orientation.jpg"
              alt="Ignite Your Next Career Chapter: The Skills & Interests Assessment"
              className="relative w-full h-auto rounded-[40px] shadow-2xl border border-[rgba(11,36,80,0.06)] dark:border-white/5 transform transition-transform duration-700 hover:scale-[1.01]"
            />
          </div>
        </section>

        {/* Two Pillars */}
        <section id="pillars" className="max-w-[1100px] mx-auto py-20 px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-[#0b2450] dark:text-white mb-3">Organize Your Career into Two Pillars</h2>
            <p className="text-[#5a6b86] dark:text-slate-400 text-lg max-w-2xl mx-auto">Sorting your past experience and future aspirations into these two pillars creates immediate clarity.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Skills */}
            <div className="cv-card rounded-2xl overflow-hidden border-2 border-[#0b2450] dark:border-blue-700 shadow-lg">
              <div className="bg-[#0b2450] text-white px-6 py-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                  <Brain className="w-5 h-5" />
                </div>
                <span className="text-lg font-bold">Skills and Knowledge</span>
              </div>
              <div className="bg-white dark:bg-slate-900/50 p-8">
                <p className="text-[#5a6b86] dark:text-slate-400 mb-6 text-lg">Focus: What you know and have done repeatedly.</p>
                <div className="space-y-3">
                  {[
                    { label: 'List 3 Core Competencies', desc: 'Enter things you have done repeatedly or learned through extensive professional experience.' },
                    { label: 'Leverage AI for Expansion', desc: 'Click "Generate AI" to discover related keywords and specialized skills you may possess.' },
                    { label: 'Finance Industry Examples', desc: 'Include specific terms like financial planning, Excel, reporting, and reconciliation.' },
                  ].map((item) => (
                    <div key={item.label} className="p-4 bg-[#f0f6ff] dark:bg-slate-950/50 rounded-xl border border-[#d7e7f0] dark:border-white/5">
                      <div className="font-bold text-[#0b2450] dark:text-blue-200 mb-1 text-sm">{item.label}</div>
                      <div className="text-xs text-[#5a6b86] dark:text-slate-400">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Interests */}
            <div className="cv-card rounded-2xl overflow-hidden border-2 border-[#06b6d4] dark:border-cyan-600 shadow-lg">
              <div className="bg-[#06b6d4] text-white px-6 py-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                  <Star className="w-5 h-5" />
                </div>
                <span className="text-lg font-bold">Your Interests</span>
              </div>
              <div className="bg-white dark:bg-slate-900/50 p-8">
                <p className="text-[#5a6b86] dark:text-slate-400 mb-6 text-lg">Focus: What you want to explore, learn, or continue doing.</p>
                <div className="space-y-3">
                  {[
                    { label: 'Identify Enjoyable Skills', desc: 'Repeat the skills and knowledge from the first column that you actually enjoy doing.' },
                    { label: 'Add Aspirational Interests', desc: 'Include skills you are interested in but have never practiced or learned before.' },
                    { label: 'The Interest Alignment', desc: 'This column captures both current passions and future areas of growth.' },
                  ].map((item) => (
                    <div key={item.label} className="p-4 bg-[#f0fbff] dark:bg-slate-950/50 rounded-xl border border-[#b2e8f5] dark:border-white/5">
                      <div className="font-bold text-[#0b2450] dark:text-cyan-200 mb-1 text-sm">{item.label}</div>
                      <div className="text-xs text-[#5a6b86] dark:text-slate-400">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Step by Step */}
        <section className="max-w-[1100px] mx-auto py-16 px-6 border-t border-[rgba(11,36,80,0.05)]">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-[#0b2450] dark:text-white tracking-tight mb-4">How It Works</h2>
            <p className="text-lg text-[#5a6b86] dark:text-slate-400">Three simple steps to map your professional DNA.</p>
          </div>

          <div className="space-y-8">
            {/* Step 1 */}
            <div className="cv-card grid grid-cols-1 md:grid-cols-[180px_1fr] gap-8 bg-white dark:bg-slate-900/50 rounded-[32px] p-8 border border-[rgba(11,36,80,0.06)] dark:border-white/5 shadow-sm">
              <div className="bg-gradient-to-br from-[#39d0d8] to-[#1c61cf] rounded-2xl flex flex-col items-center justify-center text-white aspect-square md:aspect-auto">
                <Brain className="w-10 h-10 mb-2" />
                <span className="text-xs uppercase font-bold tracking-widest opacity-80">Step</span>
                <span className="text-4xl font-black">01</span>
              </div>
              <div>
                <h3 className="text-2xl font-black text-[#0b2450] dark:text-white mb-3">Build Your Foundation First</h3>
                <p className="text-[#5a6b86] dark:text-slate-400 mb-6">Enter at least three things you know how to do. These should be proven skills you have executed repeatedly or specific knowledge you have learned.</p>
                <div className="flex flex-wrap gap-2">
                  {['Financial Planning', 'Excel', 'Financial Reporting', 'Project Management', 'Data Analysis', 'Communication Strategy'].map((skill) => (
                    <span key={skill} className="px-3 py-1.5 bg-[#f0f6ff] dark:bg-slate-950 border border-[#d7e7f0] dark:border-white/10 rounded-lg text-sm font-semibold text-[#0b2450] dark:text-slate-300">{skill}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="cv-card grid grid-cols-1 md:grid-cols-[180px_1fr] gap-8 bg-white dark:bg-slate-900/50 rounded-[32px] p-8 border border-[rgba(11,36,80,0.06)] dark:border-white/5 shadow-sm">
              <div className="bg-[#0b2450] rounded-2xl flex flex-col items-center justify-center text-white aspect-square md:aspect-auto">
                <Sparkles className="w-10 h-10 mb-2" />
                <span className="text-xs uppercase font-bold tracking-widest opacity-80">Step</span>
                <span className="text-4xl font-black">02</span>
              </div>
              <div>
                <h3 className="text-2xl font-black text-[#0b2450] dark:text-white mb-3">Unlock Hidden Capabilities with AI</h3>
                <p className="text-[#5a6b86] dark:text-slate-400 mb-6">Click the 'Generate AI' button to instantly brainstorm more ideas. The tool will auto-generate additional keywords, revealing related skills and knowledge areas you already possess but might not have thought to list.</p>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="space-y-2">
                    {['Financial Planning', 'Excel', 'Financial Reporting'].map((s) => (
                      <div key={s} className="bg-[#f0f6ff] dark:bg-slate-950 border border-[#d7e7f0] dark:border-white/10 rounded-lg px-4 py-2 text-sm font-medium text-[#0b2450] dark:text-slate-300">{s}</div>
                    ))}
                  </div>
                  <div className="bg-[#06b6d4] text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-md">
                    <Sparkles className="w-4 h-4" /> Generate AI
                  </div>
                  <div className="space-y-2">
                    {['Reconciliation', 'Balance Sheets', 'Credit Scoring'].map((s) => (
                      <div key={s} className="bg-white dark:bg-slate-900 border-2 border-[#06b6d4] rounded-lg px-4 py-2 text-sm font-medium text-[#0b2450] dark:text-cyan-300">{s}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="cv-card grid grid-cols-1 md:grid-cols-[180px_1fr] gap-8 bg-white dark:bg-slate-900/50 rounded-[32px] p-8 border border-[rgba(11,36,80,0.06)] dark:border-white/5 shadow-sm">
              <div className="bg-[#06b6d4] rounded-2xl flex flex-col items-center justify-center text-white aspect-square md:aspect-auto">
                <Star className="w-10 h-10 mb-2" />
                <span className="text-xs uppercase font-bold tracking-widest opacity-80">Step</span>
                <span className="text-4xl font-black">03</span>
              </div>
              <div>
                <h3 className="text-2xl font-black text-[#0b2450] dark:text-white mb-3">Map Your Future Interests</h3>
                <p className="text-[#5a6b86] dark:text-slate-400 mb-6">Bring over the skills and knowledge from the first column that you genuinely enjoy doing. Then add entirely new skills you have always been interested in — even if you have never practiced them.</p>
                <div className="flex gap-4">
                  {[
                    { label: 'Skills and Knowledge', color: '#0b2450', items: ['Financial Planning', 'Excel', 'Financial Reporting'] },
                    { label: 'Interests', color: '#0b2450', items: ['Financial Planning', '+ New Aspiration'] }
                  ].map((col) => (
                    <div key={col.label} className="flex-1 rounded-xl overflow-hidden border border-[rgba(11,36,80,0.06)] dark:border-white/5 shadow">
                      <div className="px-4 py-3 text-white text-sm font-bold" style={{ backgroundColor: col.color }}>
                        {col.label}
                      </div>
                      {col.items.map((item) => (
                        <div key={item} className={`px-4 py-2.5 text-sm font-semibold border-b border-[rgba(11,36,80,0.05)] dark:border-white/5 ${item.startsWith('+') ? 'bg-[#06b6d4] text-white' : 'bg-white dark:bg-slate-900 text-[#0b2450] dark:text-slate-300'}`}>
                          {item}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ready to Launch */}
        <section className="max-w-[1100px] mx-auto py-16 px-6 border-t border-[rgba(11,36,80,0.05)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="bg-white dark:bg-slate-900/50 rounded-[32px] p-10 border border-[rgba(11,36,80,0.06)] dark:border-white/5 shadow-xl">
              <h2 className="text-3xl font-black text-[#0b2450] dark:text-white mb-2">Ready to Launch</h2>
              <p className="text-[#5a6b86] dark:text-slate-400 mb-8">Your assessment is complete when you have done all three.</p>
              <div className="space-y-5">
                {[
                  'Entered at least 3 proven skills or knowledge areas.',
                  "Used the 'Generate AI' button to expand your foundation.",
                  'Mapped your future by adding both enjoyed skills and new aspirations to your Interests.',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-4">
                    <div className="w-7 h-7 rounded-full bg-[#06b6d4] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md shadow-cyan-200 dark:shadow-cyan-900">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-[#0b2450] dark:text-slate-300 font-medium">{item}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-[rgba(11,36,80,0.08)] dark:border-white/10 pt-6 mt-6">
                <p className="font-black text-[#0b2450] dark:text-white text-center">
                  Your assessment is complete. You are ready to ignite the next phase of the program.
                </p>
              </div>
            </div>

            <div className="text-center lg:text-left">
              <h3 className="text-3xl font-black text-[#0b2450] dark:text-white mb-4">What Happens Next?</h3>
              <p className="text-[#5a6b86] dark:text-slate-400 mb-6 leading-relaxed">
                Once you've completed the Skills & Interests Assessment, you'll unlock the full Career Vision — including your Job History Analysis and Ideal Work Preferences — to generate your personalized career profile.
              </p>
              <div className="space-y-3">
                {[
                  { icon: '🎯', label: 'Skills & Interests', desc: 'Map your professional DNA' },
                  { icon: '📋', label: 'Job History Analysis', desc: 'Identify patterns from your past' },
                  { icon: '⚙️', label: 'Ideal Work Preferences', desc: 'Define your must-haves' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-4 p-4 bg-[#f0f6ff] dark:bg-slate-900/50 rounded-xl border border-[#d7e7f0] dark:border-white/5">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <div className="font-bold text-[#0b2450] dark:text-white text-sm">{item.label}</div>
                      <div className="text-xs text-[#5a6b86] dark:text-slate-400">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-[800px] mx-auto py-24 px-6 text-center">
          <div className="bg-gradient-to-br from-[#0b2450] to-[#143a72] rounded-[40px] p-12 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
            <h2 className="text-4xl font-black mb-6 relative z-10">Ignite your next career chapter.</h2>
            <p className="text-lg text-white/80 mb-10 relative z-10">
              Start the NovaWork Global Skills &amp; Interests Assessment today.
            </p>
            <button
              onClick={() => navigate('/career-vision/skills-values')}
              className="bg-[#39d0d8] text-[#0b2450] px-10 py-4 rounded-2xl font-black text-lg shadow-xl hover:scale-105 transition-transform relative z-10"
            >
              Begin Assessment
            </button>
          </div>
        </section>
      </div>

      <footer className="py-12 border-t border-[rgba(11,36,80,0.05)] dark:border-white/5 text-center text-[#5a6b86] dark:text-slate-500 text-sm font-medium">
        &copy; {new Date().getFullYear()} NovaWork Global • Professional Career Acceleration
      </footer>
    </div>
  )
}
