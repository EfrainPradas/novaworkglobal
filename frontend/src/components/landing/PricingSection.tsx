import { useState } from 'react'
import { Check } from 'lucide-react'
import { PricingPlan } from '../../config/landingContent'

interface PricingSectionProps {
    plans: PricingPlan[]
}

export default function PricingSection({ plans }: PricingSectionProps) {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')

    return (
        <section id="pricing" className="py-20 px-4 bg-gradient-to-b from-white to-gray-50">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        NovaNext™ Subscription Plans
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                        Choose the plan that fits your career transition needs
                    </p>

                    {/* Billing Toggle */}
                    <div className="inline-flex items-center bg-gray-100 rounded-full p-1 shadow-inner">
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-6 py-2 rounded-full font-semibold transition-all ${billingCycle === 'monthly'
                                ? 'bg-white text-primary-600 shadow-md'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle('annual')}
                            className={`px-6 py-2 rounded-full font-semibold transition-all ${billingCycle === 'annual'
                                ? 'bg-white text-primary-600 shadow-md'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Annual
                            <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                Save 17%
                            </span>
                        </button>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan) => {
                        const price = billingCycle === 'monthly' ? plan.monthly : plan.annual
                        const pricePerMonth = billingCycle === 'monthly' ? price : Math.round(price / 12)
                        const hasBadge = !!plan.badge

                        return (
                            <div
                                key={plan.name}
                                className={`relative bg-white rounded-2xl p-8 transition-all duration-300 ${hasBadge
                                    ? 'border-2 border-primary-500 shadow-2xl scale-105'
                                    : 'border border-gray-200 shadow-lg hover:shadow-xl'
                                    }`}
                            >
                                {hasBadge && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                                        {plan.badge}
                                    </div>
                                )}

                                <div className="mb-6">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.displayName}</h3>
                                    <p className="text-gray-600 text-sm mb-4">{plan.positioning}</p>

                                    <div className="flex items-baseline gap-2 mb-2">
                                        <span className="text-5xl font-bold text-gray-900">${price}</span>
                                        <span className="text-gray-600">
                                            {billingCycle === 'annual' ? '/year' : '/month'}
                                        </span>
                                    </div>
                                    {billingCycle === 'annual' && (
                                        <div>
                                            <p className="text-sm text-gray-500">${pricePerMonth}/month billed annually</p>
                                            <p className="text-sm text-green-600 font-semibold">Save ${plan.monthly * 12 - plan.annual}/year vs monthly</p>
                                        </div>
                                    )}
                                </div>

                                {/* Features */}
                                <ul className="space-y-3 mb-6">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                            <span className="text-gray-700 text-sm">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* Support Info */}
                                <div className="border-t border-gray-200 pt-4 mb-6 space-y-2">
                                    <div className="flex items-start gap-2">
                                        <Check className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                                        <span className="text-sm text-gray-600">
                                            <strong>Email:</strong> {plan.emailSupport}
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Check className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                                        <span className="text-sm text-gray-600">
                                            <strong>Live:</strong> {plan.liveSessions}
                                        </span>
                                    </div>
                                </div>

                                {/* CTA Button */}
                                <button
                                    onClick={() => {
                                        const PLAN_TO_BILLING: Record<string, string> = {
                                            essentials: 'esenciales',
                                            momentum: 'momentum',
                                            executive: 'vanguard',
                                        }
                                        localStorage.setItem('novawork_pending_plan', PLAN_TO_BILLING[plan.name] || plan.name)
                                        window.location.href = `/signup?plan=${plan.name}`
                                    }}
                                    className={`w-full py-3 rounded-xl font-bold transition-all ${hasBadge
                                        ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-xl'
                                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                        }`}
                                >
                                    {plan.cta || 'Get Started'}
                                </button>
                            </div>
                        )
                    })}
                </div>

                <p className="text-center text-sm text-gray-500 mt-8">
                    All plans include 12-month access • Cancel anytime • No hidden fees
                </p>
            </div>
        </section>
    )
}
