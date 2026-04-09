import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Briefcase, Target, BarChart3, CheckCircle2, ArrowRight, Zap, Bot } from 'lucide-react'

export default function WorkExperienceLearnMore() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-white dark:bg-[#030711] font-sans text-[#10223e] dark:text-slate-200 transition-colors duration-300">
      <style dangerouslySetInnerHTML={{
        __html: `
          .hero-gradient-we {
            background: radial-gradient(circle at top right, rgba(28,97,207,0.15), transparent 28%),
                        linear-gradient(180deg, #f0f6ff 0%, #e8f4fb 100%);
          }
          .dark .hero-gradient-we {
            background: radial-gradient(circle at top right, rgba(28,97,207,0.12), transparent 30%),
                        radial-gradient(circle at bottom left, rgba(20,58,114,0.15), transparent 40%),
                        linear-gradient(180deg, #030711 0%, #0a1329 100%);
          }
          .we-card {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .we-card:hover {
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
            onClick={() => navigate('/dashboard/resume/work-experience?mode=standalone')}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1c61cf] to-[#143a72] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <Briefcase className="w-5 h-5" />
            </div>
            <span className="tracking-tight text-lg">NovaWork Global</span>
          </div>
          <button
            onClick={() => navigate('/dashboard/resume/work-experience?mode=standalone')}
            className="flex items-center gap-2 text-sm font-semibold text-[#5a6b86] dark:text-slate-400 hover:text-[#0b2450] dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> {t('workExperienceLearnMore.backToWorkExperience')}
          </button>
        </div>
      </div>

      <div className="hero-gradient-we">
        {/* Hero */}
        <header className="max-w-[1100px] mx-auto pt-24 pb-20 px-6">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-5 py-2 border border-[#1c61cf]/30 rounded-full bg-[rgba(28,97,207,0.1)] text-[#1c61cf] dark:text-blue-400 text-xs font-black uppercase tracking-widest mb-8 backdrop-blur-sm shadow-[0_0_15px_rgba(28,97,207,0.1)]">
              {t('workExperienceLearnMore.heroBadge')}
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-[#0b2450] dark:text-white leading-[1.05] tracking-tight mb-8">
              {t('workExperienceLearnMore.heroTitle')}
            </h1>
            <p className="text-xl md:text-2xl leading-relaxed text-[#5a6b86] dark:text-slate-300 mb-10 max-w-3xl mx-auto">
              {t('workExperienceLearnMore.heroDescription')}
            </p>
          </div>
        </header>

        {/* Infographic */}
        <section className="max-w-[1100px] mx-auto pt-4 pb-8 px-6 text-center">
          <div className="relative group">
            <div className="absolute -inset-4 bg-blue-500/10 rounded-[60px] blur-2xl group-hover:bg-blue-500/20 transition-all duration-700" />
            <img
              src="/images/work experience.jpg"
              alt={t('workExperienceLearnMore.infographicAlt')}
              className="relative w-full h-auto rounded-[40px] shadow-2xl border border-[rgba(11,36,80,0.06)] dark:border-white/5 transform transition-transform duration-700 hover:scale-[1.01]"
            />
          </div>
        </section>

        {/* Anatomy of an Entry */}
        <section id="framework" className="max-w-[1100px] mx-auto py-16 px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-[#0b2450] dark:text-white mb-3">{t('workExperienceLearnMore.anatomyTitle')}</h2>
            <p className="text-[#5a6b86] dark:text-slate-400 text-lg max-w-2xl mx-auto">{t('workExperienceLearnMore.anatomySubtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="we-card rounded-2xl overflow-hidden border-2 border-[#0b2450] dark:border-blue-900 shadow-lg bg-white dark:bg-slate-900/50">
              <div className="bg-[#0b2450] text-white px-6 py-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div className="text-xl font-black">{t('workExperienceLearnMore.theBasics')}</div>
              </div>
              <div className="p-6 space-y-3">
                <p className="text-[#5a6b86] dark:text-slate-400 text-sm mb-4">{t('workExperienceLearnMore.basicsDesc')}</p>
                {[
                  t('workExperienceLearnMore.companyName'),
                  t('workExperienceLearnMore.positionHeld'),
                  t('workExperienceLearnMore.location'),
                  t('workExperienceLearnMore.yearsWorked')
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 p-3 bg-[#f0f6ff] dark:bg-slate-950/50 rounded-xl border border-[#d7e7f0] dark:border-white/5">
                    <CheckCircle2 className="w-5 h-5 text-[#1c61cf] flex-shrink-0" />
                    <span className="font-semibold text-[#0b2450] dark:text-slate-200 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="we-card rounded-2xl overflow-hidden border-2 border-[#1c61cf] dark:border-blue-700 shadow-lg bg-white dark:bg-slate-900/50">
              <div className="bg-[#1c61cf] text-white px-6 py-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Target className="w-6 h-6" />
                </div>
                <div className="text-xl font-black">{t('workExperienceLearnMore.impactParagraph')}</div>
              </div>
              <div className="p-6 space-y-3">
                <p className="text-[#5a6b86] dark:text-slate-400 text-sm mb-4">{t('workExperienceLearnMore.impactDesc')}</p>
                {[
                  t('workExperienceLearnMore.purpose'),
                  t('workExperienceLearnMore.scope'),
                  t('workExperienceLearnMore.results')
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 p-3 bg-[#f0f6ff] dark:bg-slate-950/50 rounded-xl border border-[#d7e7f0] dark:border-white/5">
                    <CheckCircle2 className="w-5 h-5 text-[#1c61cf] flex-shrink-0" />
                    <span className="font-semibold text-[#0b2450] dark:text-slate-200 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Core Philosophy */}
        <section className="max-w-[1100px] mx-auto py-16 px-6 border-t border-[rgba(11,36,80,0.05)]">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-[#0b2450] dark:text-white mb-3">
              {t('workExperienceLearnMore.philosophyTitle')}{' '}
              <span className="line-through text-red-400">{t('workExperienceLearnMore.stopListingTasks')}</span>
            </h2>
            <p className="text-[#5a6b86] dark:text-slate-400 text-lg max-w-2xl mx-auto">{t('workExperienceLearnMore.philosophySubtitle')}</p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 max-w-4xl mx-auto">
            <div className="we-card flex-1 rounded-2xl p-8 bg-[#0b2450] text-white shadow-xl text-center">
              <Target className="w-10 h-10 mx-auto mb-4 opacity-90" />
              <div className="text-xl font-black mb-2">{t('workExperienceLearnMore.purpose')}</div>
              <p className="text-white/70 text-sm leading-relaxed">{t('workExperienceLearnMore.purposeDesc')}</p>
            </div>

            <div className="text-3xl font-black text-[#1c61cf] dark:text-blue-400">+</div>

            <div className="we-card flex-1 rounded-2xl p-8 bg-[#39d0d8]/20 dark:bg-[#39d0d8]/10 border-2 border-[#39d0d8]/40 shadow-xl text-center">
              <BarChart3 className="w-10 h-10 mx-auto mb-4 text-[#1c61cf] dark:text-teal-400" />
              <div className="text-xl font-black text-[#0b2450] dark:text-white mb-2">{t('workExperienceLearnMore.scope')}</div>
              <p className="text-[#5a6b86] dark:text-slate-400 text-sm leading-relaxed">{t('workExperienceLearnMore.scopeDesc')}</p>
            </div>

            <div className="text-3xl font-black text-[#1c61cf] dark:text-blue-400">=</div>

            <div className="we-card flex-1 rounded-2xl p-8 bg-[#1c61cf] text-white shadow-xl text-center">
              <Zap className="w-10 h-10 mx-auto mb-4" />
              <div className="text-xl font-black mb-2">{t('workExperienceLearnMore.impact')}</div>
              <p className="text-white/70 text-sm leading-relaxed">{t('workExperienceLearnMore.impactCardDesc')}</p>
            </div>
          </div>
        </section>

        {/* Before / After */}
        <section className="max-w-[1100px] mx-auto py-16 px-6 border-t border-[rgba(11,36,80,0.05)]">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-[#0b2450] dark:text-white mb-3">{t('workExperienceLearnMore.genericToPowerfulTitle')}</h2>
            <p className="text-[#5a6b86] dark:text-slate-400 text-lg">{t('workExperienceLearnMore.genericToPowerfulSubtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="rounded-2xl p-8 bg-slate-100 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-800">
              <div className="inline-block px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-black uppercase tracking-widest mb-4">{t('workExperienceLearnMore.oldWay')}</div>
              <p className="text-xl text-[#5a6b86] dark:text-slate-400 italic leading-relaxed">
                {t('workExperienceLearnMore.oldWayText')}
              </p>
              <p className="mt-4 text-sm text-red-500 font-semibold">{t('workExperienceLearnMore.oldWayDesc')}</p>
            </div>

            <div className="rounded-2xl p-8 bg-[#f0f6ff] dark:bg-blue-950/30 border-2 border-[#1c61cf] shadow-lg">
              <div className="inline-block px-3 py-1 rounded-full bg-[#1c61cf] text-white text-xs font-black uppercase tracking-widest mb-4">{t('workExperienceLearnMore.novaWorkWay')}</div>
              <p className="text-xl text-[#0b2450] dark:text-white font-semibold leading-relaxed">
                {t('workExperienceLearnMore.novaWorkWayText')}
              </p>
              <p className="mt-4 text-sm text-[#1c61cf] dark:text-blue-400 font-semibold">{t('workExperienceLearnMore.novaWorkWayDesc')}</p>
            </div>
          </div>
        </section>

        {/* Scope Examples */}
        <section className="max-w-[1100px] mx-auto py-16 px-6 border-t border-[rgba(11,36,80,0.05)]">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-[#0b2450] dark:text-white mb-3">{t('workExperienceLearnMore.quantifyingScopeTitle')}</h2>
            <p className="text-[#5a6b86] dark:text-slate-400 text-lg">{t('workExperienceLearnMore.quantifyingScopeSubtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="we-card rounded-2xl p-8 bg-white dark:bg-slate-900/50 border border-[rgba(11,36,80,0.06)] dark:border-white/5 shadow-lg text-center">
              <div className="text-5xl font-black text-[#0b2450] dark:text-white mb-2">{t('workExperienceLearnMore.scopeExample1Number')}</div>
              <div className="w-12 h-0.5 bg-[#39d0d8] mx-auto mb-4" />
              <p className="text-[#5a6b86] dark:text-slate-400 text-sm">{t('workExperienceLearnMore.scopeExample1Desc')}</p>
            </div>

            <div className="we-card rounded-2xl p-8 bg-white dark:bg-slate-900/50 border border-[rgba(11,36,80,0.06)] dark:border-white/5 shadow-lg text-center">
              <div className="text-5xl font-black text-[#0b2450] dark:text-white mb-2">{t('workExperienceLearnMore.scopeExample2Number')}</div>
              <div className="w-12 h-0.5 bg-[#39d0d8] mx-auto mb-4" />
              <p className="text-[#5a6b86] dark:text-slate-400 text-sm">{t('workExperienceLearnMore.scopeExample2Desc')}</p>
            </div>
          </div>
        </section>

        {/* Diagnostic Matrix */}
        <section className="max-w-[1100px] mx-auto py-16 px-6 border-t border-[rgba(11,36,80,0.05)]">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-[#0b2450] dark:text-white mb-3">{t('workExperienceLearnMore.diagnosticMatrixTitle')}</h2>
            <p className="text-[#5a6b86] dark:text-slate-400 text-lg">{t('workExperienceLearnMore.diagnosticMatrixSubtitle')}</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[rgba(11,36,80,0.06)] dark:border-white/5 shadow-lg">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="p-4 bg-slate-100 dark:bg-slate-900 text-left text-[#5a6b86] dark:text-slate-400 font-bold"></th>
                  <th className="p-4 bg-slate-200 dark:bg-slate-800 text-center text-[#5a6b86] dark:text-slate-400 font-black uppercase tracking-wider">{t('workExperienceLearnMore.tasks')}</th>
                  <th className="p-4 bg-[#0b2450] text-center text-white font-black uppercase tracking-wider">{t('workExperienceLearnMore.purpose')}</th>
                  <th className="p-4 bg-[#39d0d8]/30 dark:bg-[#39d0d8]/20 text-center text-[#1c61cf] dark:text-teal-400 font-black uppercase tracking-wider">{t('workExperienceLearnMore.scope')}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-[rgba(11,36,80,0.06)] dark:border-white/5">
                  <td className="p-4 bg-white dark:bg-slate-900/50 font-bold text-[#0b2450] dark:text-white">{t('workExperienceLearnMore.coreQuestion')}</td>
                  <td className="p-4 bg-white dark:bg-slate-900/50 text-center text-[#5a6b86] dark:text-slate-400">{t('workExperienceLearnMore.taskQuestion')}</td>
                  <td className="p-4 bg-[#f0f6ff] dark:bg-blue-950/20 text-center text-[#0b2450] dark:text-white font-medium">{t('workExperienceLearnMore.purposeQuestion')}</td>
                  <td className="p-4 bg-[#f0fbff] dark:bg-teal-950/20 text-center text-[#0b2450] dark:text-white font-medium">{t('workExperienceLearnMore.scopeQuestion')}</td>
                </tr>
                <tr className="border-t border-[rgba(11,36,80,0.06)] dark:border-white/5">
                  <td className="p-4 bg-white dark:bg-slate-900/50 font-bold text-[#0b2450] dark:text-white">{t('workExperienceLearnMore.theFocus')}</td>
                  <td className="p-4 bg-white dark:bg-slate-900/50 text-center text-[#5a6b86] dark:text-slate-400">{t('workExperienceLearnMore.tasksFocus')}</td>
                  <td className="p-4 bg-[#f0f6ff] dark:bg-blue-950/20 text-center text-[#0b2450] dark:text-white font-medium">{t('workExperienceLearnMore.purposeFocus')}</td>
                  <td className="p-4 bg-[#f0fbff] dark:bg-teal-950/20 text-center text-[#0b2450] dark:text-white font-medium">{t('workExperienceLearnMore.scopeFocus')}</td>
                </tr>
                <tr className="border-t border-[rgba(11,36,80,0.06)] dark:border-white/5">
                  <td className="p-4 bg-white dark:bg-slate-900/50 font-bold text-[#0b2450] dark:text-white">{t('workExperienceLearnMore.theVerdict')}</td>
                  <td className="p-4 bg-white dark:bg-slate-900/50 text-center">
                    <span className="px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-[#5a6b86] dark:text-slate-400 font-bold text-xs">{t('workExperienceLearnMore.blendsIn')}</span>
                  </td>
                  <td className="p-4 bg-[#f0f6ff] dark:bg-blue-950/20 text-center">
                    <span className="px-3 py-1 rounded-full bg-[#0b2450] text-white font-bold text-xs">{t('workExperienceLearnMore.standsOut')}</span>
                  </td>
                  <td className="p-4 bg-[#f0fbff] dark:bg-teal-950/20 text-center">
                    <span className="px-3 py-1 rounded-full bg-[#39d0d8] text-[#0b2450] font-bold text-xs">{t('workExperienceLearnMore.provesAuthority')}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Two Paths + Final Blueprint */}
        <section className="max-w-[1100px] mx-auto py-16 px-6 border-t border-[rgba(11,36,80,0.05)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-black text-[#0b2450] dark:text-white mb-4">{t('workExperienceLearnMore.secretWeaponTitle')}</h2>
              <p className="text-[#5a6b86] dark:text-slate-400 leading-relaxed mb-8">
                {t('workExperienceLearnMore.secretWeaponDesc')}
              </p>
              <div className="space-y-4">
                <div className="flex gap-4 p-5 bg-white dark:bg-slate-900/50 rounded-2xl border border-[rgba(11,36,80,0.06)] dark:border-white/5 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-[#0b2450] flex items-center justify-center text-white font-black text-sm flex-shrink-0">A</div>
                  <div>
                    <div className="font-bold text-[#0b2450] dark:text-white mb-1">{t('workExperienceLearnMore.manualMode')}</div>
                    <p className="text-[#5a6b86] dark:text-slate-400 text-sm">{t('workExperienceLearnMore.manualModeDesc')}</p>
                  </div>
                </div>
                <div className="flex gap-4 p-5 bg-[#f0f6ff] dark:bg-blue-950/20 rounded-2xl border border-[#1c61cf]/20 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-[#1c61cf] flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-[#0b2450] dark:text-white mb-1">{t('workExperienceLearnMore.aiAssist')}</div>
                    <p className="text-[#5a6b86] dark:text-slate-400 text-sm">{t('workExperienceLearnMore.aiAssistDesc')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900/50 rounded-[32px] p-8 border border-[rgba(11,36,80,0.06)] dark:border-white/5 shadow-xl">
              <div className="text-xs font-black uppercase tracking-widest text-[#1c61cf] dark:text-blue-400 mb-4">{t('workExperienceLearnMore.finalBlueprint')}</div>
              <div className="p-5 rounded-2xl border-2 border-[#1c61cf]/20 bg-[#f8fcfe] dark:bg-slate-950/50">
                <div className="flex flex-wrap gap-2 mb-4 text-xs font-bold text-[#5a6b86] dark:text-slate-400">
                  <span className="flex items-center gap-1"><span className="text-[#39d0d8]">◉</span> Acme Corp</span>
                  <span className="text-slate-300 dark:text-slate-600">|</span>
                  <span>Regional Director</span>
                  <span className="text-slate-300 dark:text-slate-600">|</span>
                  <span>Chicago, IL</span>
                  <span className="text-slate-300 dark:text-slate-600">|</span>
                  <span>2018–2023</span>
                </div>
                <p className="text-[#0b2450] dark:text-slate-200 text-sm leading-relaxed">
                  Led a regional sales team to increase market share by 20% in one year. Oversaw operations for a team of 50 employees across three regions, successfully managing a $5 million budget for a nationwide marketing campaign.
                </p>
                <div className="mt-4 flex gap-2 flex-wrap">
                  <span className="px-2 py-1 rounded-lg bg-[#0b2450] text-white text-xs font-bold">{t('workExperienceLearnMore.purposeTag')}</span>
                  <span className="px-2 py-1 rounded-lg bg-[#39d0d8]/30 text-[#1c61cf] dark:text-teal-400 text-xs font-bold">{t('workExperienceLearnMore.scopeTag')}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-[800px] mx-auto py-24 px-6 text-center">
          <div className="bg-gradient-to-br from-[#0b2450] to-[#143a72] rounded-[40px] p-12 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
            <h2 className="text-4xl font-black mb-6 relative z-10">{t('workExperienceLearnMore.ctaTitle')}</h2>
            <p className="text-lg text-white/80 mb-10 relative z-10">
              {t('workExperienceLearnMore.ctaDescription')}
            </p>
            <button
              onClick={() => navigate('/dashboard/resume/work-experience?mode=standalone')}
              className="inline-flex items-center gap-2 bg-[#39d0d8] text-[#0b2450] px-10 py-4 rounded-2xl font-black text-lg shadow-xl hover:scale-105 transition-transform relative z-10"
            >
              {t('workExperienceLearnMore.ctaButton')} <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </section>
      </div>

      <footer className="py-12 border-t border-[rgba(11,36,80,0.05)] dark:border-white/5 text-center text-[#5a6b86] dark:text-slate-500 text-sm font-medium">
        &copy; {new Date().getFullYear()} NovaWork Global • {t('workExperienceLearnMore.footerTagline')}
      </footer>
    </div>
  )
}
