-- =========================================================
-- NOVAWORK BILLING SCHEMA — COMPLETE MIGRATION
-- Supabase / Postgres
-- Run this in the Supabase SQL Editor with service role
-- =========================================================

-- Ensure pgcrypto is available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- 1) updated_at helper trigger function
-- =========================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================================================
-- 2) billing_customers
--    1 auth.users <-> 1 Stripe customer
-- =========================================================
CREATE TABLE IF NOT EXISTS public.billing_customers (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id     TEXT NOT NULL UNIQUE,
  email                  TEXT,
  full_name              TEXT,
  phone                  TEXT,
  -- Payment method snapshot (updated via customer.updated webhook)
  payment_method_brand   TEXT,          -- visa, mastercard, amex
  payment_method_last4   TEXT,
  payment_method_exp_month INTEGER,
  payment_method_exp_year  INTEGER,
  is_test_mode           BOOLEAN NOT NULL DEFAULT true,
  metadata               JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_billing_customers_updated_at
  BEFORE UPDATE ON public.billing_customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_billing_customers_user_id
  ON public.billing_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_customers_stripe_customer_id
  ON public.billing_customers(stripe_customer_id);

-- =========================================================
-- 3) billing_subscriptions
--    Main Stripe subscription record
-- =========================================================
CREATE TABLE IF NOT EXISTS public.billing_subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id      TEXT NOT NULL,
  stripe_subscription_id  TEXT NOT NULL UNIQUE,
  status                  TEXT NOT NULL CHECK (
                            status IN (
                              'incomplete', 'incomplete_expired', 'trialing',
                              'active', 'past_due', 'canceled', 'unpaid', 'paused'
                            )
                          ),
  cancel_at_period_end    BOOLEAN NOT NULL DEFAULT false,
  cancel_at               TIMESTAMPTZ,
  canceled_at             TIMESTAMPTZ,
  ended_at                TIMESTAMPTZ,
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  latest_invoice_id       TEXT,
  latest_invoice_status   TEXT,
  collection_method       TEXT,
  currency                TEXT DEFAULT 'usd',
  is_test_mode            BOOLEAN NOT NULL DEFAULT true,
  raw                     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_billing_subscriptions_updated_at
  BEFORE UPDATE ON public.billing_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_user_id
  ON public.billing_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_customer_id
  ON public.billing_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_status
  ON public.billing_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_period_end
  ON public.billing_subscriptions(current_period_end);

