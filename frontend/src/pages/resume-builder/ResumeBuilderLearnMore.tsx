import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, Target, UserCircle, TrendingUp, GitBranch, Briefcase, Award } from 'lucide-react'

export default function ResumeBuilderLearnMore() {
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
                .hero-gradient-rb {
                    background: radial-gradient(circle at top right, rgba(57,208,216,0.18), transparent 28%),
                              linear-gradient(180deg, #f8fcfe 0%, #eef8fb 100%);
                }
                .dark .hero-gradient-rb {
                    background: radial-gradient(circle at top right, rgba(57,208,216,0.15), transparent 30%),
                              radial-gradient(circle at bottom left, rgba(20,58,114,0.15), transparent 40%),
                              linear-gradient(180deg, #030711 0%, #0a1329 100%);
                }
                .rb-card {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .rb-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 20px 40px rgba(10, 32, 74, 0.08);
                }
                .phoenix-glow-rb {
                    filter: drop-shadow(0 0 20px rgba(57, 208, 216, 0.3));
                }
                .dark .phoenix-glow-rb {
                    filter: drop-shadow(0 0 30px rgba(57, 208, 216, 0.5));
                }
            `}} />

            {/* Topbar */}
            <div className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-slate-950/70 border-b border-[rgba(11,36,80,0.06)] dark:border-white/5">
                <div className="max-w-[1100px] mx-auto flex items-center justify-between px-6 py-4">
                    <div
                        className="flex items-center gap-3 font-bold text-[#0b2450] dark:text-white cursor-pointer group"
                        onClick={() => navigate('/dashboard/resume-builder')}
                    >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#39d0d8] to-[#143a72] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                            <FileText className="w-5 h-5" />
                        </div>
                        <span className="tracking-tight text-lg">NovaWork Global</span>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard/resume-builder')}
                        className="flex items-center gap-2 text-sm font-semibold text-[#5a6b86] dark:text-slate-400 hover:text-[#0b2450] dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Resume Builder
                    </button>
                </div>
            </div>

            <div className="hero-gradient-rb">
                {/* Hero Section */}
                <header className="max-w-[1100px] mx-auto pt-24 pb-20 px-6">
                    <div className="text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-5 py-2 border border-[#39d0d8]/30 rounded-full bg-[rgba(57,208,216,0.1)] text-[#1c61cf] dark:text-teal-400 text-xs font-black uppercase tracking-widest mb-8 backdrop-blur-sm shadow-[0_0_15px_rgba(57,208,216,0.1)]">
                            The 4-Step Resume Builder
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-[#0b2450] dark:text-white leading-[1.05] tracking-tight mb-8">
                            Ignite your next career chapter.
                        </h1>
                        <p className="text-xl md:text-2xl leading-relaxed text-[#5a6b86] dark:text-slate-300 mb-10 max-w-3xl mx-auto">
                            Stop writing job descriptions. Start telling your accomplishment story. Our 4-step system transforms your career narrative into a powerful, ATS-optimized resume.
                        </p>
                        <div className="flex justify-center gap-4">
                            <a href="#framework" className="px-8 py-4 rounded-2xl bg-[#0b2450] text-white font-bold shadow-lg hover:bg-[#143a72] transition-all">
                                Explore Framework
                            </a>
                        </div>
                    </div>
                </header>

                {/* ── Blueprint Overview ── */}
                <section className="max-w-[1100px] mx-auto pt-16 pb-8 px-6 text-center">
                    <div className="relative group">
                        <div className="absolute -inset-4 bg-teal-500/10 rounded-[60px] blur-2xl group-hover:bg-teal-500/20 transition-all duration-700" />
                        <img
                            src="/images/resume-builder-infographic.png"
                            alt="The 4-Step Resume Builder Blueprint"
                            className="relative w-full h-auto rounded-[40px] shadow-2xl border border-[rgba(11,36,80,0.06)] dark:border-white/5 transform transition-transform duration-700 hover:scale-[1.01]"
                        />
                    </div>
                </section>

                {/* ── Career Phoenix Infographic ── */}
                <section className="max-w-[1240px] mx-auto py-16 px-6 relative overflow-hidden bg-white dark:bg-slate-950 transition-colors">
                    {/* Background glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-50/50 dark:bg-blue-900/5 blur-[120px] -z-10" />

                    <div className="text-center mb-12 relative z-10">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-[#0b2450] dark:text-blue-200 mb-2">The Resume Blueprint</h2>
                        <p className="text-[#5a6b86] dark:text-slate-400 font-medium">Phase 1: Gathering & Refining Your Story • Step 4: Final Strategy</p>
                    </div>

                    <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-8 items-center">
                        {/* Phase 1: Gathering */}
                        <div className="space-y-6 order-2 lg:order-1">
                            <div className="flex flex-col items-end text-right">
                                <span className="text-[11px] font-black uppercase tracking-widest text-[#1c61cf] mb-1">Phase 1</span>
                                <h3 className="text-xl font-black text-[#0b2450] dark:text-slate-200 mb-4">Gathering & Refining Your Story</h3>
                            </div>

                            <div className="rb-card bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-white/5 flex gap-4 items-start flex-row-reverse text-right">
                                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
                                    <Briefcase className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-[#0b2450] dark:text-white mb-1">Step 1: Work Experience Outline</h4>
                                    <p className="text-sm text-[#5a6b86] dark:text-slate-400">Document companies, roles, years, and locations to capture all essential professional information.</p>
                                </div>
                            </div>

                            <div className="rb-card bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-white/5 flex gap-4 items-start flex-row-reverse text-right">
                                <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 shrink-0">
                                    <Target className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-[#0b2450] dark:text-white mb-1">Step 2: The CAR Accomplishment Bank</h4>
                                    <p className="text-sm text-[#5a6b86] dark:text-slate-400">Use the Context/Challenge + Actions + Results (CAR) system to build a repository of achievements.</p>
                                </div>
                            </div>

                            <div className="rb-card bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-white/5 flex gap-4 items-start flex-row-reverse text-right">
                                <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 shrink-0">
                                    <UserCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-[#0b2450] dark:text-white mb-1">Step 3: Professional Profile</h4>
                                    <p className="text-sm text-[#5a6b86] dark:text-slate-400">Create a positioning paragraph that showcases your identity and incorporates essential ATS keywords.</p>
                                </div>
                            </div>
                        </div>

                        {/* Central Phoenix */}
                        <div className="order-1 lg:order-2 flex flex-col items-center justify-center py-8 lg:py-0">
                            <div className="relative w-[280px] h-[280px] md:w-[380px] md:h-[380px] flex items-center justify-center">
                                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 to-blue-600/20 rounded-full blur-[100px] animate-pulse" />
                                <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl bg-indigo-950 flex items-center justify-center border-4 border-teal-500/30 phoenix-glow-rb">
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
                                    Build Your Story
                                </div>
                            </div>
                        </div>

                        {/* Step 4: Final Strategy */}
                        <div className="space-y-6 order-3">
                            <div className="flex flex-col items-start">
                                <span className="text-[11px] font-black uppercase tracking-widest text-teal-500 mb-1">Step 4</span>
                                <h3 className="text-xl font-black text-[#0b2450] dark:text-slate-200 mb-4">Final Strategy & Format Selection</h3>
                            </div>

                            <div className="rb-card bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-white/5">
                                <div className="flex gap-4 items-start mb-4">
                                    <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 shrink-0">
                                        <Award className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-[#0b2450] dark:text-white mb-1">Choosing the Right Resume Format</h4>
                                        <p className="text-sm text-[#5a6b86] dark:text-slate-400">Select the format that best represents your career trajectory and goals.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-5 bg-[#f8fcfe] dark:bg-slate-950/50 rounded-2xl border border-[#d7e7f0] dark:border-white/5 text-center">
                                        <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                                        <div className="font-bold text-[#0b2450] dark:text-white mb-1">Chronological</div>
                                        <div className="text-xs text-[#5a6b86] dark:text-slate-400"><strong>Best For...</strong> Professionals continuing in a similar career path.</div>
                                    </div>
                                    <div className="p-5 bg-[#f8fcfe] dark:bg-slate-950/50 rounded-2xl border border-[#d7e7f0] dark:border-white/5 text-center">
                                        <GitBranch className="w-8 h-8 text-teal-600 dark:text-teal-400 mx-auto mb-3" />
                                        <div className="font-bold text-[#0b2450] dark:text-white mb-1">Functional</div>
                                        <div className="text-xs text-[#5a6b86] dark:text-slate-400"><strong>Best For...</strong> Career changers, versatile roles, project-based work, or international moves.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Video + Key Concepts Section */}
                <section className="max-w-[1100px] mx-auto py-16 px-6 border-t border-[rgba(11,36,80,0.05)]">
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.8fr] gap-12 items-center">
                        <div className="bg-white dark:bg-slate-900/50 rounded-[32px] p-10 border border-[rgba(11,36,80,0.06)] dark:border-white/5 shadow-xl">
                            <h2 className="text-3xl font-black text-[#0b2450] dark:text-white mb-4">The Accomplishment Mindset</h2>
                            <p className="text-[#5a6b86] dark:text-slate-400 leading-relaxed mb-8">
                                Most resumes fail because they read like job descriptions. Our system shifts your mindset from listing duties to showcasing impact.
                            </p>
                            <div className="space-y-4">
                                {[
                                    "Stop listing what you did — show what you achieved.",
                                    "Use the CAR system: Context + Actions + Results.",
                                    "Build a lifetime repository of accomplishments.",
                                    "ATS-optimized keywords built into every section."
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4 items-center p-4 bg-[#f8fcfe] dark:bg-slate-950/50 rounded-2xl border border-[#d7e7f0] dark:border-white/5">
                                        <div className="w-2 h-2 rounded-full bg-[#39d0d8]" />
                                        <span className="font-semibold text-[#0b2450] dark:text-slate-200">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="rounded-3xl overflow-hidden shadow-2xl bg-slate-900 aspect-video relative">
                            <video
                                className="w-full h-full object-cover"
                                src="/videos/The_NovaWork_Blueprint__resume_builder.mp4"
                                controls
                                autoPlay
                                muted
                                playsInline
                            />
                        </div>
                    </div>
                </section>

                {/* The 4 Steps Detail */}
                <section id="framework" className="max-w-[1100px] mx-auto py-24 px-6">
                    <div className="mb-16 text-center">
                        <h2 className="text-4xl md:text-5xl font-black text-[#0b2450] dark:text-white tracking-tight mb-4">The Complete Framework</h2>
                        <p className="text-lg text-[#5a6b86] dark:text-slate-400">Build the right resume, the right way.</p>
                    </div>

                    <div className="space-y-8">
                        {/* Step 1 */}
                        <div className="rb-card grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 bg-white dark:bg-slate-900/50 rounded-[32px] p-8 border border-[rgba(11,36,80,0.06)] dark:border-white/5 shadow-sm">
                            <div className="bg-gradient-to-br from-[#39d0d8] to-[#1c61cf] rounded-2xl flex flex-col items-center justify-center text-white aspect-square md:aspect-auto">
                                <Briefcase className="w-10 h-10 mb-2" />
                                <span className="text-xs uppercase font-bold tracking-widest opacity-80">Step</span>
                                <span className="text-4xl font-black">01</span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-[#0b2450] dark:text-white mb-4">Work Experience Outline</h3>
                                <p className="text-[#5a6b86] dark:text-slate-400 mb-6">Document your career trajectory with precision and completeness.</p>
                                <ul className="space-y-2 text-[#5a6b86] dark:text-slate-400">
                                    <li className="flex gap-2 items-center text-sm"><div className="w-1.5 h-1.5 rounded-full bg-[#39d0d8]" /> List all companies, positions, and durations.</li>
                                    <li className="flex gap-2 items-center text-sm"><div className="w-1.5 h-1.5 rounded-full bg-[#39d0d8]" /> Include locations and reporting structures.</li>
                                    <li className="flex gap-2 items-center text-sm"><div className="w-1.5 h-1.5 rounded-full bg-[#39d0d8]" /> Capture all essential professional information.</li>
                                </ul>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="rb-card grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 bg-white dark:bg-slate-900/50 rounded-[32px] p-8 border border-[rgba(11,36,80,0.06)] dark:border-white/5 shadow-sm">
                            <div className="bg-[#0b2450] rounded-2xl flex flex-col items-center justify-center text-white aspect-square md:aspect-auto">
                                <Target className="w-10 h-10 mb-2" />
                                <span className="text-xs uppercase font-bold tracking-widest opacity-80">Step</span>
                                <span className="text-4xl font-black">02</span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-[#0b2450] dark:text-white mb-4">The CAR Accomplishment Bank</h3>
                                <p className="text-[#5a6b86] dark:text-slate-400 mb-6">Build a lifetime repository of career achievements using the Context/Challenge + Actions + Results system.</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-800/30">
                                        <div className="text-xs font-bold text-red-600 dark:text-red-400 uppercase mb-1">Common Mistake</div>
                                        <p className="text-sm font-medium text-[#0b2450] dark:text-slate-200">"Managed team of 10 developers."</p>
                                    </div>
                                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
                                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-1">CAR Approach</div>
                                        <p className="text-sm font-medium text-[#0b2450] dark:text-slate-200">"Led 10-person team to deliver platform 3 weeks early, saving $200K."</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="rb-card grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 bg-white dark:bg-slate-900/50 rounded-[32px] p-8 border border-[rgba(11,36,80,0.06)] dark:border-white/5 shadow-sm">
                            <div className="bg-[#1c61cf] rounded-2xl flex flex-col items-center justify-center text-white aspect-square md:aspect-auto">
                                <UserCircle className="w-10 h-10 mb-2" />
                                <span className="text-xs uppercase font-bold tracking-widest opacity-80">Step</span>
                                <span className="text-4xl font-black">03</span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-[#0b2450] dark:text-white mb-4">Professional Profile</h3>
                                <p className="text-[#5a6b86] dark:text-slate-400 mb-6">Create a positioning paragraph that showcases your identity and incorporates essential ATS keywords.</p>
                                <div className="p-6 bg-slate-900 dark:bg-slate-950 rounded-2xl text-white">
                                    <div className="flex gap-4 items-center mb-4">
                                        <FileText className="text-[#39d0d8] w-6 h-6" />
                                        <span className="font-bold">Your Professional Identity in One Powerful Paragraph</span>
                                    </div>
                                    <p className="text-sm text-white/70">Write it yourself, follow our video instructions, or use our AI-powered questionnaire for guided generation. The result: a compelling profile that makes hiring managers stop and read.</p>
                                </div>
                            </div>
                        </div>

                        {/* Step 4 */}
                        <div className="rb-card grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 bg-white dark:bg-slate-900/50 rounded-[32px] p-8 border border-[rgba(11,36,80,0.06)] dark:border-white/5 shadow-sm">
                            <div className="bg-[#39d0d8] rounded-2xl flex flex-col items-center justify-center text-[#0b2450] aspect-square md:aspect-auto">
                                <Award className="w-10 h-10 mb-2" />
                                <span className="text-xs uppercase font-bold tracking-widest opacity-60">Step</span>
                                <span className="text-4xl font-black">04</span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-[#0b2450] dark:text-white mb-4">Final Strategy & Format Selection</h3>
                                <p className="text-[#5a6b86] dark:text-slate-400 mb-6">Choose between a chronological or functional resume — or create both for a complete job search arsenal.</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="flex gap-4 items-start">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-[#1c61cf] dark:text-blue-400 shrink-0">
                                            <TrendingUp className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-[#0b2450] dark:text-white">Chronological</div>
                                            <p className="text-sm text-[#5a6b86] dark:text-slate-400">Best for professionals continuing in a similar career path.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 items-start">
                                        <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center text-[#39d0d8] shrink-0">
                                            <GitBranch className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-[#0b2450] dark:text-white">Functional</div>
                                            <p className="text-sm text-[#5a6b86] dark:text-slate-400">Best for career changers, versatile roles, project-based work, or international moves.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Closing CTA */}
                <section className="max-w-[800px] mx-auto py-24 px-6 text-center">
                    <div className="bg-gradient-to-br from-[#0b2450] to-[#143a72] rounded-[40px] p-12 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
                        <h2 className="text-4xl font-black mb-6 relative z-10">Ignite your next career chapter.</h2>
                        <p className="text-lg text-white/80 mb-10 relative z-10">
                            Build a resume that tells your accomplishment story, not your job description.
                        </p>
                        <button
                            onClick={() => navigate('/dashboard/resume-builder')}
                            className="bg-[#39d0d8] text-[#0b2450] px-10 py-4 rounded-2xl font-black text-lg shadow-xl hover:scale-105 transition-transform relative z-10"
                        >
                            Start Building Now
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
