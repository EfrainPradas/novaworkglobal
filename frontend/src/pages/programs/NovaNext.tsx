import { useNavigate } from 'react-router-dom'
import { Check, ArrowLeft, Sparkles, Target, Wrench, Rocket, Map, BookOpen, Clock, Shield } from 'lucide-react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { novaNextPlans } from '../../config/landingContent'

export default function NovaNextPage() {
    const navigate = useNavigate()
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual')

    const calculatePrice = (monthly: number, annual: number) => {
        return billingCycle === 'monthly' ? monthly : Math.round(annual / 12)
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Home
                    </button>
                </nav>
            </header>

            {/* Hero Section */}
            <section className="relative py-24 px-4 overflow-hidden bg-white">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-white -z-10" />
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            className="text-left"
                        >
                            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold tracking-wide uppercase">
                                <Sparkles className="w-4 h-4" /> The Targeted Transition
                            </div>
                            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 tracking-tight">
                                NovaNext<span className="text-primary-600">™</span>
                            </h1>
                            <p className="text-2xl text-gray-700 mb-6 font-medium leading-relaxed">
                                Best for professionals pursuing a clear pivot, role upgrade, or lateral move.
                            </p>
                            <p className="text-lg text-gray-500 mb-8 leading-relaxed">
                                Designed for those whose roles were disrupted by AI, automation, or industry decline. Build your resume, clarify your lane, and start moving.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="px-8 py-4 bg-primary-600 text-white rounded-xl font-bold text-lg hover:bg-primary-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                                >
                                    View Pricing
                                </button>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary-200 to-accent-200 rounded-3xl transform rotate-3 scale-105 opacity-50 blur-lg" />
                            <img
                                src="/novaworkglobal/images/novanext_v2.jpg"
                                alt="NovaNext Professional"
                                className="relative rounded-3xl shadow-2xl object-cover w-full aspect-[4/3] border border-gray-100"
                            />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* The Three-Step Success Framework */}
            <section className="py-24 px-4 bg-gray-50 border-y border-gray-200">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                            The Three-Step Success Framework
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            A structured system powered by human coaching and AI tools to help you navigate a technology-reshaped job market.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                step: 1,
                                title: "Diagnose & Decide",
                                desc: "Analyze your current situation to choose a realistic path and target strategy.",
                                icon: Target,
                                color: "text-blue-600",
                                bg: "bg-blue-100"
                            },
                            {
                                step: 2,
                                title: "Build Your Assets",
                                desc: "Create a new career blueprint, value story, and market-ready brand.",
                                icon: Wrench,
                                color: "text-teal-600",
                                bg: "bg-teal-100"
                            },
                            {
                                step: 3,
                                title: "Execute with Momentum",
                                desc: "Combine AI-speed research with human coaching for structured, confident action.",
                                icon: Rocket,
                                color: "text-purple-600",
                                bg: "bg-purple-100"
                            }
                        ].map((item, i) => (
                            <motion.div
                                key={item.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.2 }}
                                className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all border border-gray-100 relative overflow-hidden group"
                            >
                                <div className={`w-16 h-16 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    <item.icon className="w-8 h-8" />
                                </div>
                                <div className="absolute top-8 right-8 text-8xl font-black text-gray-50 opacity-40 group-hover:text-gray-100 transition-colors pointer-events-none">
                                    {item.step}
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">{item.title}</h3>
                                <p className="text-gray-600 leading-relaxed text-lg">
                                    {item.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* What's Included */}
            <section className="py-24 px-4 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                            Everything You Need to Succeed
                        </h2>
                        <p className="text-xl text-gray-600">
                            Comprehensive platform access + expert content.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { title: "12-month access", desc: "Full platform access for an entire year.", icon: Clock },
                            { title: "Video training", desc: "Step-by-step guidance on every phase.", icon: BookOpen },
                            { title: "AI Resume Builder", desc: "Generate targeted resumes from your accomplishments.", icon: Sparkles },
                            { title: "Templates & scripts", desc: "Ready-to-use networking and outreach scripts.", icon: Map },
                            { title: "Positioning basics", desc: "Define your clear role lane and value proposition.", icon: Shield },
                            { title: "Independent execution", desc: "Structure for self-starters who want to move fast.", icon: Rocket }
                        ].map((feature, i) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-start gap-4 p-6 bg-gray-50 rounded-2xl hover:bg-primary-50 transition-colors border border-transparent hover:border-primary-100"
                            >
                                <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 flex-shrink-0 text-primary-600">
                                    <feature.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h4>
                                    <p className="text-gray-600">{feature.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Plans Section */}
            <section id="pricing" className="py-24 px-4 bg-gradient-to-b from-white to-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                            Choose Your NovaNext Plan
                        </h2>
                        <p className="text-xl text-gray-600 mb-8">
                            Select the plan that matches your needs and budget
                        </p>

                        {/* Billing Toggle */}
                        <div className="flex items-center justify-center gap-4 mb-8">
                            <span className={`text-lg font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
                                Monthly
                            </span>
                            <button
                                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
                                className="relative w-14 h-7 bg-gray-300 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                                style={{ backgroundColor: billingCycle === 'annual' ? '#0d9488' : '#d1d5db' }}
                            >
                                <span
                                    className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition-transform"
                                    style={{ transform: billingCycle === 'annual' ? 'translateX(28px)' : 'translateX(0)' }}
                                />
                            </button>
                            <span className={`text-lg font-medium ${billingCycle === 'annual' ? 'text-gray-900' : 'text-gray-500'}`}>
                                Annual
                            </span>
                            {billingCycle === 'annual' && (
                                <span className="ml-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                                    Save 17%
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Plans Grid */}
                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {novaNextPlans.map((plan) => {
                            const isMostPopular = plan.badge === 'Most Popular'
                            const price = calculatePrice(plan.monthly, plan.annual)

                            return (
                                <div
                                    key={plan.name}
                                    className={`relative bg-white rounded-2xl p-8 shadow-xl transition-all hover:shadow-2xl ${isMostPopular ? 'border-2 border-primary-500 transform scale-105' : 'border border-gray-200'
                                        }`}
                                >
                                    {isMostPopular && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
                                            <Sparkles className="w-4 h-4" />
                                            {plan.badge}
                                        </div>
                                    )}

                                    <div className="mb-6">
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.displayName}</h3>
                                        <p className="text-gray-600">{plan.positioning}</p>
                                    </div>

                                    <div className="mb-6">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-bold text-primary-600">${price}</span>
                                            <span className="text-gray-600">/month</span>
                                        </div>
                                        {billingCycle === 'annual' && (
                                            <p className="text-sm text-gray-500 mt-1">Billed ${plan.annual}/year</p>
                                        )}
                                    </div>

                                    <ul className="space-y-3 mb-8">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                <span className="text-gray-700">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="border-t border-gray-200 pt-6 mb-6 space-y-3">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">Email Support</p>
                                            <p className="text-sm text-gray-600">{plan.emailSupport}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">Live Sessions</p>
                                            <p className="text-sm text-gray-600">{plan.liveSessions}</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => navigate(`/signup?program=novanext&plan=${plan.name}`)}
                                        className={`w-full py-4 rounded-xl font-bold transition-all ${isMostPopular
                                            ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg'
                                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                            }`}
                                    >
                                        Get Started
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>


        </div>
    )
}