-- =========================================================
-- 4) billing_subscription_items
--    Each line item: 1 membership base + 0..n recurring addons
--    Codes aligned with Stripe product metadata
-- =========================================================
CREATE TABLE IF NOT EXISTS public.billing_subscription_items (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  billing_subscription_id      UUID NOT NULL REFERENCES public.billing_subscriptions(id) ON DELETE CASCADE,
  stripe_subscription_id       TEXT NOT NULL,
  stripe_subscription_item_id  TEXT NOT NULL UNIQUE,
  stripe_price_id              TEXT NOT NULL,
  stripe_product_id            TEXT,
  item_type                    TEXT NOT NULL CHECK (item_type IN ('membership', 'addon')),
  code                         TEXT NOT NULL CHECK (
                                 code IN (
                                   'esenciales', 'momentum', 'vanguard',
                                   'coaching_email', 'coach_plus_email'
                                 )
                               ),
  quantity                     INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  status                       TEXT NOT NULL DEFAULT 'active' CHECK (
                                 status IN ('active', 'inactive', 'canceled')
                               ),
  currency                     TEXT DEFAULT 'usd',
  unit_amount                  INTEGER CHECK (unit_amount >= 0),
  recurring_interval           TEXT CHECK (
                                 recurring_interval IN ('day', 'week', 'month', 'year')
                                 OR recurring_interval IS NULL
                               ),
  current_period_start         TIMESTAMPTZ,
  current_period_end           TIMESTAMPTZ,
  is_test_mode                 BOOLEAN NOT NULL DEFAULT true,
  raw                          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_billing_subscription_items_updated_at
  BEFORE UPDATE ON public.billing_subscription_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_billing_sub_items_user_id
  ON public.billing_subscription_items(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_sub_items_subscription_id
  ON public.billing_subscription_items(billing_subscription_id);
CREATE INDEX IF NOT EXISTS idx_billing_sub_items_type
  ON public.billing_subscription_items(item_type);
CREATE INDEX IF NOT EXISTS idx_billing_sub_items_code
  ON public.billing_subscription_items(code);

-- Enforce: only 1 active membership per user
CREATE UNIQUE INDEX IF NOT EXISTS uq_one_active_membership_per_user
  ON public.billing_subscription_items(user_id)
  WHERE item_type = 'membership' AND status = 'active';

-- =========================================================
-- 5) billing_one_time_purchases
--    For one-time products like Session 1:1
-- =========================================================
CREATE TABLE IF NOT EXISTS public.billing_one_time_purchases (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id           TEXT,
  stripe_checkout_session_id   TEXT UNIQUE,
  stripe_payment_intent_id     TEXT UNIQUE,
  stripe_invoice_id            TEXT,
  stripe_price_id              TEXT NOT NULL,
  stripe_product_id            TEXT,
  code                         TEXT NOT NULL CHECK (code IN ('session_1on1')),
  quantity                     INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_amount                  INTEGER NOT NULL CHECK (unit_amount >= 0),
  currency                     TEXT NOT NULL DEFAULT 'usd',
  payment_status               TEXT CHECK (
                                 payment_status IN (
                                   'requires_payment_method', 'requires_confirmation',
                                   'requires_action', 'processing', 'requires_capture',
                                   'canceled', 'succeeded', 'paid', 'unpaid',
                                   'no_payment_required'
                                 ) OR payment_status IS NULL
                               ),
  fulfilled                    BOOLEAN NOT NULL DEFAULT false,
  fulfilled_at                 TIMESTAMPTZ,
  is_test_mode                 BOOLEAN NOT NULL DEFAULT true,
  raw                          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_billing_one_time_purchases_updated_at
  BEFORE UPDATE ON public.billing_one_time_purchases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_billing_otp_user_id
  ON public.billing_one_time_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_otp_code
  ON public.billing_one_time_purchases(code);
CREATE INDEX IF NOT EXISTS idx_billing_otp_payment_status
  ON public.billing_one_time_purchases(payment_status);

-- =========================================================
-- 6) billing_webhook_events
--    Deduplication + audit trail
-- =========================================================
CREATE TABLE IF NOT EXISTS public.billing_webhook_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id   TEXT NOT NULL UNIQUE,
  event_type        TEXT NOT NULL,
  livemode          BOOLEAN NOT NULL DEFAULT false,
  api_version       TEXT,
  object_id         TEXT,
  processed         BOOLEAN NOT NULL DEFAULT false,
  processed_at      TIMESTAMPTZ,
  processing_error  TEXT,
  payload           JSONB NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Auto-expire after 90 days for cleanup
  expires_at        TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '90 days')
);

CREATE INDEX IF NOT EXISTS idx_billing_webhook_events_event_type
  ON public.billing_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_billing_webhook_events_processed
  ON public.billing_webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_billing_webhook_events_expires_at
  ON public.billing_webhook_events(expires_at);

