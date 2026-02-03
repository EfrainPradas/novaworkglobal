# Stripe Setup Guide - CareerTipsAI

**Last Updated:** November 18, 2025
**Status:** ✅ API Keys Configured

---

## 🎉 Current Status

Stripe API keys have been configured:
- ✅ **Publishable Key:** `pk_test_51QNdXiGIr6GElf09...` (Frontend)
- ✅ **Secret Key:** `sk_test_51QNdXiGIr6GElf09...` (Backend)
- ✅ **Mode:** Test Mode (safe for development)

---

## 📋 Table of Contents

1. [Stripe Account Configuration](#1-stripe-account-configuration)
2. [API Keys Management](#2-api-keys-management)
3. [Product & Price Configuration](#3-product--price-configuration)
4. [Webhook Setup](#4-webhook-setup)
5. [Customer Portal](#5-customer-portal)
6. [Testing with Test Cards](#6-testing-with-test-cards)
7. [Frontend Integration](#7-frontend-integration)
8. [Backend Integration](#8-backend-integration)
9. [Production Checklist](#9-production-checklist)

---

## 1. Stripe Account Configuration

### Initial Setup (Already Complete)

Your Stripe account is set up and in **Test Mode**. This allows you to:
- ✅ Test payment flows without real money
- ✅ Use test credit card numbers
- ✅ Simulate successful and failed payments
- ✅ Test webhooks locally

### Access Your Dashboard

**Stripe Dashboard:** https://dashboard.stripe.com

**Test Mode vs Live Mode:**
- 🧪 **Test Mode** (current): Uses test API keys, no real charges
- 💰 **Live Mode** (production): Uses live API keys, real charges

Toggle between modes in the top-right corner of the dashboard.

---

## 2. API Keys Management

### Current Keys (Test Mode)

**Publishable Key** (safe for frontend):
```
pk_test_51QNdXiGIr6GElf09Kep5QOxkbDuGqLqGJv96dDRgTKn5tLRW0RzWaUZRn62H8NQhJ2pU0vQMU91ZGgWI4AcVs0J300BWhL10q4
```

**Secret Key** (backend only):
```
sk_test_51QNdXiGIr6GElf09VDI7hV28vzUuYjvH9UYabg_EF0rpb0C
```

### Where Keys Are Stored

**Frontend** (`.env.local`):
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51QNdXiGIr6GElf09...
```

**Backend** (`.env.backend`):
```bash
STRIPE_SECRET_KEY=sk_test_51QNdXiGIr6GElf09...
```

### Security Best Practices

- ✅ Publishable key can be exposed in frontend (safe)
- ❌ Secret key must NEVER be exposed to frontend
- ✅ Both files are in `.gitignore` (won't be committed)
- ⚠️ Rotate keys every 90 days
- ⚠️ Use different keys for production

### Getting Live Keys (For Production)

1. Complete Stripe account verification
2. Toggle to **Live Mode** in dashboard
3. Go to **Developers → API keys**
4. Copy **Live publishable key** and **Live secret key**
5. Store in production environment variables

---

## 3. Product & Price Configuration

### CareerTipsAI Subscription Plans

You need to create these products in Stripe Dashboard:

#### 3.1 Create Products

Go to: **Products → Add Product**

**Product 1: Free Trial**
- Name: `CareerTipsAI - Free Trial`
- Description: `7-day free trial with limited features`
- Price: `$0.00` for 7 days

**Product 2: Basic Plan**
- Name: `CareerTipsAI - Basic`
- Description: `Essential tools for job seekers`
- Price: `$29/month` or `$290/year` (save $58)
- Features: Resume builder, 10 AI applications/month, basic interview prep

**Product 3: Pro Plan**
- Name: `CareerTipsAI - Pro`
- Description: `Full automation + unlimited AI assistance`
- Price: `$79/month` or `$790/year` (save $158)
- Features: Unlimited AI applications, advanced analytics, coaching access

**Product 4: Enterprise Plan**
- Name: `CareerTipsAI - Enterprise`
- Description: `Custom solutions for institutions`
- Price: Custom pricing (contact sales)
- Features: Everything + white-labeling, dedicated support, custom integrations

#### 3.2 Create Prices

For each product, create multiple price points:

**Billing Intervals:**
- Monthly (recurring)
- Yearly (recurring, with discount)

**Example for Basic Plan:**
```javascript
// Monthly
{
  unit_amount: 2900,        // $29.00 in cents
  currency: 'usd',
  recurring: {
    interval: 'month',
    interval_count: 1
  }
}

// Yearly (17% discount)
{
  unit_amount: 29000,       // $290.00 in cents
  currency: 'usd',
  recurring: {
    interval: 'year',
    interval_count: 1
  }
}
```

#### 3.3 Save Price IDs

After creating prices, save the IDs:

**Test Mode Price IDs** (example format):
```bash
# Basic Plan
STRIPE_PRICE_BASIC_MONTHLY=price_1ABCDEFGHijklmnop
STRIPE_PRICE_BASIC_YEARLY=price_1ABCDEFGHijklmnop

# Pro Plan
STRIPE_PRICE_PRO_MONTHLY=price_1ABCDEFGHijklmnop
STRIPE_PRICE_PRO_YEARLY=price_1ABCDEFGHijklmnop
```

Add these to `.env.backend` for backend access.

---

## 4. Webhook Setup

Webhooks notify your backend when Stripe events occur (payment success, subscription canceled, etc.).

### 4.1 Webhook Events to Listen For

**Critical Events:**
- `checkout.session.completed` - Payment successful
- `customer.subscription.created` - New subscription
- `customer.subscription.updated` - Subscription changed
- `customer.subscription.deleted` - Subscription canceled
- `invoice.payment_succeeded` - Recurring payment success
- `invoice.payment_failed` - Payment failed

### 4.2 Create Webhook Endpoint

**For Development (Local Testing):**

1. Install Stripe CLI:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Linux
   curl -s https://packages.stripe.com/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
   echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.com/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
   sudo apt update
   sudo apt install stripe
   ```

2. Login to Stripe CLI:
   ```bash
   stripe login
   ```

3. Forward webhooks to local server:
   ```bash
   stripe listen --forward-to http://localhost:5000/api/webhooks/stripe
   ```

4. Copy webhook signing secret:
   ```bash
   # Output will show: whsec_xxxxxxxxxxxxx
   # Add to .env.backend:
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

**For Production:**

1. Go to **Developers → Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. Enter URL: `https://api.careertipsai.com/webhooks/stripe`
4. Select events to listen for (see list above)
5. Copy **Signing secret** to production environment

### 4.3 Webhook Handler (Backend)

Example webhook handler using Supabase Edge Functions:

```typescript
// supabase/functions/stripe-webhook/index.ts
import Stripe from 'stripe'
import { serve } from 'std/server'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
})

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')!
  const body = await req.text()

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    )

    // Handle event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object)
        break
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
    })
  } catch (err) {
    return new Response(`Webhook error: ${err.message}`, {
      status: 400,
    })
  }
})
```

---

## 5. Customer Portal

Stripe Customer Portal allows users to manage their subscriptions, payment methods, and billing history.

### 5.1 Configure Customer Portal

1. Go to **Settings → Billing → Customer portal**
2. Enable customer portal
3. Configure settings:
   - ✅ Allow customers to update payment method
   - ✅ Allow customers to update billing information
   - ✅ Allow customers to cancel subscription
   - ✅ Show invoice history

4. Customize branding:
   - Logo: Upload CareerTipsAI logo
   - Primary color: `#007bff` (brand blue)
   - Privacy policy URL: `https://careertipsai.com/privacy`
   - Terms of service URL: `https://careertipsai.com/terms`

### 5.2 Generate Portal Link

```typescript
// Backend code to generate portal link
import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

async function createPortalSession(customerId: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: 'https://careertipsai.com/dashboard',
  })

  return session.url
}
```

---

## 6. Testing with Test Cards

Stripe provides test card numbers for different scenarios:

### 6.1 Successful Payments

**Basic successful payment:**
```
Card Number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/34)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

**Requires 3D Secure authentication:**
```
Card Number: 4000 0027 6000 3184
```

### 6.2 Failed Payments

**Generic decline:**
```
Card Number: 4000 0000 0000 0002
```

**Insufficient funds:**
```
Card Number: 4000 0000 0000 9995
```

**Card expired:**
```
Card Number: 4000 0000 0000 0069
```

### 6.3 Other Scenarios

**Charge succeeds and funds are added directly to your available balance:**
```
Card Number: 4000 0000 0000 0077
```

**Full list:** https://stripe.com/docs/testing

---

## 7. Frontend Integration

### 7.1 Install Stripe.js

```bash
npm install @stripe/stripe-js
```

### 7.2 Initialize Stripe

```typescript
// src/lib/stripe.ts
import { loadStripe } from '@stripe/stripe-js'

export const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
)
```

### 7.3 Create Checkout Session

```typescript
// src/components/PricingCard.tsx
import { stripePromise } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'

async function handleSubscribe(priceId: string) {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/signin'
      return
    }

    // Create checkout session via backend
    const { data, error } = await supabase.functions.invoke(
      'create-checkout-session',
      {
        body: {
          priceId,
          userId: user.id,
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/pricing?canceled=true`,
        },
      }
    )

    if (error) throw error

    // Redirect to Stripe Checkout
    const stripe = await stripePromise
    const { error: stripeError } = await stripe!.redirectToCheckout({
      sessionId: data.sessionId,
    })

    if (stripeError) throw stripeError
  } catch (error) {
    console.error('Error creating checkout session:', error)
    alert('Failed to start checkout. Please try again.')
  }
}
```

### 7.4 Pricing Page Example

```typescript
// src/pages/Pricing.tsx
export default function Pricing() {
  const plans = [
    {
      name: 'Basic',
      price: '$29',
      interval: 'month',
      priceId: 'price_1ABCDEFGHijklmnop',
      features: [
        'Resume builder',
        '10 AI applications/month',
        'Basic interview prep',
        'Email support',
      ],
    },
    {
      name: 'Pro',
      price: '$79',
      interval: 'month',
      priceId: 'price_1ABCDEFGHijklmnop',
      features: [
        'Everything in Basic',
        'Unlimited AI applications',
        'Advanced analytics',
        'Coaching access',
        'Priority support',
      ],
      popular: true,
    },
  ]

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {plans.map((plan) => (
        <div key={plan.name} className="border rounded-lg p-6">
          {plan.popular && (
            <span className="bg-primary text-white px-3 py-1 rounded-full text-sm">
              Most Popular
            </span>
          )}
          <h3 className="text-2xl font-bold mt-4">{plan.name}</h3>
          <div className="mt-4">
            <span className="text-4xl font-bold">{plan.price}</span>
            <span className="text-gray-600">/{plan.interval}</span>
          </div>
          <ul className="mt-6 space-y-3">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-center">
                <span className="text-success mr-2">✓</span>
                {feature}
              </li>
            ))}
          </ul>
          <button
            onClick={() => handleSubscribe(plan.priceId)}
            className="w-full mt-8 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-600"
          >
            Subscribe Now
          </button>
        </div>
      ))}
    </div>
  )
}
```

---

## 8. Backend Integration

### 8.1 Create Checkout Session (Edge Function)

```typescript
// supabase/functions/create-checkout-session/index.ts
import Stripe from 'stripe'
import { serve } from 'std/server'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
})

serve(async (req) => {
  try {
    const { priceId, userId, successUrl, cancelUrl } = await req.json()

    // Get or create Stripe customer
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id, email')
      .eq('id', userId)
      .single()

    let customerId = user.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId },
      })
      customerId = customer.id

      // Save customer ID
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      metadata: { userId },
    })

    return new Response(
      JSON.stringify({ sessionId: session.id }),
      { status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400 }
    )
  }
})
```

### 8.2 Deploy Edge Function

```bash
# Login to Supabase CLI
supabase login

# Link project
supabase link --project-ref fytyfeapxgswxkecneom

# Set secrets
supabase secrets set STRIPE_SECRET_KEY=sk_test_51QNdXiGIr6GElf09...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...

# Deploy function
supabase functions deploy create-checkout-session
```

---

## 9. Production Checklist

Before going live with real payments:

### 9.1 Stripe Account Activation

- [ ] Complete Stripe account verification
- [ ] Provide business information
- [ ] Set up bank account for payouts
- [ ] Verify tax information

### 9.2 Product Configuration

- [ ] Create products in Live Mode
- [ ] Set correct pricing (match Test Mode)
- [ ] Configure billing intervals (monthly/yearly)
- [ ] Set up trial periods if applicable

### 9.3 API Keys

- [ ] Generate Live API keys
- [ ] Update production `.env` with live keys
- [ ] Rotate test keys (security best practice)
- [ ] Store keys securely (AWS Secrets Manager, etc.)

### 9.4 Webhooks

- [ ] Create webhook endpoint in Live Mode
- [ ] Point to production URL
- [ ] Select all necessary events
- [ ] Save webhook signing secret
- [ ] Test webhook delivery

### 9.5 Customer Portal

- [ ] Configure portal settings for Live Mode
- [ ] Upload production logo
- [ ] Set correct URLs (privacy, terms, return)
- [ ] Test portal as customer

### 9.6 Tax Configuration

- [ ] Enable Stripe Tax (automatic tax calculation)
- [ ] Configure tax behavior per product
- [ ] Set up tax ID collection if required

### 9.7 Security

- [ ] Enable fraud prevention (Stripe Radar)
- [ ] Set up 3D Secure authentication
- [ ] Configure decline handling
- [ ] Set up email notifications

### 9.8 Testing in Production

- [ ] Make test purchase with live keys (and refund)
- [ ] Verify webhook delivery
- [ ] Test subscription lifecycle (create, update, cancel)
- [ ] Verify database updates correctly

### 9.9 Monitoring

- [ ] Set up Stripe Dashboard notifications
- [ ] Configure alerts for failed payments
- [ ] Monitor subscription churn
- [ ] Track revenue metrics

### 9.10 Legal

- [ ] Update Terms of Service with subscription terms
- [ ] Update Privacy Policy with payment info handling
- [ ] Create Refund Policy
- [ ] Display pricing clearly with all fees

---

## 📊 Subscription Plans Summary

| Plan | Monthly | Yearly | Features | Target User |
|------|---------|--------|----------|-------------|
| **Free Trial** | $0 | - | Limited access, 7 days | New users |
| **Basic** | $29 | $290 (17% off) | 10 AI apps/month, basic tools | Job seekers |
| **Pro** | $79 | $790 (17% off) | Unlimited AI, advanced features | Active job seekers |
| **Enterprise** | Custom | Custom | Everything + custom integration | Institutions |

---

## 🔗 Useful Links

- **Stripe Dashboard:** https://dashboard.stripe.com
- **API Documentation:** https://stripe.com/docs/api
- **Testing Guide:** https://stripe.com/docs/testing
- **Webhooks Guide:** https://stripe.com/docs/webhooks
- **Customer Portal:** https://stripe.com/docs/billing/subscriptions/customer-portal
- **Stripe CLI:** https://stripe.com/docs/stripe-cli

---

## 📞 Support

**Stripe Support:**
- Email: support@stripe.com
- Dashboard: Click "?" icon in top-right

**CareerTipsAI Integration:**
- See: `/home/efraiprada/carreerstips/.env.backend`
- See: `/home/efraiprada/carreerstips/frontend/.env.local`

---

**Prepared by:** Claude Code
**Date:** November 18, 2025
**Status:** ✅ API Keys Configured - Ready for Product Setup
