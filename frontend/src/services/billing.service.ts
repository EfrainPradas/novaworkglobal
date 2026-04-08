/**
 * Billing Service — Stripe integration
 * Calls backend /api/billing/* endpoints
 */

import { supabase } from '../lib/supabase'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('No active session')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  }
}

async function billingFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = await authHeaders()
  const res = await fetch(`${API_BASE_URL}/api/billing${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string> ?? {}) },
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Billing request failed')
  return json
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface BillingStatus {
  user_id: string
  is_active: boolean
  membership_code: 'esenciales' | 'momentum' | 'vanguard' | null
  subscription_status: string | null
  cancel_at_period_end: boolean
  current_period_end: string | null
  has_coaching_email: boolean
  has_coach_plus_email: boolean
  email_credits_available: number
  session_credits_available: number
}

export interface CheckoutResponse {
  url: string
  sessionId: string
}

export interface PortalResponse {
  url: string
}

export interface PriceCatalogEntry {
  code: string
  item_type: 'membership' | 'addon_recurring' | 'addon_one_time'
  stripe_price_id: string
  display_name: string
  unit_amount: number
  currency: string
  active: boolean
  lookup_key: string
}

// ── API calls ────────────────────────────────────────────────────────────────

export async function getBillingStatus(): Promise<BillingStatus> {
  return billingFetch<BillingStatus>('/status')
}

export async function createCheckoutSession(priceId: string): Promise<CheckoutResponse> {
  return billingFetch<CheckoutResponse>('/create-checkout-session', {
    method: 'POST',
    body: JSON.stringify({ priceId }),
  })
}

export async function createAddonSession(priceId: string): Promise<CheckoutResponse> {
  return billingFetch<CheckoutResponse>('/create-addon-session', {
    method: 'POST',
    body: JSON.stringify({ priceId }),
  })
}

export async function createPortalSession(): Promise<PortalResponse> {
  return billingFetch<PortalResponse>('/create-portal-session', {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

// ── Payment history ──────────────────────────────────────────────────────────

export interface PaymentRecord {
  id: string
  amount: number
  currency: string
  status: string
  description: string | null
  created: number
  payment_method_brand: string | null
  payment_method_last4: string | null
  receipt_url: string | null
  refunded: boolean
  invoice_id: string | null
  failure_code: string | null
  failure_message: string | null
  outcome_reason: string | null
  outcome_type: string | null
}

export async function getPaymentHistory(): Promise<PaymentRecord[]> {
  const res = await billingFetch<{ payments: PaymentRecord[] }>('/history')
  return res.payments
}

/**
 * Fetch the price catalog directly from Supabase (public read via RLS).
 * No backend call needed — the table has an authenticated SELECT policy.
 */
export async function getPriceCatalog(): Promise<PriceCatalogEntry[]> {
  const { data, error } = await supabase
    .from('billing_price_catalog')
    .select('code, item_type, stripe_price_id, display_name, unit_amount, currency, active, lookup_key')
    .eq('active', true)
    .order('unit_amount', { ascending: true })

  if (error) throw new Error(error.message)
  return data || []
}
