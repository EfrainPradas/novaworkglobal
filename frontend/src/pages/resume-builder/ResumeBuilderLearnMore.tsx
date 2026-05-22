import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
    ArrowLeft, ArrowRight, FileText, Filter, TrendingUp, Layers, CheckCircle2,
    Sparkles, Tag, Upload, FolderHeart, Target, ClipboardList, Search,
    BarChart3, UserCheck, Download, FileDown, FileText as FileDoc, Printer,
    Pencil, ListChecks, Lightbulb,
} from 'lucide-react'

export default function ResumeBuilderLearnMore() {
    const navigate = useNavigate()
    const { t } = useTranslation()

    return (
        <div className="min-h-screen bg-white dark:bg-[#030711] font-sans text-[#10223e] dark:text-slate-200 transition-colors duration-300">
            <style dangerouslySetInnerHTML={{
                __html: `
                    .hero-gradient-rs {
                        background: radial-gradient(circle at top right, rgba(145,193,113,0.20), transparent 28%),
                                    linear-gradient(180deg, #f4faf0 0%, #eaf4ec 100%);
                    }
                    .dark .hero-gradient-rs {
                        background: radial-gradient(circle at top right, rgba(145,193,113,0.15), transparent 30%),
                                    radial-gradient(circle at bottom left, rgba(14,75,43,0.20), transparent 40%),
                                    linear-gradient(180deg, #030711 0%, #0a1f15 100%);
                    }
                    .rs-card {
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    }
                    .rs-card:hover {
                        transform: translateY(-4px);
                        box-shadow: 0 20px 40px rgba(14, 75, 43, 0.10);
                    }
                `
            }} />

            {/* Topbar */}
            <div className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-slate-950/70 border-b border-[rgba(14,75,43,0.08)] dark:border-white/5">
                <div className="max-w-[1100px] mx-auto flex items-center justify-between px-6 py-4">
                    <div
                        className="flex items-center gap-3 font-bold text-[#0E4B2B] dark:text-white cursor-pointer group"
                        onClick={() => navigate('/dashboard/resume-builder')}
                    >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#91c171] to-[#0E4B2B] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                            <FileText className="w-5 h-5" />
                        </div>
                        <span className="tracking-tight text-lg">{t('resumeBuilderLearnMore.pdfTitle')}</span>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard/resume-builder')}
                        className="flex items-center gap-2 text-sm font-semibold text-[#5a6b86] dark:text-slate-400 hover:text-[#0E4B2B] dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> {t('resumeBuilderLearnMore.backToResumeBuilder')}
                    </button>
                </div>
            </div>

            <div className="hero-gradient-rs">
                {/* Hero */}
                <header className="max-w-[1100px] mx-auto pt-20 pb-16 px-6">
                    <div className="text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-5 py-2 border border-[#91c171]/40 rounded-full bg-[rgba(145,193,113,0.12)] text-[#0E4B2B] dark:text-[#91c171] text-xs font-black uppercase tracking-widest mb-8 backdrop-blur-sm">
                            {t('resumeBuilderLearnMore.heroBadge')}
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-[#0E4B2B] dark:text-white leading-[1.05] tracking-tight mb-8">
                            {t('resumeBuilderLearnMore.heroTitle')}
                        </h1>
                        <p className="text-xl md:text-2xl leading-relaxed text-[#5a6b86] dark:text-slate-300 mb-10 max-w-3xl mx-auto">
                            {t('resumeBuilderLearnMore.heroDescription')}
                        </p>
                        <button
                            onClick={() => navigate('/dashboard/resume-builder')}
                            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-[#0E4B2B] text-white font-bold shadow-lg hover:bg-[#357A3E] transition-all"
                        >
                            {t('resumeBuilderLearnMore.ctaButton')} <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </header>
            </div>

            {/* Why Resume Studio - Stats */}
            <section className="max-w-[1100px] mx-auto py-20 px-6">
                <h2 className="text-4xl font-black text-[#0E4B2B] dark:text-white text-center mb-12">
                    {t('resumeBuilderLearnMore.whyTitle')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { num: t('resumeBuilderLearnMore.stat75'), label: t('resumeBuilderLearnMore.stat75Label'), desc: t('resumeBuilderLearnMore.stat75Desc'), Icon: Filter, color: '#EF4444' },
                        { num: t('resumeBuilderLearnMore.stat3x'), label: t('resumeBuilderLearnMore.stat3xLabel'), desc: t('resumeBuilderLearnMore.stat3xDesc'), Icon: TrendingUp, color: '#0E4B2B' },
                        { num: t('resumeBuilderLearnMore.stat4'), label: t('resumeBuilderLearnMore.stat4Label'), desc: t('resumeBuilderLearnMore.stat4Desc'), Icon: Layers, color: '#91c171' },
                    ].map((s) => (
                        <div key={s.label} className="rs-card bg-white dark:bg-slate-900 rounded-2xl p-8 border border-[rgba(14,75,43,0.08)] dark:border-white/5 shadow-sm text-center">
                            <div className="w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center" style={{ background: `${s.color}1A` }}>
                                <s.Icon className="w-7 h-7" style={{ color: s.color }} />
                            </div>
                            <div className="text-6xl font-black text-[#0E4B2B] dark:text-white mb-2">{s.num}</div>
                            <div className="text-base font-bold text-[#0E4B2B] dark:text-[#91c171] uppercase tracking-wide mb-3">{s.label}</div>
                            <p className="text-sm text-[#5a6b86] dark:text-slate-400 leading-relaxed">{s.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* 4-Step Guided Workflow */}
            <section className="bg-slate-50 dark:bg-slate-900/40 py-20">
                <div className="max-w-[1100px] mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-black text-[#0E4B2B] dark:text-white mb-4">{t('resumeBuilderLearnMore.workflowTitle')}</h2>
                        <p className="text-[#5a6b86] dark:text-slate-400 text-lg max-w-3xl mx-auto">{t('resumeBuilderLearnMore.workflowDesc')}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        {[
                            { n: 1, title: t('resumeBuilderLearnMore.workflow1Title'), desc: t('resumeBuilderLearnMore.workflow1Desc'), Icon: Sparkles },
                            { n: 2, title: t('resumeBuilderLearnMore.workflow2Title'), desc: t('resumeBuilderLearnMore.workflow2Desc'), Icon: ClipboardList },
                            { n: 3, title: t('resumeBuilderLearnMore.workflow3Title'), desc: t('resumeBuilderLearnMore.workflow3Desc'), Icon: UserCheck },
                            { n: 4, title: t('resumeBuilderLearnMore.workflow4Title'), desc: t('resumeBuilderLearnMore.workflow4Desc'), Icon: Layers },
                        ].map((step) => (
                            <div key={step.n} className="rs-card bg-white dark:bg-slate-900 rounded-2xl p-6 border border-[rgba(14,75,43,0.08)] dark:border-white/5">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-[#EAF4EC] dark:bg-[#0E4B2B]/30 flex items-center justify-center">
                                        <step.Icon className="w-6 h-6 text-[#0E4B2B] dark:text-[#91c171]" />
                                    </div>
                                    <span className="text-3xl font-black text-[#91c171]/40">0{step.n}</span>
                                </div>
                                <h3 className="text-lg font-bold text-[#0E4B2B] dark:text-white mb-2">{step.title}</h3>
                                <p className="text-sm text-[#5a6b86] dark:text-slate-400 leading-relaxed">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                    <p className="text-center text-[#5a6b86] dark:text-slate-400 mt-10 max-w-3xl mx-auto italic">
                        {t('resumeBuilderLearnMore.workflowFooter')}
                    </p>
                </div>
            </section>

            {/* CAR Stories */}
            <section className="max-w-[1100px] mx-auto py-20 px-6">
                <h2 className="text-4xl font-black text-[#0E4B2B] dark:text-white text-center mb-12">
                    {t('resumeBuilderLearnMore.carTitle')}
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="rs-card bg-gradient-to-br from-[#0E4B2B] to-[#357A3E] text-white rounded-2xl p-8 shadow-lg">
                        <Target className="w-10 h-10 mb-4 text-[#91c171]" />
                        <h3 className="text-2xl font-bold mb-4">{t('resumeBuilderLearnMore.carFrameworkTitle')}</h3>
                        <p className="text-white/90 leading-relaxed mb-4">{t('resumeBuilderLearnMore.carFrameworkDesc1')}</p>
                        <p className="text-white/80 leading-relaxed text-sm">{t('resumeBuilderLearnMore.carFrameworkDesc2')}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { title: t('resumeBuilderLearnMore.carFeature1Title'), desc: t('resumeBuilderLearnMore.carFeature1Desc'), Icon: Sparkles },
                            { title: t('resumeBuilderLearnMore.carFeature2Title'), desc: t('resumeBuilderLearnMore.carFeature2Desc'), Icon: Tag },
                            { title: t('resumeBuilderLearnMore.carFeature3Title'), desc: t('resumeBuilderLearnMore.carFeature3Desc'), Icon: Upload },
                            { title: t('resumeBuilderLearnMore.carFeature4Title'), desc: t('resumeBuilderLearnMore.carFeature4Desc'), Icon: FolderHeart },
                        ].map((f) => (
                            <div key={f.title} className="rs-card bg-white dark:bg-slate-900 rounded-xl p-5 border border-[rgba(14,75,43,0.08)] dark:border-white/5">
                                <f.Icon className="w-7 h-7 text-[#91c171] mb-3" />
                                <h4 className="text-sm font-bold text-[#0E4B2B] dark:text-white mb-2">{f.title}</h4>
                                <p className="text-xs text-[#5a6b86] dark:text-slate-400 leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Professional Positioning */}
            <section className="bg-slate-50 dark:bg-slate-900/40 py-20">
                <div className="max-w-[1100px] mx-auto px-6">
                    <div className="text-center mb-12 max-w-3xl mx-auto">
                        <h2 className="text-4xl font-black text-[#0E4B2B] dark:text-white mb-4">{t('resumeBuilderLearnMore.positioningTitle')}</h2>
                        <p className="text-[#5a6b86] dark:text-slate-400 leading-relaxed">{t('resumeBuilderLearnMore.positioningDesc')}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                        {[
                            { title: t('resumeBuilderLearnMore.positioning1Title'), desc: t('resumeBuilderLearnMore.positioning1Desc') },
                            { title: t('resumeBuilderLearnMore.positioning2Title'), desc: t('resumeBuilderLearnMore.positioning2Desc') },
                            { title: t('resumeBuilderLearnMore.positioning3Title'), desc: t('resumeBuilderLearnMore.positioning3Desc') },
                        ].map((p, i) => (
                            <div key={p.title} className="rs-card bg-white dark:bg-slate-900 rounded-2xl p-6 border border-[rgba(14,75,43,0.08)] dark:border-white/5">
                                <div className="text-xs font-black text-[#91c171] mb-2">0{i + 1}</div>
                                <h3 className="text-base font-bold text-[#0E4B2B] dark:text-white mb-2">{p.title}</h3>
                                <p className="text-sm text-[#5a6b86] dark:text-slate-400 leading-relaxed">{p.desc}</p>
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {[
                            { title: t('resumeBuilderLearnMore.positioning4Title'), desc: t('resumeBuilderLearnMore.positioning4Desc') },
                            { title: t('resumeBuilderLearnMore.positioning5Title'), desc: t('resumeBuilderLearnMore.positioning5Desc') },
                        ].map((p, i) => (
                            <div key={p.title} className="rs-card bg-white dark:bg-slate-900 rounded-2xl p-6 border border-[rgba(14,75,43,0.08)] dark:border-white/5">
                                <div className="text-xs font-black text-[#91c171] mb-2">0{i + 4}</div>
                                <h3 className="text-base font-bold text-[#0E4B2B] dark:text-white mb-2">{p.title}</h3>
                                <p className="text-sm text-[#5a6b86] dark:text-slate-400 leading-relaxed">{p.desc}</p>
                            </div>
                        ))}
                    </div>
                    <p className="text-center text-[#5a6b86] dark:text-slate-400 mt-8 italic max-w-3xl mx-auto">
                        {t('resumeBuilderLearnMore.positioningFooter')}
                    </p>
                </div>
            </section>

            {/* Two Resume Formats */}
            <section className="max-w-[1100px] mx-auto py-20 px-6">
                <h2 className="text-4xl font-black text-[#0E4B2B] dark:text-white text-center mb-12">
                    {t('resumeBuilderLearnMore.formatsTitle')}
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Chronological */}
                    <div className="rs-card rounded-2xl overflow-hidden border-2 border-[#0E4B2B] dark:border-[#0E4B2B] shadow-lg">
                        <div className="bg-[#0E4B2B] text-white px-6 py-3 text-xs font-black uppercase tracking-widest">
                            {t('resumeBuilderLearnMore.chronoBadge')}
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-6">
                            <h3 className="text-2xl font-bold text-[#0E4B2B] dark:text-white mb-3">{t('resumeBuilderLearnMore.chronoTitle')}</h3>
                            <p className="text-sm text-[#5a6b86] dark:text-slate-400 mb-5 leading-relaxed">{t('resumeBuilderLearnMore.chronoDesc')}</p>
                            <ul className="space-y-2">
                                {[1, 2, 3, 4].map((n) => (
                                    <li key={n} className="flex items-start gap-2 text-sm text-[#10223e] dark:text-slate-300">
                                        <CheckCircle2 className="w-4 h-4 text-[#91c171] flex-shrink-0 mt-0.5" />
                                        <span>{t(`resumeBuilderLearnMore.chronoBullet${n}`)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    {/* Functional */}
                    <div className="rs-card rounded-2xl overflow-hidden border-2 border-[#91c171] shadow-lg">
                        <div className="bg-[#91c171] text-[#0E4B2B] px-6 py-3 text-xs font-black uppercase tracking-widest">
                            {t('resumeBuilderLearnMore.funcBadge')}
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-6">
                            <h3 className="text-2xl font-bold text-[#0E4B2B] dark:text-white mb-3">{t('resumeBuilderLearnMore.funcTitle')}</h3>
                            <p className="text-sm text-[#5a6b86] dark:text-slate-400 mb-5 leading-relaxed">{t('resumeBuilderLearnMore.funcDesc')}</p>
                            <ul className="space-y-2">
                                {[1, 2, 3, 4].map((n) => (
                                    <li key={n} className="flex items-start gap-2 text-sm text-[#10223e] dark:text-slate-300">
                                        <CheckCircle2 className="w-4 h-4 text-[#91c171] flex-shrink-0 mt-0.5" />
                                        <span>{t(`resumeBuilderLearnMore.funcBullet${n}`)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* ATS Optimization */}
            <section className="bg-slate-50 dark:bg-slate-900/40 py-20">
                <div className="max-w-[1100px] mx-auto px-6">
                    <h2 className="text-4xl font-black text-[#0E4B2B] dark:text-white text-center mb-12">
                        {t('resumeBuilderLearnMore.atsTitle')}
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                        <div className="rs-card bg-white dark:bg-slate-900 rounded-2xl p-7 border border-[rgba(14,75,43,0.08)] dark:border-white/5">
                            <ListChecks className="w-9 h-9 text-[#0E4B2B] dark:text-[#91c171] mb-4" />
                            <h3 className="text-xl font-bold text-[#0E4B2B] dark:text-white mb-3">{t('resumeBuilderLearnMore.atsChecklistTitle')}</h3>
                            <p className="text-sm text-[#5a6b86] dark:text-slate-400 leading-relaxed">{t('resumeBuilderLearnMore.atsChecklistDesc')}</p>
                        </div>
                        <div className="rs-card bg-white dark:bg-slate-900 rounded-2xl p-7 border border-[rgba(14,75,43,0.08)] dark:border-white/5">
                            <Search className="w-9 h-9 text-[#0E4B2B] dark:text-[#91c171] mb-4" />
                            <h3 className="text-xl font-bold text-[#0E4B2B] dark:text-white mb-3">{t('resumeBuilderLearnMore.atsAnalyzerTitle')}</h3>
                            <p className="text-sm text-[#5a6b86] dark:text-slate-400 leading-relaxed mb-4">{t('resumeBuilderLearnMore.atsAnalyzerDesc')}</p>
                            <div className="flex items-start gap-2 bg-[#EAF4EC] dark:bg-[#0E4B2B]/20 rounded-xl p-3">
                                <Lightbulb className="w-4 h-4 text-[#0E4B2B] dark:text-[#91c171] flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-[#0E4B2B] dark:text-[#91c171] leading-relaxed">{t('resumeBuilderLearnMore.atsProTip')}</p>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((n) => (
                            <div key={n} className="rs-card bg-white dark:bg-slate-900 rounded-xl p-5 border border-[rgba(14,75,43,0.08)] dark:border-white/5 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-[#0E4B2B] text-white flex items-center justify-center font-black flex-shrink-0">
                                    {n}
                                </div>
                                <div className="text-sm font-bold text-[#0E4B2B] dark:text-white">
                                    {t(`resumeBuilderLearnMore.atsPhase${n}`)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Resume Tracking */}
            <section className="max-w-[1100px] mx-auto py-20 px-6">
                <div className="text-center mb-12 max-w-3xl mx-auto">
                    <h2 className="text-4xl font-black text-[#0E4B2B] dark:text-white mb-4">{t('resumeBuilderLearnMore.trackingTitle')}</h2>
                    <p className="text-[#5a6b86] dark:text-slate-400 leading-relaxed">{t('resumeBuilderLearnMore.trackingDesc')}</p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
                    {[1, 2, 3, 4].map((n) => (
                        <div key={n} className="flex items-center gap-3">
                            <span className="px-5 py-2 rounded-full bg-[#EAF4EC] dark:bg-[#0E4B2B]/30 text-[#0E4B2B] dark:text-[#91c171] font-semibold text-sm">
                                {t(`resumeBuilderLearnMore.trackStatus${n}`)}
                            </span>
                            {n < 4 && <ArrowRight className="w-4 h-4 text-[#91c171]" />}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {[
                        { title: t('resumeBuilderLearnMore.trackFeat1Title'), desc: t('resumeBuilderLearnMore.trackFeat1Desc'), Icon: BarChart3 },
                        { title: t('resumeBuilderLearnMore.trackFeat2Title'), desc: t('resumeBuilderLearnMore.trackFeat2Desc'), Icon: UserCheck },
                        { title: t('resumeBuilderLearnMore.trackFeat3Title'), desc: t('resumeBuilderLearnMore.trackFeat3Desc'), Icon: Filter },
                        { title: t('resumeBuilderLearnMore.trackFeat4Title'), desc: t('resumeBuilderLearnMore.trackFeat4Desc'), Icon: Download },
                    ].map((f) => (
                        <div key={f.title} className="rs-card bg-white dark:bg-slate-900 rounded-2xl p-6 border border-[rgba(14,75,43,0.08)] dark:border-white/5 flex gap-4">
                            <div className="w-11 h-11 rounded-xl bg-[#EAF4EC] dark:bg-[#0E4B2B]/30 flex items-center justify-center flex-shrink-0">
                                <f.Icon className="w-5 h-5 text-[#0E4B2B] dark:text-[#91c171]" />
                            </div>
                            <div>
                                <h4 className="font-bold text-[#0E4B2B] dark:text-white mb-1">{f.title}</h4>
                                <p className="text-sm text-[#5a6b86] dark:text-slate-400 leading-relaxed">{f.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Export & Sharing */}
            <section className="bg-slate-50 dark:bg-slate-900/40 py-20">
                <div className="max-w-[1100px] mx-auto px-6">
                    <div className="text-center mb-12 max-w-3xl mx-auto">
                        <h2 className="text-4xl font-black text-[#0E4B2B] dark:text-white mb-4">{t('resumeBuilderLearnMore.exportTitle')}</h2>
                        <p className="text-[#0E4B2B] dark:text-[#91c171] font-bold mb-2">{t('resumeBuilderLearnMore.exportSubtitle')}</p>
                        <p className="text-[#5a6b86] dark:text-slate-400 leading-relaxed">{t('resumeBuilderLearnMore.exportDesc')}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {[
                            { title: t('resumeBuilderLearnMore.exportPdf'), desc: t('resumeBuilderLearnMore.exportPdfDesc'), Icon: FileDown },
                            { title: t('resumeBuilderLearnMore.exportWord'), desc: t('resumeBuilderLearnMore.exportWordDesc'), Icon: FileDoc },
                            { title: t('resumeBuilderLearnMore.exportPrint'), desc: t('resumeBuilderLearnMore.exportPrintDesc'), Icon: Printer },
                            { title: t('resumeBuilderLearnMore.exportEdit'), desc: t('resumeBuilderLearnMore.exportEditDesc'), Icon: Pencil },
                        ].map((e) => (
                            <div key={e.title} className="rs-card bg-white dark:bg-slate-900 rounded-2xl p-6 border border-[rgba(14,75,43,0.08)] dark:border-white/5">
                                <e.Icon className="w-8 h-8 text-[#91c171] mb-4" />
                                <h4 className="font-bold text-[#0E4B2B] dark:text-white mb-2">{e.title}</h4>
                                <p className="text-xs text-[#5a6b86] dark:text-slate-400 leading-relaxed">{e.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="max-w-[1100px] mx-auto py-24 px-6 text-center">
                <h2 className="text-4xl md:text-5xl font-black text-[#0E4B2B] dark:text-white mb-6">
                    {t('resumeBuilderLearnMore.ctaTitle')}
                </h2>
                <p className="text-lg text-[#5a6b86] dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                    {t('resumeBuilderLearnMore.ctaDesc')}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto mb-10">
                    <div className="rs-card rounded-2xl p-7 border-2 border-[#0E4B2B] bg-white dark:bg-slate-900 text-left">
                        <div className="text-xs font-black uppercase tracking-widest text-[#0E4B2B] dark:text-[#91c171] mb-2">{t('resumeBuilderLearnMore.ctaCore')}</div>
                        <p className="text-sm text-[#5a6b86] dark:text-slate-400 leading-relaxed">{t('resumeBuilderLearnMore.ctaCoreDesc')}</p>
                    </div>
                    <div className="rs-card rounded-2xl p-7 bg-gradient-to-br from-[#0E4B2B] to-[#357A3E] text-left text-white">
                        <div className="text-xs font-black uppercase tracking-widest text-[#91c171] mb-2">{t('resumeBuilderLearnMore.ctaAdvance')}</div>
                        <p className="text-sm text-white/90 leading-relaxed">{t('resumeBuilderLearnMore.ctaAdvanceDesc')}</p>
                    </div>
                </div>
                <p className="text-sm text-[#5a6b86] dark:text-slate-400 italic mb-8 max-w-2xl mx-auto">
                    {t('resumeBuilderLearnMore.ctaAvailable')}
                </p>
                <button
                    onClick={() => navigate('/dashboard/resume-builder')}
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-[#0E4B2B] text-white font-bold shadow-lg hover:bg-[#357A3E] transition-all"
                >
                    {t('resumeBuilderLearnMore.ctaButton')} <ArrowRight className="w-4 h-4" />
                </button>
            </section>

            {/* Footer */}
            <footer className="border-t border-[rgba(14,75,43,0.08)] dark:border-white/5 py-6 px-6 text-center">
                <p className="text-xs text-[#5a6b86] dark:text-slate-500">{t('resumeBuilderLearnMore.footerTagline')}</p>
            </footer>
        </div>
    )
}
