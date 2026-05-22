import { useEffect, useState } from 'react'
import { X, Minus, Plus, Loader2, AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { getPriceCatalog, PriceCatalogEntry } from '../../services/billing.service'
import { useBillingActions } from '../../hooks/useBillingActions'

export interface CoachingOption {
    code: 'coaching_email' | 'session_1on1' | 'coach_plus_email'
    title: string
    /** Display price (USD, rendered in the UI). The real charge is driven by Stripe's catalog. */
    price: number
    unit: string
    format: string
    /** If true, quantity is fixed at 1 (recurring plans should not use line-item quantity). */
    fixedQuantity?: boolean
}

interface Props {
    isOpen: boolean
    onClose: () => void
    option: CoachingOption | null
}

const MAX_QTY = 10

export default function CoachingPurchaseModal({ isOpen, onClose, option }: Props) {
    const { t } = useTranslation()
    const { startCheckout, startAddonCheckout, loading: checkoutLoading, error: checkoutError } = useBillingActions()

    const [qty, setQty] = useState(1)
    const [localError, setLocalError] = useState<string | null>(null)
    const [authChecking, setAuthChecking] = useState(false)

    useEffect(() => {
        if (!isOpen) return
        setQty(1)
        setLocalError(null)
    }, [isOpen])

    // Fixed quantity defaults to true for recurring plans; only session_1on1 allows variable qty.
    const fixedQuantity = option?.fixedQuantity ?? false
    const effectiveQty = fixedQuantity ? 1 : qty
    const total = option ? option.price * effectiveQty : 0

    if (!isOpen || !option) return null

    const handleContinue = async () => {
        setLocalError(null)
        setAuthChecking(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                const returnTo = encodeURIComponent(window.location.pathname + window.location.search)
                window.location.href = `/signin?redirect=${returnTo}&intent=coaching_${option.code}`
                return
            }

            const catalog = await getPriceCatalog()
            const entry = catalog.find((c) => c.code === option.code) as PriceCatalogEntry | undefined
            if (!entry) {
                setLocalError(t('coachingTeaser.unavailable', 'This service is not available right now.'))
                return
            }

            const isOneTime = entry.item_type === 'addon_one_time'
            if (isOneTime) {
                await startAddonCheckout(entry.stripe_price_id, effectiveQty)
            } else {
                await startCheckout(entry.stripe_price_id, effectiveQty)
            }
        } catch (err: any) {
            setLocalError(err?.message || 'Unexpected error')
        } finally {
            setAuthChecking(false)
        }
    }

    const disabled = checkoutLoading || authChecking

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="coaching-purchase-title"
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            <div
                className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 z-10"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label={t('common.close', 'Close')}
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="mb-6">
                    <p className="text-xs uppercase tracking-wider text-primary-600 font-semibold mb-1">
                        {t('coachingTeaser.checkoutLabel', 'Coaching checkout')}
                    </p>
                    <h3 id="coaching-purchase-title" className="text-2xl font-bold text-gray-900 dark:text-white">
                        {option.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{option.format}</p>
                </div>

                <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">${option.price}</span>
                    <span className="text-gray-500 dark:text-gray-400">{option.unit}</span>
                </div>

                {!fixedQuantity && (
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            {t('coachingTeaser.quantityLabel', 'How many?')}
                        </label>
                        <div className="flex items-center gap-4">
                            <div className="inline-flex items-center border border-gray-300 dark:border-gray-700 rounded-full overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                                    disabled={qty <= 1}
                                    aria-label={t('coachingTeaser.decrease', 'Decrease quantity')}
                                    className="p-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-12 text-center text-lg font-bold text-gray-900 dark:text-white">
                                    {qty}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))}
                                    disabled={qty >= MAX_QTY}
                                    aria-label={t('coachingTeaser.increase', 'Increase quantity')}
                                    className="p-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {t('coachingTeaser.maxQuantity', 'Max {{max}} per checkout', { max: MAX_QTY })}
                            </p>
                        </div>
                    </div>
                )}

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            {t('coachingTeaser.total', 'Total')}
                        </span>
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">${total}</span>
                    </div>
                    {!fixedQuantity && qty > 1 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                            {qty} × ${option.price}
                        </p>
                    )}
                </div>

                {(localError || checkoutError) && (
                    <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{localError || checkoutError}</span>
                    </div>
                )}

                <button
                    type="button"
                    onClick={handleContinue}
                    disabled={disabled}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {(checkoutLoading || authChecking) && <Loader2 className="w-4 h-4 animate-spin" />}
                    {t('coachingTeaser.continueCheckout', 'Continue to Stripe checkout')}
                </button>

                <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-3">
                    {t('coachingTeaser.securePayment', 'Secure payment · Powered by Stripe')}
                </p>
            </div>
        </div>
    )
}
