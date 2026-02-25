import { useNavigate } from 'react-router-dom'
import { Check, ArrowLeft, Sparkles } from 'lucide-react'
import { useState } from 'react'
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
            <section className="py-20 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <div className="inline-block mb-4 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
                            Program Overview
                        </div>

                        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                            NovaNext™
                        </h1>

                        <p className="text-2xl font-semibold text-primary-600 mb-4">
                            For Your Next Step
                        </p>

                        <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                            Build your resume, clarify your lane, and start moving.
                        </p>
                    </div>

                    {/* Main Content Card */}
                    <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-8">
                        {/* Description */}
                        <div className="mb-12">
                            <h2 className="text-3xl font-bold text-gray-900 mb-6">Description</h2>
                            <p className="text-lg text-gray-700 leading-relaxed">
                                Choose this path if you already know which role you want to pursue next.
                            </p>
                        </div>

                        {/* Best For */}
                        <div className="mb-12">
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">Who it's for</h3>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <Check className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                                    <span className="text-lg text-gray-700">Self-starters who want structure and to execute independently</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Check className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                                    <span className="text-lg text-gray-700">Ideal when you need clarity + a strong resume fast</span>
                                </li>
                            </ul>
                        </div>

                        {/* What's Included - Summary */}
                        <div className="mb-12">
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">What's included (platform + content)</h3>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <Check className="w-6 h-6 text-primary-500 flex-shrink-0 mt-1" />
                                    <span className="text-lg text-gray-700"><strong>12-month platform access</strong></span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Check className="w-6 h-6 text-primary-500 flex-shrink-0 mt-1" />
                                    <span className="text-lg text-gray-700"><strong>Step-by-step video training</strong></span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Check className="w-6 h-6 text-primary-500 flex-shrink-0 mt-1" />
                                    <span className="text-lg text-gray-700">
                                        <strong>AI Resume Builder</strong> (resume generated from accomplishments + role targeting)
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Check className="w-6 h-6 text-primary-500 flex-shrink-0 mt-1" />
                                    <span className="text-lg text-gray-700">
                                        <strong>Templates + scripts</strong> (networking, recruiter outreach, interview foundations)
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Check className="w-6 h-6 text-primary-500 flex-shrink-0 mt-1" />
                                    <span className="text-lg text-gray-700">
                                        <strong>Positioning basics</strong> (role lane + value proposition)
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Plans Section */}
            <section className="py-16 px-4 bg-gradient-to-b from-white to-gray-50">
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
