import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Trophy, Upload, FileText, Sparkles, LayoutGrid, Repeat2 } from 'lucide-react'

export default function AccomplishmentBankLearnMore() {
    const navigate = useNavigate()
    const { t } = useTranslation()

    const valueCards = [
        { key: 'capture', icon: <Trophy className="w-6 h-6 text-cyan-500 dark:text-cyan-400" /> },
        { key: 'organize', icon: <LayoutGrid className="w-6 h-6 text-cyan-500 dark:text-cyan-400" /> },
        { key: 'leverage', icon: <Repeat2 className="w-6 h-6 text-cyan-500 dark:text-cyan-400" /> },
    ]

    const aiOutputs = [
        t('accomplishmentBankLearnMore.aiOutput1'),
        t('accomplishmentBankLearnMore.aiOutput2'),
        t('accomplishmentBankLearnMore.aiOutput3'),
    ]

    const carSteps = [
        { step: 'C', key: 'context' },
        { step: 'A', key: 'action' },
        { step: 'R', key: 'result' },
    ]

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white transition-colors duration-200">
            {/* Top gradient — only visible in dark mode */}
            <div className="absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-cyan-500/10 via-sky-500/5 to-transparent pointer-events-none" />

            <main className="relative mx-auto max-w-7xl px-6 py-10 md:px-10 lg:px-12">

                {/* Back button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium mb-10"
                >
                    <ArrowLeft className="w-4 h-4" /> {t('common.back')}
                </button>

                {/* === HERO === */}
                <section className="overflow-hidden rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 backdrop-blur-sm shadow-sm">
                    <div className="grid gap-10 px-8 py-12 md:grid-cols-2 md:px-12 md:py-16">
                        <div className="flex flex-col justify-center">
                            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium tracking-wide text-cyan-600 dark:text-cyan-300">
                                <Trophy className="w-3.5 h-3.5" /> {t('accomplishmentBankLearnMore.heroBadge')}
                            </div>
                            <h1 className="max-w-xl text-4xl font-bold leading-tight md:text-5xl">
                                {t('accomplishmentBankLearnMore.heroTitle')}
                            </h1>
                            <p className="mt-5 max-w-xl text-base leading-7 text-gray-600 dark:text-slate-300 md:text-lg">
                                {t('accomplishmentBankLearnMore.heroDescription')}
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <button
                                    onClick={() => navigate('/resume/accomplishments-hub?mode=standalone&tab=bank')}
                                    className="rounded-xl bg-cyan-500 dark:bg-cyan-400 px-5 py-3 text-sm font-semibold text-white dark:text-slate-950 transition hover:bg-cyan-600 dark:hover:bg-cyan-300"
                                >
                                    {t('accomplishmentBankLearnMore.ctaBuildBank')}
                                </button>
                                <button
                                    onClick={() => navigate('/resume/accomplishments-hub?mode=standalone&tab=cars')}
                                    className="rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-white/5 px-5 py-3 text-sm font-semibold text-gray-700 dark:text-white transition hover:bg-gray-100 dark:hover:bg-white/10"
                                >
                                    {t('accomplishmentBankLearnMore.ctaStartCAR')}
                                </button>
                            </div>
                        </div>

                        {/* Right visual card */}
                        <div className="flex items-center">
                            <div className="w-full rounded-3xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-slate-900/80 p-5 shadow-xl">
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200">{t('accomplishmentBankLearnMore.snapshotTitle')}</h3>
                                    <span className="rounded-full bg-emerald-100 dark:bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                                        <Sparkles className="w-3 h-3" /> AI Ready
                                    </span>
                                </div>
                                <div className="space-y-4">
                                    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-4">
                                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-slate-400">{t('accomplishmentBankLearnMore.snapshotOriginal')}</p>
                                        <p className="mt-2 text-sm leading-6 text-gray-700 dark:text-slate-200">{t('accomplishmentBankLearnMore.snapshotOriginalText')}</p>
                                    </div>
                                    <div className="rounded-2xl border border-cyan-400/20 bg-cyan-50 dark:bg-cyan-400/5 p-4">
                                        <p className="text-xs uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">{t('accomplishmentBankLearnMore.snapshotAILabel')}</p>
                                        <ul className="mt-3 space-y-3 text-sm leading-6 text-gray-700 dark:text-slate-200">
                                            {aiOutputs.map((o, i) => (
                                                <li key={i} className="rounded-xl bg-gray-100 dark:bg-white/[0.03] p-3">{o}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* === WHAT IT IS === */}
                <section className="mt-16 grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-600 dark:text-cyan-300">{t('accomplishmentBankLearnMore.whatItIsLabel')}</p>
                        <h2 className="mt-3 text-3xl font-bold md:text-4xl">{t('accomplishmentBankLearnMore.whatItIsTitle')}</h2>
                        <p className="mt-5 max-w-3xl text-base leading-8 text-gray-600 dark:text-slate-300">{t('accomplishmentBankLearnMore.whatItIsText')}</p>
                    </div>
                    <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-6 shadow-sm">
                        <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">{t('accomplishmentBankLearnMore.whyUsersLoveTitle')}</p>
                        <div className="mt-5 space-y-4">
                            {(['whyLove1', 'whyLove2', 'whyLove3'] as const).map((key) => (
                                <div key={key} className="flex items-start gap-3 rounded-2xl bg-gray-50 dark:bg-slate-900/70 p-4">
                                    <span className="mt-0.5 text-cyan-600 dark:text-cyan-300 font-bold">✓</span>
                                    <p className="text-sm leading-6 text-gray-600 dark:text-slate-300">{t(`accomplishmentBankLearnMore.${key}`)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* === VALUE CARDS === */}
                <section className="mt-16">
                    <div className="mb-8">
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-600 dark:text-cyan-300">{t('accomplishmentBankLearnMore.whyItMattersLabel')}</p>
                        <h2 className="mt-3 text-3xl font-bold md:text-4xl">{t('accomplishmentBankLearnMore.whyItMattersTitle')}</h2>
                    </div>
                    <div className="grid gap-6 md:grid-cols-3">
                        {valueCards.map((card) => (
                            <div key={card.key} className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-6 transition hover:border-cyan-400/40 hover:shadow-md shadow-sm">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 dark:bg-cyan-400/10">
                                    {card.icon}
                                </div>
                                <h3 className="text-xl font-semibold">{t(`accomplishmentBankLearnMore.${card.key}Title`)}</h3>
                                <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-slate-300">{t(`accomplishmentBankLearnMore.${card.key}Text`)}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* === TWO WAYS TO START === */}
                <section className="mt-16">
                    <div className="mb-8">
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-600 dark:text-cyan-300">{t('accomplishmentBankLearnMore.twoWaysLabel')}</p>
                        <h2 className="mt-3 text-3xl font-bold md:text-4xl">{t('accomplishmentBankLearnMore.twoWaysTitle')}</h2>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Upload path */}
                        <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gradient-to-br dark:from-white/[0.05] dark:to-white/[0.02] p-7 shadow-sm">
                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 dark:bg-cyan-400/10">
                                <Upload className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                            </div>
                            <p className="text-sm font-medium text-cyan-600 dark:text-cyan-300">{t('accomplishmentBankLearnMore.fastTrackLabel')}</p>
                            <h3 className="mt-2 text-2xl font-semibold">{t('accomplishmentBankLearnMore.uploadTitle')}</h3>
                            <p className="mt-4 text-sm leading-7 text-gray-600 dark:text-slate-300">{t('accomplishmentBankLearnMore.uploadText')}</p>
                            <button
                                onClick={() => navigate('/resume/accomplishments-hub?mode=standalone&tab=bank')}
                                className="mt-6 rounded-xl border border-gray-300 dark:border-white/15 bg-gray-50 dark:bg-white/5 px-4 py-3 text-sm font-semibold transition hover:bg-gray-100 dark:hover:bg-white/10"
                            >
                                {t('accomplishmentBankLearnMore.uploadBtn')}
                            </button>
                        </div>
                        {/* CAR path */}
                        <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gradient-to-br dark:from-white/[0.05] dark:to-white/[0.02] p-7 shadow-sm">
                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 dark:bg-cyan-400/10">
                                <FileText className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                            </div>
                            <p className="text-sm font-medium text-cyan-600 dark:text-cyan-300">{t('accomplishmentBankLearnMore.guidedLabel')}</p>
                            <h3 className="mt-2 text-2xl font-semibold">{t('accomplishmentBankLearnMore.carTitle')}</h3>
                            <p className="mt-4 text-sm leading-7 text-gray-600 dark:text-slate-300">{t('accomplishmentBankLearnMore.carText')}</p>
                            <button
                                onClick={() => navigate('/resume/accomplishments-hub?mode=standalone&tab=cars')}
                                className="mt-6 rounded-xl border border-gray-300 dark:border-white/15 bg-gray-50 dark:bg-white/5 px-4 py-3 text-sm font-semibold transition hover:bg-gray-100 dark:hover:bg-white/10"
                            >
                                {t('accomplishmentBankLearnMore.carBtn')}
                            </button>
                        </div>
                    </div>
                </section>

                {/* === CAR FRAMEWORK === */}
                <section className="mt-16 grid gap-8 md:grid-cols-[0.95fr_1.05fr]">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-600 dark:text-cyan-300">{t('accomplishmentBankLearnMore.carFrameworkLabel')}</p>
                        <h2 className="mt-3 text-3xl font-bold md:text-4xl">{t('accomplishmentBankLearnMore.carFrameworkTitle')}</h2>
                        <p className="mt-5 text-base leading-8 text-gray-600 dark:text-slate-300">{t('accomplishmentBankLearnMore.carFrameworkText')}</p>
                    </div>
                    <div className="grid gap-4">
                        {carSteps.map((item) => (
                            <div key={item.key} className="flex gap-4 rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-5 shadow-sm">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 dark:bg-cyan-400/10 text-lg font-bold text-cyan-600 dark:text-cyan-300">
                                    {item.step}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">{t(`accomplishmentBankLearnMore.car${item.step}Title`)}</h3>
                                    <p className="mt-2 text-sm leading-7 text-gray-600 dark:text-slate-300">{t(`accomplishmentBankLearnMore.car${item.step}Text`)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* === AI MULTIPLIER === */}
                <section className="mt-16 rounded-3xl border border-cyan-400/20 bg-cyan-50 dark:bg-cyan-400/[0.04] p-8">
                    <div className="max-w-3xl">
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-600 dark:text-cyan-300 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" /> {t('accomplishmentBankLearnMore.aiMultiplierLabel')}
                        </p>
                        <h2 className="mt-3 text-3xl font-bold md:text-4xl">{t('accomplishmentBankLearnMore.aiMultiplierTitle')}</h2>
                        <p className="mt-5 text-base leading-8 text-gray-600 dark:text-slate-300">{t('accomplishmentBankLearnMore.aiMultiplierText')}</p>
                    </div>
                    <div className="mt-8 grid gap-6 md:grid-cols-2">
                        <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-950/60 p-6 shadow-sm">
                            <p className="text-xs uppercase tracking-[0.25em] text-gray-500 dark:text-slate-400">{t('accomplishmentBankLearnMore.aiInput')}</p>
                            <p className="mt-4 text-sm leading-7 text-gray-700 dark:text-slate-200">{t('accomplishmentBankLearnMore.aiInputText')}</p>
                        </div>
                        <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-950/60 p-6 shadow-sm">
                            <p className="text-xs uppercase tracking-[0.25em] text-gray-500 dark:text-slate-400">{t('accomplishmentBankLearnMore.aiOutputLabel')}</p>
                            <div className="mt-4 space-y-3">
                                {aiOutputs.map((item, i) => (
                                    <div key={i} className="rounded-2xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] p-4 text-sm leading-7 text-gray-700 dark:text-slate-200">{item}</div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* === STRATEGIC ADAPTABILITY === */}
                <section className="mt-16">
                    <div className="mb-8">
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-600 dark:text-cyan-300">{t('accomplishmentBankLearnMore.adaptLabel')}</p>
                        <h2 className="mt-3 text-3xl font-bold md:text-4xl">{t('accomplishmentBankLearnMore.adaptTitle')}</h2>
                    </div>
                    <div className="grid gap-6 md:grid-cols-3">
                        {(['leadership', 'analytical', 'communication'] as const).map((key) => (
                            <div key={key} className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-6 shadow-sm">
                                <h3 className="text-xl font-semibold">{t(`accomplishmentBankLearnMore.${key}Title`)}</h3>
                                <p className="mt-3 text-sm leading-7 text-gray-600 dark:text-slate-300">{t(`accomplishmentBankLearnMore.${key}Text`)}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* === CTA === */}
                <section className="mt-16 mb-8 rounded-3xl border border-gray-200 dark:border-white/10 bg-gradient-to-r from-gray-50 dark:from-slate-900 via-white dark:via-slate-900 to-cyan-50 dark:to-cyan-950/40 p-8 md:p-10 shadow-sm">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div className="max-w-2xl">
                            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-600 dark:text-cyan-300">{t('accomplishmentBankLearnMore.ctaLabel')}</p>
                            <h2 className="mt-3 text-3xl font-bold">{t('accomplishmentBankLearnMore.ctaTitle')}</h2>
                            <p className="mt-4 text-base leading-8 text-gray-600 dark:text-slate-300">{t('accomplishmentBankLearnMore.ctaText')}</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => navigate('/resume/accomplishments-hub?mode=standalone&tab=bank')}
                                className="rounded-xl bg-cyan-500 dark:bg-cyan-400 px-5 py-3 text-sm font-semibold text-white dark:text-slate-950 transition hover:bg-cyan-600 dark:hover:bg-cyan-300"
                            >
                                {t('accomplishmentBankLearnMore.ctaBuildBank')}
                            </button>
                            <button
                                onClick={() => navigate('/resume/accomplishments-hub?mode=standalone&tab=cars')}
                                className="rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-white/5 px-5 py-3 text-sm font-semibold text-gray-700 dark:text-white transition hover:bg-gray-100 dark:hover:bg-white/10"
                            >
                                {t('accomplishmentBankLearnMore.ctaStartCAR')}
                            </button>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    )
}
