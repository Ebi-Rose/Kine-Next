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
-- Single JSONB row per user. Mirrors localStorage['kine_v1'].
-- Every field that persist() writes is stored here.
--
-- Fields match src/state/persist.js → persist():
--   state              — goal, exp, equip, days, injuries, cycle, eduFlags, skillPreferences, units
--   week_data          — current week's AI-generated programme
--   progress_db        — sessions[], lifts{}, currentWeek, weekFeedbackHistory, programStartDate, skippedSessions, phaseOffset
--   personal_profile   — name, dob, gender, height, weight, trainingAge, currentLifts
--   session_logs       — in-progress exercise logs (survives refresh)
--   feedback_state     — effort, soreness, timestamps for current session
--   session_time_budgets — per-day duration overrides
--   current_day_idx    — which day is selected
--   current_step       — last navigation step (for resume)
--
-- NOT synced (device-only):
--   devConfig           — dev panel settings
--   IndexedDB photos    — progress photos stay on-device
--   kine_install_dismissed — PWA dismiss timestamp

CREATE TABLE public.training_data (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  state                 JSONB DEFAULT '{}',
  week_data             JSONB,
  progress_db           JSONB DEFAULT '{}',
  personal_profile      JSONB DEFAULT '{}',
  session_logs          JSONB DEFAULT '{}',
  feedback_state        JSONB DEFAULT '{}',
  session_time_budgets  JSONB DEFAULT '{}',
  current_day_idx       INTEGER,
  current_step          TEXT DEFAULT '0',
  updated_at            TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

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
