import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Target, Cpu, Search, FileText, Zap, Users, Share2, MousePointer2 } from 'lucide-react'
import { getVideoUrl } from '@/config/videoUrls'

export default function StrategicJobSearchLearnMore() {
    const navigate = useNavigate()
    const { t } = useTranslation()

    return (
        <div className="min-h-screen bg-white dark:bg-[#030711] font-sans text-[#10223e] dark:text-slate-200 transition-colors duration-300">
            {/* Custom Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                :root {
                    --navy: #0b2450;
                    --teal: #39d0d8;
                    --teal-2: #73e6ea;
                }
                .hero-gradient {
                    background: radial-gradient(circle at top right, rgba(57,208,216,0.18), transparent 28%),
                              linear-gradient(180deg, #f8fcfe 0%, #eef8fb 100%);
                }
                .dark .hero-gradient {
                    background: radial-gradient(circle at top right, rgba(57,208,216,0.15), transparent 30%),
                              radial-gradient(circle at bottom left, rgba(20,58,114,0.15), transparent 40%),
                              linear-gradient(180deg, #030711 0%, #0a1329 100%);
                }
                .pdf-card {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .pdf-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 20px 40px rgba(10, 32, 74, 0.08);
                }
                .phoenix-glow {
                    filter: drop-shadow(0 0 20px rgba(57, 208, 216, 0.3));
                }
                .dark .phoenix-glow {
                    filter: drop-shadow(0 0 30px rgba(57, 208, 216, 0.5));
                }
            `}} />

            {/* Topbar */}
            <div className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-slate-950/70 border-b border-[rgba(11,36,80,0.06)] dark:border-white/5">
                <div className="max-w-[1100px] mx-auto flex items-center justify-between px-6 py-4">
                    <div
                        className="flex items-center gap-3 font-bold text-[#0b2450] dark:text-white cursor-pointer group"
                        onClick={() => navigate('/dashboard/job-search-hub')}
                    >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#39d0d8] to-[#143a72] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                            <Target className="w-5 h-5" />
                        </div>
                        <span className="tracking-tight text-lg">NovaWork Global</span>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard/job-search-hub')}
                        className="flex items-center gap-2 text-sm font-semibold text-[#5a6b86] dark:text-slate-400 hover:text-[#0b2450] dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> {t('strategicJobSearchLearnMore.backToSuite')}
                    </button>
                </div>
            </div>

            <div className="hero-gradient">
                {/* Hero Section */}
                <header className="max-w-[1100px] mx-auto pt-24 pb-20 px-6">
                    <div className="text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-5 py-2 border border-[#39d0d8]/30 rounded-full bg-[rgba(57,208,216,0.1)] text-[#1c61cf] dark:text-teal-400 text-xs font-black uppercase tracking-widest mb-8 backdrop-blur-sm shadow-[0_0_15px_rgba(57,208,216,0.1)]">
                            {t('strategicJobSearchLearnMore.heroBadge')}
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-[#0b2450] dark:text-white leading-[1.05] tracking-tight mb-8">
                            {t('strategicJobSearchLearnMore.heroTitle')}
                        </h1>
                        <p className="text-xl md:text-2xl leading-relaxed text-[#5a6b86] dark:text-slate-300 mb-10 max-w-3xl mx-auto">
                            {t('strategicJobSearchLearnMore.heroDescription')}
                        </p>
                        <div className="flex justify-center gap-4">
                            <a href="#framework" className="px-8 py-4 rounded-2xl bg-[#0b2450] text-white font-bold shadow-lg hover:bg-[#143a72] transition-all">
                                {t('strategicJobSearchLearnMore.exploreFramework')}
                            </a>
                        </div>
                    </div>
                </header>

                {/* ── Career Acceleration Phoenix Infographic ── */}
                <section className="max-w-[1240px] mx-auto py-16 px-6 relative overflow-hidden bg-white dark:bg-slate-950 transition-colors">
                    {/* Background glow for the section */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-50/50 dark:bg-blue-900/5 blur-[120px] -z-10" />

                    <div className="text-center mb-12 relative z-10">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-[#0b2450] dark:text-blue-200 mb-2">{t('strategicJobSearchLearnMore.frameworkTitle')}</h2>
                        <p className="text-[#5a6b86] dark:text-slate-400 font-medium">{t('strategicJobSearchLearnMore.frameworkSubtitle')}</p>
                    </div>

                    <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-8 items-center">
                        {/* Phase 1: Preparation */}
                            <div className="space-y-6 order-2 lg:order-1">
                            <div className="flex flex-col items-end text-right">
                                <span className="text-[11px] font-black uppercase tracking-widest text-[#1c61cf] mb-1">{t('strategicJobSearchLearnMore.phase1')}</span>
                                <h3 className="text-xl font-black text-[#0b2450] dark:text-slate-200 mb-4">{t('strategicJobSearchLearnMore.phase1Title')}</h3>
                            </div>

                            <div className="pdf-card bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-white/5 flex gap-4 items-start flex-row-reverse text-right">
                                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
                                    <Cpu className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-[#0b2450] dark:text-white mb-1">{t('strategicJobSearchLearnMore.aiMatchingTitle')}</h4>
                                    <p className="text-sm text-[#5a6b86] dark:text-slate-400">{t('strategicJobSearchLearnMore.aiMatchingDesc')}</p>
                                </div>
                            </div>

                            <div className="pdf-card bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-white/5 flex gap-4 items-start flex-row-reverse text-right">
                                <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 shrink-0">
                                    <Search className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-[#0b2450] dark:text-white mb-1">{t('strategicJobSearchLearnMore.marketResearchTitle')}</h4>
                                    <p className="text-sm text-[#5a6b86] dark:text-slate-400">{t('strategicJobSearchLearnMore.marketResearchDesc')}</p>
                                </div>
                            </div>

                            <div className="pdf-card bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-white/5">
                                <div className="flex gap-4 items-start flex-row-reverse text-right mb-4">
                                    <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 shrink-0">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-[#0b2450] dark:text-white mb-1">{t('strategicJobSearchLearnMore.beatOddsTitle')}</h4>
                                        <p className="text-sm text-[#5a6b86] dark:text-slate-400">{t('strategicJobSearchLearnMore.beatOddsDesc')}</p>
                                    </div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-5 flex flex-col gap-5 border border-slate-100 dark:border-white/5 shadow-inner">
                                        <div className="space-y-1.5">
                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                                            <span className="text-slate-500 dark:text-slate-400">{t('strategicJobSearchLearnMore.regularApps')}</span>
                                            <span className="text-slate-600 dark:text-slate-300">1-5%</span>
                                        </div>
                                        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                                            <div className="bg-blue-400 dark:bg-blue-500 w-[5%] h-full rounded-full" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-[11px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400">
                                            <span>{t('strategicJobSearchLearnMore.strategicSearch')}</span>
                                            <span>25%+</span>
                                        </div>
                                        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-4 overflow-hidden relative shadow-[0_0_15px_rgba(57,208,216,0.15)] ring-1 ring-teal-500/20">
                                            <div className="bg-gradient-to-r from-blue-500 to-teal-400 w-[85%] h-full rounded-full shadow-[inset_2px_2px_4px_rgba(255,255,255,0.2)]" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Central Phoenix */}
                        <div className="order-1 lg:order-2 flex flex-col items-center justify-center py-8 lg:py-0">
                            <div className="relative w-[280px] h-[280px] md:w-[380px] md:h-[380px] flex items-center justify-center">
                                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 to-blue-600/20 rounded-full blur-[100px] animate-pulse" />
                                <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl bg-indigo-950 flex items-center justify-center border-4 border-teal-500/30 phoenix-glow">
                                    <video
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                        className="absolute inset-0 w-full h-full object-cover p-4 rounded-full"
                                    >
                                        <source src={getVideoUrl('novaworkglobal-flying.mp4')} type="video/mp4" />
                                    </video>
                                    <div className="absolute inset-0 bg-indigo-900/20 mix-blend-overlay" />
                                </div>
                                <div className="absolute -bottom-4 bg-[#0b2450] dark:bg-teal-500 text-white dark:text-[#0b2450] px-6 py-2 rounded-full font-black text-sm tracking-widest shadow-xl uppercase z-20">
                                    {t('strategicJobSearchLearnMore.igniteSearch')}
                                </div>
                            </div>
                        </div>

                        {/* Phase 2: Outreach */}
                            <div className="space-y-6 order-3">
                            <div className="flex flex-col items-start">
                                <span className="text-[11px] font-black uppercase tracking-widest text-teal-500 mb-1">{t('strategicJobSearchLearnMore.phase2')}</span>
                                <h3 className="text-xl font-black text-[#0b2450] dark:text-slate-200 mb-4">{t('strategicJobSearchLearnMore.phase2Title')}</h3>
                            </div>

                            <div className="pdf-card bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-white/5 flex gap-4 items-start">
                                <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 shrink-0">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-[#0b2450] dark:text-white mb-1">{t('strategicJobSearchLearnMore.hiddenMarketTitle')}</h4>
                                    <p className="text-sm text-[#5a6b86] dark:text-slate-400">{t('strategicJobSearchLearnMore.hiddenMarketDesc')}</p>
                                </div>
                            </div>

                            <div className="pdf-card bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-white/5 flex gap-4 items-start">
                                <div className="p-2.5 rounded-xl bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 shrink-0">
                                    <Share2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-[#0b2450] dark:text-white mb-1">{t('strategicJobSearchLearnMore.networkingTitle')}</h4>
                                    <p className="text-sm text-[#5a6b86] dark:text-slate-400">{t('strategicJobSearchLearnMore.networkingDesc')}</p>
                                </div>
                            </div>

                            <div className="pdf-card bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-white/5 flex gap-4 items-start">
                                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shrink-0">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-[#0b2450] dark:text-white mb-1">{t('strategicJobSearchLearnMore.digitalFootprintTitle')}</h4>
                                    <p className="text-sm text-[#5a6b86] dark:text-slate-400">{t('strategicJobSearchLearnMore.digitalFootprintDesc')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Reality Check */}
                <section className="max-w-[1100px] mx-auto py-16 px-6 border-t border-[rgba(11,36,80,0.05)]">
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.8fr] gap-12 items-center">
                        <div className="bg-white rounded-[32px] p-10 border border-[rgba(11,36,80,0.06)] shadow-xl">
                            <h2 className="text-3xl font-black text-[#0b2450] mb-4">{t('strategicJobSearchLearnMore.realityTitle')}</h2>
                            <p className="text-[#5a6b86] leading-relaxed mb-8">
                                {t('strategicJobSearchLearnMore.realityDesc')}
                            </p>
                            <div className="space-y-4">
                                {[
                                    t('strategicJobSearchLearnMore.realityPoint1'),
                                    t('strategicJobSearchLearnMore.realityPoint2'),
                                    t('strategicJobSearchLearnMore.realityPoint3'),
                                    t('strategicJobSearchLearnMore.realityPoint4')
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4 items-center p-4 bg-[#f8fcfe] rounded-2xl border border-[#d7e7f0]">
                                        <div className="w-2 h-2 rounded-full bg-[#39d0d8]" />
                                        <span className="font-semibold text-[#0b2450]">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="rounded-3xl overflow-hidden shadow-2xl bg-slate-900 aspect-video relative">
                            <video
                                className="w-full h-full object-cover"
                                src={getVideoUrl('The_Job_Search_&_Application_Suite.mp4')}
                                controls
                                autoPlay
                                muted
                                playsInline
                            />
                        </div>
                    </div>
                </section>

                {/* AI Engine Section */}
                <section className="bg-[rgba(11,36,80,0.02)] py-20 px-6">
                    <div className="max-w-[1100px] mx-auto text-center">
                        <Cpu className="w-12 h-12 text-[#39d0d8] mx-auto mb-6" />
                        <h2 className="text-4xl font-black text-[#0b2450] mb-6">{t('strategicJobSearchLearnMore.aiEngineTitle')}</h2>
                        <p className="text-lg text-[#5a6b86] max-w-2xl mx-auto mb-12">
                            {t('strategicJobSearchLearnMore.aiEngineDesc')}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="bg-white p-8 rounded-3xl border border-[rgba(11,36,80,0.06)] shadow-sm">
                                <div className="text-3xl font-black text-[#0b2450] mb-2">{t('strategicJobSearchLearnMore.scan')}</div>
                                <p className="text-sm text-[#5a6b86]">{t('strategicJobSearchLearnMore.scanDesc')}</p>
                            </div>
                            <div className="bg-[#0b2450] p-8 rounded-3xl text-white shadow-xl">
                                <div className="text-3xl font-black mb-2">{t('strategicJobSearchLearnMore.curate')}</div>
                                <p className="text-sm text-white/80">{t('strategicJobSearchLearnMore.curateDesc')}</p>
                            </div>
                            <div className="bg-white p-8 rounded-3xl border border-[rgba(11,36,80,0.06)] shadow-sm">
                                <div className="text-3xl font-black text-[#0b2450] mb-2">{t('strategicJobSearchLearnMore.execute')}</div>
                                <p className="text-sm text-[#5a6b86]">{t('strategicJobSearchLearnMore.executeDesc')}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* The 5 Steps */}
                <section id="framework" className="max-w-[1100px] mx-auto py-24 px-6">
                    <div className="mb-16 text-center">
                        <h2 className="text-4xl md:text-5xl font-black text-[#0b2450] tracking-tight mb-4">{t('strategicJobSearchLearnMore.completeFrameworkTitle')}</h2>
                        <p className="text-lg text-[#5a6b86]">{t('strategicJobSearchLearnMore.completeFrameworkSubtitle')}</p>
                    </div>

                    <div className="space-y-8">
                        {/* Step 1 */}
                        <div className="pdf-card grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 bg-white rounded-[32px] p-8 border border-[rgba(11,36,80,0.06)] shadow-sm">
                            <div className="bg-gradient-to-br from-[#39d0d8] to-[#1c61cf] rounded-2xl flex flex-col items-center justify-center text-white aspect-square md:aspect-auto">
                                <Search className="w-10 h-10 mb-2" />
                                <span className="text-xs uppercase font-bold tracking-widest opacity-80">Step</span>
                                <span className="text-4xl font-black">01</span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-[#0b2450] mb-4">{t('strategicJobSearchLearnMore.step1Title')}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                                    <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                                        <div className="text-xs font-bold text-red-600 uppercase mb-1">{t('strategicJobSearchLearnMore.myth')}</div>
                                        <p className="text-sm font-medium text-[#0b2450]">{t('strategicJobSearchLearnMore.mythText')}</p>
                                    </div>
                                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                        <div className="text-xs font-bold text-emerald-600 uppercase mb-1">{t('strategicJobSearchLearnMore.reality')}</div>
                                        <p className="text-sm font-medium text-[#0b2450]">{t('strategicJobSearchLearnMore.realityText')}</p>
                                    </div>
                                </div>
                                <ul className="space-y-2 text-[#5a6b86]">
                                    <li className="flex gap-2 items-center text-sm"><div className="w-1.5 h-1.5 rounded-full bg-[#39d0d8]" /> {t('strategicJobSearchLearnMore.step1Bullet1')}</li>
                                    <li className="flex gap-2 items-center text-sm"><div className="w-1.5 h-1.5 rounded-full bg-[#39d0d8]" /> {t('strategicJobSearchLearnMore.step1Bullet2')}</li>
                                    <li className="flex gap-2 items-center text-sm"><div className="w-1.5 h-1.5 rounded-full bg-[#39d0d8]" /> {t('strategicJobSearchLearnMore.step1Bullet3')}</li>
                                </ul>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="pdf-card grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 bg-white rounded-[32px] p-8 border border-[rgba(11,36,80,0.06)] shadow-sm">
                            <div className="bg-[#0b2450] rounded-2xl flex flex-col items-center justify-center text-white aspect-square md:aspect-auto">
                                <FileText className="w-10 h-10 mb-2" />
                                <span className="text-xs uppercase font-bold tracking-widest opacity-80">Step</span>
                                <span className="text-4xl font-black">02</span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-[#0b2450] mb-4">{t('strategicJobSearchLearnMore.step2Title')}</h3>
                                <p className="text-[#5a6b86] mb-6">{t('strategicJobSearchLearnMore.step2Desc')}</p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="p-4 bg-[#f8fcfe] rounded-2xl border border-[#d7e7f0] text-center">
                                        <div className="font-bold text-[#0b2450]">{t('strategicJobSearchLearnMore.atsOptimization')}</div>
                                        <div className="text-xs text-[#5a6b86]">{t('strategicJobSearchLearnMore.atsOptimizationDesc')}</div>
                                    </div>
                                    <div className="p-4 bg-[#f8fcfe] rounded-2xl border border-[#d7e7f0] text-center">
                                        <div className="font-bold text-[#0b2450]">{t('strategicJobSearchLearnMore.strategicSelection')}</div>
                                        <div className="text-xs text-[#5a6b86]">{t('strategicJobSearchLearnMore.strategicSelectionDesc')}</div>
                                    </div>
                                    <div className="p-4 bg-[#f8fcfe] rounded-2xl border border-[#d7e7f0] text-center">
                                        <div className="font-bold text-[#0b2450]">{t('strategicJobSearchLearnMore.professionalFollowup')}</div>
                                        <div className="text-xs text-[#5a6b86]">{t('strategicJobSearchLearnMore.professionalFollowupDesc')}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="pdf-card grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 bg-white rounded-[32px] p-8 border border-[rgba(11,36,80,0.06)] shadow-sm">
                            <div className="bg-[#1c61cf] rounded-2xl flex flex-col items-center justify-center text-white aspect-square md:aspect-auto">
                                <Users className="w-10 h-10 mb-2" />
                                <span className="text-xs uppercase font-bold tracking-widest opacity-80">Step</span>
                                <span className="text-4xl font-black">03</span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-[#0b2450] mb-4">{t('strategicJobSearchLearnMore.step3Title')}</h3>
                                <p className="text-[#5a6b86] mb-6">{t('strategicJobSearchLearnMore.step3Desc')}</p>
                                <div className="p-6 bg-slate-900 rounded-2xl text-white">
                                    <div className="flex gap-4 items-center mb-4">
                                        <Zap className="text-[#39d0d8] w-6 h-6" />
                                        <span className="font-bold">{t('strategicJobSearchLearnMore.unlistedTitle')}</span>
                                    </div>
                                    <p className="text-sm text-white/70">{t('strategicJobSearchLearnMore.unlistedDesc')}</p>
                                </div>
                            </div>
                        </div>

                        {/* Step 4 */}
                        <div className="pdf-card grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 bg-white rounded-[32px] p-8 border border-[rgba(11,36,80,0.06)] shadow-sm">
                            <div className="bg-[#39d0d8] rounded-2xl flex flex-col items-center justify-center text-[#0b2450] aspect-square md:aspect-auto">
                                <Share2 className="w-10 h-10 mb-2" />
                                <span className="text-xs uppercase font-bold tracking-widest opacity-60">Step</span>
                                <span className="text-4xl font-black">04</span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-[#0b2450] mb-4">{t('strategicJobSearchLearnMore.step4Title')}</h3>
                                <p className="text-[#5a6b86] mb-6">{t('strategicJobSearchLearnMore.step4Desc')}</p>
                                <div className="flex flex-wrap gap-3">
                                    <span className="px-4 py-2 bg-blue-50 text-[#1c61cf] font-bold rounded-lg text-sm">{t('strategicJobSearchLearnMore.tag1')}</span>
                                    <span className="px-4 py-2 bg-blue-50 text-[#1c61cf] font-bold rounded-lg text-sm">{t('strategicJobSearchLearnMore.tag2')}</span>
                                    <span className="px-4 py-2 bg-blue-50 text-[#1c61cf] font-bold rounded-lg text-sm">{t('strategicJobSearchLearnMore.tag3')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Step 5 */}
                        <div className="pdf-card grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 bg-white rounded-[32px] p-8 border border-[rgba(11,36,80,0.06)] shadow-sm">
                            <div className="bg-gradient-to-br from-slate-800 to-slate-950 rounded-2xl flex flex-col items-center justify-center text-white aspect-square md:aspect-auto">
                                <MousePointer2 className="w-10 h-10 mb-2" />
                                <span className="text-xs uppercase font-bold tracking-widest opacity-70">Step</span>
                                <span className="text-4xl font-black">05</span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-[#0b2450] mb-4">{t('strategicJobSearchLearnMore.step5Title')}</h3>
                                <p className="text-[#5a6b86] mb-8">{t('strategicJobSearchLearnMore.step5Desc')}</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="flex gap-4 items-start">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#1c61cf] shrink-0">
                                            <Zap className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-[#0b2450]">{t('strategicJobSearchLearnMore.linkedinTitle')}</div>
                                            <p className="text-sm text-[#5a6b86]">{t('strategicJobSearchLearnMore.linkedinDesc')}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 items-start">
                                        <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center text-[#39d0d8] shrink-0">
                                            <Share2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-[#0b2450]">{t('strategicJobSearchLearnMore.thoughtLeadershipTitle')}</div>
                                            <p className="text-sm text-[#5a6b86]">{t('strategicJobSearchLearnMore.thoughtLeadershipDesc')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Closing */}
                <section className="max-w-[800px] mx-auto py-24 px-6 text-center">
                    <div className="bg-gradient-to-br from-[#0b2450] to-[#143a72] rounded-[40px] p-12 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
                        <h2 className="text-4xl font-black mb-6 relative z-10">{t('strategicJobSearchLearnMore.ctaTitle')}</h2>
                        <p className="text-lg text-white/80 mb-10 relative z-10">
                            {t('strategicJobSearchLearnMore.ctaDescription')}
                        </p>
                        <button
                            onClick={() => navigate('/dashboard/job-search-hub')}
                            className="bg-[#39d0d8] text-[#0b2450] px-10 py-4 rounded-2xl font-black text-lg shadow-xl hover:scale-105 transition-transform relative z-10"
                        >
                            {t('strategicJobSearchLearnMore.ctaButton')}
                        </button>
                    </div>
                </section>
            </div>

            <footer className="py-12 border-t border-[rgba(11,36,80,0.05)] text-center text-[#5a6b86] text-sm font-medium">
                &copy; {new Date().getFullYear()} NovaWork Global • {t('strategicJobSearchLearnMore.footerTagline')}
            </footer>
        </div>
    )
}
