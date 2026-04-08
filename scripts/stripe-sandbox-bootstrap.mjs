#!/usr/bin/env node
/**
 * NovaWork Global — Stripe Sandbox Bootstrap Script
 *
 * Modes:
 *   cleanup   — tear down all test-mode objects
 *   seed      — create products, prices, portal config, webhook
 *   bootstrap — cleanup + seed in one step
 *
 * Usage:
 *   node scripts/stripe-sandbox-bootstrap.mjs cleanup
 *   node scripts/stripe-sandbox-bootstrap.mjs seed
 *   node scripts/stripe-sandbox-bootstrap.mjs bootstrap
 *
 * Environment variables (read from .env via dotenv):
 *   STRIPE_SECRET_KEY   — must start with sk_test_
 *   APP_URL             — e.g. http://localhost:5173
 *   WEBHOOK_URL         — optional, e.g. https://xyz.ngrok.io/stripe/webhook
 */

import Stripe from 'stripe';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ── Load .env from project root ──────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env') });

// ── Constants ────────────────────────────────────────────────────────────────
// Use the SDK's default API version (bundled with the installed stripe package)

const PRODUCTS = [
  {
    name: 'NovaWork Esenciales',
    description: 'Plan mensual Esenciales — acceso base a la plataforma NovaWork.',
    lookupKey: 'membership_esenciales',
    unitAmount: 2900, // $29.00
    interval: 'month',
    metadata: { tier: 'esenciales', type: 'membership' },
  },
  {
    name: 'NovaWork Momentum',
    description: 'Plan mensual Momentum — herramientas avanzadas de búsqueda y preparación.',
    lookupKey: 'membership_momentum',
    unitAmount: 4900, // $49.00
    interval: 'month',
    metadata: { tier: 'momentum', type: 'membership' },
  },
  {
    name: 'NovaWork Vanguard',
    description: 'Plan mensual Vanguard — acceso completo con coaching y prioridad.',
    lookupKey: 'membership_vanguard',
    unitAmount: 14900, // $149.00
    interval: 'month',
    metadata: { tier: 'vanguard', type: 'membership' },
  },
];

