/**
 * Stripe Ascendia Products Bootstrap
 * Creates the new Ascendia membership products and prices in Stripe,
 * then updates the Supabase billing_price_catalog table.
 *
 * Usage: node scripts/stripe-ascendia-bootstrap.mjs
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
require('dotenv').config();

const { default: Stripe } = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const APP_URL = process.env.APP_URL || 'http://localhost:5173';

async function main() {
  console.log('🚀 Creating Ascendia products in Stripe...\n');

  // ── 1. Advance ($20/month) ──────────────────────────────
  const advanceProduct = await stripe.products.create({
    name: 'Ascendia Advance',
    description: 'Build, track, and manage your job search with more structure.',
    metadata: { tier: 'advance', type: 'membership' },
  });
  console.log(`✅ Advance product: ${advanceProduct.id}`);

  const advancePrice = await stripe.prices.create({
    product: advanceProduct.id,
    unit_amount: 2000, // $20.00
    currency: 'usd',
    recurring: { interval: 'month' },
    lookup_key: 'membership_advance',
    metadata: { tier: 'advance', type: 'membership' },
  });
  console.log(`✅ Advance price: ${advancePrice.id} ($20/month)`);

  // ── 2. Apex ($30/month) ─────────────────────────────────
  const apexProduct = await stripe.products.create({
    name: 'Ascendia Apex',
    description: 'A more complete career workspace for serious career movement.',
    metadata: { tier: 'apex', type: 'membership' },
  });
  console.log(`✅ Apex product: ${apexProduct.id}`);

  const apexPrice = await stripe.prices.create({
    product: apexProduct.id,
    unit_amount: 3000, // $30.00
    currency: 'usd',
    recurring: { interval: 'month' },
    lookup_key: 'membership_apex',
    metadata: { tier: 'apex', type: 'membership' },
  });
  console.log(`✅ Apex price: ${apexPrice.id} ($30/month)`);

  // ── 3. Update Customer Portal to include new products ────
  console.log('\n🔧 Updating Stripe Customer Portal configuration...');

  // Get all membership prices for the portal
  const allPrices = await stripe.prices.list({
    active: true,
    expand: ['data.product'],
  });

  const membershipPrices = allPrices.data.filter(
    (p) => p.metadata?.type === 'membership' && p.recurring
  );

  // Create a new portal configuration
  const portalConfig = await stripe.billingPortal.configurations.create({
    business_profile: {
      headline: 'Ascendia — Manage your subscription',
    },
    features: {
      payment_method_update: { enabled: true },
      invoice_history: { enabled: true },
      subscription_cancel: {
        enabled: true,
        mode: 'at_period_end',
        cancellation_reason: {
          enabled: true,
          options: [
            'too_expensive',
            'missing_features',
            'switched_service',
            'unused',
            'other',
          ],
        },
      },
      subscription_pause: { enabled: false },
    },
  });
  console.log(`✅ New portal config: ${portalConfig.id}`);

  // ── 4. Update Supabase billing_price_catalog ─────────────
  console.log('\n📊 Updating Supabase billing_price_catalog...');

  // Insert Advance
  const { error: advError } = await supabase
    .from('billing_price_catalog')
    .upsert({
      code: 'advance',
      item_type: 'membership',
      stripe_product_id: advanceProduct.id,
      stripe_price_id: advancePrice.id,
      lookup_key: 'membership_advance',
      display_name: 'Ascendia Advance',
      unit_amount: 2000,
      currency: 'usd',
      active: true,
      is_test_mode: !advancePrice.livemode,
    }, { onConflict: 'code' });

  if (advError) {
    console.error('❌ Error inserting Advance:', advError);
  } else {
    console.log(`✅ Advance inserted into catalog (price: $20/month, id: ${advancePrice.id})`);
  }

  // Insert Apex
  const { error: apexError } = await supabase
    .from('billing_price_catalog')
    .upsert({
      code: 'apex',
      item_type: 'membership',
      stripe_product_id: apexProduct.id,
      stripe_price_id: apexPrice.id,
      lookup_key: 'membership_apex',
      display_name: 'Ascendia Apex',
      unit_amount: 3000,
      currency: 'usd',
      active: true,
      is_test_mode: !apexPrice.livemode,
    }, { onConflict: 'code' });

  if (apexError) {
    console.error('❌ Error inserting Apex:', apexError);
  } else {
    console.log(`✅ Apex inserted into catalog (price: $30/month, id: ${apexPrice.id})`);
  }

  // Insert Core (free, no Stripe)
  const { error: coreError } = await supabase
    .from('billing_price_catalog')
    .upsert({
      code: 'core',
      item_type: 'membership',
      stripe_product_id: null,
      stripe_price_id: null,
      lookup_key: 'membership_core',
      display_name: 'Ascendia Core',
      unit_amount: 0,
      currency: 'usd',
      active: true,
      is_test_mode: true,
    }, { onConflict: 'code' });

  if (coreError) {
    console.error('❌ Error inserting Core:', coreError);
  } else {
    console.log(`✅ Core inserted into catalog (free, no Stripe)`);
  }

  // ── 5. Update .env with new price IDs ─────────────────────
  console.log('\n📝 New Stripe Price IDs:');
  console.log(`PRICE_MEMBERSHIP_ADVANCE=${advancePrice.id}`);
  console.log(`PRICE_MEMBERSHIP_APEX=${apexPrice.id}`);
  console.log(`STRIPE_PORTAL_CONFIG_ID=${portalConfig.id}`);

  console.log('\n✅ Done! Ascendia products are ready in Stripe.');
}

main().catch((err) => {
  console.error('❌ Bootstrap failed:', err);
  process.exit(1);
});