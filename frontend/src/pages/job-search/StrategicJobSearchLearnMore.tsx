import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Target, Cpu, Search, FileText, Zap, Users, Share2, MousePointer2 } from 'lucide-react'

export default function StrategicJobSearchLearnMore() {
    const navigate = useNavigate()

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
                        onClick={() => navigate('/job-search-hub')}
                    >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#39d0d8] to-[#143a72] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                            <Target className="w-5 h-5" />
                        </div>
                        <span className="tracking-tight text-lg">NovaWork Global</span>
                    </div>
                    <button
                        onClick={() => navigate('/job-search-hub')}
                        className="flex items-center gap-2 text-sm font-semibold text-[#5a6b86] dark:text-slate-400 hover:text-[#0b2450] dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Suite
                    </button>
                </div>
            </div>

            <div className="hero-gradient">
                {/* Hero Section */}
                <header className="max-w-[1100px] mx-auto pt-24 pb-20 px-6">
                    <div className="text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-5 py-2 border border-[#39d0d8]/30 rounded-full bg-[rgba(57,208,216,0.1)] text-[#1c61cf] dark:text-teal-400 text-xs font-black uppercase tracking-widest mb-8 backdrop-blur-sm shadow-[0_0_15px_rgba(57,208,216,0.1)]">
                            The Strategic Search Suite
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-[#0b2450] dark:text-white leading-[1.05] tracking-tight mb-8">
                            Ignite your next career chapter.
                        </h1>
                        <p className="text-xl md:text-2xl leading-relaxed text-[#5a6b86] dark:text-slate-300 mb-10 max-w-3xl mx-auto">
                            A strategic job search always outperforms a desperate one. Stop "spraying and praying" and join the top 1% of candidates using a battle-tested framework.
                        </p>
                        <div className="flex justify-center gap-4">
                            <a href="#framework" className="px-8 py-4 rounded-2xl bg-[#0b2450] text-white font-bold shadow-lg hover:bg-[#143a72] transition-all">
                                Explore Framework
                            </a>
                        </div>
                    </div>
                </header>

                {/* ── Career Acceleration Phoenix Infographic ── */}
                <section className="max-w-[1240px] mx-auto py-16 px-6 relative overflow-hidden bg-white dark:bg-slate-950 transition-colors">
                    {/* Background glow for the section */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-50/50 dark:bg-blue-900/5 blur-[120px] -z-10" />

                    <div className="text-center mb-12 relative z-10">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-[#0b2450] dark:text-blue-200 mb-2">The Strategic Job Search Framework</h2>
                        <p className="text-[#5a6b86] dark:text-slate-400 font-medium">Phase 1: Preparation & Phase 2: Outreach</p>
                    </div>

                    <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-8 items-center">
                        {/* Phase 1: Preparation */}
                        <div className="space-y-6 order-2 lg:order-1">
                            <div className="flex flex-col items-end text-right">
                                <span className="text-[11px] font-black uppercase tracking-widest text-[#1c61cf] mb-1">Phase 1</span>
                                <h3 className="text-xl font-black text-[#0b2450] dark:text-slate-200 mb-4">Preparation & Direct Strategy</h3>
                            </div>

                            <div className="pdf-card bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-white/5 flex gap-4 items-start flex-row-reverse text-right">
                                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
                                    <Cpu className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-[#0b2450] dark:text-white mb-1">AI-Powered Job Matching</h4>
                                    <p className="text-sm text-[#5a6b86] dark:text-slate-400">Upload your resume to let AI scan the market and rank roles by profile relevance.</p>
                                </div>
                            </div>

                            <div className="pdf-card bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-white/5 flex gap-4 items-start flex-row-reverse text-right">
                                <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 shrink-0">
                                    <Search className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-[#0b2450] dark:text-white mb-1">Market Research is Non-Negotiable</h4>
                                    <p className="text-sm text-[#5a6b86] dark:text-slate-400">Understand industry trends and growth sectors before investing energy into applications.</p>
                                </div>
                            </div>

                            <div className="pdf-card bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-white/5">
                                <div className="flex gap-4 items-start flex-row-reverse text-right mb-4">
                                    <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 shrink-0">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-[#0b2450] dark:text-white mb-1">Beat the 5% Application Odds</h4>
                                        <p className="text-sm text-[#5a6b86] dark:text-slate-400">Optimize resumes for ATS to improve the standard 1-5% response rate.</p>
                                    </div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-5 flex flex-col gap-5 border border-slate-100 dark:border-white/5 shadow-inner">
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                                            <span className="text-slate-500 dark:text-slate-400">Regular Applications</span>
                                            <span className="text-slate-600 dark:text-slate-300">1-5%</span>
                                        </div>
                                        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                                            <div className="bg-blue-400 dark:bg-blue-500 w-[5%] h-full rounded-full" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-[11px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400">
                                            <span>Strategic Search</span>
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
                                        <source src="/videos/novaworkglobal-flying.mp4" type="video/mp4" />
                                    </video>
                                    <div className="absolute inset-0 bg-indigo-900/20 mix-blend-overlay" />
                                </div>
                                <div className="absolute -bottom-4 bg-[#0b2450] dark:bg-teal-500 text-white dark:text-[#0b2450] px-6 py-2 rounded-full font-black text-sm tracking-widest shadow-xl uppercase z-20">
                                    Ignite Your Search
                                </div>
                            </div>
                        </div>

                        {/* Phase 2: Outreach */}
                        <div className="space-y-6 order-3">
                            <div className="flex flex-col items-start">
                                <span className="text-[11px] font-black uppercase tracking-widest text-teal-500 mb-1">Phase 2</span>
                                <h3 className="text-xl font-black text-[#0b2450] dark:text-slate-200 mb-4">Outreach & Digital Presence</h3>
                            </div>

                            <div className="pdf-card bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-white/5 flex gap-4 items-start">
                                <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 shrink-0">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-[#0b2450] dark:text-white mb-1">The Hidden Job Market</h4>
                                    <p className="text-sm text-[#5a6b86] dark:text-slate-400">Partner with recruiters who fill roles before they are ever publicly advertised.</p>
                                </div>
                            </div>

                            <div className="pdf-card bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-white/5 flex gap-4 items-start">
                                <div className="p-2.5 rounded-xl bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 shrink-0">
                                    <Share2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-[#0b2450] dark:text-white mb-1">Networking is the Most Powerful Tool</h4>
                                    <p className="text-sm text-[#5a6b86] dark:text-slate-400">Focus on building genuine, mutually beneficial professional relationships rather than transactional favors.</p>
                                </div>
                            </div>

                            <div className="pdf-card bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-white/5 flex gap-4 items-start">
                                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shrink-0">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-[#0b2450] dark:text-white mb-1">Build a Compelling Digital Footprint</h4>
                                    <p className="text-sm text-[#5a6b86] dark:text-slate-400">Optimize LinkedIn and personal portfolios to be found by recruiters before you even apply.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Reality Check */}
                <section className="max-w-[1100px] mx-auto py-16 px-6 border-t border-[rgba(11,36,80,0.05)]">
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.8fr] gap-12 items-center">
                        <div className="bg-white rounded-[32px] p-10 border border-[rgba(11,36,80,0.06)] shadow-xl">
                            <h2 className="text-3xl font-black text-[#0b2450] mb-4">The 1-5% Reality</h2>
                            <p className="text-[#5a6b86] leading-relaxed mb-8">
                                Most professionals rely entirely on online applications, facing high competition across global boards and ATS filters.
                            </p>
                            <div className="space-y-4">
                                {[
                                    "1% to 5% success rate for blind applications.",
                                    "ATS systems filter resumes before human review.",
                                    "Near impossibility of standing out in a crowded pile.",
                                    "Hope is not a plan."
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
                                src="/videos/The_Job_Search_&_Application_Suite.mp4"
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
                        <h2 className="text-4xl font-black text-[#0b2450] mb-6">Let technology do the heavy lifting.</h2>
                        <p className="text-lg text-[#5a6b86] max-w-2xl mx-auto mb-12">
                            Our AI Engine acts as your tireless research assistant, scanning the market and surfacing high-alignment opportunities while you focus on preparation.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="bg-white p-8 rounded-3xl border border-[rgba(11,36,80,0.06)] shadow-sm">
                                <div className="text-3xl font-black text-[#0b2450] mb-2">Scan</div>
                                <p className="text-sm text-[#5a6b86]">AI analyzes your skills, experience, and background instantly.</p>
                            </div>
                            <div className="bg-[#0b2450] p-8 rounded-3xl text-white shadow-xl">
                                <div className="text-3xl font-black mb-2">Curate</div>
                                <p className="text-sm text-white/80">Surfaces hidden roles and ranks them by true profile relevance.</p>
                            </div>
                            <div className="bg-white p-8 rounded-3xl border border-[rgba(11,36,80,0.06)] shadow-sm">
                                <div className="text-3xl font-black text-[#0b2450] mb-2">Execute</div>
                                <p className="text-sm text-[#5a6b86]">Spend less time searching and more time winning offers.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* The 5 Steps */}
                <section id="framework" className="max-w-[1100px] mx-auto py-24 px-6">
                    <div className="mb-16 text-center">
                        <h2 className="text-4xl md:text-5xl font-black text-[#0b2450] tracking-tight mb-4">A Complete Framework</h2>
                        <p className="text-lg text-[#5a6b86]">Do the right things, in the right order.</p>
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
                                <h3 className="text-2xl font-black text-[#0b2450] mb-4">Rigorous Market Research</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                                    <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                                        <div className="text-xs font-bold text-red-600 uppercase mb-1">Myth</div>
                                        <p className="text-sm font-medium text-[#0b2450]">"I'll know the right job when I see it."</p>
                                    </div>
                                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                        <div className="text-xs font-bold text-emerald-600 uppercase mb-1">Reality</div>
                                        <p className="text-sm font-medium text-[#0b2450]">Determine what you're looking for before applying.</p>
                                    </div>
                                </div>
                                <ul className="space-y-2 text-[#5a6b86]">
                                    <li className="flex gap-2 items-center text-sm"><div className="w-1.5 h-1.5 rounded-full bg-[#39d0d8]" /> Analyze career tracks and industry trends.</li>
                                    <li className="flex gap-2 items-center text-sm"><div className="w-1.5 h-1.5 rounded-full bg-[#39d0d8]" /> Identify growing vs. contracting sectors.</li>
                                    <li className="flex gap-2 items-center text-sm"><div className="w-1.5 h-1.5 rounded-full bg-[#39d0d8]" /> Map roles that align with skills and ambitions.</li>
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
                                <h3 className="text-2xl font-black text-[#0b2450] mb-4">Optimized Online Applications</h3>
                                <p className="text-[#5a6b86] mb-6">Online applications are a meaningful part of your strategy—not the entirety of it.</p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="p-4 bg-[#f8fcfe] rounded-2xl border border-[#d7e7f0] text-center">
                                        <div className="font-bold text-[#0b2450]">ATS Optimization</div>
                                        <div className="text-xs text-[#5a6b86]">Pass the digital filters.</div>
                                    </div>
                                    <div className="p-4 bg-[#f8fcfe] rounded-2xl border border-[#d7e7f0] text-center">
                                        <div className="font-bold text-[#0b2450]">Strategic Selection</div>
                                        <div className="text-xs text-[#5a6b86]">Apply to real requirements.</div>
                                    </div>
                                    <div className="p-4 bg-[#f8fcfe] rounded-2xl border border-[#d7e7f0] text-center">
                                        <div className="font-bold text-[#0b2450]">Professional Follow-up</div>
                                        <div className="text-xs text-[#5a6b86]">Beyond the initial click.</div>
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
                                <h3 className="text-2xl font-black text-[#0b2450] mb-4">The Hidden Hiring Pipeline</h3>
                                <p className="text-[#5a6b86] mb-6">Unlock jobs that are never posted publicly by engaging with executive recruiters and agency specialists.</p>
                                <div className="p-6 bg-slate-900 rounded-2xl text-white">
                                    <div className="flex gap-4 items-center mb-4">
                                        <Zap className="text-[#39d0d8] w-6 h-6" />
                                        <span className="font-bold">Access 'Unlisted' Market Opportunities</span>
                                    </div>
                                    <p className="text-sm text-white/70">Differentiate between agency recruiters and internal HR to communicate value efficiently and get on their radar.</p>
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
                                <h3 className="text-2xl font-black text-[#0b2450] mb-4">Authentic Networking</h3>
                                <p className="text-[#5a6b86] mb-6">Build relationships over time. Networking is not about asking for favors—it's about informational connection and peer positioning.</p>
                                <div className="flex flex-wrap gap-3">
                                    <span className="px-4 py-2 bg-blue-50 text-[#1c61cf] font-bold rounded-lg text-sm">Informational Interviews</span>
                                    <span className="px-4 py-2 bg-blue-50 text-[#1c61cf] font-bold rounded-lg text-sm">Mutually Beneficial Connections</span>
                                    <span className="px-4 py-2 bg-blue-50 text-[#1c61cf] font-bold rounded-lg text-sm">Referral Generation</span>
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
                                <h3 className="text-2xl font-black text-[#0b2450] mb-4">Compelling Online Presence</h3>
                                <p className="text-[#5a6b86] mb-8">Recruiters research you online before they pick up the phone. Be found, be findable, and be compelling.</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="flex gap-4 items-start">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#1c61cf] shrink-0">
                                            <Zap className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-[#0b2450]">LinkedIn Optimization</div>
                                            <p className="text-sm text-[#5a6b86]">Surfaces your profile in recruiter searches 24/7.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 items-start">
                                        <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center text-[#39d0d8] shrink-0">
                                            <Share2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-[#0b2450]">Thought Leadership</div>
                                            <p className="text-sm text-[#5a6b86]">Personal portfolio and constant professional footprint.</p>
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
                        <h2 className="text-4xl font-black mb-6 relative z-10">Do the right things, in the right order.</h2>
                        <p className="text-lg text-white/80 mb-10 relative z-10">
                            Find the right job faster, smarter, and with total confidence.
                        </p>
                        <button
                            onClick={() => navigate('/job-search-hub')}
                            className="bg-[#39d0d8] text-[#0b2450] px-10 py-4 rounded-2xl font-black text-lg shadow-xl hover:scale-105 transition-transform relative z-10"
                        >
                            Start Your Journey
                        </button>
                    </div>
                </section>
            </div>

            <footer className="py-12 border-t border-[rgba(11,36,80,0.05)] text-center text-[#5a6b86] text-sm font-medium">
                &copy; {new Date().getFullYear()} NovaWork Global • Professional Career Acceleration
            </footer>
        </div>
    )
}
