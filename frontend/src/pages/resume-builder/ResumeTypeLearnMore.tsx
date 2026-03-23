import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Layers, TrendingUp, GitBranch, CheckCircle2, XCircle } from 'lucide-react'

export default function ResumeTypeLearnMore() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white dark:bg-[#030711] font-sans text-[#10223e] dark:text-slate-200 transition-colors duration-300">
      <style dangerouslySetInnerHTML={{
        __html: `
          .hero-gradient-rt {
            background: radial-gradient(circle at top right, rgba(57,208,216,0.18), transparent 28%),
                        linear-gradient(180deg, #f0f6ff 0%, #e8f4fb 100%);
          }
          .dark .hero-gradient-rt {
            background: radial-gradient(circle at top right, rgba(57,208,216,0.12), transparent 30%),
                        radial-gradient(circle at bottom left, rgba(20,58,114,0.15), transparent 40%),
                        linear-gradient(180deg, #030711 0%, #0a1329 100%);
          }
          .rt-card {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .rt-card:hover {
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
            onClick={() => navigate('/resume/type-selection')}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#39d0d8] to-[#143a72] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <span className="tracking-tight text-lg">NovaWork Global</span>
          </div>
          <button
            onClick={() => navigate('/resume/type-selection')}
            className="flex items-center gap-2 text-sm font-semibold text-[#5a6b86] dark:text-slate-400 hover:text-[#0b2450] dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Resume Type Selection
          </button>
        </div>
      </div>

      <div className="hero-gradient-rt">
        {/* Hero */}
        <header className="max-w-[1100px] mx-auto pt-24 pb-20 px-6">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-5 py-2 border border-[#39d0d8]/30 rounded-full bg-[rgba(57,208,216,0.1)] text-[#1c61cf] dark:text-teal-400 text-xs font-black uppercase tracking-widest mb-8 backdrop-blur-sm shadow-[0_0_15px_rgba(57,208,216,0.1)]">
              The Résumé Blueprint
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-[#0b2450] dark:text-white leading-[1.05] tracking-tight mb-8">
              Chronological vs. Functional
            </h1>
            <p className="text-xl md:text-2xl leading-relaxed text-[#5a6b86] dark:text-slate-300 mb-10 max-w-3xl mx-auto">
              Choosing the right resume format is a strategic decision. Learn which structure best tells your professional story and maximizes your chances of getting the interview.
            </p>
            <div className="flex justify-center gap-4">
              <a href="#comparison" className="px-8 py-4 rounded-2xl bg-[#0b2450] text-white font-bold shadow-lg hover:bg-[#143a72] transition-all">
                Compare Formats
              </a>
            </div>
          </div>
        </header>

        {/* Infographic */}
        <section className="max-w-[1100px] mx-auto pt-4 pb-8 px-6 text-center">
          <div className="relative group">
            <div className="absolute -inset-4 bg-teal-500/10 rounded-[60px] blur-2xl group-hover:bg-teal-500/20 transition-all duration-700" />
            <img
              src="/images/chronologicavsFunctions.jpg"
              alt="Chronological vs Functional Resume"
              className="relative w-full h-auto rounded-[40px] shadow-2xl border border-[rgba(11,36,80,0.06)] dark:border-white/5 transform transition-transform duration-700 hover:scale-[1.01]"
            />
          </div>
        </section>

        {/* Side-by-side comparison */}
        <section id="comparison" className="max-w-[1100px] mx-auto py-20 px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-[#0b2450] dark:text-white mb-3">Two Formats, One Goal</h2>
            <p className="text-[#5a6b86] dark:text-slate-400 text-lg max-w-2xl mx-auto">Both formats use the same content — they differ in how that content is organized and presented.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chronological */}
            <div className="rt-card rounded-2xl overflow-hidden border-2 border-[#1c61cf] dark:border-blue-700 shadow-lg">
              <div className="bg-[#1c61cf] text-white px-6 py-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest opacity-70 mb-0.5">Format A</div>
                  <div className="text-xl font-black">Chronological</div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900/50 p-6 space-y-4">
                <p className="text-[#5a6b86] dark:text-slate-400">Lists work experience in reverse chronological order — most recent position first.</p>

                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-[#1c61cf] mb-3">Best For</div>
                  <div className="space-y-2">
                    {[
                      'Professionals continuing in the same career path',
                      'Strong, uninterrupted work history',
                      'Roles in traditional or corporate industries',
                      'Candidates with steady career progression',
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#1c61cf] mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-[#0b2450] dark:text-slate-300">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-red-500 mb-3">Not Ideal For</div>
                  <div className="space-y-2">
                    {[
                      'Career changers switching industries',
                      'Candidates with employment gaps',
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-2">
                        <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-[#5a6b86] dark:text-slate-400">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-[#f0f6ff] dark:bg-slate-950/50 rounded-xl border border-[#d7e7f0] dark:border-white/5">
                  <div className="text-xs font-bold text-[#1c61cf] uppercase tracking-wider mb-1">Structure</div>
                  <p className="text-sm text-[#0b2450] dark:text-slate-300">Contact → Summary → Work Experience (reverse order) → Education → Skills</p>
                </div>
              </div>
            </div>

            {/* Functional */}
            <div className="rt-card rounded-2xl overflow-hidden border-2 border-[#06b6d4] dark:border-cyan-600 shadow-lg">
              <div className="bg-[#06b6d4] text-white px-6 py-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest opacity-70 mb-0.5">Format B</div>
                  <div className="text-xl font-black">Functional</div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900/50 p-6 space-y-4">
                <p className="text-[#5a6b86] dark:text-slate-400">Groups accomplishments by skill category — shifting focus from when to what you achieved.</p>

                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-[#06b6d4] mb-3">Best For</div>
                  <div className="space-y-2">
                    {[
                      'Career changers moving to a new industry',
                      'Candidates with employment gaps',
                      'International moves or versatile roles',
                      'Project-based or freelance professionals',
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#06b6d4] mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-[#0b2450] dark:text-slate-300">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-red-500 mb-3">Not Ideal For</div>
                  <div className="space-y-2">
                    {[
                      'Traditional industries expecting standard formats',
                      'Roles requiring clear career progression',
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-2">
                        <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-[#5a6b86] dark:text-slate-400">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-[#f0fbff] dark:bg-slate-950/50 rounded-xl border border-[#b2e8f5] dark:border-white/5">
                  <div className="text-xs font-bold text-[#06b6d4] uppercase tracking-wider mb-1">Structure</div>
                  <p className="text-sm text-[#0b2450] dark:text-slate-300">Contact → Summary → Skill Groups + Accomplishments → Work History (brief) → Education</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Key Insight */}
        <section className="max-w-[1100px] mx-auto py-16 px-6 border-t border-[rgba(11,36,80,0.05)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="bg-white dark:bg-slate-900/50 rounded-[32px] p-10 border border-[rgba(11,36,80,0.06)] dark:border-white/5 shadow-xl">
              <h2 className="text-3xl font-black text-[#0b2450] dark:text-white mb-4">The Architecture of Access</h2>
              <p className="text-[#5a6b86] dark:text-slate-400 leading-relaxed mb-6">
                Your resume format is the architecture that either opens or closes doors. A mismatched format — no matter how strong your accomplishments — can prevent your story from being heard.
              </p>
              <div className="space-y-3">
                {[
                  'The format signals your career narrative before recruiters read a word.',
                  'ATS systems parse formats differently — choose strategically.',
                  'Career changers who use chronological resumes are often auto-rejected.',
                  'Both formats use the same CAR accomplishments — just organized differently.',
                ].map((item) => (
                  <div key={item} className="flex gap-3 items-center p-4 bg-[#f8fcfe] dark:bg-slate-950/50 rounded-2xl border border-[#d7e7f0] dark:border-white/5">
                    <div className="w-2 h-2 rounded-full bg-[#39d0d8] flex-shrink-0" />
                    <span className="font-semibold text-[#0b2450] dark:text-slate-200 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-black text-[#0b2450] dark:text-white">Quick Decision Guide</h3>
              {[
                { q: 'Staying in the same field?', a: 'Chronological', color: '#1c61cf', icon: <TrendingUp className="w-5 h-5" /> },
                { q: 'Changing industries or roles?', a: 'Functional', color: '#06b6d4', icon: <GitBranch className="w-5 h-5" /> },
                { q: 'Have employment gaps?', a: 'Functional', color: '#06b6d4', icon: <GitBranch className="w-5 h-5" /> },
                { q: 'Strong uninterrupted career?', a: 'Chronological', color: '#1c61cf', icon: <TrendingUp className="w-5 h-5" /> },
                { q: 'Not sure?', a: 'Build both!', color: '#0b2450', icon: <Layers className="w-5 h-5" /> },
              ].map((item) => (
                <div key={item.q} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900/50 rounded-2xl border border-[rgba(11,36,80,0.06)] dark:border-white/5 shadow-sm">
                  <span className="text-[#5a6b86] dark:text-slate-400 text-sm font-medium">{item.q}</span>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white text-sm font-bold" style={{ backgroundColor: item.color }}>
                    {item.icon}
                    {item.a}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-[800px] mx-auto py-24 px-6 text-center">
          <div className="bg-gradient-to-br from-[#0b2450] to-[#143a72] rounded-[40px] p-12 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
            <h2 className="text-4xl font-black mb-6 relative z-10">Ready to choose your format?</h2>
            <p className="text-lg text-white/80 mb-10 relative z-10">
              Select the structure that best tells your story and generates your professional resume.
            </p>
            <button
              onClick={() => navigate('/resume/type-selection')}
              className="bg-[#39d0d8] text-[#0b2450] px-10 py-4 rounded-2xl font-black text-lg shadow-xl hover:scale-105 transition-transform relative z-10"
            >
              Choose Your Format
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
