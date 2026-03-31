-- ══════════════════════════════════════════════════════════════
-- Kinē: Supabase Database Setup (fresh)
-- Run in Supabase SQL Editor: Dashboard → SQL Editor → New Query
-- ══════════════════════════════════════════════════════════════

-- ── 1. Profiles ─────────────────────────────────────────────
-- One row per user. Created automatically on signup via trigger.
-- Stores auth identity only — personal training data lives in training_data.

CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  name          TEXT DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ── 2. Subscriptions ────────────────────────────────────────
-- Written ONLY by Stripe webhooks (service role).
-- Read by client to check access.

CREATE TABLE public.subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id      TEXT NOT NULL,
  stripe_subscription_id  TEXT,
  status                  TEXT NOT NULL DEFAULT 'inactive',  -- active | past_due | canceled | incomplete | trialing
  plan                    TEXT,                               -- monthly | annual
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  cancel_at_period_end    BOOLEAN DEFAULT false,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- ── 3. Training Data ────────────────────────────────────────
-- Single JSONB row per user. The `data` column stores the full
-- Zustand state snapshot from syncToSupabase() in src/lib/sync.ts.
--
-- The `data` JSONB object contains (among others):
--   goal, exp, equip, days, injuries, cycle, eduFlags, skillPreferences, units,
--   measurementSystem, weekData, weekHistory, progressDB, personalProfile,
--   currentDayIdx, sessionTimeBudgets, sessionLogs, feedbackState, consents
--
-- NOT synced (device-only):
--   devConfig           — dev panel settings
--   IndexedDB photos    — progress photos stay on-device
--   kine_install_dismissed — PWA dismiss timestamp

CREATE TABLE public.training_data (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data        JSONB DEFAULT '{}',
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- ── 3b. Audit Log ──────────────────────────────────────────
-- Append-only table for security events. Written by service role only.
-- No RLS read policies — admin-only via Supabase dashboard or service role.

CREATE TABLE public.audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event       TEXT NOT NULL,
  user_id     UUID,
  ip          TEXT,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
-- No user-facing policies — only service role can read/write

-- Index for querying by event type and time
CREATE INDEX idx_audit_log_event ON public.audit_log (event, created_at DESC);

-- ── 4. Row Level Security ───────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_data ENABLE ROW LEVEL SECURITY;

-- Profiles: users read/update own row
CREATE POLICY "Users read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Subscriptions: users read only; writes via service role (webhooks)
CREATE POLICY "Users read own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Training data: users read/insert/update own
CREATE POLICY "Users read own training data"
  ON public.training_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own training data"
  ON public.training_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own training data"
  ON public.training_data FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own training data"
  ON public.training_data FOR DELETE
  USING (auth.uid() = user_id);

-- ── 5. Auto-create rows on signup ───────────────────────────
-- When a new user signs up, automatically create their profile
-- and empty training_data row so the app can write to it immediately.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);

  INSERT INTO public.training_data (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 6. Updated_at auto-timestamp ────────────────────────────
-- Keeps updated_at current on every write without client needing to set it.

CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER set_updated_at_subscriptions
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER set_updated_at_training_data
  BEFORE UPDATE ON public.training_data
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