-- =========================================================
-- 7) service_entitlements
--    What benefits the user has per billing period
-- =========================================================
CREATE TABLE IF NOT EXISTS public.service_entitlements (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  membership_code           TEXT CHECK (
                              membership_code IN ('esenciales', 'momentum', 'vanguard')
                              OR membership_code IS NULL
                            ),
  period_start              TIMESTAMPTZ,
  period_end                TIMESTAMPTZ,
  email_credits_allocated   INTEGER NOT NULL DEFAULT 0 CHECK (email_credits_allocated >= 0),
  email_credits_used        INTEGER NOT NULL DEFAULT 0 CHECK (email_credits_used >= 0),
  session_credits_allocated INTEGER NOT NULL DEFAULT 0 CHECK (session_credits_allocated >= 0),
  session_credits_used      INTEGER NOT NULL DEFAULT 0 CHECK (session_credits_used >= 0),
  source_type               TEXT NOT NULL CHECK (
                              source_type IN ('subscription_cycle', 'one_time_purchase', 'manual_adjustment')
                            ),
  source_ref                TEXT,
  is_active                 BOOLEAN NOT NULL DEFAULT true,
  metadata                  JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_service_entitlements_updated_at
  BEFORE UPDATE ON public.service_entitlements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_service_entitlements_user_id
  ON public.service_entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_service_entitlements_period
  ON public.service_entitlements(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_service_entitlements_active
  ON public.service_entitlements(is_active);

-- =========================================================
-- 8) service_usage_ledger
--    Auditable record of credit consumption
-- =========================================================
CREATE TABLE IF NOT EXISTS public.service_usage_ledger (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entitlement_id   UUID REFERENCES public.service_entitlements(id) ON DELETE SET NULL,
  usage_type       TEXT NOT NULL CHECK (usage_type IN ('email', 'session')),
  quantity         INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  notes            TEXT,
  metadata         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_usage_ledger_user_id
  ON public.service_usage_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_service_usage_ledger_entitlement_id
  ON public.service_usage_ledger(entitlement_id);
CREATE INDEX IF NOT EXISTS idx_service_usage_ledger_usage_type
  ON public.service_usage_ledger(usage_type);
-- Composite index for "usage in current period" queries
CREATE INDEX IF NOT EXISTS idx_service_usage_ledger_user_created
  ON public.service_usage_ledger(user_id, created_at);

-- =========================================================
-- 9) billing_access
--    Fast snapshot for frontend queries
--    Recalculated by recalculate_billing_access() function
-- =========================================================
CREATE TABLE IF NOT EXISTS public.billing_access (
  user_id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active                BOOLEAN NOT NULL DEFAULT false,
  membership_code          TEXT CHECK (
                             membership_code IN ('esenciales', 'momentum', 'vanguard')
                             OR membership_code IS NULL
                           ),
  subscription_status      TEXT,
  cancel_at_period_end     BOOLEAN NOT NULL DEFAULT false,
  current_period_end       TIMESTAMPTZ,
  has_coaching_email       BOOLEAN NOT NULL DEFAULT false,
  has_coach_plus_email     BOOLEAN NOT NULL DEFAULT false,
  email_credits_available  INTEGER NOT NULL DEFAULT 0 CHECK (email_credits_available >= 0),
  session_credits_available INTEGER NOT NULL DEFAULT 0 CHECK (session_credits_available >= 0),
  source                   TEXT NOT NULL DEFAULT 'system',
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_billing_access_updated_at
  BEFORE UPDATE ON public.billing_access
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- 10) billing_price_catalog
--     Maps internal codes to Stripe IDs and lookup_keys
-- =========================================================
CREATE TABLE IF NOT EXISTS public.billing_price_catalog (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code              TEXT NOT NULL UNIQUE CHECK (
                      code IN (
                        'esenciales', 'momentum', 'vanguard',
                        'coaching_email', 'coach_plus_email', 'session_1on1'
                      )
                    ),
  item_type         TEXT NOT NULL CHECK (
                      item_type IN ('membership', 'addon_recurring', 'addon_one_time')
                    ),
  stripe_product_id TEXT,
  stripe_price_id   TEXT,
  lookup_key        TEXT UNIQUE,
  display_name      TEXT NOT NULL,
  unit_amount       INTEGER NOT NULL CHECK (unit_amount >= 0),
  currency          TEXT NOT NULL DEFAULT 'usd',
  active            BOOLEAN NOT NULL DEFAULT true,
  is_test_mode      BOOLEAN NOT NULL DEFAULT true,
  metadata          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_billing_price_catalog_updated_at
  BEFORE UPDATE ON public.billing_price_catalog
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- 11) Seed billing_price_catalog with bootstrap IDs
--     Update stripe_product_id / stripe_price_id after running
--     the bootstrap script if they change
-- =========================================================
INSERT INTO public.billing_price_catalog (code, item_type, stripe_product_id, stripe_price_id, lookup_key, display_name, unit_amount)
VALUES
  ('esenciales',      'membership',      'prod_UILLEZdtduMB4D', 'price_1TJkeqB9dM6cI9Brl3MMbelh', 'membership_esenciales',  'NovaWork Esenciales',  2900),
  ('momentum',        'membership',      'prod_UILLKSoITIlmB2', 'price_1TJkerB9dM6cI9Brr1nVFcR9', 'membership_momentum',    'NovaWork Momentum',    4900),
  ('vanguard',        'membership',      'prod_UILLmX3O7OGwa7', 'price_1TJkerB9dM6cI9Br4B2yknD2', 'membership_vanguard',    'NovaWork Vanguard',   14900),
  ('coaching_email',  'addon_recurring', 'prod_UILLuuPmyMd2VX', 'price_1TJkerB9dM6cI9BrcYi5rA5W', 'addon_coaching_email',   'Coaching por Email',   1900),
  ('coach_plus_email','addon_recurring', 'prod_UILLRcfDTJzCXB', 'price_1TJkesB9dM6cI9Brx9MmBrEu', 'addon_coach_plus_email', 'Coach + Email',        3900),
  ('session_1on1',    'addon_one_time',  'prod_UILL29v0R4npOk', 'price_1TJkesB9dM6cI9BrgcsdsVba', 'addon_session_1on1',     'Sesion 1:1',           7900)
ON CONFLICT (code) DO UPDATE SET
  stripe_product_id = EXCLUDED.stripe_product_id,
  stripe_price_id   = EXCLUDED.stripe_price_id,
  lookup_key        = EXCLUDED.lookup_key,
  display_name      = EXCLUDED.display_name,
  unit_amount       = EXCLUDED.unit_amount,
  updated_at        = now();

-- =========================================================
-- 12) recalculate_billing_access()
--     Called by webhook handler after any subscription change
-- =========================================================
CREATE OR REPLACE FUNCTION public.recalculate_billing_access(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_membership_code      TEXT;
  v_sub_status           TEXT;
  v_cancel_at_period_end BOOLEAN := false;
  v_period_end           TIMESTAMPTZ;
  v_has_coaching_email   BOOLEAN := false;
  v_has_coach_plus_email BOOLEAN := false;
  v_email_credits        INTEGER := 0;
  v_session_credits      INTEGER := 0;
  v_is_active            BOOLEAN := false;
BEGIN
  -- Get active membership
  SELECT bsi.code, bs.status, bs.cancel_at_period_end, bs.current_period_end
    INTO v_membership_code, v_sub_status, v_cancel_at_period_end, v_period_end
    FROM public.billing_subscription_items bsi
    JOIN public.billing_subscriptions bs ON bs.id = bsi.billing_subscription_id
   WHERE bsi.user_id = p_user_id
     AND bsi.item_type = 'membership'
     AND bsi.status = 'active'
     AND bs.status IN ('active', 'trialing', 'past_due')
   ORDER BY bs.created_at DESC
   LIMIT 1;

  -- Is active?
  v_is_active := v_membership_code IS NOT NULL;

  -- Check recurring addons
  SELECT
    COALESCE(bool_or(bsi.code = 'coaching_email'), false),
    COALESCE(bool_or(bsi.code = 'coach_plus_email'), false)
    INTO v_has_coaching_email, v_has_coach_plus_email
    FROM public.billing_subscription_items bsi
    JOIN public.billing_subscriptions bs ON bs.id = bsi.billing_subscription_id
   WHERE bsi.user_id = p_user_id
     AND bsi.item_type = 'addon'
     AND bsi.status = 'active'
     AND bs.status IN ('active', 'trialing', 'past_due');

  -- Calculate available credits from active entitlements
  SELECT
    COALESCE(SUM(email_credits_allocated - email_credits_used), 0),
    COALESCE(SUM(session_credits_allocated - session_credits_used), 0)
    INTO v_email_credits, v_session_credits
    FROM public.service_entitlements
   WHERE user_id = p_user_id
     AND is_active = true
     AND (period_end IS NULL OR period_end > now());

  -- Upsert billing_access
  INSERT INTO public.billing_access (
    user_id, is_active, membership_code, subscription_status,
    cancel_at_period_end, current_period_end,
    has_coaching_email, has_coach_plus_email,
    email_credits_available, session_credits_available,
    source
  ) VALUES (
    p_user_id, v_is_active, v_membership_code, v_sub_status,
    v_cancel_at_period_end, v_period_end,
    v_has_coaching_email, v_has_coach_plus_email,
    GREATEST(v_email_credits, 0), GREATEST(v_session_credits, 0),
    'system'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    is_active                = EXCLUDED.is_active,
    membership_code          = EXCLUDED.membership_code,
    subscription_status      = EXCLUDED.subscription_status,
    cancel_at_period_end     = EXCLUDED.cancel_at_period_end,
    current_period_end       = EXCLUDED.current_period_end,
    has_coaching_email       = EXCLUDED.has_coaching_email,
    has_coach_plus_email     = EXCLUDED.has_coach_plus_email,
    email_credits_available  = EXCLUDED.email_credits_available,
    session_credits_available = EXCLUDED.session_credits_available,
    source                   = EXCLUDED.source;
END;
$$;

-- =========================================================
-- 13) Helper: resolve user_id from stripe_customer_id
-- =========================================================
CREATE OR REPLACE FUNCTION public.get_user_id_from_stripe_customer(p_stripe_customer_id TEXT)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT user_id FROM public.billing_customers
  WHERE stripe_customer_id = p_stripe_customer_id
  LIMIT 1;
$$;

-- =========================================================
-- 14) Helper: resolve code from stripe_price_id
-- =========================================================
CREATE OR REPLACE FUNCTION public.get_billing_code_from_price(p_stripe_price_id TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT code FROM public.billing_price_catalog
  WHERE stripe_price_id = p_stripe_price_id
  LIMIT 1;
$$;

-- =========================================================
-- 15) Quick inspection view
-- =========================================================
CREATE OR REPLACE VIEW public.v_current_billing_state AS
SELECT
  ba.user_id,
  bc.email,
  bc.full_name,
  ba.is_active,
  ba.membership_code,
  ba.subscription_status,
  ba.cancel_at_period_end,
  ba.current_period_end,
  ba.has_coaching_email,
  ba.has_coach_plus_email,
  ba.email_credits_available,
  ba.session_credits_available,
  bc.payment_method_brand,
  bc.payment_method_last4
