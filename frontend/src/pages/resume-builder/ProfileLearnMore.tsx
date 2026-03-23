import { useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Target, Layers, Key, ArrowRight, CheckCircle2 } from 'lucide-react'

export default function ProfileLearnMore() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white dark:bg-[#030711] font-sans text-[#10223e] dark:text-slate-200 transition-colors duration-300">
      <style dangerouslySetInnerHTML={{
        __html: `
          .hero-gradient-pb {
            background: radial-gradient(circle at top right, rgba(28,97,207,0.15), transparent 28%),
                        linear-gradient(180deg, #f0f6ff 0%, #e8f4fb 100%);
          }
          .dark .hero-gradient-pb {
            background: radial-gradient(circle at top right, rgba(28,97,207,0.12), transparent 30%),
                        radial-gradient(circle at bottom left, rgba(20,58,114,0.15), transparent 40%),
                        linear-gradient(180deg, #030711 0%, #0a1329 100%);
          }
          .pb-card {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .pb-card:hover {
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
            onClick={() => navigate('/resume/profile')}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1c61cf] to-[#143a72] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <User className="w-5 h-5" />
            </div>
            <span className="tracking-tight text-lg">NovaWork Global</span>
          </div>
          <button
            onClick={() => navigate('/resume/profile')}
            className="flex items-center gap-2 text-sm font-semibold text-[#5a6b86] dark:text-slate-400 hover:text-[#0b2450] dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Profile Builder
          </button>
        </div>
      </div>

      <div className="hero-gradient-pb">
        {/* Hero */}
        <header className="max-w-[1100px] mx-auto pt-24 pb-20 px-6">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-5 py-2 border border-[#1c61cf]/30 rounded-full bg-[rgba(28,97,207,0.1)] text-[#1c61cf] dark:text-blue-400 text-xs font-black uppercase tracking-widest mb-8 backdrop-blur-sm shadow-[0_0_15px_rgba(28,97,207,0.1)]">
              The Professional Profile Blueprint
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-[#0b2450] dark:text-white leading-[1.05] tracking-tight mb-8">
              Crafting Your<br />Professional Profile
            </h1>
            <p className="text-xl md:text-2xl leading-relaxed text-[#5a6b86] dark:text-slate-300 mb-10 max-w-3xl mx-auto">
              A four-step structural blueprint to engineer the perfect resume introduction. Stop writing generic paragraphs — assemble interlocking parts.
            </p>
            <div className="flex justify-center gap-4">
              <a href="#blueprint" className="px-8 py-4 rounded-2xl bg-[#0b2450] text-white font-bold shadow-lg hover:bg-[#143a72] transition-all">
                See the Blueprint
              </a>
            </div>
          </div>
        </header>

        {/* Infographic */}
        <section className="max-w-[1100px] mx-auto pt-4 pb-8 px-6 text-center">
          <div className="relative group">
            <div className="absolute -inset-4 bg-blue-500/10 rounded-[60px] blur-2xl group-hover:bg-blue-500/20 transition-all duration-700" />
            <img
              src="/images/Professional Profile FrameWork.jpg"
              alt="Professional Profile Framework"
              className="relative w-full h-auto rounded-[40px] shadow-2xl border border-[rgba(11,36,80,0.06)] dark:border-white/5 transform transition-transform duration-700 hover:scale-[1.01]"
            />
          </div>
        </section>

        {/* The Professional Snapshot */}
        <section className="max-w-[1100px] mx-auto py-16 px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-[#0b2450] dark:text-white mb-3">The Professional Snapshot</h2>
            <p className="text-[#5a6b86] dark:text-slate-400 text-lg max-w-2xl mx-auto">
              The Professional Profile is the most important real estate on your resume. A short, targeted introduction designed to quickly and undeniably prove three things to a hiring manager.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { num: '1', label: 'Who you are.' },
              { num: '2', label: 'What you do well.' },
              { num: '3', label: 'The exact value you bring.' },
            ].map((item) => (
              <div key={item.num} className="pb-card rounded-2xl p-8 bg-white dark:bg-slate-900/50 border border-[rgba(11,36,80,0.06)] dark:border-white/5 shadow-lg text-center">
                <div className="text-5xl font-black text-[#0b2450] dark:text-white mb-3">{item.num}</div>
                <div className="w-10 h-0.5 bg-[#39d0d8] mx-auto mb-4" />
                <p className="text-[#5a6b86] dark:text-slate-400 font-semibold">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Architecture — 4 Blocks */}
        <section id="blueprint" className="max-w-[1100px] mx-auto py-16 px-6 border-t border-[rgba(11,36,80,0.05)]">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-[#0b2450] dark:text-white mb-3">The Architecture of a Winning Profile</h2>
            <p className="text-[#5a6b86] dark:text-slate-400 text-lg">Four interlocking blocks that work together as a system.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Block 1 */}
            <div className="pb-card rounded-2xl overflow-hidden border-2 border-[#0b2450] dark:border-blue-900 shadow-lg bg-white dark:bg-slate-900/50">
              <div className="bg-[#0b2450] text-white px-6 py-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest opacity-70 mb-0.5">Block 1</div>
                  <div className="text-xl font-black">Professional Identity</div>
                  <div className="text-xs opacity-60">The anchor point.</div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-[#5a6b86] dark:text-slate-400 text-sm">The first sentence serves a single purpose: explaining exactly who you are professionally. Do not overcomplicate it.</p>
                <div className="text-xs font-black uppercase tracking-widest text-[#0b2450] dark:text-blue-400 mb-2">Anatomy of Sentence 1</div>
                {['Professional Title', 'Years / Level of Experience', 'Target Industries'].map((item) => (
                  <div key={item} className="flex items-center gap-3 p-3 bg-[#f0f6ff] dark:bg-slate-950/50 rounded-xl border border-[#d7e7f0] dark:border-white/5">
                    <CheckCircle2 className="w-4 h-4 text-[#1c61cf] flex-shrink-0" />
                    <span className="text-sm font-semibold text-[#0b2450] dark:text-slate-200">{item}</span>
                  </div>
                ))}
                <div className="p-4 bg-[#f0f6ff] dark:bg-slate-950/50 rounded-xl border border-[#d7e7f0] dark:border-white/5">
                  <div className="text-xs font-bold text-[#1c61cf] uppercase tracking-wider mb-1">Example</div>
                  <p className="text-sm text-[#0b2450] dark:text-slate-300 italic">"Service Business Leader and Management Consultant with local and international experience in consulting firms."</p>
                </div>
              </div>
            </div>

            {/* Block 2 */}
            <div className="pb-card rounded-2xl overflow-hidden border-2 border-[#1c61cf] dark:border-blue-700 shadow-lg bg-white dark:bg-slate-900/50">
              <div className="bg-[#1c61cf] text-white px-6 py-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest opacity-70 mb-0.5">Block 2</div>
                  <div className="text-xl font-black">Positioning Statement</div>
                  <div className="text-xs opacity-60">The strategic direction.</div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-[#5a6b86] dark:text-slate-400 text-sm">Your positioning statement highlights a group of core skills that, when combined, make you uniquely equipped for the specific job you want.</p>
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800/40">
                  <p className="text-sm font-bold text-amber-800 dark:text-amber-400">Don't just list skills — state what those skills allow you to accomplish.</p>
                </div>
                <div className="p-4 bg-[#f0f6ff] dark:bg-slate-950/50 rounded-xl border border-[#d7e7f0] dark:border-white/5">
                  <div className="text-xs font-bold text-[#1c61cf] uppercase tracking-wider mb-1">Example</div>
                  <p className="text-sm text-[#0b2450] dark:text-slate-300 italic">"Expert at successfully starting up, developing, and growing outsourcing service firms locally and internationally."</p>
                </div>
              </div>
            </div>

            {/* Block 3 */}
            <div className="pb-card rounded-2xl overflow-hidden border-2 border-[#39d0d8] dark:border-teal-600 shadow-lg bg-white dark:bg-slate-900/50">
              <div className="bg-[#39d0d8] text-[#0b2450] px-6 py-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-black/10 flex items-center justify-center">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest opacity-70 mb-0.5">Block 3</div>
                  <div className="text-xl font-black">Soft Skills</div>
                  <div className="text-xs opacity-60">The operational style.</div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-[#5a6b86] dark:text-slate-400 text-sm">Dedicate 3–4 short sentences to describing how you operate. These must directly align with the target job's requirements.</p>
                <div className="text-xs font-black uppercase tracking-widest text-[#39d0d8] mb-2">Skill Transformation Matrix</div>
                {[
                  { from: 'Just "Leadership"', to: 'Leading multicultural, cross-functional and remote teams' },
                  { from: 'Just "Communication"', to: 'Negotiating with all organizational levels and diverse stakeholders' },
                  { from: 'Just "Problem Solving"', to: 'Effectively managing crises and creatively solving problems' },
                ].map((item) => (
                  <div key={item.from} className="flex items-start gap-3 p-3 bg-[#f0fbff] dark:bg-slate-950/50 rounded-xl border border-[#b2e8f5] dark:border-white/5">
                    <ArrowRight className="w-4 h-4 text-[#39d0d8] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs text-[#5a6b86] dark:text-slate-400 line-through">{item.from}</span>
                      <p className="text-sm font-semibold text-[#0b2450] dark:text-slate-200">{item.to}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Block 4 */}
            <div className="pb-card rounded-2xl overflow-hidden border-2 border-slate-400 dark:border-slate-600 shadow-lg bg-white dark:bg-slate-900/50">
              <div className="bg-slate-600 text-white px-6 py-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest opacity-70 mb-0.5">Block 4</div>
                  <div className="text-xl font-black">Areas of Excellence</div>
                  <div className="text-xs opacity-60">The technical key.</div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-[#5a6b86] dark:text-slate-400 text-sm">A dedicated keyword section that helps both human recruiters scanning for specific terms and ATS systems categorizing your application.</p>
                <div className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-2">Execution Rules</div>
                {[
                  'Format as a distinct, separated list.',
                  'Use vertical pipes ( | ) for clean, scannable separation.',
                  'Include only the highest-priority industry terminology.',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-white/5">
                    <CheckCircle2 className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-[#0b2450] dark:text-slate-200">{item}</span>
                  </div>
                ))}
                <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-white/5">
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Example</div>
                  <p className="text-sm text-[#0b2450] dark:text-slate-300 italic">"Areas of Excellence: International Management Consulting | Global Scope | Budgeting | P&L | Project Management"</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Blueprint Framework Matrix */}
        <section className="max-w-[1100px] mx-auto py-16 px-6 border-t border-[rgba(11,36,80,0.05)]">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-[#0b2450] dark:text-white mb-3">The Blueprint Framework Matrix</h2>
            <p className="text-[#5a6b86] dark:text-slate-400 text-lg">Each block targets a specific decision-maker in the hiring process.</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[rgba(11,36,80,0.06)] dark:border-white/5 shadow-lg">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="p-4 bg-[#0b2450] text-white text-left font-black uppercase tracking-wider">Component</th>
                  <th className="p-4 bg-[#0b2450] text-white text-left font-black uppercase tracking-wider">Objective</th>
                  <th className="p-4 bg-[#0b2450] text-white text-left font-black uppercase tracking-wider">Length</th>
                  <th className="p-4 bg-[#0b2450] text-white text-left font-black uppercase tracking-wider">Primary Target</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { component: 'Identity', bg: 'bg-[#0b2450]', text: 'text-white', obj: 'Establish baseline credibility', len: '1 Sentence', target: 'Human Recruiter' },
                  { component: 'Positioning', bg: 'bg-[#1c61cf]', text: 'text-white', obj: 'Prove fitness for the specific role', len: '1 Sentence', target: 'Hiring Manager' },
                  { component: 'Soft Skills', bg: 'bg-[#39d0d8]', text: 'text-[#0b2450]', obj: 'Demonstrate operational capability', len: '3–4 Sentences', target: 'Hiring Manager / Team Lead' },
                  { component: 'Areas of Excellence', bg: 'bg-slate-500', text: 'text-white', obj: 'Ensure searchability and categorization', len: 'Keyword List', target: 'Applicant Tracking System (ATS)' },
                ].map((row, i) => (
                  <tr key={row.component} className={`border-t border-[rgba(11,36,80,0.06)] dark:border-white/5 ${i % 2 === 0 ? 'bg-white dark:bg-slate-900/50' : 'bg-[#f8fcfe] dark:bg-slate-900/30'}`}>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full ${row.bg} ${row.text} text-xs font-black`}>{row.component}</span>
                    </td>
                    <td className="p-4 text-[#5a6b86] dark:text-slate-400">{row.obj}</td>
                    <td className="p-4 font-semibold text-[#0b2450] dark:text-white">{row.len}</td>
                    <td className="p-4 text-[#5a6b86] dark:text-slate-400">{row.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Real Example */}
        <section className="max-w-[1100px] mx-auto py-16 px-6 border-t border-[rgba(11,36,80,0.05)]">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-[#0b2450] dark:text-white mb-3">Anatomical Teardown</h2>
            <p className="text-[#5a6b86] dark:text-slate-400 text-lg">See how the four blocks come together in a real profile.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[
              {
                role: 'Service Business Leader',
                lines: [
                  { label: 'Identity established instantly', text: 'Service Business Leader and Management Consultant with local and international experience in consulting firms.', color: '#0b2450' },
                  { label: 'Value and positioning defined', text: 'Expert at successfully starting up, developing, and growing outsourcing service firms locally and internationally.', color: '#1c61cf' },
                  { label: 'Soft skills applied to real-world scenarios', text: 'Skilled at leading multicultural… closing favorable deals, coaching and mentoring others…', color: '#39d0d8' },
                  { label: 'Highly searchable, pipe-separated ATS keywords', text: 'Areas of Excellence: Budgeting | P&L | Savings Maximization…', color: '#64748b' },
                ],
              },
              {
                role: 'Project Manager & Engineer',
                lines: [
                  { label: 'Identity established instantly', text: 'Project Manager/Engineer with regional experience in the medical equipment, industrial equipment, oil & gas, and power & light industries.', color: '#0b2450' },
                  { label: 'Value and positioning defined', text: 'Expert at improving processes, performing needs assessments, and proposing solutions for clients…', color: '#1c61cf' },
                  { label: 'Soft skills applied to real-world scenarios', text: 'Skilled at leading multicultural teams… creatively solving problems… with a strong client/customer orientation. Bilingual (EN/ES).', color: '#39d0d8' },
                  { label: 'Highly searchable, pipe-separated ATS keywords', text: 'Areas of Excellence: Project Management | Needs Assessment | Supply Chain | KPIs…', color: '#64748b' },
                ],
              },
            ].map((ex) => (
              <div key={ex.role} className="bg-white dark:bg-slate-900/50 rounded-[32px] p-8 border border-[rgba(11,36,80,0.06)] dark:border-white/5 shadow-xl">
                <div className="text-xs font-black uppercase tracking-widest text-[#1c61cf] dark:text-blue-400 mb-4">{ex.role}</div>
                <div className="space-y-3">
                  {ex.lines.map((line, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-1.5 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: line.color, minHeight: '20px' }} />
                      <div>
                        <div className="text-xs text-[#5a6b86] dark:text-slate-500 mb-1">{line.label}</div>
                        <p className="text-sm font-semibold text-[#0b2450] dark:text-slate-200 leading-relaxed">{line.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-[800px] mx-auto py-24 px-6 text-center">
          <div className="bg-gradient-to-br from-[#0b2450] to-[#143a72] rounded-[40px] p-12 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
            <h2 className="text-4xl font-black mb-6 relative z-10">Stop Writing. Start Engineering.</h2>
            <p className="text-lg text-white/80 mb-10 relative z-10">
              You now have the blueprint. Deconstruct your current profile and rebuild it step-by-step to command the attention your experience deserves.
            </p>
            <button
              onClick={() => navigate('/resume/profile')}
              className="inline-flex items-center gap-2 bg-[#39d0d8] text-[#0b2450] px-10 py-4 rounded-2xl font-black text-lg shadow-xl hover:scale-105 transition-transform relative z-10"
            >
              Build Your Profile <ArrowRight className="w-5 h-5" />
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
