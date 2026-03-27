import { AddOn, AddOnPricingMode } from '../../config/landingContent'

interface AddOnSectionProps {
    addOns: AddOn[]
    mode: AddOnPricingMode
}

export default function AddOnSection({ addOns, mode }: AddOnSectionProps) {
    return (
        <section className="py-20 px-4 bg-white">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">Optional Add-Ons</h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Enhance your subscription with additional 1:1 support and expert reviews
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                        Current mode: <span className="font-semibold capitalize">{mode}</span>
                    </p>
                </div>

                {/* Add-Ons Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {addOns.map((addOn) => (
                        <div
                            key={addOn.id}
                            className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-primary-300 hover:shadow-lg transition-all"
                        >
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{addOn.name}</h3>
                            {addOn.description && (
                                <p className="text-sm text-gray-600 mb-4">{addOn.description}</p>
                            )}

                            <div className="space-y-2">
                                {addOn.pricing.single && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 text-sm">Single Session</span>
                                        <span className="text-lg font-bold text-gray-900">
                                            ${addOn.pricing.single}
                                        </span>
                                    </div>
                                )}

                                {addOn.pricing.bundle_3 && (
                                    <div className="flex justify-between items-center border-t border-gray-100 pt-2">
                                        <span className="text-gray-600 text-sm">3-Pack Bundle</span>
                                        <span className="text-lg font-bold text-primary-600">
                                            ${addOn.pricing.bundle_3}
                                        </span>
                                    </div>
                                )}

                                {addOn.pricing.bundle_6 && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 text-sm">6-Pack Bundle</span>
                                        <span className="text-lg font-bold text-primary-600">
                                            ${addOn.pricing.bundle_6}
                                        </span>
                                    </div>
                                )}

                                {addOn.pricing.bundle_10 && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 text-sm">10-Pack Bundle</span>
                                        <span className="text-lg font-bold text-primary-600">
                                            ${addOn.pricing.bundle_10}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => (window.location.href = `/signup?addon=${addOn.id}`)}
                                className="w-full mt-4 py-2 bg-gray-100 text-gray-900 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                            >
                                Add to Plan
                            </button>
                        </div>
                    ))}
                </div>

                <p className="text-center text-sm text-gray-500 mt-8">
                    Add-ons can be purchased at any time and are valid for 12 months from purchase date
                </p>
            </div>
        </section>
    )
}
