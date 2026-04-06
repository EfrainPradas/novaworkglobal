import { Check, Star, Calendar, Mail, Users } from 'lucide-react'
import {
    coachingServices,
    modulePricing,
    maintenancePlan,
    type CoachingService,
    type ModulePricing
} from '../../config/landingContent'

export default function AddOnSection() {
    return (
        <section className="py-20 px-4 bg-white">
            <div className="max-w-6xl mx-auto space-y-20">
                {/* ── Coaching Services ────────────────────────── */}
                <div>
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                            Coaching Services
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Get personalized guidance from experienced career coaches
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {coachingServices.map((svc) => (
                            <CoachingCard key={svc.id} service={svc} />
                        ))}
                    </div>
                </div>

                {/* ── Individual Modules ───────────────────────── */}
                <div>
                    <div className="text-center mb-10">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                            Individual Modules
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Access specific modules without a full subscription
                        </p>
                    </div>

                    <div className="max-w-3xl mx-auto overflow-hidden rounded-2xl border border-gray-200 shadow-lg">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-700">Module</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-700 text-center">Monthly</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-700 text-center">One-Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {modulePricing.map((mod, idx) => (
                                    <ModuleRow key={mod.id} module={mod} last={idx === modulePricing.length - 1} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── Maintenance Plan ─────────────────────────── */}
                <div className="max-w-2xl mx-auto">
                    <div className="rounded-2xl border-2 border-primary-200 bg-primary-50/40 p-8 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold mb-4">
                            <Star size={14} />
                            Maintenance Plan
                        </div>
                        <div className="flex items-baseline justify-center gap-1 mb-3">
                            <span className="text-5xl font-bold text-gray-900">${maintenancePlan.price}</span>
                            <span className="text-gray-600 text-lg">/month</span>
                        </div>
                        <p className="text-gray-700 font-medium mb-2">
                            {maintenancePlan.includes}
                        </p>
                        <p className="text-gray-500 text-sm mb-6">
                            {maintenancePlan.positioning}
                        </p>
                        <button
                            onClick={() => (window.location.href = '/signup?plan=maintenance')}
                            className="px-8 py-3 rounded-xl font-bold bg-primary-600 text-white hover:bg-primary-700 transition-all shadow-lg hover:shadow-xl"
                        >
                            Stay Ready
                        </button>
                    </div>
                </div>
            </div>
        </section>
    )
}

/* ── Sub-components ──────────────────────────────────────────── */

function CoachingCard({ service }: { service: CoachingService }) {
    const icons: Record<string, React.ReactNode> = {
        'one-on-one-session': <Calendar size={20} />,
        'email-coaching': <Mail size={20} />,
        'coach-plus-email': <Users size={20} />,
    }

    return (
        <div
            className={`relative rounded-2xl p-7 transition-all duration-300 ${
                service.featured
                    ? 'border-2 border-primary-500 shadow-2xl scale-[1.03] bg-white'
                    : 'border border-gray-200 shadow-lg hover:shadow-xl bg-white'
            }`}
        >
            {service.featured && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary-600 text-white px-5 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                    <Star size={12} /> Best Value
                </div>
            )}

            <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-50 text-primary-600">
                    {icons[service.id] || <Calendar size={20} />}
                </span>
                <h3 className="text-xl font-bold text-gray-900">{service.name}</h3>
            </div>

            <p className="text-3xl font-bold text-gray-900 mb-4">{service.price}</p>

            <ul className="space-y-2.5 mb-6">
                <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700"><strong>Format:</strong> {service.format}</span>
                </li>
                <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700"><strong>Best for:</strong> {service.bestFor}</span>
                </li>
                <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{service.valueLogic}</span>
                </li>
            </ul>

            <button
                onClick={() => (window.location.href = `/signup?coaching=${service.id}`)}
                className={`w-full py-3 rounded-xl font-bold transition-all ${
                    service.featured
                        ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-xl'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
            >
                {service.cta}
            </button>
        </div>
    )
}

function ModuleRow({ module, last }: { module: ModulePricing; last: boolean }) {
    return (
        <tr className={last ? '' : 'border-b border-gray-100'}>
            <td className="px-6 py-4 font-medium text-gray-900">{module.name}</td>
            <td className="px-6 py-4 text-center">
                <span className="font-bold text-gray-900">${module.monthly}</span>
                <span className="text-gray-500 text-sm">/mo</span>
            </td>
            <td className="px-6 py-4 text-center">
                <span className="font-bold text-gray-900">${module.oneTime}</span>
                <span className="text-gray-500 text-sm ml-1">one-time</span>
            </td>
        </tr>
    )
}
