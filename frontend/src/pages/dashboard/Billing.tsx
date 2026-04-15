/**
 * Billing Dashboard Page
 *
 * Shows current plan, add-ons, credits, and actions to:
 *   - Subscribe / upgrade membership
 *   - Buy add-ons
 *   - Open Customer Portal
 */

import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSubscription } from '../../hooks/useSubscription'
import { useBillingActions } from '../../hooks/useBillingActions'
import { getPriceCatalog, getPaymentHistory, type PriceCatalogEntry, type PaymentRecord } from '../../services/billing.service'

const TIER_LABELS: Record<string, string> = {
  esenciales: 'Esenciales',
  momentum: 'Momentum',
  vanguard: 'Vanguard',
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  trialing: 'bg-blue-100 text-blue-800',
  past_due: 'bg-yellow-100 text-yellow-800',
  canceled: 'bg-red-100 text-red-800',
  unpaid: 'bg-red-100 text-red-800',
}

const STATUS_KEYS: Record<string, string> = {
  active: 'statusActive',
  trialing: 'statusTrialing',
  past_due: 'statusPastDue',
  canceled: 'statusCanceled',
  unpaid: 'statusUnpaid',
}

export default function Billing() {
  const { t, i18n } = useTranslation()
  const { billing, loading, refetch, isActive, tier } = useSubscription()
  const { startCheckout, openPortal, loading: actionLoading, error: actionError } = useBillingActions()
  const [catalog, setCatalog] = useState<PriceCatalogEntry[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [searchParams] = useSearchParams()

  const checkoutStatus = searchParams.get('status')
  const pendingPlan = searchParams.get('pending_plan')
  const [autoCheckoutTriggered, setAutoCheckoutTriggered] = useState(false)

  // Clean checkout status from URL so browser back button won't revisit Stripe
  useEffect(() => {
    if (checkoutStatus === 'success' || checkoutStatus === 'canceled') {
      window.history.replaceState({}, '', '/dashboard/billing')
    }
  }, [checkoutStatus])

  useEffect(() => {
    getPriceCatalog()
      .then(setCatalog)
      .catch(console.error)
      .finally(() => setCatalogLoading(false))
    getPaymentHistory()
      .then(setPayments)
      .catch(console.error)
  }, [])

  // Auto-trigger checkout when user arrives from signup with a pre-selected plan
  useEffect(() => {
    if (pendingPlan && !autoCheckoutTriggered && catalog.length > 0 && !loading && !isActive) {
      const match = catalog.find(
        (p) => p.item_type === 'membership' && p.code === pendingPlan
      )
      if (match) {
        setAutoCheckoutTriggered(true)
        localStorage.removeItem('novawork_pending_plan')
        startCheckout(match.stripe_price_id)
      }
    }
  }, [pendingPlan, autoCheckoutTriggered, catalog, loading, isActive, startCheckout])

  // Poll for billing status after successful checkout until plan shows up
  useEffect(() => {
    if (checkoutStatus !== 'success') return
    if (isActive) return // Plan already loaded, stop polling

    let attempt = 0
    const maxAttempts = 10
    const poll = setInterval(() => {
      attempt++
      refetch()
      if (attempt >= maxAttempts) clearInterval(poll)
    }, 3000)

    return () => clearInterval(poll)
  }, [checkoutStatus, isActive, refetch])

  const memberships = catalog.filter((p) => p.item_type === 'membership')
  const recurringAddons = catalog.filter((p) => p.item_type === 'addon_recurring')

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(i18n.language, { year: 'numeric', month: 'long', day: 'numeric' })

  if (loading || catalogLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    )
  }

  const statusKey = billing?.subscription_status ? STATUS_KEYS[billing.subscription_status] : null
  const statusColor = billing?.subscription_status ? STATUS_COLORS[billing.subscription_status] : 'bg-gray-100 text-gray-800'

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Success banner */}
      {checkoutStatus === 'success' && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-green-800">
          {t('billing.paymentSuccess')}
        </div>
      )}
      {checkoutStatus === 'canceled' && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-yellow-800">
          {t('billing.paymentCanceled')}
        </div>
      )}

      {actionError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-800">
          {actionError}
        </div>
      )}

      {/* ── Current Plan ─────────────────────────────────────── */}
      <section className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-heading font-semibold text-navy mb-4">{t('billing.currentPlan')}</h2>

        {isActive && billing ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-primary-600">
                {TIER_LABELS[tier || ''] || tier}
              </span>
              {statusKey && (
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                  {t(`billing.${statusKey}`)}
                </span>
              )}
            </div>

            {billing.current_period_end && (
              <p className="text-sm text-gray-500">
                {billing.cancel_at_period_end
                  ? t('billing.cancelsOn', { date: formatDate(billing.current_period_end) })
                  : t('billing.nextRenewal', { date: formatDate(billing.current_period_end) })}
              </p>
            )}

            {/* Add-ons status */}
            <div className="flex gap-3 mt-2">
              {billing.has_coaching_email && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent-100 text-accent-700">
                  Coaching por Email
                </span>
              )}
              {billing.has_coach_plus_email && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent-100 text-accent-700">
                  Coach + Email
                </span>
              )}
            </div>

            {/* Credits */}
            {(billing.email_credits_available > 0 || billing.session_credits_available > 0) && (
              <div className="flex gap-4 mt-3 pt-3 border-t">
                {billing.email_credits_available > 0 && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">{t('billing.emailCredits')}:</span>{' '}
                    <span className="text-primary-600 font-semibold">{billing.email_credits_available}</span>
                  </div>
                )}
                {billing.session_credits_available > 0 && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">{t('billing.sessionCredits')}:</span>{' '}
                    <span className="text-primary-600 font-semibold">{billing.session_credits_available}</span>
                  </div>
                )}
              </div>
            )}

            {/* Portal button */}
            <button
              onClick={openPortal}
              disabled={actionLoading}
              className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              {actionLoading ? t('billing.loading') : t('billing.manageSubscription')}
            </button>
          </div>
        ) : (
          <p className="text-gray-500">{t('billing.noActivePlan')}</p>
        )}
      </section>

      {/* ── Membership Plans ─────────────────────────────────── */}
      {!isActive && memberships.length > 0 && (
        <section>
          <h2 className="text-xl font-heading font-semibold text-navy mb-4">{t('billing.chooseMembership')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {memberships.map((plan) => {
              const isPopular = plan.code === 'momentum'
              return (
                <div
                  key={plan.code}
                  className={`relative bg-white rounded-xl shadow-sm border p-6 flex flex-col ${
                    isPopular ? 'border-primary-500 ring-2 ring-primary-500' : ''
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                      {t('billing.popular')}
                    </span>
                  )}
                  <h3 className="text-lg font-heading font-semibold text-navy">{plan.display_name}</h3>
                  <div className="mt-2 mb-4 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-navy">
                      ${(plan.unit_amount / 100).toFixed(0)}
                    </span>
                    <span className="text-gray-500 text-sm">/{t('billing.perMonth')}</span>
                  </div>
                  <button
                    onClick={() => startCheckout(plan.stripe_price_id)}
                    disabled={actionLoading}
                    className={`mt-auto w-full py-2.5 px-4 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors ${
                      isPopular
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'bg-gray-100 text-navy hover:bg-gray-200'
                    }`}
                  >
                    {actionLoading ? t('billing.loading') : t('billing.subscribe')}
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Upgrade (for active users) ───────────────────────── */}
      {isActive && memberships.length > 0 && (
        <section>
          <h2 className="text-xl font-heading font-semibold text-navy mb-4">{t('billing.changePlan')}</h2>
          <p className="text-sm text-gray-500 mb-4">
            {t('billing.changePlanDescription')}
          </p>
          <button
            onClick={openPortal}
            disabled={actionLoading}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {actionLoading ? t('billing.loading') : t('billing.openPortal')}
          </button>
        </section>
      )}

      {/* ── Coaching & Add-ons ─────────────────────────────────── */}
      {recurringAddons.length > 0 && (
        <section>
          <h2 className="text-xl font-heading font-semibold text-navy mb-4">{t('billing.coachingServices')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recurringAddons.map((addon) => (
              <div key={addon.code} className="bg-white rounded-xl shadow-sm border p-6 flex flex-col">
                <h3 className="text-lg font-heading font-semibold text-navy">{addon.display_name}</h3>
                <div className="mt-2 mb-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-navy">
                    ${(addon.unit_amount / 100).toFixed(0)}
                  </span>
                  <span className="text-gray-500 text-sm">/{t('billing.perMonth')}</span>
                </div>
                <button
                  onClick={() => startCheckout(addon.stripe_price_id)}
                  disabled={actionLoading}
                  className="mt-auto w-full py-2.5 px-4 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {actionLoading ? '...' : t('billing.subscribe')}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Payment History ──────────────────────────────────── */}
      <section className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-heading font-semibold text-navy mb-4">{t('billing.paymentHistory')}</h2>
        {payments.length === 0 ? (
          <p className="text-gray-500 text-sm">{t('billing.noPayments')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 font-medium">{t('common.date') || 'Date'}</th>
                  <th className="pb-2 font-medium">Description</th>
                  <th className="pb-2 font-medium text-right">Total</th>
                  <th className="pb-2 font-medium text-center">Status</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payments.map((payment) => {
                  const date = new Date(payment.created * 1000).toLocaleDateString(i18n.language, {
                    year: 'numeric', month: 'short', day: 'numeric',
                  })
                  const isSubscription = !!payment.invoice_id
                  const statusColor = payment.status === 'succeeded'
                    ? 'text-green-700 bg-green-50'
                    : payment.status === 'failed'
                      ? 'text-red-700 bg-red-50'
                      : 'text-yellow-700 bg-yellow-50'
                  const statusKey = payment.status === 'succeeded'
                    ? 'paymentSucceeded'
                    : payment.status === 'failed'
                      ? 'paymentFailed'
                      : 'paymentPending'

                  return (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="py-3 text-gray-700">{date}</td>
                      <td className="py-3">
                        <div className="text-gray-900">
                          {payment.description || (isSubscription ? t('billing.subscription') : t('billing.oneTimePayment'))}
                        </div>
                        {payment.payment_method_last4 && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            {payment.payment_method_brand?.toUpperCase()} ****{payment.payment_method_last4}
                          </div>
                        )}
                      </td>
                      <td className="py-3 text-right font-medium text-navy">
                        ${(payment.amount / 100).toFixed(2)} {payment.currency.toUpperCase()}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                          {payment.refunded ? t('billing.refunded') : t(`billing.${statusKey}`)}
                        </span>
                        {payment.status === 'failed' && payment.failure_message && (
                          <div className="mt-1 text-xs text-red-600 max-w-[200px] mx-auto">
                            {payment.failure_message}
                          </div>
                        )}
                        {payment.status === 'failed' && payment.failure_code && !payment.failure_message && (
                          <div className="mt-1 text-xs text-red-600 max-w-[200px] mx-auto">
                            {t(`billing.failureCode.${payment.failure_code}`, payment.failure_code.replace(/_/g, ' '))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        {payment.receipt_url && (
                          <a
                            href={payment.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary-600 hover:text-primary-700 underline"
                          >
                            {t('billing.receiptLink')}
                          </a>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
