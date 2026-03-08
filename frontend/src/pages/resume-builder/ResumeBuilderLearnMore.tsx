import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight } from 'lucide-react'

export default function ResumeBuilderLearnMore() {
    const navigate = useNavigate()
    const { t } = useTranslation()

    const pillars = [
        { num: '1', key: 'results' },
        { num: '2', key: 'businessImpact' },
        { num: '3', key: 'actualPerformance' },
    ]

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50/60 to-slate-50 dark:from-slate-950 dark:to-slate-900 text-gray-900 dark:text-white transition-colors duration-200">
            {/* Subtle top radial glow */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[500px] bg-[radial-gradient(ellipse_at_top_right,rgba(18,150,243,0.12),transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top_right,rgba(18,150,243,0.08),transparent_50%)]" />

            <main className="relative mx-auto max-w-7xl px-6 py-10 md:px-10 lg:px-12 space-y-8">

                {/* Back */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium"
                >
                    <ArrowLeft className="w-4 h-4" /> {t('common.back')}
                </button>

                {/* ── HERO ── */}
                <section className="relative overflow-hidden rounded-3xl border border-blue-100 dark:border-white/10 bg-gradient-to-br from-white to-blue-50 dark:from-white/[0.04] dark:to-white/[0.01] p-12 md:p-16 shadow-xl shadow-blue-900/5 dark:shadow-cyan-900/10">
                    {/* Decorative blobs */}
                    <div className="absolute right-12 top-[-28px] h-[120px] w-[120px] rounded-2xl bg-gradient-to-b from-blue-300/30 dark:from-blue-400/20 to-blue-900/10 dark:to-blue-900/10" />
                    <div className="absolute left-[-60px] bottom-12 h-[18px] w-[220px] rounded-full bg-gradient-to-r from-blue-300/20 dark:from-blue-500/10 to-transparent" />

                    <span className="mb-5 inline-block rounded-full bg-blue-50 dark:bg-blue-400/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-400/20">
                        {t('resumeBuilderLearnMore.heroBadge')}
                    </span>
                    <h1 className="max-w-3xl text-4xl font-extrabold leading-tight text-blue-950 dark:text-white md:text-5xl lg:text-[56px]">
                        {t('resumeBuilderLearnMore.heroTitle')}
                    </h1>
                    <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300 md:text-xl">
                        {t('resumeBuilderLearnMore.heroSubtitle')}
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <button
                            onClick={() => navigate('/resume-builder')}
                            className="rounded-2xl bg-blue-900 dark:bg-blue-700 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-blue-800 dark:hover:bg-blue-600"
                        >
                            {t('resumeBuilderLearnMore.ctaStart')}
                        </button>
                        <button
                            onClick={() => navigate('/resume/work-experience?mode=standalone')}
                            className="rounded-2xl border border-gray-200 dark:border-white/15 bg-white dark:bg-white/5 px-6 py-3.5 text-sm font-bold text-gray-700 dark:text-white transition hover:bg-gray-50 dark:hover:bg-white/10"
                        >
                            {t('resumeBuilderLearnMore.ctaExample')}
                        </button>
                    </div>
                </section>

                {/* ── VISUAL OVERVIEW ── */}
                <section className="mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] border border-blue-100 dark:border-white/10 bg-white dark:bg-[#081229] shadow-2xl relative group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 dark:from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <img
                        src="/images/resume-builder-infographic.png"
                        alt={t('resumeBuilderLearnMore.infographicAlt', 'The Architecture of an Accomplishment-Based Resume')}
                        className="w-full h-auto object-contain"
                    />
                </section>

                {/* ── BLACK HOLE + WHAT IT'S NOT ── */}
                <div className="grid gap-6 md:grid-cols-[1.3fr_0.7fr]">
                    {/* Dark card */}
                    <div className="flex flex-col justify-between rounded-3xl bg-gradient-to-br from-slate-900 to-blue-950 p-8 shadow-xl">
                        <div>
                            <h2 className="text-2xl font-bold text-white md:text-3xl">{t('resumeBuilderLearnMore.blackHoleTitle')}</h2>
                            <p className="mt-4 text-base leading-7 text-slate-300">{t('resumeBuilderLearnMore.blackHoleText')}</p>
                        </div>
                        <blockquote className="mt-6 text-2xl font-extrabold leading-snug text-white md:text-3xl">
                            {t('resumeBuilderLearnMore.blackHoleQuotePre')}{' '}
                            <span className="text-blue-400">{t('resumeBuilderLearnMore.blackHoleQuoteAccent')}</span>
                        </blockquote>
                    </div>

                    {/* What it's NOT */}
                    <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-7 shadow-sm">
                        <h2 className="text-xl font-bold text-blue-900 dark:text-white md:text-2xl">{t('resumeBuilderLearnMore.notTitle')}</h2>
                        <div className="mt-5 space-y-3">
                            {(['not1', 'not2', 'not3'] as const).map((key) => (
                                <div key={key} className="flex items-start gap-3 rounded-2xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] p-4">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-400/10 text-blue-600 dark:text-blue-300 font-black text-sm">×</span>
                                    <p className="text-sm font-semibold leading-6 text-gray-700 dark:text-slate-200">{t(`resumeBuilderLearnMore.${key}`)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── BIGGEST MISTAKE + WHY ACCOMPLISHMENTS WIN ── */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Biggest Mistake */}
                    <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-7 shadow-sm">
                        <h2 className="text-xl font-bold text-blue-900 dark:text-white md:text-2xl">{t('resumeBuilderLearnMore.mistakeTitle')}</h2>
                        <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-slate-300">{t('resumeBuilderLearnMore.mistakeText')}</p>
                        <div className="mt-5 grid grid-cols-2 gap-4">
                            <div className="rounded-2xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] p-4">
                                <h3 className="mb-3 text-base font-bold text-blue-900 dark:text-white">{t('resumeBuilderLearnMore.jobDescription')}</h3>
                                <ul className="space-y-1.5 pl-4 text-sm leading-7 text-gray-500 dark:text-slate-400 list-disc">
                                    {(['jd1', 'jd2', 'jd3', 'jd4'] as const).map(k => <li key={k}>{t(`resumeBuilderLearnMore.${k}`)}</li>)}
                                </ul>
                            </div>
                            <div className="rounded-2xl border border-blue-100 dark:border-blue-400/20 bg-blue-50 dark:bg-blue-400/5 p-4">
                                <h3 className="mb-3 text-base font-bold text-blue-900 dark:text-white">{t('resumeBuilderLearnMore.contribution')}</h3>
                                <ul className="space-y-1.5 pl-4 text-sm leading-7 text-blue-700 dark:text-blue-300 list-disc">
                                    {(['c1', 'c2', 'c3', 'c4'] as const).map(k => <li key={k}>{t(`resumeBuilderLearnMore.${k}`)}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Why Accomplishments Win */}
                    <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-7 shadow-sm">
                        <h2 className="text-xl font-bold text-blue-900 dark:text-white md:text-2xl">{t('resumeBuilderLearnMore.whyTitle')}</h2>
                        <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-slate-300">{t('resumeBuilderLearnMore.whyText')}</p>
                        <div className="mt-5 rounded-2xl border border-blue-100 dark:border-blue-400/20 bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-400/5 dark:to-sky-400/5 p-5">
                            <p className="text-xl font-extrabold leading-snug text-blue-900 dark:text-white md:text-2xl">
                                {t('resumeBuilderLearnMore.whyQuotePre')}{' '}
                                <span className="text-blue-500 dark:text-blue-400">{t('resumeBuilderLearnMore.whyQuoteAccent1')}</span>{' '}
                                {t('resumeBuilderLearnMore.whyQuoteMid')}{' '}
                                <span className="text-blue-500 dark:text-blue-400">{t('resumeBuilderLearnMore.whyQuoteAccent2')}</span>{' '}
                                {t('resumeBuilderLearnMore.whyQuoteEnd')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── THREE PILLARS ── */}
                <section className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-8 shadow-sm">
                    <h2 className="text-2xl font-bold text-blue-900 dark:text-white md:text-3xl">{t('resumeBuilderLearnMore.pillarsTitle')}</h2>
                    <p className="mt-3 text-base leading-7 text-gray-600 dark:text-slate-300">{t('resumeBuilderLearnMore.pillarsSubtitle')}</p>
                    <div className="mt-7 grid gap-5 md:grid-cols-3">
                        {pillars.map((p) => (
                            <div key={p.key} className="rounded-2xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] p-5">
                                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-400/10 text-sm font-black text-blue-900 dark:text-blue-300">
                                    {p.num}
                                </div>
                                <h3 className="mb-2 text-lg font-bold text-blue-900 dark:text-white">{t(`resumeBuilderLearnMore.pillar${p.key}Title`)}</h3>
                                <p className="text-sm leading-6 text-gray-600 dark:text-slate-300">{t(`resumeBuilderLearnMore.pillar${p.key}Text`)}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── HIRING MANAGER + MINDSET ── */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Hiring Manager */}
                    <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-7 shadow-sm">
                        <h2 className="text-xl font-bold text-blue-900 dark:text-white md:text-2xl">{t('resumeBuilderLearnMore.hiringTitle')}</h2>
                        <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-slate-300">{t('resumeBuilderLearnMore.hiringText')}</p>
                        <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-2xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] p-5">
                            <div className="text-center text-2xl font-black text-gray-400 dark:text-slate-500 line-through">{t('resumeBuilderLearnMore.mindsetFrom1')}</div>
                            <div className="text-2xl font-black text-blue-500 dark:text-blue-400">→</div>
                            <div className="text-center text-2xl font-black text-blue-900 dark:text-white">{t('resumeBuilderLearnMore.mindsetTo1')}</div>
                        </div>
                    </div>

                    {/* Mindset Shift */}
                    <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-7 shadow-sm">
                        <h2 className="text-xl font-bold text-blue-900 dark:text-white md:text-2xl">{t('resumeBuilderLearnMore.mindsetTitle')}</h2>
                        <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-slate-300">{t('resumeBuilderLearnMore.mindsetText')}</p>
                        <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-2xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] p-5">
                            <div className="text-center text-xl font-black text-gray-400 dark:text-slate-500 line-through">{t('resumeBuilderLearnMore.mindsetFrom2')}</div>
                            <div className="text-2xl font-black text-blue-500 dark:text-blue-400">→</div>
                            <div className="text-center text-xl font-black text-blue-900 dark:text-white">{t('resumeBuilderLearnMore.mindsetTo2')}</div>
                        </div>
                    </div>
                </div>

                {/* ── CTA ── */}
                <section className="rounded-3xl bg-gradient-to-br from-blue-900 via-blue-800 to-sky-500 dark:from-blue-950 dark:via-blue-900 dark:to-sky-700 p-10 shadow-2xl shadow-blue-900/20">
                    <h2 className="text-3xl font-extrabold text-white md:text-4xl">{t('resumeBuilderLearnMore.ctaTitle')}</h2>
                    <p className="mt-3 max-w-3xl text-base leading-8 text-white/85 md:text-lg">{t('resumeBuilderLearnMore.ctaText')}</p>
                    <div className="mt-7 flex flex-wrap gap-3">
                        <button
                            onClick={() => navigate('/resume-builder')}
                            className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-blue-900 transition hover:bg-blue-50"
                        >
                            {t('resumeBuilderLearnMore.ctaContinue')} <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </section>

                <p className="pb-4 text-center text-xs text-gray-400 dark:text-slate-500">{t('resumeBuilderLearnMore.footerNote')}</p>
            </main>
        </div>
    )
}
