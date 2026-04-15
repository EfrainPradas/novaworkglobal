/**
 * Billing Routes — Stripe integration
 *
 * POST /api/billing/create-checkout-session   — membership subscription
 * POST /api/billing/create-addon-session      — one-time addon (session 1:1)
 * POST /api/billing/create-portal-session     — customer portal
 * POST /api/billing/webhook                   — Stripe webhook (no auth)
 * GET  /api/billing/status                    — current user billing status
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { supabaseAdmin } from '../services/supabase.js';
import { stripe, PORTAL_CONFIG_ID, WEBHOOK_SECRET, getOrCreateStripeCustomer } from '../services/stripe.js';

const router = Router();

// ─── Guard: ensure Stripe is configured ──────────────────────────────────────
function ensureStripe(req, res, next) {
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe not configured' });
  }
  next();
}

// ─── Stage 3: Create Membership Checkout Session ─────────────────────────────
router.post('/create-checkout-session', requireAuth, ensureStripe, async (req, res) => {
  try {
    const { priceId, successUrl, cancelUrl } = req.body;
    const userId = req.user.id;
    const email = req.user.email;

    console.log(`🛒 [CHECKOUT] Started — user: ${email} (${userId}), priceId: ${priceId}`);

    if (!priceId) {
      console.log('🛒 [CHECKOUT] ❌ Missing priceId');
      return res.status(400).json({ error: 'priceId is required' });
    }

    // Validate price exists in our catalog as a membership or recurring addon
    const { data: catalogEntry } = await supabaseAdmin
      .from('billing_price_catalog')
      .select('code, item_type, display_name')
      .eq('stripe_price_id', priceId)
      .single();

    if (!catalogEntry || (catalogEntry.item_type !== 'membership' && catalogEntry.item_type !== 'addon_recurring')) {
      console.log(`🛒 [CHECKOUT] ❌ Invalid priceId: ${priceId} — not found or wrong type`);
      return res.status(400).json({ error: 'Invalid subscription priceId' });
    }

    console.log(`🛒 [CHECKOUT] Plan: ${catalogEntry.display_name} (${catalogEntry.code}, ${catalogEntry.item_type})`);

    const isMembership = catalogEntry.item_type === 'membership';

    // Check if user already has an active membership (only block for membership purchases)
    if (isMembership) {
      const { data: existingAccess } = await supabaseAdmin
        .from('billing_access')
        .select('membership_code, subscription_status')
        .eq('user_id', userId)
        .single();

      if (existingAccess?.is_active && existingAccess?.subscription_status === 'active') {
        console.log(`🛒 [CHECKOUT] ❌ User already has active plan: ${existingAccess.membership_code}`);
        return res.status(409).json({
          error: 'Active membership exists. Use the customer portal to change plans.',
          currentPlan: existingAccess.membership_code,
        });
      }
    }

    // Get or create Stripe customer
    const stripeCustomerId = await getOrCreateStripeCustomer(
      supabaseAdmin, userId, email, req.user.metadata?.full_name
    );
    console.log(`🛒 [CHECKOUT] Stripe customer: ${stripeCustomerId}`);

    const appUrl = process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || `${appUrl}/dashboard?welcome=true`,
      cancel_url: cancelUrl || `${appUrl}/dashboard/billing?status=canceled`,
      subscription_data: {
        description: catalogEntry.display_name,
        metadata: {
          user_id: userId,
          tier: catalogEntry.code,
          type: isMembership ? 'membership' : 'addon_recurring',
        },
      },
      metadata: {
        user_id: userId,
        type: isMembership ? 'membership' : 'addon_recurring',
      },
      allow_promotion_codes: true,
    });

    console.log(`🛒 [CHECKOUT] ✅ Session created: ${session.id} — redirecting to Stripe`);
    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('🛒 [CHECKOUT] ❌ Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ─── Stage 4: Create One-Time Addon Session (Session 1:1) ───────────────────
router.post('/create-addon-session', requireAuth, ensureStripe, async (req, res) => {
  try {
    const { priceId, successUrl, cancelUrl } = req.body;
    const userId = req.user.id;
    const email = req.user.email;

    console.log(`🛒 [ADDON] Started — user: ${email} (${userId}), priceId: ${priceId}`);

    if (!priceId) {
      return res.status(400).json({ error: 'priceId is required' });
    }

    // Validate price exists in catalog as one-time addon
    const { data: catalogEntry } = await supabaseAdmin
      .from('billing_price_catalog')
      .select('code, item_type, display_name')
      .eq('stripe_price_id', priceId)
      .single();

    if (!catalogEntry || catalogEntry.item_type !== 'addon_one_time') {
      console.log(`🛒 [ADDON] ❌ Invalid priceId: ${priceId}`);
      return res.status(400).json({ error: 'Invalid one-time addon priceId' });
    }

    console.log(`🛒 [ADDON] Product: ${catalogEntry.display_name} (${catalogEntry.code})`);

    const stripeCustomerId = await getOrCreateStripeCustomer(
      supabaseAdmin, userId, email, req.user.metadata?.full_name
    );
    console.log(`🛒 [ADDON] Stripe customer: ${stripeCustomerId}`);

    const appUrl = process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || `${appUrl}/dashboard?welcome=true`,
      cancel_url: cancelUrl || `${appUrl}/dashboard/billing?status=canceled`,
      payment_intent_data: {
        description: catalogEntry.display_name,
        metadata: {
          user_id: userId,
          code: catalogEntry.code,
          type: 'addon_one_time',
        },
      },
      metadata: {
        user_id: userId,
        type: 'addon_one_time',
        code: catalogEntry.code,
      },
    });

    console.log(`🛒 [ADDON] ✅ Session created: ${session.id}`);
    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('🛒 [ADDON] ❌ Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ─── Stage 5: Create Portal Session ─────────────────────────────────────────
router.post('/create-portal-session', requireAuth, ensureStripe, async (req, res) => {
  try {
    const userId = req.user.id;
    const email = req.user.email;
    const { returnUrl } = req.body;

    console.log(`🔧 [PORTAL] Opening portal — user: ${email} (${userId})`);

    const { data: customer } = await supabaseAdmin
      .from('billing_customers')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (!customer?.stripe_customer_id) {
      console.log(`🔧 [PORTAL] ❌ No billing customer found for ${email}`);
      return res.status(404).json({ error: 'No billing account found. Subscribe to a plan first.' });
    }

    const appUrl = process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173';

    const portalParams = {
      customer: customer.stripe_customer_id,
      return_url: returnUrl || `${appUrl}/dashboard/billing`,
    };

    if (PORTAL_CONFIG_ID) {
      portalParams.configuration = PORTAL_CONFIG_ID;
    }

    const session = await stripe.billingPortal.sessions.create(portalParams);
    console.log(`🔧 [PORTAL] ✅ Session created for ${email}`);

    res.json({ url: session.url });
  } catch (error) {
    console.error('🔧 [PORTAL] ❌ Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ─── Billing Status ──────────────────────────────────────────────────────────
router.get('/status', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: access } = await supabaseAdmin
      .from('billing_access')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!access) {
      return res.json({
        is_active: false,
        membership_code: null,
        subscription_status: null,
        cancel_at_period_end: false,
        current_period_end: null,
        has_coaching_email: false,
        has_coach_plus_email: false,
        email_credits_available: 0,
        session_credits_available: 0,
      });
    }

    res.json(access);
  } catch (error) {
    console.error('❌ billing status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─── Payment History ─────────────────────────────────────────────────────────
router.get('/history', requireAuth, ensureStripe, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get Stripe customer ID
    const { data: customer } = await supabaseAdmin
      .from('billing_customers')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (!customer?.stripe_customer_id) {
      return res.json({ payments: [] });
    }

    // Fetch charges from Stripe (includes both subscription and one-time)
    const charges = await stripe.charges.list({
      customer: customer.stripe_customer_id,
      limit: 50,
    });

    // Build catalog lookups: by amount (for all) and by amount+type (for disambiguation)
    const { data: catalog } = await supabaseAdmin
      .from('billing_price_catalog')
      .select('stripe_price_id, display_name, item_type, unit_amount');
    const catalogByAmount = {};
    for (const p of catalog || []) {
      if (!catalogByAmount[p.unit_amount]) catalogByAmount[p.unit_amount] = [];
      catalogByAmount[p.unit_amount].push(p);
    }

    const payments = charges.data.map((charge) => {
      const isSubscription = !!charge.invoice;

      // Always resolve description from our catalog by amount
      let description = null;
      const candidates = catalogByAmount[charge.amount];
      if (candidates?.length === 1) {
        description = candidates[0].display_name;
      } else if (candidates?.length > 1) {
        // Multiple products at same price — pick by type
        const match = candidates.find((c) =>
          isSubscription ? c.item_type === 'membership' || c.item_type === 'addon_recurring'
                         : c.item_type === 'addon_one_time'
        );
        description = match?.display_name || candidates[0].display_name;
      }

      // Fallback to Stripe's description if catalog didn't match
      if (!description) {
        const raw = charge.description || '';
        description = raw.startsWith('pi_') ? null : raw;
      }
      if (!description) {
        description = isSubscription ? 'Subscription' : 'One-time purchase';
      }

      return {
        id: charge.id,
        amount: charge.amount,
        currency: charge.currency,
        status: charge.status,
        description,
        created: charge.created,
        payment_method_brand: charge.payment_method_details?.card?.brand || null,
        payment_method_last4: charge.payment_method_details?.card?.last4 || null,
        receipt_url: charge.receipt_url || null,
        refunded: charge.refunded,
        invoice_id: charge.invoice || null,
        failure_code: charge.failure_code || null,
        failure_message: charge.failure_message || null,
        outcome_reason: charge.outcome?.reason || null,
        outcome_type: charge.outcome?.type || null,
      };
    });

    res.json({ payments });
  } catch (error) {
    console.error('❌ billing history error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─── Stage 6: Stripe Webhook ─────────────────────────────────────────────────
// IMPORTANT: This route must receive the raw body for signature verification.
// It is mounted separately in server.js with express.raw() middleware.
router.post('/webhook', async (req, res) => {
  let event;

  console.log('📨 Webhook received:', {
    contentType: req.headers['content-type'],
    hasSignature: !!req.headers['stripe-signature'],
    bodyType: typeof req.body,
    bodyLength: req.body?.length || JSON.stringify(req.body)?.length,
  });

  // Verify webhook signature
  if (WEBHOOK_SECRET) {
    const sig = req.headers['stripe-signature'];
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET);
      console.log('✅ Webhook signature verified');
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message, { hasSig: !!sig, sigPreview: sig?.substring(0, 30) });
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }
  } else {
    // No secret configured — reject in production, allow in dev only
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ STRIPE_WEBHOOK_SECRET not configured in production — rejecting webhook');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }
    try {
      event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      console.warn('⚠️  Webhook signature verification skipped (dev mode, no STRIPE_WEBHOOK_SECRET)');
    } catch (err) {
      return res.status(400).json({ error: 'Invalid payload' });
    }
  }

  // Idempotency check: skip if already processed
  const { data: existingEvent } = await supabaseAdmin
    .from('billing_webhook_events')
    .select('id, processed')
    .eq('stripe_event_id', event.id)
    .single();

  if (existingEvent?.processed) {
    console.log(`⏭️  Webhook ${event.id} already processed, skipping.`);
    return res.json({ received: true, skipped: true });
  }

  // Log event before processing
  await supabaseAdmin.from('billing_webhook_events').upsert({
    stripe_event_id: event.id,
    event_type: event.type,
    livemode: event.livemode,
    api_version: event.api_version,
    object_id: event.data?.object?.id || null,
    payload: event,
    processed: false,
  }, { onConflict: 'stripe_event_id' });

  try {
    console.log(`🔔 Processing webhook: ${event.type} (${event.id}) — object: ${event.data?.object?.id}`);

    switch (event.type) {
      case 'checkout.session.completed':
        console.log('💳 Checkout completed:', { mode: event.data.object.mode, customer: event.data.object.customer, subscription: event.data.object.subscription });
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        console.log('📋 Subscription upsert:', { id: event.data.object.id, status: event.data.object.status, customer: event.data.object.customer });
        await handleSubscriptionUpsert(event.data.object);
        break;

      case 'customer.subscription.deleted':
        console.log('🗑️ Subscription deleted:', { id: event.data.object.id, customer: event.data.object.customer });
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.paid':
        console.log('💰 Invoice paid:', { id: event.data.object.id, subscription: event.data.object.subscription, total: event.data.object.total });
        await handleInvoicePaid(event.data.object);
        break;

      case 'invoice.payment_failed':
        console.log('⚠️ Invoice payment failed:', { id: event.data.object.id, subscription: event.data.object.subscription });
        await handleInvoicePaymentFailed(event.data.object);
        break;

      case 'customer.updated':
        console.log('👤 Customer updated:', { id: event.data.object.id });
        await handleCustomerUpdated(event.data.object);
        break;

      default:
        console.log(`ℹ️  Unhandled webhook event: ${event.type}`);
    }

    // Mark as processed
    await supabaseAdmin
      .from('billing_webhook_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('stripe_event_id', event.id);

  } catch (error) {
    console.error(`❌ Webhook handler error for ${event.type}:`, error);
    await supabaseAdmin
      .from('billing_webhook_events')
      .update({ processing_error: error.message })
      .eq('stripe_event_id', event.id);
  }

  // Always return 200 to Stripe so it doesn't retry
  res.json({ received: true });
});

// ─── Webhook Handlers ────────────────────────────────────────────────────────

async function handleCheckoutCompleted(session) {
  const userId = session.metadata?.user_id;
  if (!userId) {
    console.warn('⚠️  checkout.session.completed without user_id metadata');
    return;
  }

  if (session.mode === 'payment' && session.metadata?.type === 'addon_one_time') {
    // One-time purchase (e.g., session 1:1)
    const code = session.metadata.code || 'session_1on1';
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    const firstItem = lineItems.data[0];

    await supabaseAdmin.from('billing_one_time_purchases').upsert({
      user_id: userId,
      stripe_customer_id: session.customer,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent,
      stripe_price_id: firstItem?.price?.id || '',
      stripe_product_id: firstItem?.price?.product || null,
      code,
      quantity: firstItem?.quantity || 1,
      unit_amount: firstItem?.amount_total || 0,
      currency: session.currency || 'usd',
      payment_status: session.payment_status,
      is_test_mode: !session.livemode,
    }, { onConflict: 'stripe_checkout_session_id' });

    // Create session credit entitlement
    await supabaseAdmin.from('service_entitlements').insert({
      user_id: userId,
      source_type: 'one_time_purchase',
      source_ref: session.id,
      session_credits_allocated: 1,
      is_active: true,
    });

    // Recalculate access
    await supabaseAdmin.rpc('recalculate_billing_access', { p_user_id: userId });

    console.log(`✅ One-time purchase recorded for user ${userId}: ${code}`);
  }

  // Subscription checkouts are handled by customer.subscription.created
}

async function handleSubscriptionUpsert(subscription) {
  const customerId = subscription.customer;
  const userId = subscription.metadata?.user_id
    || (await resolveUserId(customerId));

  if (!userId) {
    console.warn(`⚠️  subscription ${subscription.id} — could not resolve user_id`);
    return;
  }

  // Upsert the subscription record
  await supabaseAdmin.from('billing_subscriptions').upsert({
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    status: subscription.status,
    cancel_at_period_end: subscription.cancel_at_period_end,
    cancel_at: toISO(subscription.cancel_at),
    canceled_at: toISO(subscription.canceled_at),
    ended_at: toISO(subscription.ended_at),
    current_period_start: toISO(subscription.current_period_start),
    current_period_end: toISO(subscription.current_period_end),
    latest_invoice_id: subscription.latest_invoice || null,
    collection_method: subscription.collection_method,
    currency: subscription.currency,
    is_test_mode: !subscription.livemode,
    raw: subscription,
  }, { onConflict: 'stripe_subscription_id' });

  // Get the internal subscription ID
  const { data: subRow } = await supabaseAdmin
    .from('billing_subscriptions')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (!subRow) return;

  // Upsert each subscription item
  for (const item of subscription.items?.data || []) {
    const priceId = item.price?.id;
    const productId = item.price?.product;

    // Resolve code from catalog
    const { data: catalogEntry } = await supabaseAdmin
      .from('billing_price_catalog')
      .select('code, item_type')
      .eq('stripe_price_id', priceId)
      .single();

    if (!catalogEntry) {
      console.warn(`⚠️  Unknown price ${priceId} in subscription ${subscription.id}`);
      continue;
    }

    await supabaseAdmin.from('billing_subscription_items').upsert({
      user_id: userId,
      billing_subscription_id: subRow.id,
      stripe_subscription_id: subscription.id,
      stripe_subscription_item_id: item.id,
      stripe_price_id: priceId,
      stripe_product_id: productId,
      item_type: catalogEntry.item_type === 'membership' ? 'membership' : 'addon',
      code: catalogEntry.code,
      quantity: item.quantity || 1,
      status: subscription.status === 'active' || subscription.status === 'trialing' ? 'active' : 'inactive',
      currency: item.price?.currency || 'usd',
      unit_amount: item.price?.unit_amount || 0,
      recurring_interval: item.price?.recurring?.interval || null,
      current_period_start: toISO(subscription.current_period_start),
      current_period_end: toISO(subscription.current_period_end),
      is_test_mode: !subscription.livemode,
      raw: item,
    }, { onConflict: 'stripe_subscription_item_id' });
  }

  // Recalculate access snapshot
  await supabaseAdmin.rpc('recalculate_billing_access', { p_user_id: userId });

  console.log(`✅ Subscription ${subscription.id} upserted for user ${userId} (status: ${subscription.status})`);
}

async function handleSubscriptionDeleted(subscription) {
  const customerId = subscription.customer;
  const userId = subscription.metadata?.user_id
    || (await resolveUserId(customerId));

  if (!userId) return;

  // Update subscription status
  await supabaseAdmin
    .from('billing_subscriptions')
    .update({
      status: 'canceled',
      ended_at: toISO(subscription.ended_at) || new Date().toISOString(),
      raw: subscription,
    })
    .eq('stripe_subscription_id', subscription.id);

  // Mark all items as canceled
  await supabaseAdmin
    .from('billing_subscription_items')
    .update({ status: 'canceled' })
    .eq('stripe_subscription_id', subscription.id);

  // Recalculate access
  await supabaseAdmin.rpc('recalculate_billing_access', { p_user_id: userId });

  console.log(`✅ Subscription ${subscription.id} canceled for user ${userId}`);
}

async function handleInvoicePaid(invoice) {
  const customerId = invoice.customer;
  const userId = await resolveUserId(customerId);
  if (!userId) return;

  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return; // Not a subscription invoice

  // Resolve membership code from subscription items
  const { data: items } = await supabaseAdmin
    .from('billing_subscription_items')
    .select('code, item_type')
    .eq('stripe_subscription_id', subscriptionId)
    .eq('item_type', 'membership')
    .eq('status', 'active');

  const membershipCode = items?.[0]?.code || null;

  // Create/refresh entitlements for this billing period
  const periodStart = toISO(invoice.period_start) || new Date().toISOString();
  const periodEnd = toISO(invoice.period_end);

  // Deactivate old entitlements for this user's subscription cycle
  await supabaseAdmin
    .from('service_entitlements')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('source_type', 'subscription_cycle');

  // Create fresh entitlement for new period
  // Credit allocation based on tier — customize these values
  const creditMap = {
    esenciales: { email: 0, session: 0 },
    momentum: { email: 3, session: 0 },
    vanguard: { email: 10, session: 1 },
  };
  const credits = creditMap[membershipCode] || { email: 0, session: 0 };

  await supabaseAdmin.from('service_entitlements').insert({
    user_id: userId,
    membership_code: membershipCode,
    period_start: periodStart,
    period_end: periodEnd,
    email_credits_allocated: credits.email,
    session_credits_allocated: credits.session,
    source_type: 'subscription_cycle',
    source_ref: invoice.id,
    is_active: true,
  });

  // Recalculate access
  await supabaseAdmin.rpc('recalculate_billing_access', { p_user_id: userId });

  console.log(`✅ Invoice paid ${invoice.id} — credits refreshed for ${userId} (${membershipCode})`);
}

async function handleInvoicePaymentFailed(invoice) {
  const customerId = invoice.customer;
  const userId = await resolveUserId(customerId);
  if (!userId) return;

  // Update subscription status via latest_invoice_status
  if (invoice.subscription) {
    await supabaseAdmin
      .from('billing_subscriptions')
      .update({ latest_invoice_status: 'payment_failed' })
      .eq('stripe_subscription_id', invoice.subscription);
  }

  // Recalculate access (Stripe may have set subscription to past_due)
  await supabaseAdmin.rpc('recalculate_billing_access', { p_user_id: userId });

  console.log(`⚠️  Invoice payment failed ${invoice.id} for user ${userId}`);
}

async function handleCustomerUpdated(customer) {
  const userId = await resolveUserId(customer.id);
  if (!userId) return;

  const updates = {
    email: customer.email,
    full_name: customer.name,
    phone: customer.phone,
  };

  // Try to get default payment method details
  if (customer.invoice_settings?.default_payment_method) {
    try {
      const pm = await stripe.paymentMethods.retrieve(
        customer.invoice_settings.default_payment_method
      );
      if (pm.card) {
        updates.payment_method_brand = pm.card.brand;
        updates.payment_method_last4 = pm.card.last4;
        updates.payment_method_exp_month = pm.card.exp_month;
        updates.payment_method_exp_year = pm.card.exp_year;
      }
    } catch (err) {
      console.warn('⚠️  Could not retrieve payment method:', err.message);
    }
  }

  await supabaseAdmin
    .from('billing_customers')
    .update(updates)
    .eq('stripe_customer_id', customer.id);

  console.log(`✅ Customer ${customer.id} updated for user ${userId}`);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Safely convert a Stripe timestamp (number|string|undefined) to ISO string */
function toISO(val) {
  if (!val) return null;
  if (typeof val === 'number') return new Date(val * 1000).toISOString();
  return new Date(val).toISOString();
}

async function resolveUserId(stripeCustomerId) {
  const { data } = await supabaseAdmin
    .from('billing_customers')
    .select('user_id')
    .eq('stripe_customer_id', stripeCustomerId)
    .single();
  return data?.user_id || null;
}

export default router;