FROM public.billing_access ba
LEFT JOIN public.billing_customers bc ON bc.user_id = ba.user_id;

-- =========================================================
-- 16) Cleanup cron helper (run manually or via pg_cron)
--     Deletes processed webhook events older than 90 days
-- =========================================================
CREATE OR REPLACE FUNCTION public.cleanup_expired_webhook_events()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.billing_webhook_events
  WHERE processed = true AND expires_at < now();
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- =========================================================
-- 17) RLS — Enable on all billing tables
-- =========================================================
ALTER TABLE public.billing_customers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_subscriptions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_subscription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_one_time_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_entitlements       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_usage_ledger       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_access             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_price_catalog      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_webhook_events     ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- 18) RLS Policies — SELECT only for authenticated users
--     Writes happen via service_role (webhook handler)
-- =========================================================
CREATE POLICY "Users read own billing_customers"
  ON public.billing_customers FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users read own billing_subscriptions"
  ON public.billing_subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users read own billing_subscription_items"
  ON public.billing_subscription_items FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users read own one_time_purchases"
  ON public.billing_one_time_purchases FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users read own entitlements"
  ON public.service_entitlements FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users read own usage_ledger"
  ON public.service_usage_ledger FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users read own billing_access"
  ON public.billing_access FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Price catalog is public read
CREATE POLICY "Anyone can read price_catalog"
  ON public.billing_price_catalog FOR SELECT TO authenticated
  USING (true);

-- Webhook events: no user access (service_role only)
-- No SELECT policy = users cannot read webhook events

-- =========================================================
-- DONE — Schema ready for Stripe webhook integration
-- =========================================================