const ADDONS = [
  {
    name: 'Coaching por Email',
    description: 'Add-on recurrente: revisión y feedback asíncrono por email.',
    lookupKey: 'addon_coaching_email',
    unitAmount: 1900, // $19.00
    interval: 'month',
    metadata: { type: 'addon', addon: 'coaching_email' },
  },
  {
    name: 'Coach + Email',
    description: 'Add-on recurrente: sesiones de coaching en vivo + soporte por email.',
    lookupKey: 'addon_coach_plus_email',
    unitAmount: 3900, // $39.00
    interval: 'month',
    metadata: { type: 'addon', addon: 'coach_plus_email' },
  },
  {
    name: 'Sesión 1:1',
    description: 'Sesión única de coaching uno a uno (60 min).',
    lookupKey: 'addon_session_1on1',
    unitAmount: 7900, // $79.00
    interval: null, // one-time
    metadata: { type: 'addon', addon: 'session_1on1' },
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function log(emoji, msg) {
  console.log(`${emoji}  ${msg}`);
}

function heading(title) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${'='.repeat(60)}\n`);
}

/** Paginate through a Stripe list endpoint, collecting all items. */
async function listAll(stripeListFn, params = {}) {
  const items = [];
  for await (const item of stripeListFn(params)) {
    items.push(item);
  }
  return items;
}

// ── Validate key ─────────────────────────────────────────────────────────────

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error('ERROR: STRIPE_SECRET_KEY is not set. Set it in your .env file.');
    process.exit(1);
  }
  if (!key.startsWith('sk_test_')) {
    console.error('ERROR: STRIPE_SECRET_KEY does not start with sk_test_. This script only runs in test/sandbox mode.');
    process.exit(1);
  }
  return new Stripe(key);
}

// ── CLEANUP ──────────────────────────────────────────────────────────────────

async function cleanup(stripe) {
  heading('CLEANUP — Tearing down Stripe sandbox objects');

  // 1. Delete webhook endpoints
  log('🔗', 'Deleting webhook endpoints...');
  const webhooks = await listAll(stripe.webhookEndpoints.list.bind(stripe.webhookEndpoints));
  for (const wh of webhooks) {
    await stripe.webhookEndpoints.del(wh.id);
    log('  ✓', `Deleted webhook ${wh.id} (${wh.url})`);
  }
  log('✅', `Deleted ${webhooks.length} webhook endpoint(s).`);

  // 2. Deactivate payment links
  log('🔗', 'Deactivating payment links...');
  const paymentLinks = await listAll(stripe.paymentLinks.list.bind(stripe.paymentLinks), { active: true });
  for (const pl of paymentLinks) {
    await stripe.paymentLinks.update(pl.id, { active: false });
    log('  ✓', `Deactivated payment link ${pl.id}`);
  }
  log('✅', `Deactivated ${paymentLinks.length} payment link(s).`);

  // 3. Delete coupons
  log('🎟️', 'Deleting coupons...');
  const coupons = await listAll(stripe.coupons.list.bind(stripe.coupons));
  let couponsDeleted = 0;
  for (const coupon of coupons) {
    try {
      await stripe.coupons.del(coupon.id);
      couponsDeleted++;
      log('  ✓', `Deleted coupon ${coupon.id}`);
    } catch (err) {
      log('  ⚠', `Could not delete coupon ${coupon.id}: ${err.message}`);
    }
  }
  log('✅', `Deleted ${couponsDeleted}/${coupons.length} coupon(s).`);

  // 4. Handle invoices: delete drafts, void open
  log('📄', 'Cleaning up invoices...');
  const draftInvoices = await listAll(stripe.invoices.list.bind(stripe.invoices), { status: 'draft' });
  for (const inv of draftInvoices) {
    try {
      await stripe.invoices.del(inv.id);
      log('  ✓', `Deleted draft invoice ${inv.id}`);
    } catch (err) {
      log('  ⚠', `Could not delete draft invoice ${inv.id}: ${err.message}`);
    }
  }
  const openInvoices = await listAll(stripe.invoices.list.bind(stripe.invoices), { status: 'open' });
  for (const inv of openInvoices) {
    try {
      await stripe.invoices.voidInvoice(inv.id);
      log('  ✓', `Voided open invoice ${inv.id}`);
    } catch (err) {
      log('  ⚠', `Could not void invoice ${inv.id}: ${err.message}`);
    }
  }
  log('✅', `Processed ${draftInvoices.length} draft + ${openInvoices.length} open invoice(s).`);

  // 5. Delete test clocks
  log('⏰', 'Deleting test clocks...');
  const testClocks = await listAll(stripe.testHelpers.testClocks.list.bind(stripe.testHelpers.testClocks));
  for (const tc of testClocks) {
    try {
      await stripe.testHelpers.testClocks.del(tc.id);
      log('  ✓', `Deleted test clock ${tc.id}`);
    } catch (err) {
      log('  ⚠', `Could not delete test clock ${tc.id}: ${err.message}`);
    }
  }
  log('✅', `Deleted ${testClocks.length} test clock(s).`);

  // 6. Cancel active subscriptions before deleting customers
  log('💳', 'Canceling active subscriptions...');
  const subscriptions = await listAll(stripe.subscriptions.list.bind(stripe.subscriptions), { status: 'active' });
  const trialingSubscriptions = await listAll(stripe.subscriptions.list.bind(stripe.subscriptions), { status: 'trialing' });
  const allSubs = [...subscriptions, ...trialingSubscriptions];
  for (const sub of allSubs) {
    try {
      await stripe.subscriptions.cancel(sub.id);
      log('  ✓', `Canceled subscription ${sub.id}`);
    } catch (err) {
      log('  ⚠', `Could not cancel subscription ${sub.id}: ${err.message}`);
    }
  }
  log('✅', `Canceled ${allSubs.length} subscription(s).`);

  // 7. Delete customers
  log('👤', 'Deleting customers...');
  const customers = await listAll(stripe.customers.list.bind(stripe.customers), { limit: 100 });
  for (const cust of customers) {
    try {
      await stripe.customers.del(cust.id);
      log('  ✓', `Deleted customer ${cust.id} (${cust.email || 'no email'})`);
    } catch (err) {
      log('  ⚠', `Could not delete customer ${cust.id}: ${err.message}`);
    }
  }
  log('✅', `Deleted ${customers.length} customer(s).`);

  // 8. Archive active prices
  log('💰', 'Archiving active prices...');
  const activePrices = await listAll(stripe.prices.list.bind(stripe.prices), { active: true, limit: 100 });
  for (const price of activePrices) {
    await stripe.prices.update(price.id, { active: false });
    log('  ✓', `Archived price ${price.id} (${price.lookup_key || 'no lookup_key'})`);
  }
  log('✅', `Archived ${activePrices.length} price(s).`);

  // 9. Archive active products
  log('📦', 'Archiving active products...');
  const activeProducts = await listAll(stripe.products.list.bind(stripe.products), { active: true, limit: 100 });
  for (const prod of activeProducts) {
    try {
      await stripe.products.update(prod.id, { active: false });
      log('  ✓', `Archived product ${prod.id} (${prod.name})`);
    } catch (err) {
      log('  ⚠', `Could not archive product ${prod.id}: ${err.message}`);
    }
  }
  log('✅', `Archived ${activeProducts.length} product(s).`);

  heading('CLEANUP COMPLETE');
}

// ── SEED ─────────────────────────────────────────────────────────────────────

async function seed(stripe) {
  heading('SEED — Creating NovaWork Stripe catalog');

  const appUrl = process.env.APP_URL || 'http://localhost:5173';
  const webhookUrl = process.env.WEBHOOK_URL;
  const created = { products: [], prices: [], portal: null, webhook: null };

  // Helper: create a product + price pair
  async function createProductAndPrice({ name, description, lookupKey, unitAmount, interval, metadata }) {
    const product = await stripe.products.create({
      name,
      description,
      metadata,
    });
    log('📦', `Created product: ${product.id} — ${name}`);

    const priceParams = {
      product: product.id,
      currency: 'usd',
      unit_amount: unitAmount,
      lookup_key: lookupKey,
      transfer_lookup_key: true, // reclaim lookup_key if it existed on an archived price
      metadata,
    };

    if (interval) {
      priceParams.recurring = { interval };
    }

    const price = await stripe.prices.create(priceParams);
    log('💰', `Created price: ${price.id} — ${lookupKey} ($${(unitAmount / 100).toFixed(2)}${interval ? '/' + interval : ' one-time'})`);

    created.products.push({ id: product.id, name });
    created.prices.push({ id: price.id, lookupKey, unitAmount, interval });

    return { product, price };
  }

  // ── Create memberships ──
  log('🏗️', 'Creating membership products and prices...');
  for (const membership of PRODUCTS) {
    await createProductAndPrice(membership);
  }

  // ── Create add-ons ──
  log('🏗️', 'Creating add-on products and prices...');
  for (const addon of ADDONS) {
    await createProductAndPrice(addon);
  }

  // ── Customer Portal configuration ──
  log('🚪', 'Creating Customer Portal configuration...');
  const recurringPriceIds = created.prices
    .filter((p) => p.interval !== null)
    .map((p) => p.id);

  const portalConfig = await stripe.billingPortal.configurations.create({
    business_profile: {
      headline: 'NovaWork — Gestiona tu membresía',
    },
    features: {
      customer_update: {
        enabled: true,
        allowed_updates: ['email', 'name', 'address'],
      },
      payment_method_update: {
        enabled: true,
      },
      invoice_history: {
        enabled: true,
      },
      subscription_cancel: {
        enabled: true,
        mode: 'at_period_end',
        proration_behavior: 'none',
      },
      subscription_update: {
        enabled: true,
        default_allowed_updates: ['price'],
        proration_behavior: 'create_prorations',
        products: buildPortalProducts(recurringPriceIds),
      },
    },
    default_return_url: `${appUrl}/dashboard/billing`,
  });
  created.portal = portalConfig.id;
  log('✅', `Portal config created: ${portalConfig.id}`);

  // ── Webhook endpoint (optional) ──
  if (webhookUrl) {
    log('🔗', `Creating webhook endpoint at ${webhookUrl}...`);
    const webhook = await stripe.webhookEndpoints.create({
      url: webhookUrl,
      enabled_events: [
        'checkout.session.completed',
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'invoice.paid',
        'invoice.payment_failed',
        'customer.updated',
      ],
      metadata: { source: 'novawork-bootstrap' },
    });
    created.webhook = { id: webhook.id, secret: webhook.secret };
    log('✅', `Webhook created: ${webhook.id}`);
    log('🔑', `Webhook signing secret: ${webhook.secret}`);
    log('⚠️', 'Save this secret to STRIPE_WEBHOOK_SECRET in your .env file!');
  } else {
    log('ℹ️', 'WEBHOOK_URL not set — skipping webhook creation.');
    log('ℹ️', 'For local dev, use: stripe listen --forward-to http://localhost:5001/api/stripe/webhook');
  }

  // ── Summary ──
  heading('SEED COMPLETE — Created Objects Summary');

  console.log('Products:');
  console.log('─'.repeat(60));
  for (const p of created.products) {
    console.log(`  ${p.id}  ${p.name}`);
  }

  console.log('\nPrices (use lookup_keys in your code):');
  console.log('─'.repeat(60));
  for (const p of created.prices) {
    const priceStr = `$${(p.unitAmount / 100).toFixed(2)}${p.interval ? '/' + p.interval : ' one-time'}`;
    console.log(`  ${p.id}  ${p.lookupKey.padEnd(30)} ${priceStr}`);
  }

  console.log('\nPortal Configuration:');
  console.log('─'.repeat(60));
  console.log(`  ${created.portal}`);

  if (created.webhook) {
    console.log('\nWebhook:');
    console.log('─'.repeat(60));
    console.log(`  ID:     ${created.webhook.id}`);
    console.log(`  Secret: ${created.webhook.secret}`);
  }

  console.log('\n── Environment variables to set ──');
  console.log('─'.repeat(60));
  const membershipPrices = created.prices.filter((p) => p.lookupKey.startsWith('membership_'));
  for (const p of membershipPrices) {
    const envKey = `PRICE_${p.lookupKey.toUpperCase()}`;
    console.log(`${envKey}=${p.id}`);
  }
  const addonPrices = created.prices.filter((p) => p.lookupKey.startsWith('addon_'));
  for (const p of addonPrices) {
    const envKey = `PRICE_${p.lookupKey.toUpperCase()}`;
    console.log(`${envKey}=${p.id}`);
  }
  console.log(`STRIPE_PORTAL_CONFIG_ID=${created.portal}`);
  if (created.webhook) {
    console.log(`STRIPE_WEBHOOK_SECRET=${created.webhook.secret}`);
  }

  return created;
}

/**
 * Build the products array for portal subscription_update.
 * Groups prices by membership tier for upgrade/downgrade.
 */
function buildPortalProducts(recurringPriceIds) {
  // For portal subscription_update, we group all membership prices together
  // so users can switch between tiers, and each add-on is its own product.
  // Since we don't know product IDs ahead of time, we return a single group
  // containing all recurring prices — Stripe will figure out which are switchable.
  // In production you'd separate memberships from add-ons.
  return [
    {
      product: '__placeholder__', // will be replaced below
      prices: recurringPriceIds,
    },
  ];
}

// Override: we need actual product IDs for portal config. Refactor seed to handle this.
// The portal products config requires actual product IDs. We'll build it properly.

async function seedWithPortalFix(stripe) {
  heading('SEED — Creating NovaWork Stripe catalog');

  const appUrl = process.env.APP_URL || 'http://localhost:5173';
  const webhookUrl = process.env.WEBHOOK_URL;
  const created = { products: [], prices: [], portal: null, webhook: null };
  const membershipProductPrices = []; // { productId, priceId }[]
  const addonRecurringProductPrices = []; // { productId, priceId }[]

  async function createProductAndPrice({ name, description, lookupKey, unitAmount, interval, metadata }) {
    const product = await stripe.products.create({
      name,
      description,
      metadata,
    });
    log('📦', `Created product: ${product.id} — ${name}`);

    const priceParams = {
      product: product.id,
      currency: 'usd',
      unit_amount: unitAmount,
      lookup_key: lookupKey,
      transfer_lookup_key: true,
      metadata,
    };

    if (interval) {
      priceParams.recurring = { interval };
    }

    const price = await stripe.prices.create(priceParams);
    log('💰', `Created price: ${price.id} — ${lookupKey} ($${(unitAmount / 100).toFixed(2)}${interval ? '/' + interval : ' one-time'})`);

    created.products.push({ id: product.id, name });
    created.prices.push({ id: price.id, lookupKey, unitAmount, interval });

    return { product, price };
  }

  // ── Create memberships ──
  log('🏗️', 'Creating membership products and prices...');
  for (const membership of PRODUCTS) {
    const { product, price } = await createProductAndPrice(membership);
    membershipProductPrices.push({ productId: product.id, priceId: price.id });
  }

  // ── Create add-ons ──
  log('🏗️', 'Creating add-on products and prices...');
  for (const addon of ADDONS) {
    const { product, price } = await createProductAndPrice(addon);
    if (addon.interval) {
      addonRecurringProductPrices.push({ productId: product.id, priceId: price.id });
    }
  }

  // ── Customer Portal configuration ──
  log('🚪', 'Creating Customer Portal configuration...');

  // Build portal products: group prices by product for subscription switching
  const portalProducts = [];

  // All membership prices can be switched between each other within their product,
  // but since each membership is a separate product with one price, we group all
  // membership prices under the first product for switching capability.
  // Actually, Stripe portal requires each entry to have a valid product + its prices.
  // For membership tier switching, each product maps to its own price.
  for (const mp of membershipProductPrices) {
    portalProducts.push({
      product: mp.productId,
      prices: [mp.priceId],
    });
  }
  for (const ap of addonRecurringProductPrices) {
    portalProducts.push({
      product: ap.productId,
      prices: [ap.priceId],
    });
  }

  const portalConfig = await stripe.billingPortal.configurations.create({
    business_profile: {
      headline: 'NovaWork — Gestiona tu membresía',
    },
    features: {
      customer_update: {
        enabled: true,
        allowed_updates: ['email', 'name', 'address'],
      },
      payment_method_update: {
        enabled: true,
      },
      invoice_history: {
        enabled: true,
      },
      subscription_cancel: {
        enabled: true,
        mode: 'at_period_end',
        proration_behavior: 'none',
      },
      subscription_update: {
        enabled: true,
        default_allowed_updates: ['price'],
        proration_behavior: 'create_prorations',
        products: portalProducts,
      },
    },
    default_return_url: `${appUrl}/dashboard/billing`,
  });
  created.portal = portalConfig.id;
  log('✅', `Portal config created: ${portalConfig.id}`);

  // ── Webhook endpoint (optional) ──
  if (webhookUrl) {
    log('🔗', `Creating webhook endpoint at ${webhookUrl}...`);
    const webhook = await stripe.webhookEndpoints.create({
      url: webhookUrl,
      enabled_events: [
        'checkout.session.completed',
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'invoice.paid',
        'invoice.payment_failed',
        'customer.updated',
      ],
      metadata: { source: 'novawork-bootstrap' },
    });
    created.webhook = { id: webhook.id, secret: webhook.secret };
    log('✅', `Webhook created: ${webhook.id}`);
    log('🔑', `Webhook signing secret: ${webhook.secret}`);
    log('⚠️', 'Save this secret to STRIPE_WEBHOOK_SECRET in your .env file!');
  } else {
    log('ℹ️', 'WEBHOOK_URL not set — skipping webhook creation.');
    log('ℹ️', 'For local dev, use: stripe listen --forward-to http://localhost:5001/api/stripe/webhook');
  }

  // ── Summary ──
  heading('SEED COMPLETE — Created Objects Summary');

  console.log('Products:');
  console.log('─'.repeat(60));
  for (const p of created.products) {
    console.log(`  ${p.id}  ${p.name}`);
  }

  console.log('\nPrices (use lookup_keys in your code):');
  console.log('─'.repeat(60));
  for (const p of created.prices) {
    const priceStr = `$${(p.unitAmount / 100).toFixed(2)}${p.interval ? '/' + p.interval : ' one-time'}`;
    console.log(`  ${p.id}  ${p.lookupKey.padEnd(30)} ${priceStr}`);
  }

  console.log('\nPortal Configuration:');
  console.log('─'.repeat(60));
  console.log(`  ${created.portal}`);

  if (created.webhook) {
    console.log('\nWebhook:');
    console.log('─'.repeat(60));
    console.log(`  ID:     ${created.webhook.id}`);
    console.log(`  Secret: ${created.webhook.secret}`);
  }

  console.log('\n── Copy these to your .env ──');
  console.log('─'.repeat(60));
  const membershipPrices = created.prices.filter((p) => p.lookupKey.startsWith('membership_'));
  for (const p of membershipPrices) {
    const envKey = `PRICE_${p.lookupKey.toUpperCase()}`;
    console.log(`${envKey}=${p.id}`);
  }
  const addonPrices = created.prices.filter((p) => p.lookupKey.startsWith('addon_'));
  for (const p of addonPrices) {
    const envKey = `PRICE_${p.lookupKey.toUpperCase()}`;
    console.log(`${envKey}=${p.id}`);
  }
  console.log(`STRIPE_PORTAL_CONFIG_ID=${created.portal}`);
  if (created.webhook) {
    console.log(`STRIPE_WEBHOOK_SECRET=${created.webhook.secret}`);
  }

  return created;
}

// ── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  const mode = process.argv[2]?.toLowerCase();

  if (!['cleanup', 'seed', 'bootstrap'].includes(mode)) {
    console.log(`
Usage: node scripts/stripe-sandbox-bootstrap.mjs <mode>

Modes:
  cleanup    — Archive/delete all test-mode objects
  seed       — Create products, prices, portal config, and webhook
  bootstrap  — Run cleanup + seed sequentially
`);
    process.exit(1);
  }

  const stripe = getStripe();

  // Verify connectivity + test mode
  try {
    const balance = await stripe.balance.retrieve();
    log('✅', `Connected to Stripe (test mode). Available balance: ${balance.available.map((b) => `${b.amount} ${b.currency}`).join(', ') || '0'}`);
  } catch (err) {
    console.error(`ERROR: Could not connect to Stripe: ${err.message}`);
    process.exit(1);
  }

  const startTime = Date.now();

  switch (mode) {
    case 'cleanup':
      await cleanup(stripe);
      break;
    case 'seed':
      await seedWithPortalFix(stripe);
      break;
    case 'bootstrap':
      await cleanup(stripe);
      await seedWithPortalFix(stripe);
      break;
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  log('🏁', `Done in ${elapsed}s`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
