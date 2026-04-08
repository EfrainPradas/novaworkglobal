/**
 * Stripe Service
 * Centralized Stripe client initialization
 */

import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn('⚠️  STRIPE_SECRET_KEY not configured in services/stripe.js');
}

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey)
  : null;

export const PORTAL_CONFIG_ID = process.env.STRIPE_PORTAL_CONFIG_ID || null;
export const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || null;

/**
 * Get or create a Stripe customer for a given user.
 * Uses supabaseAdmin to read/write billing_customers.
 */
export async function getOrCreateStripeCustomer(supabaseAdmin, userId, email, fullName) {
  // Check if customer already exists
  const { data: existing } = await supabaseAdmin
    .from('billing_customers')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single();

  if (existing?.stripe_customer_id) {
    return existing.stripe_customer_id;
  }

  // Create in Stripe
  const customer = await stripe.customers.create({
    email,
    name: fullName || undefined,
    metadata: { user_id: userId },
  });

  // Save mapping in Supabase
  await supabaseAdmin.from('billing_customers').upsert({
    user_id: userId,
    stripe_customer_id: customer.id,
    email,
    full_name: fullName || null,
    is_test_mode: customer.livemode === false,
  }, { onConflict: 'user_id' });

  return customer.id;
}
